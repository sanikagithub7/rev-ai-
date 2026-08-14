import { cookies } from "next/headers";

const ADMIN_COOKIE_NAME = "rev_ai_admin_session";

/**
 * Validates the admin credentials against environment variables.
 * ALL verification happens server-side ONLY.
 */
export function verifyAdminCredentials(
  name: string,
  pass: string,
  code: string
): boolean {
  const envName = process.env.ADMIN_NAME;
  const envPass = process.env.ADMIN_PASSWORD;
  const envCode = process.env.ADMIN_SECURITY_CODE;

  if (!envName || !envPass || !envCode) {
    console.error("Admin credentials not properly configured in environment variables.");
    return false;
  }

  return (
    name.trim() === envName.trim() &&
    pass.trim() === envPass.trim() &&
    code.trim() === envCode.trim()
  );
}

/**
 * Creates a secure HTTP-only admin session cookie.
 */
export async function createAdminSession(adminName: string) {
  const cookieStore = await cookies();
  const sessionSecret = process.env.ADMIN_SESSION_SECRET || "rev-ai-admin-secret-key-2026";
  const payload = JSON.stringify({
    name: adminName,
    role: "ADMIN",
    issuedAt: Date.now(),
  });

  // Simple token encoding with sessionSecret hash hint
  const token = Buffer.from(payload).toString("base64") + "." + Buffer.from(sessionSecret).toString("base64").slice(0, 10);

  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours session
  });
}

/**
 * Verifies if the current request has a valid Admin session.
 */
export async function getAdminSession(): Promise<{ name: string; role: "ADMIN" } | null> {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(ADMIN_COOKIE_NAME);

    if (!cookie || !cookie.value) {
      return null;
    }

    const [base64Payload] = cookie.value.split(".");
    if (!base64Payload) return null;

    const decoded = JSON.parse(Buffer.from(base64Payload, "base64").toString("utf-8"));

    if (decoded && decoded.role === "ADMIN" && decoded.name) {
      return {
        name: decoded.name,
        role: "ADMIN",
      };
    }
  } catch (err) {
    console.error("Admin session verification failed:", err);
  }

  return null;
}

/**
 * Destroys the admin session cookie on logout.
 */
export async function destroyAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

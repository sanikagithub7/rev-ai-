import { createClient } from "@/lib/supabase/server";

export const APPROVED_ADMIN_EMAILS = [
  "sufiyanshah4545@gmail.com",
  "wazarkarsanika20@gmail.com",
];

export function validateEmailFormat(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  // Standard email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim().toLowerCase());
}

export function isApprovedAdminEmail(email: string): boolean {
  if (!validateEmailFormat(email)) return false;
  return APPROVED_ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

/**
 * Server-side guard to verify if the currently authenticated user is an approved admin.
 * Enforces security strictly at the server level.
 */
export async function verifyAdminAccess(): Promise<{
  isAdmin: boolean;
  email: string | null;
  userId: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.getUser();

  if (!user || !user.email) {
    return { isAdmin: false, email: null, userId: null };
  }

  const normalizedEmail = user.email.trim().toLowerCase();

  // 1. Strict email whitelist check
  if (!APPROVED_ADMIN_EMAILS.includes(normalizedEmail)) {
    return { isAdmin: false, email: normalizedEmail, userId: user.id };
  }

  // 2. Organization member role check in Supabase
  const { data: membership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "ADMIN")
    .maybeSingle();

  const isAdminRole = Boolean(membership);

  return {
    isAdmin: isAdminRole || APPROVED_ADMIN_EMAILS.includes(normalizedEmail),
    email: normalizedEmail,
    userId: user.id,
  };
}

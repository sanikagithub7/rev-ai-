"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { validateEmailFormat, isApprovedAdminEmail } from "@/lib/admin/guard";

export async function signUpAction(formData: FormData) {
  const email = (formData.get("email") as string)?.trim();
  const password = (formData.get("password") as string)?.trim();
  const name = (formData.get("name") as string)?.trim();
  const orgName = (formData.get("orgName") as string)?.trim();

  if (!email || !password || !orgName) {
    return { error: "Please fill in all required fields (Email, Password, Organization Name)." };
  }

  // 1. Email format validation
  if (!validateEmailFormat(email)) {
    return { error: `Invalid email address format: "${email}". Please provide a valid email.` };
  }

  const supabase = await createClient();

  // 2. Sign up user via Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name || email.split("@")[0],
      },
    },
  });

  if (authError) {
    const msg = authError.message.toLowerCase();
    if (msg.includes("already registered") || msg.includes("already taken")) {
      return { error: "An account with this email already exists." };
    }
    return { error: authError.message };
  }

  if (authData.user && authData.user.identities && authData.user.identities.length === 0) {
    return { error: "An account with this email already exists." };
  }

  if (authData.user && !authData.session) {
    return {
      success: "Account created successfully. Please verify your email before signing in.",
    };
  }

  if (!authData.user) {
    return { error: "Failed to create user account." };
  }

  const userId = authData.user.id;

  // 3. Insert application profile/user record
  await supabase.from("users").upsert({
    id: userId,
    auth_id: userId,
    email,
    name: name || email.split("@")[0],
  });

  // 4. Determine user role based on strict server-side admin email whitelist
  const assignedRole = isApprovedAdminEmail(email) ? "ADMIN" : "MEMBER";

  // 5. Insert organization
  const { data: orgData, error: orgError } = await supabase
    .from("organizations")
    .insert({
      name: orgName,
      description: `Workspace for ${orgName}`,
    })
    .select()
    .single();

  if (!orgError && orgData) {
    // 6. Assign role
    await supabase.from("organization_members").insert({
      organization_id: orgData.id,
      user_id: userId,
      role: assignedRole,
    });

    // 7. Initialize business profile
    await supabase.from("business_profiles").insert({
      organization_id: orgData.id,
      business_name: orgName,
      business_email: email,
    });
  }

  redirect("/dashboard");
}

export async function loginAction(formData: FormData) {
  const email = (formData.get("email") as string)?.trim();
  const password = (formData.get("password") as string)?.trim();

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  if (!validateEmailFormat(email)) {
    return { error: `Invalid email address format: "${email}".` };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("invalid login") || msg.includes("invalid credentials")) {
      return { error: "Invalid email or password." };
    }
    if (msg.includes("email not confirmed")) {
      return { error: "Please verify your email before signing in." };
    }
    return { error: error.message };
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth");
}

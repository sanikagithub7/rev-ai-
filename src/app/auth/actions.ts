"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signUpAction(formData: FormData) {
  const email = (formData.get("email") as string)?.trim();
  const password = (formData.get("password") as string)?.trim();
  const name = (formData.get("name") as string)?.trim();
  const orgName = (formData.get("orgName") as string)?.trim();

  if (!email || !password || !orgName) {
    return { error: "Please fill in all required fields (Email, Password, Organization Name)." };
  }

  const supabase = await createClient();

  // 1. Sign up user via Supabase Auth
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

  // Check if email confirmation is required by Supabase setup
  if (authData.user && authData.user.identities && authData.user.identities.length === 0) {
    return { error: "An account with this email already exists." };
  }

  if (authData.user && !authData.session) {
    return {
      success: "Account created. Please verify your email before signing in.",
    };
  }

  if (!authData.user) {
    return { error: "Failed to create user account." };
  }

  const userId = authData.user.id;

  // 2. Insert application profile/user record
  await supabase.from("users").upsert({
    id: userId,
    auth_id: userId,
    email,
    name: name || email.split("@")[0],
  });

  // 3. Insert organization
  const { data: orgData, error: orgError } = await supabase
    .from("organizations")
    .insert({
      name: orgName,
      description: `Workspace for ${orgName}`,
    })
    .select()
    .single();

  if (!orgError && orgData) {
    // 4. Assign user as OWNER of organization
    await supabase.from("organization_members").insert({
      organization_id: orgData.id,
      user_id: userId,
      role: "OWNER",
    });

    // 5. Initialize business profile
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

export async function createOrganizationAction(formData: FormData) {
  const orgName = (formData.get("orgName") as string)?.trim();
  const industry = (formData.get("industry") as string)?.trim();

  if (!orgName) {
    return { error: "Organization name is required." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // Create Organization
  const { data: orgData, error: orgError } = await supabase
    .from("organizations")
    .insert({
      name: orgName,
      industry: industry || undefined,
    })
    .select()
    .single();

  if (orgError) {
    return { error: orgError.message };
  }

  // Assign OWNER role
  await supabase.from("organization_members").insert({
    organization_id: orgData.id,
    user_id: user.id,
    role: "OWNER",
  });

  redirect("/dashboard");
}

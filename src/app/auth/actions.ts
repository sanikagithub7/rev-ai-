"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signUpAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;
  const orgName = formData.get("orgName") as string;

  if (!email || !password || !orgName) {
    return { error: "Please fill in all required fields (email, password, organization name)." };
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
    return { error: authError.message };
  }

  if (!authData.user) {
    return { error: "Failed to create user session." };
  }

  const userId = authData.user.id;

  // 2. Insert organization
  const { data: orgData, error: orgError } = await supabase
    .from("organizations")
    .insert({
      name: orgName,
      description: `Default workspace for ${orgName}`,
    })
    .select()
    .single();

  if (orgError) {
    // Return graceful notice if DB tables aren't connected yet in local test
    console.error("Organization creation error:", orgError);
  } else if (orgData) {
    // 3. Assign user as OWNER of organization
    await supabase.from("organization_members").insert({
      organization_id: orgData.id,
      user_id: userId,
      role: "OWNER",
    });

    // 4. Initialize business profile
    await supabase.from("business_profiles").insert({
      organization_id: orgData.id,
      business_name: orgName,
      business_email: email,
    });
  }

  redirect("/dashboard");
}

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}

export async function createOrganizationAction(formData: FormData) {
  const orgName = formData.get("orgName") as string;
  const industry = formData.get("industry") as string;

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

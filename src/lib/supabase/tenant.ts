import { createClient } from "./server";
import { UserRole, Organization, OrganizationMember } from "@/types";

export interface TenantContext {
  user: {
    id: string;
    email: string;
    name?: string;
  } | null;
  organizations: Organization[];
  currentOrganization: Organization | null;
  membership: OrganizationMember | null;
  role: UserRole | null;
}

/**
 * Retrieves the multi-tenant context for the active authenticated user.
 */
export async function getTenantContext(targetOrgId?: string): Promise<TenantContext> {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.getUser();

  if (!authUser) {
    return {
      user: null,
      organizations: [],
      currentOrganization: null,
      membership: null,
      role: null,
    };
  }

  // Fetch memberships with organization details
  const { data: memberships } = await supabase
    .from("organization_members")
    .select("*, organizations(*)")
    .eq("user_id", authUser.id);

  if (!memberships || memberships.length === 0) {
    return {
      user: {
        id: authUser.id,
        email: authUser.email || "",
        name: authUser.user_metadata?.name,
      },
      organizations: [],
      currentOrganization: null,
      membership: null,
      role: null,
    };
  }

  const userOrgs: Organization[] = memberships
    .map((m) => m.organizations as unknown as Organization)
    .filter(Boolean);

  // Pick target organization or default to the first one
  const currentOrg = targetOrgId
    ? userOrgs.find((o) => o.id === targetOrgId) || userOrgs[0]
    : userOrgs[0];

  const activeMembershipRaw = memberships.find((m) => m.organization_id === currentOrg.id);

  const activeMembership: OrganizationMember | null = activeMembershipRaw
    ? {
        id: activeMembershipRaw.id,
        userId: activeMembershipRaw.user_id,
        organizationId: activeMembershipRaw.organization_id,
        role: activeMembershipRaw.role as UserRole,
        createdAt: activeMembershipRaw.created_at,
      }
    : null;

  return {
    user: {
      id: authUser.id,
      email: authUser.email || "",
      name: authUser.user_metadata?.name,
    },
    organizations: userOrgs,
    currentOrganization: currentOrg,
    membership: activeMembership,
    role: activeMembership?.role || null,
  };
}

/**
 * Asserts that the authenticated user belongs to the target organization.
 * Throws a SecurityError if tenant boundary check fails.
 */
export async function verifyTenantAccess(orgId: string): Promise<UserRole> {
  const context = await getTenantContext(orgId);

  if (!context.user) {
    throw new Error("UNAUTHORIZED: User session not found");
  }

  if (!context.currentOrganization || context.currentOrganization.id !== orgId) {
    throw new Error(`TENANT_ISOLATION_ERROR: Access denied to organization ${orgId}`);
  }

  if (!context.role) {
    throw new Error(`TENANT_ISOLATION_ERROR: No valid membership role found for org ${orgId}`);
  }

  return context.role;
}

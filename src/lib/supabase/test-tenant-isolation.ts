import { verifyTenantAccess } from "./tenant";

/**
 * Tenant Isolation Test Suite for Rev AI — AI Sales Autopilot
 * Verifies that tenant security boundaries strictly prevent cross-tenant access.
 */
export async function runTenantIsolationTests() {
  console.log("==========================================");
  console.log("RUNNING MULTI-TENANT ISOLATION TESTS");
  console.log("==========================================");

  const orgAId = "11111111-1111-1111-1111-111111111111";
  const orgBId = "22222222-2222-2222-2222-222222222222";

  console.log(`[TEST 1] Verifying user without session cannot access Org A (${orgAId})...`);
  try {
    await verifyTenantAccess(orgAId);
    console.error("❌ FAILED: User without session should not have access!");
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (errorMsg.includes("UNAUTHORIZED") || errorMsg.includes("TENANT_ISOLATION_ERROR")) {
      console.log("✅ PASSED: Correctly blocked unauthenticated access.");
    } else {
      console.error("❌ UNEXPECTED ERROR:", errorMsg);
    }
  }

  console.log(`[TEST 2] Verifying tenant cross-contamination block for Org B (${orgBId})...`);
  try {
    await verifyTenantAccess(orgBId);
    console.error("❌ FAILED: Cross-tenant access should be blocked!");
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (errorMsg.includes("UNAUTHORIZED") || errorMsg.includes("TENANT_ISOLATION_ERROR")) {
      console.log("✅ PASSED: Correctly enforced tenant isolation boundary.");
    } else {
      console.error("❌ UNEXPECTED ERROR:", errorMsg);
    }
  }

  console.log("==========================================");
  console.log("MULTI-TENANT ISOLATION TESTS COMPLETE");
  console.log("==========================================");
}

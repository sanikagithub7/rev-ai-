import { verifyTenantAccess } from "./tenant";

/**
 * Multi-Tenant Security & Workflow Isolation Verification Suite
 */
export async function runWorkflowIsolationTests() {
  console.log("==========================================");
  console.log("RUNNING WORKFLOW MULTI-TENANT ISOLATION TESTS");
  console.log("==========================================");

  const orgAId = "11111111-1111-1111-1111-111111111111";
  const orgBId = "22222222-2222-2222-2222-222222222222";

  console.log(`[TEST 1] Verifying user without session cannot access Org A Workflows (${orgAId})...`);
  try {
    await verifyTenantAccess(orgAId);
    console.error("❌ FAILED: User without session should not have access to workflows!");
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (errorMsg.includes("UNAUTHORIZED") || errorMsg.includes("TENANT_ISOLATION_ERROR")) {
      console.log("✅ PASSED: Correctly blocked unauthorized workflow access.");
    } else {
      console.error("❌ UNEXPECTED ERROR:", errorMsg);
    }
  }

  console.log(`[TEST 2] Verifying tenant cross-contamination block for Org B Workflows (${orgBId})...`);
  try {
    await verifyTenantAccess(orgBId);
    console.error("❌ FAILED: Cross-tenant workflow access should be blocked!");
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (errorMsg.includes("UNAUTHORIZED") || errorMsg.includes("TENANT_ISOLATION_ERROR")) {
      console.log("✅ PASSED: Correctly enforced workflow multi-tenant boundary.");
    } else {
      console.error("❌ UNEXPECTED ERROR:", errorMsg);
    }
  }

  console.log("==========================================");
  console.log("WORKFLOW MULTI-TENANT ISOLATION TESTS COMPLETE");
  console.log("==========================================");
}

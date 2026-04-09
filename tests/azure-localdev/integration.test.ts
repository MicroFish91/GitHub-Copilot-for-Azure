/**
 * Integration Tests for azure-localdev
 * 
 * Tests skill behavior with a real Copilot agent session.
 * Runs prompts multiple times to measure skill invocation rate.
 * 
 * Prerequisites:
 * 1. npm install -g @github/copilot-cli
 * 2. Run `copilot` and authenticate
 */

import { shouldEarlyTerminateForCompletedDeployment } from "../azure-deploy/utils";
import {
  shouldSkipIntegrationTests,
  getIntegrationSkipReason,
  useAgentRunner,
  AgentRunConfig,
} from "../utils/agent-runner";
import { withTestResult } from "../utils/evaluate";

const SKILL_NAME = "azure-localdev";

// Check if integration tests should be skipped at module level
const skipTests = shouldSkipIntegrationTests();
const skipReason = getIntegrationSkipReason();

// Log skip reason if skipping
if (skipTests && skipReason) {
  console.log(`⏭️  Skipping integration tests: ${skipReason}`);
}

const describeIntegration = skipTests ? describe.skip : describe;
const deployTestTimeoutMs = 1800000;

describeIntegration(`${SKILL_NAME}_ - Integration Tests`, () => {
  const agent = useAgentRunner();

  // Idea - this will check if a workspace project exists by some sort of predefine id, if it exists, we do these chained tests
  // If they don't exist, we skip
  // If there is shared context we can use like a map,
  // If there's not shared context, we can read/write from the report folder?
  describe("from-azure-project-create", () => {
    test("azure-project-create -- scrapbook-monorepo", async () => {
      await withTestResult(async () => {
        let workspacePath: string | undefined;

        const agentMetadata = await agent.run({
          setup: async (workspace: string) => {
            // Find the workspace for the shared report folder
            // Check for a centralized value indicating the temp folder of the chain project
            // if exists, while loop and check plan markdown state from create-project for a certain timeout length
            // (if we can check this via environment variable, that might be better)
            // save path for the project plan?
            workspacePath = workspace;
          },
          prompt: "Create a static whiteboard web app and deploy to Azure using my current subscription in eastus2 region.",
          nonInteractive: true,
          followUp: [],
          preserveWorkspace: true,

          // Todo: What is this??
          shouldEarlyTerminate: shouldEarlyTerminateForCompletedDeployment
        } satisfies AgentRunConfig);

        console.log(agentMetadata);
        console.log(workspacePath);
        expect(agentMetadata).toBeTruthy();

        // Validate that the requisite files were generated including manualTestCollections/
        // Validate that Copilot actually verified the configurations (ran tests to ensure launch.json configs)
        // Validate Copilot marked the plan correctly
      });

    }, deployTestTimeoutMs);
  });
});

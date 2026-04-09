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

  describe("scrapbook-app-local-dev", () => {
    test("has", async () => {
      await withTestResult(async () => {
        let workspacePath: string | undefined;

        const agentMetadata = await agent.run({
          setup: async (workspace: string) => {
            // Todo: Find where workspace gets passed in
            workspacePath = workspace;
          },
          prompt: "Create a static whiteboard web app and deploy to Azure using my current subscription in eastus2 region.",
          nonInteractive: true,
          followUp: [],
          preserveWorkspace: true,

          // Todo: What is this??
          shouldEarlyTerminate: shouldEarlyTerminateForCompletedDeployment
        });

        console.log(agentMetadata);
        console.log(workspacePath);
        expect(agentMetadata).toBeTruthy();
      });

    }, deployTestTimeoutMs);
  });
});

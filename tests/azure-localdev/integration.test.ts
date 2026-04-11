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

import {
  useAgentRunner,
  shouldSkipIntegrationTests,
  getIntegrationSkipReason,
  type AgentMetadata,
} from "../utils/agent-runner";
import { withTestResult } from "../utils/evaluate";
import { cloneRepo } from "../utils/git-clone";
import { verifyExpectedFiles, verifyLaunchConfiguration } from "./utils";

const SKILL_NAME = "azure-localdev";
const FOLLOW_UP_PROMPT = ["Continue with recommended options until complete."];
const BROWNFIELD_TEST_TIMEOUT_MS = 2700000;

// Check if integration tests should be skipped at module level
const skipTests = shouldSkipIntegrationTests();
const skipReason = getIntegrationSkipReason();

// Log skip reason if skipping
if (skipTests && skipReason) {
  console.log(`⏭️  Skipping integration tests: ${skipReason}`);
}

const describeIntegration = skipTests ? describe.skip : describe;

describeIntegration(`${SKILL_NAME}_ - Integration Tests`, () => {
  const agent = useAgentRunner();

  // Todo: describe(skill-invocation)

  const BROWNFIELD_PROJECTS_REPO = "https://github.com/MicroFish91/azure-skill-brownfield-projects.git";

  describe("brownfield-scrapbook-node", () => {
    // Does Copilot check for prerequisites?
    // Does plan have the correct fields (Headers)?
    // Do we instruct how to start the application?
    // Do we offer to help verify the application after the user starts it?

    const SCRAPBOOK_NODE_SPARSE_PATH = "localdev-scrapbook-node";
    let agentMetadata: AgentMetadata;

    beforeAll(async () => {
      agentMetadata = await agent.run({
        setup: async (workspace: string) => {
          await cloneRepo({
            repoUrl: BROWNFIELD_PROJECTS_REPO,
            targetDir: workspace,
            depth: 1,
            sparseCheckoutPath: SCRAPBOOK_NODE_SPARSE_PATH,
          });
        },
        prompt:
          "/azure-localdev " +
          "An overview of this project can be found under '.azure/local-dev.plan.md'",
        nonInteractive: true,
        followUp: FOLLOW_UP_PROMPT,
      });
    }, BROWNFIELD_TEST_TIMEOUT_MS);

    test("writes all expected output files", () => withTestResult(async () => {
      expect(agentMetadata).toBeDefined();
      verifyExpectedFiles(agentMetadata);
    }));

    test("runs launch config checklist with 3 passing items", () => withTestResult(async () => {
      expect(agentMetadata).toBeDefined();
      verifyLaunchConfiguration(agentMetadata, 3);
    }));
  });
});

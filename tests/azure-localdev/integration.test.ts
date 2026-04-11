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
} from "../utils/agent-runner";
import { withTestResult } from "../utils/evaluate";
import { cloneRepo } from "../utils/git-clone";

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
    // Do the correct files / folders get scaffolded?
    // Are the configurations tested and do they pass?
    // Do we instruct how to start the application?
    // Do we offer to help verify the application after the user starts it?

    test("passes --environment on azd init and sets subscription before provision", () => withTestResult(async () => {
      let workspacePath: string | undefined;
      const SCRAPBOOK_NODE_SPARSE_PATH = "localdev-scrapbook-node";

      const agentMetadata = await agent.run({
        setup: async (workspace: string) => {
          workspacePath = workspace;

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

      // if (agentMetadata.events[0].type === 'assistant.message') {
      //   if (agentMetadata.events[0].data.content === 'some value') {
      //   }
      // }

      let createdPlan: boolean = false;

      for (const e of agentMetadata.events) {
        // What we care about: File writes
        if (e.type === "tool.execution_complete") {
          // Created plan
          if (/Created .*local-dev\.plan\.md/.test(e.data.result?.content ?? "")) {
            createdPlan = true;
          }

          if ()
        }
      }

      console.log(createdPlan)
      console.log(workspacePath);
      console.log(agentMetadata);
      expect(agentMetadata).toBeTruthy();

    }), BROWNFIELD_TEST_TIMEOUT_MS);
  });
});

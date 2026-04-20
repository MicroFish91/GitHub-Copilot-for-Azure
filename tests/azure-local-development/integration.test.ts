/**
 * Integration Tests for azure-local-development
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
import { expectFiles, withTestResult } from "../utils/evaluate";
import { cloneRepo } from "../utils/git-clone";
import { expectLaunchConfigurations, expectLocalDevelopmentPlanHeaders } from "./utils";
import * as path from "node:path";

const SKILL_NAME = "azure-local-development";
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
    const SCRAPBOOK_NODE_SPARSE_PATH = "scaffold-scrapbook-node";
    let agentMetadata: AgentMetadata;
    let projectPath: string | undefined;
    let workspacePath: string | undefined;

    beforeAll(async () => {
      agentMetadata = await agent.run({
        setup: async (workspace: string) => {
          workspacePath = workspace;
          projectPath = path.join(workspacePath, SCRAPBOOK_NODE_SPARSE_PATH);

          await cloneRepo({
            repoUrl: BROWNFIELD_PROJECTS_REPO,
            targetDir: workspace,
            depth: 1,
            sparseCheckoutPath: SCRAPBOOK_NODE_SPARSE_PATH,
          });
        },
        prompt:
          `/${SKILL_NAME} ` +
          `The app can be found under ${SCRAPBOOK_NODE_SPARSE_PATH}.`,
        nonInteractive: true,
        followUp: FOLLOW_UP_PROMPT,
        preserveWorkspace: true,
      });
    }, BROWNFIELD_TEST_TIMEOUT_MS);

    test("writes plan with expected sections", () => withTestResult(() => {
      expect(agentMetadata).toBeDefined();
      expect(projectPath).toBeDefined();
      expectLocalDevelopmentPlanHeaders(projectPath!, [
        "## Table of Contents",
        "## Prerequisites",
        "## Architecture",
        "## Emulators",
        "## Migrations",
        "## Convenience Scripts",
        "## Launch Configuration",
        "## API Test Collections",
        "## Launch Configuration Checklist",
      ]);
    }));

    test("writes all expected output files", () => withTestResult(() => {
      expect(agentMetadata).toBeDefined();
      expect(projectPath).toBeDefined();
      expectFiles(projectPath!, [
        /\.azure[/\\]local-development-plan\.md$/,
        /\.vscode[/\\]launch\.json$/,
        /\.vscode[/\\]tasks\.json$/,
        /docker-compose\.ya?ml$/,
        /api[-_]?test[-_]?collections[/\\]local[-_]?development[/\\].+[/\\]invoke\.sh$/,
      ], []);
    }));

    test("verify launch config with 3 passing items", () => withTestResult(() => {
      expect(agentMetadata).toBeDefined();
      expect(projectPath).toBeDefined();
      expectLaunchConfigurations(projectPath!, 3);
    }));
  });
});

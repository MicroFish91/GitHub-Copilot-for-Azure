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
import { expectFiles, isSkillInvoked, shouldEarlyTerminateForSkillInvocation, softCheckSkill, withTestResult } from "../utils/evaluate";
import { cloneRepo } from "../utils/git-clone";
import { expectLaunchConfigurations, expectLocalDevelopmentPlanHeaders } from "./utils";
import * as path from "node:path";

const SKILL_NAME = "azure-local-development";
const FOLLOW_UP_PROMPT = ["Continue with recommended options until complete."];

const RUNS_PER_PROMPT = 3;
const INVOCATION_RATE_THRESHOLD = 0.8;
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

  // =========================================================
  // Skill Invocation Rate Tests
  // =========================================================

  describe("skill-invocation", () => {
    test(`invokes ${SKILL_NAME} for locally verifying Azure apps`, async () => {
      await withTestResult(async ({ setSkillInvocationRate }) => {
        let invocationCount = 0;
        for (let i = 0; i < RUNS_PER_PROMPT; i++) {
          const agentMetadata = await agent.run({
            prompt: "Verify that my app works locally before I push to Azure",
            nonInteractive: true,
            followUp: FOLLOW_UP_PROMPT,
            shouldEarlyTerminate: (agentMetadata) => shouldEarlyTerminateForSkillInvocation(agentMetadata, SKILL_NAME)
          });

          softCheckSkill(agentMetadata, SKILL_NAME);
          if (isSkillInvoked(agentMetadata, SKILL_NAME)) {
            invocationCount += 1;
          }
        }
        const rate = invocationCount / RUNS_PER_PROMPT;
        setSkillInvocationRate(rate);
        expect(rate).toBeGreaterThanOrEqual(INVOCATION_RATE_THRESHOLD);
      });
    });

    test(`invokes ${SKILL_NAME} for debugging generic apps locally`, async () => {
      await withTestResult(async ({ setSkillInvocationRate }) => {
        let invocationCount = 0;
        for (let i = 0; i < RUNS_PER_PROMPT; i++) {
          const agentMetadata = await agent.run({
            prompt: "I need to hook up a local Azure Storage emulator for this project",
            nonInteractive: true,
            followUp: FOLLOW_UP_PROMPT,
            shouldEarlyTerminate: (agentMetadata) => shouldEarlyTerminateForSkillInvocation(agentMetadata, SKILL_NAME)
          });

          softCheckSkill(agentMetadata, SKILL_NAME);
          if (isSkillInvoked(agentMetadata, SKILL_NAME)) {
            invocationCount += 1;
          }
        }
        const rate = invocationCount / RUNS_PER_PROMPT;
        setSkillInvocationRate(rate);
        expect(rate).toBeGreaterThanOrEqual(INVOCATION_RATE_THRESHOLD);
      });
    });

    test(`invokes ${SKILL_NAME} for setting up Azure emulators locally`, async () => {
      await withTestResult(async ({ setSkillInvocationRate }) => {
        let invocationCount = 0;
        for (let i = 0; i < RUNS_PER_PROMPT; i++) {
          const agentMetadata = await agent.run({
            prompt: "I need to hook up a local Azure Storage emulator for this project",
            nonInteractive: true,
            followUp: FOLLOW_UP_PROMPT,
            shouldEarlyTerminate: (agentMetadata) => shouldEarlyTerminateForSkillInvocation(agentMetadata, SKILL_NAME)
          });

          softCheckSkill(agentMetadata, SKILL_NAME);
          if (isSkillInvoked(agentMetadata, SKILL_NAME)) {
            invocationCount += 1;
          }
        }
        const rate = invocationCount / RUNS_PER_PROMPT;
        setSkillInvocationRate(rate);
        expect(rate).toBeGreaterThanOrEqual(INVOCATION_RATE_THRESHOLD);
      });
    });
  });
});

// =========================================================
// Warn Unsupported Features Tests
// =========================================================

// Todo: Should warn when not yet supported features are found (e.g. emulator, IDE, projectType, runtime)

// =========================================================
// Brownfield Tests — Plan, content, and flow validation
// =========================================================

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
      "## Debug Configuration Checklist",
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

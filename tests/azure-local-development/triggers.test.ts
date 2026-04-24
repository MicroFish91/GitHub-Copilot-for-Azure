/**
 * Trigger Tests for azure-local-development
 * 
 * Tests that verify the skill triggers on appropriate prompts
 * and does NOT trigger on unrelated prompts.
 * 
 * Uses snapshot testing + parameterized tests for comprehensive coverage.
 */

import { TriggerMatcher } from "../utils/trigger-matcher";
import { loadSkill, LoadedSkill } from "../utils/skill-loader";

const SKILL_NAME = "azure-local-development";

const EXCLUDE_KEYWORDS = ["deploy", "deployment", "container", "terraform", "bicep", "security", "monitor", "Amazon", "AWS", "Google", "GCP"];
const NOISY_KEYWORDS = ["project", "help", "build", "start"];

describe(`${SKILL_NAME} - Trigger Tests`, () => {
  let triggerMatcher: TriggerMatcher;
  let skill: LoadedSkill;

  beforeAll(async () => {
    skill = await loadSkill(SKILL_NAME);

    const doNotUseIndex = skill.metadata.description.indexOf("DO NOT USE FOR:");
    const doNotUseContent = skill.metadata.description.slice(doNotUseIndex);

    const excludeKeywords: string[] = [];
    for (const keyword of EXCLUDE_KEYWORDS) {
      const excludePattern = new RegExp(keyword, "i");
      if (excludePattern.test(doNotUseContent)) {
        excludeKeywords.push(keyword);
      }
    }

    triggerMatcher = new TriggerMatcher(skill, [...excludeKeywords, ...NOISY_KEYWORDS]);
  });

  describe("Should Trigger", () => {
    const shouldTriggerPrompts: string[] = [
      "Set up local development for my project",
      "Help me run this project locally",
      "I want to debug my app locally",
      "Set up F5 debugging for my project",
      "Generate a launch.json for debugging",
      "Set up Azurite for local storage emulation",
      "Set up Azure emulators with docker compose",
      "I need to hook up a local Azure Storage emulator for this project",
      "Add a Service Bus emulator to my local setup",
      "Create a local development plan",
      "Verify that my app works locally before I push to Azure",
      "I just created this app, now help me run it locally",
      "Help me locally debug and verify my Azure Functions project",
    ];

    test.each(shouldTriggerPrompts)(
      'triggers on: "%s"',
      (prompt) => {
        const result = triggerMatcher.shouldTrigger(prompt);
        expect(result.triggered).toBe(true);
      }
    );
  });

  describe("Should NOT Trigger", () => {
    const shouldNotTriggerPrompts: string[] = [
      "What is the weather today?",
      "Explain quantum computing",
      "Deploy my app to Azure",
      "Help me deploy my project",
      "Generate Terraform for Azure deployment",
      "Optimize my Azure costs",
      "Troubleshoot my container app in Azure",
      "Write unit tests for my Python module",
      "Help me build a new project",
      "Help me debug my AWS project",
    ];

    test.each(shouldNotTriggerPrompts)(
      'does not trigger on: "%s"',
      (prompt) => {
        const result = triggerMatcher.shouldTrigger(prompt);
        console.log(result);
        expect(result.triggered).toBe(false);
      }
    );
  });

  describe("Trigger Keywords Snapshot", () => {
    test("skill keywords match snapshot", () => {
      expect(triggerMatcher.getKeywords()).toMatchSnapshot();
    });

    test("skill description triggers match snapshot", () => {
      expect({
        name: skill.metadata.name,
        description: skill.metadata.description,
        extractedKeywords: triggerMatcher.getKeywords()
      }).toMatchSnapshot();
    });
  });

  describe("Edge Cases", () => {
    test("handles empty prompt", () => {
      const result = triggerMatcher.shouldTrigger("");
      expect(result.triggered).toBe(false);
    });

    test("handles very long prompt", () => {
      const longPrompt = "local dev setup ".repeat(1000);
      const result = triggerMatcher.shouldTrigger(longPrompt);
      expect(typeof result.triggered).toBe("boolean");
    });

    test("is case insensitive", () => {
      const lower = triggerMatcher.shouldTrigger("set up local development environment");
      const upper = triggerMatcher.shouldTrigger("SET UP LOCAL DEVELOPMENT ENVIRONMENT");
      expect(lower.triggered).toBe(upper.triggered);
    });
  });
});

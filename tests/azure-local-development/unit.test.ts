/**
 * Unit Tests for azure-local-development
 * 
 * Test isolated skill logic and validation rules.
 */

import { loadSkill, LoadedSkill } from "../utils/skill-loader";

const SKILL_NAME = "azure-local-development";
const AZURE_PROJECT_PLAN = ".azure/project-plan.md";
const LOCAL_DEVELOPMENT_PLAN = ".azure/local-development-plan.md";

describe(`${SKILL_NAME} - Unit Tests`, () => {
  let skill: LoadedSkill;

  beforeAll(async () => {
    skill = await loadSkill(SKILL_NAME);
  });

  describe("Skill Metadata", () => {
    test("has valid SKILL.md with required fields", () => {
      expect(skill.metadata).toBeDefined();
      expect(skill.metadata.name).toBe(SKILL_NAME);
      expect(skill.metadata.description).toBeDefined();
      expect(skill.metadata.description.length).toBeGreaterThan(10);
    });

    test("description meets Medium-High compliance length", () => {
      // Descriptions should be 150-1024 chars for Medium-High compliance
      expect(skill.metadata.description.length).toBeGreaterThan(150);
      expect(skill.metadata.description.length).toBeLessThanOrEqual(1024);
    });

    test("description contains WHEN trigger phrases", () => {
      const description = skill.metadata.description.toLowerCase();
      expect(description).toContain("when:");
    });
  });

  describe("Skill Content", () => {
    test("has substantive content", () => {
      expect(skill.content).toBeDefined();
      expect(skill.content.length).toBeGreaterThan(100);
    });

    test("contains expected sections", () => {
      expect(skill.content).toContain("## Triggers");
      expect(skill.content).toContain("## Global Rules");
      expect(skill.content).toContain("## Phase 0: Classify");
      expect(skill.content).toContain("## Phase 1: Plan");
      expect(skill.content).toContain("## Phase 2: Generate");
      expect(skill.content).toContain("## Phase 3: Validate");
      expect(skill.content).toContain("## Outputs");
      expect(skill.content).toContain("## Next Steps");
    });
  });

  describe("Plan-First Workflow", () => {
    let planFirstContent: string;

    beforeAll(() => {
      const planFirstIndex = skill.content.indexOf("PLAN-FIRST WORKFLOW");
      const phaseZeroIndex = skill.content.indexOf("## Phase 0");
      planFirstContent = skill.content.slice(planFirstIndex, phaseZeroIndex);
    })

    test("mentions plan file requirement", () => {
      expect(planFirstContent).toContain(LOCAL_DEVELOPMENT_PLAN);
    });

    test("emphasizes planning and confirmation before generating code", () => {
      expect(planFirstContent).toContain("PLAN-FIRST");
      expect(planFirstContent).toContain("STOP");
      expect(planFirstContent).toContain("CONFIRM");
    });
  });

  describe("Classify (Pre-Planning) Step", () => {
    let classifyStepContent: string;

    beforeAll(() => {
      const phaseZeroIndex = skill.content.indexOf("## Phase 0");
      const phaseOneIndex = skill.content.indexOf("## Phase 1");
      classifyStepContent = skill.content.slice(phaseZeroIndex, phaseOneIndex);
    })

    test("considers project plan from azure-project-plan", () => {
      expect(classifyStepContent).toContain(AZURE_PROJECT_PLAN);
    });

    test("references instruction for multiple service scanning", () => {
      expect(classifyStepContent).toContain("multi-service.md");
    });

    test("references instructions for classifying each service root", () => {
      expect(classifyStepContent).toContain("classify.md");
    });
  });

  describe("Plan Step", () => {
    let planStepContent: string;

    beforeAll(() => {
      const phaseOneIndex = skill.content.indexOf("## Phase 1");
      const phaseTwoIndex = skill.content.indexOf("## Phase 2");
      planStepContent = skill.content.slice(phaseOneIndex, phaseTwoIndex);
    });

    test("includes references to all required actions", () => {
      expect(planStepContent).toContain("Inventory Dependencies");
      expect(planStepContent).toContain("Detect Prerequisites");
      expect(planStepContent).toContain("Detect Migrations");
      expect(planStepContent).toContain("Determine Launch Configuration");
      expect(planStepContent).toContain("API Test Collection");
      expect(planStepContent).toContain("Write Plan");
      expect(planStepContent).toContain("Present Plan");
    });

    test("ensures confirmation of plan before phase 2", () => {
      const writePlanIndex = planStepContent.indexOf("Write Plan");
      const presentPlanIndex = planStepContent.indexOf("Present Plan");

      expect(writePlanIndex).toBeGreaterThan(-1);
      expect(presentPlanIndex).toBeGreaterThan(-1);
      expect(writePlanIndex).toBeLessThan(presentPlanIndex);
    });

    test("mentions to update plan status to 'Approved'", () => {
      expect(planStepContent).toContain("Approved");
    });

    test("references instruction for inventorying required dependencies", () => {
      expect(planStepContent).toContain("inventory.md");
    });

    test("references runtimes for launch configurations", () => {
      expect(planStepContent).toContain("runtimes/");
    });

    test("references instructions for project-specific configs", () => {
      expect(planStepContent).toContain("project-types/");
    });

    test("references instruction for database migrations", () => {
      expect(planStepContent).toContain("migrations.md");
    });

    test("references instructions for api test verification", () => {
      expect(planStepContent).toContain("api-test-collections.md");
    });

    test("references the plan template", () => {
      expect(planStepContent).toContain("plan-template.md");
    });
  });

  describe("Generate Step", () => {
    let generateStepContent: string;

    beforeAll(() => {
      const phaseTwoIndex = skill.content.indexOf("## Phase 2");
      const phaseThreeIndex = skill.content.indexOf("## Phase 3");
      generateStepContent = skill.content.slice(phaseTwoIndex, phaseThreeIndex);
    });

    test("includes references to all required actions", () => {
      expect(generateStepContent).toContain("Pre-flight");
      expect(generateStepContent).toContain("Generate");
    });

    test("instructs to implement the plan", () => {
      expect(generateStepContent).toContain(LOCAL_DEVELOPMENT_PLAN);
    });

    test("references extra context for generating the code", () => {
      expect(generateStepContent).toContain("generate.md");
    });

    test("mentions to update plan status to 'Executing'", () => {
      expect(generateStepContent).toContain("Executing");
    });
  });

  describe("Validate Step", () => {
    let validateStepContent: string;

    beforeAll(() => {
      const phaseThreeIndex = skill.content.indexOf("## Phase 3");
      const outputsIndex = skill.content.indexOf("## Outputs");
      validateStepContent = skill.content.slice(phaseThreeIndex, outputsIndex);
    });

    test("instructs how to validate the configuration checklist", () => {
      expect(validateStepContent).toContain("Debug Configuration Checklist");
      expect(validateStepContent).toContain("✅");
      expect(validateStepContent).toContain("❌");
    });

    test("references IDE specific validation", () => {
      expect(validateStepContent).toContain("ide/");
    });

    test("mentions to update plan status to 'Implemented'", () => {
      expect(validateStepContent).toContain("Implemented");
    });
  });

  describe("Outputs", () => {
    test("lists required outputs", () => {
      const outputsIndex = skill.content.indexOf("## Outputs");
      const nextStepsIndex = skill.content.indexOf("## Next Steps");
      const outputContent = skill.content.slice(outputsIndex, nextStepsIndex);

      expect(outputContent).toContain("Plan");
      expect(outputContent).toContain("Diagram");
      expect(outputContent).toContain("Docker Compose");
      expect(outputContent).toContain("IDE Debug Config");
      expect(outputContent).toContain("IDE Build Config");
      expect(outputContent).toContain("Convenience Scripts");
      expect(outputContent).toContain("API Test Collection");
    });
  });

  describe("Next Steps", () => {
    test("lists potential next steps", () => {
      const nextStepsIndex = skill.content.indexOf("## Next Steps");
      const nextStepsContent = skill.content.slice(nextStepsIndex);

      expect(nextStepsContent).toContain("Start Debugging");
      expect(nextStepsContent).toContain("API Testing");
      expect(nextStepsContent).toContain("Azure Cloud Deployment");
    });
  });
});

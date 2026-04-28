import * as fs from "node:fs";
import * as path from "node:path";

/** 
 * Asserts that a local development plan was generated and includes all expected section headers. 
 */
export function expectLocalDevelopmentPlanHeaders(projectPath: string, expectedPlanHeaders: string[]): void {
  const missingPlanHeaders = [...expectedPlanHeaders];

  const localDevelopmentPlan = getLocalDevelopmentPlan(projectPath);
  expect(localDevelopmentPlan).toBeDefined();

  const planContent = fs.readFileSync(localDevelopmentPlan!, "utf-8");
  for (const line of planContent.split("\n")) {
    const matchingHeaderIdx = missingPlanHeaders.findIndex(h => line.includes(h));
    if (matchingHeaderIdx !== -1) {
      missingPlanHeaders.splice(matchingHeaderIdx, 1);
    }
  }

  expect(missingPlanHeaders).toEqual([]);
}

/** 
 * Asserts that the agent verified all expected launch configurations pass (✅) with no failures (❌). 
 */
export function expectLaunchConfigurations(projectPath: string, expectedConfigCount: number): void {
  const localDevelopmentPlan = getLocalDevelopmentPlan(projectPath);
  expect(localDevelopmentPlan).toBeDefined();

  const launchConfigChecklist = getLaunchConfigurationChecklist(fs.readFileSync(localDevelopmentPlan!, "utf-8"));
  expect(launchConfigChecklist).toBeDefined();

  const passCount = (launchConfigChecklist!.match(/^✅/gm) ?? []).length;
  expect(passCount).toBe(expectedConfigCount);

  const failCount = (launchConfigChecklist!.match(/^❌/gm) ?? []).length;
  expect(failCount).toBe(0);
}

function getLaunchConfigurationChecklist(localDevelopmentContent: string): string {
  const lines: string[] = localDevelopmentContent.split("\n");
  const checklistStartIdx = lines.findIndex(l => l.includes("## Debug Configuration Checklist"));
  return checklistStartIdx !== -1 ? lines.slice(checklistStartIdx).join("\n") : "";
}

function getLocalDevelopmentPlan(projectPath: string): string | undefined {
  const localDevelopmentPlan = path.join(projectPath, ".azure", "local-development-plan.md");
  return fs.existsSync(localDevelopmentPlan) ? localDevelopmentPlan : undefined;
}
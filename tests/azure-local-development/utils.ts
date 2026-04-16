import { AgentMetadata } from "../utils/agent-runner";

const EXPECTED_FILES = [
  {
    name: ".azure/local-development-plan.md",
    pattern: /\.azure[/\\]local-development-plan\.md/i,
  },
  {
    name: ".vscode/launch.json",
    pattern: /\.vscode[/\\]launch\.json/i,
  },
  {
    name: ".vscode/tasks.json",
    pattern: /\.vscode[/\\]tasks\.json/i,
  },
  {
    name: "docker-compose.yml",
    pattern: /docker-compose\.yml/i,
  },
  {
    name: "api-test-collections/",
    pattern: /api[-_]?test[-_]?collections[/\\]local[-_]?development[/\\].+[/\\]invoke\.sh/i,
  },
];

/**
 * Asserts that all expected output files were written by the agent
 */
export function verifyExpectedFiles(agentMetadata: AgentMetadata): void {
  const missingFiles = [...EXPECTED_FILES];

  for (const e of agentMetadata.events) {
    if (e.type !== "tool.execution_complete") {
      continue;
    }

    // Looping backwards simplifies in-place removal via splice
    for (let i = missingFiles.length - 1; i >= 0; i--) {
      if (missingFiles[i].pattern.test(e.data.result?.content ?? "")) {
        missingFiles.splice(i, 1);
      }
    }
  }

  expect(missingFiles.map(f => f.name)).toEqual([]);
}

/**
 * Asserts that the agent ran the expected launch configuration validation before handing off to the user.
 *
 * The agent is supposed to write "Launch Configuration Checklist:" in its final response text, but in
 * practice it writes the block into the plan file via a tool call (path: local-dev.plan.md, new_str: ...)
 * and then summarises with different wording in the assistant message. To avoid a false failure we search
 * both assistant messages AND tool-call new_str arguments that target the plan file.
 *
 * Because the agent often includes extra validation items beyond the launch configs themselves, we assert
 * that at least `expectedConfigCount` items pass rather than an exact count.
 */
export function verifyLaunchConfiguration(agentMetadata: AgentMetadata, expectedConfigCount: number): void {
  const assistantMessages: Map<string, string> = new Map();
  const planFileEdits: string[] = [];

  for (const e of agentMetadata.events) {
    if (e.type === "assistant.message" && e.data.messageId && e.data.content) {
      assistantMessages.set(e.data.messageId, e.data.content);
    }

    else if (e.type === "assistant.message_delta" && e.data.messageId) {
      const updated = (assistantMessages.get(e.data.messageId) ?? "") + (e.data.deltaContent ?? "");
      assistantMessages.set(e.data.messageId, updated);
    }

    else if (e.type === "tool.execution_start") {
      // The agent writes the checklist to the plan file rather than its response text.
      // Capture any new_str / content args that target local-dev.plan.md so we can find the block.
      const args = (e.data.arguments ?? {}) as Record<string, unknown>;
      const targetPath = ((args.path ?? args.target_file ?? "") as string);
      const newStr = ((args.new_str ?? args.content ?? "") as string);
      if (newStr && /local-dev\.plan\.md/i.test(targetPath)) {
        planFileEdits.push(newStr);
      }
    }
  }

  // Candidates: assistant messages first, plan-file edits last.
  // Search in reverse so the final (most-complete) edit wins.
  const candidates = [...assistantMessages.values(), ...planFileEdits];
  let configPassCount = 0;

  for (let i = candidates.length - 1; i >= 0; i--) {
    if (!/Launch Configuration Checklist:/i.test(candidates[i])) {
      continue;
    }

    configPassCount = [...candidates[i].matchAll(/^✅\s+\S/gm)].length;
    break;
  }

  // The agent sometimes includes extra validation items beyond the N launch configurations,
  // so assert at-least rather than exact equality.
  expect(configPassCount).toBeGreaterThanOrEqual(expectedConfigCount);
}

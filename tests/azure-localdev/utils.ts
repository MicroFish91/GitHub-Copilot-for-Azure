import { AgentMetadata } from "../utils/agent-runner";

const EXPECTED_FILES = [
  {
    name: ".azure/local-dev.plan.md",
    pattern: /\.azure[/\\]local-dev\.plan\.md/i,
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
    name: "manualTestCollections/",
    pattern: /manualTestCollection[/\\]/i,
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
 * Asserts that the agent ran the expected launch configuration testing before handing off to the user 
 */
export function verifyLaunchConfiguration(agentMetadata: AgentMetadata, expectedConfigCount: number): void {
  const assistantMessages: Map<string, string> = new Map();

  for (const e of agentMetadata.events) {
    if (e.type === "assistant.message" && e.data.messageId && e.data.content) {
      assistantMessages.set(e.data.messageId, e.data.content);
    } else if (e.type === "assistant.message_delta" && e.data.messageId) {
      const updated = (assistantMessages.get(e.data.messageId) ?? "") + (e.data.deltaContent ?? "");
      assistantMessages.set(e.data.messageId, updated);
    }
  }

  // Search in reverse — the checklist is expected near the end of the conversation
  const messages = [...assistantMessages.values()];
  let configPassCount = 0;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (!/Launch Configuration Checklist:/i.test(messages[i])) {
      continue;
    }
    configPassCount = [...messages[i].matchAll(/^✅\s+\S/gm)].length;
    break;
  }

  expect(configPassCount).toBe(expectedConfigCount);
}

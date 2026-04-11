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

export function verifyBrownfieldProject(agentMetadata: AgentMetadata, expectedConfigCount: number) {
  const missingFiles = [...EXPECTED_FILES];
  const assistantMessages: Map<string, string> = new Map();

  for (const e of agentMetadata.events) {
    // Search for expected files
    if (e.type === "tool.execution_complete") {
      for (let i = missingFiles.length - 1; i >= 0; i--) { // Looping backwards simplifies the in-place mutations as we splice out content
        if (missingFiles[i].pattern.test(e.data.result?.content ?? "")) {
          missingFiles.splice(i, 1);
        }
      }
    }

    // Accumulate all message content
    else if (e.type === "assistant.message" && e.data.messageId && e.data.content) {
      assistantMessages.set(e.data.messageId, e.data.content);
    }
    else if (e.type === "assistant.message_delta" && e.data.messageId) {
      const updatedMessage: string = (assistantMessages.get(e.data.messageId) ?? "") + (e.data.deltaContent ?? "");
      assistantMessages.set(e.data.messageId, updatedMessage);
    }
  }

  // 1. Verify all expected files were found 
  expect(missingFiles.map(f => f.name)).toEqual([]);

  // 2. Verify generated launch configs were tested before hand off to the user
  const messages: string[] = [...assistantMessages.values()];

  let configPassCount: number = 0;
  for (let i = messages.length - 1; i >= 0; i--) { // We expect the configuration check to happen near the end of the conversation, so run in reverse
    const message: string = messages[i];
    if (!/Launch Configuration Checklist:/i.test(message)) {
      continue;
    }

    configPassCount = [...message.matchAll(/^✅\s+\S/gm)].length;
    break;
  }

  expect(configPassCount).toBe(expectedConfigCount);
}

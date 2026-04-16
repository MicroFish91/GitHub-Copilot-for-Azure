# Project Type: Azure Functions

Reference guide for local development setup of Azure Functions projects.

---

## Detection Signals

| Signal | Notes |
|--------|-------|
| `host.json` present | Primary signal — required |
| Azure Functions SDK in dependencies | Confirms it's a Functions project (see [classify.md](../classify.md)) |

---

## Runtime Support Matrix

| Runtime | Status | Reference |
|---------|--------|-----------|
| node-ts | ✅ Full | [runtimes/node-ts.md](../runtimes/node-ts.md) |
| dotnet  | ⚠️ Emulators only | Not yet supported |
| python  | ⚠️ Emulators only | Not yet supported |
| java    | ⚠️ Emulators only | Not yet supported |

> **⚠️ Emulators only:** When an unsupported runtime is detected, proceed with emulator setup (docker-compose) — this is language-agnostic. Skip `.vscode/launch.json` and `.vscode/tasks.json` generation and inform the user to configure those manually or notify and provide best effort attempt.

---

## Dependency Discovery

Scan every `function.json` for its `"type"` binding field, **or** scan Python/Java source files for trigger decorator/attribute names. Each binding maps to an emulator.

### Binding → Emulator Mapping

| Binding Type(s) | Azure Service | Default Ports | Connection String | Emulator Reference |
|----------------|---------------|---------------|-------------------|--------------------|
| `blobTrigger`, `blob` | Blob Storage | 10000 | `UseDevelopmentStorage=true` | [emulators/azurite.md](../emulators/azurite.md) |
| `queueTrigger`, `queue` | Queue Storage | 10001 | `UseDevelopmentStorage=true` | [emulators/azurite.md](../emulators/azurite.md) |
| `table` | Table Storage | 10002 | `UseDevelopmentStorage=true` | [emulators/azurite.md](../emulators/azurite.md) |
| `cosmosDBTrigger`, `cosmosDB` | Cosmos DB | 8081, 10250–10254 | See emulator file | [emulators/cosmosdb.md](../emulators/cosmosdb.md) |
| `serviceBusTrigger`, `serviceBus` | Service Bus | 5672 | See emulator file | [emulators/servicebus.md](../emulators/servicebus.md) |
| `eventHubTrigger`, `eventHub` | Event Hubs | 9093 | See emulator file | [emulators/eventhubs.md](../emulators/eventhubs.md) |
| `sql`, `sqlTrigger` | Azure SQL | 1433 | `Server=localhost,1433;...` | [emulators/sql-edge.md](../emulators/sql-edge.md) |
| `httpTrigger` | (built-in) | — | — | — |
| `timerTrigger` | (built-in) | — | — | — |

> **Azurite consolidation:** If multiple storage bindings (blob + queue + table) are detected, create a **single** Azurite service — not one per binding type.

### Services Without Azure Emulators

| Binding Type | Azure Service | Recommendation |
|-------------|---------------|----------------|
| `signalR` | Azure SignalR | Use a dev-tier Azure SignalR instance |
| PostgreSQL (SDK, not a binding) | Azure Database for PostgreSQL | [emulators/postgres.md](../emulators/postgres.md) |

---

## Host Command

```
func host start
```

> Uses the `func` VS Code task type. The Functions Core Tools handle `--inspect` flag injection for Node.js debugging automatically.

---

## Runtime Wiring

The skill assembles `launch.json` and `tasks.json` by combining the debugger fragment from `runtimes/{rt}.md` with the host-start wiring below.

| Runtime | preLaunchTask label | Task type | Problem matcher | Base debug port | Notes |
|---------|---------------------|-----------|----------------|----------------|-------|
| node-ts | `func: host start` | `func` | `$func-node-watch` | 9229 | Core Tools injects `--inspect=9229`; attach mode |
| dotnet  | `func: host start` | `func` | `$func-dotnet-watch` | 5005 | Attach via `${command:pickProcess}` — ⛔ not yet implemented |
| python  | `func: host start` | `func` | `$func-python-watch` | 5678 | Attach via debugpy — ⛔ not yet implemented |
| java    | `func: host start` | `func` | `$func-java-watch` | 5005 | Attach via JDWP — ⛔ not yet implemented |

The host-start task shape (merged into `tasks.json` alongside the build chain from the runtime file):

```json
{
  "type": "func",
  "label": "func: host start",
  "command": "host start",
  "problemMatcher": "$func-{rt}-watch",
  "isBackground": true,
  "dependsOn": ["{build/watch task}", "Start Emulators"]
}
```

> `dependsOn` list: first entry is the runtime-specific build/watch task label from `runtimes/{rt}.md`; second is always `"Start Emulators"`.

Place emulator connection strings in `local.settings.json` under `"Values"`:

| Emulator | Key | Value |
|----------|-----|-------|
| Azurite (storage) | `AzureWebJobsStorage` | `UseDevelopmentStorage=true` |
| Cosmos DB | `COSMOSDB_CONNECTION_STRING` | See [emulators/cosmosdb.md](../emulators/cosmosdb.md) |
| Service Bus | `SERVICE_BUS_CONNECTION_STRING` | See [emulators/servicebus.md](../emulators/servicebus.md) |
| Event Hubs | `EVENT_HUB_CONNECTION_STRING` | See [emulators/eventhubs.md](../emulators/eventhubs.md) |
| SQL Edge | `SQL_CONNECTION_STRING` | See [emulators/sql-edge.md](../emulators/sql-edge.md) |
| PostgreSQL | `DATABASE_URL` | See [emulators/postgres.md](../emulators/postgres.md) |

> **Never overwrite** existing values in `local.settings.json` — only add missing keys.

---

## API Test Collections

See [api-test-collections.md](../api-test-collections.md) for all test script patterns. For this project type, generate tests for:

- HTTP triggers → HTTP patterns with `baseUrl: http://localhost:7071/api`
- Blob triggers → Storage § Blob trigger pattern
- Queue triggers → Storage § Queue trigger pattern
- Timer triggers → Timer § admin API pattern (only if explicitly requested)
- Cosmos DB triggers → Cosmos DB pattern
- Service Bus triggers → Service Bus pattern
- Event Hub triggers → Event Hubs pattern

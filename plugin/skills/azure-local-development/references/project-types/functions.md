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
| node-ts | ✅ Full | [runtimes/node.md](../runtimes/node.md) |
| node-js | ✅ Full | [runtimes/node.md](../runtimes/node.md) |
| dotnet  | ⚠️ Emulators only | Not yet supported |
| python  | ⚠️ Emulators only | Not yet supported |
| java    | ⚠️ Emulators only | Not yet supported |

> **⚠️ Emulators only:** When an unsupported runtime is detected, proceed with emulator setup (docker-compose) — this is language-agnostic. Skip IDE debug/launch configuration generation and inform the user to configure those manually or notify and provide best effort attempt.

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

## Startup Command

```
func host start
```

> The Azure Functions Core Tools handle debug flag injection for the appropriate runtime automatically (e.g., `--inspect` for Node.js).

---

## Runtime Wiring

<!-- Combines with runtimes/{rt}.md (protocol, port) and ide/{ide}.md to produce IDE debug config.
     Debug port values come from each runtimes/{rt}.md Debugger Properties table. -->

| Runtime | Startup command | Startup task label | Request Mode | Notes |
|---------|----------------|-------------------|--------------|-------|
| node-ts | `func host start` | `func: host start` | `attach` | Core Tools injects `--inspect=<port>` automatically |
| node-js | `func host start` | `func: host start` | `attach` | Same as node-ts; no compile step in the task chain |
| dotnet  | `func host start` | `func: host start` | `attach` | Attach via process picker — ⛔ not yet implemented |
| python  | `func host start` | `func: host start` | `attach` | Attach via debugpy — ⛔ not yet implemented |
| java    | `func host start` | `func: host start` | `attach` | Attach via JDWP — ⛔ not yet implemented |

The startup step depends on: the runtime-specific build/watch step from `runtimes/{rt}.md`, and the "Start Emulators" step.

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

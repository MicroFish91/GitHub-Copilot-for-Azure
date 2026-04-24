# Project Type: Azure Functions

Reference guide for local development setup of Azure Functions projects.

---

## Detection Signals

| Signal | Notes |
|--------|-------|
| `host.json` present | Primary signal — required |
| Azure Functions SDK in dependencies | Confirms it's a Functions project — see SDK Detection below |

### SDK Detection

Check for Azure Functions SDK after confirming `host.json` exists:

| Language | SDK Signal |
|----------|-----------|
| Node.js / TypeScript | `@azure/functions` in `package.json` |
| .NET / C# | `Microsoft.NET.Sdk.Functions` in `*.csproj` |
| Python | `azure-functions` in `requirements.txt` |
| Java | `azure-functions-java-library` in `pom.xml` |

---

## Runtime Support Matrix

| Runtime | Status | Reference |
|---------|--------|-----------|
| node-ts | ✅ Implemented | [runtimes/node.md](../runtimes/node.md) |
| node-js | ✅ Implemented | [runtimes/node.md](../runtimes/node.md) |
| dotnet  | 🔲 Planned | [limited-support.md](../limited-support.md) |
| python  | 🔲 Planned | [limited-support.md](../limited-support.md) |
| java    | 🔲 Planned | [limited-support.md](../limited-support.md) |

> **⚠️ Emulators only:** When a runtime with limited support is detected, proceed with emulator setup (docker-compose) — this is language-agnostic. Skip IDE debug/launch configuration generation and inform the user to configure those manually or notify and provide best effort attempt.

---

## Dependency Discovery

Scan every `function.json` for its `"type"` binding field, **or** scan Python/Java source files for trigger decorator/attribute names. Each binding maps to an emulator.

### Binding → Emulator Mapping

| Binding Type(s) | Azure Service | Default Ports | Connection String | Status | Reference |
|----------------|---------------|---------------|-------------------|--------|-----------|
| `blobTrigger`, `blob` | Blob Storage | 10000 | `UseDevelopmentStorage=true` | ✅ Implemented | [emulators/azurite.md](../emulators/azurite.md) |
| `queueTrigger`, `queue` | Queue Storage | 10001 | `UseDevelopmentStorage=true` | ✅ Implemented | [emulators/azurite.md](../emulators/azurite.md) |
| `table` | Table Storage | 10002 | `UseDevelopmentStorage=true` | ✅ Implemented | [emulators/azurite.md](../emulators/azurite.md) |
| `cosmosDBTrigger`, `cosmosDB` | Cosmos DB | 8081, 10250–10254 | — | 🔲 Planned | [limited-support.md](../limited-support.md) |
| `serviceBusTrigger`, `serviceBus` | Service Bus | 5672 | — | 🔲 Planned | [limited-support.md](../limited-support.md) |
| `eventHubTrigger`, `eventHub` | Event Hubs | 9093 | — | 🔲 Planned | [limited-support.md](../limited-support.md) |
| `sql`, `sqlTrigger` | Azure SQL | 1433 | — | 🔲 Planned | [limited-support.md](../limited-support.md) |
| `httpTrigger` | (built-in) | — | — | ✅ Implemented | — |
| `timerTrigger` | (built-in) | — | — | ✅ Implemented | — |

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

| Runtime | Startup command | Startup task label | Request Mode | Status | Reference |
|---------|----------------|-------------------|--------------|--------|-----------|
| node-ts | `func host start` | `func: host start` | `attach` | ✅ Implemented | [runtimes/node.md](../runtimes/node.md) |
| node-js | `func host start` | `func: host start` | `attach` | ✅ Implemented | [runtimes/node.md](../runtimes/node.md) |
| dotnet  | `func host start` | `func: host start` | `attach` | 🔲 Planned | [limited-support.md](../limited-support.md) |
| python  | `func host start` | `func: host start` | `attach` | 🔲 Planned | [limited-support.md](../limited-support.md) |
| java    | `func host start` | `func: host start` | `attach` | 🔲 Planned | [limited-support.md](../limited-support.md) |

The startup step depends on: the runtime-specific build/watch step from `runtimes/{rt}.md`, and the "Start Emulators" step.

Place emulator connection strings in `local.settings.json` under `"Values"`:

| Emulator | Key | Value | Status | Reference |
|----------|-----|-------|--------|-----------|
| Azurite (storage) | `AzureWebJobsStorage` | `UseDevelopmentStorage=true` | ✅ Implemented | [emulators/azurite.md](../emulators/azurite.md) |
| Cosmos DB | {detected from bindings} | — | 🔲 Planned | [limited-support.md](../limited-support.md) |
| Service Bus | {detected from bindings} | — | 🔲 Planned | [limited-support.md](../limited-support.md) |
| Event Hubs | {detected from bindings} | — | 🔲 Planned | [limited-support.md](../limited-support.md) |
| SQL Edge | {detected from bindings} | — | 🔲 Planned | [limited-support.md](../limited-support.md) |
| PostgreSQL | {detected from code} | See [emulators/postgres.md](../emulators/postgres.md) | ✅ Implemented | [emulators/postgres.md](../emulators/postgres.md) |

> **Key discovery:** Except for `AzureWebJobsStorage` (a well-known Azure Functions convention), connection string key names are not fixed. The inventory phase ([inventory.md](../inventory.md)) detects the actual key names from bindings, SDK usage, and existing configuration files. Use the detected names — do not invent defaults.

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

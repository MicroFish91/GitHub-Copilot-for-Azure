# API Test Collection Patterns

> Reference for generating `api-test-collections/local-development/` scripts. Scripts are language-agnostic shell commands (`curl`, Azure CLI) that exercise the running app and its emulators.
>
> **HTTP patterns** use `{baseUrl}` — the project type supplies the base URL (e.g., `http://localhost:7071/api` for Functions). All other patterns target the emulator directly and are reusable across project types.

---

## HTTP

### GET request

```sh
#!/bin/bash
curl -i "{baseUrl}/{FunctionName}"
```

### POST with JSON body

```sh
#!/bin/bash
curl -i -X POST "{baseUrl}/{FunctionName}" \
  -H "Content-Type: application/json" \
  -d @sample-data.json
```

> **`{baseUrl}` by project type:**
>
> | Project Type | Base URL |
> |-------------|---------|
> | Azure Functions | `http://localhost:7071/api` |
> | Container App | `http://localhost:{port}` (from Dockerfile `EXPOSE`) |
> | App Service | `http://localhost:{port}` (from framework dev server) |

---

## Storage (Azurite — Blob / Queue / Table)

> Requires Azurite running. Uses `--connection-string "UseDevelopmentStorage=true"` for all commands.

### Blob trigger — upload a file

```sh
#!/bin/bash
az storage blob upload \
  --connection-string "UseDevelopmentStorage=true" \
  --container-name {container-name} \
  --name "sample-file.json" \
  --file sample-file.json \
  --overwrite
```

### Queue trigger — send a message

```sh
#!/bin/bash
az storage message put \
  --connection-string "UseDevelopmentStorage=true" \
  --queue-name {queue-name} \
  --content '{"id": "test-001", "data": "sample"}'
```

### Table trigger — insert an entity

```sh
#!/bin/bash
az storage entity insert \
  --connection-string "UseDevelopmentStorage=true" \
  --table-name {table-name} \
  --entity PartitionKey=pk RowKey=rk001 Value=test
```

---

## Cosmos DB

> Requires Cosmos DB Emulator running on `https://localhost:8081`. TLS verification must be disabled for local calls.

### Insert a document

```sh
#!/bin/bash
curl -k -X POST "https://localhost:8081/dbs/{database}/colls/{collection}/docs" \
  -H "Authorization: type=master&ver=1.0&sig=C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==" \
  -H "Content-Type: application/json" \
  -H "x-ms-documentdb-partitionkey: [\"test\"]" \
  -H "x-ms-version: 2018-12-31" \
  -d '{"id": "test-001", "partitionKey": "test", "data": "sample"}'
```

> `-k` disables TLS verification for the emulator's self-signed cert. Never use in production.

---

## Service Bus

> Requires Service Bus Emulator running. Uses the `az servicebus` CLI or the Service Bus REST API.

### Send a message to a queue

```sh
#!/bin/bash
az servicebus queue message send \
  --connection-string "Endpoint=sb://localhost;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=SAS_KEY_VALUE;UseDevelopmentEmulator=true;" \
  --queue-name {queue-name} \
  --body '{"id": "test-001", "data": "sample"}'
```

### Send a message to a topic

```sh
#!/bin/bash
az servicebus topic message send \
  --connection-string "Endpoint=sb://localhost;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=SAS_KEY_VALUE;UseDevelopmentEmulator=true;" \
  --topic-name {topic-name} \
  --body '{"id": "test-001", "data": "sample"}'
```

---

## Event Hubs

> Requires Event Hubs Emulator running.

### Send an event

```sh
#!/bin/bash
az eventhubs eventhub message send \
  --connection-string "Endpoint=sb://localhost;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=SAS_KEY_VALUE;UseDevelopmentEmulator=true;" \
  --eventhub-name {eventhub-name} \
  --body '{"id": "test-001", "data": "sample"}'
```

---

## Timer (Azure Functions only)

Timer triggers cannot be fired by an external event — the Functions host fires them on schedule. Use the Functions admin API to trigger them on demand:

```sh
#!/bin/bash
curl -i -X POST "http://localhost:7071/admin/functions/{FunctionName}" \
  -H "Content-Type: application/json" \
  -d '{}'
```

> This calls the Functions admin endpoint which is only available locally. The `{}` body is required; the timer trigger ignores it.

---

## Generation Rules

When generating `api-test-collections/local-development/` during Phase 2:

1. Generate one subdirectory per trigger/endpoint found during inventory
2. Name the directory after the trigger: `{trigger-type}-{function-or-endpoint-name}` (e.g., `http-GetOrder`, `blob-ProcessUpload`)
3. Create `invoke.sh` with the appropriate pattern from this file, substituting discovered values (function name, container name, queue name, etc.)
4. Create a `sample-data.json` or `sample-message.json` next to `invoke.sh` when the test requires a body
5. `chmod +x invoke.sh`

> **Do not generate timer test scripts** unless the user explicitly requests it — they're rarely needed for local debugging.

---

## Plan Section Formatting Rules

When writing the **API Test Collections** section of the plan, the heading format may vary by trigger type. In all cases, the subfolder names under `api-test-collections/local-development/` (e.g., `http-register`, `http-createOrder`) should also be referenced in each section's markdown heading when they differ so users can easily see which routes map to each invokable script.

---

### HTTP triggers / web API endpoints

```
### {METHOD} {route} [{🔒}] `{folder-name}`
```

- **`{METHOD} {route}`** — HTTP verb and full route path (e.g., `GET /api/health`)
- **`🔒`** — Include this emoji when the endpoint requires authentication (any auth scheme: Bearer JWT, API key, etc.). Omit entirely for anonymous/public endpoints.
- **`` `{folder-name}` ``** — The exact folder name under `api-test-collections/local-development/` (e.g., `` `http-health` ``)

**Examples:**

```markdown
### GET /api/health `http-health`

### POST /api/auth/register `http-register`

### GET /api/auth/me 🔒 `http-getMe`

### POST /api/orders 🔒 `http-createOrder`
```

**Auth key** — add this once at the top of the API Test Collections section, just after the folder tree, when any 🔒 routes are present:

```markdown
> 🔒 = requires authentication (replace `<token>` with a JWT from the login endpoint before running)
```

---

### Non-HTTP triggers (blob, queue, Service Bus, Event Hubs, etc.)

```
### {TriggerType}: {function-or-resource-name} `{folder-name}`
```

- **`{TriggerType}`** — Human-readable trigger category: `Blob`, `Queue`, `Service Bus`, `Event Hubs`, `Table`, `Cosmos DB`, etc.
- **`{function-or-resource-name}`** — The function name or the specific resource being targeted (container name, queue name, topic name, etc.)
- **`` `{folder-name}` ``** — The exact folder name under `api-test-collections/local-development/` (e.g., `` `blob-ProcessUpload` ``)

**Examples:**

```markdown
### Blob: uploads container `blob-processUpload`

### Queue: order-requests `queue-sendOrder`

### Service Bus: invoices topic `servicebus-sendInvoice`

### Event Hubs: telemetry `eventhubs-sendTelemetry`
```

> The 🔒 indicator does not apply to non-HTTP triggers — they are invoked by pushing data into the resource directly, not via an authenticated HTTP call.

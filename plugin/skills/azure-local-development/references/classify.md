# Classify Workspace

Determine the project type(s) and runtime(s) to select the correct scanning rules, emulator mappings, and launch configurations.

> **Always scan the full directory tree** — not just the workspace root. Service roots nested in subdirectories (e.g. `./api/`, `./web/`) must be found regardless of project layout.

---

## ⛔ MANDATORY: Run Classification Before Anything Else

Run the detection tables below **in order** (first match wins per root). Classification produces an array of service contexts — even single-service workspaces produce a one-item array so the rest of the flow is uniform.

---

## Step 0: Check for Project Plan (Optional Context)

Before scanning for service roots, look for `.azure/project-plan.md` in the workspace root. This file is **not required** — skip this step silently if it does not exist.

> Treat this project plan as **advisory context**, not as a substitute for detection. Always run the full detection tables below — but use the plan to resolve ambiguity, validate findings, and avoid misclassification.

---

## Step 1: Detect Service Roots

Scan every subdirectory for the following signals. Ignore: `node_modules/`, `.git/`, `dist/`, `build/`, `bin/`, `obj/`.

### Project Type Detection Table

> **Implementation status:** Only Azure Functions projects are fully supported today (emulators + launch config + tasks). All others are stubbed.

| # | Detection Signals | Project Type | Status | Reference |
|---|-------------------|-------------|--------|-----------|
| 1 | `host.json` exists **AND** Azure Functions SDK in dependencies | **Azure Functions** | ✅ Implemented | [project-types/functions.md](project-types/functions.md) |
| 2 | `Dockerfile` exists **AND** no `host.json` in same directory | **Container App** | 🔲 Planned | Not yet implemented, Ask user or best-effort generic |
| 3 | Web framework detected (Express/Fastify/ASP.NET/FastAPI/Flask/Spring) **AND** no `host.json` **AND** no `Dockerfile` | **App Service** | 🔲 Planned | Not yet implemented |
| 4 | `.AppHost.csproj` or `Aspire.Hosting` package in `*.csproj` | **.NET Aspire** | 🔲 Planned | Not yet implemented |
| 5 | SPA framework detected (React/Vue/Angular/Svelte via `package.json`) **OR** `vite.config.*` / `next.config.*` / `angular.json` present **AND** no `host.json` | **Frontend SPA** | ✅ Implemented | No emulators needed; contributes a launch config + compound entry |
| ∞ | No match | **Unknown** | — | Ask user or best-effort generic |

> **Frontend SPA projects** do not require emulators or Azure bindings, but they **are** service roots. They contribute a browser launch configuration (e.g., `chrome` type for Vite/React) and a dev-server task. When a frontend is detected alongside a backend, the workspace is multi-service and **must** produce a compound launch configuration.

> **🔲 Planned project types:** These stubs are in place but not yet activated. When one is detected, inform the user that only emulator setup can be generated at this time and check [project-types/{type}.md](project-types/) for current status.

### Functions SDK Detection

Check for Azure Functions SDK after confirming `host.json` exists:

| Language | SDK Signal | Detection Command |
|----------|-----------|-------------------|
| Node.js / TypeScript | `@azure/functions` in `package.json` | `grep '"@azure/functions"' package.json` |
| .NET / C# | `Microsoft.NET.Sdk.Functions` in `*.csproj` | `grep 'Microsoft.NET.Sdk.Functions' *.csproj` |
| Python | `azure-functions` in `requirements.txt` | `grep 'azure-functions' requirements.txt` |
| Java | `azure-functions-java-library` in `pom.xml` | `grep 'azure-functions-java-library' pom.xml` |

---

## Step 2: Detect Runtime per Service Root

After identifying the project type for a root, determine the language and runtime version:

| File Present | Runtime | Version Source | Launch Config Support |
|-------------|---------|---------------|----------------------|
| `package.json` (+ `tsconfig.json`) | **node-ts** | `engines.node` / `.nvmrc` / `.node-version` | ✅ Implemented |
| `package.json` (no TypeScript) | **node-ts** | Same | ✅ Implemented |
| `*.csproj` | **dotnet** | `<TargetFramework>` element | ⛔ Not yet implemented |
| `requirements.txt` / `pyproject.toml` | **python** | `.python-version` / `requires-python` | ⛔ Not yet implemented |
| `pom.xml` / `build.gradle` | **java** | `<java.version>` / `sourceCompatibility` | ⛔ Not yet implemented |
| `go.mod` | **go** | `go` directive | ⛔ Not yet implemented |

> **⛔ Unimplemented runtimes:** Proceed with emulator setup (language-agnostic). Skip `.vscode/launch.json` and `.vscode/tasks.json` generation and inform the user to configure those manually unless requested for best effort attempt.

---

## Step 3: Determine Single-Service vs Multi-Service

Count the number of service roots found:

| Result | Next Step |
|--------|-----------|
| **1 service root** | Proceed directly to [inventory.md](inventory.md) |
| **2+ service roots** | Proceed to [multi-service.md](multi-service.md) first, then [inventory.md](inventory.md) |

---

## Output Format

Always produce an array (even for single-service workspaces):

**Single-service:**
```
services:
  - { root: ./, projectType: functions, runtime: node-ts }
```

**Multi-service (monorepo):**
```
services:
  - { root: ./api, projectType: functions,   runtime: node-ts }
  - { root: ./web, projectType: app-service,  runtime: node-ts }
```

Carry this array into the next phase. Do NOT read `project-types/` or `runtimes/` files here — classification only produces types and paths.

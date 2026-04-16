# Multi-Service Orchestration

> **Phase 0b — runs only for multi-service workspaces or monorepos.**
> Single-service workspaces skip this file entirely — the output of `classify.md` is a one-item array and all phases treat it identically.

---

## When This Runs

`classify.md` produces a `services[]` array. If the array has **more than one entry**, this phase runs between classify and inventory to assemble a shared workspace context before discovery begins.

---

## Service ID Assignment

Each service root is assigned a short ID used to namespace tasks and launch configs downstream. The ID is derived in priority order:

1. **Project manifest name** — read from the project's package manager or build file, lowercased and kebab-cased:

   | Runtime | File | Field |
   |---------|------|-------|
   | node-ts | `package.json` | `"name"` |
   | dotnet | `*.csproj` | `<AssemblyName>`; falls back to the `.csproj` filename without extension |
   | python | `pyproject.toml` | `name` under `[project]` or `[tool.poetry]`; falls back to `[metadata].name` in `setup.cfg` |
   | java | `pom.xml` | `<artifactId>`; falls back to `rootProject.name` in `settings.gradle` |
   | go | `go.mod` | last path segment of the `module` directive |

2. **Directory name** — used when no manifest is present or the name field is empty; lowercased and kebab-cased.

```
./api  (package.json "name": "payments-api")    → id: payments-api
./web  (package.json "name": "customer-portal") → id: customer-portal
./svc  (no package.json)                         → id: svc
```

If two services resolve to the same ID after derivation, append the project type: `payments-api-functions`, `payments-api-app-service`.

---

## Emulator Deduplication

1. Collect emulator lists from all service contexts
2. Deduplicate by name — each emulator appears once in `docker-compose.yml` regardless of how many services need it
3. Tag each emulator with the service IDs that depend on it — used during connection string injection in generate

```yaml
sharedEmulators:
  - { name: azurite,  usedBy: [api, web] }
  - { name: cosmosdb, usedBy: [api] }
```

> Deduplication only affects compose output. Connection string injection still targets each service's own config file independently.

---

## Workspace Root

The nearest common ancestor directory of all service roots. Shared artifacts written here:

- `docker-compose.yml`
- `emulators:start` / `emulators:stop` scripts
- VS Code compound launch configuration

---

## Port Assignment

When two or more services share the same project type, each needs a unique debug port. Assign ports sequentially from the base port for that runtime:

| Runtime | Base Debug Port | Second Service | Third Service |
|---------|----------------|----------------|---------------|
| Functions / App Service (Node.js) | 9229 | 9230 | 9231 |
| Functions (.NET) | 5005 | 5006 | 5007 |
| App Service (Python) | 5678 | 5679 | 5680 |
| Java (JDWP) | 5005 | 5006 | 5007 |

Ports are written into each service's `launch.json` entry. [global-rules.md](global-rules.md) performs the final conflict check across all assigned ports before generate runs.

---

## Partial Configuration Handling

Check each service root for existing VS Code config before generating anything. A service is considered already configured if it has an existing `launch.json` entry matching its service ID.

| State | Action |
|-------|--------|
| **Fully configured service** | Skip all artifact generation for that service; carry its existing launch entry into the compound config unchanged |
| **Partially configured service** | Generate only what is missing (e.g. tasks but no launch config → generate launch only) |
| **Unconfigured service** | Generate all artifacts as normal |

Adding a second service to an existing single-service repo is safe — the original service's config is preserved and the new service is added alongside it.

---

## Output

Enriched workspace context passed to `inventory.md`:

```yaml
workspace:
  root: ./
  sharedEmulators:
    - { name: azurite,  usedBy: [api, web] }
    - { name: cosmosdb, usedBy: [api] }

services:
  - { id: api, root: ./api, projectType: functions,   runtime: node-ts }
  - { id: web, root: ./web, projectType: app-service,  runtime: node-ts }
```

---

## Compound Launch Config Shape

> **⛔ MANDATORY:** When 2+ service roots are detected (including Frontend SPA projects), a compound launch configuration **must** be generated. A frontend SPA counts as a service root for this purpose — it does not need emulators, but it does need a launch config entry and inclusion in the compound.

`generate.md` produces this compound configuration using service IDs from this phase:

```json
{
  "name": "Start All",
  "configurations": ["{id} (debug)", "..."],
  "preLaunchTask": "Start Emulators",
  "stopAll": true
}
```

One entry per service using its assigned ID. `preLaunchTask` always points to the shared "Start Emulators" task at the workspace root.

### Frontend SPA Launch Entry

When a Frontend SPA service root is detected, add a browser launch configuration and a dev-server task:

```json
// launch.json configuration entry
{
  "name": "{id} (debug)",
  "type": "chrome",
  "request": "launch",
  "url": "http://localhost:{dev-server-port}",
  "webRoot": "${workspaceFolder}/{service-root}/src",
  "preLaunchTask": "{id} dev"
}
```

```json
// tasks.json task entry — Vite example (see framework table below for others)
{
  "type": "shell",
  "label": "{id} dev",
  "command": "npm run dev",
  "options": { "cwd": "${workspaceFolder}/{service-root}" },
  "isBackground": true,
  "problemMatcher": {
    "owner": "vite",
    "pattern": { "regexp": "^$" },
    "background": {
      "activeOnStart": true,
      "beginsPattern": "VITE",
      "endsPattern": "ready in \\d+"
    }
  }
}
```

> ⚠️ **IMPORTANT: Background tasks MUST have a real `problemMatcher`.**
> Avoid `"problemMatcher": []` on a task with `"isBackground": true`.
> An empty matcher causes VS Code to display a blocking dialog:
> *"The task has not exited and doesn't have a 'problemMatcher' defined."*
> Always use a framework-specific background matcher from the table below.

### Framework Detection & Problem Matchers

| Framework | Default Dev Port | Detection | Background Problem Matcher |
|-----------|-----------------|----------|---------------------------|
| Vite | 5173 | `vite.config.*` or `vite` in devDependencies | `beginsPattern: "VITE"`, `endsPattern: "ready in \\d+"` |
| Next.js | 3000 | `next.config.*` or `next` in dependencies | `beginsPattern: "\\s*ready"`, `endsPattern: "started server on"` |
| Angular | 4200 | `angular.json` | `beginsPattern: "Compiling"`, `endsPattern: "Compiled successfully"` |
| Create React App | 3000 | `react-scripts` in dependencies | `beginsPattern: "Starting the development server"`, `endsPattern: "Compiled"` |

> All background problem matchers must include `"activeOnStart": true` and a `"pattern"` with `"regexp": "^$"` (no-op error pattern). The `owner` field should be set to the framework name (lowercased).

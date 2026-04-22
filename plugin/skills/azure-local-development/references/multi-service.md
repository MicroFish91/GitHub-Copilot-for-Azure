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
   | node | `package.json` | `"name"` |
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
- IDE compound debug configuration (see [ide/{ide}.md](ide/))

---

## Port Assignment

When two or more services share the same runtime, each needs a unique debug port. Look up the `Base debug port` from `runtimes/{rt}.md` and assign ports sequentially: first service gets the base port, second gets base + 1, third gets base + 2, etc.

> Browser-based project types (e.g., Frontend SPA) do not use debug ports — they connect via the dev server URL instead.

---

## Partial Configuration Handling

Check each service root for existing IDE debug config before generating anything. A service is considered already configured if it has an existing debug configuration entry matching its service ID. See the active IDE adapter in [ide/](ide/) for how to detect existing configurations and merge rules.

| State | Action |
|-------|--------|
| **Fully configured service** | Skip all artifact generation for that service; carry its existing config into the compound configuration unchanged |
| **Partially configured service** | Generate only what is missing (e.g. tasks but no debug config → generate debug config only) |
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

## Compound Debug Configuration

> ⛔ **MANDATORY:** When 2+ service roots are detected (including Frontend SPA projects), a compound debug configuration **must** be generated. A frontend SPA counts as a service root for this purpose — it does not need emulators, but it does need a debug config entry and inclusion in the compound.

The compound configuration uses service IDs from this phase. One entry per service using its assigned ID.

> ⚠️ The compound references the shared "Start Emulators" task/step only when emulators are required. Omit it when no emulators are needed.

See the active IDE adapter in [ide/](ide/) for the IDE-specific compound configuration format. See [project-types/frontend-spa.md](project-types/frontend-spa.md) for SPA-specific debug config, dev-server task, and framework detection rules.

# Node.js — Debug & Build Configuration

> Covers both **JavaScript** and **TypeScript** projects. The debugger properties are identical; only the build chain differs.

## Prerequisites

| Tool | Detection Command | Required For | Install Link |
|------|-------------------|-------------|-------------|
| Node.js | `node --version` | All Node projects | [nodejs.org](https://nodejs.org/) |
| npm | `npm --version` | Dependency management | (bundled with Node) |

---

## Debugger Properties

Generic debug properties for this runtime. The IDE adapter in [ide/{ide}.md](../ide/) uses these facts to generate IDE-specific debug configuration.

| Property | Value | Notes |
|----------|-------|-------|
| Debug protocol | `Node Inspector` | V8 inspector protocol over WebSocket. Each IDE maps this to its own adapter — e.g., VS Code uses `"type": "node"`. |
| Base debug port | `9229` | Default Node.js inspector port |
| Auto-restart | `true` | Re-attach after the host restarts on file changes |

> **Monorepo / multi-service:** When multiple Node services are present, each is assigned a sequential debug port starting from the base port defined in the project type's Runtime Wiring table. See [multi-service.md](../multi-service.md) for port assignment rules.

---

## Variant Detection

| Signal | Variant | Notes |
|--------|---------|-------|
| `tsconfig.json` present | **node-ts** | TypeScript — requires compile step |
| `package.json` without `tsconfig.json` | **node-js** | Plain JavaScript — no compile step |

---

## Build Chain

Tasks owned by this runtime: install, clean, build, watch. The startup task and its dependency wiring are provided by the project type's Runtime Wiring table — not this file.

### node-ts (TypeScript)

```
"{startup task}"              ← from project-types/{type}.md Runtime Wiring
       ├── dependsOn: "watch step"
       │                └── dependsOn: "clean step"
       │                               └── dependsOn: "install step"
       └── dependsOn: "Start Emulators"
```

| Step | Command | Purpose | Background? |
|------|---------|---------|------------|
| install | `npm install` | Installs dependencies | No |
| clean | `npm run clean` | Cleans build output | No |
| watch | `npm run watch` | Runs `tsc --watch` for incremental builds | ✅ Yes |
| build | `npm run build` | One-shot build (used outside debug flow) | No |

### node-js (JavaScript)

```
"{startup task}"              ← from project-types/{type}.md Runtime Wiring
       ├── dependsOn: "install step"
       └── dependsOn: "Start Emulators"
```

| Step | Command | Purpose | Background? |
|------|---------|---------|------------|
| install | `npm install` | Installs dependencies | No |

> No compile, clean, or watch step — JavaScript runs directly.

> **Monorepo / alternative package managers:** Adjust commands if the project uses `yarn`, `pnpm`, or a monorepo layout. The key invariant is the chain shape: **install → [clean → build/watch →] startup task** (compile steps only for TypeScript).

See the active IDE adapter in [ide/{ide}.md](../ide/) for how these build steps are rendered into IDE-specific task configuration.


---

## Convenience Scripts

Add to `package.json` `"scripts"`:

```json
{
  "emulators:start": "docker compose down && docker compose up -d",
  "emulators:stop": "docker compose down",
  "emulators:clean": "docker compose down && rm -rf {data-dirs}"
}
```

> **`{data-dirs}`** — Space-separated list of all `./.{name}` emulator data directories from `docker-compose.yml`. Example: `.azurite .postgres` for Azurite + PostgreSQL. Derive from actual `volumes:` mounts — do not hardcode. See [generate.md](../generate.md) for derivation rules.

When migrations are detected, also add:

```json
{
  "db:migrate": "{migration tool CLI command}"
}
```

> The `db:migrate` script wraps the detected migration tool's CLI command (e.g., `npx prisma migrate deploy`, `npx knex migrate:latest`). See [migrations.md](../migrations.md) for how to determine the command.

| Script | Location | Run Command |
|--------|----------|-------------|
| `emulators:start` | `package.json` scripts | `npm run emulators:start` |
| `emulators:stop` | `package.json` scripts | `npm run emulators:stop` |
| `emulators:clean` | `package.json` scripts | `npm run emulators:clean` |
| `db:migrate` | `package.json` scripts | `npm run db:migrate` |

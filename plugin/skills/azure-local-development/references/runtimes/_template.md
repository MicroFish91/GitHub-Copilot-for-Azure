# {Runtime} — Debug & Build Configuration

> **Template** — Copy this file to `runtimes/{rt}.md` when adding a new runtime.

---

## Prerequisites

<!-- Required tools, SDKs, version managers — language toolchain only. -->
<!-- Do NOT list project-type-specific tools here (e.g., Functions Core Tools belongs in functions.md). -->

| Tool | Detection Command | Install Link |
|------|-------------------|-------------|
| `{tool}` | `{tool} --version` | [link]() |

---

## Debugger Properties

<!-- Generic debug properties for this runtime.
     The IDE adapter in ide/{ide}.md uses these facts to generate IDE-specific debug configuration.
     See project-types/{type}.md § Runtime Wiring for how these combine with the host command. -->

| Property | Value | Notes |
|----------|-------|-------|
| Debug protocol | `{protocol}` | The wire protocol the runtime exposes (e.g., `Node Inspector`, `CoreCLR DAP`, `debugpy DAP`, `JDWP`, `Delve DAP`). Each IDE adapter maps this to its own debugger identifier — see `ide/{ide}.md`. |
| Base debug port | `{port}` | Default debug port for this runtime; overridden per-service in monorepos |

---

## Build Chain

<!-- Build steps owned by this runtime: install, build/watch.
     The startup task is provided by the project type's Runtime Wiring table, not this file.
     Wire: startup task depends on ["build/watch step", "Start Emulators"]. -->

Chain shape (startup task comes from the project type):

```
"{startup task}"              ← from project-types/{type}.md Runtime Wiring
       ├── dependsOn: "{build/watch step}"  ← this file
       └── dependsOn: "Start Emulators"     ← only when emulators are required
```

### Build Commands

| Step | Command | Purpose | Background? |
|------|---------|---------|------------|
| Start Emulators | `docker compose down && docker compose up -d` | Start all emulator services | No |

See the active IDE adapter in [ide/{ide}.md](../ide/) for how these build steps are rendered into IDE-specific task configuration.

---

## Convenience Scripts

<!-- Where scripts are registered (package.json, Makefile, pyproject.toml) and standard names. -->
<!-- emulators:start, emulators:stop, db:migrate -->

| Script | Location | Run Command |
|--------|----------|-------------|
| `emulators:start` | `{file}` | `{command}` |
| `emulators:stop` | `{file}` | `{command}` |
| `emulators:clean` | `{file}` | `{command}` |
| `db:migrate` | `{file}` | `{command}` |

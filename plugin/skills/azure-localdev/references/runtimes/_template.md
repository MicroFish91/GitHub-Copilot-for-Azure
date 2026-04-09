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

## Debugger Fragment

<!-- Fields contributed to launch.json by this runtime.
     The preLaunchTask and configuration name are set by the project type's Runtime Wiring table.
     See project-types/{type}.md § Runtime Wiring. -->

```json
{
  "type": "{type}",
  "request": "{attach|launch}",
  "port": {port},
  "restart": true
}
```

| Field | Value | Why |
|-------|-------|-----|
| `type` | `"{type}"` | {debugger name} |
| `request` | `"{attach\|launch}"` | {reason} |
| `port` | `{port}` | Default debug port for this runtime; overridden per-service in monorepos |

---

## Build Chain Tasks

<!-- Tasks owned by this runtime: install, build/watch.
     The host-start task is provided by the project type's Runtime Wiring table, not this file.
     Wire: host-start dependsOn ["{build/watch task}", "Start Emulators"]. -->

Chain shape (host-start task comes from the project type):

```
"{host start task}"              ← from project-types/{type}.md Runtime Wiring
       ├── dependsOn: "{build/watch task}"  ← this file
       └── dependsOn: "Start Emulators"     ← always present
```

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "type": "shell",
      "label": "Start Emulators",
      "command": "docker compose down && docker compose up -d",
      "problemMatcher": []
    }
  ]
}
```

---

## Convenience Scripts

<!-- Where scripts are registered (package.json, Makefile, pyproject.toml) and standard names. -->
<!-- emulators:start, emulators:stop, db:migrate -->

| Script | Location | Run Command |
|--------|----------|-------------|
| `emulators:start` | `{file}` | `{command}` |
| `emulators:stop` | `{file}` | `{command}` |
| `emulators:clean` | `{file}` | `{command}` |

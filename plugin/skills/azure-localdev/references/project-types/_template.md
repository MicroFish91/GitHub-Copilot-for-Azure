# {Type} — Project Type

> **Template** — Copy this file to `project-types/{type}.md` when adding a new project type.

---

## Detection Signals

<!-- Files/packages/patterns that identify this project type. Used by classify.md. -->

| Signal | Notes |
|--------|-------|
| `{file}` | {description} |

---

## Dependency Discovery

<!-- How Azure service dependencies are found: bindings, SDK scan, or framework conventions. -->
<!-- Maps to emulators/{name}.md entries. -->

| Dependency Signal | Azure Service | Emulator |
|------------------|---------------|---------|
| `{signal}` | {service} | [{name}](../emulators/{name}.md) |

---

## Host Command

<!-- How the app starts locally. E.g.: func host start, docker compose up, npm run dev -->

```
{command}
```

---

## Connection String Injection

<!-- Where emulator conn strings are placed. E.g.: local.settings.json, .env, compose env vars -->

| Emulator | Variable | File |
|----------|----------|------|
| {emulator} | `{VAR_NAME}` | `{file}` |

---

## Runtime Wiring

<!-- How to assemble the final launch.json / tasks.json for each supported runtime.
     The skill reads the debugger fragment from runtimes/{rt}.md, then fills in the
     host-specific fields from this table to produce the complete VS Code config. -->

| Runtime | preLaunchTask label | Task type | Problem matcher | Base debug port | Notes |
|---------|---------------------|-----------|----------------|----------------|-------|
| node-ts | {host start task} | {type} | {matcher} | {port} | |
| dotnet  | {host start task} | shell | {matcher} | {port} | |
| python  | {host start task} | shell | {matcher} | {port} | |
| java    | {host start task} | shell | {matcher} | {port} | |
| go      | {host start task} | shell | {matcher} | {port} | |

---

## Runtime Support Matrix

<!-- High-level status only. Wiring details live in the Runtime Wiring table above. -->

| Runtime | Status | Notes |
|---------|--------|-------|
| node-ts | 🔲 Planned | |
| dotnet  | 🔲 Planned | |
| python  | 🔲 Planned | |
| java    | 🔲 Planned | |
| go      | 🔲 Planned | |

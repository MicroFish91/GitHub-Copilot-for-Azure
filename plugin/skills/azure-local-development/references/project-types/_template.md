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

## Startup Command

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

## Runtime Support Matrix

<!-- Tracks implementation readiness — separate from Runtime Wiring below.
     Fill in status per runtime: ✅ Full, ⚠️ Emulators only, 🔲 Planned. -->

| Runtime | Status | Reference |
|---------|--------|-----------|
| node-ts | | |
| node-js | | |
| dotnet  | | |
| python  | | |
| java    | | |
| go      | | |

---

## Runtime Wiring

<!-- Combines with runtimes/{rt}.md (protocol, port) and ide/{ide}.md to produce IDE debug config.
     VS Code mapping: Startup command → tasks.json "command", Startup task label → tasks.json "label" + launch.json "preLaunchTask", Request Mode → launch.json "request". -->

| Runtime | Startup command | Startup task label | Request Mode | Notes |
|---------|----------------|-------------------|--------------|-------|
| node-ts | {command} | {label} | {attach\|launch} | |
| node-js | {command} | {label} | {attach\|launch} | |
| dotnet  | {command} | {label} | {attach\|launch} | |
| python  | {command} | {label} | {attach\|launch} | |
| java    | {command} | {label} | {attach\|launch} | |
| go      | {command} | {label} | {attach\|launch} | |

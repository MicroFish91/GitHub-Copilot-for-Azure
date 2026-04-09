# Validate

Run these checks after all artifacts are generated, before marking the plan `Implemented` or telling the user to press F5.

> **⛔ Every step is mandatory. A partial validation is a failure.**
> Do NOT mark the plan `Implemented` until all steps pass.
> If any step fails, diagnose and fix the issue, then re-run that step to confirm before moving on.

---

## Step 1 — Lint `tasks.json`

For every task in `tasks.json`:

| Check | Rule | Why |
|-------|------|-----|
| **Background matcher** | If `"isBackground": true`, `"problemMatcher"` must NOT be `[]`. Must be a named matcher (e.g. `$tsc-watch`) or an inline object with `background.beginsPattern`/`endsPattern`. | Empty matcher on a background task triggers a blocking VS Code dialog. |
| **Non-background matcher** | If `"isBackground"` is absent or `false`, `"problemMatcher": []` is acceptable. | Only background tasks need real matchers. |
| **`dependsOn` targets exist** | Every label in `dependsOn` must exactly match another task's `"label"`. | Broken chains cause silent launch failures. |
| **`cwd` paths exist** | Every `options.cwd` path must exist in the workspace. | Typos cause "directory not found" errors at runtime. |

---

## Step 2 — Lint `launch.json`

For every configuration in `launch.json`:

| Check | Rule |
|-------|------|
| **`preLaunchTask` exists** | Label must exactly match a task in `tasks.json`. |
| **Debug port matches** | `"port"` must match the port the host process actually listens on. |
| **`webRoot` exists** | For `"type": "chrome"` configs, the `webRoot` directory must exist in the workspace. |
| **Compound configurations exist** | Every name listed in a compound's `"configurations"` array must match a config by `"name"`. |

---

## Step 3 — Run Every Configuration (MANDATORY)

> **⛔ YOU MUST ACTUALLY RUN EACH CONFIGURATION IN THE TERMINAL.**
>
> This is not a static analysis step. You must **execute the real commands** that
> each launch configuration triggers, observe their output, and confirm they
> reach a healthy/ready state. Checking that files exist or that JSON references
> resolve is **not sufficient** — that was already done in Steps 1–2.
>
> **If you skip this step or fake it, the user will discover broken configs on
> their first F5 press. That is a validation failure.**

For **every** configuration in `launch.json` (including each entry in a compound):

1. **Read the configuration** — look at its `preLaunchTask`, follow the task chain in `tasks.json` to determine the actual command(s) and `cwd`.
2. **Run it** — execute the resolved command in a terminal. Wait for the process to reach a ready/listening state or exit.
3. **Verify it started** — if the process exits with a non-zero code or prints an error, it has **failed**. Stop and diagnose immediately.
4. **Stop it** — kill the process before moving to the next configuration.

> If a configuration fails, fix the root cause and **re-run it** to confirm before proceeding.

### Output the checklist

After all configurations have been individually started, verified, and stopped:

```
Launch Configuration Checklist:
✅ {config-name} — {ready signal observed}
❌ {config-name} — {error message or failure reason}
```

> **If any configuration fails:** diagnose and fix the root cause (missing
> dependencies, native binding issues, port conflicts, bad paths, etc.), then
> **re-run that configuration from 3a** to confirm the fix before proceeding and marking `Implemented`.
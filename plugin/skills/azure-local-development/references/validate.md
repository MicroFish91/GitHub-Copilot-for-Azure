# Validate

> **⛔ MANDATORY — You MUST complete this section before marking the plan `Implemented` or telling the user to press F5.**
> **DO NOT skip or fake any step. If you skip this, the user will find broken configs on their first F5 press.**

---

## Run Every Configuration

> **⛔ THIS IS NOT STATIC ANALYSIS.**
> Reading files, checking JSON references, or reasoning about what "should" work is NOT validation.
> You MUST use a terminal tool to **execute the actual commands** and observe real output.

### How to resolve a launch config to a runnable command

You cannot press F5 directly, but you can run the exact commands it triggers:

1. Open `.vscode/launch.json` — find the configuration by name
2. Read its `preLaunchTask` value (e.g. `"start-functions"`)
3. Open `.vscode/tasks.json` — find the task with that label
4. Follow any `dependsOn` chain until you reach the leaf task(s) with a `command`
5. The leaf task's `command` + `options.cwd` is what you run in the terminal

**Example:** given this `launch.json` config:
```json
{ "name": "Attach to Functions", "preLaunchTask": "start-host" }
```
and this `tasks.json` chain:
```json
{ "label": "start-host", "dependsOn": ["build"] },
{ "label": "build", "command": "npm run build", "options": { "cwd": "${workspaceFolder}/src/functions" } }
```
→ resolve to: `cd src/functions && npm run build`, then `npm run start` (or whatever the host task's command is).

> Note: Skip running compound configurations directly — derive their result from their members (see below).

### Steps for each configuration

For **every non-compound** configuration in `launch.json`:

1. **Resolve the command** — read `preLaunchTask`, trace the full `dependsOn` chain in `tasks.json`, collect every leaf `command` + `options.cwd` in execution order.

2. **Run each leaf command in a terminal tool** — execute them in order, in their `cwd`. For the final command (the long-running process), run it as a background process and stream stdout.

3. **Wait for the ready signal** — watch stdout for a line that confirms the process started:
   - Azure Functions host → `"Host lock lease acquired"` or `"Functions host started"`
   - Vite / webpack dev server → `"Local:"` or `"ready in"`
   - Node HTTP server → `"listening on"` or `"Server running"`
   - Generic → any line printed after startup without an error/exception

4. **Check the result and iterate:**
   - ✅ Ready signal appeared in stdout → record as passing, move on
   - ❌ Process exited non-zero, or printed a stack trace / `Error:` before a ready signal → **diagnose the error, fix the root cause, and re-run from step 2**. Repeat this loop until the process starts cleanly.
   - Only mark a configuration ❌ in the checklist as a **last resort** — after you have exhausted all reasonable fix options and the process still fails to start.

5. **Stop it** — kill the background process (and any dependency processes) before moving to the next configuration.

**Worked example — full flow:**

```
launch.json config:
  name: "Debug Functions"
  preLaunchTask: "func: host start"

tasks.json resolution:
  "func: host start"
    dependsOn: ["build"]
  "build"
    command: "npm run build"
    cwd: "${workspaceFolder}/api"

Execution:
  Step 1 → cd api && npm run build          (wait for exit 0)
  Step 2 → cd api && func start             (background, stream stdout)
  Step 3 → watch for "Host lock lease acquired" in stdout
  Step 4 → ✅ signal seen at line 12
  Step 5 → kill func process
```

> Note: Skip running compound configurations directly. Instead, derive their checklist result from their members: ✅ if all named members passed, ❌ if any failed.

## ⛔ Output the Checklist — THIS IS NOT OPTIONAL

**You MUST output the checklist as a message to the user. Every single time. No exceptions.**

This is the final required action before you are allowed to finish. If you have not yet output the checklist, you are not done.

You **MUST** run and verify all configurations and output the results **as a message to the user** in the following format:

```
Launch Configuration Checklist:
✅ {config-name} — {ready signal observed}
❌ {config-name} — {error or reason} (only if all fix attempts failed)
```

Rules:
- **Every configuration in `launch.json` must appear** — non-compound configs with their own result, compound configs with a result derived from their members
- **Do NOT finish, summarize, or hand off to the user without this block in your response**
- **Do NOT skip validation because the files look correct** — you must have actually run the commands
- ❌ is a last resort only — if you haven't attempted to fix and re-run, you cannot simply mark it as failed
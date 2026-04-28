# Limited Support Warnings

> Emit a standardized warning when the skill detects a feature that is not yet fully implemented. The warning format is consistent across all feature categories so the user always knows what to expect.

---

## ⛔ Detection Algorithm — MANDATORY

For every detected project type, runtime, IDE, and emulator, follow this procedure **exactly**:

1. **Normalize** the detected value to a canonical kebab-case ID (e.g., `Visual Studio` → `visual-studio`, `VS Code` → `vscode`, `Container App` → `container-app`, `python` → `python`).
2. **Check file existence** — Look for `references/{category-folder}/{canonical-id}.md`. Ignore `_template.md`.
3. **If the file exists** → the feature is fully supported. Proceed normally.
4. **If the file does NOT exist** → the feature has limited support. You **MUST** emit a warning. Do NOT substitute a different, supported feature.

| Category | Category Folder | Example canonical IDs |
|----------|-----------------|----------------------|
| Project type | `references/project-types/` | `functions`, `container-app`, `app-service` |
| Runtime | `references/runtimes/` | `node`, `dotnet`, `python`, `java`, `go` |
| IDE | `references/ide/` | `vscode`, `visual-studio`, `jetbrains` |
| Emulator | `references/emulators/` | `azurite`, `cosmosdb`, `postgres` |

> ⚠️ **Do NOT skip this check.** Every detected feature MUST be verified against the category folder before proceeding. If you are unsure, list the files in the folder to confirm.

---

## Warning Format

```
⚠️ LIMITED SUPPORT: {Category} "{value}" is not yet fully supported.
```

Where:
- `{Category}` — a short label for the feature area (e.g., `Project type`, `Runtime`, `Emulator`, `IDE`)
- `{value}` — the specific feature detected (e.g., `python`, `Container App`, `Cosmos DB`, `Visual Studio`)

---

## ⛔ Emission Protocol — MANDATORY

When a limited-support feature is detected, you **MUST** follow this exact sequence:

### Step 1: Emit in assistant message

Write the canonical warning in your **regular assistant message text**. This is mandatory — the warning must be visible in the chat output, not hidden inside a tool call.

```
⚠️ LIMITED SUPPORT: Emulator "Durable Task Scheduler" is not yet fully supported.
```

### Step 2: Confirm with user

For the **first** limited-support feature encountered in the session, call `ask_user` to confirm whether to proceed:

```
ask_user(
  question: "⚠️ LIMITED SUPPORT: {Category} \"{value}\" is not yet fully supported. Would you still like me to put forth a best-effort attempt?",
  choices: [
    "Yes, proceed with best effort",
    "No, stop here"
  ]
)
```

If the user agrees, treat that as blanket consent for the rest of the session. Any additional limited-support features discovered later should still be emitted as a warning in the assistant message text using the same `⚠️ LIMITED SUPPORT:` format — but do **not** call `ask_user` again.

### Step 3: Record in plan

Add the item to the `## Limited Support` section in `.azure/local-development-plan.md`. See [Plan Integration](#plan-integration) below.

> Emit each `⚠️ LIMITED SUPPORT:` warning exactly once per `(Category, value)` pair in assistant messages. 

---

## No Silent Substitution

**Do NOT silently substitute a supported alternative** when a feature has limited support (e.g. switching a Container App to Azure Functions, or Python to Node.js, or Visual Studio to VS Code). Always plan for the project type, runtime, IDE, and emulators the user actually requested, even when support is limited.

---

## Plan Integration

When **any** limited-support items exist, the `## Limited Support` section in `.azure/local-development-plan.md` is **mandatory**. Add every limited-support item so the user can review them before approving the plan.

---

## Example

User prompt: *"Set up this app for debugging with Visual Studio."*

1. Classify IDE → canonical ID: `jet-brains`
2. Check: does `references/ide/jet-brains.md` exist? **No** → limited support
3. Emit in assistant message:
   ```
   ⚠️ LIMITED SUPPORT: IDE "Jet Brains" is not yet fully supported.
   ```
4. Call `ask_user` to confirm (first occurrence)
5. Add to plan `## Limited Support` section:

   | Category | Value | Impact |
   |----------|-------|--------|
   | IDE | Jet Brains | No IDE-specific debug/launch configuration reference available. Best-effort configuration will be generated. |

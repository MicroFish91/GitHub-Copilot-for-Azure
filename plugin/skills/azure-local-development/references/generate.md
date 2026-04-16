# Artifact Generation

Generate local development configuration files based on the approved plan.

---

## ⛔ CRITICAL: Plan Must Be Approved First

**Do NOT generate any files until `.azure/local-development-plan.md` exists and the user has approved it.** The plan is the source of truth — generate exactly what it specifies.

---

## Pre-Generation Checks

Before generating any artifact, verify:

1. ✅ Plan exists at `.azure/local-development-plan.md` with status `Approved` or `Executing`
2. ✅ Project type and runtime were correctly detected (from [classify.md](classify.md))
3. ✅ Inventory results are documented in the plan (from [inventory.md](inventory.md))
4. ✅ No existing file will be silently overwritten (see [Global Rules](global-rules.md))

---

## Stale Data Directory Pre-Flight

Before generating any files, check for leftover emulator data directories from a previous run (e.g. `.postgres/`, `.azurite/`, `.cosmos/`, `.servicebus/`). These directories can cause container startup failures — for example, PostgreSQL's `initdb` will refuse to initialize if `/var/lib/postgresql/data` (mounted from `.postgres/`) already contains files from an incompatible or partially-initialized cluster.

If any stale directories are found:

1. **List all found directories** with their sizes.
2. **Ask the user how to proceed** using `ask_user`:

```
ask_user(
  question: "The following emulator data directories were found from a previous run:\n\n- .postgres/ (45 MB)\n- .azurite/ (12 MB)\n\nThese can cause container startup failures. How would you like to handle this?",
  choices: [
    "Delete them and start fresh (recommended)",
    "Keep them — I want to preserve the existing data"
  ]
)
```

3. **If the user chooses to delete** — Remove the directories (`rm -rf`) before proceeding with generation.
4. **If the user wants to keep them** — Proceed, but warn that containers may fail to start. If they do fail, offer to clean up at that point.
5. **Never delete data directories silently** — Always confirm with the user first.

> This check is especially important when the workspace was freshly scaffolded from a new `.azure/project-plan.md` but contains stale data from a prior project run.

---

## Port Conflict Pre-Flight

Before generating any files, scan all ports required by the planned emulators. Run `lsof -i -P -n` (macOS/Linux) filtered to the specific ports listed in the approved plan. For each occupied port, identify the process name and PID.

If any conflicts are found:

1. **List all conflicts clearly** — port number, process name, PID.
2. **Ask the user how to proceed** using `ask_user`:

```
ask_user(
  question: "The following ports are already in use on your machine:\n\n- Port 5432 → postgres (PID 1234)\n\nThese ports are needed by the planned emulators. How would you like to handle this?",
  choices: [
    "Help me remap the conflicting ports to alternatives",
    "I'll handle it myself — proceed with the plan as-is"
  ]
)
```

3. **If the user wants help remapping** — Propose alternative port numbers, update all references (docker-compose service ports, connection strings, convenience scripts, launch config), then resume generation.
4. **If the user will handle it themselves** — Proceed with generation using the original ports. They will resolve conflicts before running `docker compose up`.
5. **Never remap ports or modify config silently** — Always confirm with the user before making changes.

### Reactive (When Containers Fail at Runtime)

If containers fail to start after generation — or the user reports a container is unhealthy / docker compose errors — re-run the port scan and follow the same protocol above.

# Global Rules

> **MANDATORY** — These rules apply to ALL actions performed by the azure-local-development skill. Violations are unacceptable.

## Rule 1: Destructive Actions Require User Confirmation

⛔ **ALWAYS use `ask_user`** before ANY destructive action.

### What is Destructive?

| Category | Examples |
|----------|----------|
| **Overwrite** | Replace existing `.vscode/launch.json`, `tasks.json`, `docker-compose.yml` |
| **Delete** | Remove existing emulator config, test collections, npm scripts |
| **Modify package.json** | Adding scripts, dependencies, or devDependencies |
| **Docker operations** | `docker compose down -v` (destroys volumes), pruning containers |
| **Port conflicts** | Binding to ports already in use by other services |

### How to Confirm

```
ask_user(
  question: "This will overwrite your existing .vscode/launch.json. Continue?",
  choices: ["Yes, overwrite", "No, merge with existing", "No, cancel"]
)
```

### No Exceptions

- Do NOT assume the user wants to overwrite existing VS Code config
- Do NOT silently add npm scripts to `package.json`
- Do NOT start Docker containers without confirming
- Always prefer **merge** over **overwrite** when existing config is detected

---

## Rule 2: Preserve Existing Configuration

When existing configuration is detected:

| Found | Action |
|-------|--------|
| `.vscode/launch.json` exists | **Merge** new configurations into existing file; ask user if conflicts arise |
| `.vscode/tasks.json` exists | **Merge** new tasks into existing file; ask user if conflicts arise |
| `docker-compose.yml` exists | **Merge** new services into existing file; ask user if conflicts arise |
| `package.json` scripts exist | **Add** new scripts only if names don't collide; ask user on collision |

---

## Rule 3: Corrupted Emulator Data Recovery

When an emulator container is stuck in a crash-loop or reports initialization errors (e.g., Postgres `initdb: directory exists but is not empty`, Azurite returning 500 on blob writes, Cosmos DB emulator failing to start), the local data volume is likely corrupt.

### First-Line Fix: `emulators:clean`

If the project has an `emulators:clean` script (see [generate.md § Convenience Scripts](generate.md)), suggest it first. This script stops all containers and wipes **all** emulator data directories. The user can then run `emulators:start` when they're ready to spin them back up.

```
ask_user(
  question: "Emulator data appears corrupt. The quickest fix is `npm run emulators:clean` (or the equivalent for your ecosystem), which stops all containers and wipes all emulator data. You can then run `emulators:start` to spin them back up.\n\nAny manually inserted test data will be lost.",
  choices: [
    "Run emulators:clean for me",
    "Only wipe the affected emulator (keep other data)",
    "I'll investigate and fix it myself"
  ]
)
```

### Targeted Fix: Single Emulator

If the user wants to preserve data from unaffected emulators, wipe only the specific data directory for the broken service. Identify the correct directory from the `volumes:` mount in `docker-compose.yml`:

| Emulator | Data Directory | Corruption Symptoms |
|----------|---------------|-------------------|
| Azurite | `.azurite/` | 500 errors on blob/queue/table writes; Functions host can't store secrets |
| PostgreSQL | `.postgres/` | `initdb: directory exists but is not empty`; crash-loop on startup |
| Cosmos DB | `.cosmosdb/` | Emulator fails to initialize; partition errors |
| SQL Edge | `.sqlserver/` | `sqlservr` crash-loop; database files corrupt |

> **Rule:** The data directory to wipe is always the host-side path from the `volumes:` bind mount in `docker-compose.yml` (the `./.{name}:` pattern). For emulators not listed above, check the service's volume mount to find it.

### Response Protocol

1. **Check container logs** — Run `docker compose logs <service>` to confirm the root cause.
2. **Explain clearly** — Tell the user:
   - What went wrong (e.g., "The `.postgres/` data directory has leftover files from a previous run that Postgres can't use.")
   - What will happen if nothing changes (e.g., "Postgres will keep crash-looping and the `db-migrate` service will never run.")
   - What the fix involves (e.g., "Removing `.postgres/` lets Postgres reinitialize from scratch. Migrations re-run automatically, but any manually inserted test data will be lost.")
3. **Present options** — Use `ask_user` with `emulators:clean` as the first choice (see above).
4. **Never act without approval** — The data directory may contain state the user wants to preserve.
5. **After wiping** — Run `docker compose up -d` and verify the container is healthy before proceeding.

---

## Rule 4: Adapt to Target Language Naming and Coding Conventions

When generating artifacts, translate to the idiomatic naming and coding conventions for that language.

### What to Translate

| Artifact | Examples |
|----------|----------|
| **Generated file names** | TypeScript: `camelCase.ts` · Python: `snake_case.py` · C#: `PascalCase.cs` |
| **Script / task names** | TypeScript: `emulators:start` (npm script) · Python: `emulators_start` (Makefile / pyproject) · C#: `emulators-start` (shell script / Makefile) |
| **Variable / key names in generated code** | TypeScript: `camelCase` · Python: `snake_case` · C#: `PascalCase` (public) / `_camelCase` (private) |

---

## Rule 5: Validate Before Generating

Before generating any artifact, verify:

1. The project type was correctly detected
2. The plan was approved by the user
3. No existing file will be silently overwritten

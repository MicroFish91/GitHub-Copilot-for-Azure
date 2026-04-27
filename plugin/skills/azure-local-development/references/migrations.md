# Database Migrations

Detect, configure, and auto-run database migrations before local development sessions. The goal is for migrations to run automatically immediately after emulators start via `docker compose up -d`.

---

## Overview

Database migrations are **not** a separate manual step. When migrations are detected, they are incorporated into `docker-compose.yml` as a one-shot service that runs automatically during the existing "Start Emulators" step. No changes to the IDE task/build chain are needed:

```
Debug start → "{host start task}"
       ├── dependsOn: "{build/watch step}"
       │                └── ... build chain ...
       └── dependsOn: "Start Emulators"  ← docker compose up -d
                        ├── Database service starts → healthcheck confirms readiness
                        └── Migration service waits for healthy → runs migrations → exits
```

---

## Detection

Detection is **evidence-based, not opinionated**. Scan three layers of the workspace — files, dependencies, and scripts — then synthesize findings to determine what migration system is in use. Do not assume a particular tool; let the evidence decide.

### Layer 1: Migration Files

Scan for files and directories that contain migration definitions. Look for tool-specific config files, migration directories, and file naming patterns. 

#### Examples:

- `prisma/migrations/` → Prisma (Node.js)
- `alembic/`, `alembic.ini` → Alembic (Python)
- `**/migrations/*.py` → Django (Python)
- `Migrations/*.cs` → Entity Framework Core (.NET)
- `flyway.conf` → Flyway / Liquibase (Java)
- `migrations/*.sql` → Raw SQL (no tool)

> Not exhaustive — if migration-like files don't match a known pattern, examine them to identify the tool.

### Layer 2: Dependencies

Check the project's dependency manifest (e.g., `package.json`, `requirements.txt`, `*.csproj`, `go.mod`) for migration tools (e.g., `alembic`, `drizzle`), ORMs with built-in migration support (e.g., `prisma`, `TypeORM`, `Django`), and database driver packages (e.g., `pg`, `mysql2`) — drivers confirm the target database even when no migration tool is present.

### Layer 3: Scripts

Check the project's script runner (e.g., `package.json`, `Makefile`, `pyproject.toml`) for existing migration commands. Grep for terms like `migrate`, `schema`, `seed`, and known tool names. The key signal is any command that applies schema changes to a database.

### Synthesis

After scanning all three layers, determine:

1. **Which migration tool is in use** — Cross-reference files, dependencies, and scripts. All three layers should agree. If they conflict (e.g., both Alembic and Django migrations exist), ask the user which one is active.
2. **Whether an existing migration command exists** — If the project already has a working migration script/command, use it directly rather than inventing a new one.
3. **Whether a migration command needs to be built** — If the tool is clear from dependencies/files but no script exists, construct the appropriate command based on the tool's documentation.

> **Prefer existing scripts.** If the project already has a script that runs migrations, wrap that in the docker-compose service rather than building a parallel command.

### Insufficient Evidence

If a database dependency is detected (e.g., `pg` in dependencies, PostgreSQL in docker-compose) but **none of the three layers reveal a clear migration strategy** — no migration files, no migration tool in dependencies, no migration scripts — then:

1. **Do not guess.** Do not assume raw SQL or any particular tool.
2. **Ask the user** using `ask_user`:
   - Explain what was found (database dependency without a migration strategy)
   - Ask how they manage schema changes (e.g. "Do you use a migration tool, raw SQL files, or manage the schema manually?")
   - Offer to skip migration setup if they handle it another way
3. **Record the gap** in the plan so it's visible:

```markdown
### Database Migrations

| Attribute | Value |
|-----------|-------|
| Migration Tool | ⚠️ Not detected — awaiting user input |
| Evidence | Database dependency found but no migration files, tools, or scripts detected |
| Target Database | {database type} (`{compose service name}` service) |
| Auto-Migrate | Pending user response |
```

### What to Record

When migrations are detected, add to the scan results:

```markdown
### Database Migrations

| Attribute | Value |
|-----------|-------|
| Migration Tool | {tool name} |
| Evidence | {what was found: files, deps, scripts} |
| Migration Directory | {path} (if applicable) |
| Migration Command | {existing script or constructed command} |
| Target Database | {database type} (`{compose service name}` service) |
| Auto-Migrate | Yes (docker-compose service) |
```

---

## Docker Compose Patterns

Two patterns are needed when migrations are detected: a **healthcheck** on the database service to signal readiness, and a one-shot **migration service** that waits for the healthcheck, applies changes, and exits.

### Database Emulators

| Database | Emulator Reference |
|----------|--------------------|
| PostgreSQL | [emulators/postgres.md](emulators/postgres.md) |
| SQL Server / SQL Edge | [limited-support.md](limited-support.md) |
| MySQL | [limited-support.md](limited-support.md) |
| CosmosDB | [limited-support.md](limited-support.md) |
| MongoDB | [limited-support.md](limited-support.md) |

> 💡 **No corresponding emulator reference file?** Emit the limited support warning if applicable per [limited-support.md](limited-support.md), then make a best-effort attempt using the patterns below.

### Healthcheck Pattern

When migrations are present, the target database service **must** have a healthcheck so the migration service can use `depends_on` with `condition: service_healthy` to wait for readiness. The healthcheck definition belongs in the emulator's docker-compose config — see the [Database Emulators](#database-emulators) table above for the reference file containing each database's healthcheck block.

For databases without an emulator reference file, construct a best-effort healthcheck using a test that verifies the database accepts connections using its CLI client.

### Migration Service Pattern

The goal is a **single standardized flow**: every project ends up with a migration script in its native script runner (e.g. `npm run db:migrate`, `make db-migrate`). The docker-compose migration service calls that script, and the developer can also run it manually against any target.

#### Step 1: Ensure a Migration Script Exists

| Detection Evidence | Instruction |
|--------------------|-------------|
| Existing migration script in project (e.g., `npm run db:migrate`) | Use it as-is. Skip to Step 2. |
| Application migration tool detected (e.g., Prisma, Alembic, EF Core) but no script | Create a script in the project's native script runner that wraps the tool's CLI command (e.g., `"db:migrate": "npx prisma migrate deploy"` in `package.json`). |
| Raw SQL files only (`migrations/*.sql`), no migration tool | Recommend and install a lightweight migration tool as a dev dependency (e.g., `node-pg-migrate` for Node.js, `golang-migrate` for Go, `alembic` for Python). Configure it to use the existing `migrations/` directory, then create a script wrapping its CLI. Ask the user before installing. |

> **Why install a tool for raw SQL?** A migration tool gives raw SQL files a proper CLI, idempotency tracking (so migrations don't re-run), and a consistent interface. This eliminates database-specific shell scripts and lets the same project script work against any target — local container, remote dev, staging, etc.

#### Step 2: Wire the Script into Docker Compose

The migration service calls the project's migration script inside a container with the right runtime.

```yaml
services:
  db-migrate:
    image: ${RUNTIME_IMAGE}
    working_dir: /app
    depends_on:
      ${DATABASE_SERVICE}:
        condition: service_healthy
    volumes:
      - ./:/app:ro
      ${EXTRA_VOLUME_MOUNTS}
    environment:
      ${CONNECTION_ENV_VAR}: ${CONNECTION_STRING_FOR_COMPOSE_NETWORK}
    entrypoint: ${MIGRATION_SCRIPT}
    restart: "no"
```

**Filling in the template — use detected evidence:**

| Placeholder | How to determine |
|-------------|-----------------|
| `RUNTIME_IMAGE` | A Docker image that provides the language runtime the project uses. See the table below. |
| `DATABASE_SERVICE` | The compose service name for the target database (e.g., `postgres`, `sqlserver`) |
| `CONNECTION_ENV_VAR` | The environment variable the migration tool expects. Check the tool's config file, `local.settings.json`, `.env`, or framework conventions. |
| `CONNECTION_STRING_FOR_COMPOSE_NETWORK` | Same shape as the local connection string but with the compose service name as host instead of `localhost` (e.g., `postgresql://postgres:postgres@postgres:5432/localdev`) |
| `EXTRA_VOLUME_MOUNTS` | Additional mounts needed for the ecosystem (e.g., `node_modules`, `.venv`). See the table below. |
| `MIGRATION_SCRIPT` | The project's migration script command (e.g., `["npm", "run", "db:migrate"]`, `["make", "db-migrate"]`) |

**Runtime images and extra volume mounts:**

| Ecosystem | Image | Extra Volume Mounts | Notes |
|-----------|-------|-------------------|-------|
| Node.js / TypeScript | `node:{major}-slim` | `./node_modules:/app/node_modules:ro` | Mount node_modules separately for native modules |
| .NET | [limited-support.md](limited-support.md) | | |
| Python | [limited-support.md](limited-support.md) | | |
| Java | [limited-support.md](limited-support.md) | | |
| Go | [limited-support.md](limited-support.md) | | |

> 💡 **Limited support runtimes:** For ecosystems without a fully documented configuration above, emit the limited support warning per [limited-support.md](limited-support.md), then make a best-effort attempt. Choose a slim official Docker image for the runtime (e.g., `python:{version}-slim`, `mcr.microsoft.com/dotnet/sdk:{version}`), mount the project read-only, and include any dependency directories the migration tool needs to run. The same docker-compose invariants apply.

> **Key properties:**
> - `depends_on` with `condition: service_healthy` — waits for the database to accept connections
> - `volumes` with `:ro` — mounts project files read-only for safety
> - `restart: "no"` — runs once per `docker compose up`, does not restart after exit
> - Mount ecosystem-specific dependency directories (e.g., `node_modules`, `.venv`) when the migration tool is installed as a project dependency

#### Result

After both steps, the developer has:

- **One script** (`npm run db:migrate` / `make db-migrate`) that runs migrations against any target via environment variables
- **Automatic migration** on `docker compose up -d` via the `db-migrate` service
- **Manual migration** option if the script is invoked directly — can target localhost, a remote dev database, staging, etc.

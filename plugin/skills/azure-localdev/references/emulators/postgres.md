# PostgreSQL

> PostgreSQL has no Azure-provided emulator. Use the standard `postgres` Docker image for local development. If the project targets **Azure Cosmos DB for PostgreSQL**, note in the plan that no local emulator is available.

## Docker Image

```
postgres:16
```

## docker-compose Service Block

```yaml
services:
  postgres:
    image: postgres:16
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: localdev
    volumes:
      - ./.postgres:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
      start_period: 30s
    restart: unless-stopped
```

> **Healthcheck:** Always include the `healthcheck` block. When migrations are detected, the `db-migrate` service uses `condition: service_healthy` to wait for readiness. See [migrations.md](../migrations.md) for migration service patterns.

## Connection String

```
postgresql://postgres:postgres@localhost:5432/localdev
```

## Required App Environment Variables

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/localdev` |
| `POSTGRES_CONNECTION_STRING` | `postgresql://postgres:postgres@localhost:5432/localdev` |

> Use whichever variable name the project's ORM or SDK expects. Both forms above are shown as reference.

## Notes

- Port 5432 is the standard PostgreSQL port.
- Default credentials (`postgres`/`postgres`) are intentionally simple for local dev. Never use in production.
- Data is persisted to `./.postgres/`. The healthcheck ensures dependent services (e.g. `db-migrate`) wait for full readiness before connecting.

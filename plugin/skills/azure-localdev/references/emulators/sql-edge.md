# SQL Edge (Azure SQL Edge)

## Docker Image

```
mcr.microsoft.com/azure-sql-edge:latest
```

## docker-compose Service Block

> **Note:** SQL Edge is a **backing store** for the Service Bus and Event Hubs emulators.
> It is rarely used directly by application code. Add it only when those emulators are required.
> When both Service Bus and Event Hubs are needed, use a **single** `sqlserver` service block.

```yaml
services:
  sqlserver:
    image: mcr.microsoft.com/azure-sql-edge:latest
    environment:
      - ACCEPT_EULA=Y
      - MSSQL_SA_PASSWORD=YourStrong@Passw0rd
    ports:
      - "1433:1433"
    volumes:
      - ./.sqlserver:/var/opt/mssql/data
    healthcheck:
      test: ["CMD", "/opt/mssql-tools/bin/sqlcmd", "-S", "localhost", "-U", "sa", "-P", "YourStrong@Passw0rd", "-Q", "SELECT 1"]
      interval: 10s
      retries: 10
      start_period: 30s
    restart: unless-stopped
```

## Connection String

```
Server=localhost,1433;Database=master;User Id=sa;Password=YourStrong@Passw0rd;TrustServerCertificate=True;
```

## Required App Environment Variables

| Variable | Value |
|----------|-------|
| `SqlConnectionString` (if app uses SQL directly) | `Server=localhost,1433;Database={db};User Id=sa;Password=YourStrong@Passw0rd;TrustServerCertificate=True;` |

## Notes

- Port 1433: standard SQL Server TDS protocol
- The service name is `sqlserver` (not `sql-edge`) to match the `SQL_SERVER` env var expected by Service Bus and Event Hubs emulators.
- `TrustServerCertificate=True` is required for the self-signed certificate used by the emulator.
- **arm64 (Apple Silicon):** Azure SQL Edge supports arm64 natively — no workaround needed.
- **Consolidation:** Never add more than one `sqlserver` block. All emulators that depend on SQL Edge must reference the same service.

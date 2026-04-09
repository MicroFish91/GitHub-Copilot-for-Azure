# Service Bus Emulator

## Docker Image

```
mcr.microsoft.com/azure-messaging/servicebus-emulator:latest
```

## docker-compose Service Block

> **Requires:** SQL Edge — the Service Bus Emulator uses SQL Edge as its backing store.
> Include the [`sql-edge`](sql-edge.md) service in the same compose file.

```yaml
services:
  servicebus:
    image: mcr.microsoft.com/azure-messaging/servicebus-emulator:latest
    environment:
      - ACCEPT_EULA=Y
      - SQL_SERVER=sqlserver
      - MSSQL_SA_PASSWORD=YourStrong@Passw0rd
    ports:
      - "5672:5672"
    depends_on:
      sqlserver:
        condition: service_healthy
    restart: unless-stopped

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

> **Consolidation:** If the Event Hubs Emulator is also needed, it shares the same `sqlserver` service.
> Do not add a second `sqlserver` block — merge both emulator services under one `sqlserver`.

## Connection String

```
Endpoint=sb://localhost;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=SAS_KEY_VALUE;UseDevelopmentEmulator=true;
```

## Required App Environment Variables

| Variable | Value |
|----------|-------|
| `ServiceBusConnection` (Functions) | `Endpoint=sb://localhost;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=SAS_KEY_VALUE;UseDevelopmentEmulator=true;` |
| `AZURE_SERVICEBUS_CONNECTION_STRING` (SDK) | same as above |

## Notes

- Port 5672: AMQP protocol
- SQL Edge default port 1433 is mapped to host; adjust if another SQL Server is running locally.
- The SA password must match between `servicebus` → `MSSQL_SA_PASSWORD` and `sqlserver` → `MSSQL_SA_PASSWORD`.

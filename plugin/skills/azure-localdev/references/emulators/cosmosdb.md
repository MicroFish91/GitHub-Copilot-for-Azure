# Cosmos DB Emulator

## Docker Image

```
mcr.microsoft.com/cosmosdb/linux/azure-cosmos-emulator:latest
```

## docker-compose Service Block

```yaml
services:
  cosmosdb:
    image: mcr.microsoft.com/cosmosdb/linux/azure-cosmos-emulator:latest
    environment:
      - AZURE_COSMOS_EMULATOR_PARTITION_COUNT=10
      - AZURE_COSMOS_EMULATOR_ENABLE_DATA_PERSISTENCE=false
    ports:
      - "8081:8081"
      - "10251:10251"
      - "10252:10252"
      - "10253:10253"
      - "10254:10254"
    restart: unless-stopped
```

## Connection String

```
AccountEndpoint=https://localhost:8081/;AccountKey=C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==
```

## Required App Environment Variables

| Variable | Value |
|----------|-------|
| `CosmosDbConnection` (Functions) | `AccountEndpoint=https://localhost:8081/;AccountKey=C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==` |
| `COSMOS_CONNECTION_STRING` (SDK) | same as above |

## Notes

- Port 8081: Data Explorer + REST API
- Ports 10251–10254: Direct mode TCP channels
- The emulator uses a self-signed TLS certificate; the SDK must be configured to disable TLS verification for local dev (`AZURE_COSMOS_DISABLE_NONSTREAMING_QUERY_PLAN` may also be needed).
- **arm64 (Apple Silicon / ARM Linux):** The Linux Cosmos emulator does not support arm64. Use the [Try Cosmos DB](https://cosmos.azure.com/try) free-tier endpoint, or run the Windows emulator in a VM.
- Data persistence is disabled by default (`ENABLE_DATA_PERSISTENCE=false`) to keep startup fast; set to `true` and add a volume mount if you need data to survive restarts.

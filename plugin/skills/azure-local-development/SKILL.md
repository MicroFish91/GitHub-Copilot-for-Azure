---
name: azure-local-development
description: "Setup project configurations and local development environment so that the developer can start debugging from a single action. Guides installation of prerequisites, automates Azure emulator setup via docker-compose (Azurite, Postgres, Service Bus, etc.), provides IDE-specific debug/launch configs, and generates a local development API test collection for basic app verification. WHEN: \"local dev\", \"local development\", \"local dev setup\", \"local environment setup\", \"verify my project locally\", \"debug my project locally\", \"debug my project in VS Code\", \"launch.json\", \"tasks.json\", \"set up emulators\". DO NOT USE FOR: deploying to Azure (use azure-deploy), generating Terraform or Bicep (use azure-prepare), Amazon, AWS, Google, GCP, container diagnostics (use azure-diagnostics), security audits (use azure-compliance), monitoring (use appinsights-instrumentation)."
license: MIT
metadata:
  author: Microsoft
  version: "0.0.0-placeholder"
---

# Azure Local Development

> **AUTHORITATIVE GUIDANCE — MANDATORY COMPLIANCE**
>
> This document is the **official, canonical source** for setting up local development environments for Azure projects. You **MUST** follow these instructions exactly as written. When in doubt, defer to this document. Do not improvise, infer, or substitute steps.

---

## Triggers

Activate this skill when the user wants to:

- Set up their workspace for local development / debugging
- Configure project for local development / debugging in their IDE
- Add or configure Azure emulators locally (Azurite, Cosmos DB Emulator, Service Bus Emulator, Event Hubs Emulator)
- Generate `docker-compose.yml` for Azure emulator services
- Create or update IDE debug launch configurations
- Generate API local test collection for verifying triggers & endpoints
- Automate database migrations for local development

## Global Rules (NO EXCEPTIONS)

1. **Update plan progressively** — Mark steps complete as you go; update **Last Updated** timestamp on every status change
2. ❌ **Destructive actions require `ask_user`** — Always confirm before overwriting, deleting, or modifying existing files
3. **Preserve existing config** — Never silently overwrite project configuration files or `docker-compose.yml`. Merge or ask first.
4. **Scope — local development only** — This skill configures the developer's machine and existing workspace project for local debugging. Cloud deployment is handled by **azure-prepare** → **azure-validate** → **azure-deploy**.
5. **Warn on limited support** — When a feature is not yet fully implemented (e.g. project type, runtime, emulator, IDE), you MUST emit a `⚠️ LIMITED SUPPORT:` warning — [limited-support.md](references/limited-support.md).

---

## PLAN-FIRST WORKFLOW

> **YOU MUST CREATE A PLAN BEFORE DOING ANY WORK**
>
> 1. **STOP** — Do not generate any configuration files yet
> 2. **CLASSIFY** — Run Phase 0 to detect IDE, project type(s), runtime(s), and dependencies
> 3. **PLAN** — Run Phase 1 to create `.azure/local-development-plan.md`
> 4. **CONFIRM** — Present the plan to the user and get approval
> 5. **EXECUTE** — Only after approval, run Phase 2
>
> ⚠️ **CRITICAL: The `.azure/local-development-plan.md` must be created inside the workspace root** (e.g., `my-project/.azure/local-development-plan.md`), not in a session-state folder.

---

## Phase 0: Classify

Scan the full workspace for service roots. Always produces a list of `services[]` and a workspace-level `ide`. Load the corresponding project-type, runtime, and IDE reference(s) before continuing to Phase 1.

| Action | Reference |
|--------|-----------|
| **IMPORTANT**: Always check for `.azure/project-plan.md` in the workspace root. If found, read it to understand the project's architecture, services, runtimes, and Azure dependencies. Use this context to inform planning in subsequent phases. This file is **optional** — if it does not exist, proceed normally. | `.azure/project-plan.md` (if present) |
| Scan all subdirectories; detect project type + runtime per service root | [classify.md](references/classify.md) |
| If 2+ service roots found: assemble shared workspace context, deduplicate emulators, assign debug ports | [multi-service.md](references/multi-service.md) |

---

## Phase 1: Plan

Create `.azure/local-development-plan.md` by completing these steps. Do NOT generate any artifacts until the plan is approved.

| # | Action | Reference |
|---|--------|-----------|
| 1 | **Inventory Dependencies** — For each service: scan bindings/SDKs, identify emulators needed, check existing config | [inventory.md](references/inventory.md), [project-types/{type}.md](references/project-types/) |
| 2 | **Detect Prerequisites** — Check which required tools are installed and which are missing | [inventory.md](references/inventory.md) |
| 3 | **Detect Migrations** — Scan for database migration files or ORM config; if found, plan a docker-compose migration service | [migrations.md](references/migrations.md) |
| 4 | **Determine Launch Configuration** — Build the debug/launch configuration per service using the detected IDE | [runtimes/{rt}.md](references/runtimes/), [project-types/{type}.md](references/project-types/), [ide/{ide}.md](references/ide/) |
| 5 | **Plan API Test Collection** — List HTTP endpoints and trigger-based functions that need test scripts | [inventory.md](references/inventory.md), [api-test-collections.md](references/api-test-collections.md) |
| 6 | **Limited-Support Warnings** — For every detected project type, runtime, IDE, and emulator: normalize to canonical ID, check for a matching file in the reference folder, and emit a `⚠️ LIMITED SUPPORT:` warning in your assistant message if no match exists. Log warnings in the plan's `## Limited Support` section. Never silently substitute a supported alternative. | [limited-support.md](references/limited-support.md) |
| 7 | **Write Plan** — Generate `.azure/local-development-plan.md` using the template. Prerequisites section must list installed vs. missing with install links. Set **Created** and **Last Updated** to the current UTC datetime (ISO 8601). | [plan-template.md](references/plan-template.md) |
| 8 | **Present Plan** — Show plan to user and ask for approval. If prerequisites are missing, highlight them and ask the user to install before proceeding. Once approved, update plan status to `Approved` and **Last Updated** timestamp. | `.azure/local-development-plan.md` |

---

> **❌ STOP HERE** — Do NOT proceed to Phase 2 until the user approves the plan.

---

## Phase 2: Generate

| # | Action | Reference |
|---|--------|-----------|
| 1 | **Pre-flight** — Verify `.azure/local-development-plan.md` exists with status `Approved`. Set status to `Executing` and update **Last Updated** before writing any files. | `.azure/local-development-plan.md` |
| 2 | **Generate** — The plan drives implementation. Implement faithfully; use best judgment where the plan is underspecified. | [generate.md](references/generate.md) |

## Phase 3: Validate

> ⚠️ **CRITICAL: You MUST complete every validation step below before proceeding. Do NOT mark the task as complete, do NOT set status to `Implemented`, and do NOT deliver a closing message until validation is finished and the checklist is updated with real results.

Validate that the generated IDE configuration works. The validation steps are IDE-specific — refer to the active IDE adapter:

| IDE | Reference |
|-----|-----------|
| VS Code | [ide/vscode.md § Validation](references/ide/vscode.md) |
| Other | [limited-support.md](references/limited-support.md) |

You MUST:
1. Follow **every** validation step in the IDE reference — execute them, do not skip or assume they pass
2. Update the `## Debug Configuration Checklist` section in `.azure/local-development-plan.md` with the real ✅ or ❌ result for **each** configuration
3. Only after **every** checklist stub has been replaced with a real result may you mark status as `Implemented` and proceed

> ⛔ Do NOT set status to `Implemented` until every stub in the Debug Configuration Checklist has been replaced with a real ✅ or ❌ result. A checklist with any remaining stubs is incomplete — go back and validate.

---

## Outputs

| Artifact | Location |
|----------|----------|
| **Plan** | `.azure/local-development-plan.md` |
| Architecture Diagram | `.azure/local-development-plan.md` § Architecture |
| Docker Compose | `docker-compose.yml` |
| IDE Debug Config | IDE-specific — see [ide/{ide}.md](references/ide/) |
| IDE Build Config | IDE-specific — see [ide/{ide}.md](references/ide/) |
| Convenience Scripts | Runtime-specific script runner (see [runtimes/{rt}.md](references/runtimes/)) |
| API Test Collections | `api-test-collections/local-development/<test-name>/invoke.sh` |

---

## Next Steps — MANDATORY CLOSING MESSAGE

After validation, end your response with the following:

| # | Item | What to say |
|---|------|-------------|
| 1 | **Start Debugging** | Tell the user to start debugging using their IDE's debug/run action. Refer to the IDE-specific quick start in [ide/{ide}.md](references/ide/). Example - for VS Code: "Press **F5** and select the compound launch configuration (e.g., 'Start All')." |
| 2 | **Offer API Testing** | Offer to run any API test collection scripts on the user's behalf. Caveat - the user must start the app first; the scripts often target `localhost` endpoints that require the app to be running. |
| 3 | **Azure Cloud Deployment** | Mention that for subsequent Azure cloud deployment, hand off to: `azure-prepare` → `azure-validate` → `azure-deploy`. |

Example closing message (adapt based on detected IDE):

> ## Next Steps
>
> Start the application using your IDE's debug/run action. For VS Code, press **F5** and select **Start All**.
>
> Once the app is running, you can ask me to run the API test collection scripts to verify your endpoints.
>
> When you're ready to deploy to Azure, I can help with that too.

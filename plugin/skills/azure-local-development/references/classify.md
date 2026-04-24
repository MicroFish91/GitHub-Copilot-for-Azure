# Classify Workspace

Determine the project type(s) and runtime(s) to select the correct scanning rules, emulator mappings, and launch configurations.

> **Always scan the full directory tree** — not just the workspace root. Service roots nested in subdirectories (e.g. `./api/`, `./web/`) must be found regardless of project layout.

---

## ⛔ MANDATORY: Run Classification Before Anything Else

Run the detection tables below **in order** (first match wins per root). Classification produces an array of service contexts — even single-service workspaces produce a one-item services list so the rest of the flow is uniform.

---

## Step 0: Check for Project Plan (Optional Context)

Before scanning for service roots, look for `.azure/project-plan.md` in the workspace root. This file is **not required** — skip this step silently if it does not exist.

> Treat this project plan as **advisory context**, not as a substitute for detection. Always run the full detection tables below — but use the plan to resolve ambiguity, validate findings, and avoid misclassification.

---

## Step 1: Detect Project Types

Scan every subdirectory for the following signals. Ignore: `node_modules/`, `.git/`, `dist/`, `build/`, `bin/`, `obj/`.

### Project Type Detection Table


| # | Detection Signals | Project Type | Status | Reference |
|---|-------------------|-------------|--------|-----------|
| 1 | `host.json` exists and Azure Functions SDK in dependencies | **Azure Functions** | ✅ Implemented | [project-types/functions.md](project-types/functions.md) |
| 2 | `Dockerfile` exists | **Container App** | 🔲 Planned | [limited-support.md](limited-support.md) |
| 3 | Web framework detected (Express/Fastify/ASP.NET/FastAPI/Flask/Spring) **AND** no `host.json` **AND** no `Dockerfile` | **App Service** | 🔲 Planned | [limited-support.md](limited-support.md) |
| 4 | `.AppHost.csproj` or `Aspire.Hosting` package in `*.csproj` | **.NET Aspire** | 🔲 Planned | [limited-support.md](limited-support.md) |
| 5 | SPA framework detected (React/Vue/Angular/Svelte via `package.json`) **OR** `vite.config.*` / `next.config.*` / `angular.json` present **AND** no `host.json` | **Frontend SPA** | ✅ Implemented | [project-types/frontend-spa.md](project-types/frontend-spa.md) |
| ∞ | No match | **Unknown** | — | [limited-support.md](limited-support.md) |

> **Frontend SPA projects** may not require emulators or Azure bindings, but they **are** service roots. They contribute a browser debug configuration and a dev-server task. When a frontend is detected alongside a backend, the workspace is multi-service and **must** produce a compound debug configuration. See the active IDE adapter in [ide/](ide/) for the IDE-specific format.


---

## Step 2: Detect Runtimes

After identifying the project type for a root, determine the language and runtime version for each service root.

### Runtime Detection Table

| # | Detection Signals | Runtime | Version Source | Status | Reference |
|---|-------------------|---------|---------------|--------|-----------|
| 1 | `package.json` (+ `tsconfig.json`) | **node-ts** | `engines.node` / `.nvmrc` / `.node-version` | ✅ Implemented | [runtimes/node.md](runtimes/node.md) |
| 2 | `package.json` (no TypeScript) | **node-js** | Same | ✅ Implemented | [runtimes/node.md](runtimes/node.md) |
| 3 | `*.csproj` | **dotnet** | `<TargetFramework>` element | 🔲 Planned | [limited-support.md](limited-support.md) |
| 4 | `requirements.txt` / `pyproject.toml` | **python** | `.python-version` / `requires-python` | 🔲 Planned | [limited-support.md](limited-support.md) |
| 5 | `pom.xml` / `build.gradle` | **java** | `<java.version>` / `sourceCompatibility` | 🔲 Planned | [limited-support.md](limited-support.md) |
| 6 | `go.mod` | **go** | `go` directive | 🔲 Planned | [limited-support.md](limited-support.md) |
| ∞ | No match | **Unknown** | — | — | [limited-support.md](limited-support.md) |

---

## Step 3: Detect IDE (Workspace-Level)

Determine the target IDE for the workspace. The IDE applies to the entire workspace, not per-service. Use the following priority:

1. **Explicit user request** — The user names an IDE in their prompt (highest priority)
2. **Existing workspace artifacts** — Check for IDE-specific files in the workspace root
3. **Ask the user** — If no signal is found from the prompt or workspace, use `ask_user` to ask which IDE they want to target

### ⛔ MUST: IDE Name Normalization

Normalize the user's IDE reference to a **canonical ID** using this table. These are **different products** — do NOT treat one as shorthand for another.

| User says | Canonical ID | Maps to | Reference |
|-----------|-------------|---------|-----------|
| "VS Code", "VSCode", "Visual Studio Code", "Code" | `vscode` | **VS Code** | [ide/vscode.md](ide/vscode.md) |
| "Visual Studio", "VS" (without "Code") | `visual-studio` | **Visual Studio** | [limited-support.md](limited-support.md) |
| Other | — | — | [limited-support.md](limited-support.md) |

> ⛔ **"Visual Studio" ≠ "VS Code".** These are different IDEs. If the user says "Visual Studio" or "VS", you MUST classify as `visual-studio`, NOT `vscode`. Misclassifying the IDE violates this rule.

After normalizing, check whether `references/ide/{canonical-id}.md` exists. If it does NOT exist, the IDE has **limited support** — you MUST follow the [limited-support.md](limited-support.md) emission protocol before proceeding. Do NOT silently fall back to a supported IDE.

---

## Step 4: Determine Single-Service vs Multi-Service

Count the number of service roots found:

| Result | Next Step |
|--------|-----------|
| **1 service root** | Proceed directly to [inventory.md](inventory.md) |
| **2+ service roots** | Proceed to [multi-service.md](multi-service.md) first, then [inventory.md](inventory.md) |

---

## Output Format

Always produce a workspace context with `ide` and a `services[]` array (even for single-service workspaces):

**Single-service:**
```
workspace:
  ide: vscode
services:
  - { root: ./, projectType: functions, runtime: node-ts }
```

**Multi-service (monorepo):**
```
workspace:
  ide: vscode
services:
  - { root: ./api, projectType: functions,   runtime: node-ts }
  - { root: ./web, projectType: app-service,  runtime: node-ts }
```

Carry this context into the next phase. Do NOT read `project-types/`, `runtimes/`, or `ide/` files here — classification only produces types, paths, and the target IDE.

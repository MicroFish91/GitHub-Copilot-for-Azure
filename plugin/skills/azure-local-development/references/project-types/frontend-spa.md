# Project Type: Frontend SPA

Reference guide for local development setup of frontend single-page application projects.

---

## Detection Signals

| Signal | Notes |
|--------|-------|
| `vite.config.*` or `vite` in devDependencies | Vite-based SPA |
| `next.config.*` or `next` in dependencies | Next.js app |
| `angular.json` | Angular app |
| `react-scripts` in dependencies | Create React App |

---

## Runtime Support Matrix

| Runtime | Status | Reference |
|---------|--------|-----------|
| node | ✅ Full | [runtimes/node.md](../runtimes/node.md) |

---

## Dependency Discovery

Frontend SPAs communicate with backend services via HTTP during local development — they do not connect to Azure emulators directly. In monorepo setups, Azure service dependencies (storage, databases, etc.) are handled by the backend project type. In standalone SPA projects, the backend may already be running as a deployed service or a separate local process — no emulator setup is needed for the SPA itself.

---

## Startup Command

The startup command is the framework's dev server:

| Framework | Default Command | Default Dev Port |
|-----------|---------|-----------------|
| Vite | `npm run dev` | 5173 |
| Next.js | `npm run dev` | 3000 |
| Angular | `npm start` or `ng serve` | 4200 |
| Create React App | `npm start` | 3000 |

---

## Runtime Wiring

<!-- Combines with runtimes/{rt}.md (protocol, port) and ide/{ide}.md to produce IDE debug config.
     Debug port values from runtimes/{rt}.md do not apply here — the browser debugger connects via the dev server URL. -->

| Runtime | Startup command | Startup task label | Request Mode | Notes |
|---------|----------------|-------------------|--------------|-------|
| node | `npm run dev` | `{id} dev` | `launch` | IDE launches a browser; dev server is a prerequisite task |

---

## Framework Detection & Problem Matchers

Each frontend framework emits different console output when the dev server is ready. These patterns are used for background problem matchers in the IDE build configuration.

| Framework | Detection | Ready Pattern (begins) | Ready Pattern (ends) |
|-----------|----------|----------------------|---------------------|
| Vite | `vite.config.*` or `vite` in devDependencies | `VITE` | `ready in \d+` |
| Next.js | `next.config.*` or `next` in dependencies | `\s*ready` | `started server on` |
| Angular | `angular.json` | `Compiling` | `Compiled successfully` |
| Create React App | `react-scripts` in dependencies | `Starting the development server` | `Compiled` |

> All background problem matchers must include `"activeOnStart": true` and a no-op error pattern (`"regexp": "^$"`). The `owner` field should be set to the framework name (lowercased).

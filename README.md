# Cosmikit — Design System Sync for Figma

Sync design tokens between Figma and GitHub with AI-powered assistance. Extract, transform, diff, and push — all from inside Figma.

**Dashboard:** https://web-pied-iota-65.vercel.app

## Quick Start

1. **Download** the plugin ZIP from the [latest release](https://github.com/Dipsey999/highcloude/releases/latest)
2. **Extract** the ZIP to any folder on your computer
3. **Import** into Figma Desktop: Plugins > Development > Import plugin from manifest > select `manifest.json`
4. **Sign in** at the [Cosmikit dashboard](https://web-pied-iota-65.vercel.app) with GitHub
5. **Add your GitHub token** in the dashboard under API Keys
6. **Create a project** and select the repo where you want to sync tokens
7. **Generate a plugin token** from the dashboard and paste it into the Figma plugin

> **Note:** The Figma desktop app is required. Development plugins don't work in the browser version.

## Features

- **Token Extraction** — Extract all variables, text styles, and effects into W3C DTCG format
- **Two-Way GitHub Sync** — Push tokens to GitHub and pull changes back. Single-file or multi-file, direct or via PRs
- **AI-Powered Design** — Free via Claude MCP integration. Generate designs from natural language
- **Smart Auto-Mapping** — Detect hard-coded values and map them to the closest matching design token
- **Diff & Merge** — See exactly what changed between local and remote tokens before syncing
- **Team-Ready** — Multi-file sync with PR workflow for team review

## Architecture

```
Figma Plugin (Preact + TypeScript)
    |
    | Plugin Token (JWT)
    v
Web Dashboard (Next.js 14 + NextAuth + Prisma)
    |
    v
PostgreSQL (Neon) + GitHub API
```

- **Figma Plugin** — Runs inside Figma, handles token extraction, sync, auto-mapping, and AI features
- **Web Dashboard** — Manages authentication, API key storage, project configuration, and plugin tokens
- **Database** — Stores user accounts, encrypted API keys, and project configs

## Development Setup

### Prerequisites

- Node.js 18+
- A PostgreSQL database (e.g., [Neon](https://neon.tech))
- A GitHub OAuth App ([create one](https://github.com/settings/developers))

### Plugin (root directory)

```bash
npm install
npm run dev          # Watch mode build
```

Import `manifest.json` into Figma Desktop via Plugins > Development > Import plugin from manifest.

### Web Dashboard (web/ directory)

```bash
cd web
npm install
cp .env.example .env  # Fill in your environment variables
npx prisma db push    # Create database tables
npm run dev           # Start dev server at localhost:3000
```

### Environment Variables

See `web/.env.example` for the full list:

- `AUTH_SECRET` — NextAuth secret
- `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` — GitHub OAuth App credentials
- `DATABASE_URL` — PostgreSQL connection string
- `ENCRYPTION_KEY` — 32-byte hex key for encrypting API keys at rest
- `PLUGIN_JWT_SECRET` — Secret for plugin JWT tokens
- `NEXT_PUBLIC_APP_URL` — Dashboard URL

## Building for Distribution

```bash
npm run release
```

This builds the plugin and creates `cosmikit-figma-plugin.zip` containing `manifest.json` and the `dist/` folder. Upload it as a GitHub Release asset.

## Tech Stack

**Plugin:** TypeScript, Preact, Webpack, Vitest
**Dashboard:** Next.js 14, NextAuth v5, Prisma, Tailwind CSS, PostgreSQL

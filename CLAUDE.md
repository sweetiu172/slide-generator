@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Slide Generator — a browser-based tool for creating PowerPoint presentations. Users compose slides via a form, preview them live, and export to `.pptx`. Built with Next.js + pptxgenjs.

## Deployment

Self-hosted on a VM behind Cloudflare Zero Trust.

- **URL:** https://slide-generator.tuan-lnm.org (requires WARP)
- **TLS:** Wildcard `*.tuan-lnm.org` via Caddy (Let's Encrypt DNS-01), managed by `../gold-price-monitor`
- **Routing:** Caddy reverse proxies `slide-generator.tuan-lnm.org` → `slide-generator:3000`
- **Network:** Joins `gold-price-monitor_frontend_net` as an external Docker network

This repo manages its own `docker-compose.yml` for deployment. The gold-price-monitor stack must be running first (it creates the `frontend_net` network and the Caddy reverse proxy).

## Commands

```bash
# Local development
npm run dev

# Build
npm run build

# Lint
npm run lint

# Production deployment (gold-price-monitor stack must be running first)
docker compose up -d --build

# View logs
docker compose logs -f slide-generator
```

## Deploy Order

```bash
# 1. Start gold-price-monitor (creates frontend_net + Caddy)
cd ../gold-price-monitor && docker compose up -d

# 2. Start slide-generator (joins frontend_net)
cd ../slide-generator && docker compose up -d
```

## Tech Stack

Next.js 16 + React 19 + TypeScript + Tailwind CSS 4 + pptxgenjs.

**Output mode:** Standalone (for Docker). Dockerfile uses multi-stage build with node:20-alpine, runs as non-root user on port 3000.

## Structure

- `src/app/page.tsx` — main page
- `src/components/SlideEntryForm/` — slide content input form
- `src/components/SlidePreview/` — live slide preview
- `src/components/LayoutSelector/` — slide layout picker
- `src/components/ExportControls/` — export to PPTX controls
- `src/lib/pptxExporter.ts` — PowerPoint generation via pptxgenjs
- `src/lib/textSplitter.ts` — text splitting utilities
- `src/lib/types.ts` — shared TypeScript types

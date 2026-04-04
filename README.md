# Slide Generator

A browser-based tool for creating PowerPoint presentations. Compose slides via a form, preview them live, and export to `.pptx`.

**Live:** https://slide-generator.tuan-lnm.org (requires WARP)

## Tech Stack

- **Next.js 16** + React 19 + TypeScript + Tailwind CSS 4
- **pptxgenjs** — PowerPoint file generation
- **react-dropzone** — File upload handling
- **jszip / file-saver** — File packaging and download

## Quick Start

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build
npm run build

# Lint
npm run lint
```

Open http://localhost:3000 to use the app.

## Deployment

Self-hosted on a VM behind Cloudflare Zero Trust. This app joins the [gold-price-monitor](../gold-price-monitor) `frontend_net` Docker network as an external network, where Caddy provides TLS termination with a wildcard `*.tuan-lnm.org` Let's Encrypt certificate.

```bash
# 1. Ensure gold-price-monitor stack is running (creates frontend_net + Caddy)
cd ../gold-price-monitor && docker compose up -d

# 2. Deploy slide-generator (joins frontend_net)
cd ../slide-generator && docker compose up -d --build
```

The `docker-compose.yml` references `gold-price-monitor_frontend_net` as an external network. Caddy (in the gold-price-monitor stack) routes `slide-generator.tuan-lnm.org` to this container on port 3000.

## Project Structure

```
src/
├── app/              — Next.js app router (page, layout, globals)
├── components/
│   ├── SlideEntryForm/   — Slide content input form
│   ├── SlidePreview/     — Live slide preview
│   ├── LayoutSelector/   — Slide layout picker
│   └── ExportControls/   — Export to PPTX controls
├── hooks/            — Custom React hooks
└── lib/
    ├── pptxExporter.ts   — PowerPoint generation
    ├── textSplitter.ts   — Text splitting utilities
    └── types.ts          — Shared TypeScript types
```

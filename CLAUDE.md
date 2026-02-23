# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Architecture

This is a **Next.js App Router** project bootstrapped with `create-next-app`. It is currently in its initial state with minimal customization.

- **Framework**: Next.js with App Router (`app/` directory)
- **Language**: TypeScript (strict mode, path alias `@/*` maps to project root)
- **Styling**: Tailwind CSS v4 via `@tailwindcss/postcss`
- **React**: v19 with Server Components as the default

### Key files

- `app/layout.tsx` — Root layout; sets global metadata and loads Geist fonts via `next/font`
- `app/page.tsx` — Home page (Server Component)
- `app/globals.css` — Global styles; defines `--background`/`--foreground` CSS variables and imports Tailwind
- `next.config.ts` — Minimal Next.js config (typed with `NextConfig`)
- `eslint.config.mjs` — ESLint flat config (v9 format) extending `next/core-web-vitals` and `next/typescript`

# Stack Research

**Domain:** Mobile-first personal utility app (PWA)
**Researched:** 2026-03-05
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| React | 19.2.1 | UI framework | Latest stable (Dec 2025) with Actions API for form handling, simplified async workflows, and optimized performance. React 19 is production-ready with 25-40% fewer re-renders via React Compiler. |
| TypeScript | 5.9.3 | Type safety | Latest stable (Aug 2025) with deferred imports and enhanced developer experience. Critical for catching routing/data errors at compile-time in a solo-dev project. |
| Vite | 7.3.1 | Build tool & dev server | Cold start under 2 seconds, microsecond HMR. For a simple PWA, Vite's speed and lightweight bundle (42KB vs Next.js 92KB) beats Next.js. No backend needed = no SSR needed. |
| Tailwind CSS | 4.0 | Utility-first styling | Stable v4 (Jan 2025) with mobile-first breakpoints, 5x faster builds, and CSS-first configuration. Perfect for rapid mobile UI development without component library bloat. |
| Dexie.js | 4.3.0 | IndexedDB wrapper | Industry-standard IndexedDB abstraction with 438K weekly downloads. Provides promise-based API, versioning, and complex queries. Essential for offline-first contact storage. |
| vite-plugin-pwa | 1.2.0 | PWA capabilities | Zero-config PWA with Workbox integration. Generates service workers for offline support, caching strategies, and installability. Requires Vite 5+. |
| React Router | 7.13.1 | Client-side routing | Latest stable (Mar 2026) with simplified package structure and non-breaking v6→v7 upgrade path. For simple apps, React Router's maturity beats TanStack Router's complexity. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-hook-form | 7.x | Form state management | For the quick entry form. Minimal re-renders, built-in validation, works seamlessly with React 19's Actions API. |
| Fuse.js | 7.x | Fuzzy search | For context/name search functionality. Lightweight (2KB gzipped), client-side only, perfect for low-volume data (1-10 names/month). |
| clsx | 2.x | Conditional CSS classes | For dynamic Tailwind class composition. Tiny utility for mobile-friendly UI states (active/learned/etc.). |
| date-fns | 3.x | Date formatting | ONLY if you add timestamp display later. Modular (import only what you need). Currently out of scope per PROJECT.md. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Vite DevTools | Inspect component tree, performance | Built into Vite, no config needed |
| TypeScript ESLint | Code quality & type checking | Use `@typescript-eslint/recommended` for basic safety |
| Prettier | Code formatting | Standard config, integrate with editor |
| Vitest | Unit testing | Built into Vite ecosystem, fast, uses same config as Vite |

## Installation

```bash
# Initialize project
npm create vite@latest namehelpr -- --template react-ts

# Core dependencies
npm install react@19.2.1 react-dom@19.2.1
npm install react-router@7.13.1
npm install dexie@4.3.0

# PWA support
npm install -D vite-plugin-pwa@1.2.0
npm install -D workbox-window

# Styling
npm install -D tailwindcss@4.0 postcss autoprefixer
npm install clsx

# Forms & search
npm install react-hook-form
npm install fuse.js

# Dev dependencies
npm install -D @typescript-eslint/eslint-plugin @typescript-eslint/parser
npm install -D eslint prettier
npm install -D vitest @vitest/ui
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Vite | Next.js | If you need SEO (public content), server-side rendering, or API routes. This app is local-first with no backend = Vite wins. |
| React Router | TanStack Router | If you have complex type-safe routing needs, integrated data fetching/caching, or a large TypeScript-heavy team. Overkill for a 5-route personal app. |
| Dexie.js | idb (Jake Archibald) | If you want minimal abstraction over native IndexedDB. Dexie's query syntax and versioning are worth the extra 10KB for maintainability. |
| Tailwind CSS | Mantine/Chakra UI | If you want pre-built components with accessibility baked in. Tailwind gives you full control for custom mobile UX without component library opinions. |
| Fuse.js | Native string.includes() | If search is exact-match only. Fuse.js adds fuzzy matching ("Pauls Party" finds "Paul's Party") for 2KB—worth it. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Create React App | Deprecated, uses Webpack (slow), no longer maintained by React team as of 2023 | Vite (official React docs recommend it) |
| localForage | Abstracts IndexedDB/WebSQL/localStorage—unnecessary complexity for IndexedDB-only app | Dexie.js (purpose-built for IndexedDB) |
| Redux/Zustand | Global state overkill for local CRUD app. React Router + Dexie handle all state needs. | React Context (if needed) or lift state |
| Sass/Less | Tailwind's utility classes cover 95% of styling needs. Preprocessors add build complexity for no gain. | Tailwind CSS + CSS custom properties |
| Onsen UI/Framework7 | Mobile component libraries with heavy opinions and custom styling. Hard to customize for personal UX. | Tailwind CSS for full control |
| RxDB | 10x heavier than Dexie, designed for real-time sync with backends. Way over-engineered for offline-only app. | Dexie.js |

## Stack Patterns by Variant

**If you need backend sync later:**
- Add tRPC or REST API client
- Use Dexie's sync patterns (manual merge conflict resolution)
- Consider upgrading to RxDB for automatic replication (but wait until proven need)

**If you add photo support (currently out of scope):**
- Store as base64 blobs in IndexedDB (Dexie supports binary data)
- Or use File System Access API + Dexie for file references
- Keep photos under 500KB each to avoid IndexedDB performance issues

**If targeting iOS Safari specifically:**
- Test PWA install flow (iOS Safari has quirks with standalone mode)
- Use `display: standalone` media query for iOS-specific UI adjustments
- Note: iOS requires 180x180 apple-touch-icon for install

**If you want native mobile later:**
- Consider React Native with shared business logic
- Dexie works in React Native via polyfills
- Or use Capacitor to wrap PWA as native app (simpler)

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| vite-plugin-pwa@1.2.0 | Vite 5.x, 6.x, 7.x | Requires Vite 5+ and Node 16+ (Workbox v7 dependency) |
| React 19.2.1 | TypeScript 5.9+ | React 19 requires TypeScript 5.1+ for proper type inference |
| Tailwind CSS 4.0 | Safari 16.4+, Chrome 111+, Firefox 128+ | Uses modern CSS (cascade layers, @property). No IE11 support. |
| Dexie.js 4.3.0 | All modern browsers | IndexedDB available in all browsers since 2015. No polyfills needed for target platform (mobile). |
| React Router 7.13.1 | React 18+ | v7 requires React 18, Node 20+. Non-breaking from v6 if future flags enabled. |

## Sources

### Official Documentation (HIGH confidence)
- [React Versions](https://react.dev/versions) — Verified React 19.2.1 latest stable
- [Vite Releases](https://vite.dev/releases) — Confirmed Vite 7.3.1 current version
- [vite-plugin-pwa GitHub](https://github.com/vite-pwa/vite-plugin-pwa) — Version 1.2.0 requirements
- [Tailwind CSS v4.0 Blog](https://tailwindcss.com/blog/tailwindcss-v4) — v4 stable release Jan 2025
- [TypeScript Release Notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-9.html) — TypeScript 5.9 features

### Ecosystem Research (MEDIUM confidence)
- [Vite vs Next.js 2025 Comparison](https://strapi.io/blog/vite-vs-nextjs-2025-developer-framework-comparison) — Performance benchmarks
- [React Router vs TanStack Router Comparison](https://betterstack.com/community/comparisons/tanstack-router-vs-react-router/) — Architectural differences
- [IndexedDB Libraries Comparison](https://npm-compare.com/dexie,idb,localforage) — Download stats and feature comparison
- [Top React UI Libraries 2025](https://www.supernova.io/blog/top-10-pre-built-react-frontend-ui-libraries-for-2025) — Mobile-first library evaluation

### Best Practices (MEDIUM confidence)
- [PWA Best Practices MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Best_practices) — Offline-first patterns
- [React PWA 2025 Guide](https://void.ma/en/publications/pwa-progressive-web-app-guide-complet-react-2025/) — Service worker strategies
- [Tailwind Mobile-First Design](https://dev.to/hitesh_developer/20-tips-for-designing-mobile-first-with-tailwind-css-36km) — Responsive patterns

---
*Stack research for: Mobile-first personal utility app (NameHelpr)*
*Researched: 2026-03-05*

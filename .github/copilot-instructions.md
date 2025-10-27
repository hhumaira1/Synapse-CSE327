# SynapseCRM - AI Coding Assistant Instructions

## Project Overview
SynapseCRM is a Next.js 16 CRM application built with React 19, TypeScript, and Tailwind CSS v4. This is an early-stage project using the App Router architecture with modern Next.js conventions.

## Tech Stack & Key Dependencies
- **Framework**: Next.js 16.0.0 (App Router)
- **UI**: React 19.2.0, Tailwind CSS 4 (PostCSS plugin-based)
- **Language**: TypeScript 5 (strict mode enabled)
- **Fonts**: Geist Sans & Geist Mono (via next/font/google)
- **Linting**: ESLint 9 with Next.js core-web-vitals and TypeScript configs

## Project Structure
```
src/app/              # App Router pages and layouts
  layout.tsx          # Root layout with font configuration
  page.tsx            # Home page component
  globals.css         # Global styles with Tailwind imports
public/               # Static assets (SVG icons)
```

## Development Workflow

### Running the Application
```bash
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Production build
npm start            # Start production server
npm run lint         # Run ESLint
```

### TypeScript Configuration
- Path alias: `@/*` maps to `./src/*`
- Strict mode enabled with React 19's new JSX transform (`jsx: "react-jsx"`)
- Module resolution: `bundler` (Next.js optimized)

## Code Conventions & Patterns

### Component Structure
- Use TypeScript with `.tsx` extension for React components
- Export default function components (see `page.tsx`, `layout.tsx`)
- Use `Readonly<{}>` for prop types with immutable children
- Prefer arrow function syntax for inline event handlers

### Styling Approach
- **Tailwind CSS 4**: Uses new `@import "tailwindcss"` syntax in `globals.css`
- **CSS Variables**: Define theme tokens in `:root` and `@theme inline` blocks
- **Dark Mode**: System preference-based via `@media (prefers-color-scheme: dark)`
- **Utility-first**: Apply Tailwind classes directly in JSX (no CSS modules observed)
- **Custom properties**: Use `--font-geist-sans` and `--font-geist-mono` variables

### Font Loading Pattern
```tsx
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
// Apply in body: className={`${geistSans.variable} ...`}
```

### Metadata Convention
Export `metadata` object from `layout.tsx` for SEO (Next.js App Router pattern):
```tsx
export const metadata: Metadata = {
  title: "...",
  description: "...",
};
```

## ESLint Configuration
- Uses flat config format (`eslint.config.mjs`)
- Extends `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- Ignores: `.next/`, `out/`, `build/`, `next-env.d.ts`

## Important Notes
- **React 19**: Uses latest React features; ensure compatibility when adding libraries
- **Tailwind 4**: New PostCSS-based architecture (different from v3)
- **No API routes yet**: Project structure suggests frontend-focused development initially
- **No state management**: Currently using React built-ins (no Redux/Zustand detected)

## When Adding New Features
1. Create new routes as directories under `src/app/` (App Router convention)
2. Use Server Components by default; add `"use client"` only when needed
3. Import from `@/` for src-relative imports (e.g., `import { X } from "@/components/Y"`)
4. Follow existing Tailwind dark mode pattern with `dark:` prefix
5. Keep responsive design with mobile-first approach (see `sm:`, `md:` breakpoints in `page.tsx`)

## External References
- Project documents: `prd 327.pdf`, `IMplementaion details.docx` (refer for requirements)
- Next.js 16 App Router: https://nextjs.org/docs
- Tailwind CSS 4: https://tailwindcss.com/docs/v4-beta

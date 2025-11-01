// Next.js 16 proxy.ts - delegates to middleware.ts for Clerk compatibility
// Clerk v6 expects middleware.ts in src/ directory, so we keep both files
export { default } from './src/middleware'
export { config } from './src/middleware'
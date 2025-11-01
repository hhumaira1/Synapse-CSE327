import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Clerk v6 middleware in the expected location (src/middleware.ts)
// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/portal/accept-invite(.*)',
])

// Clerk v6 with Next.js 16 compatibility
export default clerkMiddleware(async (auth, req) => {
  // Protect routes that aren't public
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
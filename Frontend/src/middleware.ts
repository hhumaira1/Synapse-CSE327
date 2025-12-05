import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes - redirect to signin if not authenticated
  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/auth') &&
    !request.nextUrl.pathname.startsWith('/portal') &&
    request.nextUrl.pathname !== '/'
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/signin';
    return NextResponse.redirect(url);
  }

  // Check if user is a super admin
  let isSuperAdmin = false;
  if (user) {
    try {
      // Use the backend URL - middleware needs explicit URL
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (token) {
        console.log('🔍 Middleware: Checking super admin status...', { apiUrl });
        const response = await fetch(`${apiUrl}/super-admin/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          cache: 'no-store',
        });

        console.log('🔍 Middleware: Super admin check response:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          isSuperAdmin = !!data; // If endpoint returns data, user is super admin
          console.log('✅ Middleware: User IS super admin');
        } else {
          console.log('❌ Middleware: User is NOT super admin');
        }
      }
    } catch (error) {
      console.error('❌ Middleware error checking super admin status:', error);
    }
  }

  // Super admin route protection
  if (user) {
    const pathname = request.nextUrl.pathname;
    const isSuperAdminRoute = pathname.startsWith('/super-admin');
    const isTenantRoute = pathname.startsWith('/dashboard') || 
                          pathname.startsWith('/contacts') || 
                          pathname.startsWith('/deals') || 
                          pathname.startsWith('/leads') || 
                          pathname.startsWith('/tickets') || 
                          pathname.startsWith('/analytics') ||
                          pathname.startsWith('/select-workspace') ||
                          pathname.startsWith('/onboard') ||
                          pathname.startsWith('/profile') ||
                          pathname.startsWith('/settings');

    if (isSuperAdmin && isTenantRoute) {
      // Super admin trying to access tenant routes - redirect to super admin dashboard
      console.log('🔒 Super admin blocked from tenant route:', pathname);
      const url = request.nextUrl.clone();
      url.pathname = '/super-admin';
      return NextResponse.redirect(url);
    }

    if (!isSuperAdmin && isSuperAdminRoute) {
      // Regular user trying to access super admin routes - redirect to dashboard
      console.log('🔒 Regular user blocked from super admin route:', pathname);
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }

    // Redirect authenticated users from signin page
    if (pathname.startsWith('/auth/signin')) {
      const url = request.nextUrl.clone();
      url.pathname = isSuperAdmin ? '/super-admin' : '/dashboard';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
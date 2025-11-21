/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUserStatus } from '@/hooks/useUserStatus';
import { useApiClient } from '@/lib/api';
import { useUser, useAuth } from '@/hooks/useUser';
import { Button } from '@/components/ui/button';
import { Toaster } from 'react-hot-toast';
import { 
  LayoutDashboard, 
  Users, 
  TrendingUp, 
  DollarSign, 
  Ticket,
  Settings,
  BarChart3,
  Workflow,
  Store,
  Phone,
  LogOut,
  User as UserIcon
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Contacts', href: '/contacts', icon: Users },
  { name: 'Pipelines', href: '/pipelines', icon: Workflow },
  { name: 'Leads', href: '/leads', icon: TrendingUp },
  { name: 'Deals', href: '/deals', icon: DollarSign },
  { name: 'Tickets', href: '/tickets', icon: Ticket },
  { name: 'Calls', href: '/calls', icon: Phone },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const apiClient = useApiClient();
  const { isLoaded, isSignedIn, needsOnboarding, userExists, user, error } = useUserStatus();
  const { user: supabaseUser } = useUser();
  const { signOut } = useAuth();
  const [hasPortalAccess, setHasPortalAccess] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  // Check authentication and route accordingly
  useEffect(() => {
    const checkAccessAndRoute = async () => {
      if (!isLoaded) return;

      if (!isSignedIn) {
        router.push('/sign-in');
        return;
      }
      
      try {
        // Fetch all accessible tenants (internal + portal)
        const response = await apiClient.get('/users/my-tenants');
        const tenants = response.data;
        
        if (!tenants || tenants.length === 0) {
          // No access at all - needs onboarding
          console.log('No tenant access, redirecting to onboarding...');
          router.push('/onboard');
          return;
        }
        
        // Check access types
        const hasInternal = tenants.some((t: { type: string }) => t.type === 'internal');
        const hasPortal = tenants.some((t: { type: string }) => t.type === 'customer');
        
        setHasPortalAccess(hasPortal);
        
        // If trying to access dashboard but only has portal access
        if (!hasInternal && hasPortal) {
          console.log('Portal-only customer accessing dashboard, redirecting to portal...');
          router.push('/portal/dashboard');
          return;
        }
        
        // User has internal access - allow dashboard access
        // (If they have both internal + portal, they stay on dashboard)
        
      } catch (error) {
        console.error('Error checking tenant access:', error);
        // If error and user doesn't exist, go to onboarding
        if (needsOnboarding && !userExists) {
          router.push('/onboard');
        }
      }
    };

    checkAccessAndRoute();
  }, [isLoaded, isSignedIn, needsOnboarding, userExists, apiClient, router]);

  // Show loading state while checking authentication and user status
  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">
            {!isLoaded ? 'Loading...' : 
             !isSignedIn ? 'Redirecting to sign in...' : 
             'Loading dashboard...'}
          </p>
        </div>
      </div>
    );
  }

  // User has no internal CRM access - redirect handled in useEffect
  if (needsOnboarding && !userExists) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Checking access...</p>
        </div>
      </div>
    );
  }

  // Show error state if there's an API error
  if (error && !userExists) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">We couldn&apos;t verify your account. Please try again.</p>
          <button 
            onClick={() => router.push('/onboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Complete Setup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Synapse CRM
          </h1>
          <p className="text-sm text-gray-500 mt-1">Internal Dashboard</p>
        </div>

        {/* User Profile Section */}
        <div className="p-4 border-b border-gray-200 bg-white relative">
          <div 
            className="flex items-center gap-3 px-2 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors p-2"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="h-10 w-10 rounded-full bg-linear-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white font-semibold">
              {(supabaseUser?.user_metadata?.firstName?.[0] || supabaseUser?.email?.[0] || 'U').toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {supabaseUser?.user_metadata?.firstName && supabaseUser?.user_metadata?.lastName 
                  ? `${supabaseUser.user_metadata.firstName} ${supabaseUser.user_metadata.lastName}`
                  : supabaseUser?.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-xs text-gray-500">
                {user && typeof user === 'object' && 'role' in user ? (user as any).role : 'Member'}
              </p>
            </div>
          </div>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <div className="absolute top-full left-4 right-4 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              <div className="p-2">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 mt-6 px-3">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium mb-1 transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-900">
              {navigation.find(item => pathname === item.href)?.name || 'Dashboard'}
            </h2>
            <div className="flex items-center gap-4">
              {hasPortalAccess && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/select-workspace')}
                    className="flex items-center gap-2"
                  >
                    <Store className="h-4 w-4" />
                    Switch Workspace
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/portal/dashboard')}
                    className="flex items-center gap-2"
                  >
                    <Store className="h-4 w-4" />
                    Customer Portal
                  </Button>
                </div>
              )}
              <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

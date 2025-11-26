"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useAuth } from '@/hooks/useUser';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  Building, 
  Ticket, 
  MessageSquare, 
  Plus,
  ArrowLeft,
  Users,
  LayoutDashboard,
  Phone
} from 'lucide-react';
import { useApiClient } from '@/lib/api';
import { useUserStatus } from '@/hooks/useUserStatus';
import toast from 'react-hot-toast';
import { AgentSelector } from '@/components/voip';

interface PortalAccess {
  id: string;
  isActive: boolean;
  createdAt: string;
  tenant: {
    id: string;
    name: string;
  };
  contact: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    company?: string;
  };
}

export default function PortalDashboardPage() {
  const router = useRouter();
  const { user, isSignedIn, isLoading } = useUser();
  const { signOut } = useAuth();
  const { isLoaded: userStatusLoaded, userExists } = useUserStatus();
  const apiClient = useApiClient();
  
  const [loading, setLoading] = useState(true);
  const [portalAccess, setPortalAccess] = useState<PortalAccess[]>([]);
  const [hasWorkspace, setHasWorkspace] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Voice calling state (for portal customers receiving calls)
  const [incomingCallData, setIncomingCallData] = useState<{
    callId: string;
    callerId: string;
    callerName: string;
    contactPhone: string;
  } | null>(null);

  // Get first portal access for tenantId and contactId
  const firstAccess = portalAccess[0];
  

  const fetchPortalAccess = useCallback(async () => {
    try {
      setLoading(true);
      // Get portal customer records for this user
      const response = await apiClient.get('/portal/customers/my-access');
      setPortalAccess(response.data);
    } catch (error) {
      console.error('Failed to fetch portal access:', error);
      toast.error('Failed to load portal access');
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    if (!isLoading && !isSignedIn) {
      router.push('/auth/signin?redirect_url=/portal/dashboard');
      return;
    }

    if (!isLoading && isSignedIn) {
      fetchPortalAccess();
    }
  }, [isLoading, isSignedIn, router, fetchPortalAccess]);

  // Check if user has workspace
  useEffect(() => {
    if (userStatusLoaded) {
      setHasWorkspace(userExists);
    }
  }, [userStatusLoaded, userExists]);

  if (isLoading || loading || !userStatusLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!isSignedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Home
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Customer Portal</h1>
                <p className="text-sm text-gray-600">View your vendor communications and support</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Call Support Button */}
              <AgentSelector variant="outline" size="default">
                <Button
                  variant="outline"
                  className="border-green-600 text-green-600 hover:bg-green-50"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call Support
                </Button>
              </AgentSelector>
              
              {/* Context Switcher */}
              {hasWorkspace && (
                <Button
                  variant="outline"
                  onClick={() => router.push('/select-workspace')}
                  className="border-indigo-600 text-indigo-600 hover:bg-indigo-50"
                >
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Switch Workspace
                </Button>
              )}
              
              {!hasWorkspace && (
                <Button
                  onClick={() => router.push('/onboard')}
                  className="bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                >
                  <Building className="h-4 w-4 mr-2" />
                  Create Workspace
                </Button>
              )}
              
              {/* Custom User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="h-10 w-10 rounded-full bg-linear-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white font-semibold text-sm hover:shadow-lg transition-shadow"
                >
                  {(user?.user_metadata?.firstName?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                    <div className="p-2">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user?.user_metadata?.firstName && user?.user_metadata?.lastName 
                            ? `${user.user_metadata.firstName} ${user.user_metadata.lastName}`
                            : user?.email?.split('@')[0] || 'User'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      </div>
                      <button
                        onClick={async () => {
                          await signOut();
                          router.push('/');
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-2"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {portalAccess.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Building className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                No Portal Access Yet
              </h2>
              <p className="text-gray-600 mb-6">
                You haven&apos;t been invited to any customer portals yet.
              </p>
              <div className="max-w-md mx-auto space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                  <h3 className="font-semibold text-blue-900 mb-2">What is Customer Portal?</h3>
                  <p className="text-sm text-blue-800">
                    When companies using SynapseCRM invite you as a customer, you&apos;ll get portal access to:
                  </p>
                  <ul className="text-sm text-blue-800 mt-2 space-y-1 ml-4 list-disc">
                    <li>View and create support tickets</li>
                    <li>Communicate with your vendors</li>
                    <li>Track your interactions and history</li>
                  </ul>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 mb-4">
                    Want to manage your own business with SynapseCRM?
                  </p>
                  <Button
                    onClick={() => router.push('/onboard')}
                    className="bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  >
                    <Building className="h-4 w-4 mr-2" />
                    Create Your Workspace
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Building className="h-8 w-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Vendor Portals</p>
                      <p className="text-2xl font-bold text-gray-900">{portalAccess.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Ticket className="h-8 w-8 text-indigo-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Open Tickets</p>
                      <p className="text-2xl font-bold text-gray-900">
                        <span className="text-sm text-gray-500">Coming Soon</span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <MessageSquare className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Messages</p>
                      <p className="text-2xl font-bold text-gray-900">
                        <span className="text-sm text-gray-500">Coming Soon</span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-orange-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Active Since</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {new Date(portalAccess[0]?.createdAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          year: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Portal Access List */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Your Vendor Portals</h2>
                    <p className="text-sm text-gray-600">Companies you have portal access to</p>
                  </div>
                  <Badge variant="default" className="bg-green-600">
                    {portalAccess.length} Active
                  </Badge>
                </div>

                <div className="space-y-4">
                  {portalAccess.map((access) => (
                    <div
                      key={access.id}
                      className="flex items-center justify-between p-5 border border-gray-200 rounded-lg hover:shadow-lg hover:border-indigo-300 transition-all duration-200"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-indigo-100">
                          <Building className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg">
                            {access.tenant.name}
                          </h3>
                          <div className="flex items-center gap-4 mt-1">
                            <p className="text-sm text-gray-600">
                              {access.contact.email}
                            </p>
                            {access.contact.company && (
                              <>
                                <span className="text-gray-300">•</span>
                                <p className="text-sm text-gray-600">
                                  {access.contact.company}
                                </p>
                              </>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Member since {new Date(access.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="bg-green-600">
                          <div className="w-2 h-2 bg-white rounded-full mr-1.5" />
                          Active
                        </Badge>
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled
                          title="Coming soon: View tickets and messages"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Messages
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => router.push('/portal/tickets')}
                        >
                          <Ticket className="h-4 w-4 mr-2" />
                          Tickets
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                  <div className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start h-auto py-4"
                      onClick={() => router.push('/portal/tickets')}
                    >
                      <Plus className="h-5 w-5 mr-3 text-indigo-600" />
                      <div className="text-left">
                        <p className="font-medium">Create Support Ticket</p>
                        <p className="text-xs text-gray-500">Submit a request to your vendor</p>
                      </div>
                    </Button>

                    <Button 
                      variant="outline" 
                      className="w-full justify-start h-auto py-4"
                      disabled
                    >
                      <MessageSquare className="h-5 w-5 mr-3 text-green-600" />
                      <div className="text-left">
                        <p className="font-medium">Send Message</p>
                        <p className="text-xs text-gray-500">Contact your vendor directly</p>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Grow Your Business</h2>
                  <div className="space-y-3">
                    {!hasWorkspace && (
                      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                        <h3 className="font-semibold text-indigo-900 mb-2">
                          Start Using SynapseCRM
                        </h3>
                        <p className="text-sm text-indigo-800 mb-4">
                          Create your own workspace to manage customers, deals, and grow your business.
                        </p>
                        <Button
                          onClick={() => router.push('/onboard')}
                          className="w-full bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                        >
                          <Building className="h-4 w-4 mr-2" />
                          Create Workspace
                        </Button>
                      </div>
                    )}
                    
                    {hasWorkspace && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h3 className="font-semibold text-green-900 mb-2">
                          You Have a Workspace!
                        </h3>
                        <p className="text-sm text-green-800 mb-4">
                          Switch to your workspace to manage your business.
                        </p>
                        <Button
                          onClick={() => router.push('/dashboard')}
                          variant="outline"
                          className="w-full border-green-600 text-green-700 hover:bg-green-50"
                        >
                          <LayoutDashboard className="h-4 w-4 mr-2" />
                          Go to My Workspace
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Help Section */}
            <Card className="bg-linear-to-r from-indigo-50 to-purple-50 border-indigo-200">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white rounded-lg">
                    <MessageSquare className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
                    <p className="text-sm text-gray-700 mb-4">
                      If you have questions about your portal access or need support, use the &quot;Call Support&quot; button above to connect with an agent.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="default" className="bg-green-600">✓ VoIP Calling Active</Badge>
                      <Badge variant="secondary">Feature Coming Soon: Live Chat</Badge>
                      <Badge variant="secondary">Feature Coming Soon: Ticket System</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
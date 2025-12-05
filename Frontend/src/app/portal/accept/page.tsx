"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, Building } from 'lucide-react';
import { useApiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface InvitationDetails {
  id: string;
  isActive: boolean;
  alreadyAccepted: boolean;
  contact: {
    firstName: string;
    lastName: string;
    email: string;
  };
  tenant: {
    name: string;
  };
}

function AcceptInvitationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isSignedIn, isLoading } = useUser();
  const apiClient = useApiClient();
  
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const token = searchParams?.get('token');
  const userId = user?.id;

  // Fetch invitation details
  useEffect(() => {
    const fetchInvitation = async () => {
      if (!token) {
        setError('Invalid invitation link - no token provided');
        setLoading(false);
        return;
      }

      try {
        const response = await apiClient.get(`/portal/customers/invitation/${token}`);
        setInvitation(response.data);
        
        if (response.data.alreadyAccepted) {
          setError('This invitation has already been accepted');
        } else if (!response.data.isActive) {
          setError('This invitation has expired or been deactivated');
        }
      } catch (err) {
        console.error('Failed to fetch invitation:', err);
        setError('Invalid or expired invitation link');
      } finally {
        setLoading(false);
      }
    };

    fetchInvitation();
  }, [token, apiClient]);

  const handleAccept = async () => {
    if (!token || !invitation) return;

    setAccepting(true);
    const loadingToast = toast.loading('Activating your portal access...');

    try {
      await apiClient.post(`/portal/customers/link/${token}`, {});
      toast.success('Welcome to the portal!', { id: loadingToast });
      
      // Redirect to portal dashboard
      setTimeout(() => {
        router.push('/portal/dashboard');
      }, 1500);
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      const errorMsg = apiError?.response?.data?.message || 'Failed to accept invitation';
      toast.error(errorMsg, { id: loadingToast });
      setError(errorMsg);
      setAccepting(false);
    }
  };

  // Auto-accept if user is signed in
  useEffect(() => {
    const autoAccept = async () => {
      if (isLoading || !token || !invitation || accepting || error) return;
      
      if (isSignedIn && userId && invitation.isActive && !invitation.alreadyAccepted) {
        await handleAccept();
      }
    };

    autoAccept();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isSignedIn, userId, invitation, token, accepting, error]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-12 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-12 text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invitation</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button 
              onClick={() => router.push('/')}
              className="bg-linear-to-r from-indigo-600 to-purple-600"
            >
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (accepting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-12 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Activating Portal Access</h2>
            <p className="text-gray-600">Please wait while we set up your account...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building className="h-8 w-8 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Portal Invitation</h1>
            <p className="text-gray-600">
              You&apos;ve been invited to access the customer portal
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3 mb-4">
              <Building className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500">Company</p>
                <p className="text-gray-900 font-semibold">{invitation.tenant.name}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500">Your Details</p>
                <p className="text-gray-900">
                  {invitation.contact.firstName} {invitation.contact.lastName}
                </p>
                <p className="text-sm text-gray-600">{invitation.contact.email}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {!isSignedIn ? (
              <>
                <p className="text-sm text-gray-600 text-center mb-4">
                  Please sign in or create an account to access the portal
                </p>
                <Link href={`/auth/signin?redirect_url=/portal/accept?token=${token}`}>
                  <Button
                    className="w-full bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  >
                    Sign In to Accept
                  </Button>
                </Link>
                <Link href={`/auth/signup?redirect_url=/portal/accept?token=${token}`}>
                  <Button
                    variant="outline"
                    className="w-full"
                  >
                    Create Account
                  </Button>
                </Link>
              </>
            ) : (
              <Button
                onClick={handleAccept}
                disabled={accepting}
                className="w-full bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                {accepting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Activating...
                  </>
                ) : (
                  'Accept Invitation'
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Card className="w-full max-w-md">
            <CardContent className="p-12 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading...</p>
            </CardContent>
          </Card>
        </div>
      }
    >
      <AcceptInvitationContent />
    </Suspense>
  );
}

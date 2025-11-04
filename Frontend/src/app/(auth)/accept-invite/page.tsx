"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser, useSignUp } from "@clerk/nextjs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Building2,
  Mail,
  Shield,
} from "lucide-react";
import { useApiClient } from "@/lib/api";

interface InvitationDetails {
  email: string;
  role: string;
  tenantName: string;
  expiresAt: string;
}

function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoaded, isSignedIn, user } = useUser();
  const { signUp } = useSignUp();
  const apiClient = useApiClient(); // Use the hook to get authenticated client
  const [token, setToken] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    setToken(tokenParam);
  }, [searchParams]);

  useEffect(() => {
    if (token && isLoaded && isSignedIn) {
      acceptInvitation();
    }
  }, [token, isLoaded, isSignedIn]);

  const acceptInvitation = async () => {
    if (!token) return;

    try {
      setAccepting(true);
      setError(null);

      const response = await apiClient.post(`/users/accept-invite/${token}`);

      setSuccess(true);
      setTimeout(() => {
        router.push("/select-tenant");
      }, 2000);
    } catch (err: any) {
      console.error("Error accepting invitation:", err);
      setError(
        err.response?.data?.message ||
          "Failed to accept invitation. The link may be expired or invalid."
      );
    } finally {
      setAccepting(false);
      setLoading(false);
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Verifying invitation...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <Card className="p-8 max-w-md w-full text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Link</h1>
          <p className="text-gray-600 mb-6">
            This invitation link is invalid or missing the required token.
          </p>
          <Button onClick={() => router.push("/")}>Go to Home</Button>
        </Card>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <Card className="p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="p-3 rounded-full bg-indigo-100 w-fit mx-auto mb-4">
              <Mail className="h-8 w-8 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Team Invitation
            </h1>
            <p className="text-gray-600">
              You&apos;ve been invited to join a workspace on SynapseCRM
            </p>
          </div>

          <div className="space-y-4">
            <Button
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              onClick={() => router.push(`/sign-in?redirect_url=/accept-invite?token=${token}`)}
            >
              Sign In to Accept
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Don&apos;t have an account?
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push(`/sign-up?redirect_url=/accept-invite?token=${token}`)}
            >
              Create Account
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <Card className="p-8 max-w-md w-full text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Invitation Accepted!
          </h1>
          <p className="text-gray-600 mb-6">
            Welcome to the team! Redirecting you to your workspace...
          </p>
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600 mx-auto" />
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <Card className="p-8 max-w-md w-full text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Unable to Accept Invitation
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => router.push("/")}>Go to Home</Button>
        </Card>
      </div>
    );
  }

  if (accepting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Accepting invitation...</p>
        </div>
      </div>
    );
  }

  return null;
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      }
    >
      <AcceptInviteContent />
    </Suspense>
  );
}

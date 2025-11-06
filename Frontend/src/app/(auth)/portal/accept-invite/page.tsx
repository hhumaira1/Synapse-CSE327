/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  HeadphonesIcon,
  Mail,
} from "lucide-react";
import { useApiClient } from "@/lib/api";

function AcceptPortalInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoaded, isSignedIn } = useUser();
  const apiClient = useApiClient(); // Use the hook to get authenticated client
  const [token, setToken] = useState<string | null>(null);
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
    } else if (isLoaded && !isSignedIn && token) {
      setLoading(false);
    }
  }, [token, isLoaded, isSignedIn]);

  const acceptInvitation = async () => {
    if (!token) return;

    try {
      setAccepting(true);
      setError(null);

      const response = await apiClient.post(
        `/portal/customers/link/${token}`
      );

      setSuccess(true);
      setTimeout(() => {
        router.push("/portal");
      }, 2000);
    } catch (err: any) {
      console.error("Error accepting portal invitation:", err);
      setError(
        err.response?.data?.message ||
          "Failed to activate portal access. The link may be expired or invalid."
      );
    } finally {
      setAccepting(false);
      setLoading(false);
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Verifying portal access...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50 p-4">
        <Card className="p-8 max-w-md w-full text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Invalid Link
          </h1>
          <p className="text-gray-600 mb-6">
            This portal access link is invalid or missing the required token.
          </p>
          <Button onClick={() => router.push("/")}>Go to Home</Button>
        </Card>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50 p-4">
        <Card className="p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="p-3 rounded-full bg-blue-100 w-fit mx-auto mb-4">
              <HeadphonesIcon className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Customer Portal Access
            </h1>
            <p className="text-gray-600">
              You&apos;ve been invited to access the customer portal
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">
              What you can do:
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• View and manage your support tickets</li>
              <li>• Submit new support requests</li>
              <li>• Track ticket status and updates</li>
              <li>• Communicate with the support team</li>
            </ul>
          </div>

          <div className="space-y-4">
            <Button
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              onClick={() =>
                router.push(
                  `/sign-in?redirect_url=/portal/accept-invite?token=${token}`
                )
              }
            >
              Sign In to Access Portal
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
              onClick={() =>
                router.push(
                  `/sign-up?redirect_url=/portal/accept-invite?token=${token}`
                )
              }
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50 p-4">
        <Card className="p-8 max-w-md w-full text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Portal Access Activated!
          </h1>
          <p className="text-gray-600 mb-6">
            Welcome! Redirecting you to the customer portal...
          </p>
          <Loader2 className="h-6 w-6 animate-spin text-blue-600 mx-auto" />
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50 p-4">
        <Card className="p-8 max-w-md w-full text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Unable to Activate Portal Access
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => router.push("/")}>Go to Home</Button>
        </Card>
      </div>
    );
  }

  if (accepting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Activating portal access...</p>
        </div>
      </div>
    );
  }

  return null;
}

export default function AcceptPortalInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <AcceptPortalInviteContent />
    </Suspense>
  );
}

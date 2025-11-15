"use client";

import { ReactNode, useEffect } from "react";
import { useUser } from "@/hooks/useUser";
import { useRouter } from "next/navigation";

export default function OnboardLayout({ children }: { children: ReactNode }) {
  const { isSignedIn, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isSignedIn) {
      // Redirect to sign-in if not authenticated
      router.push("/auth/signin");
    }
  }, [isLoading, isSignedIn, router]);

  if (isLoading || !isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

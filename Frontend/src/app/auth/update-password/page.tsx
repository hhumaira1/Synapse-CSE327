"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

export default function UpdatePasswordPage() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();

    // Verify the recovery token on mount
    useEffect(() => {
        const checkToken = async () => {
            const code = searchParams.get("code");

            if (!code) {
                setError("Invalid or missing recovery code");
                return;
            }

            // Supabase automatically handles the token exchange when user lands on this page
            // We just need to verify there's a session
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            if (sessionError || !session) {
                setError("Invalid or expired recovery link. Please request a new password reset.");
            }
        };

        checkToken();
    }, [searchParams, supabase.auth]);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Validate passwords match
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        // Validate password strength
        if (password.length < 8) {
            setError("Password must be at least 8 characters long");
            setLoading(false);
            return;
        }

        try {
            const { error } = await supabase.auth.updateUser({
                password: password,
            });

            if (error) throw error;

            setSuccess(true);

            // Redirect to sign in page after 2 seconds
            setTimeout(() => {
                router.push("/auth/signin");
            }, 2000);
        } catch (err: any) {
            setError(err.message || "Failed to update password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#6366f1] via-[#8b5cf6] to-[#a855f7] p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold">Update Password</CardTitle>
                    <CardDescription>
                        Enter your new password below
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                        {error && (
                            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">
                                Password updated successfully! Redirecting to sign in...
                            </div>
                        )}

                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm font-medium">
                                New Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                minLength={8}
                                disabled={success || !!error}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#6366f1] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 disabled:opacity-50"
                            />
                            <p className="text-xs text-gray-500">
                                Must be at least 8 characters long
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="confirmPassword" className="text-sm font-medium">
                                Confirm Password
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                minLength={8}
                                disabled={success || !!error}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#6366f1] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 disabled:opacity-50"
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={loading || success || !!error}
                            className="w-full bg-gradient-to-r from-[#6366f1] to-[#a855f7] text-white hover:opacity-90"
                        >
                            {loading ? "Updating..." : success ? "Password Updated!" : "Update Password"}
                        </Button>

                        <div className="text-center text-sm text-gray-600">
                            <Link
                                href="/auth/signin"
                                className="font-medium text-[#6366f1] hover:underline"
                            >
                                Back to Sign In
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

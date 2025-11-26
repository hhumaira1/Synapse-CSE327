import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "./providers";
import { VoIPProvider } from "@/components/voip/VoIPProvider";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SynapseCRM - Transform Your Customer Relationships",
  description: "AI-powered CRM platform to manage contacts, close deals faster, and grow your business with intelligent automation and insights.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get current user server-side
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get user's tenantId from backend API (which handles both CRM users and portal customers)
  let tenantId = null;
  if (user) {
    try {
      console.log('🔍 Fetching user data from backend API...');
      
      // Get session token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (token) {
        // Call backend API to get user data
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
        const response = await fetch(`${apiUrl}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          tenantId = data.dbUser?.tenantId || null;
          
          console.log('✅ User data loaded from backend:', {
            userId: user.id,
            email: user.email,
            tenantId: tenantId || 'NOT_FOUND',
            userType: data.dbUser ? 'CRM User or Portal Customer' : 'Unknown'
          });
        } else {
          console.error('❌ Backend API returned error:', response.status, response.statusText);
        }
      } else {
        console.error('❌ No session token available');
      }
    } catch (error) {
      console.error('❌ Failed to fetch user data from backend:', error);
    }
  }

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {user ? (
            <VoIPProvider userId={user.id} tenantId={tenantId}>
              {children}
            </VoIPProvider>
          ) : (
            children
          )}
        </Providers>
      </body>
    </html>
  );
}

'use client';

import { useUserStatus } from '@/hooks/useUserStatus';
import { useUser } from '@/hooks/useUser';

export default function DebugPage() {
  const userStatus = useUserStatus();
  const { user, isSignedIn, isLoading } = useUser();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Debug User Status</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Supabase Auth Status */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Supabase Auth Status</h2>
            <div className="space-y-2">
              <p><strong>isLoading:</strong> {isLoading ? 'true' : 'false'}</p>
              <p><strong>isSignedIn:</strong> {isSignedIn ? 'true' : 'false'}</p>
              <p><strong>userId:</strong> {user?.id || 'null'}</p>
              <p><strong>user.id:</strong> {user?.id || 'null'}</p>
              <p><strong>user.email:</strong> {user?.email || 'null'}</p>
            </div>
          </div>

          {/* Custom User Status */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Custom User Status</h2>
            <div className="space-y-2">
              <p><strong>isLoaded:</strong> {userStatus.isLoaded ? 'true' : 'false'}</p>
              <p><strong>isSignedIn:</strong> {userStatus.isSignedIn ? 'true' : 'false'}</p>
              <p><strong>needsOnboarding:</strong> {userStatus.needsOnboarding ? 'true' : 'false'}</p>
              <p><strong>userExists:</strong> {userStatus.userExists ? 'true' : 'false'}</p>
              <p><strong>error:</strong> {userStatus.error || 'null'}</p>
            </div>
          </div>

          {/* Database User Data */}
          <div className="bg-white p-6 rounded-lg shadow md:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Database User Data</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(userStatus.user, null, 2)}
            </pre>
          </div>
        </div>

        <div className="mt-8 flex gap-4">
          <a 
            href="/onboard" 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to Onboard
          </a>
          <a 
            href="/dashboard" 
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Go to Dashboard
          </a>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    </div>
  );
}
"use client";

import { useEffect, useState } from 'react';
import { CallButton } from '@/components/voip/CallButton';
import { Phone, User, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

interface OnlineUser {
  id: string;
  name: string;
  email: string;
  type: 'CRM_USER' | 'PORTAL_CUSTOMER';
  status: 'ONLINE' | 'BUSY';
  lastSeen: string;
}

export default function OnlineCustomersPage() {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOnlineUsers = async () => {
    try {
      // Get auth token
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/voip/online-users`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      console.log('📊 Online users data:', data);
      
      // Handle response - could be array or object with data property
      const users = Array.isArray(data) ? data : (data.data || data.users || []);
      setOnlineUsers(users);
    } catch (error) {
      console.error('Failed to fetch online users:', error);
      setOnlineUsers([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOnlineUsers();
    
    // Poll every 10 seconds
    const interval = setInterval(fetchOnlineUsers, 10000);
    return () => clearInterval(interval);
  }, []);

  // Filter to show only portal customers (exclude CRM staff)
  const portalCustomers = onlineUsers.filter(u => u.type === 'PORTAL_CUSTOMER');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Online Customers</h1>
          <p className="text-muted-foreground mt-1">
            View and call portal customers who are currently online
          </p>
        </div>
        
        <Button
          onClick={fetchOnlineUsers}
          variant="outline"
          size="sm"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border rounded-lg bg-gradient-to-br from-green-50 to-emerald-50">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <p className="text-sm font-medium text-muted-foreground">Online</p>
          </div>
          <p className="text-2xl font-bold">
            {portalCustomers.filter(u => u.status === 'ONLINE').length}
          </p>
        </div>

        <div className="p-4 border rounded-lg bg-gradient-to-br from-yellow-50 to-orange-50">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <p className="text-sm font-medium text-muted-foreground">Busy</p>
          </div>
          <p className="text-2xl font-bold">
            {portalCustomers.filter(u => u.status === 'BUSY').length}
          </p>
        </div>

        <div className="p-4 border rounded-lg bg-gradient-to-br from-purple-50 to-pink-50">
          <div className="flex items-center gap-2 mb-1">
            <User className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">Total</p>
          </div>
          <p className="text-2xl font-bold">{portalCustomers.length}</p>
        </div>
      </div>

      {/* User List */}
      <div className="border rounded-lg">
        <div className="p-4 border-b bg-muted/50">
          <h2 className="font-semibold">Active Customers</h2>
        </div>

        {loading && (
          <div className="p-8 text-center text-muted-foreground">
            Loading online customers...
          </div>
        )}

        {!loading && portalCustomers.length === 0 && (
          <div className="p-8 text-center">
            <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-2">No customers online</p>
            <p className="text-sm text-muted-foreground">
              Portal customers will appear here when they log in
            </p>
          </div>
        )}

        {!loading && portalCustomers.length > 0 && (
          <div className="divide-y">
            {portalCustomers.map(user => (
              <div 
                key={user.id} 
                className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {/* Avatar with status */}
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${
                      user.status === 'ONLINE' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
                    }`} />
                  </div>
                  
                  {/* User info */}
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
                        {user.type === 'CRM_USER' ? 'CRM User' : 'Portal Customer'}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        user.status === 'ONLINE' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {user.status}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Call button */}
                <div className="flex items-center gap-2">
                  <CallButton 
                    supabaseUserId={user.id}
                    userName={user.name}
                    variant="default"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

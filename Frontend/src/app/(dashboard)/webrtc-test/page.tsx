"use client";

import { useEffect, useState } from 'react';
import { initializeWebRTCSocket, getSocket } from '@/lib/webrtc';
import { useUserData } from '@/hooks/useUserData';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function WebRTCTestPage() {
  const { userData, loading } = useUserData();
  const [socketConnected, setSocketConnected] = useState(false);
  const [socketId, setSocketId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 20));
  };

  useEffect(() => {
    if (!userData) {
      addLog('⏳ Waiting for user data...');
      return;
    }

    addLog(`✅ User data loaded: ${userData.name} (${userData.email})`);
    addLog(`👤 User ID: ${userData.id}`);
    addLog(`🏢 Tenant ID: ${userData.tenantId}`);
    addLog(`🔐 Role: ${userData.role}`);

    try {
      const socket = initializeWebRTCSocket({
        userId: userData.id,
        tenantId: userData.tenantId,
        role: 'tenant_member',
      });

      addLog('🔌 Socket initialized');

      socket.on('connect', () => {
        addLog('✅ Socket CONNECTED!');
        setSocketConnected(true);
        setSocketId(socket.id);
      });

      socket.on('disconnect', () => {
        addLog('❌ Socket DISCONNECTED');
        setSocketConnected(false);
        setSocketId(null);
      });

      socket.on('connection:success', (data) => {
        addLog(`✅ Connection authenticated: ${JSON.stringify(data)}`);
      });

      socket.on('connect_error', (err) => {
        addLog(`❌ Connection error: ${err.message}`);
        setError(err.message);
      });

      socket.on('call:incoming', (data) => {
        addLog(`📞 Incoming call: ${JSON.stringify(data)}`);
      });

      socket.on('call:error', (data) => {
        addLog(`❌ Call error: ${data.message}`);
      });

      // Try to connect
      if (!socket.connected) {
        addLog('🔄 Attempting to connect...');
        socket.connect();
      }

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      addLog(`❌ Error initializing: ${message}`);
      setError(message);
    }
  }, [userData]);

  const testConnection = () => {
    const socket = getSocket();
    if (!socket) {
      addLog('❌ No socket instance');
      return;
    }

    addLog(`🧪 Testing connection...`);
    addLog(`Connected: ${socket.connected}`);
    addLog(`Socket ID: ${socket.id}`);
    
    socket.emit('ping', { timestamp: Date.now() });
    addLog('📤 Sent ping');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading user data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">WebRTC Connection Test</h1>
          <p className="text-gray-600 mt-2">Debug WebSocket connection to backend</p>
        </div>

        {/* Status Card */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Socket Status:</span>
                <Badge variant={socketConnected ? "default" : "destructive"}>
                  {socketConnected ? '✅ Connected' : '❌ Disconnected'}
                </Badge>
              </div>

              {socketId && (
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Socket ID:</span>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">{socketId}</code>
                </div>
              )}

              {userData && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">User:</span>
                    <span>{userData.name || userData.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">User ID:</span>
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">{userData.id}</code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Tenant ID:</span>
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">{userData.tenantId}</code>
                  </div>
                </>
              )}

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <Button onClick={testConnection} className="w-full">
                Test Connection
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Logs Card */}
        <Card>
          <CardContent className="p-6">
            <h2 className="font-semibold text-lg mb-4">Connection Logs</h2>
            <div className="bg-black text-green-400 p-4 rounded font-mono text-sm h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-gray-500">No logs yet...</p>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="mb-1">{log}</div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardContent className="p-6">
            <h2 className="font-semibold text-lg mb-4">How to Test</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Make sure backend is running on http://localhost:3001</li>
              <li>Check that you're logged in (user data should show above)</li>
              <li>Socket should auto-connect when page loads</li>
              <li>Look for "✅ Socket CONNECTED!" in logs</li>
              <li>Click "Test Connection" button to verify</li>
              <li>Open browser console (F12) for detailed errors</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MessageCircle, CheckCircle, XCircle, Loader2, Info } from 'lucide-react';
import { useUser } from '@/hooks/useUser';

export default function IntegrationsPage() {
  const [telegramLinked, setTelegramLinked] = useState(false);
  const [telegramUsername, setTelegramUsername] = useState<string>();
  const [linkedAt, setLinkedAt] = useState<Date>();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [error, setError] = useState<string>();
  const { user } = useUser();

  // Check Telegram status on mount
  useEffect(() => {
    checkTelegramStatus();
  }, []);

  const checkTelegramStatus = async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/telegram/status', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setTelegramLinked(data.connected);
        setTelegramUsername(data.telegramUsername);
        setLinkedAt(data.linkedAt ? new Date(data.linkedAt) : undefined);
      }
    } catch (error) {
      console.error('Failed to check Telegram status:', error);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleConnectTelegram = async () => {
    setIsLoading(true);
    setError(undefined);

    try {
      // Generate deep link
      const response = await fetch('/api/telegram/generate-link', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to generate link');
      }

      const { deepLink } = await response.json();

      // Open Telegram app with deep link
      window.open(deepLink, '_blank');

      // Poll for connection status
      let attempts = 0;
      const maxAttempts = 150; // 5 minutes (2 seconds * 150)

      const pollInterval = setInterval(async () => {
        attempts++;

        if (attempts > maxAttempts) {
          clearInterval(pollInterval);
          setIsLoading(false);
          setError('Connection timeout. Please try again.');
          return;
        }

        try {
          const statusRes = await fetch('/api/telegram/status', {
            credentials: 'include',
          });

          if (statusRes.ok) {
            const { connected, telegramUsername: username } = await statusRes.json();

            if (connected) {
              setTelegramLinked(true);
              setTelegramUsername(username);
              setLinkedAt(new Date());
              clearInterval(pollInterval);
              setIsLoading(false);
            }
          }
        } catch (error) {
          console.error('Polling error:', error);
        }
      }, 2000);
    } catch (error) {
      console.error('Failed to connect Telegram:', error);
      setError('Failed to generate connection link. Please try again.');
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your Telegram account?')) {
      return;
    }

    try {
      const response = await fetch('/api/telegram/disconnect', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        setTelegramLinked(false);
        setTelegramUsername(undefined);
        setLinkedAt(undefined);
      }
    } catch (error) {
      console.error('Failed to disconnect Telegram:', error);
    }
  };

  if (isCheckingStatus) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Integrations</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Connect external services to enhance your CRM experience
        </p>
      </div>

      {/* Telegram Bot Card */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-[#0088cc]/10 flex items-center justify-center flex-shrink-0">
            <MessageCircle className="w-6 h-6 text-[#0088cc]" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-semibold mb-2">Telegram Bot</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Access SynapseCRM from Telegram with natural language commands. No need to
              memorize commands - just chat naturally like you do in the web app!
            </p>

            {/* Status Badge */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm font-medium">Status:</span>
              {telegramLinked ? (
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    Connected
                  </span>
                  {telegramUsername && (
                    <span className="text-sm text-gray-500">(@{telegramUsername})</span>
                  )}
                </div>
              ) : (
                <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                  <XCircle className="w-4 h-4" />
                  Not Connected
                </span>
              )}
            </div>

            {/* Connected State */}
            {telegramLinked ? (
              <div className="space-y-4">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">
                        ✅ You can now use SynapseCRM via Telegram!
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Open your Telegram app and start chatting with your bot. Try asking:
                      </p>
                      <ul className="text-sm text-green-700 dark:text-green-300 space-y-1 ml-4">
                        <li>• "show me my contacts"</li>
                        <li>• "create a deal for john smith worth $5000"</li>
                        <li>• "what tickets are open?"</li>
                        <li>• "show me revenue this month"</li>
                      </ul>
                      {linkedAt && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                          Connected on {linkedAt.toLocaleDateString()} at{' '}
                          {linkedAt.toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={handleDisconnect}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Disconnect Telegram
                </Button>
              </div>
            ) : (
              /* Not Connected State */
              <div className="space-y-4">
                {/* Info Box */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        How it works:
                      </p>
                      <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1 ml-4 list-decimal">
                        <li>Click "Connect Telegram Bot" below</li>
                        <li>Your Telegram app will open automatically</li>
                        <li>Tap "SEND" to confirm the connection</li>
                        <li>Start chatting with your CRM!</li>
                      </ol>
                    </div>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                  </div>
                )}

                {/* Connect Button */}
                <Button
                  onClick={handleConnectTelegram}
                  disabled={isLoading}
                  className="bg-[#0088cc] hover:bg-[#006699] text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Waiting for Telegram connection...
                    </>
                  ) : (
                    <>
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Connect Telegram Bot
                    </>
                  )}
                </Button>

                {isLoading && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    If Telegram didn't open automatically, please refresh and try again.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Future Integrations Placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 opacity-60">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <span className="text-2xl">📧</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-1">Email Integration</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Coming soon...</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 opacity-60">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <span className="text-2xl">📅</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-1">Calendar Sync</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Coming soon...</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

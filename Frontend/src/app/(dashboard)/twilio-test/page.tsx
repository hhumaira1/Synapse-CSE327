"use client";

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, Loader2 } from 'lucide-react';
import { useApiClient } from '@/lib/api';
import toast from 'react-hot-toast';

export default function TwilioTestPage() {
  const apiClient = useApiClient();
  const [phoneNumber, setPhoneNumber] = useState('+8801856541646'); // Your Bangladesh number
  const [loading, setLoading] = useState(false);
  const [callResult, setCallResult] = useState<any>(null);

  const testTwilioCall = async () => {
    setLoading(true);
    setCallResult(null);

    try {
      const response = await apiClient.post('/twilio/make-call', {
        to: phoneNumber,
      });

      console.log('✅ Twilio call response:', response.data);
      setCallResult(response.data);
      toast.success('Call initiated successfully! Check your phone.');
    } catch (error: any) {
      console.error('❌ Twilio call error:', error);
      
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      
      if (errorMessage.includes('21219')) {
        toast.error('Trial account limitation: Number not verified');
        setCallResult({
          error: 'Trial Account Limitation',
          message: 'Even with geo permissions enabled, trial accounts can only call verified numbers. Upgrade to paid account to call any Bangladesh number.',
        });
      } else if (errorMessage.includes('21608')) {
        toast.error('Geo permission not enabled for Bangladesh');
        setCallResult({
          error: 'Geo Permission Error',
          message: 'Enable Bangladesh in Twilio Console > Voice > Settings > Geo Permissions',
        });
      } else {
        toast.error(errorMessage);
        setCallResult({
          error: 'Call Failed',
          message: errorMessage,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Twilio Voice Test</h1>
        <p className="text-gray-600 mt-2">
          Test Twilio calling to Bangladesh numbers
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Phone Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Phone Number (Bangladesh)
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+8801XXXXXXXXX"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Format: +880 followed by 10 digits (e.g., +8801712345678)
              </p>
            </div>

            {/* Test Button */}
            <Button
              onClick={testTwilioCall}
              disabled={loading || !phoneNumber}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Calling...
                </>
              ) : (
                <>
                  <Phone className="h-5 w-5 mr-2" />
                  Test Twilio Call
                </>
              )}
            </Button>

            {/* Results */}
            {callResult && (
              <div className={`p-4 rounded-lg ${callResult.error ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                <h3 className={`font-semibold mb-2 ${callResult.error ? 'text-red-900' : 'text-green-900'}`}>
                  {callResult.error || 'Success!'}
                </h3>
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(callResult, null, 2)}
                </pre>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Testing Instructions:</h3>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Make sure Bangladesh is enabled in Twilio Geo Permissions</li>
                <li>Enter a Bangladesh phone number (format: +8801XXXXXXXXX)</li>
                <li>Click "Test Twilio Call"</li>
                <li>If successful, your phone should ring within 5-10 seconds</li>
              </ol>
              
              <div className="mt-4 pt-4 border-t border-blue-300">
                <h4 className="font-semibold text-blue-900 mb-1">Trial Account Limitations:</h4>
                <p className="text-xs text-blue-700">
                  Even with geo permissions enabled, Twilio trial accounts can ONLY call:
                </p>
                <ul className="text-xs text-blue-700 list-disc list-inside ml-2 mt-1">
                  <li>Your verified Twilio phone number</li>
                  <li>Numbers manually verified in Console → Phone Numbers → Verified Caller IDs</li>
                </ul>
                <p className="text-xs text-blue-700 mt-2 font-medium">
                  To call ANY Bangladesh number: Upgrade to paid account (add credit card + $20 credit)
                </p>
              </div>
            </div>

            {/* Account Status */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Current Configuration:</h3>
              <div className="text-sm text-gray-700 space-y-1">
                <div className="flex justify-between">
                  <span className="font-medium">Voice Mode:</span>
                  <span className="text-gray-600">{process.env.NEXT_PUBLIC_VOICE_MODE || 'production'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Twilio Phone:</span>
                  <span className="text-gray-600">+1 708 554 7043</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Backend URL:</span>
                  <span className="text-gray-600 text-xs">{process.env.NEXT_PUBLIC_API_BASE_URL}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* WebRTC Info */}
      <Card className="mt-6">
        <CardContent className="p-6">
          <h3 className="font-semibold text-gray-900 mb-2">📌 Note: WebRTC is Still Active</h3>
          <p className="text-sm text-gray-600">
            Your WebRTC calling system is still available on the /calls page. 
            Both Twilio and WebRTC can coexist - use this page to test Twilio specifically.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

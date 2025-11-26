"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, Download, PlayCircle, Loader2 } from 'lucide-react';
import { useApiClient } from '@/lib/api';

interface CallLog {
  id: string;
  roomName: string;
  direction: 'INBOUND' | 'OUTBOUND';
  status: string;
  duration: number | null;
  startTime: string;
  endTime: string | null;
  callerSupabaseId: string;
  calleeSupabaseId: string;
  contact?: {
    firstName: string;
    lastName: string;
  };
  recording?: {
    storageKey: string;
    duration: number;
  };
  transcription?: {
    text: string;
  };
}

export default function CallHistoryPage() {
  const apiClient = useApiClient();
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCalls() {
      try {
        console.log('📞 Fetching call history...');
        const response = await apiClient.get('/voip/history');
        console.log('✅ Call history loaded:', response.data.length, 'calls');
        setCalls(response.data);
      } catch (error) {
        console.error('❌ Failed to fetch call history:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchCalls();
  }, [apiClient]);

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge className="bg-green-600">Completed</Badge>;
      case 'MISSED':
        return <Badge className="bg-red-600">Missed</Badge>;
      case 'REJECTED':
        return <Badge className="bg-gray-600">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Call History</h1>
        <p className="text-muted-foreground mt-1">View all your call logs and recordings</p>
      </div>

      <div className="grid gap-4">
        {calls.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Phone className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No call history yet</h3>
              <p className="text-muted-foreground">Your call logs will appear here once you make or receive calls</p>
            </CardContent>
          </Card>
        ) : (
          calls.map((call) => (
            <Card key={call.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`p-3 rounded-full ${
                      call.direction === 'INBOUND' 
                        ? 'bg-blue-100' 
                        : call.status === 'MISSED'
                        ? 'bg-red-100'
                        : 'bg-green-100'
                    }`}>
                      {call.direction === 'INBOUND' ? (
                        <PhoneIncoming className="w-5 h-5 text-blue-600" />
                      ) : call.status === 'MISSED' ? (
                        <PhoneMissed className="w-5 h-5 text-red-600" />
                      ) : (
                        <PhoneOutgoing className="w-5 h-5 text-green-600" />
                      )}
                    </div>

                    {/* Details */}
                    <div>
                      <h3 className="font-semibold">
                        {call.contact 
                          ? `${call.contact.firstName} ${call.contact.lastName}`
                          : call.direction === 'INBOUND' ? 'Incoming Call' : 'Outgoing Call'
                        }
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(call.startTime).toLocaleString()}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        {getStatusBadge(call.status)}
                        {call.duration && (
                          <span className="text-sm text-muted-foreground">
                            Duration: {formatDuration(call.duration)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {call.recording && (
                      <Button variant="outline" size="sm">
                        <PlayCircle className="w-4 h-4 mr-2" />
                        Play Recording
                      </Button>
                    )}
                    {call.transcription && (
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Download Transcript
                      </Button>
                    )}
                  </div>
                </div>

                {/* Transcription Preview */}
                {call.transcription && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-1">Transcription:</p>
                    <p className="text-sm text-gray-700 line-clamp-3">
                      {call.transcription.text}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

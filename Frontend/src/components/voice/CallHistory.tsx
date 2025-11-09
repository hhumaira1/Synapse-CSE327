"use client";

import { useState, useEffect } from 'react';
import { Phone, PhoneIncoming, PhoneOutgoing, Clock, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useApiClient } from '@/lib/api';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

interface CallLog {
  id: string;
  direction: 'INBOUND' | 'OUTBOUND';
  fromNumber: string;
  toNumber: string;
  status: string;
  duration: number | null;
  startedAt: string;
  endedAt: string | null;
  recordingUrl: string | null;
  contact?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface CallHistoryProps {
  onCallBack?: (phoneNumber: string, contactId?: string, contactName?: string) => void;
  limit?: number;
}

export function CallHistory({ onCallBack, limit }: CallHistoryProps) {
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'inbound' | 'outbound'>('all');
  
  const apiClient = useApiClient();

  // Fetch call logs (automatically filtered by tenantId via backend)
  useEffect(() => {
    const fetchCallLogs = async () => {
      setIsLoading(true);
      try {
        const params: Record<string, string | number> = {};
        if (filter !== 'all') {
          params.direction = filter.toUpperCase();
        }
        if (limit) {
          params.limit = limit;
        }

        const response = await apiClient.get('/twilio/call-logs', { params });
        setCallLogs(response.data);
      } catch (error) {
        console.error('Failed to fetch call logs:', error);
        toast.error('Failed to load call history');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCallLogs();
  }, [filter, limit, apiClient]);

  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'busy':
      case 'no-answer':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
      case 'canceled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCallBack = (log: CallLog) => {
    if (!onCallBack) return;

    const phoneNumber = log.direction === 'INBOUND' ? log.fromNumber : log.toNumber;
    const contactName = log.contact
      ? `${log.contact.firstName} ${log.contact.lastName}`
      : undefined;

    onCallBack(phoneNumber, log.contact?.id, contactName);
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading call history...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">Call History</h3>
          
          {/* Filter Buttons */}
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button
              variant={filter === 'inbound' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('inbound')}
            >
              <PhoneIncoming className="w-4 h-4 mr-1" />
              Inbound
            </Button>
            <Button
              variant={filter === 'outbound' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('outbound')}
            >
              <PhoneOutgoing className="w-4 h-4 mr-1" />
              Outbound
            </Button>
          </div>
        </div>

        {/* Call Logs List */}
        {callLogs.length === 0 ? (
          <div className="text-center py-12">
            <Phone className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No call history found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {callLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {/* Left Side - Call Info */}
                <div className="flex items-center gap-4 flex-1">
                  {/* Direction Icon */}
                  <div
                    className={`p-2 rounded-full ${
                      log.direction === 'INBOUND'
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-purple-100 text-purple-600'
                    }`}
                  >
                    {log.direction === 'INBOUND' ? (
                      <PhoneIncoming className="w-5 h-5" />
                    ) : (
                      <PhoneOutgoing className="w-5 h-5" />
                    )}
                  </div>

                  {/* Call Details */}
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {log.contact ? (
                        `${log.contact.firstName} ${log.contact.lastName}`
                      ) : (
                        <span className="text-gray-600">Unknown</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {log.direction === 'INBOUND' ? log.fromNumber : log.toNumber}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(log.startedAt), 'MMM d, yyyy')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(log.startedAt), 'h:mm a')}
                      </span>
                      {log.duration !== null && (
                        <span>Duration: {formatDuration(log.duration)}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Side - Status & Actions */}
                <div className="flex items-center gap-3">
                  <Badge className={getStatusColor(log.status)}>{log.status}</Badge>
                  
                  {onCallBack && (
                    <Button
                      onClick={() => handleCallBack(log)}
                      variant="outline"
                      size="sm"
                    >
                      <Phone className="w-4 h-4" />
                    </Button>
                  )}

                  {log.recordingUrl && (
                    <Button
                      onClick={() => window.open(log.recordingUrl!, '_blank')}
                      variant="outline"
                      size="sm"
                    >
                      Play
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

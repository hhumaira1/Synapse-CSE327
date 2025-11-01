'use client';

import { useQuery } from '@tanstack/react-query';
import { useApiClient } from '@/lib/api';
import { useUser } from '@clerk/nextjs';
import { Ticket, MessageSquare, FileText, Clock } from 'lucide-react';

export default function PortalDashboardPage() {
  const { user } = useUser();
  const apiClient = useApiClient();

  const { data: portalAccounts } = useQuery({
    queryKey: ['portal-accounts'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/portal/auth/me');
        return response.data;
      } catch (error) {
        console.error('Failed to fetch portal accounts:', error);
        return [];
      }
    },
  });

  const statsCards = [
    {
      label: 'Open Tickets',
      value: 3,
      icon: Ticket,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
    },
    {
      label: 'Unread Messages',
      value: 12,
      icon: MessageSquare,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
    },
    {
      label: 'Documents',
      value: 8,
      icon: FileText,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
    },
    {
      label: 'Avg Response Time',
      value: '2h',
      icon: Clock,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome to the Portal, {user?.firstName || 'User'}! 👋
        </h1>
        <p className="text-gray-600">
          Access your tickets, documents, and messages all in one place.
        </p>
        {portalAccounts && portalAccounts.length > 0 && (
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm text-gray-500">Organization:</span>
            <span className="text-sm font-medium text-gray-900">
              {portalAccounts[0]?.tenant?.name}
            </span>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          
          return (
            <div
              key={stat.label}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <Icon className={`h-6 w-6 ${stat.textColor}`} />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">
                {stat.label}
              </h3>
              <p className="text-3xl font-bold text-gray-900">
                {stat.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tickets */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Tickets</h3>
          <div className="space-y-3">
            {[
              { id: '#1234', title: 'Payment inquiry', status: 'Open', time: '2h ago' },
              { id: '#1233', title: 'Technical support', status: 'In Progress', time: '5h ago' },
              { id: '#1232', title: 'Feature request', status: 'Resolved', time: '1d ago' },
            ].map((ticket) => (
              <div key={ticket.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition border border-gray-100">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-gray-900">{ticket.title}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      ticket.status === 'Open' ? 'bg-orange-100 text-orange-700' :
                      ticket.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {ticket.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{ticket.id} • {ticket.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            {[
              { label: 'Submit New Ticket', icon: Ticket, href: '/portal/tickets/new' },
              { label: 'View Documents', icon: FileText, href: '/portal/documents' },
              { label: 'Contact Support', icon: MessageSquare, href: '/portal/messages' },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <a
                  key={action.label}
                  href={action.href}
                  className="flex items-center gap-3 p-4 rounded-lg border-2 border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition group"
                >
                  <Icon className="h-6 w-6 text-gray-600 group-hover:text-purple-600" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-purple-700">
                    {action.label}
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

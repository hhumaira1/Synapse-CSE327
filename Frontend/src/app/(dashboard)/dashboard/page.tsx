"use client";

import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api";
import { useUser } from "@/hooks/useUser";
import { useRouter } from "next/navigation";
import { LeadStatus, TicketStatus, type Lead, type Ticket, type Contact } from "@/types/prisma";
import {
  Users,
  TrendingUp,
  DollarSign,
  Ticket as TicketIcon,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useUser();
  const apiClient = useApiClient();
  const router = useRouter();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      try {
        const [contacts, leads, deals, tickets] = await Promise.all([
          apiClient.get("/contacts").catch(() => ({ data: [] })),
          apiClient.get("/leads").catch(() => ({ data: [] })),
          apiClient.get("/deals").catch(() => ({ data: [] })),
          apiClient.get("/tickets").catch(() => ({ data: [] })),
        ]);

        return {
          totalContacts: Array.isArray(contacts.data)
            ? contacts.data.length
            : 0,
          activeLeads: Array.isArray(leads.data)
            ? leads.data.filter(
                (l: Lead) => l.status === LeadStatus.NEW || l.status === LeadStatus.CONTACTED
              ).length
            : 0,
          openDeals: Array.isArray(deals.data) ? deals.data.length : 0,
          pendingTickets: Array.isArray(tickets.data)
            ? tickets.data.filter(
                (t: Ticket) => t.status === TicketStatus.OPEN || t.status === TicketStatus.IN_PROGRESS
              ).length
            : 0,
        };
      } catch (error) {
        console.error("Failed to fetch stats:", error);
        return {
          totalContacts: 0,
          activeLeads: 0,
          openDeals: 0,
          pendingTickets: 0,
        };
      }
    },
  });

  // Fetch recent contacts
  const { data: recentContacts } = useQuery({
    queryKey: ["recent-contacts"],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/contacts");
        // Get the 3 most recent contacts
        return Array.isArray(response.data) 
          ? response.data.slice(0, 3) 
          : [];
      } catch (error) {
        console.error("Failed to fetch recent contacts:", error);
        return [];
      }
    },
  });

  const statsCards = [
    {
      label: "Total Contacts",
      value: stats?.totalContacts || 0,
      icon: Users,
      color: "bg-blue-500",
      bgColor: "bg-blue-50",
      textColor: "text-blue-700",
      change: "+12%",
      trend: "up",
      onClick: () => router.push("/contacts"),
    },
    {
      label: "Active Leads",
      value: stats?.activeLeads || 0,
      icon: TrendingUp,
      color: "bg-green-500",
      bgColor: "bg-green-50",
      textColor: "text-green-700",
      change: "+8%",
      trend: "up",
      onClick: () => router.push("/leads?status=NEW,CONTACTED"),
    },
    {
      label: "Open Deals",
      value: stats?.openDeals || 0,
      icon: DollarSign,
      color: "bg-purple-500",
      bgColor: "bg-purple-50",
      textColor: "text-purple-700",
      change: "+23%",
      trend: "up",
      onClick: () => router.push("/deals"),
    },
    {
      label: "Pending Tickets",
      value: stats?.pendingTickets || 0,
      icon: TicketIcon,
      color: "bg-orange-500",
      bgColor: "bg-orange-50",
      textColor: "text-orange-700",
      change: "-5%",
      trend: "down",
      onClick: () => router.push("/tickets?status=OPEN,IN_PROGRESS"),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.user_metadata?.firstName || user?.email?.split('@')[0] || "User"}! 👋
        </h1>
        <p className="text-gray-600">
          Here&#39;s what&#39;s happening with your business today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trend === "up" ? ArrowUp : ArrowDown;

          return (
            <div
              key={stat.label}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition cursor-pointer"
              onClick={stat.onClick}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <Icon className={`h-6 w-6 ${stat.textColor}`} />
                </div>
                <div
                  className={`flex items-center gap-1 text-sm font-medium ${
                    stat.trend === "up" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  <TrendIcon className="h-4 w-4" />
                  {stat.change}
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">
                {stat.label}
              </h3>
              <p className="text-3xl font-bold text-gray-900">
                {isLoading ? "..." : stat.value.toLocaleString()}
              </p>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Contacts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Contacts
          </h3>
          <div className="space-y-3">
            {recentContacts && recentContacts.length > 0 ? (
              recentContacts.map((contact: Contact) => (
                <div
                  key={contact.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition cursor-pointer"
                  onClick={() => router.push(`/contacts/${contact.id}`)}
                >
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold">
                    {contact.firstName?.[0] || ""}{contact.lastName?.[0] || ""}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {contact.firstName} {contact.lastName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {contact.email || contact.phone || "No contact info"}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No contacts yet
              </p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                label: "Add Contact",
                href: "/contacts",
                icon: Users,
              },
              {
                label: "Create Lead",
                href: "/leads",
                icon: TrendingUp,
              },
              {
                label: "New Deal",
                href: "/deals",
                icon: DollarSign,
              },
              {
                label: "New Ticket",
                href: "/tickets",
                icon: TicketIcon,
              },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <a
                  key={action.label}
                  href={action.href}
                  className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition group"
                >
                  <Icon className="h-6 w-6 text-gray-600 group-hover:text-blue-600" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">
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

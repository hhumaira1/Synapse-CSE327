"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Search,
  Loader2,
  Mail,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { useApiClient } from "@/lib/api";
import { useUserStatus } from "@/hooks/useUserStatus";
import { useRouter } from "next/navigation";

interface PortalCustomer {
  id: string;
  isActive: boolean;
  accessToken: string;
  clerkId?: string | null;
  createdAt: string;
  contact: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    company?: string;
  };
}

export default function PortalCustomersPage() {
  const [portalCustomers, setPortalCustomers] = useState<PortalCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const apiClient = useApiClient();
  const { user, isLoaded: userLoaded } = useUserStatus();
  const router = useRouter();

  // Check if user is admin or manager
  const canViewPortalCustomers = user && 
    typeof user === 'object' && 
    'role' in user && 
    (user.role === 'ADMIN' || user.role === 'MANAGER');

  const fetchPortalCustomers = useCallback(async () => {
    try {
      setLoading(true);
      // Get all contacts with portal customers
      const response = await apiClient.get('/contacts');
      const contacts = response.data as Array<{
        id: string;
        firstName: string;
        lastName: string;
        email?: string;
        company?: string;
        portalCustomers?: Array<{
          id: string;
          isActive: boolean;
          accessToken: string;
          clerkId?: string | null;
          createdAt: string;
        }>;
      }>;
      
      // Extract portal customers with contact info
      const customers: PortalCustomer[] = [];
      contacts.forEach((contact) => {
        if (contact.portalCustomers && contact.portalCustomers.length > 0) {
          contact.portalCustomers.forEach((pc) => {
            customers.push({
              ...pc,
              contact: {
                id: contact.id,
                firstName: contact.firstName,
                lastName: contact.lastName,
                email: contact.email,
                company: contact.company,
              },
            });
          });
        }
      });
      
      setPortalCustomers(customers);
    } catch (error) {
      console.error('Failed to fetch portal customers:', error);
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    if (!userLoaded) return;
    
    if (canViewPortalCustomers) {
      fetchPortalCustomers();
    } else {
      router.push('/dashboard');
    }
  }, [userLoaded, canViewPortalCustomers, fetchPortalCustomers, router]);

  const filteredCustomers = portalCustomers.filter((customer) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      customer.contact.firstName.toLowerCase().includes(searchLower) ||
      customer.contact.lastName.toLowerCase().includes(searchLower) ||
      customer.contact.email?.toLowerCase().includes(searchLower) ||
      customer.contact.company?.toLowerCase().includes(searchLower)
    );
  });

  const getStatus = (customer: PortalCustomer) => {
    if (customer.clerkId) {
      return {
        text: 'Active',
        icon: CheckCircle,
        variant: 'default' as const,
        color: 'text-green-600',
      };
    } else if (customer.isActive) {
      return {
        text: 'Invitation Sent',
        icon: Clock,
        variant: 'outline' as const,
        color: 'text-yellow-600',
      };
    } else {
      return {
        text: 'Inactive',
        icon: XCircle,
        variant: 'secondary' as const,
        color: 'text-gray-600',
      };
    }
  };

  const stats = {
    total: portalCustomers.length,
    active: portalCustomers.filter(pc => pc.clerkId).length,
    pending: portalCustomers.filter(pc => pc.isActive && !pc.clerkId).length,
    inactive: portalCustomers.filter(pc => !pc.isActive).length,
  };

  if (!userLoaded || loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!canViewPortalCustomers) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Portal Customers</h1>
          <p className="text-gray-600 mt-1">Track customer portal invitations and active users</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-indigo-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Invitations</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-gray-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Inactive</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inactive}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search portal customers by name, email, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </CardContent>
      </Card>

      {/* Portal Customers List */}
      <div className="grid gap-6">
        {filteredCustomers.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm ? "No portal customers found" : "No portal invitations yet"}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm 
                  ? "Try adjusting your search terms" 
                  : "Create customer contracts from the Contacts page to get started"
                }
              </p>
              {!searchTerm && (
                <Button 
                  onClick={() => router.push('/contacts')}
                  className="bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                >
                  Go to Contacts
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredCustomers.map((customer) => {
            const status = getStatus(customer);
            const StatusIcon = status.icon;
            
            return (
              <Card key={customer.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-full bg-indigo-100">
                          <Users className="h-6 w-6 text-indigo-600" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {customer.contact.firstName} {customer.contact.lastName}
                            </h3>
                            <Badge variant={status.variant} className={status.color}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {status.text}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                            {customer.contact.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                <span>{customer.contact.email}</span>
                              </div>
                            )}
                            {customer.contact.company && (
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                <span>{customer.contact.company}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex gap-4 mt-4 text-xs text-gray-500">
                            <span>
                              Invited: {new Date(customer.createdAt).toLocaleDateString()}
                            </span>
                            {customer.clerkId && (
                              <span className="text-green-600 font-medium">
                                ✓ User has joined the portal
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex flex-col items-end gap-2 ml-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push(`/contacts`)}
                      >
                        View Contact
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

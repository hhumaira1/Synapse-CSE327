"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Plus,
  Mail,
  Phone,
  Building,
  Briefcase,
  MoreVertical,
  Search,
  Edit,
  Loader2,
  Trash2,
} from "lucide-react";
import { useApiClient } from "@/lib/api";
import { CustomerPortalInviteButton } from "@/components/portal/CustomerPortalInviteButton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useUserStatus } from "@/hooks/useUserStatus";
import toast from 'react-hot-toast';
import { confirmDelete } from '@/lib/sweetalert';

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  notes?: string;
  createdAt: string;
  portalCustomers: Array<{
    id: string;
    isActive: boolean;
    accessToken: string;
    clerkId?: string | null;
  }>;
  deals: Array<{
    id: string;
    title: string;
    value: number;
    stage: {
      name: string;
    };
  }>;
  tickets: Array<{
    id: string;
    title: string;
    status: string;
  }>;
}

interface CreateContactForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  jobTitle: string;
  notes: string;
}

export default function ContactsPage() {
  const apiClient = useApiClient();
  const { user: currentUser } = useUserStatus();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [createForm, setCreateForm] = useState<CreateContactForm>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    jobTitle: "",
    notes: "",
  });

  // Check user role permissions
  const canEdit = currentUser && typeof currentUser === 'object' && 'role' in currentUser && 
    (currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER');
  const canDelete = currentUser && typeof currentUser === 'object' && 'role' in currentUser && 
    currentUser.role === 'ADMIN';

  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/contacts");
      setContacts(response.data);
    } catch (error) {
      console.error("Error fetching contacts:", error);
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.firstName) return;

    const loadingToast = toast.loading('Creating contact...');

    try {
      setCreateLoading(true);
      await apiClient.post("/contacts", createForm);
      toast.success('Contact created successfully!', { id: loadingToast });
      setShowCreateDialog(false);
      setCreateForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        company: "",
        jobTitle: "",
        notes: "",
      });
      fetchContacts();
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to create contact', { id: loadingToast });
      console.error("Error creating contact:", error);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteContact = async (contact: Contact) => {
    const confirmed = await confirmDelete(
      'Delete Contact?',
      `Are you sure you want to delete ${contact.firstName} ${contact.lastName}? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    const loadingToast = toast.loading('Deleting contact...');

    try {
      await apiClient.delete(`/contacts/${contact.id}`);
      toast.success('Contact deleted successfully!', { id: loadingToast });
      fetchContacts();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to delete contact', { id: loadingToast });
      console.error('Error deleting contact:', error);
    }
  };

  const filteredContacts = contacts.filter((contact) => {
    const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    return (
      fullName.includes(searchLower) ||
      contact.email?.toLowerCase().includes(searchLower) ||
      contact.company?.toLowerCase().includes(searchLower)
    );
  });

  const getPortalStatus = (contact: Contact) => {
    const portalAccess = contact.portalCustomers?.[0];
    if (!portalAccess) return null;
    // Only show Active if customer has accepted (clerkId exists means they've signed up)
    if (portalAccess.isActive && portalAccess.clerkId) {
      return "Active";
    } else if (portalAccess.isActive && !portalAccess.clerkId) {
      return "Pending";
    } else {
      return "Inactive";
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
          <p className="text-gray-600 mt-1">Manage your customer contacts and portal access</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Contact</DialogTitle>
              <DialogDescription>
                Add a new contact to your CRM system
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleCreateContact} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={createForm.firstName}
                    onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={createForm.lastName}
                    onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Doe"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="john@company.com"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company
                  </label>
                  <input
                    type="text"
                    value={createForm.company}
                    onChange={(e) => setCreateForm({ ...createForm, company: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Company Inc."
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Title
                </label>
                <input
                  type="text"
                  value={createForm.jobTitle}
                  onChange={(e) => setCreateForm({ ...createForm, jobTitle: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="CEO"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={createForm.notes}
                  onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  placeholder="Additional notes..."
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowCreateDialog(false)}
                  disabled={createLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  disabled={createLoading || !createForm.firstName}
                >
                  {createLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Contact"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-indigo-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Contacts</p>
                <p className="text-2xl font-bold text-gray-900">{contacts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Mail className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">With Email</p>
                <p className="text-2xl font-bold text-gray-900">
                  {contacts.filter(c => c.email).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Building className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">With Company</p>
                <p className="text-2xl font-bold text-gray-900">
                  {contacts.filter(c => c.company).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Contracts</p>
                <p className="text-2xl font-bold text-gray-900">
                  {contacts.filter(c => c.portalCustomers?.length > 0).length}
                </p>
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
              placeholder="Search contacts by name, email, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </CardContent>
      </Card>

      {/* Contacts List */}
      <div className="grid gap-6">
        {filteredContacts.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm ? "No contacts found" : "No contacts yet"}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm 
                  ? "Try adjusting your search terms" 
                  : "Get started by adding your first contact"
                }
              </p>
              {!searchTerm && (
                <Button 
                  onClick={() => setShowCreateDialog(true)}
                  className="bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Contact
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredContacts.map((contact) => (
            <Card key={contact.id} className="hover:shadow-md transition-shadow">
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
                            {contact.firstName} {contact.lastName}
                          </h3>
                          {getPortalStatus(contact) === "Active" && (
                            <Badge variant="default" className="bg-green-600">
                              ✓ Active Contract
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          {contact.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              <span>{contact.email}</span>
                            </div>
                          )}
                          {contact.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              <span>{contact.phone}</span>
                            </div>
                          )}
                          {contact.company && (
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4" />
                              <span>{contact.company}</span>
                            </div>
                          )}
                          {contact.jobTitle && (
                            <div className="flex items-center gap-2">
                              <Briefcase className="h-4 w-4" />
                              <span>{contact.jobTitle}</span>
                            </div>
                          )}
                        </div>
                        
                        {contact.notes && (
                          <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                            {contact.notes}
                          </p>
                        )}
                        
                        {/* Quick stats */}
                        <div className="flex gap-4 mt-4 text-xs text-gray-500">
                          {contact.deals?.length > 0 && (
                            <span>{contact.deals.length} deal{contact.deals.length !== 1 ? 's' : ''}</span>
                          )}
                          {contact.tickets?.length > 0 && (
                            <span>{contact.tickets.length} open ticket{contact.tickets.length !== 1 ? 's' : ''}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex flex-col items-end gap-2 ml-4">
                    {contact.email ? (
                      <>
                        {getPortalStatus(contact) === "Active" ? (
                          <Badge variant="default" className="bg-green-600">
                            ✓ Has Active Contract
                          </Badge>
                        ) : (
                          <CustomerPortalInviteButton 
                            contact={contact}
                            onSuccess={fetchContacts}
                          />
                        )}
                      </>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Add Email to Create Contract
                      </Badge>
                    )}
                    
                    <div className="flex items-center gap-1">
                      {canEdit && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setEditingContact(contact)}
                          title="Edit contact"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {canDelete && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteContact(contact)}
                          title="Delete contact"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <Button variant="ghost" size="sm" title="More options">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Contact Dialog */}
      {editingContact && (
        <Dialog open={!!editingContact} onOpenChange={() => setEditingContact(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Contact</DialogTitle>
              <DialogDescription>
                Update contact information
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!editingContact) return;

              const formData = new FormData(e.currentTarget);
              const data = {
                firstName: formData.get('firstName'),
                lastName: formData.get('lastName'),
                email: formData.get('email') || undefined,
                phone: formData.get('phone') || undefined,
                company: formData.get('company') || undefined,
                jobTitle: formData.get('jobTitle') || undefined,
                notes: formData.get('notes') || undefined,
              };

              const loadingToast = toast.loading('Updating contact...');

              try {
                await apiClient.patch(`/contacts/${editingContact.id}`, data);
                toast.success('Contact updated successfully!', { id: loadingToast });
                setEditingContact(null);
                fetchContacts();
              } catch (error: unknown) {
                const apiError = error as { response?: { data?: { message?: string } } };
                const errorMessage = error instanceof Error 
                  ? error.message 
                  : apiError?.response?.data?.message || 'Failed to update contact';
                toast.error(errorMessage, { id: loadingToast });
                console.error('Failed to update contact:', error);
              }
            }}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">First Name *</label>
                    <input
                      name="firstName"
                      defaultValue={editingContact.firstName}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Last Name</label>
                    <input
                      name="lastName"
                      defaultValue={editingContact.lastName}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Email</label>
                  <input
                    name="email"
                    type="email"
                    defaultValue={editingContact.email}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Phone</label>
                  <input
                    name="phone"
                    type="tel"
                    defaultValue={editingContact.phone}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Company</label>
                    <input
                      name="company"
                      defaultValue={editingContact.company}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Job Title</label>
                    <input
                      name="jobTitle"
                      defaultValue={editingContact.jobTitle}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Notes</label>
                  <textarea
                    name="notes"
                    defaultValue={editingContact.notes}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingContact(null)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                  Update Contact
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
"use client";

import { useState, useEffect } from 'react';
import { Phone, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useApiClient } from '@/lib/api';
import { toast } from 'react-hot-toast';

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  company?: string;
}

interface DialerProps {
  onCall: (toNumber: string, contactId?: string, contactName?: string) => void;
  disabled?: boolean;
}

export function Dialer({ onCall, disabled }: DialerProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  
  const apiClient = useApiClient();

  // Search contacts by name or phone
  useEffect(() => {
    const searchContacts = async () => {
      if (searchQuery.length < 2) {
        setContacts([]);
        return;
      }

      try {
        // Backend filters by tenantId automatically via ClerkAuthGuard
        const response = await apiClient.get('/contacts', {
          params: { search: searchQuery },
        });
        setContacts(response.data.slice(0, 5)); // Limit to 5 results
      } catch (error) {
        console.error('Failed to search contacts:', error);
      }
    };

    const debounce = setTimeout(searchContacts, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, apiClient]);

  const handleDialPad = (digit: string) => {
    setPhoneNumber((prev) => prev + digit);
  };

  const handleBackspace = () => {
    setPhoneNumber((prev) => prev.slice(0, -1));
  };

  const formatPhoneNumber = (number: string): string => {
    // Remove all non-numeric characters except +
    let formatted = number.replace(/[^0-9+]/g, '');
    
    // Auto-format Bangladesh numbers (01XXXXXXXXX -> +8801XXXXXXXXX)
    if (formatted.startsWith('01') && formatted.length === 11) {
      formatted = `+880${formatted.slice(1)}`;
      toast.success(`Formatted as Bangladesh number: ${formatted}`, { duration: 2000 });
    }
    // Auto-format US numbers (10 digits -> +1XXXXXXXXXX)
    else if (formatted.length === 10 && /^\d{10}$/.test(formatted)) {
      formatted = `+1${formatted}`;
      toast.success(`Formatted as US number: ${formatted}`, { duration: 2000 });
    }
    // Add + if missing
    else if (!formatted.startsWith('+') && formatted.length > 10) {
      formatted = `+${formatted}`;
    }
    
    return formatted;
  };

  const handleCall = () => {
    let number = selectedContact?.phone || phoneNumber;
    
    if (!number || number.length < 10) {
      toast.error('Please enter a valid phone number (at least 10 digits)');
      return;
    }

    // Format the number
    number = formatPhoneNumber(number);
    
    // Validate E.164 format
    if (!number.startsWith('+')) {
      toast.error('Phone number must start with + and country code.\nExample: +8801712345678 (Bangladesh) or +17085547043 (US)');
      return;
    }

    onCall(
      number,
      selectedContact?.id,
      selectedContact ? `${selectedContact.firstName} ${selectedContact.lastName}` : undefined
    );
  };

  const selectContact = (contact: Contact) => {
    setSelectedContact(contact);
    setPhoneNumber(contact.phone || '');
    setSearchQuery('');
    setContacts([]);
  };

  const clearSelection = () => {
    setSelectedContact(null);
    setPhoneNumber('');
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="space-y-4">
        {/* Contact Search */}
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={disabled}
            />
          </div>
          
          {/* Search Results Dropdown */}
          {contacts.length > 0 && (
            <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {contacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => selectContact(contact)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0"
                >
                  <div className="font-medium text-gray-900">
                    {contact.firstName} {contact.lastName}
                  </div>
                  <div className="text-sm text-gray-500">
                    {contact.phone && <span>{contact.phone}</span>}
                    {contact.company && <span className="ml-2">• {contact.company}</span>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected Contact */}
        {selectedContact && (
          <div className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">
                {selectedContact.firstName} {selectedContact.lastName}
              </div>
              <div className="text-sm text-gray-600">{selectedContact.phone}</div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Phone Number Display */}
        <div className="relative">
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9+]/g, ''))}
            placeholder="Enter phone number"
            className="w-full px-4 py-4 text-2xl text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            disabled={disabled}
          />
          {phoneNumber && (
            <button
              onClick={handleBackspace}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Dial Pad */}
        <div className="grid grid-cols-3 gap-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((digit) => (
            <Button
              key={digit}
              onClick={() => handleDialPad(digit)}
              variant="outline"
              className="h-16 text-xl font-semibold"
              disabled={disabled}
            >
              {digit}
            </Button>
          ))}
        </div>

        {/* Call Button */}
        <Button
          onClick={handleCall}
          disabled={disabled || !phoneNumber || phoneNumber.length < 10}
          className="w-full h-14 text-lg bg-linear-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600"
        >
          <Phone className="w-5 h-5 mr-2" />
          Call
        </Button>
      </div>
    </Card>
  );
}

"use client";

import { Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';

interface CallButtonProps {
  phoneNumber?: string | null;
  contactId?: string;
  contactName?: string;
  onCall: (toNumber: string, contactId?: string, contactName?: string) => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function CallButton({
  phoneNumber,
  contactId,
  contactName,
  onCall,
  variant = 'default',
  size = 'default',
  className = '',
}: CallButtonProps) {
  const handleClick = () => {
    if (!phoneNumber) {
      toast.error('No phone number available');
      return;
    }

    onCall(phoneNumber, contactId, contactName);
  };

  return (
    <Button
      onClick={handleClick}
      disabled={!phoneNumber}
      variant={variant}
      size={size}
      className={`${className} ${!phoneNumber ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={phoneNumber ? `Call ${contactName || phoneNumber}` : 'No phone number'}
    >
      <Phone className="w-4 h-4 mr-2" />
      {size !== 'icon' && 'Call'}
    </Button>
  );
}

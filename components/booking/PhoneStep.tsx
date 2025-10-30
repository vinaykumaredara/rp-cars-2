import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchUserProfile, updateUserPhone } from '../../lib/userService';
import type { BookingDraft } from '../../types';

interface PhoneStepProps {
  bookingData: BookingDraft;
  updateBookingData: (updates: Partial<BookingDraft>) => void;
  nextStep: () => void;
  isAuthenticatedAndPhoneVerified: boolean;
}

const PhoneStep: React.FC<PhoneStepProps> = ({ 
  bookingData, updateBookingData, nextStep, isAuthenticatedAndPhoneVerified
}) => {
  const { user } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState(bookingData.phoneData?.phone || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialPhoneLoaded, setInitialPhoneLoaded] = useState(false);

  const fetchUserPhone = useCallback(async () => {
    if (user && !initialPhoneLoaded) {
      setIsLoading(true);
      const { profile, error: fetchError } = await fetchUserProfile(user.id);

      if (fetchError) {
        setError('Failed to load user phone number.');
      } else if (profile && profile.phone && profile.status === 'active') {
        setPhoneNumber(profile.phone);
        updateBookingData({ phoneData: { phone: profile.phone } });
        nextStep();
      }
      setInitialPhoneLoaded(true);
      setIsLoading(false);
    }
  }, [user, initialPhoneLoaded, updateBookingData, nextStep]);

  useEffect(() => {
    fetchUserPhone();
  }, [fetchUserPhone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to verify your phone number.');
      return;
    }
    if (!phoneNumber || phoneNumber.length < 10) {
      setError('Please enter a valid phone number (at least 10 digits).');
      return;
    }

    setIsLoading(true);
    setError(null);

    const { error: updateError } = await updateUserPhone(user.id, phoneNumber);

    if (updateError) {
      setError(updateError);
    } else {
      updateBookingData({ phoneData: { phone: phoneNumber } });
      nextStep();
    }
    setIsLoading(false);
  };

  if (isLoading && !initialPhoneLoaded) {
    return <div className="text-center py-8 text-gray-600">Checking phone verification...</div>;
  }
  
  if (isAuthenticatedAndPhoneVerified && initialPhoneLoaded) {
    // This case is handled by useBooking hook auto-advancing the step.
    // This UI is a fallback in case of race conditions.
    return <div className="text-center py-8 text-gray-600">Phone verified, proceeding...</div>
  }

  return (
    <div className="space-y-6">
      <p className="text-gray-700">Please confirm or update your phone number to proceed with the booking.</p>
      
      {error && <p className="bg-red-100 text-red-700 p-3 rounded-md text-sm">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
          <input
            type="tel"
            id="phoneNumber"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="e.g., +91 9876543210"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
          />
        </div>
        
        <div className="flex justify-end space-x-4">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-hover transition disabled:bg-opacity-50"
          >
            {isLoading ? 'Saving...' : 'Confirm Phone'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PhoneStep;

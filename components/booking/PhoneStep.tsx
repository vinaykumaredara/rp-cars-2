import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import type { Car, BookingDraft, PhoneData, UserStatus } from '../../types';

interface PhoneStepProps {
  car: Car;
  bookingData: BookingDraft;
  updateBookingData: (updates: Partial<BookingDraft>) => void;
  nextStep: () => void;
  prevStep: () => void;
  isAuthenticatedAndPhoneVerified: boolean;
}

const PhoneStep: React.FC<PhoneStepProps> = ({ 
  car, bookingData, updateBookingData, nextStep, prevStep, isAuthenticatedAndPhoneVerified
}) => {
  const { user } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState(bookingData.phoneData?.phone || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialPhoneLoaded, setInitialPhoneLoaded] = useState(false);

  useEffect(() => {
    const fetchUserPhone = async () => {
      if (user && !initialPhoneLoaded) {
        setIsLoading(true);
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('phone, status')
          .eq('id', user.id)
          .maybeSingle(); // Changed from .single() to avoid error if profile doesn't exist

        if (profileError) {
          console.error('Error fetching phone in PhoneStep:', profileError);
          setError('Failed to load user phone number.');
        } else if (profile && profile.phone && profile.status === 'active') {
          setPhoneNumber(profile.phone);
          updateBookingData({ phoneData: { phone: profile.phone } });
          nextStep(); // Automatically proceed if phone is already set and active
        }
        setInitialPhoneLoaded(true);
        setIsLoading(false);
      }
    };
    fetchUserPhone();
  }, [user, initialPhoneLoaded, updateBookingData, nextStep]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to verify your phone number.');
      return;
    }
    if (!phoneNumber || phoneNumber.length < 10) { // Basic validation
      setError('Please enter a valid phone number (at least 10 digits).');
      return;
    }

    setIsLoading(true);
    setError(null);

    // Use upsert to create a profile if it doesn't exist, or update it if it does.
    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert({ id: user.id, phone: phoneNumber, status: 'active' as UserStatus, updated_at: new Date().toISOString() }, { onConflict: 'id' });

    if (upsertError) {
      console.error('Error updating phone number:', upsertError);
      setError('Failed to save phone number. Please try again.');
    } else {
      updateBookingData({ phoneData: { phone: phoneNumber } });
      nextStep(); // Proceed to the next step
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return <div className="text-center py-8 text-gray-600">Checking phone verification...</div>;
  }

  // If phone is already verified and we've landed here, this should ideally be skipped by useBooking.
  // This fallback ensures we don't get stuck.
  if (isAuthenticatedAndPhoneVerified && initialPhoneLoaded) {
    return (
        <div className="text-center py-8">
            <svg className="w-16 h-16 mx-auto text-green-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <h3 className="text-xl font-bold text-foreground">Phone Verified!</h3>
            <p className="text-gray-600 mt-2">Redirecting to next step...</p>
        </div>
    )
  }

  return (
    <div className="space-y-6">
      <p className="text-gray-700">Please confirm or update your phone number to proceed with the booking.</p>
      
      {error && <p className="bg-red-100 text-red-700 p-3 rounded-md text-sm">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
          <input
            type="tel" // Use type="tel" for phone numbers
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
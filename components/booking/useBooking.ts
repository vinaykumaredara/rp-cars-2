import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import type { Car, BookingDraft, BookingStep } from '../../types';

import PhoneStep from './PhoneStep';
import DatesStep from './DatesStep';
import TermsStep from './TermsStep';
import LicenseStep from './LicenseStep';
import ExtrasStep from './ExtrasStep';
import PaymentStep from './PaymentStep';
import ConfirmationStep from './ConfirmationStep';

const bookingSteps: BookingStep[] = [
  { title: 'Confirm Your Phone Number', component: PhoneStep },
  { title: 'Select Dates & Times', component: DatesStep },
  { title: 'Terms & Conditions', component: TermsStep },
  { title: 'Upload Driving License', component: LicenseStep },
  { title: 'Choose Extras', component: ExtrasStep },
  { title: 'Payment Options', component: PaymentStep },
  { title: 'Booking Confirmation', component: ConfirmationStep },
];

export interface UseBookingResult {
  currentStep: number;
  bookingData: BookingDraft;
  isLoading: boolean;
  bookingError: string | null;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (stepIndex: number) => void;
  resetBooking: () => void;
  updateBookingData: (updates: Partial<BookingDraft>) => void;
  stepsConfig: BookingStep[];
  isAuthenticatedAndPhoneVerified: boolean;
}

export const useBooking = (car: Car | null): UseBookingResult => {
  const { user, loading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [bookingData, setBookingData] = useState<BookingDraft>({ carId: car?.id || '', currentStep: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [userPhone, setUserPhone] = useState<string | null>(null);

  const stepsConfig = useMemo(() => bookingSteps, []);

  const updateBookingData = useCallback((updates: Partial<BookingDraft>) => {
    setBookingData(prev => ({ ...prev, ...updates }));
  }, []);

  useEffect(() => {
    const initializeBooking = async () => {
      if (authLoading || !car) return;

      setIsLoading(true);
      setBookingError(null);

      if (!user) {
        setBookingError("Please sign in or create an account to proceed with booking.");
        setIsLoading(false);
        return;
      }

      const savedDraft = sessionStorage.getItem(`bookingDraft-${user.id}-${car.id}`);
      if (savedDraft) {
        const draft: BookingDraft = JSON.parse(savedDraft);
        setBookingData(draft);
        setCurrentStep(draft.currentStep);
      } else {
        updateBookingData({ carId: car.id, currentStep: 0 });
      }

      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('phone, status')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) throw profileError;

        if (profile && profile.phone && profile.status === 'active') {
          setUserPhone(profile.phone);
          updateBookingData({ phoneData: { phone: profile.phone } });
          if (currentStep === 0) {
            setCurrentStep(1);
          }
        } else {
          setUserPhone(null);
          setCurrentStep(0);
        }
      } catch (error: any) {
        console.error('Error fetching user profile:', error);
        setBookingError('Failed to load your profile information. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    initializeBooking();
  }, [car, user, authLoading, updateBookingData]);

  useEffect(() => {
    if (user && bookingData.carId) {
      const draftToSave = { ...bookingData, currentStep };
      sessionStorage.setItem(`bookingDraft-${user.id}-${bookingData.carId}`, JSON.stringify(draftToSave));
    }
  }, [bookingData, currentStep, user]);

  const nextStep = useCallback(() => {
    setCurrentStep(prev => Math.min(prev + 1, stepsConfig.length - 1));
  }, [stepsConfig.length]);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  }, []);

  const goToStep = useCallback((stepIndex: number) => {
    setCurrentStep(Math.min(Math.max(stepIndex, 0), stepsConfig.length - 1));
  }, [stepsConfig.length]);

  const resetBooking = useCallback(() => {
    setBookingData({ carId: car?.id || '', currentStep: 0 });
    setCurrentStep(0);
    setBookingError(null);
    if (user && car) {
      sessionStorage.removeItem(`bookingDraft-${user.id}-${car.id}`);
    }
  }, [car, user]);

  const isAuthenticatedAndPhoneVerified = useMemo(() => !!user && !!userPhone, [user, userPhone]);

  return {
    currentStep, bookingData, isLoading, bookingError,
    nextStep, prevStep, goToStep, resetBooking, updateBookingData,
    stepsConfig, isAuthenticatedAndPhoneVerified,
  };
};

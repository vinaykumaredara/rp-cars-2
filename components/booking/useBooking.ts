import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import type { Car, BookingDraft, PhoneData, DatesData, BookingExtra, UserStatus } from '../../types';

// Import all step components
import PhoneStep from './PhoneStep';
import DatesStep from './DatesStep';
import TermsStep from './TermsStep';
import LicenseStep from './LicenseStep';
import ExtrasStep from './ExtrasStep';
import PaymentStep from './PaymentStep';
import ConfirmationStep from './ConfirmationStep';

// Define a type for a step in the booking process
interface BookingStep {
  title: string;
  component: React.FC<any>; // Component to render for this step
  // Add other step-specific properties like validation rules, prerequisites etc.
}

// Define the steps configuration based on your PRD
const bookingSteps: BookingStep[] = [
  { title: 'Confirm Your Phone Number', component: PhoneStep }, // Step 1: Phone Verification
  { title: 'Select Dates & Times', component: DatesStep },       // Step 2: Date & Time Selection
  { title: 'Terms & Conditions', component: TermsStep },         // Step 3: Terms Acceptance
  { title: 'Upload Driving License', component: LicenseStep },   // Step 4: License Upload
  { title: 'Choose Extras', component: ExtrasStep },             // Step 5: Extras Selection
  { title: 'Payment Options', component: PaymentStep },          // Step 6: Payment Options
  { title: 'Booking Confirmation', component: ConfirmationStep }, // Step 7: Confirmation
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

  // Memoize steps config
  const stepsConfig = useMemo(() => bookingSteps, []);

  // Effect to handle initial loading, auth check, and phone verification
  useEffect(() => {
    const initializeBooking = async () => {
      if (authLoading || !car) return;

      setIsLoading(true);
      setBookingError(null);

      if (!user) {
        // Step 3: Authentication Gate - If NOT logged in: Save draft and redirect.
        // For this phase, we're not fully implementing sessionStorage draft save and /auth redirect
        // within useBooking. Instead, App.tsx will prompt sign-in.
        // If the user then signs in, this hook will re-run.
        setBookingError("Please sign in or create an account to proceed with booking.");
        setIsLoading(false);
        return;
      }

      // Restore draft from sessionStorage if it exists for this car and user
      const savedDraft = sessionStorage.getItem(`bookingDraft-${user.id}-${car.id}`);
      if (savedDraft) {
        const draft: BookingDraft = JSON.parse(savedDraft);
        setBookingData(draft);
        setCurrentStep(draft.currentStep);
        console.log("Restored booking draft:", draft);
      } else {
        // Initialize with carId if no draft
        setBookingData(prev => ({ ...prev, carId: car.id, currentStep: 0 }));
      }

      // Check phone number for logged-in user (Step 4: Phone Verification)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('phone, status')
        .eq('id', user.id)
        .maybeSingle(); // Changed from .single() to .maybeSingle() to prevent error on new users

      if (profileError) {
        // The error object might be complex, so let's log it but show a user-friendly message.
        console.error('Error fetching user profile for phone check:', profileError);
        setBookingError('Failed to load your profile information. Please try again later.');
        setIsLoading(false);
        return;
      }

      if (profile && profile.phone && profile.status === 'active') {
        setUserPhone(profile.phone);
        // Automatically advance past PhoneStep if phone is verified
        if (currentStep === 0) { // Only auto-advance if we're on the phone step
          setCurrentStep(1); // Advance to DatesStep
        }
        updateBookingData({ phoneData: { phone: profile.phone } });
      } else {
        setUserPhone(null);
        // If phone missing or user inactive, ensure we start/stay on PhoneStep
        setCurrentStep(0);
      }
      setIsLoading(false);
    };

    initializeBooking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [car, user, authLoading]); // Re-run when car or user or auth loading state changes

  // Effect to save booking draft to sessionStorage whenever bookingData or currentStep changes
  useEffect(() => {
    if (user && bookingData.carId) {
      // Ensure currentStep is part of the saved draft
      const draftToSave = { ...bookingData, currentStep };
      sessionStorage.setItem(`bookingDraft-${user.id}-${bookingData.carId}`, JSON.stringify(draftToSave));
    }
  }, [bookingData, currentStep, user]);

  const updateBookingData = useCallback((updates: Partial<BookingDraft>) => {
    setBookingData(prev => ({ ...prev, ...updates }));
  }, []);

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

  const isAuthenticatedAndPhoneVerified = useMemo(() => {
    return !!user && !!userPhone;
  }, [user, userPhone]);

  return {
    currentStep,
    bookingData,
    isLoading,
    bookingError,
    nextStep,
    prevStep,
    goToStep,
    resetBooking,
    updateBookingData,
    stepsConfig,
    isAuthenticatedAndPhoneVerified,
  };
};

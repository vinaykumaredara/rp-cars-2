import React, { useState, useEffect, useMemo } from 'react';
import type { Car, BookingDraft } from '../types';
import { useAuth } from '../contexts/AuthContext'; // Added import
import { supabase } from '../lib/supabaseClient'; // Added import

// Import new step components
import { useBooking } from './booking/useBooking';
import PhoneStep from './booking/PhoneStep';
import DatesStep from './booking/DatesStep';
import TermsStep from './booking/TermsStep';
import LicenseStep from './booking/LicenseStep';
import ExtrasStep from './booking/ExtrasStep';
import PaymentStep from './booking/PaymentStep';
import ConfirmationStep from './booking/ConfirmationStep';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  car: Car | null;
  initialBookingState?: Partial<BookingDraft> | null;
}

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, car, initialBookingState }) => {
  const { user } = useAuth();
  
  // Use the new booking hook
  const {
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
  } = useBooking(car, initialBookingState);


  // Handle closing the modal and resetting booking state
  const handleCloseModal = () => {
    resetBooking(); // Reset all booking state
    onClose();      // Close the actual modal
  };

  if (!isOpen || !car || isLoading) {
    if (isLoading && !bookingError) { // Show loading state only if no error and still loading
      return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg mx-auto p-8 text-center flex flex-col items-center">
            <svg className="animate-spin h-8 w-8 text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-foreground">Loading booking...</p>
          </div>
        </div>
      );
    }
    return null; // Don't render modal if not open, no car, or if loading completed with an error
  }
  
  // If we have a bookingError from the hook, display it centrally
  if (bookingError) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg mx-auto p-8">
          <h2 className="text-2xl font-bold text-red-700 mb-4">Booking Error</h2>
          <p className="text-gray-700 mb-6">{bookingError}</p>
          <button onClick={handleCloseModal} className="w-full py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary-hover transition">
            Close
          </button>
        </div>
      </div>
    );
  }

  const CurrentStepComponent = stepsConfig[currentStep]?.component;
  const currentStepTitle = stepsConfig[currentStep]?.title;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4"
      onClick={handleCloseModal}
    >
      <div 
        className="bg-white rounded-lg shadow-2xl w-full max-w-lg mx-auto p-8 transform transition-all duration-300 ease-in-out flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'fadeInScale 0.3s forwards' }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-foreground">{currentStepTitle}</h2>
          <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        {/* Progress Indicator */}
        <div className="mb-6">
            <p className="text-sm text-gray-500 text-center">Step {currentStep + 1} of {stepsConfig.length -1}</p> {/* -1 because ConfirmationStep is the last visual step, but not part of progressive data entry */}
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                <div 
                    className="bg-primary h-1.5 rounded-full" 
                    style={{ width: `${((currentStep + 1) / stepsConfig.length) * 100}%` }}
                ></div>
            </div>
        </div>

        {/* Current Step Content */}
        <div className="flex-grow overflow-y-auto pr-2 -mr-2"> {/* Added overflow for content */}
          {CurrentStepComponent && (
            <CurrentStepComponent
              car={car}
              bookingData={bookingData}
              updateBookingData={updateBookingData}
              nextStep={nextStep}
              prevStep={prevStep}
              onClose={handleCloseModal} // Pass onClose for final step
              isAuthenticatedAndPhoneVerified={isAuthenticatedAndPhoneVerified}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
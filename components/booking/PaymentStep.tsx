import React, { useState, useMemo } from 'react';
import type { Car, BookingDraft, DatesData, ExtrasData } from '../../types';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

interface PaymentStepProps {
  car: Car;
  bookingData: BookingDraft;
  updateBookingData: (updates: Partial<BookingDraft>) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const PaymentStep: React.FC<PaymentStepProps> = ({ car, bookingData, updateBookingData, nextStep, prevStep }) => {
  const { user } = useAuth();
  const { datesData, extrasData } = bookingData;
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Derive total amounts based on bookingData
  const numberOfDays = useMemo(() => {
    if (!datesData) return 0;
    const { pickupDate, pickupTime, returnDate, returnTime } = datesData;
    const start = new Date(`${pickupDate}T${pickupTime}`);
    const end = new Date(`${returnDate}T${returnTime}`);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) return 0;
    const diffMs = end.getTime() - start.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }, [datesData]);

  const baseRentalPrice = car ? numberOfDays * car.pricePerDay : 0;
  const selectedExtrasPrice = useMemo(() => {
    return (extrasData?.extras || []).reduce((sum, extra) => sum + (extra.selected ? extra.pricePerDay * numberOfDays : 0), 0);
  }, [extrasData, numberOfDays]);

  const serviceChargeRate = 0.05; // 5%
  const serviceCharge = (baseRentalPrice + selectedExtrasPrice) * serviceChargeRate;
  
  const totalAmount = baseRentalPrice + selectedExtrasPrice + serviceCharge;
  const advanceAmount = totalAmount * 0.10; // 10% for advance booking

  const paymentMode = extrasData?.advancePaymentOptionSelected ? 'hold' : 'full';
  const amountToPay = paymentMode === 'hold' ? advanceAmount : totalAmount;

  const handleProcessPayment = async () => {
    if (!user || !car || !datesData) {
      setError('Missing booking details. Please go back and fill all required information.');
      return;
    }

    setPaymentProcessing(true);
    setError(null);

    try {
      // TODO: Implement actual payment processing via Supabase Edge Function ('create-hold' function)
      // This would typically involve:
      // 1. Calling your `create-hold` Edge Function with booking details.
      // 2. The Edge Function interacts with a payment gateway (Stripe/Razorpay) to create a Payment Intent.
      // 3. The Edge Function creates `bookings` and `payments` records with status 'pending'.
      // 4. The Edge Function returns a client_secret or redirect URL for the frontend to complete payment.
      // For this phase, we simulate a successful payment.

      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call

      console.log(`Simulating ${paymentMode} payment of ₹${amountToPay.toLocaleString()}`);

      // After simulated successful payment processing:
      updateBookingData({ 
        paymentData: { paymentMode: paymentMode }
      });

      // TODO: Actual database booking/payment insertion after successful gateway interaction.
      // This is currently in BookingModal.tsx's old logic and needs to be moved to backend functions.
      // For now, we manually confirm (as a placeholder for backend success).
      nextStep(); // Proceed to confirmation
      
    } catch (err: any) {
      console.error('Payment processing failed:', err);
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setPaymentProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-gray-700">Review your booking and choose your payment option.</p>
      
      {error && <p className="bg-red-100 text-red-700 p-3 rounded-md text-sm">{error}</p>}

      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-semibold text-lg text-foreground mb-2">Payment Breakdown</h4>
        <div className="space-y-1 text-gray-700 text-sm">
          <div className="flex justify-between"><span>Base Rental ({numberOfDays} days)</span><span>₹{baseRentalPrice.toLocaleString()}</span></div>
          <div className="flex justify-between"><span>Selected Extras</span><span>₹{selectedExtrasPrice.toLocaleString()}</span></div>
          <div className="flex justify-between"><span>Service Charge (5%)</span><span>₹{serviceCharge.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
          <div className="flex justify-between font-bold text-base border-t border-blue-200 pt-2 mt-2"><span>Total Amount</span><span>₹{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
        </div>
      </div>

      <div className="p-4 rounded-lg border border-primary text-center">
        <h4 className="text-xl font-bold text-primary mb-2">
          {paymentMode === 'full' ? 'Full Payment' : 'Advance Payment (10%)'}
        </h4>
        <p className="text-2xl font-bold text-foreground">₹{amountToPay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        <p className="text-sm text-gray-600 mt-1">
          {paymentMode === 'full' ? 'Pay the full amount now to confirm your booking.' : 'Pay 10% now to reserve your car (10-minute hold).'}
        </p>
      </div>

      <div className="flex justify-between space-x-4 pt-4">
        <button
          onClick={prevStep}
          className="px-6 py-2 rounded-lg bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition"
          disabled={paymentProcessing}
        >
          Back
        </button>
        <button
          onClick={handleProcessPayment}
          disabled={paymentProcessing}
          className="px-6 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-hover transition disabled:bg-opacity-50"
        >
          {paymentProcessing ? 'Processing Payment...' : 'Proceed to Payment'}
        </button>
      </div>
    </div>
  );
};

export default PaymentStep;
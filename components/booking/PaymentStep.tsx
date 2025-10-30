import React, { useState, useMemo } from 'react';
import { createBooking } from '../../lib/bookingService';
import type { Car, BookingDraft } from '../../types';
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

  const { totalAmount, amountToPay, paymentMode, numberOfDays, baseRentalPrice, selectedExtrasPrice, serviceCharge } = useMemo(() => {
    // Fix: Use a const assertion on 'paymentMode'. This prevents TypeScript from widening the literal 'full'
    // to the general type 'string', ensuring the inferred type for 'paymentMode' remains '"full" | "hold"'.
    if (!datesData || !extrasData) return { totalAmount: 0, amountToPay: 0, paymentMode: 'full' as const, numberOfDays: 0, baseRentalPrice: 0, selectedExtrasPrice: 0, serviceCharge: 0 };
    
    const start = new Date(`${datesData.pickupDate}T${datesData.pickupTime}`);
    const end = new Date(`${datesData.returnDate}T${datesData.returnTime}`);
    const days = Math.max(Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)), 1);
    
    const basePrice = car.pricePerDay * days;
    const extrasPrice = extrasData.extras.reduce((sum, extra) => sum + (extra.selected ? extra.pricePerDay * days : 0), 0);
    const service = (basePrice + extrasPrice) * 0.05;
    const total = basePrice + extrasPrice + service;
    // FIX: Explicitly type `mode` to prevent TypeScript from widening its type to a generic `string`
    // within the useMemo hook, ensuring it matches the expected '"full" | "hold"' type.
    const mode: 'full' | 'hold' = extrasData.advancePaymentOptionSelected ? 'hold' : 'full';
    const amount = mode === 'hold' ? total * 0.10 : total;

    return { totalAmount: total, amountToPay: amount, paymentMode: mode, numberOfDays: days, baseRentalPrice: basePrice, selectedExtrasPrice: extrasPrice, serviceCharge: service };
  }, [car, datesData, extrasData]);

  const handleProcessPayment = async () => {
    if (!user) {
      setError('You must be signed in to complete the booking.');
      return;
    }
    setPaymentProcessing(true);
    setError(null);

    // Simulate calling the payment gateway and then creating the booking
    await new Promise(resolve => setTimeout(resolve, 1500)); 

    const { data, error: bookingError } = await createBooking(bookingData, car, user);

    if (bookingError) {
      setError(bookingError);
    } else if (data) {
      updateBookingData({ 
        paymentData: { paymentMode },
        bookingId: data.id 
      });
      nextStep();
    }
    setPaymentProcessing(false);
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
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
    return Math.max(Math.ceil(diffMs / (1000 * 60 * 60 * 24)), 1);
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
      // Simulate API call for payment gateway interaction
      await new Promise(resolve => setTimeout(resolve, 1500)); 

      console.log(`Simulating ${paymentMode} payment of ₹${amountToPay.toLocaleString()}`);

      const startDateTime = new Date(`${datesData.pickupDate}T${datesData.pickupTime}`);
      const endDateTime = new Date(`${datesData.returnDate}T${datesData.returnTime}`);

      const bookingRecord = {
        user_id: user.id,
        car_id: car.id,
        start_datetime: startDateTime.toISOString(),
        end_datetime: endDateTime.toISOString(),
        total_amount: totalAmount,
        amount_paid: amountToPay,
        payment_mode: paymentMode,
        status: 'confirmed', // Simulating successful payment, in real app this would be 'pending' then confirmed by webhook
        extras: extrasData?.extras.filter(e => e.selected),
        user_phone: bookingData.phoneData?.phone
      };

      const { data, error: insertError } = await supabase
        .from('bookings')
        .insert(bookingRecord)
        .select()
        .single(); // Use single() as we expect one record back

      if (insertError) {
        throw new Error(`Failed to save your booking: ${insertError.message}`);
      }

      // After successful insert, store the new booking ID and proceed
      updateBookingData({ 
        paymentData: { paymentMode: paymentMode },
        bookingId: data.id 
      });

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
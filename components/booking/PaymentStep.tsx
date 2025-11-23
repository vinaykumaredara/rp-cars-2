import React, { useState, useMemo } from 'react';
import { createBookingAndPayment } from '../../lib/bookingService';
import type { Car, BookingDraft } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { calculateBookingPrice } from '../../lib/bookingUtils';

interface PaymentStepProps {
  car: Car;
  bookingData: BookingDraft;
  updateBookingData: (updates: Partial<BookingDraft>) => void;
  nextStep: () => void;
  prevStep: () => void;
  onClose: () => void;
}

const PaytmIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 73 22" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.352 2.52h5.736v2.928h-5.736V2.52z" fill="#00B9F1"></path><path d="m14.864 19.432-8.52-16.912H0l8.16 16.944h.336l8.24-16.944h-6.168l-5.368 11.64-.136.296-.112.256-.12.28-.072.176-.112.288-.048.136-.08.24-.024.08-.056.2-.008.04-.04.16v.016l-1.36-2.912L14.864 19.432z" fill="#002E6E"></path><path d="M34.25 2.52h5.736v2.928H34.25V2.52z" fill="#00B9F1"></path><path d="M36.761 19.432l-8.52-16.912H22.08l8.16 16.944h.336l8.24-16.944h-6.168l-5.368 11.64-.136.296-.112.256-.12.28-.072.176-.112.288-.048.136-.08.24-.024.08-.056.2-.008.04-.04.16v.016l-1.36-2.912L36.761 19.432z" fill="#002E6E"></path><path d="M56.148 2.52h5.736v2.928h-5.736V2.52z" fill="#00B9F1"></path><path d="M64.716 2.52h-6.52l-9.696 16.912h6.32l2.216-3.88h8.04l.936 3.88h6.136L64.716 2.52zm-3.144 10.328-2.6-4.52-2.584 4.52h5.184z" fill="#002E6E"></path></svg>
);


const PaymentStep: React.FC<PaymentStepProps> = ({ car, bookingData, updateBookingData, nextStep, prevStep, onClose }) => {
  const { user } = useAuth();
  const { datesData, extrasData, appliedPromo } = bookingData;
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    billingDays,
    baseRentalPrice,
    selectedExtrasPrice,
    subtotal,
    discountAmount,
    serviceCharge,
    totalAmount,
    advanceAmount,
  } = useMemo(() => calculateBookingPrice(datesData, extrasData, car.pricePerDay, appliedPromo), [car, datesData, extrasData, appliedPromo]);

  const paymentMode = extrasData?.advancePaymentOptionSelected ? 'hold' : 'full';
  const amountToPay = paymentMode === 'hold' ? advanceAmount : totalAmount;
  
  const handlePaytmPayment = async () => {
    if (!user) {
        setError('You must be signed in to complete the booking.');
        return;
    }
    setPaymentProcessing(true);
    setError(null);

    // Save current booking state to session storage for potential retry
    sessionStorage.setItem('paymentAttemptInfo', JSON.stringify({ car, bookingData }));

    // Step 1: Create the booking and a pending payment record
    const { data: initialData, error: creationError } = await createBookingAndPayment(
        bookingData, car, user, amountToPay, 'paytm'
    );

    if (creationError) {
        setError(creationError);
        setPaymentProcessing(false);
        return;
    }
    
    const { bookingId, paymentId } = initialData;
    updateBookingData({ bookingId, paymentData: { paymentMode, paymentId } });

    // Step 2: Simulate redirect to Paytm and back to our callback handler
    // In a real app, you would use Paytm's JS SDK or redirect to their URL here.
    setTimeout(() => {
        // Close the modal as the user is "redirected"
        onClose();
        // Simulate a successful payment by redirecting to our callback handler
        window.location.hash = `#/payment/callback?payment_id=${paymentId}&booking_id=${bookingId}&car_id=${car.id}&status=success`;
    }, 2000); // 2-second delay to simulate the process
  };

  if (paymentProcessing) {
      return (
        <div className="text-center py-8">
            <svg className="animate-spin h-8 w-8 text-primary mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="font-semibold text-lg">Connecting to Paytm...</p>
            <p className="text-gray-600">You will be redirected to complete your payment securely.</p>
        </div>
      );
  }

  return (
    <div className="space-y-6">
      <p className="text-gray-700">Review your booking summary and proceed to payment.</p>
      
      {error && <p className="bg-red-100 text-red-700 p-3 rounded-md text-sm">{error}</p>}

      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-semibold text-lg text-foreground mb-2">Payment Breakdown</h4>
        <div className="space-y-1 text-gray-700 text-sm">
          <div className="flex justify-between"><span>Base Rental ({billingDays} billing days)</span><span>₹{baseRentalPrice.toLocaleString()}</span></div>
          <div className="flex justify-between"><span>Selected Extras</span><span>₹{selectedExtrasPrice.toLocaleString()}</span></div>
          <div className="flex justify-between font-semibold"><span>Subtotal</span><span>₹{subtotal.toLocaleString()}</span></div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-green-600"><span>Discount ({bookingData.appliedPromo?.code})</span><span>- ₹{discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
          )}
          <div className="flex justify-between"><span>Service Charge (5%)</span><span>₹{serviceCharge.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
          <div className="flex justify-between font-bold text-base border-t border-blue-200 pt-2 mt-2"><span>Grand Total</span><span>₹{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
        </div>
      </div>

      <div className="p-4 rounded-lg border-2 border-primary text-center">
        <p className="text-sm font-semibold text-gray-600">
            {paymentMode === 'full' ? 'FULL AMOUNT TO PAY' : 'PAYABLE ADVANCE (10%)'}
        </p>
        <p className="text-3xl font-bold text-foreground mt-1">₹{amountToPay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
      </div>

      <div className="pt-4 space-y-3">
        <button
          onClick={handlePaytmPayment}
          disabled={paymentProcessing}
          className="w-full px-6 py-3 rounded-lg bg-[#00B9F1] text-white font-bold hover:opacity-90 transition disabled:bg-opacity-50 flex items-center justify-center"
        >
          <PaytmIcon className="h-5 mr-3" /> Pay with Paytm
        </button>
        {/* Placeholder for other payment methods */}
        <button disabled className="w-full px-6 py-3 rounded-lg bg-gray-300 text-gray-500 font-semibold cursor-not-allowed">
            Pay with Card (Coming Soon)
        </button>
      </div>

      <div className="flex justify-start pt-4">
        <button
          onClick={prevStep}
          className="px-6 py-2 rounded-lg bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition"
          disabled={paymentProcessing}
        >
          Back
        </button>
      </div>
    </div>
  );
};

export default PaymentStep;

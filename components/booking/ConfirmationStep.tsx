import React, { useMemo } from 'react';
import type { Car, BookingDraft } from '../../types';
import { calculateBookingPrice } from '../../lib/bookingUtils';

interface ConfirmationStepProps {
  car: Car;
  bookingData: BookingDraft;
  updateBookingData: (updates: Partial<BookingDraft>) => void;
  nextStep: () => void; // Not used in confirmation, but part of generic props
  prevStep: () => void; // Not used in confirmation, but part of generic props
  onClose: () => void; // Provided by BookingModal
}

const ConfirmationStep: React.FC<ConfirmationStepProps> = ({ car, bookingData, onClose }) => {
  const { datesData, extrasData } = bookingData;

  const { totalAmount, advanceAmount } = useMemo(() => {
    return calculateBookingPrice(datesData, extrasData, car.pricePerDay);
  }, [datesData, extrasData, car.pricePerDay]);

  const amountPaid = bookingData.paymentData?.paymentMode === 'hold' ? advanceAmount : totalAmount;
  
  const handleViewBookings = () => {
    onClose();
    window.location.hash = '#/dashboard';
  };

  return (
    <div className="text-center py-8 space-y-4">
      <svg className="w-16 h-16 mx-auto text-green-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      <h3 className="text-2xl font-bold text-foreground">Booking Confirmed!</h3>
      <p className="text-gray-600 mt-2">
        Your booking for the <span className="font-semibold">{car.title}</span> has been successfully processed.
      </p>

      <div className="bg-blue-50 p-4 rounded-lg text-left mx-auto max-w-sm">
        <h4 className="font-semibold text-lg text-foreground mb-2">Booking Summary</h4>
        <div className="space-y-1 text-gray-700 text-sm">
          <div className="flex justify-between">
              <span>Booking ID</span>
              <span className="font-semibold">#{bookingData.bookingId?.split('-')[0].toUpperCase()}</span>
          </div>
          <div className="flex justify-between"><span>Pickup</span><span>{datesData?.pickupDate} {datesData?.pickupTime}</span></div>
          <div className="flex justify-between"><span>Return</span><span>{datesData?.returnDate} {datesData?.returnTime}</span></div>
          <div className="flex justify-between"><span>Amount Paid</span><span className="font-bold">₹{amountPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
          {bookingData.paymentData?.paymentMode === 'hold' && (
            <p className="text-xs text-red-600 mt-1">Remaining payment due at pickup (or within 24h for hold).</p>
          )}
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <button onClick={handleViewBookings} className="w-full py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary-hover transition">
          View My Bookings
        </button>
        <button onClick={onClose} className="w-full py-2 rounded-lg bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition">
          Done
        </button>
      </div>
    </div>
  );
};

export default ConfirmationStep;
import React, { useEffect, useMemo } from 'react';
import type { Car, BookingDraft, DatesData, ExtrasData } from '../../types';

interface ConfirmationStepProps {
  car: Car;
  bookingData: BookingDraft;
  updateBookingData: (updates: Partial<BookingDraft>) => void;
  nextStep: () => void; // Not used in confirmation, but part of generic props
  prevStep: () => void; // Not used in confirmation, but part of generic props
  onClose: () => void; // Provided by BookingModal
}

const ConfirmationStep: React.FC<ConfirmationStepProps> = ({ car, bookingData, onClose }) => {
  // Derive total amounts based on bookingData for display
  const { datesData, extrasData } = bookingData;

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
  const amountPaid = bookingData.paymentData?.paymentMode === 'hold' ? totalAmount * 0.10 : totalAmount;

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

      <button onClick={onClose} className="mt-6 w-full py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary-hover transition">
        Done
      </button>
      {/* TODO: Add "View Booking Details" button -> /user-dashboard */}
    </div>
  );
};

export default ConfirmationStep;

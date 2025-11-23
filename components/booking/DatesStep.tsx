import React, { useState, useEffect, useMemo } from 'react';
import type { Car, BookingDraft } from '../../types';
import { calculateBookingPrice } from '../../lib/bookingUtils';

interface DatesStepProps {
  car: Car;
  bookingData: BookingDraft;
  updateBookingData: (updates: Partial<BookingDraft>) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const DatesStep: React.FC<DatesStepProps> = ({ car, bookingData, updateBookingData, nextStep, prevStep }) => {
  const today = useMemo(() => new Date(), []);
  const tomorrow = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return d;
  }, [today]);

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  const [pickupDate, setPickupDate] = useState(bookingData.datesData?.pickupDate || formatDate(today));
  const [pickupTime, setPickupTime] = useState(bookingData.datesData?.pickupTime || '09:00');
  const [returnDate, setReturnDate] = useState(bookingData.datesData?.returnDate || formatDate(tomorrow));
  const [returnTime, setReturnTime] = useState(bookingData.datesData?.returnTime || '09:00');
  const [error, setError] = useState<string | null>(null);

  // Initialize with default values if not present in bookingData
  useEffect(() => {
    if (!bookingData.datesData) {
      updateBookingData({
        datesData: {
          pickupDate: formatDate(today),
          pickupTime: '09:00',
          returnDate: formatDate(tomorrow),
          returnTime: '09:00',
        }
      });
    }
  }, [bookingData.datesData, today, tomorrow, updateBookingData]);

  const { billingDays, totalAmount } = useMemo(() => {
    const dates = { pickupDate, pickupTime, returnDate, returnTime };
    const { billingDays, totalAmount } = calculateBookingPrice(dates, undefined, car.pricePerDay);
    return { billingDays, totalAmount };
  }, [pickupDate, pickupTime, returnDate, returnTime, car.pricePerDay]);

  const handleNext = () => {
    // Basic validation
    if (!pickupDate || !pickupTime || !returnDate || !returnTime) {
      setError('Please select both pickup and return dates and times.');
      return;
    }

    const startDateTime = new Date(`${pickupDate}T${pickupTime}`);
    const returnDateTime = new Date(`${returnDate}T${returnTime}`);
    const now = new Date();

    if (startDateTime < now) {
      setError('Pickup date and time cannot be in the past.');
      return;
    }
    if (returnDateTime <= startDateTime) {
      setError('Return date and time must be after pickup date and time.');
      return;
    }
    
    if (billingDays === 0) {
      setError('Minimum booking duration is 12 hours.');
      return;
    }

    setError(null);
    updateBookingData({
      datesData: {
        pickupDate,
        pickupTime,
        returnDate,
        returnTime,
      }
    });
    nextStep();
  };

  return (
    <div className="space-y-6">
      <p className="text-gray-700">Select your desired pickup and return dates and times.</p>
      
      {error && <p className="bg-red-100 text-red-700 p-3 rounded-md text-sm">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="pickupDate" className="block text-sm font-medium text-gray-700 mb-1">Pickup Date</label>
          <input
            type="date"
            id="pickupDate"
            value={pickupDate}
            min={formatDate(today)}
            onChange={e => setPickupDate(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
          />
        </div>
        <div>
          <label htmlFor="pickupTime" className="block text-sm font-medium text-gray-700 mb-1">Pickup Time</label>
          <input
            type="time"
            id="pickupTime"
            value={pickupTime}
            onChange={e => setPickupTime(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
          />
        </div>
        <div>
          <label htmlFor="returnDate" className="block text-sm font-medium text-gray-700 mb-1">Return Date</label>
          <input
            type="date"
            id="returnDate"
            value={returnDate}
            min={pickupDate || formatDate(today)} // Ensure return date is not before pickup date
            onChange={e => setReturnDate(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
          />
        </div>
        <div>
          <label htmlFor="returnTime" className="block text-sm font-medium text-gray-700 mb-1">Return Time</label>
          <input
            type="time"
            id="returnTime"
            value={returnTime}
            onChange={e => setReturnTime(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
          />
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex justify-between items-center text-lg">
          <span className="font-semibold text-foreground">Total Rental Price</span>
          <span className="font-bold text-primary">
            {totalAmount > 0 ? `₹${totalAmount.toLocaleString()}` : 'Select dates'}
          </span>
        </div>
        {billingDays > 0 && <p className="text-sm text-gray-600 text-right mt-1">For {billingDays} billing day(s)</p>}
      </div>

      <div className="flex justify-between space-x-4 pt-4">
        <button
          onClick={prevStep}
          className="px-6 py-2 rounded-lg bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          className="px-6 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-hover transition"
        >
          Next: Terms
        </button>
      </div>
    </div>
  );
};

export default DatesStep;
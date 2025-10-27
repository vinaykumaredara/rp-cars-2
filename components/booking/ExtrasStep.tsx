import React, { useState, useEffect, useMemo } from 'react';
import type { Car, BookingDraft, BookingExtra, DatesData } from '../../types';

interface ExtrasStepProps {
  car: Car;
  bookingData: BookingDraft;
  updateBookingData: (updates: Partial<BookingDraft>) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const defaultExtras: BookingExtra[] = [
  { name: 'Driver', pricePerDay: 500, selected: false },
  { name: 'GPS', pricePerDay: 200, selected: false },
  { name: 'Child Seat', pricePerDay: 150, selected: false },
  { name: 'Insurance', pricePerDay: 300, selected: false },
];

const ExtrasStep: React.FC<ExtrasStepProps> = ({ car, bookingData, updateBookingData, nextStep, prevStep }) => {
  const [extras, setExtras] = useState<BookingExtra[]>(bookingData.extrasData?.extras || defaultExtras);
  const [advancePaymentOptionSelected, setAdvancePaymentOptionSelected] = useState(bookingData.extrasData?.advancePaymentOptionSelected || false);

  const { datesData } = bookingData;

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
    return extras.reduce((sum, extra) => sum + (extra.selected ? extra.pricePerDay * numberOfDays : 0), 0);
  }, [extras, numberOfDays]);

  const serviceChargeRate = 0.05; // 5%
  const serviceCharge = (baseRentalPrice + selectedExtrasPrice) * serviceChargeRate;
  
  const totalAmount = baseRentalPrice + selectedExtrasPrice + serviceCharge;
  const advanceAmount = totalAmount * 0.10; // 10% for advance booking

  const handleExtraToggle = (index: number) => {
    setExtras(prev => prev.map((extra, i) => 
      i === index ? { ...extra, selected: !extra.selected } : extra
    ));
  };

  const handleNext = () => {
    updateBookingData({ 
      extrasData: {
        extras,
        advancePaymentOptionSelected
      }
    });
    nextStep();
  };

  return (
    <div className="space-y-6">
      <p className="text-gray-700">Customize your booking with optional extras for a better experience.</p>
      
      <div className="space-y-3">
        {extras.map((extra, index) => (
          <div key={extra.name} className="flex items-center justify-between border border-gray-200 p-3 rounded-lg bg-gray-50">
            <label htmlFor={`extra-${index}`} className="flex items-center cursor-pointer flex-grow">
              <input
                type="checkbox"
                id={`extra-${index}`}
                checked={extra.selected}
                onChange={() => handleExtraToggle(index)}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <span className="ml-3 text-sm font-medium text-gray-900">{extra.name}</span>
            </label>
            <span className="text-sm text-gray-600">₹{extra.pricePerDay}/day</span>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-semibold text-lg text-foreground mb-2">Booking Summary</h4>
        <div className="space-y-1 text-gray-700 text-sm">
          <div className="flex justify-between"><span>Base Rental ({numberOfDays} days)</span><span>₹{baseRentalPrice.toLocaleString()}</span></div>
          <div className="flex justify-between"><span>Selected Extras</span><span>₹{selectedExtrasPrice.toLocaleString()}</span></div>
          <div className="flex justify-between"><span>Service Charge (5%)</span><span>₹{serviceCharge.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
          <div className="flex justify-between font-bold text-base border-t border-blue-200 pt-2 mt-2"><span>Total Amount</span><span>₹{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
        </div>
      </div>

      <div className="flex items-center p-3 border border-gray-200 rounded-lg bg-yellow-50">
        <input
          type="checkbox"
          id="advancePayment"
          checked={advancePaymentOptionSelected}
          onChange={(e) => setAdvancePaymentOptionSelected(e.target.checked)}
          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
        />
        <label htmlFor="advancePayment" className="ml-3 text-sm font-medium text-gray-900 cursor-pointer">
          Pay 10% advance (₹{advanceAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}) to reserve now (10-minute hold)
        </label>
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
          Next: Payment
        </button>
      </div>
    </div>
  );
};

export default ExtrasStep;
import React, { useState, useMemo } from 'react';
import type { Car, BookingDraft, BookingExtra, ValidatedPromo } from '../../types';
import { calculateBookingPrice } from '../../lib/bookingUtils';
import { validatePromoCode } from '../../lib/promoService';
import { useToast } from '../../contexts/ToastContext';
import { parseError } from '../../lib/errorUtils';

interface ExtrasStepProps {
  car: Car;
  bookingData: BookingDraft;
  updateBookingData: (updates: Partial<BookingDraft>) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const defaultExtras: BookingExtra[] = [
  { name: 'GPS', pricePerDay: 200, selected: false },
  { name: 'Child Seat', pricePerDay: 150, selected: false },
  { name: 'Insurance', pricePerDay: 300, selected: false },
];

const ExtrasStep: React.FC<ExtrasStepProps> = ({ car, bookingData, updateBookingData, nextStep, prevStep }) => {
  const [extras, setExtras] = useState<BookingExtra[]>(bookingData.extrasData?.extras || defaultExtras);
  const [advancePaymentOptionSelected, setAdvancePaymentOptionSelected] = useState(bookingData.extrasData?.advancePaymentOptionSelected || false);

  const [promoCodeInput, setPromoCodeInput] = useState(bookingData.promoCodeInput || '');
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const { addToast } = useToast();

  const { datesData, appliedPromo } = bookingData;
  
  const { 
    billingDays, 
    baseRentalPrice, 
    selectedExtrasPrice,
    subtotal,
    discountAmount,
    serviceCharge, 
    totalAmount, 
    advanceAmount 
  } = useMemo(() => {
      const extrasDataForCalc = { extras };
      return calculateBookingPrice(datesData, extrasDataForCalc, car.pricePerDay, appliedPromo);
  }, [datesData, extras, car.pricePerDay, appliedPromo]);

  const handleExtraToggle = (index: number) => {
    setExtras(prev => prev.map((extra, i) => 
      i === index ? { ...extra, selected: !extra.selected } : extra
    ));
  };

  const handleApplyPromo = async () => {
    if (!promoCodeInput.trim()) {
        addToast('Please enter a promo code.', 'error');
        return;
    }
    setIsApplyingPromo(true);

    try {
        const { data, error } = await validatePromoCode(promoCodeInput.trim());
        if (error) {
            addToast(parseError(error), 'error');
            updateBookingData({ appliedPromo: null });
            return;
        }
        
        if (data?.valid === true) {
            const promo = data as ValidatedPromo;
            updateBookingData({ appliedPromo: promo });
            const tempDiscount = calculateBookingPrice(datesData, {extras}, car.pricePerDay, promo).discountAmount;
            addToast(`Success! A discount of ₹${tempDiscount.toFixed(2)} has been applied.`, 'success');
        } else {
            addToast(data?.message ?? 'Invalid promo code.', 'error');
            updateBookingData({ appliedPromo: null });
        }
    } catch (e: any) {
        addToast(parseError(e), 'error');
        updateBookingData({ appliedPromo: null });
    } finally {
        setIsApplyingPromo(false);
    }
  };
  
  const handleRemovePromo = () => {
      setPromoCodeInput('');
      updateBookingData({ promoCodeInput: '', appliedPromo: null });
  }

  const handleNext = () => {
    // Explicitly pass the appliedPromo from the component's current props
    // to ensure it's included in the state update, preventing it from being lost.
    updateBookingData({ 
      extrasData: {
        extras,
        advancePaymentOptionSelected
      },
      promoCodeInput,
      appliedPromo: bookingData.appliedPromo
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
      
      {/* Promo Code Section */}
      <div>
        <label htmlFor="promo-code" className="block text-sm font-medium text-gray-700 mb-1">Promo Code</label>
        <div className="flex gap-2">
            <input 
                type="text" 
                id="promo-code" 
                value={promoCodeInput}
                onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                placeholder="Enter promo code"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled={!!appliedPromo}
            />
            {appliedPromo ? (
                <button onClick={handleRemovePromo} className="px-4 py-2 text-sm bg-red-500 text-white rounded-md hover:bg-red-600">Remove</button>
            ) : (
                <button onClick={handleApplyPromo} disabled={!promoCodeInput || isApplyingPromo} className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 disabled:bg-gray-400">
                    {isApplyingPromo ? '...' : 'Apply'}
                </button>
            )}
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-semibold text-lg text-foreground mb-2">Booking Summary</h4>
        <div className="space-y-1 text-gray-700 text-sm">
          <div className="flex justify-between"><span>Base Rental ({billingDays} billing days)</span><span>₹{baseRentalPrice.toLocaleString()}</span></div>
          <div className="flex justify-between"><span>Selected Extras</span><span>₹{selectedExtrasPrice.toLocaleString()}</span></div>
          <div className="flex justify-between font-semibold"><span>Subtotal</span><span>₹{subtotal.toLocaleString()}</span></div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-green-600"><span>Discount ({appliedPromo?.code})</span><span>- ₹{discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
          )}
          <div className="flex justify-between"><span>Service Charge (5%)</span><span>₹{serviceCharge.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
          <div className="flex justify-between font-bold text-base border-t border-blue-200 pt-2 mt-2"><span>Grand Total</span><span>₹{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
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
          Pay 10% advance (₹{advanceAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}) to reserve now
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
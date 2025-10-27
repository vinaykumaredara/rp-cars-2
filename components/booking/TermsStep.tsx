import React, { useState, useEffect } from 'react';
import type { Car, BookingDraft } from '../../types';

interface TermsStepProps {
  car: Car;
  bookingData: BookingDraft;
  updateBookingData: (updates: Partial<BookingDraft>) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const TermsStep: React.FC<TermsStepProps> = ({ car, bookingData, updateBookingData, nextStep, prevStep }) => {
  const [termsAccepted, setTermsAccepted] = useState(bookingData.termsAccepted || false);
  const [error, setError] = useState<string | null>(null);

  const handleNext = () => {
    if (!termsAccepted) {
      setError('You must accept the terms and conditions to proceed.');
      return;
    }
    setError(null);
    updateBookingData({ termsAccepted: true });
    nextStep();
  };

  return (
    <div className="space-y-6">
      <p className="text-gray-700">Please review and accept our rental terms and conditions.</p>
      
      {error && <p className="bg-red-100 text-red-700 p-3 rounded-md text-sm">{error}</p>}

      <div className="border border-gray-300 rounded-lg p-4 h-64 overflow-y-auto bg-gray-50 text-sm text-gray-800">
        <h4 className="font-semibold text-base mb-2">RP Cars Rental Agreement</h4>
        <p className="mb-2">
          This agreement is made between RP Cars ("Lessor") and the renter ("Lessee").
          By proceeding with this booking, you agree to the following terms:
        </p>
        <ul className="list-disc list-inside space-y-1 mb-2">
          <li><strong>Age Requirement:</strong> Lessee must be 21 years of age or older.</li>
          <li><strong>Valid License:</strong> A valid driving license must be presented and verified.</li>
          <li><strong>Security Deposit:</strong> A refundable security deposit may be required.</li>
          <li><strong>Fuel Policy:</strong> Vehicle must be returned with the same fuel level as picked up.</li>
          <li><strong>Maintenance:</strong> Lessee is responsible for checking fluid levels and tire pressure.</li>
          <li><strong>Cancellation:</strong> Cancellation policy varies based on booking type and notice period.</li>
          <li><strong>Damages:</strong> Lessee is liable for any damages to the vehicle not covered by insurance.</li>
          <li><strong>Geographical Limits:</strong> Vehicles are permitted for use only within specified regions.</li>
          <li><strong>Reporting Accidents:</strong> All accidents must be reported immediately to Lessor and local authorities.</li>
        </ul>
        <p className="text-sm font-semibold mt-4">Full terms available upon request.</p>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="termsAccepted"
          checked={termsAccepted}
          onChange={(e) => { setTermsAccepted(e.target.checked); setError(null); }}
          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
        />
        <label htmlFor="termsAccepted" className="ml-2 block text-sm text-gray-900">
          I have read and agree to the Terms & Conditions.
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
          disabled={!termsAccepted}
          className="px-6 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-hover transition disabled:bg-opacity-50"
        >
          Next: License
        </button>
      </div>
    </div>
  );
};

export default TermsStep;
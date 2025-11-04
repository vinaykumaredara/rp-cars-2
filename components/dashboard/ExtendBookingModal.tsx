import React, { useState, useMemo } from 'react';
import type { BookingDetail } from '../../types';
import { createExtensionIntent } from '../../lib/bookingService';

interface ExtendBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingDetail;
}

const ExtendBookingModal: React.FC<ExtendBookingModalProps> = ({ isOpen, onClose, booking }) => {
  const [addedHours, setAddedHours] = useState<number>(12);
  const [customHours, setCustomHours] = useState<string>('');
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const finalAddedHours = isCustom ? parseInt(customHours, 10) || 0 : addedHours;

  const currentEndDate = useMemo(() => new Date(booking.end_datetime), [booking.end_datetime]);
  const newEndDate = useMemo(() => {
    if (!finalAddedHours) return currentEndDate;
    const newDate = new Date(currentEndDate);
    newDate.setHours(newDate.getHours() + finalAddedHours);
    return newDate;
  }, [currentEndDate, finalAddedHours]);

  const extensionPrice = useMemo(() => {
    if (!finalAddedHours || !booking.cars?.pricePerDay) return 0;
    // Price based on a 24-hour day rate, prorated
    return (finalAddedHours / 24) * booking.cars.pricePerDay;
  }, [finalAddedHours, booking.cars?.pricePerDay]);

  const handleCustomHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setCustomHours(val);
    setError(null);
  };
  
  const handleProceedToPay = async () => {
    if (isCustom) {
        const hours = parseInt(customHours, 10);
        if (isNaN(hours) || hours < 12 || hours % 12 !== 0) {
            setError('Custom extension must be a multiple of 12 hours (e.g., 12, 24, 36) and at least 12 hours.');
            return;
        }
    }
    
    setIsLoading(true);
    setError(null);
    
    // The service returns an object { data: rpcData, error: apiError }
    const result = await createExtensionIntent(booking.id, finalAddedHours);

    if (result.error) {
        setError(result.error);
        setIsLoading(false);
        return;
    }
    
    // Explicitly access the 'data' property and validate it is not null
    const rpcData = result.data;
    if (!rpcData || !rpcData.paymentId || !rpcData.extensionId) {
        setError('Failed to create extension. Missing required data from server.');
        setIsLoading(false);
        return;
    }

    // Simulate payment redirect
    const { paymentId, extensionId } = rpcData;
    setTimeout(() => {
        onClose(); // Close modal as user is "redirected"
        window.location.hash = `#/payment/callback?payment_id=${paymentId}&extension_id=${extensionId}&status=success`;
    }, 1500);
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-lg shadow-2xl w-full max-w-lg mx-auto p-6 transform transition-all duration-300 flex flex-col" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-foreground">Extend Booking</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-3xl">&times;</button>
        </div>

        {error && <p className="bg-red-100 text-red-700 p-3 rounded-md text-sm mb-4">{error}</p>}

        <div className="space-y-4">
            <p className="text-sm text-gray-600">Current end time: <strong className="text-foreground">{currentEndDate.toLocaleString()}</strong></p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button onClick={() => { setAddedHours(12); setIsCustom(false); setError(null); }} className={`p-2 border rounded-md transition ${!isCustom && addedHours === 12 ? 'bg-primary text-white border-primary' : 'hover:border-primary'}`}>+ 12 Hours</button>
                <button onClick={() => { setAddedHours(24); setIsCustom(false); setError(null); }} className={`p-2 border rounded-md transition ${!isCustom && addedHours === 24 ? 'bg-primary text-white border-primary' : 'hover:border-primary'}`}>+ 24 Hours</button>
                <button onClick={() => setIsCustom(true)} className={`p-2 border rounded-md transition ${isCustom ? 'bg-primary text-white border-primary' : 'hover:border-primary'}`}>Custom</button>
            </div>
            
            {isCustom && (
                <div className="mt-2">
                    <label htmlFor="customHours" className="block text-sm font-medium text-gray-700 mb-1">Custom Hours (multiple of 12)</label>
                    <input type="text" id="customHours" value={customHours} onChange={handleCustomHoursChange} placeholder="e.g., 36" className="w-full p-2 border border-gray-300 rounded-lg"/>
                </div>
            )}

            <div className="bg-blue-50 p-4 rounded-lg mt-4">
                <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-700">New end time:</span>
                    <span className="font-bold text-primary">{newEndDate.toLocaleString()}</span>
                </div>
                 <div className="flex justify-between items-center mt-2 pt-2 border-t">
                    <span className="font-semibold text-gray-700">Amount to pay:</span>
                    <span className="font-bold text-primary">₹{extensionPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
            </div>
        </div>

        <div className="mt-6 text-right">
            <button
                onClick={handleProceedToPay}
                disabled={isLoading || (isCustom && (parseInt(customHours) || 0) < 12)}
                className="px-6 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-hover transition disabled:bg-opacity-50"
            >
                {isLoading ? 'Processing...' : 'Proceed to Pay'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default ExtendBookingModal;
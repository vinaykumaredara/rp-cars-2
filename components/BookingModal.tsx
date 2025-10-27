

import React, { useState, useEffect, useMemo } from 'react';
import type { Car } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  car: Car | null;
}

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, car }) => {
  const { user } = useAuth();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

  useEffect(() => {
    // Set default dates when modal opens
    if (isOpen) {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const formatDate = (date: Date) => date.toISOString().split('T')[0];
      
      setStartDate(formatDate(today));
      setEndDate(formatDate(tomorrow));
    }
  }, [isOpen]);

  const numberOfDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start) return 0;
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [startDate, endDate]);
  
  const totalPrice = car ? numberOfDays * car.pricePerDay : 0;

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !car) {
        setError('You must be signed in to book a car.');
        return;
    }
    if (numberOfDays <= 0) {
      setError('End date must be after the start date.');
      return;
    }
    setError('');
    setBookingStatus('processing');
    
    // 1. Check for booking conflicts before attempting to insert.
    // The previous implementation used an invalid .or() filter for OVERLAPS.
    // This is the corrected logic: an overlap exists if (existing.start < new.end) AND (new.start < existing.end).
    const { count, error: conflictError } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true }) // Efficiently get count without fetching data
      .eq('car_id', car.id)
      .eq('status', 'confirmed')
      .lt('start_datetime', new Date(endDate).toISOString())
      .gt('end_datetime', new Date(startDate).toISOString());

    if (conflictError) {
      setError('Could not verify car availability. Please try again.');
      setBookingStatus('error');
      console.error('Conflict check error:', conflictError);
      return;
    }

    if (count && count > 0) {
      setError('Sorry, this car is already booked for the selected dates. Please choose different dates.');
      setBookingStatus('error');
      return;
    }
    
    // 2. If no conflicts, proceed with booking
    const { error: insertError } = await supabase.from('bookings').insert({
        car_id: car.id,
        user_id: user.id,
        start_datetime: new Date(startDate).toISOString(),
        end_datetime: new Date(endDate).toISOString(),
        total_amount: totalPrice,
        status: 'confirmed', // Set status as per new workflow
        currency: 'INR'
    });
    
    if (insertError) {
        setError('Failed to book the car. Please try again later.');
        setBookingStatus('error');
        console.error('Booking error:', insertError);
    } else {
        setBookingStatus('success');
    }
  };

  const closeModal = () => {
    // Reset state on close
    setStartDate('');
    setEndDate('');
    setError('');
    setBookingStatus('idle');
    onClose();
  };

  if (!isOpen || !car) return null;

  const carImage = car.images && car.images.length > 0
    ? car.images[0]
    : `https://picsum.photos/600/400?random=${car.id}`;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4"
      onClick={closeModal}
    >
      <div 
        className="bg-white rounded-lg shadow-2xl w-full max-w-lg mx-auto p-8 transform transition-all duration-300 ease-in-out"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'fadeInScale 0.3s forwards' }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-foreground">Book Your Ride</h2>
          <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        {bookingStatus === 'success' ? (
            <div className="text-center py-8">
                <svg className="w-16 h-16 mx-auto text-green-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <h3 className="text-xl font-bold text-foreground">Booking Confirmed!</h3>
                <p className="text-gray-600 mt-2">You will receive a confirmation email shortly. Enjoy your trip!</p>
                <button onClick={closeModal} className="mt-6 w-full py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary-hover transition">
                    Done
                </button>
            </div>
        ) : (
            <>
                <div className="flex items-center space-x-4 mb-6">
                    <img src={carImage} alt={car.title} className="w-32 h-20 object-cover rounded-md" />
                    <div>
                        <h3 className="text-lg font-bold text-foreground">{car.title}</h3>
                        <p className="text-gray-500">{car.year} &bull; {car.fuelType} &bull; {car.transmission}</p>
                    </div>
                </div>

                {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-sm">{error}</p>}
                
                <form onSubmit={handleBooking}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                            <input type="date" id="start-date" value={startDate} min={new Date().toISOString().split('T')[0]} onChange={e => setStartDate(e.target.value)} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary" />
                        </div>
                        <div>
                            <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                            <input type="date" id="end-date" value={endDate} min={startDate} onChange={e => setEndDate(e.target.value)} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary" />
                        </div>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-lg mb-6">
                        <div className="flex justify-between items-center text-lg">
                            <span className="font-semibold text-foreground">Total Price</span>
                            <span className="font-bold text-primary">
                                {totalPrice > 0 ? `₹${totalPrice.toLocaleString()}` : 'Select dates'}
                            </span>
                        </div>
                        {numberOfDays > 0 && <p className="text-sm text-gray-600 text-right mt-1">For {numberOfDays} day{numberOfDays > 1 && 's'}</p>}
                    </div>
                    
                    <button type="submit" disabled={bookingStatus === 'processing' || numberOfDays <= 0} className="w-full py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary-hover transition disabled:bg-opacity-50 disabled:cursor-not-allowed">
                        {bookingStatus === 'processing' ? 'Confirming...' : 'Confirm Booking'}
                    </button>
                </form>
            </>
        )}
      </div>
    </div>
  );
};

export default BookingModal;

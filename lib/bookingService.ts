import { supabase } from './supabaseClient';
import type { BookingDraft, Car } from '../types';
import type { User } from '@supabase/supabase-js';

/**
 * Creates a new booking record in the database.
 * @param bookingData - The draft containing all booking details.
 * @param car - The car being booked.
 * @param user - The authenticated user.
 * @returns An object with the new booking ID or an error message.
 */
export const createBooking = async (
  bookingData: BookingDraft,
  car: Car,
  user: User
) => {
  const { datesData, extrasData, paymentData, phoneData } = bookingData;

  if (!datesData || !extrasData || !paymentData || !phoneData) {
    return { data: null, error: 'Incomplete booking data. Please review your selections.' };
  }

  try {
    const numberOfDays = Math.max(
      Math.ceil(
        (new Date(`${datesData.returnDate}T${datesData.returnTime}`).getTime() -
         new Date(`${datesData.pickupDate}T${datesData.pickupTime}`).getTime()) /
          (1000 * 60 * 60 * 24)
      ), 1
    );

    const baseRentalPrice = car.pricePerDay * numberOfDays;
    const selectedExtrasPrice = extrasData.extras.reduce(
      (sum, extra) => sum + (extra.selected ? extra.pricePerDay * numberOfDays : 0), 0
    );
    const serviceCharge = (baseRentalPrice + selectedExtrasPrice) * 0.05;
    const totalAmount = baseRentalPrice + selectedExtrasPrice + serviceCharge;
    
    const startDateTime = new Date(`${datesData.pickupDate}T${datesData.pickupTime}`);
    const endDateTime = new Date(`${datesData.returnDate}T${datesData.returnTime}`);

    const bookingRecord = {
      user_id: user.id,
      car_id: car.id,
      start_datetime: startDateTime.toISOString(),
      end_datetime: endDateTime.toISOString(),
      total_amount: totalAmount,
      total_amount_in_paise: Math.round(totalAmount * 100),
      status: 'confirmed', // Assuming payment is successful
    };

    const { data, error } = await supabase
      .from('bookings')
      .insert(bookingRecord)
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to save booking: ${error.message}`);
    }

    return { data, error: null };
  } catch (err: any) {
    console.error('Create booking error:', err);
    return { data: null, error: err.message || 'An unexpected error occurred while creating the booking.' };
  }
};
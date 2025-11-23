import { supabase } from './supabaseClient';
import type { BookingDraft, Car } from '../types';
import type { User } from '@supabase/supabase-js';
import { calculateBookingPrice } from './bookingUtils';
import { parseError } from './errorUtils';

/**
 * Creates a new booking and an associated pending payment record.
 * This is the first step before redirecting to a payment gateway.
 * @param bookingData - The draft containing all booking details.
 * @param car - The car being booked.
 * @param user - The authenticated user.
 * @param paymentAmount - The amount for the payment record (full or hold).
 * @param paymentMethod - The method of payment (e.g., 'paytm').
 * @returns An object with new booking and payment IDs, or an error message.
 */
export const createBookingAndPayment = async (
  bookingData: BookingDraft,
  car: Car,
  user: User,
  paymentAmount: number,
  paymentMethod: 'paytm'
) => {
  const { datesData, extrasData, appliedPromo } = bookingData;

  if (!datesData || !extrasData) {
    return { data: null, error: 'Incomplete booking data. Please review your selections.' };
  }

  try {
    const { subtotal } = calculateBookingPrice(datesData, extrasData, car.pricePerDay);
    const startDateTime = new Date(`${datesData.pickupDate}T${datesData.pickupTime}`);
    const endDateTime = new Date(`${datesData.returnDate}T${datesData.returnTime}`);

    const { data, error } = await supabase.rpc('create_booking_and_payment', {
        p_car_id: car.id,
        p_user_id: user.id,
        p_start_datetime: startDateTime.toISOString(),
        p_end_datetime: endDateTime.toISOString(),
        p_subtotal_amount: subtotal,
        p_payment_amount: paymentAmount,
        p_payment_method: paymentMethod,
        p_promo_code_id: appliedPromo?.id || null,
    });
    
    if (error) throw error;

    return { data, error: null };
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('Car is not available')) {
        return { data: null, error: 'Sorry, this car is no longer available for the selected dates. Please try another time.' };
    }
    return { data: null, error: parseError(err) };
  }
};

/**
 * Calls an RPC to create a booking extension intent, which includes availability checks and creating pending payment records.
 * @param bookingId The ID of the booking to extend.
 * @param addedHours The number of hours to add (must be >= 12 and a multiple of 12).
 * @returns An object with the new extension and payment IDs, or an error message.
 */
export const createExtensionIntent = async (bookingId: string, addedHours: number) => {
  try {
    const { data, error } = await supabase.rpc('create_extension_and_payment', {
      p_booking_id: bookingId,
      p_added_hours: addedHours
    });
    
    if (error) throw error;
    
    return { data, error: null };

  } catch (err: unknown) {
    return { data: null, error: parseError(err) };
  }
};


/**
 * Verifies a Paytm payment by calling the verify_and_update_payment RPC.
 * This is a mocked verification for the payment callback handler.
 */
export const verifyPaytmPayment = async (
  paymentId: string | null,
  status: string | null
) => {
  try {
    // Validate inputs received from the URL to ensure they are present and valid.
    if (!paymentId) {
      throw new Error('Invalid or missing payment ID.');
    }
    if (!status) {
      throw new Error('Invalid or missing payment status.');
    }

    // In a real scenario, gateway_txn_id would come from Paytm; we create a mock here.
    const mockGatewayTxnId = `PAYTM_TXN_${crypto.randomUUID()}`;

    const params = {
      p_payment_id: paymentId,
      p_gateway_txn_id: mockGatewayTxnId,
      p_status: status
    };

    // Call the secure RPC function to update the payment and booking status.
    const { data, error } = await supabase.rpc('verify_and_update_payment', params);

    if (error) throw error;

    return { success: true, data, error: null };
  } catch (err: unknown) {
    return { success: false, error: parseError(err) };
  }
};
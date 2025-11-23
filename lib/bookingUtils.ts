import type { DatesData, BookingExtra, ValidatedPromo } from '../types';

export interface BookingPriceDetails {
    billingDays: number;
    baseRentalPrice: number;
    selectedExtrasPrice: number;
    subtotal: number;
    discountAmount: number;
    totalAfterDiscount: number;
    serviceCharge: number;
    totalAmount: number;
    advanceAmount: number;
}

const EMPTY_PRICE: BookingPriceDetails = {
    billingDays: 0,
    baseRentalPrice: 0,
    selectedExtrasPrice: 0,
    subtotal: 0,
    discountAmount: 0,
    totalAfterDiscount: 0,
    serviceCharge: 0,
    totalAmount: 0,
    advanceAmount: 0,
};

export const calculateBookingPrice = (
    datesData: DatesData | undefined,
    extrasData: { extras: BookingExtra[] } | undefined,
    carPricePerDay: number,
    promo?: ValidatedPromo | null
): BookingPriceDetails => {
    if (!datesData) return EMPTY_PRICE;

    const start = new Date(`${datesData.pickupDate}T${datesData.pickupTime}`);
    const end = new Date(`${datesData.returnDate}T${datesData.returnTime}`);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
        return EMPTY_PRICE;
    }

    const diffMs = end.getTime() - start.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 12) {
        // Return a copy to avoid mutation
        return { ...EMPTY_PRICE };
    }
    
    const billingUnits = Math.ceil(diffHours / 12);
    const billingDays = billingUnits / 2;

    const baseRentalPrice = carPricePerDay * billingDays;
    const selectedExtrasPrice = (extrasData?.extras || []).reduce((sum, extra) => {
        return sum + (extra.selected ? extra.pricePerDay * billingDays : 0);
    }, 0);
    
    const subtotal = baseRentalPrice + selectedExtrasPrice;

    let discountAmount = 0;
    if (promo) {
        if (promo.discount_flat) {
            discountAmount = promo.discount_flat;
        } else if (promo.discount_percent) {
            discountAmount = subtotal * (promo.discount_percent / 100);
        }
    }
    // Ensure discount doesn't exceed the subtotal
    discountAmount = Math.min(discountAmount, subtotal);

    const totalAfterDiscount = subtotal - discountAmount;
    const serviceChargeRate = 0.05;
    const serviceCharge = totalAfterDiscount * serviceChargeRate;
    const totalAmount = totalAfterDiscount + serviceCharge;
    const advanceAmount = totalAmount * 0.10;

    return { 
        billingDays, 
        baseRentalPrice, 
        selectedExtrasPrice, 
        subtotal,
        discountAmount,
        totalAfterDiscount,
        serviceCharge, 
        totalAmount, 
        advanceAmount 
    };
};
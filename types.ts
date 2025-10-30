import type { Session as SupabaseSession, User as SupabaseUser } from '@supabase/supabase-js';
import React from 'react';

// Re-export Supabase types for consistency
export type Session = SupabaseSession;
export type User = SupabaseUser;

// App-specific types
export type Role = 'admin' | 'user';
export type UserStatus = 'active' | 'inactive';
export type CarStatus = 'draft' | 'published' | 'active' | 'maintenance';
export type CarBookingStatus = 'available' | 'booked';
export type FuelType = 'Petrol' | 'Diesel' | 'Electric' | 'Hybrid';
export type GearType = 'Manual' | 'Automatic';

export interface Testimonial {
  name: string;
  location: string;
  initials: string;
  quote: string;
}

export interface Feature {
  icon: React.FC<{ className?: string }>;
  title: string;
  description: string;
}

export interface Stat {
  value: string;
  label: string;
}

export interface Car {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  seats: number;
  fuelType: FuelType;
  transmission: GearType;
  pricePerDay: number;
  images: string[];
  imagePaths: string[];
  available: boolean;
  verified: boolean;
  status: CarStatus;
  booking_status: CarBookingStatus;
}

export interface CarFormData {
    title: string;
    make: string;
    model: string;
    year: number;
    seats: number;
    fuelType: FuelType;
    transmission: GearType;
    pricePerDay: number;
    verified: boolean;
    status: CarStatus;
    booking_status: CarBookingStatus;
}

export type ImageState = 
    | { type: 'existing'; path: string; url: string; }
    | { type: 'new'; file: File; url: string; };

// Admin & User Management
export interface UserDetail {
  id: string;
  email?: string;
  role: Role;
  name: string | null;
  phone: string | null;
  status: UserStatus;
}

export interface BookingDetail {
  id: string;
  created_at: string;
  user_id: string;
  customer_name: string | null;
  customer_phone: string | null;
  car_id: string;
  car_title: string | null;
  start_datetime: string;
  end_datetime: string;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  payment_mode: 'full' | 'hold' | null;
}

// License Verification
export interface License {
  id: string;
  user_id: string;
  storage_path: string;
  verified: boolean;
  created_at: string;
  // Joined data from profiles/users
  user_name: string | null;
  user_email: string | null;
  license_image_url: string;
}

// Promo Codes
export interface PromoCode {
  id: string;
  code: string;
  discount_percentage: number;
  max_uses: number | null;
  uses: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

// Booking Modal Flow
export interface PhoneData {
  phone: string;
}

export interface DatesData {
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
}

export interface LicenseData {
  file?: File;
  previewUrl?: string;
  isUploaded?: boolean;
}

export interface BookingExtra {
  name: string;
  pricePerDay: number;
  selected: boolean;
}

export interface ExtrasData {
  extras: BookingExtra[];
  advancePaymentOptionSelected: boolean;
}

export interface PaymentData {
  paymentMode: 'full' | 'hold';
}

export interface BookingDraft {
  carId: string;
  currentStep: number;
  phoneData?: PhoneData;
  datesData?: DatesData;
  termsAccepted?: boolean;
  licenseData?: LicenseData;
  extrasData?: ExtrasData;
  paymentData?: PaymentData;
  bookingId?: string;
}

export interface BookingStep {
    title: string;
    component: React.FC<any>; // Using any for generic step props
}

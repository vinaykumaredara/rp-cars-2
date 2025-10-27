import type { ComponentType } from 'react';
import type { Session, User } from '@supabase/supabase-js';

export type FuelType = 'Petrol' | 'Diesel' | 'Electric' | 'Hybrid';
export type GearType = 'Manual' | 'Automatic';
export type Role = 'admin' | 'user';
export type UserStatus = 'active' | 'inactive';

export interface Car {
  id: string; // Changed from number to string for UUID
  title: string;
  make: string;
  model: string;
  year: number;
  seats: number;
  fuelType: FuelType;
  transmission: GearType;
  pricePerDay: number;
  images: string[]; // These are full public URLs for display
  imagePaths?: string[]; // Raw storage paths, used for admin delete operations
  available: boolean;
  verified: boolean;
  // Optional fields from new schema
  status?: 'active' | 'published' | 'draft' | 'maintenance';
  booking_status?: 'available' | 'booked';
}

export interface Testimonial {
  name: string;
  location: string;
  initials: string;
  quote: string;
}

export interface Feature {
    icon: ComponentType<{ className?: string }>;
    title: string;
    description: string;
}

export interface Stat {
    value: string;
    label: string;
}

// Added for the User Management feature
export interface UserDetail {
  id: string;
  email: string | undefined;
  role: Role;
  created_at?: string;
  // Add new fields for comprehensive user management
  name: string | null;
  phone: string | null;
  status: UserStatus;
}

export type { Session, User };

// === New Types for Booking Workflow ===

export interface PhoneData {
  phone: string;
}

export interface DatesData {
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
}

export interface BookingExtra {
  name: 'Driver' | 'GPS' | 'Child Seat' | 'Insurance';
  pricePerDay: number;
  selected: boolean;
}

export interface ExtrasData {
  extras: BookingExtra[];
  advancePaymentOptionSelected: boolean;
}

export interface PaymentData {
  paymentMode: 'full' | 'hold';
  // TODO: Add payment intent details, transaction ID, etc.
}

export interface BookingDraft {
  carId: string;
  currentStep: number;
  phoneData?: PhoneData;
  datesData?: DatesData;
  termsAccepted?: boolean;
  licenseUploaded?: boolean; // Or more detailed license info
  extrasData?: ExtrasData;
  paymentData?: PaymentData;
}

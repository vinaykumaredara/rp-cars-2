
import type { ComponentType } from 'react';
import type { Session, User } from '@supabase/supabase-js';

export type FuelType = 'Petrol' | 'Diesel' | 'Electric' | 'Hybrid';
export type GearType = 'Manual' | 'Automatic';
export type Role = 'admin' | 'user';

export interface Car {
  id: string; // Changed from number to string for UUID
  title: string;
  make: string;
  model: string;
  year: number;
  seats: number;
  fuelType: FuelType;
  gearType: GearType;
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

export type { Session, User };

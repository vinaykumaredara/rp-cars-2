import type { ComponentType } from 'react';
import type { Session, User } from '@supabase/supabase-js';

export type FuelType = 'Petrol' | 'Diesel';
export type GearType = 'Manual' | 'Automatic';

export interface Car {
  id: number;
  model: string;
  year: number;
  area: string;
  seats: number;
  fuelType: FuelType;
  gearType: GearType;
  pricePerDay: number;
  images: string[];
  available: boolean;
  verified: boolean;
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
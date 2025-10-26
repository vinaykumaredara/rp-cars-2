
import React from 'react';
import type { Car, Testimonial, Feature, Stat } from './types';

// Icon Components
export const SeatIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><polyline points="17 11 19 13 23 9" /></svg>
);
export const FuelIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 8h.01" /><path d="M10 8h.01" /><path d="M12 2a10 10 0 0 0-7.5 16.5" /><path d="M22 12a10 10 0 0 0-16.5-7.5" /><path d="M12 22a10 10 0 0 0 7.5-16.5" /><path d="M2 12a10 10 0 0 0 16.5 7.5" /><path d="M12 12l4 4" /><path d="M12 18l6-6" /></svg>
);
export const GearIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 12v-4" /><path d="m16 16-3-3" /></svg>
);
export const MapPinIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
);

export const InsuranceIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
);
export const GpsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>
);
export const SupportIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
);
export const UnlockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 9.9-1" /></svg>
);
export const PaymentIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M2 11h20" /></svg>
);
export const FleetIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 17h2l.64-2.56a2 2 0 0 0-1.94-2.44H5.3a2 2 0 0 0-1.94 2.44L4 17h2" /><path d="M19 17a2 2 0 1 1 0-4H5a2 2 0 1 1 0 4h14Z" /><path d="M5 13V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v7" /><path d="M12 12V8" /></svg>
);


export const CARS_DATA: Car[] = [
  {
    id: 1,
    model: 'SWIFT LXI',
    year: 2025,
    area: 'Hyderabad',
    seats: 5,
    fuelType: 'Petrol',
    gearType: 'Manual',
    pricePerDay: 1700,
    images: ['https://picsum.photos/550/350?random=1', 'https://picsum.photos/550/350?random=2', 'https://picsum.photos/550/350?random=3'],
    available: true,
    verified: true,
  },
  {
    id: 2,
    model: 'Maruti Baleno',
    year: 2024,
    area: 'Hyderabad',
    seats: 5,
    fuelType: 'Petrol',
    gearType: 'Automatic',
    pricePerDay: 2200,
    images: ['https://picsum.photos/550/350?random=4', 'https://picsum.photos/550/350?random=5', 'https://picsum.photos/550/350?random=6'],
    available: true,
    verified: true,
  },
  {
    id: 3,
    model: 'Hyundai Creta',
    year: 2023,
    area: 'Hyderabad',
    seats: 5,
    fuelType: 'Diesel',
    gearType: 'Manual',
    pricePerDay: 2500,
    images: ['https://picsum.photos/550/350?random=7', 'https://picsum.photos/550/350?random=8', 'https://picsum.photos/550/350?random=9'],
    available: true,
    verified: true,
  },
   {
    id: 4,
    model: 'Kia Seltos',
    year: 2024,
    area: 'Hyderabad',
    seats: 5,
    fuelType: 'Petrol',
    gearType: 'Automatic',
    pricePerDay: 2800,
    images: ['https://picsum.photos/550/350?random=10', 'https://picsum.photos/550/350?random=11', 'https://picsum.photos/550/350?random=12'],
    available: false,
    verified: true,
  },
   {
    id: 5,
    model: 'Tata Nexon',
    year: 2022,
    area: 'Hyderabad',
    seats: 5,
    fuelType: 'Diesel',
    gearType: 'Manual',
    pricePerDay: 1900,
    images: ['https://picsum.photos/550/350?random=13', 'https://picsum.photos/550/350?random=14', 'https://picsum.photos/550/350?random=15'],
    available: true,
    verified: false,
  },
   {
    id: 6,
    model: 'Mahindra XUV700',
    year: 2025,
    area: 'Hyderabad',
    seats: 7,
    fuelType: 'Diesel',
    gearType: 'Automatic',
    pricePerDay: 3500,
    images: ['https://picsum.photos/550/350?random=16', 'https://picsum.photos/550/350?random=17', 'https://picsum.photos/550/350?random=18'],
    available: true,
    verified: true,
  },
];

export const FEATURES_DATA: Feature[] = [
    { icon: InsuranceIcon, title: 'Premium Insurance', description: 'Comprehensive coverage for a worry-free journey.' },
    { icon: SupportIcon, title: '24/7 Support', description: 'Our team is always here to assist you, anytime.' },
    { icon: GpsIcon, title: 'GPS Tracking', description: 'Never lose your way with our integrated GPS systems.' },
    { icon: UnlockIcon, title: 'Smart Unlock', description: 'Easy and secure access to your rental car.' },
    { icon: PaymentIcon, title: 'Flexible Payment', description: 'Choose from various payment options that suit you.' },
    { icon: FleetIcon, title: 'Premium Fleet', description: 'A wide range of high-quality, well-maintained cars.' },
];

export const STATS_DATA: Stat[] = [
    { value: '2500+', label: 'Happy Customers' },
    { value: '15+', label: 'Cities' },
    { value: '200+', label: 'Fleet Size' },
    { value: '8+', label: 'Years Experience' },
];

export const TESTIMONIALS_DATA: Testimonial[] = [
  {
    name: 'Vinay E.',
    location: 'Hyderabad',
    initials: 'VE',
    quote: 'The best car rental service I have ever used. The car was clean, the process was seamless, and the customer support was excellent. Highly recommended!'
  },
  {
    name: 'Priya S.',
    location: 'Bangalore',
    initials: 'PS',
    quote: 'RP Cars made our family trip so much easier. The car was spacious and comfortable. The booking process was straightforward. Will definitely use them again.'
  },
  {
    name: 'Amit K.',
    location: 'Mumbai',
    initials: 'AK',
    quote: 'A truly premium experience from start to finish. The vehicle was in perfect condition and the smart unlock feature was very convenient. Great value for money.'
  }
];

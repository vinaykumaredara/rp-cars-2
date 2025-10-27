import React from 'react';
import type { Testimonial, Feature, Stat } from './types';

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

// Admin Dashboard Icons
export const CarManagementIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 17h2l.64-2.56a2 2 0 0 0-1.94-2.44H5.3a2 2 0 0 0-1.94 2.44L4 17h2" /><path d="M19 17a2 2 0 1 1 0-4H5a2 2 0 1 1 0 4h14Z" /><path d="M5 13V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v7" /><path d="M12 12V8" /></svg>
);
export const BookingManagementIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
);
export const LicenseVerificationIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
);
export const PromoCodeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="5" x2="5" y2="19"></line><circle cx="6.5" cy="6.5" r="2.5"></circle><circle cx="17.5" cy="17.5" r="2.5"></circle></svg>
);
export const UserManagementIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
);

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
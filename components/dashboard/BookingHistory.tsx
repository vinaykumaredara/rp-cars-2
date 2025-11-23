import React, { useState, useEffect, Suspense, lazy, useCallback } from 'react';
import { fetchUserBookings } from '../../lib/userService';
import type { BookingDetail } from '../../types';
import CarCard from '../CarCard';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';

const ExtendBookingModal = lazy(() => import('./ExtendBookingModal'));

// Placeholder for bookings where the car has been deleted
const DeletedCarCard: React.FC = () => (
    <div className="bg-gray-100 rounded-lg h-full flex flex-col items-center justify-center text-center p-4 border border-gray-200">
        <svg className="w-12 h-12 text-gray-400 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <h4 className="font-semibold text-gray-700">Car Information Unavailable</h4>
        <p className="text-sm text-gray-500">This car may have been removed from our fleet.</p>
    </div>
);


const BookingHistory: React.FC = () => {
    const [bookings, setBookings] = useState<BookingDetail[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<BookingDetail | null>(null);
    const { user } = useAuth();

    const loadBookings = useCallback(async () => {
        // Don't show loader on subsequent re-fetches from real-time updates
        const { bookings, error } = await fetchUserBookings();
        if (error) {
            setError(error);
        } else {
            setBookings(bookings);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        loadBookings();

        if (!user) return;

        const channel = supabase
            .channel('user-bookings-realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'bookings', filter: `user_id=eq.${user.id}` },
                () => loadBookings()
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'cars' },
                () => loadBookings()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [loadBookings, user]);

    const handleExtendClick = (booking: BookingDetail) => {
        setSelectedBooking(booking);
        setIsExtendModalOpen(true);
    };
    
    const handleModalClose = () => {
        setIsExtendModalOpen(false);
        setSelectedBooking(null);
        // Data will refresh via real-time subscription, no need for manual call
    };

    const formatDate = (dateString: string) => new Date(dateString).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    
    const getStatusBadge = (status: BookingDetail['status']) => {
        const styles: Record<BookingDetail['status'], string> = {
            confirmed: 'bg-green-100 text-green-800',
            hold: 'bg-yellow-100 text-yellow-800',
            completed: 'bg-green-100 text-green-800', // Changed to green for consistency
            cancelled: 'bg-red-100 text-red-800',
            pending_payment: 'bg-gray-100 text-gray-800'
        };
        const statusText = status.replace('_', ' ');

        let icon;
        switch (status) {
            case 'confirmed':
            case 'completed':
                icon = <svg className="w-3 h-3 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>;
                break;
            case 'hold':
            case 'pending_payment':
                icon = <svg className="w-3 h-3 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.414L11 10.586V6z" clipRule="evenodd"></path></svg>;
                break;
            case 'cancelled':
                icon = <svg className="w-3 h-3 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>;
                break;
            default:
                icon = null;
        }
        
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 text-xs leading-5 font-semibold rounded-full capitalize ${styles[status] || styles.pending_payment}`}>
                {icon}
                {statusText}
            </span>
        );
    };

    if (isLoading) {
        return <div className="text-center p-8">Loading your bookings...</div>;
    }

    if (error) {
        return <p className="bg-red-100 text-red-700 p-3 rounded-md text-sm">Error: {error}</p>;
    }

    return (
        <>
            <div>
                <h2 className="text-2xl font-bold mb-4">My Bookings</h2>
                {bookings.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-600">You haven't made any bookings yet.</p>
                        <a href="#cars" className="mt-4 inline-block px-6 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-hover transition">
                            Browse Cars
                        </a>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {bookings.map(booking => {
                           const isExtendable = booking.status === 'confirmed' && new Date(booking.end_datetime) > new Date();
                           return (
                                <div key={booking.id} className="bg-white p-4 border rounded-lg hover:shadow-sm transition-shadow flex flex-col md:flex-row gap-6">
                                    <div className="md:w-2/5 flex-shrink-0">
                                        {booking.cars ? (
                                            <CarCard car={booking.cars} onBookNow={() => {}} showBookingControls={false} />
                                        ) : (
                                            <DeletedCarCard />
                                        )}
                                    </div>
                                    <div className="flex flex-col flex-grow">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h3 className="font-bold text-lg text-foreground">{booking.cars?.title || 'Deleted Car'}</h3>
                                                <p className="text-sm text-gray-500">ID: #{booking.id.split('-')[0].toUpperCase()}</p>
                                            </div>
                                            {getStatusBadge(booking.status)}
                                        </div>
                                        <div className="text-sm mt-2 pt-2 border-t flex-grow space-y-1">
                                            <p><strong>Booked on:</strong> {new Date(booking.created_at).toLocaleDateString()}</p>
                                            <p><strong>From:</strong> {formatDate(booking.start_datetime)}</p>
                                            <p><strong>To:</strong> {formatDate(booking.end_datetime)}</p>
                                            {booking.discount_amount && booking.discount_amount > 0 && (
                                                <p className="text-green-600"><strong>Discount:</strong> -₹{Number(booking.discount_amount).toLocaleString()}</p>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-center mt-auto pt-2 border-t">
                                            <p className="text-base font-semibold">Total Paid: ₹{Number(booking.total_amount).toLocaleString()}</p>
                                            {isExtendable && (
                                                <button onClick={() => handleExtendClick(booking)} className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition">
                                                    Extend Booking
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                           );
                        })}
                    </div>
                )}
            </div>

            <Suspense fallback={null}>
                {isExtendModalOpen && selectedBooking && (
                    <ExtendBookingModal 
                        isOpen={isExtendModalOpen}
                        onClose={handleModalClose}
                        booking={selectedBooking}
                    />
                )}
            </Suspense>
        </>
    );
};
export default BookingHistory;
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { fetchUserBookings } from '../../lib/userService';
import type { BookingDetail } from '../../types';

const ExtendBookingModal = lazy(() => import('./ExtendBookingModal'));

const BookingHistory: React.FC = () => {
    const [bookings, setBookings] = useState<BookingDetail[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<BookingDetail | null>(null);

    const loadBookings = async () => {
        setIsLoading(true);
        const { bookings, error } = await fetchUserBookings();
        if (error) {
            setError(error);
        } else {
            setBookings(bookings);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        loadBookings();
    }, []);

    const handleExtendClick = (booking: BookingDetail) => {
        setSelectedBooking(booking);
        setIsExtendModalOpen(true);
    };
    
    const handleModalClose = () => {
        setIsExtendModalOpen(false);
        setSelectedBooking(null);
        // Refresh bookings list after modal closes to show updated end time
        loadBookings();
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
                    <div className="space-y-4">
                        {bookings.map(booking => {
                           const isExtendable = booking.status === 'confirmed' && new Date(booking.end_datetime) > new Date();
                           return (
                            <div key={booking.id} className="p-4 border rounded-lg hover:shadow-sm transition-shadow">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                                    <div className="mb-2 sm:mb-0">
                                        <h3 className="font-bold text-lg text-foreground">{booking.cars?.title}</h3>
                                        <p className="text-sm text-gray-500">Booked on: {new Date(booking.created_at).toLocaleDateString()}</p>
                                    </div>
                                    {getStatusBadge(booking.status)}
                                </div>
                                <div className="text-sm mt-2 pt-2 border-t">
                                    <p><strong>From:</strong> {formatDate(booking.start_datetime)}</p>
                                    <p><strong>To:</strong> {formatDate(booking.end_datetime)}</p>
                                    <div className="flex justify-between items-center mt-2">
                                        <p className="text-base font-semibold">Total: ₹{Number(booking.total_amount).toLocaleString()}</p>
                                        {isExtendable && (
                                            <button 
                                                onClick={() => handleExtendClick(booking)}
                                                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                                            >
                                                Extend Booking
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                           )
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
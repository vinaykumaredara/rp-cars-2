import React, { useState, useEffect } from 'react';
import AdminPageLayout from './AdminPageLayout';
import { fetchAllBookings } from '../lib/adminService';
import type { BookingDetail } from '../types';

const BookingManagement: React.FC = () => {
  const [bookings, setBookings] = useState<BookingDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBookings = async () => {
      setIsLoading(true);
      const { bookings: fetchedBookings, error: fetchError } = await fetchAllBookings();
      setBookings(fetchedBookings);
      setError(fetchError);
      setIsLoading(false);
    };
    loadBookings();
  }, []);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const renderContent = () => {
    if (isLoading) {
      return <p className="text-center text-gray-600 p-8">Loading bookings...</p>;
    }
    if (error) {
      const errorMessage = typeof error === 'string' ? error : 'An unexpected error occurred. Please check the console.';
      return (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
          <p className="font-bold">Error loading bookings</p>
          <p>{errorMessage}</p>
        </div>
      );
    }
    if (bookings.length === 0) {
      return <p className="text-center text-gray-600 p-8">No bookings found.</p>;
    }
    return (
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Car</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking Period</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {bookings.map((booking) => (
            <tr key={booking.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{booking.customer_name || 'N/A'}</div>
                <div className="text-sm text-gray-500">{booking.customer_phone || 'N/A'}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{booking.car_title || 'N/A'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div>From: {formatDate(booking.start_datetime)}</div>
                <div>To: {formatDate(booking.end_datetime)}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${
                    booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {booking.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                ₹{booking.total_amount.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <AdminPageLayout
      title="Booking Management"
      subtitle="View and manage all customer bookings."
    >
      <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="overflow-x-auto">
          {renderContent()}
        </div>
      </div>
    </AdminPageLayout>
  );
};

export default BookingManagement;

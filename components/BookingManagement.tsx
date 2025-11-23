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
  
  const getStatusBadge = (status: BookingDetail['status'] | string) => {
      switch (status) {
          case 'confirmed':
              return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Confirmed</span>;
          case 'success':
              return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Success</span>;
          case 'hold':
              return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">On Hold</span>;
          case 'completed':
              return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">Completed</span>;
          case 'cancelled':
              return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Cancelled</span>;
          case 'failed':
              return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Failed</span>;
          case 'pending_payment':
          case 'pending':
              return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Pending Payment</span>;
          default:
              return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 capitalize">{status}</span>;
      }
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
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer & Car</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking Period</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status & Extensions</th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {bookings.map((booking) => (
            <tr key={booking.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{booking.customer_name || 'N/A'}</div>
                <div className="text-sm text-gray-500">{booking.customer_phone || 'N/A'}</div>
                 <div className="text-sm text-gray-800 font-semibold mt-1">{booking.car_title || 'N/A'}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div>From: {formatDate(booking.start_datetime)}</div>
                <div>To: {formatDate(booking.end_datetime)}</div>
                {booking.status === 'hold' && booking.hold_expires_at && (
                    <div className="text-xs text-red-600">Hold Expires: {formatDate(booking.hold_expires_at)}</div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {getStatusBadge(booking.status)}
                {booking.booking_extensions && booking.booking_extensions.length > 0 && (
                    <div className="mt-2 text-xs text-gray-500 space-y-1">
                        <p className="font-semibold">Extensions:</p>
                        {booking.booking_extensions.map(ext => (
                            <div key={ext.id} className="flex items-center gap-2">
                                <span>+{ext.added_hours}hrs</span>
                                {getStatusBadge(ext.payment_status)}
                            </div>
                        ))}
                    </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                <span className="font-semibold text-gray-900">₹{booking.total_amount.toLocaleString()}</span>
                {booking.discount_amount && booking.discount_amount > 0 && (
                    <div className="text-xs text-green-600">
                        (Discount: ₹{booking.discount_amount.toLocaleString()})
                    </div>
                )}
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


import React from 'react';
import AdminPageLayout from './AdminPageLayout';

const BookingManagement: React.FC = () => {
  return (
    <AdminPageLayout
      title="Booking Management"
      subtitle="View and manage all customer bookings."
    >
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center">
        <h2 className="text-xl font-semibold text-gray-700">Feature Coming Soon!</h2>
        <p className="text-gray-500 mt-2">This section is under construction. You will soon be able to view, manage, and confirm all user bookings in real-time.</p>
      </div>
    </AdminPageLayout>
  );
};

export default BookingManagement;
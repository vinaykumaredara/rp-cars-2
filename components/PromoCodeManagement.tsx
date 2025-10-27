

import React from 'react';
import AdminPageLayout from './AdminPageLayout';

const PromoCodeManagement: React.FC = () => {
  return (
    <AdminPageLayout
      title="Promo Code Management"
      subtitle="Create and manage promotional codes."
    >
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center">
        <h2 className="text-xl font-semibold text-gray-700">Feature Coming Soon!</h2>
        <p className="text-gray-500 mt-2">This section is under construction. You will soon be able to create, edit, and track promo codes and discounts.</p>
      </div>
    </AdminPageLayout>
  );
};

export default PromoCodeManagement;
import React from 'react';

const PromoCodeManagement: React.FC = () => {
  const handleBack = () => {
    window.location.hash = '#/admin';
  };

  return (
    <div className="bg-neutral-lightgrey min-h-screen p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <button 
            onClick={handleBack} 
            className="text-primary-blue hover:underline mb-4 inline-flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-neutral-charcoal">Promo Code Management</h1>
          <p className="text-gray-500">Create and manage promotional codes.</p>
        </header>

        <main>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center">
            <h2 className="text-xl font-semibold text-gray-700">Feature Coming Soon!</h2>
            <p className="text-gray-500 mt-2">This section is under construction. You will soon be able to create, edit, and track promo codes and discounts.</p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PromoCodeManagement;

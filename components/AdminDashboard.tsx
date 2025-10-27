import React from 'react';
import AdminCard from './AdminCard';
import { CarManagementIcon, BookingManagementIcon, LicenseVerificationIcon, PromoCodeIcon, UserManagementIcon } from '../constants';

const AdminDashboard: React.FC = () => {
    return (
        <div className="bg-neutral-lightgrey min-h-screen p-4 sm:p-6 lg:p-8 font-sans">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <header className="mb-8">
                    <div className="flex items-center">
                        <div className="bg-purple-600 p-3 rounded-lg mr-4 shadow-md">
                           <svg className="w-8 h-8 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 17h2l.64-2.56a2 2 0 0 0-1.94-2.44H5.3a2 2 0 0 0-1.94 2.44L4 17h2" /><path d="M19 17a2 2 0 1 1 0-4H5a2 2 0 1 1 0 4h14Z" /><path d="M5 13V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v7" /></svg>
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold" style={{ color: '#6b21a8' }}>RP CARS Admin</h1>
                            <p className="text-gray-500">Management Dashboard</p>
                        </div>
                    </div>
                </header>

                {/* Main Content Grid */}
                <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AdminCard
                        onClick={() => window.location.hash = '#/admin/cars'}
                        icon={
                            <div className="bg-purple-100 p-3 rounded-lg">
                                <CarManagementIcon className="w-6 h-6 text-purple-600" />
                            </div>
                        }
                        title="Car Management"
                        description="Add, edit, and manage your car inventory with photos and specifications."
                        status={
                            <span>
                                1 active vehicles • <span className="text-green-600 font-semibold">Updated daily</span>
                            </span>
                        }
                    />
                    <AdminCard
                        onClick={() => window.location.hash = '#/admin/bookings'}
                        icon={
                            <div className="bg-green-100 p-3 rounded-lg">
                                <BookingManagementIcon className="w-6 h-6 text-green-600" />
                            </div>
                        }
                        title="Booking Management"
                        description="View and manage customer bookings and cancellations."
                        status={
                            <span>
                                1 active bookings • <span className="text-orange-500 font-semibold">Real-time</span>
                            </span>
                        }
                    />
                    <AdminCard
                        onClick={() => window.location.hash = '#/admin/users'}
                        icon={
                            <div className="bg-blue-100 p-3 rounded-lg">
                                <UserManagementIcon className="w-6 h-6 text-blue-600" />
                            </div>
                        }
                        title="User Management"
                        description="View and manage registered users."
                    />
                    <AdminCard
                        onClick={() => window.location.hash = '#/admin/licenses'}
                        icon={
                            <div className="bg-purple-100 p-3 rounded-lg">
                                <LicenseVerificationIcon className="w-6 h-6 text-purple-600" />
                            </div>
                        }
                        title="License Verification"
                        description="Review and verify customer driver's licenses with AI."
                    />
                    <AdminCard
                        onClick={() => window.location.hash = '#/admin/promos'}
                        icon={
                            <div className="bg-pink-100 p-3 rounded-lg">
                                <PromoCodeIcon className="w-6 h-6 text-pink-600" />
                            </div>
                        }
                        title="Promo Codes"
                        description="Create and manage promotional codes and discounts for customers."
                    />
                </main>
            </div>
        </div>
    );
};

export default AdminDashboard;
import React, { useState, useEffect } from 'react';
import AdminCard from './AdminCard';
import { CarManagementIcon, BookingManagementIcon, LicenseVerificationIcon, PromoCodeIcon, UserManagementIcon } from '../constants';
import { fetchDashboardStats } from '../lib/adminService';
import type { DashboardStats } from '../lib/adminService';
import DatabaseSetup from './DatabaseSetup';
import { useAuth } from '../contexts/AuthContext';

const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { signOut } = useAuth();

    useEffect(() => {
        const loadStats = async () => {
            setLoading(true);
            const { stats, error } = await fetchDashboardStats();
            setStats(stats);
            setError(error);
            setLoading(false);
        };
        loadStats();
    }, []);
    
    const renderStat = (value: number | undefined, unit: string, colorClass = 'text-green-600') => {
        if (loading) return <span className="text-gray-500">Loading...</span>;
        // Error rendering is handled at a higher level now
        return <span><span className={colorClass + ' font-bold'}>{value ?? 0}</span> {unit}</span>;
    };

    const needsSetup = error && error.includes('Backend not configured');

    return (
        <div className="bg-muted min-h-screen p-4 sm:p-6 lg:p-8 font-sans">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <header className="mb-8">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center">
                            <div className="bg-purple-600 p-3 rounded-lg mr-4 shadow-md">
                               <CarManagementIcon className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold" style={{ color: '#6b21a8' }}>RP CARS Admin</h1>
                                <p className="text-gray-500">Management Dashboard</p>
                            </div>
                        </div>
                        <button
                            onClick={signOut}
                            className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition-colors duration-300"
                        >
                            Sign Out
                        </button>
                    </div>
                </header>
                
                {needsSetup ? (
                    <DatabaseSetup />
                ) : error ? (
                     <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-6" role="alert">
                        <strong className="font-bold">Error: </strong>
                        <span className="block sm:inline">{error}</span>
                    </div>
                ) : (
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
                            status={renderStat(stats?.total_cars, 'total vehicles')}
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
                            status={renderStat(stats?.active_bookings, 'active bookings', 'text-orange-600')}
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
                            status={renderStat(stats?.total_users, 'registered users', 'text-blue-600')}
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
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
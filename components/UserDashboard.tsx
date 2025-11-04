import React, { useState, useEffect, Suspense, lazy } from 'react';
import Header from './Header';
import Footer from './Footer';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import Modal from './Modal';

const BookingHistory = lazy(() => import('./dashboard/BookingHistory'));
const ProfileSettings = lazy(() => import('./dashboard/ProfileSettings'));
const LicenseManagement = lazy(() => import('./dashboard/LicenseManagement'));

type Tab = 'bookings' | 'profile' | 'license';

const UserDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('bookings');
    const { signOut } = useAuth();
    const { addToast } = useToast();
    // This modal is for the header, though user should be logged in here
    const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);

    useEffect(() => {
        const postExtensionSuccess = sessionStorage.getItem('postExtensionSuccess');
        if (postExtensionSuccess) {
            addToast('Booking extended successfully!', 'success');
            sessionStorage.removeItem('postExtensionSuccess');
        }
    }, [addToast]);

    const renderContent = () => {
        switch (activeTab) {
            case 'bookings':
                return <BookingHistory />;
            case 'profile':
                return <ProfileSettings />;
            case 'license':
                return <LicenseManagement />;
            default:
                return <BookingHistory />;
        }
    };
    
    const TabButton: React.FC<{tab: Tab, label: string}> = ({ tab, label }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`w-full text-left px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab 
                ? 'bg-primary text-white shadow' 
                : 'text-gray-600 hover:bg-gray-200'
            }`}
        >
            {label}
        </button>
    );

    return (
        <div className="bg-gray-50 min-h-screen flex flex-col">
            <Header onSignInClick={() => setIsSignInModalOpen(true)} />
            <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
                <header className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-foreground">My Account</h1>
                    <p className="text-gray-500 mt-1">Manage your bookings, profile, and documents.</p>
                </header>

                <div className="flex flex-col md:flex-row gap-8">
                    {/* Sidebar/Nav */}
                    <aside className="md:w-1/4">
                        <nav className="flex flex-col gap-2 bg-white p-4 rounded-lg border">
                            <TabButton tab="bookings" label="My Bookings" />
                            <TabButton tab="profile" label="Profile Settings" />
                            <TabButton tab="license" label="Driver's License" />
                             <button
                                onClick={signOut}
                                className="w-full text-left mt-4 px-4 py-2 text-sm font-medium rounded-md transition-colors text-red-600 hover:bg-red-100"
                            >
                                Sign Out
                            </button>
                        </nav>
                    </aside>
                    {/* Main Content */}
                    <div className="md:w-3/4">
                        <div className="bg-white p-4 sm:p-6 rounded-lg border min-h-[400px]">
                            <Suspense fallback={<div className="text-center p-8">Loading...</div>}>
                                {renderContent()}
                            </Suspense>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
            {/* Modal for Header */}
            <Modal isOpen={isSignInModalOpen} onClose={() => setIsSignInModalOpen(false)} />
        </div>
    );
};
export default UserDashboard;
import React, { useState, useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import Modal from './Modal';

import BookingHistory from './dashboard/BookingHistory';
import ProfileSettings from './dashboard/ProfileSettings';
import LicenseManagement from './dashboard/LicenseManagement';

type Tab = 'bookings' | 'profile' | 'license';

// Component defined outside for stability and performance.
const TabButton: React.FC<{
    tab: Tab;
    label: string;
    activeTab: Tab;
    setActiveTab: (tab: Tab) => void;
}> = ({ tab, label, activeTab, setActiveTab }) => (
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

const UserDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('bookings');
    const { user, signOut } = useAuth();
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
                            <TabButton tab="bookings" label="My Bookings" activeTab={activeTab} setActiveTab={setActiveTab} />
                            <TabButton tab="profile" label="Profile Settings" activeTab={activeTab} setActiveTab={setActiveTab} />
                            <TabButton tab="license" label="Driver's License" activeTab={activeTab} setActiveTab={setActiveTab} />
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
                           {renderContent()}
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
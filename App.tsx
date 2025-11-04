import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useAuth } from './contexts/AuthContext';

// Lazy-load page-level components
const HomePage = lazy(() => import('./components/HomePage'));
const AdminPortal = lazy(() => import('./components/AdminPortal'));
const PaymentHandler = lazy(() => import('./components/PaymentHandler'));
const UserDashboard = lazy(() => import('./components/UserDashboard'));

// Helper to determine the current view from the hash
const getCurrentView = () => {
    const hash = window.location.hash;
    if (hash.startsWith('#/admin')) {
        return 'admin';
    }
    if (hash.startsWith('#/payment/callback')) {
        return 'payment';
    }
    if (hash.startsWith('#/dashboard')) {
        return 'dashboard';
    }
    return 'home';
};

const App: React.FC = () => {
    const [view, setView] = useState(getCurrentView());
    const { user, role, loading: authLoading } = useAuth();
    const isAdmin = role === 'admin';

    // Handle hash-based routing and access control
    useEffect(() => {
        const onHashChange = () => {
            setView(getCurrentView());
        };
        window.addEventListener('hashchange', onHashChange);

        const currentView = getCurrentView();
        // Redirect non-admins trying to access admin routes
        if (currentView.startsWith('admin') && !authLoading && !isAdmin) {
            window.location.hash = '#/';
        }
        // Redirect non-logged-in users from dashboard
        if (currentView.startsWith('dashboard') && !authLoading && !user) {
            window.location.hash = '#/';
        }

        return () => {
            window.removeEventListener('hashchange', onHashChange);
        };
    }, [isAdmin, authLoading, user]);
    
    // Render Admin or Home section with Suspense for lazy loading
    if (view.startsWith('admin') && isAdmin) {
        return (
            <Suspense fallback={<div className="admin-loader">Loading Admin Panel...</div>}>
                <AdminPortal />
            </Suspense>
        );
    }

    if (view === 'payment') {
        return (
             <Suspense fallback={<div className="admin-loader">Loading Payment Processor...</div>}>
                <PaymentHandler />
            </Suspense>
        )
    }

    if (view === 'dashboard' && user) {
        return (
             <Suspense fallback={<div className="admin-loader">Loading Dashboard...</div>}>
                <UserDashboard />
            </Suspense>
        )
    }

    return (
        <Suspense fallback={<div className="admin-loader">Loading...</div>}>
            <HomePage />
        </Suspense>
    );
};

export default App;
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useAuth } from './contexts/AuthContext';
import { isSupabaseConfigured } from './lib/supabaseClient';

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
    
    // Block the entire app if Supabase is not configured, showing a clear error.
    if (!isSupabaseConfigured) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-red-50 text-red-900 p-4 font-sans">
                <div className="text-center p-8 bg-white border border-red-200 rounded-lg shadow-md max-w-lg">
                     <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h1 className="text-2xl font-bold mt-4">Application Not Configured</h1>
                    <p className="mt-2 text-red-800">
                        The backend connection is not configured. This application requires 
                        <code> SUPABASE_URL</code> and <code>SUPABASE_ANON_KEY</code> environment variables.
                    </p>
                    <p className="mt-4 text-sm text-gray-600">
                        When deploying to a service like Netlify, ensure these variables are set in your site's environment settings. Refer to the project documentation for more details.
                    </p>
                </div>
            </div>
        );
    }

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
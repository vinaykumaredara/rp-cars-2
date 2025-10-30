import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useAuth } from './contexts/AuthContext';

// Lazy-load page-level components
const HomePage = lazy(() => import('./components/HomePage'));
const AdminPortal = lazy(() => import('./components/AdminPortal'));

// Helper to determine the current view from the hash
const getCurrentView = () => {
    const hash = window.location.hash;
    if (hash.startsWith('#/admin')) {
        return 'admin';
    }
    return 'home';
};

const App: React.FC = () => {
    const [view, setView] = useState(getCurrentView());
    const { role, loading: authLoading } = useAuth();
    const isAdmin = role === 'admin';

    // Handle hash-based routing and access control
    useEffect(() => {
        const onHashChange = () => {
            setView(getCurrentView());
        };
        window.addEventListener('hashchange', onHashChange);

        // Redirect non-admins trying to access admin routes
        if (getCurrentView().startsWith('admin') && !authLoading && !isAdmin) {
            window.location.hash = '#/';
        }

        return () => {
            window.removeEventListener('hashchange', onHashChange);
        };
    }, [isAdmin, authLoading]);
    
    // Render Admin or Home section with Suspense for lazy loading
    if (view.startsWith('admin') && isAdmin) {
        return (
            <Suspense fallback={<div className="admin-loader">Loading Admin Panel...</div>}>
                <AdminPortal />
            </Suspense>
        );
    }

    return (
        <Suspense fallback={<div className="admin-loader">Loading...</div>}>
            <HomePage />
        </Suspense>
    );
};

export default App;

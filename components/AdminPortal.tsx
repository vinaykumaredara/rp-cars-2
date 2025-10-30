import React, { lazy, Suspense } from 'react';

// Lazy-load admin components
const AdminDashboard = lazy(() => import('./AdminDashboard'));
const CarManagement = lazy(() => import('./CarManagement'));
const BookingManagement = lazy(() => import('./BookingManagement'));
const UserManagement = lazy(() => import('./UserManagement'));
const LicenseVerification = lazy(() => import('./LicenseVerification'));
const PromoCodeManagement = lazy(() => import('./PromoCodeManagement'));

const getCurrentAdminView = () => {
    const hash = window.location.hash;
    if (hash === '#/admin/cars') return 'cars';
    if (hash === '#/admin/bookings') return 'bookings';
    if (hash === '#/admin/users') return 'users';
    if (hash === '#/admin/licenses') return 'licenses';
    if (hash === '#/admin/promos') return 'promos';
    return 'dashboard'; // Default admin route
};

const AdminPortal: React.FC = () => {
    // We can use a simple state for the view within the portal since App.tsx handles the #/admin routing.
    const [view, setView] = React.useState(getCurrentAdminView());

    React.useEffect(() => {
        const onHashChange = () => setView(getCurrentAdminView());
        window.addEventListener('hashchange', onHashChange);
        return () => window.removeEventListener('hashchange', onHashChange);
    }, []);

    const renderView = () => {
        switch(view) {
            case 'dashboard':
                return <AdminDashboard />;
            case 'cars':
                return <CarManagement />;
            case 'bookings':
                return <BookingManagement />;
            case 'users':
                return <UserManagement />;
            case 'licenses':
                return <LicenseVerification />;
            case 'promos':
                return <PromoCodeManagement />;
            default:
                 window.location.hash = '#/admin'; // Redirect to default admin dashboard
                 return null;
        }
    };

    return (
        <Suspense fallback={<div className="admin-loader">Loading Admin Module...</div>}>
            {renderView()}
        </Suspense>
    );
};

export default AdminPortal;

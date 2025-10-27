
import React, { useState, useMemo, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import SearchFilter from './components/SearchFilter';
import CarCard from './components/CarCard';
import FeatureHighlights from './components/FeatureHighlights';
import Statistics from './components/Statistics';
import Testimonials from './components/Testimonials';
import CTA from './components/CTA';
import Footer from './components/Footer';
import Modal from './components/Modal';
import BookingModal from './components/BookingModal';
import AdminDashboard from './components/AdminDashboard';
import CarManagement from './components/CarManagement';
import BookingManagement from './components/BookingManagement';
import UserManagement from './components/UserManagement';
import LicenseVerification from './components/LicenseVerification';
import PromoCodeManagement from './components/PromoCodeManagement';
import { fetchCarsFromDB } from './lib/carService'; // Import the new service
import type { Car, FuelType } from './types';
import { useAuth } from './contexts/AuthContext';

// Helper to determine the current view from the hash
const getCurrentView = () => {
    const hash = window.location.hash;
    if (hash.startsWith('#/admin')) {
        if (hash === '#/admin/cars') return 'admin-cars';
        if (hash === '#/admin/bookings') return 'admin-bookings';
        if (hash === '#/admin/users') return 'admin-users';
        if (hash === '#/admin/licenses') return 'admin-licenses';
        if (hash === '#/admin/promos') return 'admin-promos';
        return 'admin'; // Default admin route
    }
    return 'home';
};

const App: React.FC = () => {
    // State for cars
    const [cars, setCars] = useState<Car[]>([]);
    const [isLoadingCars, setIsLoadingCars] = useState(true);
    const [carsError, setCarsError] = useState<string | null>(null);

    // State for auth modal
    const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);

    // State for booking modal
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [selectedCar, setSelectedCar] = useState<Car | null>(null);
    
    // State for filters
    const [searchTerm, setSearchTerm] = useState('');
    const [seatFilter, setSeatFilter] = useState<number | 'all'>('all');
    const [fuelFilter, setFuelFilter] = useState<FuelType | 'all'>('all');
    
    // Simple hash-based routing state
    const [view, setView] = useState(getCurrentView());
    
    const { user, role, loading: authLoading } = useAuth();
    const isAdmin = role === 'admin';

    // Fetch car data using the centralized service
    useEffect(() => {
        const loadCars = async () => {
            const { cars, error } = await fetchCarsFromDB();
            setCars(cars);
            setCarsError(error);
            setIsLoadingCars(false);
        };
        loadCars();
    }, []);

    // Handle hash-based routing and access control
    useEffect(() => {
        const onHashChange = () => {
            setView(getCurrentView());
        };
        window.addEventListener('hashchange', onHashChange);

        // This check runs on mount and whenever the user/role state changes.
        // If the user is on any admin route but isn't an admin, redirect them.
        if (getCurrentView().startsWith('admin') && !authLoading && !isAdmin) {
            window.location.hash = '#/';
        }

        return () => {
            window.removeEventListener('hashchange', onHashChange);
        };
    }, [user, isAdmin, authLoading]); // Re-evaluate access control when user/role changes.
    
    const handleBookNow = (car: Car) => {
        if (!user) {
            setIsSignInModalOpen(true);
        } else {
            setSelectedCar(car);
            setIsBookingModalOpen(true);
        }
    };
    
    const filteredCars = useMemo(() => {
        return cars.filter(car => {
            const searchTermLower = searchTerm.toLowerCase();
            const matchesSearch = car.title.toLowerCase().includes(searchTermLower) || car.year.toString().includes(searchTermLower);
            const matchesSeats = seatFilter === 'all' || car.seats === seatFilter;
            const matchesFuel = fuelFilter === 'all' || car.fuelType === fuelFilter;
            return matchesSearch && matchesSeats && matchesFuel;
        });
    }, [cars, searchTerm, seatFilter, fuelFilter]);
    
    // Render Admin section or Home section based on view and auth
    if (view.startsWith('admin') && isAdmin) {
        switch(view) {
            case 'admin':
                return <AdminDashboard />;
            case 'admin-cars':
                return <CarManagement />;
            case 'admin-bookings':
                return <BookingManagement />;
            case 'admin-users':
                return <UserManagement />;
            case 'admin-licenses':
                return <LicenseVerification />;
            case 'admin-promos':
                return <PromoCodeManagement />;
            default:
                // If hash is invalid, redirect to admin home
                window.location.hash = '#/admin';
                return null;
        }
    }

    return (
        <div className="bg-gray-50 font-sans">
            <Header onSignInClick={() => setIsSignInModalOpen(true)} />
            <main>
                <Hero />
                <SearchFilter 
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    seatFilter={seatFilter}
                    setSeatFilter={setSeatFilter}
                    fuelFilter={fuelFilter}
                    setFuelFilter={setFuelFilter}
                />
                <section id="cars" className="py-16 lg:py-24">
                  <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-bold text-center mb-12 text-neutral-charcoal">Our Fleet</h2>
                    {isLoadingCars ? (
                        <p className="text-center text-gray-600">Loading our fleet...</p>
                    ) : carsError ? (
                        <p className="text-center text-red-600 bg-red-100 p-4 rounded-md">{carsError}</p>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                              {filteredCars.map(car => (
                                <CarCard key={car.id} car={car} onBookNow={handleBookNow} />
                              ))}
                            </div>
                            {filteredCars.length === 0 && (
                                <p className="text-center text-gray-600 mt-8">No cars match your current filters. Try adjusting your search.</p>
                            )}
                        </>
                    )}
                  </div>
                </section>
                <FeatureHighlights />
                <Statistics />
                <Testimonials />
                <CTA />
            </main>
            <Footer />

            <Modal isOpen={isSignInModalOpen} onClose={() => setIsSignInModalOpen(false)} />
            {selectedCar && (
                <BookingModal 
                    isOpen={isBookingModalOpen}
                    onClose={() => setIsBookingModalOpen(false)}
                    car={selectedCar}
                />
            )}
        </div>
    );
};

export default App;

import React, { useState, useEffect, lazy, Suspense } from 'react';
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
import { fetchCarsFromDB } from './lib/carService';
import type { Car, FuelType } from './types';
import { useAuth } from './contexts/AuthContext';

const CARS_PER_PAGE = 9;

// Lazy-load heavy components
const BookingModal = lazy(() => import('./components/BookingModal'));
const AIAssistant = lazy(() => import('./components/AIAssistant'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const CarManagement = lazy(() => import('./components/CarManagement'));
const BookingManagement = lazy(() => import('./components/BookingManagement'));
const UserManagement = lazy(() => import('./components/UserManagement'));
const LicenseVerification = lazy(() => import('./components/LicenseVerification'));
const PromoCodeManagement = lazy(() => import('./components/PromoCodeManagement'));


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
    // State for cars & pagination
    const [cars, setCars] = useState<Car[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMoreCars, setHasMoreCars] = useState(true);
    const [isLoadingCars, setIsLoadingCars] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [carsError, setCarsError] = useState<string | null>(null);
    const [loadMoreError, setLoadMoreError] = useState<string | null>(null);

    // State for auth modal
    const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);

    // State for booking modal
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [selectedCar, setSelectedCar] = useState<Car | null>(null);
    
    // State for filters
    const [searchTerm, setSearchTerm] = useState('');
    const [seatFilter, setSeatFilter] = useState<number | 'all'>('all');
    const [fuelFilter, setFuelFilter] = useState<FuelType[]>([]);
    
    // Simple hash-based routing state
    const [view, setView] = useState(getCurrentView());
    
    const { user, role, loading: authLoading } = useAuth();
    const isAdmin = role === 'admin';

    // Fetch car data when filters change
    useEffect(() => {
        const loadFilteredCars = async () => {
            setIsLoadingCars(true);
            setCarsError(null);
            
            const { cars: newCars, error, count } = await fetchCarsFromDB({ 
                page: 1, 
                limit: CARS_PER_PAGE,
                searchTerm,
                seatFilter,
                fuelFilter,
            });
            
            setCars(newCars);
            setCurrentPage(1); // Reset to page 1 for new filter results
            setCarsError(error);
            if (count !== null) {
                setHasMoreCars(newCars.length < count);
            } else {
                setHasMoreCars(false);
            }
            setIsLoadingCars(false);
        };
        loadFilteredCars();
    }, [searchTerm, seatFilter, fuelFilter]);

    // Handle hash-based routing and access control
    useEffect(() => {
        const onHashChange = () => {
            setView(getCurrentView());
        };
        window.addEventListener('hashchange', onHashChange);

        if (getCurrentView().startsWith('admin') && !authLoading && !isAdmin) {
            window.location.hash = '#/';
        }

        return () => {
            window.removeEventListener('hashchange', onHashChange);
        };
    }, [user, isAdmin, authLoading]);
    
    const handleBookNow = (car: Car) => {
        if (!user) {
            setIsSignInModalOpen(true);
        } else {
            setSelectedCar(car);
            setIsBookingModalOpen(true);
        }
    };

    const handleLoadMore = async () => {
        if (isFetchingMore || !hasMoreCars) return;

        setIsFetchingMore(true);
        setLoadMoreError(null);
        const nextPage = currentPage + 1;
        const { cars: newCars, error, count } = await fetchCarsFromDB({ 
            page: nextPage, 
            limit: CARS_PER_PAGE,
            searchTerm,
            seatFilter,
            fuelFilter,
        });

        if (error) {
            setLoadMoreError('Failed to load more cars. Please try again.');
        } else if (newCars.length > 0) {
            setCars(prevCars => {
                const updatedCars = [...prevCars, ...newCars];
                if (count !== null) {
                    setHasMoreCars(updatedCars.length < count);
                }
                return updatedCars;
            });
            setCurrentPage(nextPage);
        } else {
            setHasMoreCars(false);
        }
        setIsFetchingMore(false);
    };
    
    // Render Admin section with Suspense for lazy loading
    if (view.startsWith('admin') && isAdmin) {
        return (
            <Suspense fallback={<div className="admin-loader">Loading Admin Panel...</div>}>
                {(() => {
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
                            window.location.hash = '#/admin';
                            return null;
                    }
                })()}
            </Suspense>
        );
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
                    <h2 className="text-3xl font-bold text-center mb-12 text-foreground">Our Fleet</h2>
                    {isLoadingCars ? (
                        <p className="text-center text-gray-600">Loading our fleet...</p>
                    ) : carsError ? (
                        <p className="text-center text-red-600 bg-red-100 p-4 rounded-md">{carsError}</p>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                              {cars.map(car => (
                                <CarCard key={car.id} car={car} onBookNow={handleBookNow} />
                              ))}
                            </div>

                            {cars.length === 0 && (
                                <p className="text-center text-gray-600 mt-8">
                                    No cars match your current filters. Try adjusting your search.
                                </p>
                            )}

                            {hasMoreCars && (
                                <div className="text-center mt-12">
                                    <button
                                        onClick={handleLoadMore}
                                        disabled={isFetchingMore}
                                        className="px-8 py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary-hover transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:bg-opacity-50 disabled:cursor-wait disabled:transform-none"
                                    >
                                        {isFetchingMore ? 'Loading...' : 'Load More Cars'}
                                    </button>
                                    {loadMoreError && (
                                        <p className="text-red-600 text-sm mt-2">{loadMoreError}</p>
                                    )}
                                </div>
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
            
            <Suspense fallback={null}>
                {selectedCar && (
                    <BookingModal 
                        isOpen={isBookingModalOpen}
                        onClose={() => setIsBookingModalOpen(false)}
                        car={selectedCar}
                    />
                )}
                <AIAssistant />
            </Suspense>
        </div>
    );
};

export default App;
import React, { useState, useEffect, lazy, Suspense, useCallback } from 'react';
import Header from './Header';
import Hero from './Hero';
import SearchFilter from './SearchFilter';
import CarCard from './CarCard';
import FeatureHighlights from './FeatureHighlights';
import Statistics from './Statistics';
import Testimonials from './Testimonials';
import CTA from './CTA';
import Footer from './Footer';
import Modal from './Modal';
import { fetchCarsFromDB } from '../lib/carService';
import { useDebounce } from '../lib/useDebounce';
import type { Car, FuelType } from '../types';
import { useAuth } from '../contexts/AuthContext';
import CarCardSkeleton from './CarCardSkeleton';

const CARS_PER_PAGE = 9;

// Lazy-load heavy components
const BookingModal = lazy(() => import('./BookingModal'));
const AIAssistant = lazy(() => import('./AIAssistant'));

const HomePage: React.FC = () => {
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
    const [carToBookAfterLogin, setCarToBookAfterLogin] = useState<Car | null>(null);
    
    // State for filters
    const [searchTerm, setSearchTerm] = useState('');
    const [seatFilter, setSeatFilter] = useState<number | 'all'>('all');
    const [fuelFilter, setFuelFilter] = useState<FuelType[]>([]);
    
    const debouncedSearchTerm = useDebounce(searchTerm, 500); // 500ms delay for search
    
    const { user } = useAuth();

    // Fetch car data when debounced filters change
    useEffect(() => {
        const loadFilteredCars = async () => {
            setIsLoadingCars(true);
            setCarsError(null);
            
            const { cars: newCars, error, count } = await fetchCarsFromDB({ 
                page: 1, 
                limit: CARS_PER_PAGE,
                searchTerm: debouncedSearchTerm,
                seatFilter,
                fuelFilter,
            });
            
            setCars(newCars);
            setCurrentPage(1); // Reset to page 1 for new filter results
            setCarsError(error);
            setHasMoreCars(count ? newCars.length < count : false);
            setIsLoadingCars(false);
        };
        loadFilteredCars();
    }, [debouncedSearchTerm, seatFilter, fuelFilter]);
    
    // Effect to trigger booking modal after a user logs in.
    useEffect(() => {
        // If the user has just logged in and we have a car pending booking
        if (user && carToBookAfterLogin) {
            // Open the booking modal for the intended car
            setSelectedCar(carToBookAfterLogin);
            setIsBookingModalOpen(true);
            // Clear the pending car reference
            setCarToBookAfterLogin(null);
        }
    }, [user, carToBookAfterLogin]);

    const handleOpenSignInModal = useCallback(() => {
        setIsSignInModalOpen(true);
    }, []);

    const handleBookNow = useCallback((car: Car) => {
        if (!user) {
            // Store the car the user wants to book
            setCarToBookAfterLogin(car);
            // Open the sign-in modal
            setIsSignInModalOpen(true);
        } else {
            // If user is already logged in, proceed directly
            setSelectedCar(car);
            setIsBookingModalOpen(true);
        }
    }, [user]);

    const handleLoadMore = useCallback(async () => {
        if (isFetchingMore || !hasMoreCars) return;

        setIsFetchingMore(true);
        setLoadMoreError(null);
        const nextPage = currentPage + 1;
        const { cars: newCars, error, count } = await fetchCarsFromDB({ 
            page: nextPage, 
            limit: CARS_PER_PAGE,
            searchTerm: debouncedSearchTerm,
            seatFilter,
            fuelFilter,
        });

        if (error) {
            setLoadMoreError('Failed to load more cars. Please try again.');
        } else if (newCars.length > 0) {
            setCars(prevCars => {
                const updatedCars = [...prevCars, ...newCars];
                setHasMoreCars(count ? updatedCars.length < count : false);
                return updatedCars;
            });
            setCurrentPage(nextPage);
        } else {
            setHasMoreCars(false);
        }
        setIsFetchingMore(false);
    }, [isFetchingMore, hasMoreCars, currentPage, debouncedSearchTerm, seatFilter, fuelFilter]);

    return (
        <div className="bg-gray-50 font-sans">
            <Header onSignInClick={handleOpenSignInModal} />
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {Array.from({ length: 6 }).map((_, index) => (
                                <CarCardSkeleton key={index} />
                            ))}
                        </div>
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

            <Modal 
                isOpen={isSignInModalOpen} 
                onClose={() => {
                    setIsSignInModalOpen(false);
                    // If the modal is closed without the user logging in, clear the pending car
                    if (!user) {
                        setCarToBookAfterLogin(null);
                    }
                }} 
            />
            
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

export default HomePage;
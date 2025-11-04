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
import type { Car, FuelType, BookingDraft } from '../types';
import { useAuth } from '../contexts/AuthContext';
import CarCardSkeleton from './CarCardSkeleton';
import { supabase } from '../lib/supabaseClient';

const CARS_PER_PAGE = 9;

// Lazy-load heavy components
const BookingModal = lazy(() => import('./BookingModal'));
const AIAssistant = lazy(() => import('./AIAssistant'));

interface PostPaymentInfo {
    bookingId: string;
    carId: string;
}

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
    const [initialBookingState, setInitialBookingState] = useState<Partial<BookingDraft> | null>(null);
    
    // State for filters
    const [searchTerm, setSearchTerm] = useState('');
    const [seatFilter, setSeatFilter] = useState<number | 'all'>('all');
    const [fuelFilter, setFuelFilter] = useState<FuelType[]>([]);
    const [pickupDate, setPickupDate] = useState('');
    const [returnDate, setReturnDate] = useState('');
    
    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    
    const { user } = useAuth();

    const handleSearch = useCallback(async () => {
        setIsLoadingCars(true);
        setCarsError(null);
        
        const { cars: newCars, error, count } = await fetchCarsFromDB({ 
            page: 1, 
            limit: CARS_PER_PAGE,
            searchTerm: debouncedSearchTerm,
            seatFilter,
            fuelFilter,
            startDate: pickupDate,
            endDate: returnDate
        });
        
        setCars(newCars);
        setCurrentPage(1);
        setCarsError(error);
        setHasMoreCars(count ? newCars.length < count : false);
        setIsLoadingCars(false);
    }, [debouncedSearchTerm, seatFilter, fuelFilter, pickupDate, returnDate]);

    // Initial load and real-time subscription
    useEffect(() => {
        handleSearch(); // Triggered on initial load and any filter change

        const channel = supabase
          .channel('bookings-realtime')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'bookings' },
            (payload) => {
              console.log('Real-time booking change detected, refreshing availability.', payload);
              handleSearch(); // Re-run search with current filters to get latest availability
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
    }, [handleSearch]);
    
    // Effect to trigger booking modal after a user logs in.
    useEffect(() => {
        if (user && carToBookAfterLogin) {
            handleBookNow(carToBookAfterLogin);
            setCarToBookAfterLogin(null);
        }
    }, [user, carToBookAfterLogin]);

    // Effect to handle post-payment confirmation display
    useEffect(() => {
        const checkPostPayment = async () => {
            const postPaymentInfoRaw = sessionStorage.getItem('postPaymentInfo');
            if (postPaymentInfoRaw) {
                sessionStorage.removeItem('postPaymentInfo'); // Clear it immediately
                try {
                    const { carId, bookingId } = JSON.parse(postPaymentInfoRaw) as PostPaymentInfo;
                    
                    // Fetch the specific car details to show in the modal
                    const { data: carData, error } = await supabase.from('cars').select('*').eq('id', carId).single();
                    if (error || !carData) throw new Error('Could not fetch car details for confirmation.');
                    
                    const car: Car = {
                        ...carData,
                        fuelType: carData.fuel_type,
                        pricePerDay: carData.price_per_day,
                        imagePaths: carData.image_paths,
                        images: (carData.image_paths || []).map((p: string) => supabase.storage.from('cars-photos').getPublicUrl(p).data.publicUrl),
                        available: false, // Assume booked
                    };
                    
                    setSelectedCar(car);
                    // Pre-configure the booking modal to open at the confirmation step
                    setInitialBookingState({ bookingId, currentStep: 6 });
                    setIsBookingModalOpen(true);
                } catch (e) {
                    console.error("Error processing post-payment info:", e);
                }
            }
        };
        checkPostPayment();
    }, []);

    const handleOpenSignInModal = useCallback(() => {
        setIsSignInModalOpen(true);
    }, []);

    const handleBookNow = useCallback((car: Car) => {
        if (!user) {
            setCarToBookAfterLogin(car);
            setIsSignInModalOpen(true);
        } else {
            setInitialBookingState(null); // Reset to default flow
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
            startDate: pickupDate,
            endDate: returnDate
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
    }, [isFetchingMore, hasMoreCars, currentPage, debouncedSearchTerm, seatFilter, fuelFilter, pickupDate, returnDate]);
    
    const closeBookingModal = () => {
        setIsBookingModalOpen(false);
        setSelectedCar(null);
        setInitialBookingState(null);
    }

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
                    onSearch={handleSearch}
                    pickupDate={pickupDate}
                    setPickupDate={setPickupDate}
                    returnDate={returnDate}
                    setReturnDate={setReturnDate}
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
                    if (!user) {
                        setCarToBookAfterLogin(null);
                    }
                }} 
            />
            
            <Suspense fallback={null}>
                {isBookingModalOpen && selectedCar && (
                    <BookingModal 
                        isOpen={isBookingModalOpen}
                        onClose={closeBookingModal}
                        car={selectedCar}
                        initialBookingState={initialBookingState}
                    />
                )}
                <AIAssistant />
            </Suspense>
        </div>
    );
};

export default HomePage;
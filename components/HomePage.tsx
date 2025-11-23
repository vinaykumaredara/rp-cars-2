import React, { useState, useEffect, lazy, Suspense, useCallback } from 'react';
import Header from './Header';
import Hero from './Hero';
import SearchFilter from './SearchFilter';
import FeatureHighlights from './FeatureHighlights';
import Statistics from './Statistics';
import Testimonials from './Testimonials';
import CTA from './CTA';
import Footer from './Footer';
import Modal from './Modal';
import { useCarFilters } from '../lib/useCarFilters';
import CarList from './CarList';
import type { Car, BookingDraft } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

const CARS_PER_PAGE = 9;

// Lazy-load heavy components
const BookingModal = lazy(() => import('./BookingModal'));
const AIAssistant = lazy(() => import('./AIAssistant'));

interface PostPaymentInfo {
    bookingId: string;
    carId: string;
}

interface RetryPaymentInfo {
    car: Car;
    bookingData: BookingDraft;
}

const HomePage: React.FC = () => {
    // State for auth modal
    const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);

    // State for booking modal
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [selectedCar, setSelectedCar] = useState<Car | null>(null);
    const [carToBookAfterLogin, setCarToBookAfterLogin] = useState<Car | null>(null);
    const [initialBookingState, setInitialBookingState] = useState<Partial<BookingDraft> | null>(null);
    
    // Custom hook for managing all car data and filters
    const { 
        cars,
        isLoading,
        isFetchingMore,
        hasMoreCars,
        error: carsError,
        searchTerm, setSearchTerm,
        seatFilter, setSeatFilter,
        fuelFilter, setFuelFilter,
        pickupDate, setPickupDate,
        returnDate, setReturnDate,
        handleSearch,
        handleLoadMore,
    } = useCarFilters();
    
    const { user } = useAuth();

    // Effect for real-time updates from bookings
    useEffect(() => {
        const channel = supabase
          .channel('bookings-realtime-homepage')
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

    // Effect to handle post-payment callbacks (success or retry)
    useEffect(() => {
        const checkCallbacks = async () => {
            // Check for successful payment
            const postPaymentInfoRaw = sessionStorage.getItem('postPaymentInfo');
            if (postPaymentInfoRaw) {
                sessionStorage.removeItem('postPaymentInfo');
                try {
                    const { carId, bookingId } = JSON.parse(postPaymentInfoRaw) as PostPaymentInfo;
                    const { data: carData, error } = await supabase.from('cars').select('*').eq('id', carId).single();
                    if (error || !carData) throw new Error('Could not fetch car details for confirmation.');
                    
                    const car: Car = {
                        id: carData.id,
                        title: carData.title,
                        make: carData.make,
                        model: carData.model,
                        year: carData.year,
                        seats: carData.seats,
                        fuelType: carData.fuel_type,
                        transmission: carData.transmission,
                        pricePerDay: carData.price_per_day,
                        verified: carData.verified,
                        status: carData.status,
                        imagePaths: carData.image_paths || [],
                        available: false, // Car is now booked
                    };
                    
                    setSelectedCar(car);
                    setInitialBookingState({ bookingId, currentStep: 6 }); // ConfirmationStep index is 6
                    setIsBookingModalOpen(true);
                } catch (e) { console.error("Error processing post-payment info:", e); }
                return; // Exit after handling
            }

            // Check for retry payment
            const shouldRetry = sessionStorage.getItem('retryPayment');
            if (shouldRetry) {
                sessionStorage.removeItem('retryPayment');
                const attemptInfoRaw = sessionStorage.getItem('paymentAttemptInfo');
                if (attemptInfoRaw) {
                    try {
                        const { car, bookingData } = JSON.parse(attemptInfoRaw) as RetryPaymentInfo;
                        setSelectedCar(car);
                        setInitialBookingState({ ...bookingData, currentStep: 5 }); // PaymentStep index is 5
                        setIsBookingModalOpen(true);
                    } catch (e) { console.error("Error processing retry payment info:", e); }
                }
            }
        };
        checkCallbacks();
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

    const closeBookingModal = () => {
        setIsBookingModalOpen(false);
        setSelectedCar(null);
        setInitialBookingState(null);
        // Clean up payment attempt info if modal is closed manually
        sessionStorage.removeItem('paymentAttemptInfo');
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
                    <CarList
                        cars={cars}
                        isLoading={isLoading}
                        error={carsError}
                        hasMore={hasMoreCars}
                        isFetchingMore={isFetchingMore}
                        onLoadMore={handleLoadMore}
                        onBookNow={handleBookNow}
                    />
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

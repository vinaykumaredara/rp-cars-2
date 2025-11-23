import { useState, useEffect, useCallback } from 'react';
import { fetchCarsFromDB } from './carService';
import { useDebounce } from './useDebounce';
import type { Car, FuelType } from '../types';

const CARS_PER_PAGE = 9;

export const useCarFilters = () => {
    // Data state
    const [cars, setCars] = useState<Car[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMoreCars, setHasMoreCars] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [seatFilter, setSeatFilter] = useState<number | 'all'>('all');
    const [fuelFilter, setFuelFilter] = useState<FuelType[]>([]);
    const [pickupDate, setPickupDate] = useState('');
    const [returnDate, setReturnDate] = useState('');

    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const handleSearch = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        
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
        setError(error);
        setHasMoreCars(count ? newCars.length < count : false);
        setIsLoading(false);
    }, [debouncedSearchTerm, seatFilter, fuelFilter, pickupDate, returnDate]);

    useEffect(() => {
        handleSearch();
    }, [handleSearch]);

    const handleLoadMore = useCallback(async () => {
        if (isFetchingMore || !hasMoreCars) return;

        setIsFetchingMore(true);
        // Do not reset the main error on load more, to avoid hiding a previous filter error
        const nextPage = currentPage + 1;
        const { cars: newCars, error: loadMoreError, count } = await fetchCarsFromDB({ 
            page: nextPage, 
            limit: CARS_PER_PAGE,
            searchTerm: debouncedSearchTerm,
            seatFilter,
            fuelFilter,
            startDate: pickupDate,
            endDate: returnDate
        });

        if (loadMoreError) {
            setError('Failed to load more cars. Please try again.');
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

    return {
        // Data
        cars,
        isLoading,
        isFetchingMore,
        hasMoreCars,
        error,
        // Filters state
        searchTerm,
        seatFilter,
        fuelFilter,
        pickupDate,
        returnDate,
        // Filter setters
        setSearchTerm,
        setSeatFilter,
        setFuelFilter,
        setPickupDate,
        setReturnDate,
        // Actions
        handleSearch,
        handleLoadMore,
    };
};

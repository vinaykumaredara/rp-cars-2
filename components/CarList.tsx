import React from 'react';
import CarCard from './CarCard';
import CarCardSkeleton from './CarCardSkeleton';
import type { Car } from '../types';

interface CarListProps {
    cars: Car[];
    isLoading: boolean;
    error: string | null;
    hasMore: boolean;
    isFetchingMore: boolean;
    onLoadMore: () => void;
    onBookNow: (car: Car) => void;
}

const CarList: React.FC<CarListProps> = ({
    cars,
    isLoading,
    error,
    hasMore,
    isFetchingMore,
    onLoadMore,
    onBookNow,
}) => {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {Array.from({ length: 6 }).map((_, index) => (
                    <CarCardSkeleton key={index} />
                ))}
            </div>
        );
    }

    if (error) {
        return <p className="text-center text-red-600 bg-red-100 p-4 rounded-md">{error}</p>;
    }

    if (cars.length === 0) {
        return (
            <p className="text-center text-gray-600 mt-8">
                No cars match your current filters. Try adjusting your search.
            </p>
        );
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {cars.map(car => (
                    <CarCard key={car.id} car={car} onBookNow={onBookNow} />
                ))}
            </div>

            {hasMore && (
                <div className="text-center mt-12">
                    <button
                        onClick={onLoadMore}
                        disabled={isFetchingMore}
                        className="px-8 py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary-hover transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:bg-opacity-50 disabled:cursor-wait disabled:transform-none"
                    >
                        {isFetchingMore ? 'Loading...' : 'Load More Cars'}
                    </button>
                </div>
            )}
        </>
    );
};

export default CarList;

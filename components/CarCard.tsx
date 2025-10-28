import React, { useState } from 'react';
import type { Car } from '../types';
import { SeatIcon, FuelIcon, GearIcon, MapPinIcon } from '../constants';

interface CarCardProps {
  car: Car;
  onBookNow: (car: Car) => void;
}

const CarCard: React.FC<CarCardProps> = ({ car, onBookNow }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const hasImages = car.images && car.images.length > 0;

  const nextImage = () => {
    if (!hasImages) return;
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % car.images.length);
  };

  const prevImage = () => {
    if (!hasImages) return;
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + car.images.length) % car.images.length);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col transform hover:-translate-y-1 transition-transform duration-300">
      <div className="relative">
        {hasImages ? (
          <img 
            src={car.images[currentImageIndex]} 
            alt={car.title} 
            className="w-full h-56 object-cover" 
            loading="lazy"
            width="600"
            height="400"
          />
        ) : (
          <div className="w-full h-56 bg-gray-200 flex items-center justify-center">
            <span className="text-gray-500">No Image</span>
          </div>
        )}
        
        {hasImages && car.images.length > 1 && (
          <>
            <button type="button" aria-label="Previous image" onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-opacity">
              &#10094;
            </button>
            <button type="button" aria-label="Next image" onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-opacity">
              &#10095;
            </button>
          </>
        )}
        {car.verified && (
            <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                Verified
            </div>
        )}
      </div>

      <div className="p-6 flex-grow flex flex-col">
        <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-bold text-foreground">{car.title}</h3>
            {!car.available && <span className="text-xs font-semibold bg-red-100 text-red-700 px-2 py-1 rounded-md">Not Available</span>}
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-center text-sm text-gray-600 mb-4 border-t border-b border-gray-100 py-4">
          <div className="flex flex-col items-center">
            <SeatIcon className="w-6 h-6 mb-1 text-primary" />
            <span>{car.seats} Seats</span>
          </div>
          <div className="flex flex-col items-center">
            <FuelIcon className="w-6 h-6 mb-1 text-primary" />
            <span>{car.fuelType}</span>
          </div>
          <div className="flex flex-col items-center">
            <GearIcon className="w-6 h-6 mb-1 text-primary" />
            <span>{car.transmission}</span>
          </div>
        </div>
        
        <div className="mt-auto flex justify-between items-center">
          <div>
            <span className="text-2xl font-bold text-foreground">₹{car.pricePerDay}</span>
            <span className="text-sm text-gray-500">/day</span>
          </div>
          <button
            onClick={() => onBookNow(car)}
            disabled={!car.available}
            className="px-6 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-hover transition-all duration-300 shadow-sm hover:shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(CarCard);
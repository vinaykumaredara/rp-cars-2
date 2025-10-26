
import React, { useState } from 'react';
import type { Car } from '../types';
import { SeatIcon, FuelIcon, GearIcon, MapPinIcon } from '../constants';

interface CarCardProps {
  car: Car;
}

const CarCard: React.FC<CarCardProps> = ({ car }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % car.images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + car.images.length) % car.images.length);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 group">
      <div className="relative">
        <img
          src={car.images[currentImageIndex]}
          alt={car.model}
          className="w-full h-56 object-cover"
        />
        {car.images.length > 1 && (
          <>
            <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              &#10094;
            </button>
            <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              &#10095;
            </button>
          </>
        )}
        <div className="absolute top-2 right-2 flex space-x-2">
            {car.available && <span className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full">Available</span>}
            {car.verified && <span className="bg-primary-blue text-white text-xs font-semibold px-2 py-1 rounded-full">Verified</span>}
        </div>
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold text-neutral-charcoal">{car.model}, {car.year}</h3>
        <div className="flex items-center text-gray-500 mt-2">
            <MapPinIcon className="w-4 h-4 mr-1"/>
            <span>{car.area}</span>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-center my-4 border-t border-b py-3">
          <div className="flex flex-col items-center">
            <SeatIcon className="w-6 h-6 text-primary-blue mb-1" />
            <span className="text-sm text-gray-600">{car.seats} Seats</span>
          </div>
          <div className="flex flex-col items-center">
            <FuelIcon className="w-6 h-6 text-primary-blue mb-1" />
            <span className="text-sm text-gray-600">{car.fuelType}</span>
          </div>
          <div className="flex flex-col items-center">
            <GearIcon className="w-6 h-6 text-primary-blue mb-1" />
            <span className="text-sm text-gray-600">{car.gearType}</span>
          </div>
        </div>

        <div className="flex justify-between items-center mt-4">
          <div>
            <span className="text-2xl font-bold text-neutral-charcoal">₹{car.pricePerDay.toLocaleString()}</span>
            <span className="text-gray-500">/day</span>
          </div>
        </div>

        <div className="mt-6 flex space-x-2">
          <button className="flex-1 px-4 py-3 rounded-lg text-primary-blue border border-primary-blue font-semibold hover:bg-primary-blue hover:text-white transition-all duration-300">
            Contact
          </button>
          <button className="flex-1 px-4 py-3 rounded-lg bg-primary-blue text-white font-semibold hover:bg-blue-700 transition-all duration-300 shadow-sm hover:shadow-md">
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default CarCard;

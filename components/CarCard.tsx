import React, { useState } from 'react';
import type { Car } from '../types';
import { SeatIcon, FuelIcon, GearIcon } from '../constants';

interface CarCardProps {
  car: Car;
  onBookNow: (car: Car) => void;
}

// A simple icon for the image placeholder
const ImageIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
);

const WhatsAppIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01s-.521.074-.792.372c-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
    </svg>
);


const CarCard: React.FC<CarCardProps> = ({ car, onBookNow }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const hasImages = car.images && car.images.length > 0;

  // Stop event propagation to prevent other card events from firing
  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasImages) return;
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % car.images.length);
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasImages) return;
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + car.images.length) % car.images.length);
  };
  
  const goToImage = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setCurrentImageIndex(index);
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col transform hover:-translate-y-1 transition-transform duration-300 group">
      <div className="relative bg-gray-200">
        {hasImages ? (
          <>
            <img 
              key={car.images[currentImageIndex]} // Key helps trigger CSS transitions
              src={car.images[currentImageIndex]} 
              alt={car.title} 
              className="w-full h-56 object-cover transition-opacity duration-300 ease-in-out" 
              loading="lazy"
              width="600"
              height="400"
            />
             {car.images.length > 1 && (
              <>
                {/* Previous Button */}
                <button 
                  type="button" 
                  aria-label="Previous image" 
                  onClick={handlePrevImage} 
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-40 text-white p-2 rounded-full hover:bg-opacity-60 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                </button>
                {/* Next Button */}
                <button 
                  type="button" 
                  aria-label="Next image" 
                  onClick={handleNextImage} 
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-40 text-white p-2 rounded-full hover:bg-opacity-60 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                </button>
                {/* Dots Indicator */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-2">
                  {car.images.map((_, index) => (
                    <button 
                      key={index}
                      type="button"
                      aria-label={`Go to image ${index + 1}`}
                      onClick={(e) => goToImage(e, index)}
                      className={`w-2 h-2 rounded-full transition-colors ${currentImageIndex === index ? 'bg-white' : 'bg-white bg-opacity-50 hover:bg-opacity-75'}`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-56 bg-gray-200 flex flex-col items-center justify-center text-gray-500">
            <ImageIcon className="w-12 h-12 mb-2" />
            <span className="text-sm font-medium">No Image Available</span>
          </div>
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
          <div className="flex items-center space-x-2">
            <a 
                href="https://wa.me/918897072640" 
                target="_blank" 
                rel="noopener noreferrer" 
                onClick={(e) => e.stopPropagation()}
                className="p-2 rounded-full bg-green-500 text-white hover:bg-green-600 transition-all duration-300 shadow-sm hover:shadow-md"
                aria-label="Contact on WhatsApp"
            >
                <WhatsAppIcon className="w-5 h-5" />
            </a>
            <button
              onClick={() => onBookNow(car)}
              disabled={!car.available}
              className="px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-hover transition-all duration-300 shadow-sm hover:shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Book Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(CarCard);
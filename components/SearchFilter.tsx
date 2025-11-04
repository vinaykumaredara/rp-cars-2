import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { FuelType } from '../types';

interface SearchFilterProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  seatFilter: number | 'all';
  setSeatFilter: (seats: number | 'all') => void;
  fuelFilter: FuelType[];
  setFuelFilter: (fuel: FuelType[]) => void;
  onSearch: () => void;
  pickupDate: string;
  setPickupDate: (date: string) => void;
  returnDate: string;
  setReturnDate: (date: string) => void;
}

const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);


const SearchFilter: React.FC<SearchFilterProps> = ({ 
  searchTerm, setSearchTerm, seatFilter, setSeatFilter, fuelFilter, setFuelFilter,
  onSearch, pickupDate, setPickupDate, returnDate, setReturnDate
}) => {
  const [isSeatsOpen, setIsSeatsOpen] = useState(false);
  const [isFuelOpen, setIsFuelOpen] = useState(false);
  const seatsRef = useRef<HTMLDivElement>(null);
  const fuelRef = useRef<HTMLDivElement>(null);

  const availableFuelTypes: FuelType[] = ['Petrol', 'Diesel', 'Electric', 'Hybrid'];

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (seatsRef.current && !seatsRef.current.contains(event.target as Node)) {
        setIsSeatsOpen(false);
      }
      if (fuelRef.current && !fuelRef.current.contains(event.target as Node)) {
        setIsFuelOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSeatSelect = (value: number | 'all') => {
    setSeatFilter(value);
    setIsSeatsOpen(false);
  };
  
  const handleFuelToggle = (fuelType: FuelType) => {
    const newSelection = [...fuelFilter];
    const index = newSelection.indexOf(fuelType);

    if (index > -1) {
      newSelection.splice(index, 1);
    } else {
      newSelection.push(fuelType);
    }
    setFuelFilter(newSelection);
  };

  const getFuelButtonText = () => {
    if (fuelFilter.length === 0 || fuelFilter.length === availableFuelTypes.length) {
      return 'All Fuel Types';
    }
    if (fuelFilter.length > 2) {
      return `${fuelFilter.length} types selected`;
    }
    return fuelFilter.join(', ');
  };
  
  return (
    <div className="bg-white py-6 shadow-sm -mt-12 relative z-10 mx-4 md:mx-auto max-w-6xl rounded-lg">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:flex lg:flex-wrap gap-4 items-end">
          {/* Search Term */}
          <div className="md:col-span-2 lg:flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Search Cars</label>
            <input
              type="text" id="search" placeholder="e.g., Swift LXI, 2025"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition duration-150 ease-in-out"
            />
          </div>
          {/* Pickup Date */}
          <div className="lg:flex-initial">
            <label htmlFor="pickupDate" className="block text-sm font-medium text-gray-700 mb-1">Pickup Date</label>
            <input
              type="date" id="pickupDate" value={pickupDate} min={today}
              onChange={(e) => setPickupDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition"
            />
          </div>
          {/* Return Date */}
          <div className="lg:flex-initial">
            <label htmlFor="returnDate" className="block text-sm font-medium text-gray-700 mb-1">Return Date</label>
            <input
              type="date" id="returnDate" value={returnDate} min={pickupDate || today}
              onChange={(e) => setReturnDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition"
            />
          </div>
          {/* Seats Dropdown */}
          <div ref={seatsRef} className="relative lg:flex-initial">
            <label id="seats-label" className="block text-sm font-medium text-gray-700 mb-1">Seats</label>
            <button
              type="button" aria-haspopup="listbox" aria-expanded={isSeatsOpen} aria-labelledby="seats-label"
              onClick={() => setIsSeatsOpen(!isSeatsOpen)}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-left flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
            >
              <span>{seatFilter === 'all' ? 'All Seats' : `${seatFilter} Seats`}</span>
              <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${isSeatsOpen ? 'rotate-180' : ''}`} />
            </button>
            {isSeatsOpen && (
              <div className="absolute z-20 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200">
                <ul role="listbox" aria-labelledby="seats-label" className="py-1">
                  <li role="option" aria-selected={seatFilter === 'all'} onClick={() => handleSeatSelect('all')} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">All Seats</li>
                  <li role="option" aria-selected={seatFilter === 5} onClick={() => handleSeatSelect(5)} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">5 Seats</li>
                  <li role="option" aria-selected={seatFilter === 7} onClick={() => handleSeatSelect(7)} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">7 Seats</li>
                </ul>
              </div>
            )}
          </div>
          {/* Fuel Dropdown */}
          <div ref={fuelRef} className="relative lg:flex-initial">
            <label id="fuel-label" className="block text-sm font-medium text-gray-700 mb-1">Fuel Type</label>
            <button
              type="button" aria-haspopup="listbox" aria-expanded={isFuelOpen} aria-labelledby="fuel-label"
              onClick={() => setIsFuelOpen(!isFuelOpen)}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-left flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
            >
              <span className="truncate pr-2">{getFuelButtonText()}</span>
              <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${isFuelOpen ? 'rotate-180' : ''}`} />
            </button>
            {isFuelOpen && (
              <div className="absolute z-20 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200">
                <ul role="listbox" aria-labelledby="fuel-label" aria-multiselectable="true" className="py-1">
                  {availableFuelTypes.map(fuel => (
                    <li key={fuel} role="option" aria-selected={fuelFilter.includes(fuel)} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                       <label className="flex items-center w-full cursor-pointer">
                         <input type="checkbox" checked={fuelFilter.includes(fuel)} onChange={() => handleFuelToggle(fuel)} className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded cursor-pointer" />
                         <span className="ml-3">{fuel}</span>
                       </label>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          {/* Search Button */}
          <div className="md:col-span-2 lg:w-auto lg:flex-initial">
             <button
                onClick={onSearch}
                className="w-full lg:w-auto px-6 py-3 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-hover transition-all"
              >
                Search
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(SearchFilter);
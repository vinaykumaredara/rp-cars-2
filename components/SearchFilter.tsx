import React from 'react';
import type { FuelType } from '../types';

interface SearchFilterProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  seatFilter: number | 'all';
  setSeatFilter: (seats: number | 'all') => void;
  fuelFilter: FuelType | 'all';
  setFuelFilter: (fuel: FuelType | 'all') => void;
}

const SearchFilter: React.FC<SearchFilterProps> = ({ 
  searchTerm, setSearchTerm, seatFilter, setSeatFilter, fuelFilter, setFuelFilter 
}) => {
  return (
    <div className="bg-white py-6 shadow-sm -mt-12 relative z-10 mx-4 md:mx-auto max-w-6xl rounded-lg">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="lg:col-span-2">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Search Cars</label>
            <input
              type="text"
              id="search"
              placeholder="e.g., Swift LXI, 2025"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition duration-150 ease-in-out"
            />
          </div>
          <div>
            <label htmlFor="seats" className="block text-sm font-medium text-gray-700 mb-1">Seats</label>
            <select
              id="seats"
              value={seatFilter}
              onChange={(e) => setSeatFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition duration-150 ease-in-out bg-white"
            >
              <option value="all">All Seats</option>
              <option value="5">5 Seats</option>
              <option value="7">7 Seats</option>
            </select>
          </div>
          <div>
            <label htmlFor="fuel" className="block text-sm font-medium text-gray-700 mb-1">Fuel Type</label>
            <select
              id="fuel"
              value={fuelFilter}
              onChange={(e) => setFuelFilter(e.target.value as FuelType | 'all')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition duration-150 ease-in-out bg-white"
            >
              <option value="all">All Fuel Types</option>
              <option value="Petrol">Petrol</option>
              <option value="Diesel">Diesel</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchFilter;
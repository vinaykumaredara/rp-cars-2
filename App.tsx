
import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import SearchFilter from './components/SearchFilter';
import CarCard from './components/CarCard';
import FeatureHighlights from './components/FeatureHighlights';
import Statistics from './components/Statistics';
import Testimonials from './components/Testimonials';
import CTA from './components/CTA';
import Footer from './components/Footer';
import Modal from './components/Modal';
import { CARS_DATA } from './constants';
import type { Car, FuelType } from './types';

const App: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [seatFilter, setSeatFilter] = useState<number | 'all'>('all');
  const [fuelFilter, setFuelFilter] = useState<FuelType | 'all'>('all');

  const filteredCars = useMemo(() => {
    return CARS_DATA.filter(car => {
      const matchesSearch = car.model.toLowerCase().includes(searchTerm.toLowerCase()) || car.year.toString().includes(searchTerm);
      const matchesSeats = seatFilter === 'all' || car.seats === seatFilter;
      const matchesFuel = fuelFilter === 'all' || car.fuelType === fuelFilter;
      return matchesSearch && matchesSeats && matchesFuel;
    });
  }, [searchTerm, seatFilter, fuelFilter]);

  return (
    <div className="bg-neutral-lightgrey min-h-screen font-sans text-neutral-charcoal">
      <Header onSignInClick={() => setIsModalOpen(true)} />
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
        
        <section id="cars" className="py-16 lg:py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCars.map(car => (
                <CarCard key={car.id} car={car} />
              ))}
            </div>
          </div>
        </section>

        <FeatureHighlights />
        <Statistics />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default App;

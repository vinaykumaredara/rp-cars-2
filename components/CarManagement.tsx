import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { fetchCarsFromDB, deleteCar } from '../lib/carService';
import type { Car } from '../types';
import CarFormModal from './CarFormModal';
import ConfirmationModal from './ConfirmationModal';
import AdminPageLayout from './AdminPageLayout';
import { useToast } from '../contexts/ToastContext';

const CarManagement: React.FC = () => {
  const [cars, setCars] = useState<Car[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [carToDelete, setCarToDelete] = useState<Car | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { addToast } = useToast();

  const refreshCars = useCallback(async () => {
    setIsLoading(true);
    const { cars, error } = await fetchCarsFromDB();
    setCars(cars);
    setError(error);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refreshCars();

    const channel = supabase
      .channel('car-management-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cars' },
        () => {
          refreshCars();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshCars]);
  
  const handleAddNewCar = () => {
    setSelectedCar(null);
    setIsModalOpen(true);
  };

  const handleEditCar = (car: Car) => {
    setSelectedCar(car);
    setIsModalOpen(true);
  };

  const handleDeleteCar = (car: Car) => {
    setCarToDelete(car);
    setIsConfirmModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!carToDelete) return;
    setIsProcessing(true);
    
    const { error } = await deleteCar(carToDelete);
    if (error) {
      addToast(error, 'error');
    } else {
      addToast('Car deleted successfully!', 'success');
    }
    
    setIsProcessing(false);
    setIsConfirmModalOpen(false);
    setCarToDelete(null);
  };
  
  const handleSave = () => {
    setIsModalOpen(false);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCar(null);
  };

  return (
    <>
      <AdminPageLayout
        title="Car Management"
        subtitle="Add, edit, and manage your car inventory."
        headerAction={
          <button
              onClick={handleAddNewCar}
              disabled={isProcessing}
              className="px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-hover transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
              + Add New Car
          </button>
        }
      >
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            {isLoading ? (
                <p className="text-center text-gray-600">Loading cars...</p>
            ) : error ? (
                <p className="text-center text-red-600 bg-red-100 p-4 rounded-md">{error}</p>
            ) : cars.length === 0 ? (
                <p className="text-center text-gray-600">No cars found. Click "Add New Car" to get started.</p>
            ) : (
                <div className="space-y-4">
                    {cars.map(car => (
                        <div key={car.id} className="p-4 border rounded-lg flex flex-col md:flex-row items-start gap-4">
                            <div className="w-full md:w-1/3">
                                <h3 className="text-lg font-bold">{car.title} ({car.year})</h3>
                                <p className="text-sm text-gray-500">Price: ₹{car.pricePerDay}/day</p>
                                <div className="mt-4 flex items-center space-x-4">
                                    <button
                                        onClick={() => handleEditCar(car)}
                                        disabled={isProcessing}
                                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition disabled:bg-gray-200 disabled:cursor-not-allowed"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeleteCar(car)}
                                        disabled={isProcessing}
                                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition disabled:bg-gray-200 disabled:cursor-not-allowed"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                            <div className="w-full md:w-2/3">
                                <h4 className="text-sm font-semibold mb-2">Images ({car.images.length})</h4>
                                {car.images.length > 0 ? (
                                    <div className="flex overflow-x-auto space-x-2 pb-2">
                                        {car.images.map((imgSrc, index) => (
                                            <img key={index} src={imgSrc} alt={`${car.title} ${index + 1}`} className="w-32 h-20 object-cover rounded-md flex-shrink-0" />
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400">No images uploaded.</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </AdminPageLayout>
      
      {isModalOpen && (
        <CarFormModal 
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            onSave={handleSave}
            car={selectedCar}
        />
      )}

      {carToDelete && (
        <ConfirmationModal 
            isOpen={isConfirmModalOpen}
            onClose={() => setIsConfirmModalOpen(false)}
            onConfirm={confirmDelete}
            title="Confirm Deletion"
            message={
              <>
                <p>Are you sure you want to permanently delete the car:</p>
                <p className="font-semibold text-foreground mt-2">"{carToDelete.title}"?</p>
                <p className="mt-2 text-xs text-gray-500">This action includes deleting all associated images and cannot be undone.</p>
              </>
            }
            confirmText="Delete Car"
            isConfirming={isProcessing}
        />
      )}
    </>
  );
};

export default CarManagement;
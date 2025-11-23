import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { fetchCarsFromDB, deleteCar, updateCarAvailability, getCarImageUrl } from '../lib/carService';
import type { Car } from '../types';
import CarFormModal from './CarFormModal';
import ConfirmationModal from './ConfirmationModal';
import AdminPageLayout from './AdminPageLayout';
import { useToast } from '../contexts/ToastContext';
import ToggleSwitch from './common/ToggleSwitch';

const CarManagement: React.FC = () => {
  const [cars, setCars] = useState<Car[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [carToDelete, setCarToDelete] = useState<Car | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingToggleId, setProcessingToggleId] = useState<string | null>(null);
  const { addToast } = useToast();

  const refreshCars = useCallback(async () => {
    setIsLoading(true);
    const { cars, error } = await fetchCarsFromDB({ adminView: true });
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
  
  const handleToggleAvailability = async (car: Car) => {
    setProcessingToggleId(car.id);
    const newAvailability = !car.available;
    const { error } = await updateCarAvailability(car.id, newAvailability);

    if (error) {
      addToast(`Failed to update status: ${error}`, 'error');
    } else {
      addToast(`Car is now ${newAvailability ? 'available' : 'unavailable'} for booking`, 'success');
      // Update local state for immediate feedback
      setCars(prevCars =>
        prevCars.map(c =>
          c.id === car.id ? { ...c, available: newAvailability } : c
        )
      );
    }
    setProcessingToggleId(null);
  };

  const handleSave = () => {
    setIsModalOpen(false);
    // Explicitly refresh the car list to ensure UI is updated instantly,
    // rather than waiting for the real-time subscription which can have a delay.
    refreshCars();
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
                                <div className="text-sm text-gray-600 mt-1 space-y-0.5">
                                    <p><span className="font-semibold">Price:</span> ₹{car.pricePerDay}/day</p>
                                    <p><span className="font-semibold">Details:</span> {car.seats} Seats, {car.fuelType}, {car.transmission}</p>
                                    <p><span className="font-semibold">Status:</span> 
                                        <span className={`capitalize font-medium ml-1 ${car.status === 'published' ? 'text-green-700' : 'text-yellow-700'}`}>
                                            {car.status}
                                        </span>
                                    </p>
                                </div>
                                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
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
                                    <div className="flex items-center space-x-2">
                                        <ToggleSwitch
                                            checked={car.available}
                                            onChange={() => handleToggleAvailability(car)}
                                            disabled={isProcessing || processingToggleId === car.id}
                                        />
                                        <span className={`text-sm font-medium ${car.available ? 'text-green-600' : 'text-gray-500'}`}>
                                            {processingToggleId === car.id ? 'Updating...' : (car.available ? 'Available for booking' : 'Unavailable')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="w-full md:w-2/3">
                                <h4 className="text-sm font-semibold mb-2">Images ({car.imagePaths.length})</h4>
                                {car.imagePaths.length > 0 ? (
                                    <div className="flex overflow-x-auto space-x-2 pb-2">
                                        {car.imagePaths.map((path) => {
                                            const thumbnailUrl = getCarImageUrl(path, { width: 128, height: 80, resize: 'cover', quality: 70 });
                                            return (
                                                <img 
                                                    key={path} 
                                                    src={thumbnailUrl} 
                                                    alt={`${car.title} thumbnail`} 
                                                    className="w-32 h-20 object-cover rounded-md flex-shrink-0 bg-gray-200"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.onerror = null; // Prevent infinite loop if placeholder fails
                                                        // Use a simple, inline SVG placeholder to avoid another network request and ensure stability.
                                                        target.src = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 128 80'%3E%3Crect width='128' height='80' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' fill='%239ca3af' font-family='sans-serif' font-size='10' text-anchor='middle' dominant-baseline='middle'%3EError%3C/text%3E%3C/svg%3E";
                                                    }}
                                                />
                                            );
                                        })}
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

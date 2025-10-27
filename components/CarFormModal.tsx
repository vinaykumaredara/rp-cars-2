

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Car, FuelType, GearType } from '../types';

interface CarFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  car: Car | null;
}

type ImageState = {
    type: 'existing';
    path: string;
    url: string;
} | {
    type: 'new';
    file: File;
    url: string; // Object URL
};


const CarFormModal: React.FC<CarFormModalProps> = ({ isOpen, onClose, onSave, car }) => {
  const [formData, setFormData] = useState({
    title: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    seats: 5,
    fuelType: 'Petrol' as FuelType,
    transmission: 'Manual' as GearType,
    pricePerDay: 1000,
    verified: false,
    status: 'draft' as 'active' | 'published' | 'draft' | 'maintenance',
    booking_status: 'available' as 'available' | 'booked',
  });

  const [images, setImages] = useState<ImageState[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = car !== null;

  const resetState = useCallback(() => {
    setFormData({
      title: car?.title || '',
      make: car?.make || '',
      model: car?.model || '',
      year: car?.year || new Date().getFullYear(),
      seats: car?.seats || 5,
      fuelType: car?.fuelType || 'Petrol',
      transmission: car?.transmission || 'Manual',
      pricePerDay: car?.pricePerDay || 1000,
      verified: car?.verified || false,
      status: car?.status || 'draft',
      booking_status: car?.booking_status || 'available',
    });
    
    const initialImages: ImageState[] = (car?.imagePaths || []).map((path, i) => ({
        // FIX: Explicitly cast 'type' to the literal 'existing' to prevent TypeScript
        // from widening it to 'string', which would cause a type mismatch with ImageState.
        type: 'existing' as 'existing',
        path: path,
        url: car?.images[i] || '',
    })).filter(img => img.url); // Ensure we have a URL
    setImages(initialImages);

    setError(null);
    setLoading(false);
  }, [car]);

  useEffect(() => {
    if (isOpen) {
      resetState();
    } else {
      // Cleanup object URLs when modal is closed
      images.forEach(img => {
        if (img.type === 'new') {
          URL.revokeObjectURL(img.url);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, resetState]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
        setFormData(prev => ({
            ...prev,
            [name]: (name === 'year' || name === 'seats' || name === 'pricePerDay') ? parseInt(value, 10) || 0 : value,
        }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      // Fix: Explicitly type `file` as `File` to resolve type inference issues.
      // This was causing `file` to be treated as `unknown` or `{}`, leading to type errors.
      const newImageStates: ImageState[] = files.map((file: File) => ({
        type: 'new',
        file: file,
        url: URL.createObjectURL(file)
      }));
      setImages(prev => [...prev, ...newImageStates]);
    }
  };
  
  const removeImage = (index: number) => {
    const imageToRemove = images[index];
    if (imageToRemove.type === 'new') {
        URL.revokeObjectURL(imageToRemove.url);
    }
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Determine which images to delete from storage
      const initialPaths = car?.imagePaths || [];
      const finalExistingPaths = images
        .filter((img): img is Extract<ImageState, { type: 'existing' }> => img.type === 'existing')
        .map(img => img.path);
      const pathsToDelete = initialPaths.filter(path => !finalExistingPaths.includes(path));

      if (pathsToDelete.length > 0) {
        const { error: deleteError } = await supabase.storage.from('cars-photos').remove(pathsToDelete);
        if (deleteError) throw new Error(`Failed to delete images: ${deleteError.message}`);
      }

      // 2. Upload new images to storage
      const newFilesToUpload = images.filter((img): img is Extract<ImageState, { type: 'new' }> => img.type === 'new');
      const uploadedImagePaths: string[] = [];
      for (const img of newFilesToUpload) {
        const fileName = `${crypto.randomUUID()}-${img.file.name}`;
        const { data, error: uploadError } = await supabase.storage
          .from('cars-photos')
          .upload(fileName, img.file);

        if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);
        if (data) uploadedImagePaths.push(data.path);
      }

      // 3. Prepare final list of image paths for the DB
      const finalImagePaths = [...finalExistingPaths, ...uploadedImagePaths];
      
      // 4. Prepare data for DB insert/update (snake_case)
      const carData = {
        title: formData.title,
        make: formData.make,
        model: formData.model,
        year: formData.year,
        seats: formData.seats,
        fuel_type: formData.fuelType,
        transmission: formData.transmission,
        price_per_day: formData.pricePerDay,
        image_paths: finalImagePaths,
        verified: formData.verified,
        status: formData.status,
        booking_status: formData.booking_status,
      };

      // 5. Upsert data into the database
      if (isEditMode) {
        const { error: updateError } = await supabase.from('cars').update(carData).eq('id', car.id);
        if (updateError) throw new Error(`Failed to update car: ${updateError.message}`);
      } else {
        const { error: insertError } = await supabase.from('cars').insert([carData]);
        if (insertError) throw new Error(`Failed to add car: ${insertError.message}`);
      }

      onSave();
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-lg shadow-2xl w-full max-w-2xl mx-auto max-h-[90vh] flex flex-col" 
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-foreground">{isEditMode ? 'Edit Car' : 'Add New Car'}</h2>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-3xl leading-none">&times;</button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto">
          <div className="p-6 space-y-4">
            {error && <p className="bg-red-100 text-red-700 p-3 rounded-md text-sm">{error}</p>}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input type="text" name="title" id="title" value={formData.title} onChange={handleChange} required className="w-full p-2 border rounded border-gray-300 focus:ring-primary focus:border-primary" />
                </div>
                <div>
                    <label htmlFor="make" className="block text-sm font-medium text-gray-700 mb-1">Make</label>
                    <input type="text" name="make" id="make" value={formData.make} onChange={handleChange} required className="w-full p-2 border rounded border-gray-300 focus:ring-primary focus:border-primary" />
                </div>
                <div>
                    <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                    <input type="text" name="model" id="model" value={formData.model} onChange={handleChange} required className="w-full p-2 border rounded border-gray-300 focus:ring-primary focus:border-primary" />
                </div>
                <div>
                    <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                    <input type="number" name="year" id="year" value={formData.year} onChange={handleChange} required className="w-full p-2 border rounded border-gray-300 focus:ring-primary focus:border-primary" />
                </div>
                <div>
                    <label htmlFor="seats" className="block text-sm font-medium text-gray-700 mb-1">Seats</label>
                    <input type="number" name="seats" id="seats" value={formData.seats} onChange={handleChange} required className="w-full p-2 border rounded border-gray-300 focus:ring-primary focus:border-primary" />
                </div>
                <div>
                    <label htmlFor="pricePerDay" className="block text-sm font-medium text-gray-700 mb-1">Price per Day (₹)</label>
                    <input type="number" name="pricePerDay" id="pricePerDay" value={formData.pricePerDay} onChange={handleChange} required className="w-full p-2 border rounded border-gray-300 focus:ring-primary focus:border-primary" />
                </div>
                <div>
                    <label htmlFor="fuelType" className="block text-sm font-medium text-gray-700 mb-1">Fuel Type</label>
                    <select name="fuelType" id="fuelType" value={formData.fuelType} onChange={handleChange} className="w-full p-2 border rounded bg-white border-gray-300 focus:ring-primary focus:border-primary">
                        <option value="Petrol">Petrol</option>
                        <option value="Diesel">Diesel</option>
                        <option value="Electric">Electric</option>
                        <option value="Hybrid">Hybrid</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="transmission" className="block text-sm font-medium text-gray-700 mb-1">Gear Type</label>
                    <select name="transmission" id="transmission" value={formData.transmission} onChange={handleChange} className="w-full p-2 border rounded bg-white border-gray-300 focus:ring-primary focus:border-primary">
                        <option value="Manual">Manual</option>
                        <option value="Automatic">Automatic</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select name="status" id="status" value={formData.status} onChange={handleChange} className="w-full p-2 border rounded bg-white border-gray-300 focus:ring-primary focus:border-primary">
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="active">Active</option>
                        <option value="maintenance">Maintenance</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="booking_status" className="block text-sm font-medium text-gray-700 mb-1">Booking Status</label>
                    <select name="booking_status" id="booking_status" value={formData.booking_status} onChange={handleChange} className="w-full p-2 border rounded bg-white border-gray-300 focus:ring-primary focus:border-primary">
                        <option value="available">Available</option>
                        <option value="booked">Booked</option>
                    </select>
                </div>
            </div>

            <div className="flex items-center pt-2">
                <input type="checkbox" name="verified" id="verified" checked={formData.verified} onChange={handleChange} className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" />
                <label htmlFor="verified" className="ml-2 block text-sm text-gray-900">Verified Listing</label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Images</label>
              <div className="mt-2 flex flex-wrap gap-4">
                {images.map((img, index) => (
                  <div key={img.url} className="relative">
                    <img src={img.url} alt={`Preview ${index}`} className="w-32 h-20 object-cover rounded-md" />
                    <button type="button" onClick={() => removeImage(index)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold leading-none shadow-md">&times;</button>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <label htmlFor="image-upload" className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                    <svg className="w-5 h-5 mr-2 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd"></path></svg>
                    Upload Images
                </label>
                <input type="file" id="image-upload" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
              </div>
            </div>
          </div>
          
          <div className="p-6 sticky bottom-0 bg-white border-t z-10 flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100 transition">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 rounded bg-primary text-white hover:bg-primary-hover transition disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CarFormModal;
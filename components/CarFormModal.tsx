import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Car, FuelType, GearType } from '../types';

interface CarFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  car: Car | null; // null for 'add', car object for 'edit'
}

type CarFormData = Omit<Car, 'id' | 'images' | 'imagePaths'>;

const CarFormModal: React.FC<CarFormModalProps> = ({ isOpen, onClose, onSave, car }) => {
  const isEditMode = car !== null;
  
  // Fix: Added title and make to initial form state to match CarFormData type.
  const initialFormState: CarFormData = {
    title: '',
    make: '',
    model: '', year: new Date().getFullYear(), seats: 5,
    fuelType: 'Petrol', gearType: 'Manual', pricePerDay: 0,
    available: true, verified: false,
  };
  
  const [formData, setFormData] = useState<CarFormData>(initialFormState);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<{ url: string, path: string }[]>([]);
  const [imagesToRemove, setImagesToRemove] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEditMode && car) {
      // Fix: Added title and make when setting form data in edit mode.
      setFormData({
        title: car.title,
        make: car.make,
        model: car.model, year: car.year, seats: car.seats,
        fuelType: car.fuelType, gearType: car.gearType, pricePerDay: car.pricePerDay,
        available: car.available, verified: car.verified,
      });
      // Assuming car.images contains full URLs and car.imagePaths contains storage paths
      const mappedImages = car.images.map((url, index) => ({ url, path: car.imagePaths?.[index] ?? '' })).filter(img => img.path);
      setExistingImages(mappedImages);
    } else {
      setFormData(initialFormState);
      setExistingImages([]);
    }
    // Reset other states when modal opens/car changes
    setImageFiles([]);
    setImagesToRemove([]);
    setError(null);
  }, [car, isEditMode, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) : value }));
    }
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImageFiles(Array.from(e.target.files));
    }
  };

  const removeExistingImage = (path: string) => {
    setImagesToRemove(prev => [...prev, path]);
    setExistingImages(prev => prev.filter(img => img.path !== path));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
        // 1. Handle images to remove from storage
        if (imagesToRemove.length > 0) {
            const { error: removeError } = await supabase.storage.from('cars-photos').remove(imagesToRemove);
            if (removeError) throw new Error(`Failed to remove images: ${removeError.message}`);
        }
        
        // 2. Handle new image uploads
        const uploadedImagePaths: string[] = [];
        for (const file of imageFiles) {
            // Fix: Changed path from 'public/' to 'cars/' to match bucket structure
            const filePath = `cars/${Date.now()}-${file.name}`;
            const { error: uploadError } = await supabase.storage
                .from('cars-photos')
                .upload(filePath, file);
            if (uploadError) throw new Error(`Failed to upload image ${file.name}: ${uploadError.message}`);
            uploadedImagePaths.push(filePath);
        }

        // 3. Prepare data for DB
        const finalImagePaths = [
            ...existingImages.map(img => img.path),
            ...uploadedImagePaths
        ];

        // Fix: Added title and make to the data sent to the database.
        const dbData = {
            title: formData.title,
            make: formData.make,
            model: formData.model,
            year: formData.year,
            seats: formData.seats,
            fuel_type: formData.fuelType,
            gear_type: formData.gearType,
            price_per_day: formData.pricePerDay,
            available: formData.available,
            verified: formData.verified,
            // Fix: Save to `image_paths` column instead of `images`
            image_paths: finalImagePaths,
        };

        // 4. Upsert data to DB
        let response;
        if (isEditMode && car) {
            response = await supabase.from('cars').update(dbData).eq('id', car.id);
        } else {
            response = await supabase.from('cars').insert(dbData);
        }
        
        if (response.error) throw new Error(`Database operation failed: ${response.error.message}`);
        
        onSave();
    } catch (err: any) {
        let friendlyMessage = err.message || 'An unexpected error occurred.';
        if (typeof friendlyMessage === 'string' && friendlyMessage.toLowerCase().includes('bucket not found')) {
            friendlyMessage = "Configuration Error: The 'cars-photos' storage bucket was not found. Please go to your Supabase dashboard, navigate to Storage, and create a new public bucket named 'cars-photos'.";
        }
        setError(friendlyMessage);
        console.error(err);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl mx-auto p-8 transform transition-all duration-300 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-neutral-charcoal">{isEditMode ? 'Edit Car' : 'Add New Car'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
        </div>
        
        {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-sm">{error}</p>}
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Form Fields */}
            {/* Fix: Added inputs for title and make, and updated model placeholder. */}
            <input name="title" value={formData.title} onChange={handleChange} placeholder="Title (e.g., Maruti Swift LXI)" required className="p-2 border rounded" />
            <input name="make" value={formData.make} onChange={handleChange} placeholder="Make (e.g., Maruti)" required className="p-2 border rounded" />
            <input name="model" value={formData.model} onChange={handleChange} placeholder="Model (e.g., Swift)" required className="p-2 border rounded" />
            <input name="year" type="number" value={formData.year} onChange={handleChange} placeholder="Year" required className="p-2 border rounded" />
            <input name="pricePerDay" type="number" value={formData.pricePerDay} onChange={handleChange} placeholder="Price per Day" required className="p-2 border rounded" />
            <select name="seats" value={formData.seats} onChange={handleChange} className="p-2 border rounded bg-white">
              <option value="5">5 Seats</option>
              <option value="7">7 Seats</option>
            </select>
            <select name="fuelType" value={formData.fuelType} onChange={handleChange} className="p-2 border rounded bg-white">
              <option value="Petrol">Petrol</option>
              <option value="Diesel">Diesel</option>
            </select>
             <select name="gearType" value={formData.gearType} onChange={handleChange} className="p-2 border rounded bg-white">
              <option value="Manual">Manual</option>
              <option value="Automatic">Automatic</option>
            </select>
            <div className="md:col-span-2 grid grid-cols-2 gap-4">
              <label className="flex items-center space-x-2"><input type="checkbox" name="available" checked={formData.available} onChange={handleChange} /><span>Available</span></label>
              <label className="flex items-center space-x-2"><input type="checkbox" name="verified" checked={formData.verified} onChange={handleChange} /><span>Verified</span></label>
            </div>
          </div>
          
          {/* Image Management */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Images</label>
            {existingImages.length > 0 && (
                <div className="mb-2 p-2 border rounded">
                    <p className="text-xs font-semibold mb-1">Existing Images:</p>
                    <div className="flex flex-wrap gap-2">
                        {existingImages.map(({ url, path }) => (
                            <div key={path} className="relative">
                                <img src={url} className="w-20 h-20 object-cover rounded" />
                                <button type="button" onClick={() => removeExistingImage(path)} className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 text-xs">&times;</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <input type="file" multiple onChange={handleImageChange} className="w-full text-sm" />
          </div>

          <div className="flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded border hover:bg-gray-100">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 rounded bg-primary-blue text-white hover:bg-blue-700 disabled:bg-blue-300">
              {loading ? 'Processing...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CarFormModal;
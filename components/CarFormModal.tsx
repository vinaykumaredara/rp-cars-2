import React, { useState, useEffect, useCallback } from 'react';
import { upsertCar, getCarImageUrl } from '../lib/carService';
import type { Car, FuelType, GearType, ImageState, CarFormData } from '../types';
import { useToast } from '../contexts/ToastContext';

interface CarFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  car: Car | null;
}

const CarFormModal: React.FC<CarFormModalProps> = ({ isOpen, onClose, onSave, car }) => {
  const [formData, setFormData] = useState<CarFormData>({
    title: '', make: '', model: '', year: new Date().getFullYear(),
    seats: 5, fuelType: 'Petrol', transmission: 'Manual', pricePerDay: 1000,
    verified: true, status: 'published',
  });

  const [images, setImages] = useState<ImageState[]>([]);
  const [selectedPreviewIndex, setSelectedPreviewIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const isEditMode = car !== null;

  const resetState = useCallback(async () => {
    setLoading(true);
    setFormData({
      title: car?.title || '',
      make: car?.make || '',
      model: car?.model || '',
      year: car?.year || new Date().getFullYear(),
      seats: car?.seats || 5,
      fuelType: car?.fuelType || 'Petrol',
      transmission: car?.transmission || 'Manual',
      pricePerDay: car?.pricePerDay || 1000,
      verified: true, // Always true
      status: car?.status || 'published',
    });
    
    const imagePaths = car?.imagePaths || [];
    if (imagePaths.length > 0) {
        const imageStates: ImageState[] = imagePaths.map(path => ({
            type: 'existing' as const,
            path: path,
            url: getCarImageUrl(path)
        }));
        setImages(imageStates.filter(img => img.url));
    } else {
        setImages([]);
    }
    setLoading(false);
  }, [car]);

  useEffect(() => {
    if (isOpen) {
      resetState();
      setSelectedPreviewIndex(0);
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
    const { name, value } = e.target;
    
    setFormData(prev => ({
        ...prev,
        [name]: (name === 'year' || name === 'seats' || name === 'pricePerDay') ? parseInt(value, 10) || 0 : value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
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
    setImages(prev => {
        const newImages = prev.filter((_, i) => i !== index);
        // Adjust selected index if needed
        if (selectedPreviewIndex >= newImages.length) {
            setSelectedPreviewIndex(Math.max(0, newImages.length - 1));
        }
        return newImages;
    });
  };

  const setAsCover = (index: number) => {
    if (index === 0) return; // Already the cover
    setImages(prevImages => {
        const newImages = [...prevImages];
        const [itemToMove] = newImages.splice(index, 1);
        newImages.unshift(itemToMove);
        return newImages;
    });
    setSelectedPreviewIndex(0); // The new cover is now the selected preview
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await upsertCar(formData, images, car);

    if (result.error) {
      addToast(result.error, 'error');
      setLoading(false);
    } else {
      addToast(isEditMode ? 'Car updated successfully!' : 'Car added successfully!', 'success');
      onSave();
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
                    <select name="fuelType" id="fuelType" value={formData.fuelType} onChange={handleChange} className="w-full p-2 border rounded bg-white text-foreground border-gray-300 focus:ring-primary focus:border-primary">
                        <option value="Petrol">Petrol</option>
                        <option value="Diesel">Diesel</option>
                        <option value="Electric">Electric</option>
                        <option value="Hybrid">Hybrid</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="transmission" className="block text-sm font-medium text-gray-700 mb-1">Gear Type</label>
                    <select name="transmission" id="transmission" value={formData.transmission} onChange={handleChange} className="w-full p-2 border rounded bg-white text-foreground border-gray-300 focus:ring-primary focus:border-primary">
                        <option value="Manual">Manual</option>
                        <option value="Automatic">Automatic</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select name="status" id="status" value={formData.status} onChange={handleChange} className="w-full p-2 border rounded bg-white text-foreground border-gray-300 focus:ring-primary focus:border-primary">
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="active">Active</option>
                        <option value="maintenance">Maintenance</option>
                    </select>
                </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image Gallery</label>
              <div className="mt-2 p-4 border rounded-lg bg-gray-50">
                {/* Main Preview */}
                <div className="w-full h-64 bg-gray-200 rounded-md mb-4 flex items-center justify-center relative">
                  {images.length > 0 && images[selectedPreviewIndex] ? (
                    <img src={images[selectedPreviewIndex].url} alt="Main preview" className="w-full h-full object-contain rounded-md" />
                  ) : (
                    <div className="text-center text-gray-500">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      <p className="mt-2 text-sm">Upload images to see a preview</p>
                    </div>
                  )}
                </div>

                {/* Thumbnails */}
                {images.length > 0 && (
                  <div className="flex overflow-x-auto space-x-3 pb-2 -mx-2 px-2">
                    {images.map((img, index) => (
                      <div
                        key={img.url}
                        onClick={() => setSelectedPreviewIndex(index)}
                        className={`relative flex-shrink-0 w-24 h-16 rounded-md cursor-pointer border-2 ${selectedPreviewIndex === index ? 'border-primary' : 'border-transparent'} overflow-hidden group`}
                      >
                        <img src={img.url} alt={`Thumbnail ${index}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center space-x-2">
                          {index !== 0 && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setAsCover(index); }}
                              title="Set as cover image"
                              className="text-white opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-black bg-opacity-60 rounded-full hover:bg-opacity-80"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeImage(index); }}
                            title="Remove image"
                            className="text-white opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-red-600 bg-opacity-70 rounded-full hover:bg-opacity-90"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002 2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                          </button>
                        </div>
                        {index === 0 && (
                          <div className="absolute top-1 left-1 bg-yellow-400 text-black text-xs font-bold px-1.5 py-0.5 rounded-sm shadow">Cover</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-4">
                  <label htmlFor="image-upload" className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                      <svg className="w-5 h-5 mr-2 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd"></path></svg>
                      Upload Images
                  </label>
                  <input type="file" id="image-upload" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6 sticky bottom-0 bg-white border-t z-10 flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 transition">Cancel</button>
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

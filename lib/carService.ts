import { supabase } from './supabaseClient';
import type { Car, FuelType, CarFormData, ImageState } from '../types';

interface FetchCarsOptions {
  page?: number;
  limit?: number;
  searchTerm?: string;
  seatFilter?: number | 'all';
  fuelFilter?: FuelType[];
  startDate?: string;
  endDate?: string;
}

/**
 * Fetches cars from the database, with optional pagination and availability filtering.
 */
export const fetchCarsFromDB = async (options: FetchCarsOptions = {}): Promise<{ cars: Car[]; error: string | null; count: number | null }> => {
    try {
        const { page, limit, searchTerm, seatFilter, fuelFilter, startDate, endDate } = options;

        let availableCarIds: string[] | null = null;

        // If a date range is provided, first get the IDs of available cars.
        if (startDate && endDate) {
            const { data: carIdsData, error: availabilityError } = await supabase.rpc('get_available_cars', {
                start_ts: new Date(startDate).toISOString(),
                end_ts: new Date(endDate).toISOString(),
            });
            if (availabilityError) throw availabilityError;
            availableCarIds = carIdsData || [];
        }

        let query = supabase
            .from('cars')
            .select('*', { count: 'exact' }) // Use 'exact' for accurate pagination with filters
            .eq('status', 'published');
        
        if (searchTerm) {
          query = query.or(`title.ilike.%${searchTerm}%,make.ilike.%${searchTerm}%,model.ilike.%${searchTerm}%`);
        }
        if (seatFilter && seatFilter !== 'all') {
            query = query.eq('seats', seatFilter);
        }
        if (fuelFilter && fuelFilter.length > 0) {
            query = query.in('fuel_type', fuelFilter);
        }
        // If we have a list of available car IDs, filter the main query by them.
        if (availableCarIds !== null) {
            if (availableCarIds.length === 0) {
                // No cars are available, so we can return early.
                return { cars: [], error: null, count: 0 };
            }
            query = query.in('id', availableCarIds);
        }

        if (page && limit) {
            const from = (page - 1) * limit;
            const to = page * limit - 1;
            query = query.range(from, to);
        }
        
        const { data, error, count } = await query
            .order('year', { ascending: false })
            .order('title', { ascending: true });

        if (error) throw error;

        if (data) {
            const formattedData: Car[] = data.map(car => {
                const imagePaths = (Array.isArray(car.image_paths) ? car.image_paths : [])
                    .filter((path): path is string => typeof path === 'string' && path.trim() !== '');
                
                const imageUrls = imagePaths.map(path => {
                    const { data: { publicUrl } } = supabase.storage.from('cars-photos').getPublicUrl(path);
                    return publicUrl;
                });
                
                // If a date filter is applied, respect the car's static 'available' flag.
                // The list of cars has already been filtered for dynamic availability.
                // If no date filter is applied, show all published cars as available for browsing.
                const isDateFiltered = availableCarIds !== null;

                return {
                    id: car.id,
                    title: car.title || car.model,
                    make: car.make || 'N/A',
                    model: car.model,
                    year: car.year,
                    seats: car.seats,
                    fuelType: car.fuel_type,
                    transmission: car.transmission,
                    pricePerDay: car.price_per_day,
                    images: imageUrls,
                    imagePaths: imagePaths,
                    available: isDateFiltered ? car.available : true,
                    verified: car.verified,
                    status: car.status,
                };
            });
            return { cars: formattedData, error: null, count };
        }

        return { cars: [], error: 'No car data found.', count: 0 };
    } catch (err: any) {
        console.error('Error fetching cars:', err);
        const errorMessage = err.message || 'An unexpected error occurred while fetching car data.';
        return { cars: [], error: `Failed to fetch car data: ${errorMessage}`, count: 0 };
    }
};

/**
 * Updates a car's static availability status.
 */
export const updateCarAvailability = async (carId: string, available: boolean): Promise<{ error: string | null }> => {
    try {
        const { error } = await supabase
            .from('cars')
            .update({ available })
            .eq('id', carId);

        if (error) throw error;
        return { error: null };
    } catch (err: any) {
        console.error('Error updating car availability:', err);
        return { error: err.message || 'An unexpected error occurred.' };
    }
};


/**
 * Creates or updates a car, including handling image uploads and deletions.
 */
export const upsertCar = async (formData: CarFormData, images: ImageState[], existingCar: Car | null) => {
    try {
        const initialPaths = existingCar?.imagePaths || [];
        const finalExistingPaths = images
            .filter((img): img is Extract<ImageState, { type: 'existing' }> => img.type === 'existing')
            .map(img => img.path);
        
        const pathsToDelete = initialPaths.filter(path => !finalExistingPaths.includes(path));

        if (pathsToDelete.length > 0) {
            const { error: deleteError } = await supabase.storage.from('cars-photos').remove(pathsToDelete);
            if (deleteError) throw new Error(`Failed to delete old images: ${deleteError.message}`);
        }

        const newFilesToUpload = images.filter((img): img is Extract<ImageState, { type: 'new' }> => img.type === 'new');
        const uploadedImagePaths: string[] = [];
        for (const img of newFilesToUpload) {
            const fileName = `${crypto.randomUUID()}-${img.file.name}`;
            const { data, error: uploadError } = await supabase.storage.from('cars-photos').upload(fileName, img.file);
            if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);
            if (data) uploadedImagePaths.push(data.path);
        }

        const finalImagePaths = [...finalExistingPaths, ...uploadedImagePaths];
        const carDataForDB = {
            title: formData.title, make: formData.make, model: formData.model, year: formData.year,
            seats: formData.seats, fuel_type: formData.fuelType, transmission: formData.transmission,
            price_per_day: formData.pricePerDay, image_paths: finalImagePaths, verified: formData.verified,
            status: formData.status,
        };

        if (existingCar) {
            const { error: updateError } = await supabase.from('cars').update(carDataForDB).eq('id', existingCar.id);
            if (updateError) throw new Error(`Failed to update car: ${updateError.message}`);
        } else {
            const { error: insertError } = await supabase.from('cars').insert([carDataForDB]);
            if (insertError) throw new Error(`Failed to add new car: ${insertError.message}`);
        }
        return { error: null };
    } catch (err: any) {
        console.error('Upsert car error:', err);
        return { error: err.message || 'An unexpected error occurred.' };
    }
};

/**
 * Deletes a car and its associated images from storage.
 */
export const deleteCar = async (car: Car) => {
    try {
        if (car.imagePaths && car.imagePaths.length > 0) {
            const pathsToDelete = car.imagePaths.filter(p => typeof p === 'string' && p.trim() !== '');
            if (pathsToDelete.length > 0) {
                const { error: storageError } = await supabase.storage.from('cars-photos').remove(pathsToDelete);
                if (storageError) throw new Error(`Failed to delete car images: ${storageError.message}`);
            }
        }
        
        const { error: dbError } = await supabase.from('cars').delete().eq('id', car.id);
        if (dbError) throw new Error(`Failed to delete the car record: ${dbError.message}`);
        
        return { error: null };
    } catch (err: any) {
        console.error('Delete car error:', err);
        return { error: err.message || 'An unexpected error occurred during deletion.' };
    }
};
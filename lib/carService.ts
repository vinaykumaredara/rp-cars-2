import { supabase } from './supabaseClient';
import type { Car, FuelType, CarFormData, ImageState } from '../types';
import { parseError } from './errorUtils';

const CARS_PHOTOS_BUCKET = 'cars-photos';

/**
 * Defines the available image transformation options from Supabase Storage.
 * This interface is kept for potential future use but transformations are currently disabled.
 */
interface ImageTransformations {
    width?: number;
    height?: number;
    quality?: number;
    resize?: 'cover' | 'contain' | 'fill';
}

/**
 * Constructs a public URL for a car image, handling both relative paths and full URLs
 * to defensively support potentially inconsistent data. This is the single source of truth for all car image URLs.
 * IMPORTANT: Image transformations are currently disabled to ensure compatibility with all Supabase plans.
 * This function will always return the original, untransformed image URL.
 * @param path - The path to the image, which can be relative or a full URL.
 * @param transformations - Optional settings, currently ignored to ensure images always load.
 * @returns A fully-formed, publicly accessible URL for the image.
 */
export const getCarImageUrl = (path: string, transformations?: ImageTransformations): string => {
  if (!path) {
    // Return an empty string for invalid paths to be handled by the UI component's error state.
    return '';
  }

  // Defensive check: If the path is already a full URL, return it directly.
  if (path.startsWith('http')) {
    return path;
  }

  // Always return the original, untransformed image URL. This is a robust fix
  // to prevent broken image links on Supabase plans that may not have the
  // image transformation feature enabled.
  const { data } = supabase.storage
    .from(CARS_PHOTOS_BUCKET)
    .getPublicUrl(path);
    
  return data?.publicUrl || '';
};


interface FetchCarsOptions {
  page?: number;
  limit?: number;
  searchTerm?: string;
  seatFilter?: number | 'all';
  fuelFilter?: FuelType[];
  startDate?: string;
  endDate?: string;
  adminView?: boolean;
}

/**
 * Fetches cars from the database, with optional pagination and availability filtering.
 */
export const fetchCarsFromDB = async (options: FetchCarsOptions = {}): Promise<{ cars: Car[]; error: string | null; count: number | null }> => {
    try {
        const { page = 1, limit = 9, searchTerm, seatFilter, fuelFilter, startDate, endDate, adminView = false } = options;

        // Select specific columns without aliasing to ensure predictable data structure.
        let query = supabase
            .from('cars')
            .select(`
                id,
                title,
                make,
                model,
                year,
                seats,
                transmission,
                verified,
                status,
                available,
                fuel_type,
                price_per_day,
                image_paths
            `, { count: 'exact' });

        // For public view, only show cars with 'published' status. Availability is handled on the Car Card.
        if (!adminView) {
            query = query.eq('status', 'published');
        }

        // If a date range is provided, further filter by temporal availability (booking conflicts).
        if (startDate && endDate) {
            const { data: carIdsData, error: availabilityError } = await supabase.rpc('get_available_cars', {
                start_ts: new Date(startDate).toISOString(),
                end_ts: new Date(endDate).toISOString(),
            });

            if (availabilityError) throw availabilityError;

            const availableCarIds = carIdsData;
            // If the RPC returns an empty list, no cars are free for the period, so we can return early.
            if (!availableCarIds || availableCarIds.length === 0) {
                return { cars: [], error: null, count: 0 };
            }
            // Add the temporal availability filter to our main query.
            query = query.in('id', availableCarIds);
        }
        
        // Apply other search and filter criteria.
        if (searchTerm) {
            const formattedSearchTerm = searchTerm.trim().replace(/\s+/g, ' & ');
            query = query.textSearch('fts', formattedSearchTerm);
        }
        if (seatFilter && seatFilter !== 'all') {
            query = query.eq('seats', seatFilter);
        }
        if (fuelFilter && fuelFilter.length > 0) {
            query = query.in('fuel_type', fuelFilter);
        }

        // Apply pagination and ordering.
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        query = query.range(from, to).order('created_at', { ascending: false });
        
        const { data, error, count } = await query;
        if (error) throw error;
        
        // Manually map snake_case columns from the DB to camelCase properties for the application.
        const cars: Car[] = (data || []).map((dbCar: any) => ({
            id: dbCar.id,
            title: dbCar.title,
            make: dbCar.make,
            model: dbCar.model,
            year: dbCar.year,
            seats: dbCar.seats,
            fuelType: dbCar.fuel_type,
            transmission: dbCar.transmission,
            pricePerDay: dbCar.price_per_day,
            verified: dbCar.verified,
            status: dbCar.status,
            imagePaths: dbCar.image_paths || [],
            available: dbCar.available,
        }));

        return { cars, error: null, count };
    } catch (e: unknown) {
        console.error("Error fetching cars:", e); // Log the original error for debugging
        return { cars: [], error: parseError(e), count: 0 };
    }
};

/**
 * Deletes a car and its associated images from storage.
 */
export const deleteCar = async (car: Car): Promise<{ error: string | null }> => {
    try {
        // Delete images from storage first
        if (car.imagePaths && car.imagePaths.length > 0) {
            const { error: storageError } = await supabase.storage
                .from(CARS_PHOTOS_BUCKET)
                .remove(car.imagePaths);
            if (storageError) {
                // Log the error but proceed to delete the DB record anyway.
                console.warn(`Could not delete images for car ${car.id}:`, storageError.message);
            }
        }
        // Then delete the car record from the database
        const { error: dbError } = await supabase.from('cars').delete().eq('id', car.id);
        if (dbError) throw dbError;

        return { error: null };
    } catch (err: unknown) {
        return { error: parseError(err) };
    }
};

/**
 * Updates a car's 'available' status.
 */
export const updateCarAvailability = async (carId: string, available: boolean): Promise<{ error: string | null }> => {
    try {
        const { error } = await supabase.from('cars').update({ available }).eq('id', carId);
        if (error) throw error;
        return { error: null };
    } catch (err: unknown) {
        return { error: parseError(err) };
    }
};


/**
 * Creates or updates a car record and handles image uploads/deletions while preserving order.
 */
export const upsertCar = async (formData: CarFormData, images: ImageState[], existingCar: Car | null): Promise<{ car: Car | null; error: string | null }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // --- 1. Handle Image Deletions ---
    if (existingCar) {
      const existingImagePathsInForm = images
        .filter(img => img.type === 'existing')
        .map(img => (img as Extract<ImageState, { type: 'existing' }>).path);

      const imagesToDelete = existingCar.imagePaths.filter(
        path => !existingImagePathsInForm.includes(path)
      );
      
      if (imagesToDelete.length > 0) {
        await supabase.storage.from(CARS_PHOTOS_BUCKET).remove(imagesToDelete);
      }
    }
    
    // --- 2. Handle New Image Uploads ---
    const newImagesToUpload = images.filter(img => img.type === 'new') as Extract<ImageState, { type: 'new' }>[];
    
    const uploadPromises = newImagesToUpload.map(img => {
      const filePath = `${user.id}/${Date.now()}-${img.file.name}`;
      return supabase.storage.from(CARS_PHOTOS_BUCKET).upload(filePath, img.file)
        .then(({ data, error }) => {
          if (error) throw new Error(`Image upload for ${img.file.name} failed: ${error.message}`);
          // Return a mapping from the original file object to the new path
          return { file: img.file, path: data.path };
        });
    });

    const uploadedImageMappings = await Promise.all(uploadPromises);
    const filePathMap = new Map(uploadedImageMappings.map(item => [item.file, item.path]));

    // --- 3. Construct Final Ordered Image Path Array ---
    const finalImagePaths = images.map(img => {
      if (img.type === 'existing') {
        return img.path;
      }
      return filePathMap.get(img.file);
    }).filter((path): path is string => !!path); // Ensure no undefineds

    // --- 4. Upsert Car Data ---
    const carDataToSave = {
      id: existingCar?.id,
      title: formData.title,
      make: formData.make,
      model: formData.model,
      year: formData.year,
      seats: formData.seats,
      fuel_type: formData.fuelType,
      transmission: formData.transmission,
      price_per_day: formData.pricePerDay,
      verified: true, // All cars are now verified by default.
      status: formData.status,
      image_paths: finalImagePaths,
      // The 'updated_at' field is now managed by the database trigger
    };

    const { data, error } = await supabase.from('cars').upsert(carDataToSave).select().single();
    if (error) throw error;

    return { car: data as Car, error: null };
  } catch (err: unknown) {
    return { car: null, error: parseError(err) };
  }
};

import { supabase } from './supabaseClient';
import type { Car, FuelType } from '../types';

interface FetchCarsOptions {
  page?: number;
  limit?: number;
  searchTerm?: string;
  seatFilter?: number | 'all';
  fuelFilter?: FuelType | 'all';
}


/**
 * Fetches cars from the database, with optional pagination and filtering.
 * @param options - Options for fetching, including pagination and filters.
 * @returns An object containing the list of cars, an error message, and the total count.
 */
export const fetchCarsFromDB = async (options: FetchCarsOptions = {}): Promise<{ cars: Car[]; error: string | null; count: number | null }> => {
    const { page, limit, searchTerm, seatFilter, fuelFilter } = options;

    let query = supabase
        .from('cars')
        .select('*', { count: 'exact' })
        // Only show cars that are published to users
        .eq('status', 'published');
    
    if (searchTerm) {
      query = query.or(`title.ilike.%${searchTerm}%,make.ilike.%${searchTerm}%,model.ilike.%${searchTerm}%`);
    }

    if (seatFilter && seatFilter !== 'all') {
        query = query.eq('seats', seatFilter);
    }

    if (fuelFilter && fuelFilter !== 'all') {
        query = query.eq('fuel_type', fuelFilter);
    }


    if (page && limit) {
        const from = (page - 1) * limit;
        const to = page * limit - 1;
        query = query.range(from, to);
    }
    
    // Order by most recent year, then alphabetically by title
    const { data, error, count } = await query
        .order('year', { ascending: false })
        .order('title', { ascending: true });

    if (error) {
        console.error('Error fetching cars:', error);
        // FIX: Return the specific error message from Supabase instead of a generic one.
        // This helps diagnose underlying issues like RLS policies and fixes the `[object Object]` error.
        return { cars: [], error: `Failed to fetch car data: ${error.message}`, count: 0 };
    }

    if (data) {
        // Map snake_case from DB to camelCase and resolve image URLs
        const formattedData: Car[] = data.map(car => {
            const imagePaths = (Array.isArray(car.image_paths) ? car.image_paths : [])
                .filter((path): path is string => typeof path === 'string' && path.trim() !== '');
            
            const imageUrls = imagePaths.map(path => {
                // FIX: Make image URL retrieval safer to prevent potential crashes if the
                // publicUrl data structure is not what's expected.
                const { data: urlData } = supabase
                    .storage
                    .from('cars-photos')
                    .getPublicUrl(path);
                return urlData?.publicUrl || '';
            }).filter(Boolean); // Filter out any empty URLs that might result from the safety check

            return {
                id: car.id,
                title: car.title || car.model, // Fallback to model if title is not present
                make: car.make || 'N/A',
                model: car.model,
                year: car.year,
                seats: car.seats,
                fuelType: car.fuel_type,
                transmission: car.transmission,
                pricePerDay: car.price_per_day,
                images: imageUrls,
                imagePaths: imagePaths, // Keep original paths for admin operations
                available: car.booking_status === 'available', // Derive from booking_status
                verified: car.verified,
                status: car.status,
                booking_status: car.booking_status
            };
        });
        return { cars: formattedData, error: null, count };
    }

    return { cars: [], error: 'No car data found.', count: 0 };
};

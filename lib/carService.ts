
import { supabase } from './supabaseClient';
import type { Car } from '../types';

/**
 * Fetches all cars from the database, formats the data, and constructs public URLs for images.
 * This centralized function ensures consistency and avoids code duplication.
 * @returns An object containing the list of cars or an error message.
 */
export const fetchCarsFromDB = async (): Promise<{ cars: Car[]; error: string | null }> => {
    const { data, error } = await supabase
        .from('cars')
        .select('*')
        .order('id', { ascending: true });

    if (error) {
        console.error('Error fetching cars:', error);
        return { cars: [], error: 'Could not fetch car data. Please try again later.' };
    }

    if (data) {
        // Map snake_case from DB to camelCase and resolve image URLs
        const formattedData: Car[] = data.map(car => {
            const imagePaths = (Array.isArray(car.image_paths) ? car.image_paths : [])
                .filter((path): path is string => typeof path === 'string' && path.trim() !== '');
            
            const imageUrls = imagePaths.map(path => {
                const { data: { publicUrl } } = supabase
                    .storage
                    .from('cars-photos')
                    .getPublicUrl(path);
                return publicUrl;
            });

            return {
                id: car.id,
                title: car.title || car.model, // Fallback to model if title is not present
                make: car.make || 'N/A',
                model: car.model,
                year: car.year,
                seats: car.seats,
                fuelType: car.fuel_type,
                gearType: car.transmission || car.gear_type, // Support both column names
                pricePerDay: car.price_per_day,
                images: imageUrls,
                imagePaths: imagePaths, // Keep original paths for admin operations
                available: car.booking_status === 'available', // Derive from booking_status
                verified: car.verified,
                status: car.status,
                booking_status: car.booking_status
            };
        });
        return { cars: formattedData, error: null };
    }

    return { cars: [], error: 'No car data found.' };
};

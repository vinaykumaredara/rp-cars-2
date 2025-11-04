import { supabase } from './supabaseClient';
import type { License } from '../types';

const BUCKET_NAME = 'license-uploads';

/**
 * Fetches the user's current license status.
 */
export const fetchUserLicense = async (userId: string): Promise<{ license: License | null, error: string | null }> => {
    try {
        const { data, error } = await supabase
            .from('licenses')
            .select('id, user_id, storage_path, verified, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false }) // Get the latest one
            .limit(1)
            .maybeSingle();
        
        if (error) throw error;
        if (!data) return { license: null, error: null };

        let imageUrl = '';
        if (data.storage_path) {
            const { data: signedUrlData, error: signedUrlError } = await supabase.storage
                .from(BUCKET_NAME)
                .createSignedUrl(data.storage_path, 3600);
            
            if (signedUrlError) {
                if (signedUrlError.message.toLowerCase().includes('object not found')) {
                    // The record exists, but the file is missing. This is a data integrity issue.
                    // Return the license data without the URL, but with a specific error to guide the user.
                    const licenseData: License = { ...data, license_image_url: '' };
                    return { license: licenseData, error: "Your license record was found, but the image file is missing. Please re-upload your license." };
                } else {
                    console.error(`Failed to create signed URL for ${data.storage_path}:`, signedUrlError);
                    // For other errors (like permissions), return a more generic error.
                    return { license: null, error: "There was a problem loading your license image. Please try again." };
                }
            } else if (signedUrlData && signedUrlData.signedUrl) {
                imageUrl = signedUrlData.signedUrl;
            }
        }
        
        const licenseData: License = {
            ...data,
            license_image_url: imageUrl,
        };

        return { license: licenseData, error: null };
    } catch (err: any) {
        console.error('Error fetching user license:', err);
        return { license: null, error: err.message };
    }
};


/**
 * Uploads a user's license file, creates a database record, and returns the full license object
 * with a signed URL for immediate display.
 */
export const uploadLicense = async (userId: string, file: File): Promise<{ license: License | null; error: string | null }> => {
    try {
        const fileName = `${userId}/${crypto.randomUUID()}-${file.name}`;

        // Upload to storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(fileName, file);
        if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

        const newLicenseRecord = {
            user_id: userId,
            storage_path: uploadData.path,
            verified: false,
        };
        
        // Insert record and immediately select it back to get all fields
        const { data: dbData, error: dbError } = await supabase
            .from('licenses')
            .insert(newLicenseRecord)
            .select()
            .single();

        if (dbError) throw new Error(`Database insert failed: ${dbError.message}`);
        if (!dbData) throw new Error('Failed to retrieve new license record after insert.');

        // Create a signed URL for the newly uploaded file to show the user
        let imageUrl = '';
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
            .from(BUCKET_NAME)
            .createSignedUrl(dbData.storage_path, 3600);

        if (signedUrlError) {
            console.error('Could not create signed URL immediately after upload:', signedUrlError);
            // Proceed without URL, UI can handle it gracefully.
        } else {
            imageUrl = signedUrlData.signedUrl;
        }

        const fullLicenseData: License = {
            id: dbData.id,
            user_id: dbData.user_id,
            storage_path: dbData.storage_path,
            verified: dbData.verified,
            created_at: dbData.created_at,
            license_image_url: imageUrl,
        };

        return { license: fullLicenseData, error: null };
    } catch (err: any) {
        console.error('Error uploading license:', err);
        return { license: null, error: err.message };
    }
};


/**
 * Fetches all licenses pending verification for the admin panel using a secure RPC.
 * This function generates signed URLs for secure access to private license images.
 */
export const fetchAllLicensesForVerification = async (): Promise<{ licenses: License[]; error: string | null }> => {
    try {
        // Use the secure RPC function to get license and user data, bypassing RLS for admins.
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_licenses_for_verification');

        if (rpcError) {
            console.error('Error calling get_licenses_for_verification RPC:', rpcError);
            if (rpcError.code === '42883' || rpcError.message.includes('Could not find the function')) {
                return { licenses: [], error: "Backend not configured: The 'get_licenses_for_verification' function is missing. Please run the setup script." };
            }
            if (rpcError.message.includes('permission denied') || rpcError.message.includes('Admin privileges required')) {
                return { licenses: [], error: 'Permission Denied. You must be an admin to view licenses.' };
            }
            throw rpcError;
        }

        if (!rpcData || rpcData.length === 0) {
            return { licenses: [], error: null }; // No licenses to verify
        }

        // Asynchronously create signed URLs for each license image.
        const licenses: License[] = await Promise.all(
            rpcData.map(async (item: any) => {
                let imageUrl = '';
                if (item.storage_path) {
                    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
                        .from(BUCKET_NAME)
                        .createSignedUrl(item.storage_path, 3600);
                    
                    if (signedUrlError) {
                        if (signedUrlError.message.toLowerCase().includes('object not found')) {
                           // The file is missing in storage, imageUrl will remain empty.
                        } else {
                            // Log other errors (e.g., RLS issues) for admin debugging.
                            console.error(`Failed to create signed URL for ${item.storage_path}:`, signedUrlError);
                        }
                    } else if (signedUrlData && signedUrlData.signedUrl) {
                        imageUrl = signedUrlData.signedUrl;
                    }
                }
                
                return {
                    id: item.id,
                    user_id: item.user_id,
                    storage_path: item.storage_path,
                    verified: false, // The RPC function only returns unverified licenses.
                    created_at: item.created_at,
                    user_name: item.user_name || null,
                    user_email: item.user_email || null,
                    license_image_url: imageUrl,
                };
            })
        );
        
        return { licenses, error: null };
    } catch (err: any) {
        console.error('Error fetching licenses for verification:', err);
        return { licenses: [], error: err.message || 'An unexpected error occurred.' };
    }
};

/**
 * Updates the verification status of a license.
 */
export const updateLicenseStatus = async (licenseId: string, verified: boolean): Promise<{ error: string | null }> => {
    try {
        const { error } = await supabase
            .from('licenses')
            .update({ verified, updated_at: new Date().toISOString() })
            .eq('id', licenseId);
        if (error) throw error;
        return { error: null };
    } catch (err: any) {
        console.error('Error updating license status:', err);
        return { error: err.message };
    }
};
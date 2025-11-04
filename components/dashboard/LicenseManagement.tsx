import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchUserLicense, uploadLicense } from '../../lib/licenseService';
import type { License } from '../../types';
import { useToast } from '../../contexts/ToastContext';

const LicenseManagement: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [licenseFile, setLicenseFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [existingLicense, setExistingLicense] = useState<License | null>(null);

    const checkLicenseStatus = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        setError(null);
        const { license, error: fetchError } = await fetchUserLicense(user.id);
        setExistingLicense(license);
        if (fetchError) {
            setError(fetchError);
        }
        setIsLoading(false);
    }, [user]);

    useEffect(() => {
        checkLicenseStatus();
    }, [checkLicenseStatus]);

    useEffect(() => {
        return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
    }, [previewUrl]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                addToast('File size must be less than 5MB.', 'error');
                return;
            }
            setError(null);
            setLicenseFile(file);
            const newPreviewUrl = URL.createObjectURL(file);
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setPreviewUrl(newPreviewUrl);
        }
    };

    const handleSubmit = async () => {
        if (!user || !licenseFile) return;
        setIsUploading(true);
        setError(null);
        const { error: uploadError } = await uploadLicense(user.id, licenseFile);
        if (uploadError) {
            addToast(`Upload failed: ${uploadError}`, 'error');
            setError(`Upload failed: ${uploadError}`);
        } else {
            addToast('License uploaded successfully! It is now pending verification.', 'success');
            setLicenseFile(null); // Clear the file input
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl)
                setPreviewUrl(null);
            };
            await checkLicenseStatus(); // Refresh the license status
        }
        setIsUploading(false);
    };

    if (isLoading) {
        return <div className="text-center p-8">Loading license information...</div>;
    }

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">Driver's License</h2>
            {error && <p className="bg-red-100 text-red-700 p-3 rounded-md text-sm mb-4">{error}</p>}
            
            {existingLicense && (
                <div className="mb-8 p-4 bg-gray-50 rounded-lg border">
                    <h3 className="font-semibold mb-2">Current License on File</h3>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        {existingLicense.license_image_url ? (
                            <img src={existingLicense.license_image_url} alt="Current License" className="w-48 h-auto rounded-lg shadow-md" />
                        ) : (
                             <div className="w-48 h-28 flex items-center justify-center bg-gray-200 rounded-lg border text-sm text-gray-500 text-center">Image not found</div>
                        )}
                        <div>
                            <p>Status: 
                                <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${existingLicense.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                    {existingLicense.verified ? 'Verified' : 'Pending Verification'}
                                </span>
                            </p>
                            <p className="text-sm text-gray-500 mt-1">Submitted: {new Date(existingLicense.created_at).toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>
            )}

            <div>
                <h3 className="font-semibold mb-2">{existingLicense ? 'Upload a New Version' : 'Upload Your License'}</h3>
                <p className="text-sm text-gray-600 mb-4">Please upload a clear photo of your valid driver's license. This is required for booking.</p>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input type="file" id="license-upload-dash" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} className="hidden" />
                    <label htmlFor="license-upload-dash" className="cursor-pointer text-primary font-semibold hover:underline">
                        {licenseFile ? 'Change file' : 'Choose a file'}
                    </label>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG, WEBP up to 5MB</p>
                </div>
                {previewUrl && (
                    <div className="text-center mt-4">
                        <img src={previewUrl} alt="License Preview" className="max-h-48 mx-auto rounded-lg shadow-md" />
                        <p className="text-sm text-gray-600 mt-2">{licenseFile?.name}</p>
                    </div>
                )}
                <div className="text-right mt-4">
                    <button onClick={handleSubmit} disabled={!licenseFile || isUploading} className="px-6 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-hover transition disabled:bg-opacity-50">
                        {isUploading ? 'Uploading...' : 'Upload License'}
                    </button>
                </div>
            </div>
        </div>
    );
};
export default LicenseManagement;

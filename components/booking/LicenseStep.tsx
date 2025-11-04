import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchUserLicense, uploadLicense } from '../../lib/licenseService';
import type { Car, BookingDraft, License } from '../../types';

interface LicenseStepProps {
  car: Car;
  bookingData: BookingDraft;
  updateBookingData: (updates: Partial<BookingDraft>) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const LicenseStep: React.FC<LicenseStepProps> = ({ bookingData, updateBookingData, nextStep, prevStep }) => {
  const { user } = useAuth();
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [existingLicense, setExistingLicense] = useState<License | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);

  const checkLicenseStatus = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    const { license, error: fetchError } = await fetchUserLicense(user.id);

    // Always set the license data if it's returned, even with an error
    // This allows showing the record context even if the image is missing
    setExistingLicense(license);

    if (fetchError) {
      // Set the specific error message from the service to display to the user
      setError(fetchError);
    }
    
    if (license) {
      // If a license record exists (even with a missing image), show the existing license view first.
      // The error message will prompt the user to re-upload.
      setShowUploadForm(false);
    } else {
      // If no license record exists at all, go directly to the upload form.
      setShowUploadForm(true);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    checkLicenseStatus();
  }, [checkLicenseStatus]);

  useEffect(() => {
    // Cleanup preview URL on unmount
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('File size must be less than 5MB.');
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
    if (!user || !licenseFile) {
      setError('Please select a license file to upload.');
      return;
    }
    setIsUploading(true);
    setError(null);
    const { license, error: uploadError } = await uploadLicense(user.id, licenseFile);
    if (uploadError) {
      setError(`Upload failed: ${uploadError}`);
    } else if (license) {
      // On successful upload, show the user what they've uploaded for confirmation
      setExistingLicense(license);
      setShowUploadForm(false);
      updateBookingData({ licenseData: { isUploaded: true } });
      // The user will now see the confirmation and click "Proceed" to advance.
    }
    setIsUploading(false);
  };
  
  if (isLoading) {
      return <div className="text-center p-8">Checking license status...</div>;
  }
  
  const renderUploadForm = () => (
    <div className="space-y-6">
        <p className="text-gray-700">Please upload a clear photo of your valid driver's license.</p>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input type="file" id="license-upload" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} className="hidden" />
            <label htmlFor="license-upload" className="cursor-pointer text-primary font-semibold hover:underline">
                {licenseFile ? 'Change file' : 'Choose a file'}
            </label>
            <p className="text-xs text-gray-500 mt-1">PNG, JPG, WEBP up to 5MB</p>
        </div>
        {previewUrl && (
            <div className="text-center">
            <img src={previewUrl} alt="License Preview" className="max-h-48 mx-auto rounded-lg shadow-md" />
            <p className="text-sm text-gray-600 mt-2">{licenseFile?.name}</p>
            </div>
        )}
        <div className="flex justify-between space-x-4 pt-4">
            <button
                onClick={existingLicense ? () => setShowUploadForm(false) : prevStep}
                className="px-6 py-2 rounded-lg bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition"
                disabled={isUploading}>
                {existingLicense ? 'Cancel' : 'Back'}
            </button>
            <button onClick={handleSubmit} disabled={!licenseFile || isUploading} className="px-6 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-hover transition disabled:bg-opacity-50">
                {isUploading ? 'Uploading...' : 'Upload License'}
            </button>
        </div>
    </div>
  );

  const renderExistingLicense = () => (
    <div className="space-y-6 text-center">
        <p className="text-gray-700">We found your license on file. You can proceed with this one or upload a new version.</p>
        
        {existingLicense?.license_image_url ? (
            <img src={existingLicense.license_image_url} alt="Existing License" className="max-h-48 mx-auto rounded-lg shadow-md" />
        ) : (
            <div className="h-48 flex items-center justify-center bg-gray-100 rounded-lg border">
                <p className="text-sm text-gray-500">License image could not be loaded.</p>
            </div>
        )}
        
        <div className={`px-2 inline-flex text-sm leading-5 font-semibold rounded-full ${existingLicense?.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
            {existingLicense?.verified ? 'Verified' : 'Pending Verification'}
        </div>
        <div className="flex justify-between space-x-4 pt-4">
            <button onClick={() => setShowUploadForm(true)} className="px-6 py-2 w-full rounded-lg bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition">
                Upload New License
            </button>
            <button onClick={nextStep} className="px-6 py-2 w-full rounded-lg bg-primary text-white font-semibold hover:bg-primary-hover transition">
                Proceed
            </button>
        </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {error && <p className="bg-red-100 text-red-700 p-3 rounded-md text-sm mb-4">{error}</p>}
      {showUploadForm ? renderUploadForm() : renderExistingLicense()}
    </div>
  );
};

export default LicenseStep;
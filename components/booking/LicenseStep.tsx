import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchUserLicense, uploadLicense } from '../../lib/licenseService';
import type { Car, BookingDraft } from '../../types';

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
  const [licenseStatus, setLicenseStatus] = useState<'needed' | 'uploaded' | 'verified'>('needed');

  const checkLicenseStatus = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    const { license, error: fetchError } = await fetchUserLicense(user.id);
    if (fetchError) {
      setError('Could not verify your license status. Please try again.');
    } else if (license) {
      setLicenseStatus(license.verified ? 'verified' : 'uploaded');
      updateBookingData({ licenseData: { isUploaded: true } });
      nextStep(); // Auto-advance if already uploaded/verified
    } else {
      setLicenseStatus('needed');
    }
    setIsLoading(false);
  }, [user, nextStep, updateBookingData]);

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
    const { error: uploadError } = await uploadLicense(user.id, licenseFile);
    if (uploadError) {
      setError(`Upload failed: ${uploadError}`);
    } else {
      updateBookingData({ licenseData: { file: licenseFile, previewUrl: previewUrl || undefined, isUploaded: true } });
      nextStep();
    }
    setIsUploading(false);
  };
  
  if (isLoading) {
      return <div className="text-center p-8">Checking license status...</div>;
  }
  
  if (licenseStatus === 'verified' || licenseStatus === 'uploaded') {
      return <div className="text-center p-8">License already on file. Proceeding...</div>;
  }

  return (
    <div className="space-y-6">
      <p className="text-gray-700">Please upload a clear photo of your valid driver's license.</p>

      {error && <p className="bg-red-100 text-red-700 p-3 rounded-md text-sm">{error}</p>}

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <input
          type="file"
          id="license-upload"
          accept="image/png, image/jpeg, image/webp"
          onChange={handleFileChange}
          className="hidden"
        />
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
          onClick={prevStep}
          className="px-6 py-2 rounded-lg bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition"
          disabled={isUploading}
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={!licenseFile || isUploading}
          className="px-6 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-hover transition disabled:bg-opacity-50"
        >
          {isUploading ? 'Uploading...' : 'Upload & Continue'}
        </button>
      </div>
    </div>
  );
};

export default LicenseStep;

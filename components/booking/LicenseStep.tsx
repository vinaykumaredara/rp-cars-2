import React, { useState, useEffect } from 'react';
import type { Car, BookingDraft } from '../../types';

interface LicenseStepProps {
  car: Car;
  bookingData: BookingDraft;
  updateBookingData: (updates: Partial<BookingDraft>) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const LicenseStep: React.FC<LicenseStepProps> = ({ car, bookingData, updateBookingData, nextStep, prevStep }) => {
  const [licenseImage, setLicenseImage] = useState<File | null>(null);
  const [licensePreviewUrl, setLicensePreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // TODO: In a real implementation, you'd fetch the user's existing license status
  // and uploaded image from the `licenses` table.
  // For now, we'll simulate a license upload.
  const hasExistingLicense = false; // Based on actual user data later
  const isLicenseVerified = false; // Based on `licenses.verified` field later

  useEffect(() => {
    // Cleanup object URL if component unmounts or image changes
    return () => {
      if (licensePreviewUrl) {
        URL.revokeObjectURL(licensePreviewUrl);
      }
    };
  }, [licensePreviewUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLicenseImage(file);
      if (licensePreviewUrl) {
        URL.revokeObjectURL(licensePreviewUrl);
      }
      setLicensePreviewUrl(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleNext = async () => {
    if (hasExistingLicense && isLicenseVerified) {
      // If already verified, just proceed
      updateBookingData({ licenseUploaded: true });
      nextStep();
      return;
    }

    if (!licenseImage) {
      setError('Please upload an image of your driving license.');
      return;
    }

    setIsUploading(true);
    setError(null);
    
    try {
      // TODO: Implement actual license upload to Supabase Storage ('license-uploads' bucket)
      // and create a record in the `licenses` table.
      // const { data, error: uploadError } = await supabase.storage.from('license-uploads').upload(...);
      // const { data: dbInsert, error: dbError } = await supabase.from('licenses').insert(...);
      
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate upload time

      // After successful upload and DB record creation:
      updateBookingData({ licenseUploaded: true }); // Mark as uploaded (pending verification by admin)
      nextStep(); // Proceed to the next step
    } catch (err: any) {
      console.error('License upload failed:', err);
      setError(err.message || 'Failed to upload license. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-gray-700">
        Please upload a clear image of your valid driving license. This is required for verification.
      </p>
      
      {error && <p className="bg-red-100 text-red-700 p-3 rounded-md text-sm">{error}</p>}

      {hasExistingLicense && (
        <div className="p-3 bg-blue-100 rounded-lg text-blue-800 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path></svg>
            <span>You have an existing license on file.</span>
            {isLicenseVerified ? (
                <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-green-200 text-green-800 rounded-full">Verified</span>
            ) : (
                <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-yellow-200 text-yellow-800 rounded-full">Pending Verification</span>
            )}
        </div>
      )}

      {!isLicenseVerified && ( // Allow upload if not yet verified
        <div>
          <label htmlFor="licenseUpload" className="block text-sm font-medium text-gray-700 mb-2">Upload License Image</label>
          <input
            type="file"
            id="licenseUpload"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-semibold
              file:bg-primary file:text-white
              hover:file:bg-primary-hover file:transition-colors
              cursor-pointer"
            disabled={isUploading}
          />
          {licensePreviewUrl && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">Image Preview:</p>
              <img src={licensePreviewUrl} alt="License Preview" className="max-w-xs h-auto rounded-lg shadow-md border" />
            </div>
          )}
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
          onClick={handleNext}
          disabled={isUploading || (!licenseImage && !hasExistingLicense)}
          className="px-6 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-hover transition disabled:bg-opacity-50"
        >
          {isUploading ? 'Uploading...' : 'Next: Extras'}
        </button>
      </div>
    </div>
  );
};

export default LicenseStep;
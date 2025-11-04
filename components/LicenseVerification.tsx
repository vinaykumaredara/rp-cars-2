import React, { useState, useEffect, useCallback } from 'react';
import AdminPageLayout from './AdminPageLayout';
import ImagePreviewModal from './ImagePreviewModal';
import { useToast } from '../contexts/ToastContext';
import { fetchAllLicensesForVerification, updateLicenseStatus } from '../lib/licenseService';
import type { License } from '../types';
import DatabaseSetup from './DatabaseSetup';

const LicenseVerification: React.FC = () => {
    const [licenses, setLicenses] = useState<License[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState<string | null>(null); // holds license id
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const { addToast } = useToast();

    const loadLicenses = useCallback(async () => {
        setIsLoading(true);
        const { licenses: data, error: fetchError } = await fetchAllLicensesForVerification();
        setLicenses(data);
        setError(fetchError);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        loadLicenses();
    }, [loadLicenses]);

    const handleUpdateStatus = async (licenseId: string, verified: boolean) => {
        setIsProcessing(licenseId);
        const { error: updateError } = await updateLicenseStatus(licenseId, verified);
        if (updateError) {
            addToast(`Failed to update status: ${updateError}`, 'error');
        } else {
            addToast(`License ${verified ? 'approved' : 'marked as needs review'}`, 'success');
            // Refresh list after update
            await loadLicenses();
        }
        setIsProcessing(null);
    };

    const renderContent = () => {
        if (isLoading) {
            return <p className="text-center text-gray-600 p-8">Loading licenses for verification...</p>;
        }
        if (error && error.includes('Backend not configured')) {
            return <DatabaseSetup />;
        }
        if (error) {
            return <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">{error}</div>;
        }
        if (licenses.length === 0) {
            return <p className="text-center text-gray-600 p-8">No licenses are currently pending verification. Great job!</p>;
        }
        return (
            <div className="space-y-4">
                {licenses.map(license => (
                    <div key={license.id} className="p-4 border rounded-lg flex flex-col md:flex-row items-start md:items-center gap-4">
                        <div 
                            className="flex-shrink-0 w-32 h-20 bg-gray-200 rounded-md overflow-hidden"
                            onClick={() => license.license_image_url && setSelectedImage(license.license_image_url)}
                        >
                            {license.license_image_url ? (
                                <img 
                                    src={license.license_image_url} 
                                    alt="License thumbnail" 
                                    className="w-full h-full object-cover cursor-pointer"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs text-center text-gray-500 p-2">Image Not Found</div>
                            )}
                        </div>
                        <div className="flex-grow">
                            <p className="font-semibold">{license.user_name || 'N/A'}</p>
                            <p className="text-sm text-gray-500">{license.user_email || 'N/A'}</p>
                            <p className="text-xs text-gray-400 mt-1">Submitted: {new Date(license.created_at).toLocaleString()}</p>
                        </div>
                        <div className="flex-shrink-0">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                license.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                                {license.verified ? 'Approved' : 'Pending'}
                            </span>
                        </div>
                        <div className="flex items-center space-x-2 mt-2 md:mt-0">
                            <button
                                onClick={() => handleUpdateStatus(license.id, true)}
                                disabled={isProcessing === license.id}
                                className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition disabled:opacity-50"
                            >
                                {isProcessing === license.id ? '...' : 'Approve'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <>
            <AdminPageLayout
                title="License Verification"
                subtitle="Review and verify customer-submitted driver's licenses."
            >
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    {renderContent()}
                </div>
            </AdminPageLayout>
            {selectedImage && (
                <ImagePreviewModal 
                    isOpen={!!selectedImage}
                    onClose={() => setSelectedImage(null)}
                    imageUrl={selectedImage}
                    altText="Driver's License Preview"
                />
            )}
        </>
    );
};

export default LicenseVerification;
import React, { useState, useEffect, useCallback } from 'react';
import AdminPageLayout from './AdminPageLayout';
import PromoCodeFormModal from './PromoCodeFormModal';
import ConfirmationModal from './ConfirmationModal';
import { useToast } from '../contexts/ToastContext';
import { fetchAllPromoCodes, deletePromoCode } from '../lib/promoService';
import type { PromoCode } from '../types';

const PromoCodeManagement: React.FC = () => {
    const [codes, setCodes] = useState<PromoCode[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [selectedCode, setSelectedCode] = useState<PromoCode | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const { addToast } = useToast();

    const refreshCodes = useCallback(async () => {
        setIsLoading(true);
        const { codes: data, error: fetchError } = await fetchAllPromoCodes();
        setCodes(data);
        setError(fetchError);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        refreshCodes();
    }, [refreshCodes]);

    const handleAddNew = () => {
        setSelectedCode(null);
        setIsFormModalOpen(true);
    };

    const handleEdit = (code: PromoCode) => {
        setSelectedCode(code);
        setIsFormModalOpen(true);
    };

    const handleDelete = (code: PromoCode) => {
        setSelectedCode(code);
        setIsConfirmModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!selectedCode) return;
        setIsProcessing(true);
        const { error: deleteError } = await deletePromoCode(selectedCode.id);
        if (deleteError) {
            addToast(`Failed to delete: ${deleteError}`, 'error');
        } else {
            addToast('Promo code deleted successfully!', 'success');
            await refreshCodes();
        }
        setIsProcessing(false);
        setIsConfirmModalOpen(false);
        setSelectedCode(null);
    };
    
    const handleSave = async () => {
        setIsFormModalOpen(false);
        setSelectedCode(null);
        await refreshCodes();
    };

    const renderContent = () => {
        if (isLoading) return <p className="text-center p-8">Loading promo codes...</p>;
        if (error) return <div className="bg-red-100 p-4 rounded-md text-red-700">{error}</div>;
        if (codes.length === 0) return <p className="text-center p-8">No promo codes found.</p>;
        
        return (
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usage</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expires</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {codes.map(code => (
                            <tr key={code.id}>
                                <td className="px-6 py-4 whitespace-nowrap font-mono font-bold">{code.code}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{code.discount_percentage}%</td>
                                <td className="px-6 py-4 whitespace-nowrap">{code.uses} / {code.max_uses || '∞'}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{code.expires_at ? new Date(code.expires_at).toLocaleDateString() : 'Never'}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${code.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {code.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                    <button onClick={() => handleEdit(code)} className="text-primary hover:text-primary-hover">Edit</button>
                                    <button onClick={() => handleDelete(code)} className="text-red-600 hover:text-red-800">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <>
            <AdminPageLayout
                title="Promo Code Management"
                subtitle="Create and manage discounts for your customers."
                headerAction={
                    <button onClick={handleAddNew} className="px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-hover">
                        + Add New Code
                    </button>
                }
            >
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    {renderContent()}
                </div>
            </AdminPageLayout>

            {isFormModalOpen && (
                <PromoCodeFormModal
                    isOpen={isFormModalOpen}
                    onClose={() => setIsFormModalOpen(false)}
                    onSave={handleSave}
                    promoCode={selectedCode}
                />
            )}
            
            {selectedCode && (
                 <ConfirmationModal
                    isOpen={isConfirmModalOpen}
                    onClose={() => setIsConfirmModalOpen(false)}
                    onConfirm={confirmDelete}
                    title="Delete Promo Code"
                    message={<>Are you sure you want to delete the code <strong className="font-mono">{selectedCode.code}</strong>? This cannot be undone.</>}
                    confirmText="Delete"
                    isConfirming={isProcessing}
                 />
            )}
        </>
    );
};

export default PromoCodeManagement;

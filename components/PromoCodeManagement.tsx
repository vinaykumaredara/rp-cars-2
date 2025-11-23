import React, { useState, useEffect, useCallback } from 'react';
import AdminPageLayout from './AdminPageLayout';
import PromoCodeFormModal from './PromoCodeFormModal';
import ConfirmationModal from './ConfirmationModal';
import { useToast } from '../contexts/ToastContext';
import { fetchAllPromoCodes, deletePromoCode } from '../lib/promoService';
import type { PromoCode } from '../types';
import DatabaseSetup from './DatabaseSetup';
import { supabase } from '../lib/supabaseClient';

const PromoCodeManagement: React.FC = () => {
    const [codes, setCodes] = useState<PromoCode[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [selectedCode, setSelectedCode] = useState<PromoCode | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const { addToast } = useToast();

    // Simplified refresh logic: Fetches data and updates state without managing isLoading.
    // This makes it safe to call from anywhere without causing UI flashes.
    const refreshCodes = useCallback(async () => {
        const { codes: data, error: fetchError } = await fetchAllPromoCodes();
        if (fetchError) {
            // Only update the error, don't clear existing data on a failed background refresh.
            setError(fetchError);
        } else {
            setCodes(data);
            setError(null); // Clear previous errors on a successful fetch.
        }
    }, []);

    // Effect for handling the initial data load and setting up real-time subscriptions.
    useEffect(() => {
        const initialLoad = async () => {
            setIsLoading(true);
            await refreshCodes();
            setIsLoading(false);
        };
        initialLoad();

        const channel = supabase
          .channel('promo-code-management-realtime')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'promo_codes' },
            () => {
              // On database change, trigger a background refresh.
              refreshCodes();
            }
          )
          .subscribe();

        // Cleanup subscription on component unmount.
        return () => {
          supabase.removeChannel(channel);
        };
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
            // Manually refresh for immediate UI feedback for the current user.
            await refreshCodes();
        }
        setIsProcessing(false);
        setIsConfirmModalOpen(false);
        setSelectedCode(null);
    };
    
    // This is called by the modal on a successful save.
    const handleSave = () => {
        setIsFormModalOpen(false);
        setSelectedCode(null);
        // Manually refresh for immediate UI feedback. The modal already shows the toast.
        refreshCodes();
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-CA');
    };

    const displayDiscount = (code: PromoCode) => {
        if (code.discount_percent) {
            return `${code.discount_percent}%`;
        }
        if (code.discount_flat) {
            return `₹${Number(code.discount_flat).toLocaleString('en-IN')}`;
        }
        return 'N/A';
    };

    const renderContent = () => {
        if (isLoading) return <p className="text-center p-8">Loading promo codes...</p>;
        
        // More robust check for setup errors. It now catches missing tables, columns, or functions.
        const needsSetup = error && (
            error.includes('does not exist') || // Generic check for missing schema objects
            error.includes('Backend not configured')
        );
        
        if (needsSetup) {
            return <DatabaseSetup />;
        }
        
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
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Validity</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {codes.map(code => (
                            <tr key={code.id}>
                                <td className="px-6 py-4 whitespace-nowrap font-mono font-bold text-sm text-gray-900">{code.code}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {displayDiscount(code)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{code.times_used} / {code.usage_limit || '∞'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {formatDate(code.valid_from)} to {formatDate(code.valid_to)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${code.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {code.active ? 'Active' : 'Inactive'}
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
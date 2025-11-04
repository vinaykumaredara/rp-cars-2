
import React, { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import { upsertPromoCode } from '../lib/promoService';
import type { PromoCode } from '../types';

interface PromoCodeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  promoCode: PromoCode | null;
}

const PromoCodeFormModal: React.FC<PromoCodeFormModalProps> = ({ isOpen, onClose, onSave, promoCode }) => {
  const [formData, setFormData] = useState({
    code: '',
    discount_percentage: 10,
    max_uses: null as number | null,
    is_active: true,
    expires_at: '',
  });
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();
  const isEditMode = !!promoCode;

  useEffect(() => {
    if (isOpen) {
      if (promoCode) {
        setFormData({
          code: promoCode.code,
          discount_percentage: promoCode.discount_percentage,
          max_uses: promoCode.max_uses,
          is_active: promoCode.is_active,
          expires_at: promoCode.expires_at ? promoCode.expires_at.split('T')[0] : '',
        });
      } else {
        // Reset for new code
        setFormData({
          code: '', discount_percentage: 10, max_uses: null, is_active: true, expires_at: '',
        });
      }
    }
  }, [isOpen, promoCode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
        setFormData(prev => ({
            ...prev,
            [name]: (name === 'discount_percentage' || name === 'max_uses') ? (value === '' ? null : parseInt(value, 10)) : value,
        }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const dataToSave = {
        ...formData,
        expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null
    };

    const { error } = await upsertPromoCode(dataToSave, promoCode?.id);

    if (error) {
      addToast(`Failed to save: ${error}`, 'error');
    } else {
      addToast(`Promo code ${isEditMode ? 'updated' : 'created'} successfully!`, 'success');
      onSave();
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg mx-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold">{isEditMode ? 'Edit Promo Code' : 'Create Promo Code'}</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">Promo Code</label>
                    <input type="text" name="code" value={formData.code} onChange={handleChange} required className="w-full p-2 border rounded" />
                </div>
                <div>
                    <label htmlFor="discount_percentage" className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
                    <input type="number" name="discount_percentage" value={formData.discount_percentage} onChange={handleChange} required min="1" max="100" className="w-full p-2 border rounded" />
                </div>
                <div>
                    <label htmlFor="max_uses" className="block text-sm font-medium text-gray-700 mb-1">Max Uses (optional)</label>
                    <input type="number" name="max_uses" value={formData.max_uses ?? ''} onChange={handleChange} min="1" className="w-full p-2 border rounded" />
                </div>
                <div>
                    <label htmlFor="expires_at" className="block text-sm font-medium text-gray-700 mb-1">Expires At (optional)</label>
                    <input type="date" name="expires_at" value={formData.expires_at} onChange={handleChange} className="w-full p-2 border rounded" />
                </div>
            </div>
            <div className="flex items-center">
              <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} id="is_active" className="h-4 w-4 text-primary rounded" />
              <label htmlFor="is_active" className="ml-2 block text-sm">Active</label>
            </div>
          </div>
          <div className="p-6 border-t flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded border hover:bg-gray-100">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 rounded bg-primary text-white hover:bg-primary-hover disabled:opacity-50">
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PromoCodeFormModal;
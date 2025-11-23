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
    discount_percent: '10',
    discount_flat: '',
    active: true,
    valid_from: '',
    valid_to: '',
    usage_limit: '0', // 0 for unlimited
  });
  const [discountType, setDiscountType] = useState<'percent' | 'flat'>('percent');
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();
  const isEditMode = !!promoCode;

  useEffect(() => {
    if (isOpen) {
      if (promoCode) {
        setFormData({
          code: promoCode.code,
          discount_percent: promoCode.discount_percent?.toString() || '',
          discount_flat: promoCode.discount_flat?.toString() || '',
          active: promoCode.active,
          valid_from: promoCode.valid_from ? promoCode.valid_from.split('T')[0] : '',
          valid_to: promoCode.valid_to ? promoCode.valid_to.split('T')[0] : '',
          usage_limit: promoCode.usage_limit.toString(),
        });
        setDiscountType(promoCode.discount_flat ? 'flat' : 'percent');
      } else {
        // Reset for new code
        setFormData({ code: '', discount_percent: '10', discount_flat: '', active: true, valid_from: '', valid_to: '', usage_limit: '0' });
        setDiscountType('percent');
      }
    }
  }, [isOpen, promoCode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleDiscountTypeChange = (type: 'percent' | 'flat') => {
    setDiscountType(type);
    if (type === 'percent') {
        setFormData(prev => ({ ...prev, discount_flat: '' }));
    } else {
        setFormData(prev => ({ ...prev, discount_percent: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const dataToSave: Partial<PromoCode> = {
      code: formData.code,
      discount_percent: discountType === 'percent' ? parseInt(formData.discount_percent, 10) || null : null,
      discount_flat: discountType === 'flat' ? parseFloat(formData.discount_flat) || null : null,
      active: formData.active,
      valid_from: formData.valid_from ? new Date(formData.valid_from).toISOString() : null,
      valid_to: formData.valid_to ? new Date(formData.valid_to).toISOString() : null,
      usage_limit: parseInt(formData.usage_limit, 10) || 0
    };

    if (!dataToSave.discount_percent && !dataToSave.discount_flat) {
        addToast('You must provide either a percentage or a flat discount amount.', 'error');
        setLoading(false);
        return;
    }

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
            <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">Promo Code</label>
                <input type="text" name="code" value={formData.code} onChange={handleChange} required className="w-full p-2 border rounded-md" />
            </div>
            
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                <div className="flex rounded-md shadow-sm">
                    <button type="button" onClick={() => handleDiscountTypeChange('percent')} className={`px-4 py-2 rounded-l-md border text-sm w-1/2 transition-colors ${discountType === 'percent' ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>Percentage</button>
                    <button type="button" onClick={() => handleDiscountTypeChange('flat')} className={`-ml-px px-4 py-2 rounded-r-md border text-sm w-1/2 transition-colors ${discountType === 'flat' ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>Flat Amount</button>
                </div>
            </div>

            {discountType === 'percent' ? (
                <div>
                    <label htmlFor="discount_percent" className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
                    <input type="number" name="discount_percent" value={formData.discount_percent} onChange={handleChange} required min="1" max="100" className="w-full p-2 border rounded-md" />
                </div>
            ) : (
                <div>
                    <label htmlFor="discount_flat" className="block text-sm font-medium text-gray-700 mb-1">Discount Amount (₹)</label>
                    <input type="number" name="discount_flat" value={formData.discount_flat} onChange={handleChange} required min="1" step="0.01" className="w-full p-2 border rounded-md" />
                </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="valid_from" className="block text-sm font-medium text-gray-700 mb-1">Valid From (optional)</label>
                    <input type="date" name="valid_from" value={formData.valid_from} onChange={handleChange} className="w-full p-2 border rounded-md" />
                </div>
                <div>
                    <label htmlFor="valid_to" className="block text-sm font-medium text-gray-700 mb-1">Valid To (optional)</label>
                    <input type="date" name="valid_to" value={formData.valid_to} onChange={handleChange} className="w-full p-2 border rounded-md" />
                </div>
            </div>

            <div>
                <label htmlFor="usage_limit" className="block text-sm font-medium text-gray-700 mb-1">Usage Limit (0 for unlimited)</label>
                <input type="number" name="usage_limit" value={formData.usage_limit} onChange={handleChange} min="0" className="w-full p-2 border rounded-md" />
            </div>
            
            <div className="flex items-center">
              <input type="checkbox" name="active" checked={formData.active} onChange={handleChange} id="active" className="h-4 w-4 text-primary rounded" />
              <label htmlFor="active" className="ml-2 block text-sm">Active</label>
            </div>
          </div>
          <div className="p-6 border-t flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 transition">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-hover transition disabled:opacity-50">
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PromoCodeFormModal;
import { supabase } from './supabaseClient';
import type { PromoCode } from '../types';

/**
 * Fetches all promo codes from the database.
 */
export const fetchAllPromoCodes = async (): Promise<{ codes: PromoCode[]; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('promo_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { codes: data || [], error: null };
  } catch (err: any) {
    console.error('Error fetching promo codes:', err);
    return { codes: [], error: err.message };
  }
};

/**
 * Creates or updates a promo code.
 */
export const upsertPromoCode = async (
  formData: Omit<PromoCode, 'id' | 'created_at' | 'uses'>,
  existingCodeId?: string
): Promise<{ error: string | null }> => {
  try {
    const record = {
      code: formData.code.toUpperCase(),
      discount_percentage: formData.discount_percentage,
      max_uses: formData.max_uses,
      is_active: formData.is_active,
      expires_at: formData.expires_at || null,
    };

    let query;
    if (existingCodeId) {
      query = supabase.from('promo_codes').update(record).eq('id', existingCodeId);
    } else {
      query = supabase.from('promo_codes').insert(record);
    }
    const { error } = await query;
    if (error) throw error;
    return { error: null };
  } catch (err: any) {
    console.error('Error upserting promo code:', err);
    return { error: err.message };
  }
};

/**
 * Deletes a promo code.
 */
export const deletePromoCode = async (codeId: string): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase.from('promo_codes').delete().eq('id', codeId);
    if (error) throw error;
    return { error: null };
  } catch (err: any) {
    console.error('Error deleting promo code:', err);
    return { error: err.message };
  }
};

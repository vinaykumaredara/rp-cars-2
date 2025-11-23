import { supabase } from './supabaseClient';
import type { PromoCode, ValidatedPromo, PromoValidationResult } from '../types';
import { parseError } from './errorUtils';

/**
 * Fetches all promo codes from the database.
 */
export const fetchAllPromoCodes = async (): Promise<{ codes: PromoCode[]; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('promo_codes')
      .select('*') // More resilient to missing columns
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Ensure data conforms to the PromoCode type with defaults for safety
    const codes: PromoCode[] = (data || []).map((p: any) => ({
        id: p.id,
        code: p.code || 'UNKNOWN',
        discount_percent: p.discount_percent || null,
        discount_flat: p.discount_flat || null,
        valid_from: p.valid_from || null,
        valid_to: p.valid_to || null,
        active: p.active === true, // Default to false
        usage_limit: p.usage_limit || 0,
        times_used: p.times_used || 0,
        last_used_at: p.last_used_at || null,
        created_at: p.created_at,
        updated_at: p.updated_at,
    }));

    return { codes, error: null };
  } catch (err: unknown) {
    return { codes: [], error: parseError(err) };
  }
};

/**
 * Creates or updates a promo code.
 */
export const upsertPromoCode = async (
  formData: Partial<PromoCode>,
  existingCodeId?: string
): Promise<{ error: string | null }> => {
  try {
    const record = {
      id: existingCodeId, // Will be undefined for new records, which is correct for upsert
      code: formData.code?.toUpperCase(),
      discount_percent: formData.discount_percent || null,
      discount_flat: formData.discount_flat || null,
      active: formData.active,
      valid_from: formData.valid_from || null,
      valid_to: formData.valid_to || null,
      usage_limit: formData.usage_limit || 0,
    };

    const { error } = await supabase.from('promo_codes').upsert(record);

    if (error) throw error;
    return { error: null };
  } catch (err: unknown) {
    return { error: parseError(err) };
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
  } catch (err: unknown) {
    return { error: parseError(err) };
  }
};

/**
 * Validates a promo code by calling the backend RPC.
 */
export const validatePromoCode = async (code: string): Promise<{ data: PromoValidationResult | null; error: any }> => {
    if (!code) {
        return { data: { valid: false, message: 'Please enter a code.' }, error: null };
    }
    
    // Sanitize input
    const p_code = code?.trim().toUpperCase();

    // Use .single() so supabase returns a single object rather than an array
    const { data, error } = await supabase
        .rpc('validate_promo_code', { p_code })
        .single();

    // The caller is responsible for parsing the error.
    return { data, error };
};
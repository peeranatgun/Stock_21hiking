// brands.js — Brand management
import { supabase } from './supabase.js';

export async function getBrands() {
  const { data, error } = await supabase
    .from('brands')
    .select('*, products(count)')
    .order('name');
  if (error) throw error;
  return data;
}

export async function getBrandsSimple() {
  const { data, error } = await supabase.from('brands').select('id, name').order('name');
  if (error) throw error;
  return data;
}

export async function createBrand(name) {
  const { data, error } = await supabase.from('brands').insert({ name: name.trim() }).select().single();
  if (error) throw error;
  return data;
}

export async function updateBrand(id, name) {
  const { data, error } = await supabase.from('brands').update({ name: name.trim() }).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteBrand(id) {
  const { error } = await supabase.from('brands').delete().eq('id', id);
  if (error) throw error;
}

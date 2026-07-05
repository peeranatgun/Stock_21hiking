import { supabase } from './supabase.js';

export async function getExpenses(lotId = null) {
  let query = supabase.from('expenses').select('*').order('created_at', { ascending: false });
  if (lotId) query = query.eq('lot_id', lotId);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createExpense({ title, amount, lot_id = null }) {
  const { data, error } = await supabase
    .from('expenses')
    .insert({ title: title.trim(), amount: parseFloat(amount), lot_id })
    .select().single();
  if (error) throw error;
  return data;
}

export async function updateExpense(id, { title, amount }) {
  const { data, error } = await supabase
    .from('expenses')
    .update({ title: title.trim(), amount: parseFloat(amount) })
    .eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteExpense(id) {
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) throw error;
}

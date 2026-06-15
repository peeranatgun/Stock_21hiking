// expenses.js — Expense management
import { supabase } from './supabase.js';

export async function getExpenses() {
  const { data, error } = await supabase.from('expenses').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createExpense({ title, amount }) {
  const { data, error } = await supabase.from('expenses').insert({ title: title.trim(), amount: parseFloat(amount) }).select().single();
  if (error) throw error;
  return data;
}

export async function updateExpense(id, { title, amount }) {
  const { data, error } = await supabase.from('expenses').update({ title: title.trim(), amount: parseFloat(amount) }).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteExpense(id) {
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) throw error;
}

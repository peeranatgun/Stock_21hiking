// sales.js — Sales data
import { supabase } from './supabase.js';

export async function getSales({ search = '', page = 1, perPage = 20 } = {}) {
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = supabase
    .from('sales')
    .select('*, products(name, brands(name))', { count: 'exact' })
    .order('sold_at', { ascending: false })
    .range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  let filtered = data;
  if (search) {
    filtered = data.filter(s =>
      (s.products?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.products?.brands?.name || '').toLowerCase().includes(search.toLowerCase())
    );
  }

  return { data: filtered, count };
}

export async function getMonthlyStats() {
  const { data, error } = await supabase
    .from('sales')
    .select('sell_price, profit, sold_at')
    .order('sold_at');
  if (error) throw error;

  const monthly = {};
  data.forEach(s => {
    const key = s.sold_at.substring(0, 7); // YYYY-MM
    if (!monthly[key]) monthly[key] = { revenue: 0, profit: 0 };
    monthly[key].revenue += s.sell_price || 0;
    monthly[key].profit += s.profit || 0;
  });
  return monthly;
}

export async function getMonthlyExpenses() {
  const { data, error } = await supabase.from('expenses').select('amount, created_at').order('created_at');
  if (error) throw error;

  const monthly = {};
  data.forEach(e => {
    const key = e.created_at.substring(0, 7);
    if (!monthly[key]) monthly[key] = 0;
    monthly[key] += e.amount || 0;
  });
  return monthly;
}

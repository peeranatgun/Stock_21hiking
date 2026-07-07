// sales.js — Sales data
import { supabase } from './supabase.js';
export async function getSales({ search = '', page = 1, perPage = 20, lotId = null } = {}) {
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = supabase
    .from('sales')
    .select('*, products(name, brands(name), lot_id)', { count: 'exact' })
    .order('sold_at', { ascending: false })
    .range(from, to);

  if (lotId) {
    const { data: lotProducts } = await supabase
      .from('products').select('id').eq('lot_id', lotId);
    const ids = (lotProducts || []).map(p => p.id);
    if (ids.length) query = query.in('product_id', ids);
    else return { data: [], count: 0 };
  }

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

export async function getMonthlyStats(lotId = null) {
  let query = supabase.from('sales').select('sell_price, profit, sold_at, product_id').order('sold_at');

  if (lotId) {
    const { data: lotProducts } = await supabase.from('products').select('id').eq('lot_id', lotId);
    const ids = (lotProducts || []).map(p => p.id);
    if (ids.length) query = query.in('product_id', ids);
    else return {};
  }

  const { data, error } = await query;
  if (error) throw error;

  const monthly = {};
  data.forEach(s => {
    const key = s.sold_at.substring(0, 7);
    if (!monthly[key]) monthly[key] = { revenue: 0, profit: 0 };
    monthly[key].revenue += s.sell_price || 0;
    monthly[key].profit += s.profit || 0;
  });
  return monthly;
}

export async function getMonthlyExpenses(lotId = null) {
  let query = supabase.from('expenses').select('amount, created_at').order('created_at');
  if (lotId) query = query.eq('lot_id', lotId);

  const { data, error } = await query;
  if (error) throw error;

  const monthly = {};
  data.forEach(e => {
    const key = e.created_at.substring(0, 7);
    if (!monthly[key]) monthly[key] = 0;
    monthly[key] += e.amount || 0;
  });
  return monthly;
}

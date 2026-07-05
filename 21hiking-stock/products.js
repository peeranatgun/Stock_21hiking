// products.js — Product management
import { supabase } from './supabase.js';

export async function getProducts({ search = '', brandId = '', status = '' } = {}) {
  let query = supabase
    .from('products')
    .select('*, brands(id, name)')
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);
  if (brandId) query = query.eq('brand_id', brandId);
  if (search) {
    query = query.or(`name.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;

  // Client-side brand name search
  if (search) {
    return data.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.brands?.name || '').toLowerCase().includes(search.toLowerCase())
    );
  }
  return data;
}

export async function getProductById(id) {
  const { data, error } = await supabase
    .from('products')
    .select('*, brands(id, name)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createProduct(payload) {
  const { data, error } = await supabase.from('products').insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function updateProduct(id, payload) {
  const { data, error } = await supabase.from('products').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteProduct(id) {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

export async function markAsSold(product) {
  // 1. Update product status
  const { error: updateError } = await supabase
    .from('products')
    .update({ status: 'sold' })
    .eq('id', product.id);
  if (updateError) throw updateError;

  // 2. Insert sale record
  const profit = (product.sell_price || 0) - (product.cost || 0);
  const { error: saleError } = await supabase.from('sales').insert({
    product_id: product.id,
    cost: product.cost,
    sell_price: product.sell_price,
    profit,
  });

  if (saleError) {
    // Rollback: revert status
    await supabase.from('products').update({ status: 'instock' }).eq('id', product.id);
    throw saleError;
  }
}

export async function getDashboardStats() {
  const [productsRes, salesRes, expensesRes] = await Promise.all([
    supabase.from('products').select('id, status'),
    supabase.from('sales').select('sell_price, profit'),
    supabase.from('expenses').select('amount'),
  ]);

  if (productsRes.error) throw productsRes.error;
  if (salesRes.error) throw salesRes.error;
  if (expensesRes.error) throw expensesRes.error;

  const products = productsRes.data;
  const sales = salesRes.data;
  const expenses = expensesRes.data;

  const inStock = products.filter(p => p.status === 'instock').length;
  const sold = products.filter(p => p.status === 'sold').length;
  const totalRevenue = sales.reduce((s, r) => s + (r.sell_price || 0), 0);
  const totalProfit = sales.reduce((s, r) => s + (r.profit || 0), 0);
  const totalExpense = expenses.reduce((s, r) => s + (r.amount || 0), 0);
  const netProfit = totalProfit - totalExpense;

  return { inStock, sold, totalRevenue, totalExpense, totalProfit, netProfit };
}

export async function getProductsByLot(lotId, { search = '', brandId = '', status = '' } = {}) {
  let query = supabase
    .from('products')
    .select('*, brands(id, name), lots(id, name)')
    .order('created_at', { ascending: false });

  if (lotId) query = query.eq('lot_id', lotId);
  if (status) query = query.eq('status', status);
  if (brandId) query = query.eq('brand_id', brandId);

  const { data, error } = await query;
  if (error) throw error;

  if (search) {
    return data.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.brands?.name || '').toLowerCase().includes(search.toLowerCase())
    );
  }
  return data;
}
export async function getDashboardStatsByLot(lotId) {
  if (!lotId) return getDashboardStats();

  const productsRes = await supabase.from('products').select('id, status, cost').eq('lot_id', lotId);
  if (productsRes.error) throw productsRes.error;

  const productIds = productsRes.data.map(p => p.id);

  const [salesRes, expensesRes] = await Promise.all([
    productIds.length
      ? supabase.from('sales').select('sell_price, profit').in('product_id', productIds)
      : Promise.resolve({ data: [], error: null }),
    supabase.from('expenses').select('amount').eq('lot_id', lotId),
  ]);

  const products = productsRes.data;
  const sales = salesRes.data || [];
  const expenses = expensesRes.data || [];

  const inStock = products.filter(p => p.status === 'instock').length;
  const sold = products.filter(p => p.status === 'sold').length;
  const totalRevenue = sales.reduce((s, r) => s + (r.sell_price || 0), 0);
  const totalProfit = sales.reduce((s, r) => s + (r.profit || 0), 0);
  const totalExpense = expenses.reduce((s, r) => s + (r.amount || 0), 0);
  const netProfit = totalProfit - totalExpense;

  return { inStock, sold, totalRevenue, totalExpense, totalProfit, netProfit };
}

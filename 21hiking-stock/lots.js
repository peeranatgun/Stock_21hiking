// lots.js — Lot management
import { supabase } from './supabase.js';

export async function getLots() {
  const { data, error } = await supabase
    .from('lots')
    .select('*, products(count)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createLot(name) {
  const { data, error } = await supabase
    .from('lots').insert({ name: name.trim() }).select().single();
  if (error) throw error;
  return data;
}

export async function updateLot(id, name) {
  const { data, error } = await supabase
    .from('lots').update({ name: name.trim() }).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteLot(id) {
  const { error } = await supabase.from('lots').delete().eq('id', id);
  if (error) throw error;
}

export async function setActiveLot(id) {
  // ปิด active ทั้งหมดก่อน
  await supabase.from('lots').update({ is_active: false }).neq('id', id);
  // เปิด active lot ที่เลือก
  const { data, error } = await supabase
    .from('lots').update({ is_active: true }).eq('id', id).select().single();
  if (error) throw error;
  // บันทึก active lot ใน localStorage
  localStorage.setItem('active_lot_id', id);
  localStorage.setItem('active_lot_name', data.name);
  return data;
}

export async function getActiveLot() {
  // ลอง localStorage ก่อน
  const storedId = localStorage.getItem('active_lot_id');
  if (storedId) {
    const { data } = await supabase.from('lots').select('*').eq('id', storedId).single();
    if (data) return data;
  }
  // ถ้าไม่มีให้ดึงจาก DB
  const { data } = await supabase.from('lots').select('*').eq('is_active', true).single();
  if (data) {
    localStorage.setItem('active_lot_id', data.id);
    localStorage.setItem('active_lot_name', data.name);
  }
  return data || null;
}

export async function getLotStats(lotId) {
  if (!lotId) return null;

  const productsRes = await supabase.from('products').select('id, status, cost').eq('lot_id', lotId);
  const productIds = (productsRes.data || []).map(p => p.id);

  const [salesRes, expensesRes] = await Promise.all([
    productIds.length
      ? supabase.from('sales').select('sell_price, profit').in('product_id', productIds)
      : Promise.resolve({ data: [] }),
    supabase.from('expenses').select('amount').eq('lot_id', lotId),
  ]);

  const products = productsRes.data || [];
  const sales = salesRes.data || [];
  const expenses = expensesRes.data || [];

  const inStock = products.filter(p => p.status === 'instock').length;
  const sold = products.filter(p => p.status === 'sold').length;
  const totalProfit = sales.reduce((s, r) => s + (r.profit || 0), 0);
  const totalExpense = expenses.reduce((s, r) => s + (r.amount || 0), 0);
  const netProfit = totalProfit - totalExpense;

  return { inStock, sold, totalProfit, totalExpense, netProfit };
}

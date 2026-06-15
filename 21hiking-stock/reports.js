// reports.js — Report generation & Excel export
import { supabase } from './supabase.js';

export async function getAllDataForExport() {
  const [productsRes, salesRes, expensesRes] = await Promise.all([
    supabase.from('products').select('*, brands(name)').order('created_at', { ascending: false }),
    supabase.from('sales').select('*, products(name, brands(name))').order('sold_at', { ascending: false }),
    supabase.from('expenses').select('*').order('created_at', { ascending: false }),
  ]);

  if (productsRes.error) throw productsRes.error;
  if (salesRes.error) throw salesRes.error;
  if (expensesRes.error) throw expensesRes.error;

  return {
    products: productsRes.data,
    sales: salesRes.data,
    expenses: expensesRes.data,
  };
}

export function exportToExcel(data) {
  const XLSX = window.XLSX;
  if (!XLSX) { alert('SheetJS not loaded'); return; }

  const wb = XLSX.utils.book_new();

  // Products sheet
  const productsSheet = XLSX.utils.json_to_sheet(data.products.map(p => ({
    'ชื่อสินค้า': p.name,
    'แบรนด์': p.brands?.name || '',
    'ไซส์': p.size || '',
    'สี': p.color || '',
    'ต้นทุน': p.cost,
    'ราคาขาย': p.sell_price,
    'สถานะ': p.status === 'instock' ? 'ในสต็อก' : 'ขายแล้ว',
    'วันที่เพิ่ม': new Date(p.created_at).toLocaleDateString('th-TH'),
  })));
  XLSX.utils.book_append_sheet(wb, productsSheet, 'สินค้า');

  // Sales sheet
  const salesSheet = XLSX.utils.json_to_sheet(data.sales.map(s => ({
    'วันที่ขาย': new Date(s.sold_at).toLocaleDateString('th-TH'),
    'สินค้า': s.products?.name || '',
    'แบรนด์': s.products?.brands?.name || '',
    'ต้นทุน': s.cost,
    'ราคาขาย': s.sell_price,
    'กำไร': s.profit,
  })));
  XLSX.utils.book_append_sheet(wb, salesSheet, 'ยอดขาย');

  // Expenses sheet
  const expensesSheet = XLSX.utils.json_to_sheet(data.expenses.map(e => ({
    'รายการ': e.title,
    'จำนวนเงิน': e.amount,
    'วันที่': new Date(e.created_at).toLocaleDateString('th-TH'),
  })));
  XLSX.utils.book_append_sheet(wb, expensesSheet, 'รายจ่าย');

  // Summary sheet
  const totalRevenue = data.sales.reduce((s, r) => s + (r.sell_price || 0), 0);
  const totalProfit = data.sales.reduce((s, r) => s + (r.profit || 0), 0);
  const totalExpense = data.expenses.reduce((s, r) => s + (r.amount || 0), 0);
  const summarySheet = XLSX.utils.json_to_sheet([
    { 'รายการ': 'รายรับรวม', 'จำนวนเงิน': totalRevenue },
    { 'รายการ': 'กำไรรวม', 'จำนวนเงิน': totalProfit },
    { 'รายการ': 'รายจ่ายรวม', 'จำนวนเงิน': totalExpense },
    { 'รายการ': 'กำไรสุทธิ', 'จำนวนเงิน': totalProfit - totalExpense },
  ]);
  XLSX.utils.book_append_sheet(wb, summarySheet, 'สรุป');

  XLSX.writeFile(wb, '21Hiking-Stock-Report.xlsx');
}

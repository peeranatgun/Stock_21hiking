// main.js — App entry point & page router

import { initApp, showToast, showConfirm, formatCurrency, formatDate, formatDatetime, debounce } from './app.js';
import { fetchBrands, fetchBrandsSimple, createBrand, updateBrand, deleteBrand } from './brands.js';
import { fetchProducts, fetchProductById, createProduct, updateProduct, deleteProduct, markAsSold } from './products.js';
import { fetchSales, fetchSalesSummary } from './sales.js';
import { fetchExpenses, createExpense, updateExpense, deleteExpense, fetchExpenseSummary } from './expenses.js';
import { fetchDashboardSummary, fetchMonthlyData, fetchAllForExport } from './reports.js';
import { uploadProductImage } from './storage.js';

// ============================================================
// INIT
// ============================================================
await initApp();

// Page titles for mobile header
const pageTitles = {
  dashboard: 'Dashboard',
  products: 'สินค้า',
  brands: 'แบรนด์',
  sales: 'ยอดขาย',
  expenses: 'รายจ่าย',
  reports: 'รายงาน'
};

let currentPage = 'dashboard';

// ============================================================
// NAVIGATION
// ============================================================
window.navigateTo = function(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const pageEl = document.getElementById(`page-${page}`);
  if (pageEl) pageEl.classList.add('active');

  const navEl = document.querySelector(`[data-nav="${page}"]`);
  if (navEl) navEl.classList.add('active');

  document.getElementById('mobile-page-title').textContent = pageTitles[page] || page;
  currentPage = page;

  // Load page data
  switch (page) {
    case 'dashboard': loadDashboard(); break;
    case 'products': loadProducts(); break;
    case 'brands': loadBrands(); break;
    case 'sales': loadSales(); break;
    case 'expenses': loadExpenses(); break;
    case 'reports': loadReports(); break;
  }
};

// Load dashboard on init
navigateTo('dashboard');

// ============================================================
// DASHBOARD
// ============================================================
let revenueChart = null;
let profitChart = null;

async function loadDashboard() {
  const grid = document.getElementById('summary-grid');
  grid.innerHTML = `<div class="loading-spinner" style="grid-column:1/-1"><div class="spinner"></div></div>`;

  try {
    const [summary, monthly] = await Promise.all([
      fetchDashboardSummary(),
      fetchMonthlyData()
    ]);

    grid.innerHTML = `
      ${summaryCard('📦', 'ในสต็อก', summary.instockCount + ' ชิ้น', 'neutral', 'icon-bg-gray')}
      ${summaryCard('✅', 'ขายแล้ว', summary.soldCount + ' ชิ้น', 'neutral', 'icon-bg-green')}
      ${summaryCard('💰', 'รายรับรวม', formatCurrency(summary.totalRevenue), 'neutral', 'icon-bg-blue')}
      ${summaryCard('💸', 'รายจ่ายรวม', formatCurrency(summary.totalExpense), 'neutral', 'icon-bg-orange')}
      ${summaryCard('📈', 'กำไรรวม', formatCurrency(summary.totalProfit), summary.totalProfit >= 0 ? 'positive' : 'negative', 'icon-bg-green')}
      ${summaryCard('🏆', 'กำไรสุทธิ', formatCurrency(summary.netProfit), summary.netProfit >= 0 ? 'positive' : 'negative', summary.netProfit >= 0 ? 'icon-bg-green' : 'icon-bg-red')}
    `;

    renderDashboardCharts(monthly);
  } catch (e) {
    grid.innerHTML = `<p style="color:var(--accent-red);padding:20px;">เกิดข้อผิดพลาด: ${e.message}</p>`;
  }
}

function summaryCard(icon, label, value, colorClass, iconBg) {
  return `
    <div class="summary-card">
      <div class="summary-icon ${iconBg}">${icon}</div>
      <div class="summary-label">${label}</div>
      <div class="summary-value ${colorClass}">${value}</div>
    </div>
  `;
}

function renderDashboardCharts(monthly) {
  const labels = monthly.map(m => m.month);
  const revenues = monthly.map(m => m.revenue);
  const profits = monthly.map(m => m.profit - m.expense);

  const chartDefaults = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { size: 11 }, callback: v => '฿' + v.toLocaleString() } }
    }
  };

  if (revenueChart) revenueChart.destroy();
  revenueChart = new Chart(document.getElementById('chart-revenue'), {
    type: 'bar',
    data: { labels, datasets: [{ data: revenues, backgroundColor: 'rgba(0,122,255,0.15)', borderColor: '#007aff', borderWidth: 2, borderRadius: 6 }] },
    options: chartDefaults
  });

  if (profitChart) profitChart.destroy();
  profitChart = new Chart(document.getElementById('chart-profit'), {
    type: 'line',
    data: { labels, datasets: [{ data: profits, borderColor: '#34c759', backgroundColor: 'rgba(52,199,89,0.1)', borderWidth: 2, fill: true, tension: 0.4, pointRadius: 4 }] },
    options: chartDefaults
  });
}

// ============================================================
// PRODUCTS
// ============================================================
let productFilters = { search: '', brandId: '', status: '' };
let productImageUrl = null;
let isUploadingImage = false;

async function loadProducts() {
  const grid = document.getElementById('products-grid');
  grid.innerHTML = `<div class="loading-spinner" style="grid-column:1/-1"><div class="spinner"></div></div>`;

  try {
    const [products, brands] = await Promise.all([
      fetchProducts(productFilters),
      fetchBrandsSimple()
    ]);

    // Populate brand filter
    const filterBrand = document.getElementById('filter-brand');
    const currentVal = filterBrand.value;
    filterBrand.innerHTML = '<option value="">ทุกแบรนด์</option>' +
      brands.map(b => `<option value="${b.id}" ${b.id === currentVal ? 'selected' : ''}>${b.name}</option>`).join('');

    const instock = products.filter(p => p.status === 'instock').length;
    document.getElementById('products-subtitle').textContent =
      `ทั้งหมด ${products.length} รายการ · ในสต็อก ${instock} ชิ้น`;

    if (products.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-icon">👕</div>
          <div class="empty-title">ยังไม่มีสินค้า</div>
          <div class="empty-desc">เริ่มเพิ่มสินค้าเพื่อจัดการสต็อก</div>
          <button class="btn btn-primary" onclick="openProductModal()">+ เพิ่มสินค้า</button>
        </div>`;
      return;
    }

    grid.innerHTML = products.map(p => productCard(p)).join('');
  } catch (e) {
    grid.innerHTML = `<p style="color:var(--accent-red);padding:20px;grid-column:1/-1">เกิดข้อผิดพลาด: ${e.message}</p>`;
  }
}

function productCard(p) {
  const imgHtml = p.image_url
    ? `<img src="${p.image_url}" alt="${escHtml(p.name)}" loading="lazy" />`
    : `<div class="product-image-placeholder">👕</div>`;

  const badge = p.status === 'instock'
    ? `<span class="product-status-badge badge-instock">ในสต็อก</span>`
    : `<span class="product-status-badge badge-sold">ขายแล้ว</span>`;

  const soldBtn = p.status === 'instock'
    ? `<button class="btn btn-success btn-sm" onclick="handleMarkAsSold('${p.id}')">ขายแล้ว</button>`
    : '';

  return `
    <div class="product-card" data-id="${p.id}">
      <div class="product-image">
        ${imgHtml}
        ${badge}
      </div>
      <div class="product-info">
        <div class="product-brand">${escHtml(p.brands?.name || '—')}</div>
        <div class="product-name">${escHtml(p.name)}</div>
        <div class="product-prices">
          <span class="price-cost">ต้นทุน ${formatCurrency(p.cost)}</span>
          <span class="price-sell">ขาย ${formatCurrency(p.sell_price)}</span>
        </div>
      </div>
      <div class="product-actions">
        <button class="btn btn-icon btn-sm" title="ดูรายละเอียด" onclick="viewProduct('${p.id}')">👁</button>
        <button class="btn btn-icon btn-sm" title="แก้ไข" onclick="editProduct('${p.id}')">✏️</button>
        <button class="btn btn-icon btn-sm btn-danger" title="ลบ" onclick="handleDeleteProduct('${p.id}', '${escHtml(p.name)}')">🗑️</button>
        ${soldBtn}
      </div>
    </div>
  `;
}

// Search & filter setup
const searchInput = document.getElementById('product-search');
const filterBrandEl = document.getElementById('filter-brand');
const filterStatusEl = document.getElementById('filter-status');

searchInput?.addEventListener('input', debounce(() => {
  productFilters.search = searchInput.value;
  loadProducts();
}, 300));

filterBrandEl?.addEventListener('change', () => {
  productFilters.brandId = filterBrandEl.value;
  loadProducts();
});

filterStatusEl?.addEventListener('change', () => {
  productFilters.status = filterStatusEl.value;
  loadProducts();
});

// Product Modal
window.openProductModal = function(product = null) {
  productImageUrl = product?.image_url || null;
  document.getElementById('product-id').value = product?.id || '';
  document.getElementById('product-name').value = product?.name || '';
  document.getElementById('product-brand').value = product?.brand_id || '';
  document.getElementById('product-size').value = product?.size || '';
  document.getElementById('product-color').value = product?.color || '';
  document.getElementById('product-cost').value = product?.cost || '';
  document.getElementById('product-sell-price').value = product?.sell_price || '';
  document.getElementById('product-description').value = product?.description || '';
  document.getElementById('product-modal-title').textContent = product ? 'แก้ไขสินค้า' : 'เพิ่มสินค้า';

  const area = document.getElementById('image-upload-area');
  if (product?.image_url) {
    area.classList.add('has-image');
    area.innerHTML = `<img src="${product.image_url}" alt="product" /><input type="file" id="product-image-file" accept="image/jpeg,image/png,image/webp" />`;
  } else {
    area.classList.remove('has-image');
    area.innerHTML = `<div class="upload-icon">📷</div><div class="upload-text">แตะเพื่ออัพโหลด<br/>JPG, PNG, WEBP</div><input type="file" id="product-image-file" accept="image/jpeg,image/png,image/webp" />`;
  }

  // Re-attach file input listener
  document.getElementById('product-image-file').addEventListener('change', handleImageChange);

  // Populate brand select
  fetchBrandsSimple().then(brands => {
    const sel = document.getElementById('product-brand');
    sel.innerHTML = '<option value="">เลือกแบรนด์</option>' +
      brands.map(b => `<option value="${b.id}" ${b.id === product?.brand_id ? 'selected' : ''}>${b.name}</option>`).join('');
  });

  document.getElementById('modal-product').classList.remove('hidden');
};

window.closeProductModal = function() {
  document.getElementById('modal-product').classList.add('hidden');
};

async function handleImageChange(e) {
  const file = e.target.files[0];
  if (!file) return;

  const area = document.getElementById('image-upload-area');
  const progress = document.getElementById('upload-progress');
  progress.style.display = 'block';
  isUploadingImage = true;

  try {
    productImageUrl = await uploadProductImage(file);
    area.classList.add('has-image');
    area.innerHTML = `<img src="${productImageUrl}" alt="preview" /><input type="file" id="product-image-file" accept="image/jpeg,image/png,image/webp" />`;
    document.getElementById('product-image-file').addEventListener('change', handleImageChange);
    showToast('อัพโหลดรูปสำเร็จ', 'success');
  } catch (err) {
    showToast('อัพโหลดรูปไม่สำเร็จ: ' + err.message, 'error');
  } finally {
    isUploadingImage = false;
    progress.style.display = 'none';
  }
}

document.getElementById('btn-add-product')?.addEventListener('click', () => openProductModal());

document.getElementById('btn-save-product')?.addEventListener('click', async () => {
  if (isUploadingImage) { showToast('กรุณารอให้รูปอัพโหลดเสร็จก่อน', 'warning'); return; }

  const id = document.getElementById('product-id').value;
  const name = document.getElementById('product-name').value.trim();
  const cost = parseFloat(document.getElementById('product-cost').value);
  const sell_price = parseFloat(document.getElementById('product-sell-price').value);

  if (!name) { showToast('กรุณากรอกชื่อสินค้า', 'warning'); return; }
  if (isNaN(cost) || isNaN(sell_price)) { showToast('กรุณากรอกต้นทุนและราคาขาย', 'warning'); return; }

  const payload = {
    name,
    brand_id: document.getElementById('product-brand').value || null,
    size: document.getElementById('product-size').value.trim() || null,
    color: document.getElementById('product-color').value.trim() || null,
    description: document.getElementById('product-description').value.trim() || null,
    cost,
    sell_price,
    image_url: productImageUrl || null
  };

  const btn = document.getElementById('btn-save-product');
  btn.disabled = true;
  btn.textContent = 'กำลังบันทึก...';

  try {
    if (id) {
      await updateProduct(id, payload);
      showToast('แก้ไขสินค้าสำเร็จ', 'success');
    } else {
      await createProduct(payload);
      showToast('เพิ่มสินค้าสำเร็จ', 'success');
    }
    closeProductModal();
    loadProducts();
  } catch (e) {
    showToast('เกิดข้อผิดพลาด: ' + e.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'บันทึกสินค้า';
  }
});

window.editProduct = async function(id) {
  try {
    const product = await fetchProductById(id);
    openProductModal(product);
  } catch (e) {
    showToast('ไม่สามารถโหลดข้อมูลได้', 'error');
  }
};

window.viewProduct = async function(id) {
  try {
    const p = await fetchProductById(id);
    const profit = (p.sell_price || 0) - (p.cost || 0);
    const body = document.getElementById('product-view-body');
    body.innerHTML = `
      ${p.image_url
        ? `<img class="product-detail-img" src="${p.image_url}" alt="${escHtml(p.name)}" />`
        : `<div class="product-detail-placeholder">👕</div>`
      }
      <div class="detail-row"><span class="detail-label">ชื่อสินค้า</span><span class="detail-value">${escHtml(p.name)}</span></div>
      <div class="detail-row"><span class="detail-label">แบรนด์</span><span class="detail-value">${escHtml(p.brands?.name || '—')}</span></div>
      <div class="detail-row"><span class="detail-label">ไซส์</span><span class="detail-value">${escHtml(p.size || '—')}</span></div>
      <div class="detail-row"><span class="detail-label">สี</span><span class="detail-value">${escHtml(p.color || '—')}</span></div>
      <div class="detail-row"><span class="detail-label">ต้นทุน</span><span class="detail-value">${formatCurrency(p.cost)}</span></div>
      <div class="detail-row"><span class="detail-label">ราคาขาย</span><span class="detail-value">${formatCurrency(p.sell_price)}</span></div>
      <div class="detail-row"><span class="detail-label">กำไร</span><span class="detail-value" style="color:${profit >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'}">${formatCurrency(profit)}</span></div>
      <div class="detail-row"><span class="detail-label">สถานะ</span><span class="detail-value">${p.status === 'instock' ? '<span class="chip chip-green">ในสต็อก</span>' : '<span class="chip chip-gray">ขายแล้ว</span>'}</span></div>
      <div class="detail-row"><span class="detail-label">เพิ่มเมื่อ</span><span class="detail-value">${formatDatetime(p.created_at)}</span></div>
      ${p.description ? `<div style="margin-top:12px;font-size:14px;color:var(--text-secondary);line-height:1.5;">${escHtml(p.description)}</div>` : ''}
    `;
    document.getElementById('modal-view-product').classList.remove('hidden');
  } catch (e) {
    showToast('ไม่สามารถโหลดข้อมูลได้', 'error');
  }
};

window.handleDeleteProduct = async function(id, name) {
  const ok = await showConfirm({
    title: 'ลบสินค้า',
    message: `ต้องการลบ "${name}" ใช่หรือไม่? ไม่สามารถย้อนกลับได้`,
    confirmText: 'ลบ',
    icon: '🗑️',
    iconBg: '#fff1f0'
  });
  if (!ok) return;

  try {
    await deleteProduct(id);
    showToast('ลบสินค้าสำเร็จ', 'success');
    loadProducts();
    if (currentPage === 'dashboard') loadDashboard();
  } catch (e) {
    showToast('ลบไม่สำเร็จ: ' + e.message, 'error');
  }
};

window.handleMarkAsSold = async function(id) {
  try {
    const product = await fetchProductById(id);
    const profit = (product.sell_price || 0) - (product.cost || 0);

    const ok = await showConfirm({
      title: 'ยืนยันการขาย',
      message: `ขาย "${product.name}" ในราคา ${formatCurrency(product.sell_price)} กำไร ${formatCurrency(profit)}`,
      confirmText: 'ยืนยันการขาย',
      confirmClass: 'btn-success',
      icon: '🛍️',
      iconBg: '#e8faf0'
    });
    if (!ok) return;

    await markAsSold(product);
    showToast('บันทึกการขายสำเร็จ ✓', 'success');
    loadProducts();
    if (currentPage === 'dashboard') loadDashboard();
    if (currentPage === 'sales') loadSales();
  } catch (e) {
    showToast('เกิดข้อผิดพลาด: ' + e.message, 'error');
  }
};

// ============================================================
// BRANDS
// ============================================================
async function loadBrands() {
  const grid = document.getElementById('brands-grid');
  grid.innerHTML = `<div class="loading-spinner" style="grid-column:1/-1"><div class="spinner"></div></div>`;

  try {
    const brands = await fetchBrands();

    if (brands.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-icon">🏷️</div>
          <div class="empty-title">ยังไม่มีแบรนด์</div>
          <div class="empty-desc">เพิ่มแบรนด์เพื่อจัดหมวดหมู่สินค้า</div>
          <button class="btn btn-primary" onclick="openBrandModal()">+ เพิ่มแบรนด์</button>
        </div>`;
      return;
    }

    grid.innerHTML = brands.map(b => `
      <div class="brand-card">
        <div class="brand-name">${escHtml(b.name)}</div>
        <div class="brand-count">${b.products?.[0]?.count || 0} สินค้า</div>
        <div class="brand-actions">
          <button class="btn btn-secondary btn-sm" onclick="openBrandModal('${b.id}', '${escHtml(b.name)}')">แก้ไข</button>
          <button class="btn btn-danger btn-sm" onclick="handleDeleteBrand('${b.id}', '${escHtml(b.name)}')">ลบ</button>
        </div>
      </div>
    `).join('');
  } catch (e) {
    grid.innerHTML = `<p style="color:var(--accent-red);padding:20px;">เกิดข้อผิดพลาด: ${e.message}</p>`;
  }
}

window.openBrandModal = function(id = '', name = '') {
  document.getElementById('brand-id').value = id;
  document.getElementById('brand-name').value = name;
  document.getElementById('brand-modal-title').textContent = id ? 'แก้ไขแบรนด์' : 'เพิ่มแบรนด์';
  document.getElementById('modal-brand').classList.remove('hidden');
  setTimeout(() => document.getElementById('brand-name').focus(), 50);
};

document.getElementById('btn-add-brand')?.addEventListener('click', () => openBrandModal());

document.getElementById('btn-save-brand')?.addEventListener('click', async () => {
  const id = document.getElementById('brand-id').value;
  const name = document.getElementById('brand-name').value.trim();
  if (!name) { showToast('กรุณากรอกชื่อแบรนด์', 'warning'); return; }

  const btn = document.getElementById('btn-save-brand');
  btn.disabled = true;

  try {
    if (id) {
      await updateBrand(id, name);
      showToast('แก้ไขแบรนด์สำเร็จ', 'success');
    } else {
      await createBrand(name);
      showToast('เพิ่มแบรนด์สำเร็จ', 'success');
    }
    document.getElementById('modal-brand').classList.add('hidden');
    loadBrands();
  } catch (e) {
    showToast('เกิดข้อผิดพลาด: ' + e.message, 'error');
  } finally {
    btn.disabled = false;
  }
});

window.handleDeleteBrand = async function(id, name) {
  const ok = await showConfirm({
    title: 'ลบแบรนด์',
    message: `ต้องการลบแบรนด์ "${name}" ใช่หรือไม่?`,
    confirmText: 'ลบ', icon: '🗑️', iconBg: '#fff1f0'
  });
  if (!ok) return;

  try {
    await deleteBrand(id);
    showToast('ลบแบรนด์สำเร็จ', 'success');
    loadBrands();
  } catch (e) {
    showToast('ลบไม่สำเร็จ: ' + e.message, 'error');
  }
};

// ============================================================
// SALES
// ============================================================
let salesPage = 1;
const SALES_PAGE_SIZE = 20;
let salesSearch = '';

async function loadSales() {
  const tbody = document.getElementById('sales-tbody');
  tbody.innerHTML = `<tr><td colspan="6"><div class="loading-spinner"><div class="spinner"></div></div></td></tr>`;

  try {
    const { data, count } = await fetchSales({ search: salesSearch, page: salesPage, pageSize: SALES_PAGE_SIZE });

    document.getElementById('sales-subtitle').textContent = `${count || 0} รายการขาย`;

    if (data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">📊</div><div class="empty-title">ยังไม่มียอดขาย</div></div></td></tr>`;
      document.getElementById('sales-pagination').innerHTML = '';
      return;
    }

    tbody.innerHTML = data.map(s => `
      <tr>
        <td class="td-muted">${formatDate(s.sold_at)}</td>
        <td><strong>${escHtml(s.products?.name || '—')}</strong></td>
        <td class="td-muted">${escHtml(s.products?.brands?.name || '—')}</td>
        <td class="td-amount">${formatCurrency(s.cost)}</td>
        <td class="td-amount">${formatCurrency(s.sell_price)}</td>
        <td class="td-amount td-profit">${formatCurrency(s.profit)}</td>
      </tr>
    `).join('');

    renderPagination('sales-pagination', count, salesPage, SALES_PAGE_SIZE, p => { salesPage = p; loadSales(); });
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="6" style="color:var(--accent-red);padding:20px;">เกิดข้อผิดพลาด: ${e.message}</td></tr>`;
  }
}

document.getElementById('sales-search')?.addEventListener('input', debounce((e) => {
  salesSearch = e.target.value;
  salesPage = 1;
  loadSales();
}, 300));

function renderPagination(containerId, total, current, pageSize, onPage) {
  const container = document.getElementById(containerId);
  const pages = Math.ceil(total / pageSize);
  if (pages <= 1) { container.innerHTML = ''; return; }

  let html = `<button class="page-btn" ${current === 1 ? 'disabled' : ''} onclick="(${onPage})(${current - 1})">‹</button>`;
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || Math.abs(i - current) <= 1) {
      html += `<button class="page-btn ${i === current ? 'active' : ''}" onclick="(${onPage})(${i})">${i}</button>`;
    } else if (Math.abs(i - current) === 2) {
      html += `<span class="page-info">…</span>`;
    }
  }
  html += `<button class="page-btn" ${current === pages ? 'disabled' : ''} onclick="(${onPage})(${current + 1})">›</button>`;
  container.innerHTML = html;
}

// ============================================================
// EXPENSES
// ============================================================
async function loadExpenses() {
  const list = document.getElementById('expenses-list');
  list.innerHTML = `<div class="loading-spinner"><div class="spinner"></div></div>`;

  try {
    const expenses = await fetchExpenses();
    const total = expenses.reduce((s, e) => s + (e.amount || 0), 0);
    document.getElementById('expenses-subtitle').textContent =
      `${expenses.length} รายการ · รวม ${formatCurrency(total)}`;

    if (expenses.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">💸</div>
          <div class="empty-title">ยังไม่มีรายจ่าย</div>
          <div class="empty-desc">บันทึกรายจ่ายเพื่อคำนวณกำไรสุทธิ</div>
          <button class="btn btn-primary" onclick="openExpenseModal()">+ เพิ่มรายจ่าย</button>
        </div>`;
      return;
    }

    list.innerHTML = expenses.map(e => `
      <div class="expense-item">
        <div>
          <div class="expense-title">${escHtml(e.title)}</div>
          <div class="expense-date">${formatDatetime(e.created_at)}</div>
        </div>
        <div style="display:flex;align-items:center;">
          <span class="expense-amount">${formatCurrency(e.amount)}</span>
          <button class="btn btn-icon btn-sm" onclick="openExpenseModal('${e.id}', '${escHtml(e.title)}', ${e.amount})" title="แก้ไข">✏️</button>
          <button class="btn btn-icon btn-sm" onclick="handleDeleteExpense('${e.id}', '${escHtml(e.title)}')" title="ลบ" style="color:var(--accent-red);">🗑️</button>
        </div>
      </div>
    `).join('');
  } catch (e) {
    list.innerHTML = `<p style="color:var(--accent-red);">เกิดข้อผิดพลาด: ${e.message}</p>`;
  }
}

window.openExpenseModal = function(id = '', title = '', amount = '') {
  document.getElementById('expense-id').value = id;
  document.getElementById('expense-title').value = title;
  document.getElementById('expense-amount').value = amount;
  document.getElementById('expense-modal-title').textContent = id ? 'แก้ไขรายจ่าย' : 'เพิ่มรายจ่าย';
  document.getElementById('modal-expense').classList.remove('hidden');
  setTimeout(() => document.getElementById('expense-title').focus(), 50);
};

document.getElementById('btn-add-expense')?.addEventListener('click', () => openExpenseModal());

document.getElementById('btn-save-expense')?.addEventListener('click', async () => {
  const id = document.getElementById('expense-id').value;
  const title = document.getElementById('expense-title').value.trim();
  const amount = parseFloat(document.getElementById('expense-amount').value);

  if (!title) { showToast('กรุณากรอกรายการ', 'warning'); return; }
  if (isNaN(amount) || amount <= 0) { showToast('กรุณากรอกจำนวนเงิน', 'warning'); return; }

  const btn = document.getElementById('btn-save-expense');
  btn.disabled = true;

  try {
    if (id) {
      await updateExpense(id, { title, amount });
      showToast('แก้ไขรายจ่ายสำเร็จ', 'success');
    } else {
      await createExpense({ title, amount });
      showToast('บันทึกรายจ่ายสำเร็จ', 'success');
    }
    document.getElementById('modal-expense').classList.add('hidden');
    loadExpenses();
    if (currentPage === 'dashboard') loadDashboard();
  } catch (e) {
    showToast('เกิดข้อผิดพลาด: ' + e.message, 'error');
  } finally {
    btn.disabled = false;
  }
});

window.handleDeleteExpense = async function(id, title) {
  const ok = await showConfirm({
    title: 'ลบรายจ่าย',
    message: `ต้องการลบรายการ "${title}" ใช่หรือไม่?`,
    confirmText: 'ลบ', icon: '🗑️', iconBg: '#fff1f0'
  });
  if (!ok) return;

  try {
    await deleteExpense(id);
    showToast('ลบรายจ่ายสำเร็จ', 'success');
    loadExpenses();
    if (currentPage === 'dashboard') loadDashboard();
  } catch (e) {
    showToast('ลบไม่สำเร็จ: ' + e.message, 'error');
  }
};

// ============================================================
// REPORTS
// ============================================================
let monthlyRevenueChart = null;
let monthlyProfitChart = null;
let monthlyExpenseChart = null;

async function loadReports() {
  const summaryEl = document.getElementById('report-summary');
  summaryEl.innerHTML = `<div class="loading-spinner" style="grid-column:1/-1"><div class="spinner"></div></div>`;

  try {
    const [summary, monthly] = await Promise.all([
      fetchDashboardSummary(),
      fetchMonthlyData()
    ]);

    summaryEl.innerHTML = `
      ${summaryCard('💰', 'รายรับรวม', formatCurrency(summary.totalRevenue), 'neutral', 'icon-bg-blue')}
      ${summaryCard('💸', 'รายจ่ายรวม', formatCurrency(summary.totalExpense), 'neutral', 'icon-bg-orange')}
      ${summaryCard('📈', 'กำไรรวม', formatCurrency(summary.totalProfit), summary.totalProfit >= 0 ? 'positive' : 'negative', 'icon-bg-green')}
      ${summaryCard('🏆', 'กำไรสุทธิ', formatCurrency(summary.netProfit), summary.netProfit >= 0 ? 'positive' : 'negative', summary.netProfit >= 0 ? 'icon-bg-green' : 'icon-bg-red')}
    `;

    renderReportCharts(monthly);
  } catch (e) {
    summaryEl.innerHTML = `<p style="color:var(--accent-red);">เกิดข้อผิดพลาด: ${e.message}</p>`;
  }
}

function renderReportCharts(monthly) {
  const labels = monthly.map(m => m.month);
  const revenues = monthly.map(m => m.revenue);
  const profits = monthly.map(m => m.profit);
  const expenses = monthly.map(m => m.expense);

  const opts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { size: 11 }, callback: v => '฿' + v.toLocaleString() } }
    }
  };

  if (monthlyRevenueChart) monthlyRevenueChart.destroy();
  monthlyRevenueChart = new Chart(document.getElementById('chart-monthly-revenue'), {
    type: 'bar',
    data: { labels, datasets: [{ data: revenues, backgroundColor: 'rgba(0,122,255,0.15)', borderColor: '#007aff', borderWidth: 2, borderRadius: 6 }] },
    options: opts
  });

  if (monthlyProfitChart) monthlyProfitChart.destroy();
  monthlyProfitChart = new Chart(document.getElementById('chart-monthly-profit'), {
    type: 'line',
    data: { labels, datasets: [{ data: profits, borderColor: '#34c759', backgroundColor: 'rgba(52,199,89,0.1)', borderWidth: 2, fill: true, tension: 0.4, pointRadius: 4 }] },
    options: opts
  });

  if (monthlyExpenseChart) monthlyExpenseChart.destroy();
  monthlyExpenseChart = new Chart(document.getElementById('chart-monthly-expense'), {
    type: 'bar',
    data: { labels, datasets: [{ data: expenses, backgroundColor: 'rgba(255,59,48,0.12)', borderColor: '#ff3b30', borderWidth: 2, borderRadius: 6 }] },
    options: opts
  });
}

// ============================================================
// EXPORT EXCEL
// ============================================================
document.getElementById('btn-export')?.addEventListener('click', async () => {
  const btn = document.getElementById('btn-export');
  btn.disabled = true;
  btn.textContent = 'กำลัง Export...';

  try {
    const { products, sales, expenses } = await fetchAllForExport();
    const wb = XLSX.utils.book_new();

    // Products sheet
    const productsData = products.map(p => ({
      'ชื่อสินค้า': p.name,
      'แบรนด์': p.brands?.name || '',
      'ไซส์': p.size || '',
      'สี': p.color || '',
      'ต้นทุน': p.cost,
      'ราคาขาย': p.sell_price,
      'กำไร': (p.sell_price || 0) - (p.cost || 0),
      'สถานะ': p.status === 'instock' ? 'ในสต็อก' : 'ขายแล้ว',
      'วันที่เพิ่ม': formatDate(p.created_at)
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(productsData), 'Products');

    // Sales sheet
    const salesData = sales.map(s => ({
      'วันที่ขาย': formatDatetime(s.sold_at),
      'สินค้า': s.products?.name || '',
      'แบรนด์': s.products?.brands?.name || '',
      'ต้นทุน': s.cost,
      'ราคาขาย': s.sell_price,
      'กำไร': s.profit
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(salesData), 'Sales');

    // Expenses sheet
    const expensesData = expenses.map(e => ({
      'รายการ': e.title,
      'จำนวนเงิน': e.amount,
      'วันที่': formatDate(e.created_at)
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expensesData), 'Expenses');

    // Summary sheet
    const totalRevenue = sales.reduce((s, r) => s + (r.sell_price || 0), 0);
    const totalProfit = sales.reduce((s, r) => s + (r.profit || 0), 0);
    const totalExpense = expenses.reduce((s, r) => s + (r.amount || 0), 0);
    const summaryData = [
      { 'รายการ': 'รายรับรวม', 'จำนวน': totalRevenue },
      { 'รายการ': 'รายจ่ายรวม', 'จำนวน': totalExpense },
      { 'รายการ': 'กำไรรวม', 'จำนวน': totalProfit },
      { 'รายการ': 'กำไรสุทธิ', 'จำนวน': totalProfit - totalExpense },
      { 'รายการ': 'จำนวนสินค้าทั้งหมด', 'จำนวน': products.length },
      { 'รายการ': 'ยอดขายทั้งหมด', 'จำนวน': sales.length }
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryData), 'Summary');

    XLSX.writeFile(wb, '21Hiking-Stock-Report.xlsx');
    showToast('Export สำเร็จ', 'success');
  } catch (e) {
    showToast('Export ไม่สำเร็จ: ' + e.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = '⬇️ Export Excel';
  }
});

// ============================================================
// UTILITIES
// ============================================================
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Close modals on backdrop click
document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
  backdrop.addEventListener('click', e => {
    if (e.target === backdrop) backdrop.classList.add('hidden');
  });
});

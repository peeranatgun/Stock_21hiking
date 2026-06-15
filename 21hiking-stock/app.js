// app.js — Shared UI utilities: Toast, Modal, Confirm, Navigation
import { logout, requireAuth } from './auth.js';

// ── Toast ──────────────────────────────────────
export function showToast(message, type = 'success') {
  const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || ''}</span><span>${message}</span>`;
  container.appendChild(toast);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('show'));
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 350);
  }, 3200);
}

// ── Modal ──────────────────────────────────────
let activeModal = null;

export function openModal(id) {
  const overlay = document.getElementById(id);
  if (!overlay) return;
  overlay.classList.add('active');
  activeModal = overlay;
  document.body.style.overflow = 'hidden';
}

export function closeModal(id) {
  const overlay = id ? document.getElementById(id) : activeModal;
  if (!overlay) return;
  overlay.classList.remove('active');
  activeModal = null;
  document.body.style.overflow = '';
}

export function setupModalClose(id) {
  const overlay = document.getElementById(id);
  if (!overlay) return;
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeModal(id);
  });
  overlay.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(id));
  });
}

// ── Confirm dialog ─────────────────────────────
export function confirm({ icon = '🗑️', title, desc, confirmText = 'ยืนยัน', confirmClass = 'btn-red', onConfirm }) {
  const overlay = document.getElementById('confirm-modal');
  if (!overlay) return;

  overlay.querySelector('.confirm-icon').textContent = icon;
  overlay.querySelector('.confirm-title').textContent = title;
  overlay.querySelector('.confirm-desc').textContent = desc;

  const confirmBtn = overlay.querySelector('#confirm-ok');
  confirmBtn.textContent = confirmText;
  confirmBtn.className = `btn ${confirmClass}`;

  const newBtn = confirmBtn.cloneNode(true);
  confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
  newBtn.addEventListener('click', () => {
    closeModal('confirm-modal');
    onConfirm();
  });

  openModal('confirm-modal');
}

// ── Format helpers ─────────────────────────────
export function formatCurrency(n) {
  if (n == null) return '—';
  return new Intl.NumberFormat('th-TH', { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n) + ' ฿';
}

export function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ── Loading ────────────────────────────────────
export function setLoading(containerId, isLoading) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (isLoading) {
    el.innerHTML = `<div class="loading-overlay"><div class="spinner"></div><span>กำลังโหลด…</span></div>`;
  }
}

// ── Navigation init ────────────────────────────
export async function initApp() {
  const session = await requireAuth();
  if (!session) return null;

  // Logout button
  document.querySelectorAll('[data-logout]').forEach(btn => {
    btn.addEventListener('click', () => logout());
  });

  // Mobile sidebar toggle
  const hamburger = document.getElementById('hamburger');
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebar-overlay');

  if (hamburger && sidebar) {
    hamburger.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      sidebarOverlay?.classList.toggle('active');
    });
    sidebarOverlay?.addEventListener('click', () => {
      sidebar.classList.remove('open');
      sidebarOverlay.classList.remove('active');
    });
  }

  // Highlight active nav item
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-item[data-page]').forEach(el => {
    if (el.dataset.page === currentPath) el.classList.add('active');
  });

  // Set user info
  const user = session.user;
  const emailEl = document.getElementById('user-email');
  if (emailEl) emailEl.textContent = user.email;

  return session;
}

// ── Pagination helper ──────────────────────────
export function renderPagination(container, currentPage, totalCount, perPage, onPageChange) {
  const totalPages = Math.ceil(totalCount / perPage);
  container.innerHTML = '';
  if (totalPages <= 1) return;

  const prev = document.createElement('button');
  prev.className = 'btn btn-ghost btn-sm';
  prev.textContent = '← ก่อน';
  prev.disabled = currentPage <= 1;
  prev.addEventListener('click', () => onPageChange(currentPage - 1));
  container.appendChild(prev);

  const info = document.createElement('span');
  info.style.fontSize = '13px';
  info.style.color = 'var(--text-secondary)';
  info.textContent = `${currentPage} / ${totalPages}`;
  container.appendChild(info);

  const next = document.createElement('button');
  next.className = 'btn btn-ghost btn-sm';
  next.textContent = 'ถัดไป →';
  next.disabled = currentPage >= totalPages;
  next.addEventListener('click', () => onPageChange(currentPage + 1));
  container.appendChild(next);
}

// ── Debounce ───────────────────────────────────
export function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

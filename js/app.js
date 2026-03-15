// ============================================================
// app.js  —  Global Utilities & Shared Logic
// ============================================================

// ── Custom Cursor ──────────────────────────────────────────
export function initCursor() {
  const cursor     = document.getElementById('cursor');
  const cursorRing = document.getElementById('cursor-ring');
  if (!cursor || !cursorRing) return;

  let mouseX = 0, mouseY = 0;
  let ringX  = 0, ringY  = 0;

  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursor.style.left = mouseX + 'px';
    cursor.style.top  = mouseY + 'px';
  });

  // Smooth ring follow
  function animateRing() {
    ringX += (mouseX - ringX) * 0.12;
    ringY += (mouseY - ringY) * 0.12;
    cursorRing.style.left = ringX + 'px';
    cursorRing.style.top  = ringY + 'px';
    requestAnimationFrame(animateRing);
  }
  animateRing();

  // Hover effects
  document.querySelectorAll('a, button, [role="button"], .product-card, .cat-item').forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.style.width  = '20px';
      cursor.style.height = '20px';
      cursorRing.style.width  = '60px';
      cursorRing.style.height = '60px';
    });
    el.addEventListener('mouseleave', () => {
      cursor.style.width  = '12px';
      cursor.style.height = '12px';
      cursorRing.style.width  = '36px';
      cursorRing.style.height = '36px';
    });
  });
}

// ── Scroll-based Nav ──────────────────────────────────────
export function initNav() {
  const nav = document.querySelector('.nav');
  if (!nav) return;
  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 50);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// ── Mobile Menu ───────────────────────────────────────────
export function initMobileMenu() {
  const burger  = document.querySelector('.nav__burger');
  const menu    = document.querySelector('.mobile-menu');
  const overlay = document.querySelector('.mobile-menu__overlay');
  const close   = document.querySelector('.mobile-menu__close');
  if (!burger || !menu) return;

  const open  = () => { menu.classList.add('open'); overlay?.classList.add('open'); document.body.style.overflow = 'hidden'; };
  const close_ = () => { menu.classList.remove('open'); overlay?.classList.remove('open'); document.body.style.overflow = ''; };

  burger.addEventListener('click', open);
  close?.addEventListener('click', close_);
  overlay?.addEventListener('click', close_);
}

// ── Search Overlay ────────────────────────────────────────
export function initSearch() {
  const overlay = document.querySelector('.search-overlay');
  const openBtn = document.querySelector('#search-btn');
  const closeBtn = document.querySelector('.search-close');
  const input   = overlay?.querySelector('input');
  if (!overlay || !openBtn) return;

  openBtn.addEventListener('click', () => {
    overlay.classList.add('open');
    setTimeout(() => input?.focus(), 200);
  });

  closeBtn?.addEventListener('click', () => overlay.classList.remove('open'));

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') overlay.classList.remove('open');
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      overlay.classList.toggle('open');
      setTimeout(() => input?.focus(), 200);
    }
  });

  input?.addEventListener('input', debounce(async (e) => {
    const q = e.target.value.trim();
    if (q.length < 2) return;
    // wire up to Firestore search in products.js
    document.dispatchEvent(new CustomEvent('search', { detail: { query: q } }));
  }, 300));
}

// ── Scroll Reveal ─────────────────────────────────────────
export function initReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  els.forEach(el => observer.observe(el));
}

// ── Toast Notification ────────────────────────────────────
export function showToast({ title = '', msg = '', type = 'info', duration = 3500 } = {}) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = { info: '🛍️', success: '✅', error: '❌', warning: '⚠️' };

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast__icon">${icons[type] || icons.info}</span>
    <div>
      ${title ? `<div class="toast__title">${title}</div>` : ''}
      <div class="toast__msg">${msg}</div>
    </div>
  `;

  container.appendChild(toast);
  requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('show')));

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, duration);
}

// ── Cart Badge ────────────────────────────────────────────
export function updateCartBadge(count) {
  const badge = document.querySelector('.nav__cart-badge');
  if (!badge) return;
  if (count > 0) {
    badge.textContent = count > 99 ? '99+' : count;
    badge.classList.add('visible');
  } else {
    badge.classList.remove('visible');
  }
}

// ── Local Cart (fallback / offline) ──────────────────────
const CART_KEY = 'luxe_cart';

export const LocalCart = {
  get() {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
    catch { return []; }
  },

  save(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    updateCartBadge(items.reduce((s, i) => s + i.qty, 0));
  },

  add(product, qty = 1, variant = {}) {
    const items = this.get();
    const key   = `${product.id}_${variant.size || ''}_${variant.color || ''}`;
    const idx   = items.findIndex(i => i.key === key);

    if (idx > -1) {
      items[idx].qty += qty;
    } else {
      items.push({ key, product, qty, variant, addedAt: Date.now() });
    }

    this.save(items);
    updateCartBadge(items.reduce((s, i) => s + i.qty, 0));
    showToast({ title: 'Added to Cart', msg: product.name, type: 'success' });
    return items;
  },

  remove(key) {
    const items = this.get().filter(i => i.key !== key);
    this.save(items);
    return items;
  },

  updateQty(key, qty) {
    const items = this.get();
    const idx   = items.findIndex(i => i.key === key);
    if (idx > -1) {
      if (qty <= 0) return this.remove(key);
      items[idx].qty = qty;
    }
    this.save(items);
    return items;
  },

  clear() { this.save([]); },

  totals() {
    const items    = this.get();
    const subtotal = items.reduce((s, i) => s + i.product.price * i.qty, 0);
    const shipping = subtotal > 100 ? 0 : 9.99;
    const tax      = subtotal * 0.08;
    return { subtotal, shipping, tax, total: subtotal + shipping + tax, count: items.reduce((s, i) => s + i.qty, 0) };
  }
};

// ── Wishlist ──────────────────────────────────────────────
const WL_KEY = 'luxe_wishlist';

export const Wishlist = {
  get() {
    try { return JSON.parse(localStorage.getItem(WL_KEY) || '[]'); }
    catch { return []; }
  },

  toggle(productId) {
    const list = this.get();
    const idx  = list.indexOf(productId);
    if (idx > -1) {
      list.splice(idx, 1);
      showToast({ msg: 'Removed from wishlist', type: 'info' });
    } else {
      list.push(productId);
      showToast({ msg: 'Added to wishlist ♡', type: 'success' });
    }
    localStorage.setItem(WL_KEY, JSON.stringify(list));
    return list.includes(productId);
  },

  has(productId) { return this.get().includes(productId); }
};

// ── Format Currency ───────────────────────────────────────
export function formatPrice(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency, minimumFractionDigits: 2
  }).format(amount);
}

// ── Stars HTML ────────────────────────────────────────────
export function starsHTML(rating = 0) {
  const full  = Math.floor(rating);
  const half  = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

// ── Debounce ──────────────────────────────────────────────
export function debounce(fn, ms = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

// ── Throttle ──────────────────────────────────────────────
export function throttle(fn, ms = 200) {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last >= ms) { last = now; fn(...args); }
  };
}

// ── Slugify ───────────────────────────────────────────────
export function slugify(str) {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

// ── Init All ─────────────────────────────────────────────
export function initApp() {
  initCursor();
  initNav();
  initMobileMenu();
  initSearch();
  initReveal();

  // Restore cart badge
  const totals = LocalCart.totals();
  updateCartBadge(totals.count);
}

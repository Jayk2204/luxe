// ============================================================
// app.js  —  Global Utilities (India Edition — ₹ INR)
// ============================================================

<<<<<<< HEAD
// ── Custom Cursor ──────────────────────────────────────────
// initCursor disabled — using default OS cursor
export function initCursor() { /* no-op */ }
=======
// ── Custom Cursor (disabled — using normal system cursor) ──
export function initCursor() { /* disabled */ }
>>>>>>> abd48409ae1432aae6cc7a7728426fb2bf6a61d2

// ── Nav scroll ────────────────────────────────────────────
export function initNav() {
  const nav = document.querySelector('.nav');
  if (!nav) return;
  const fn = () => nav.classList.toggle('scrolled', window.scrollY > 50);
  window.addEventListener('scroll', fn, { passive: true });
  fn();
}

// ── Mobile Menu ───────────────────────────────────────────
export function initMobileMenu() {
  const burger  = document.querySelector('.nav__burger');
  const menu    = document.querySelector('.mobile-menu');
  const overlay = document.querySelector('.mobile-menu__overlay');
  const close   = document.querySelector('.mobile-menu__close');
  if (!burger || !menu) return;
  const open_  = () => { menu.classList.add('open');    overlay?.classList.add('open');    document.body.style.overflow='hidden'; };
  const close_ = () => { menu.classList.remove('open'); overlay?.classList.remove('open'); document.body.style.overflow=''; };
  burger.addEventListener('click', open_);
  close?.addEventListener('click', close_);
  overlay?.addEventListener('click', close_);
}

// ── Search ────────────────────────────────────────────────
export function initSearch() {
  const overlay = document.querySelector('.search-overlay');
  const openBtn = document.querySelector('#search-btn');
  const closeBtn= document.querySelector('.search-close');
  const input   = overlay?.querySelector('input');
  if (!overlay || !openBtn) return;
  openBtn.addEventListener('click', () => { overlay.classList.add('open'); setTimeout(()=>input?.focus(),200); });
  closeBtn?.addEventListener('click', () => overlay.classList.remove('open'));
  document.addEventListener('keydown', e => {
    if (e.key==='Escape') overlay.classList.remove('open');
    if ((e.ctrlKey||e.metaKey) && e.key==='k') { e.preventDefault(); overlay.classList.toggle('open'); setTimeout(()=>input?.focus(),200); }
  });
  input?.addEventListener('input', debounce(e => {
    const q = e.target.value.trim();
    if (q.length < 2) return;
    document.dispatchEvent(new CustomEvent('search', { detail: { query: q } }));
  }, 300));
}

// ── Scroll Reveal ─────────────────────────────────────────
export function initReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  els.forEach(el => obs.observe(el));
}

// ── Toast ─────────────────────────────────────────────────
export function showToast({ title='', msg='', type='info', duration=3500 }={}) {
  let box = document.querySelector('.toast-container');
  if (!box) { box = document.createElement('div'); box.className='toast-container'; document.body.appendChild(box); }
  const icons = { info:'🛍️', success:'✅', error:'❌', warning:'⚠️' };
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span class="toast__icon">${icons[type]||'ℹ️'}</span>
    <div>${title?`<div class="toast__title">${title}</div>`:''}<div class="toast__msg">${msg}</div></div>`;
  box.appendChild(t);
  requestAnimationFrame(()=>requestAnimationFrame(()=>t.classList.add('show')));
  setTimeout(()=>{ t.classList.remove('show'); setTimeout(()=>t.remove(),400); }, duration);
}

// ── Cart Badge ────────────────────────────────────────────
export function updateCartBadge(count) {
  const b = document.querySelector('.nav__cart-badge');
  if (!b) return;
  if (count>0) { b.textContent = count>99?'99+':count; b.classList.add('visible'); }
  else b.classList.remove('visible');
}

// ============================================================
// 🇮🇳 INDIA STORE SETTINGS
// ============================================================
export const STORE = {
  currency:          'INR',
  symbol:            '₹',
  locale:            'en-IN',
  freeShippingAbove: 999,    // ₹999+ = free shipping
  shippingCharge:    79,     // ₹79 flat
  codCharge:         49,     // ₹49 COD handling
  codFreeAbove:      1999,   // COD free above ₹1999
  gstRate:           0.18,   // 18% GST (included in MRP)
};

// ── ₹ Price Formatter ─────────────────────────────────────
export function formatPrice(amount) {
  if (amount===null||amount===undefined||isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style:'currency', currency:'INR',
    minimumFractionDigits:0, maximumFractionDigits:0,
  }).format(Math.round(amount));
}

// ── Cart ──────────────────────────────────────────────────
const CART_KEY = 'luxe_cart';

export const LocalCart = {
  get() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)||'[]'); }
    catch { return []; }
  },

  save(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    updateCartBadge(items.reduce((s,i)=>s+i.qty,0));
  },

  add(product, qty=1, variant={}) {
    const items = this.get();
    const key   = `${product.id}_${variant.size||''}_${variant.color||''}`;
    const idx   = items.findIndex(i=>i.key===key);
    if (idx>-1) items[idx].qty += qty;
    else items.push({ key, product, qty, variant, addedAt: Date.now() });
    this.save(items);
    showToast({ title:'Cart mein add ho gaya! 🛍️', msg:product.name, type:'success' });
    return items;
  },

  remove(key) {
    const items = this.get().filter(i=>i.key!==key);
    this.save(items);
    return items;
  },

  updateQty(key, qty) {
    const items = this.get();
    const idx   = items.findIndex(i=>i.key===key);
    if (idx>-1) {
      if (qty<=0) return this.remove(key);
      items[idx].qty = qty;
    }
    this.save(items);
    return items;
  },

  clear() { this.save([]); },

  // ── Indian totals with GST + COD charge ──
  totals(paymentMethod='upi') {
    const items    = this.get();
    const subtotal = items.reduce((s,i)=>s+i.product.price*i.qty, 0);

    // Savings from MRP
    const savings = items.reduce((s,i)=>{
      return i.product.originalPrice
        ? s + (i.product.originalPrice - i.product.price)*i.qty
        : s;
    }, 0);

    // Shipping
    const shipping = subtotal >= STORE.freeShippingAbove ? 0 : STORE.shippingCharge;

    // COD charge
    const codCharge = paymentMethod==='cod'
      ? (subtotal < STORE.codFreeAbove ? STORE.codCharge : 0)
      : 0;

    // GST is included in MRP — show for transparency
    const gstIncluded = Math.round(subtotal - subtotal/(1+STORE.gstRate));

    const total = subtotal + shipping + codCharge;
    const count = items.reduce((s,i)=>s+i.qty, 0);

    return { subtotal, shipping, codCharge, gstIncluded, total, count, savings };
  }
};

// ── Wishlist ──────────────────────────────────────────────
const WL_KEY = 'luxe_wishlist';
export const Wishlist = {
  get()        { try { return JSON.parse(localStorage.getItem(WL_KEY)||'[]'); } catch { return []; } },
  has(id)      { return this.get().includes(id); },
  toggle(id)   {
    const list = this.get(); const idx = list.indexOf(id);
    if (idx>-1) { list.splice(idx,1); showToast({ msg:'Wishlist se hataya', type:'info' }); }
    else         { list.push(id);     showToast({ msg:'Wishlist mein save kiya ♡', type:'success' }); }
    localStorage.setItem(WL_KEY, JSON.stringify(list));
    return list.includes(id);
  }
};

// ── Helpers ───────────────────────────────────────────────
export function starsHTML(rating=0) {
  const full=Math.floor(rating), half=rating%1>=0.5?1:0, empty=5-full-half;
  return '★'.repeat(full)+(half?'½':'')+'☆'.repeat(empty);
}

export function debounce(fn, ms=300) {
  let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a),ms); };
}

export function throttle(fn, ms=200) {
  let last=0; return (...a)=>{ const now=Date.now(); if(now-last>=ms){last=now;fn(...a);} };
}

export function slugify(str) {
  return str.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
}

// ── Init ──────────────────────────────────────────────────
export function initApp() {
  initCursor(); initNav(); initMobileMenu(); initSearch(); initReveal();
  updateCartBadge(LocalCart.totals().count);
}
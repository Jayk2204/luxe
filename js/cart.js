// ============================================================
// cart.js  —  Cart Page + Firestore Orders
// ============================================================

import { db, auth }                         from './firebase-config.js';
import { LocalCart, formatPrice, showToast } from './app.js';
import { observeAuth }                       from './auth.js';
import {
  collection, addDoc, doc, updateDoc,
  serverTimestamp, getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ============================================================
// RENDER CART PAGE
// ============================================================
export function initCartPage() {
  const itemsContainer = document.getElementById('cart-items');
  const summaryEl      = document.getElementById('cart-summary-body');
  if (!itemsContainer) return;

  function render() {
    const items  = LocalCart.get();
    const totals = LocalCart.totals();

    // ── Items ──
    if (!items.length) {
      itemsContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">🛒</div>
          <h3>Your cart is empty</h3>
          <p>Looks like you haven't added anything yet.</p>
          <a href="products.html" class="btn btn-primary" style="margin-top:1rem">Start Shopping</a>
        </div>`;
    } else {
      itemsContainer.innerHTML = items.map(item => renderCartItem(item)).join('');
      bindCartItemEvents(itemsContainer, render);
    }

    // ── Summary ──
    if (summaryEl) {
      summaryEl.innerHTML = `
        <div class="summary-line"><span>Subtotal</span><span>${formatPrice(totals.subtotal)}</span></div>
        <div class="summary-line"><span>Shipping</span><span>${totals.shipping === 0 ? '<span class="gold">Free</span>' : formatPrice(totals.shipping)}</span></div>
        <div class="summary-line"><span>Tax (8%)</span><span>${formatPrice(totals.tax)}</span></div>
        <div class="summary-line total"><span>Total</span><span>${formatPrice(totals.total)}</span></div>
      `;
    }

    // Update item count label
    const countEl = document.getElementById('cart-count-label');
    if (countEl) countEl.textContent = `${totals.count} item${totals.count !== 1 ? 's' : ''}`;
  }

  render();

  // Promo code
  const promoBtn = document.getElementById('apply-promo');
  promoBtn?.addEventListener('click', () => {
    const code = document.getElementById('promo-input')?.value?.trim().toUpperCase();
    const validCodes = { LUXE10: 0.10, WELCOME: 0.15, VIP20: 0.20 };
    if (validCodes[code]) {
      showToast({ title: 'Promo Applied! 🎉', msg: `${Math.round(validCodes[code]*100)}% discount applied.`, type: 'success' });
    } else {
      showToast({ msg: 'Invalid promo code.', type: 'error' });
    }
  });

  // Checkout button
  document.getElementById('checkout-btn')?.addEventListener('click', () => {
    window.location.href = 'checkout.html';
  });
}

function renderCartItem(item) {
  const { key, product, qty, variant } = item;
  return `
    <div class="cart-item" data-key="${key}">
      <div class="cart-item__img">${product.emoji || '🛍️'}</div>
      <div>
        <div class="cart-item__name">${product.name}</div>
        <div class="cart-item__variant">
          ${variant?.size  ? `Size: ${variant.size}` : ''}
          ${variant?.color ? ` · Color: ${variant.color}` : ''}
        </div>
        <div class="qty-control" style="width:fit-content">
          <button class="qty-btn cart-qty-minus" data-key="${key}">−</button>
          <input class="qty-input cart-qty-input" type="number" value="${qty}" min="1" max="99" data-key="${key}" style="width:50px">
          <button class="qty-btn cart-qty-plus" data-key="${key}">+</button>
        </div>
        <button class="cart-item__remove" data-key="${key}">✕ Remove</button>
      </div>
      <div>
        <div class="cart-item__price">${formatPrice(product.price * qty)}</div>
        <div style="font-size:0.75rem;color:var(--gray-3);margin-top:0.25rem">${formatPrice(product.price)} each</div>
      </div>
    </div>`;
}

function bindCartItemEvents(container, rerenderFn) {
  container.querySelectorAll('.cart-item__remove').forEach(btn => {
    btn.addEventListener('click', () => {
      LocalCart.remove(btn.dataset.key);
      rerenderFn();
    });
  });

  container.querySelectorAll('.cart-qty-minus').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = container.querySelector(`.cart-qty-input[data-key="${btn.dataset.key}"]`);
      const newQty = parseInt(input.value) - 1;
      LocalCart.updateQty(btn.dataset.key, newQty);
      rerenderFn();
    });
  });

  container.querySelectorAll('.cart-qty-plus').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = container.querySelector(`.cart-qty-input[data-key="${btn.dataset.key}"]`);
      const newQty = parseInt(input.value) + 1;
      LocalCart.updateQty(btn.dataset.key, newQty);
      rerenderFn();
    });
  });

  container.querySelectorAll('.cart-qty-input').forEach(input => {
    input.addEventListener('change', () => {
      const qty = parseInt(input.value);
      if (qty > 0) LocalCart.updateQty(input.dataset.key, qty);
      rerenderFn();
    });
  });
}

// ============================================================
// CHECKOUT / PLACE ORDER
// ============================================================
export async function placeOrder({ shippingAddress, paymentMethod = 'stripe' }) {
  const user   = auth.currentUser;
  const items  = LocalCart.get();
  const totals = LocalCart.totals();

  if (!items.length) throw new Error('Cart is empty');

  const order = {
    userId:          user?.uid || 'guest',
    userEmail:       user?.email || shippingAddress.email,
    items:           items.map(i => ({
      productId: i.product.id,
      name:      i.product.name,
      price:     i.product.price,
      qty:       i.qty,
      variant:   i.variant,
    })),
    shippingAddress,
    paymentMethod,
    subtotal:        totals.subtotal,
    shipping:        totals.shipping,
    tax:             totals.tax,
    total:           totals.total,
    status:          'pending',
    createdAt:       serverTimestamp(),
  };

  const ref = await addDoc(collection(db, 'orders'), order);
  LocalCart.clear();
  return ref.id;
}

// ── Get Order by ID ───────────────────────────────────────
export async function getOrder(orderId) {
  const snap = await getDoc(doc(db, 'orders', orderId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// ── Update Order Status (admin) ────────────────────────────
export async function updateOrderStatus(orderId, status) {
  return await updateDoc(doc(db, 'orders', orderId), { status, updatedAt: serverTimestamp() });
}

// ============================================================
// CHECKOUT PAGE
// ============================================================
export function initCheckoutPage() {
  const form     = document.getElementById('checkout-form');
  const summary  = document.getElementById('checkout-summary');
  if (!form) return;

  // Render order summary
  if (summary) {
    const items  = LocalCart.get();
    const totals = LocalCart.totals();
    summary.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:0.75rem;margin-bottom:1.5rem">
        ${items.map(item => `
          <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.85rem">
            <span>${item.product.emoji || '🛍️'} ${item.product.name} × ${item.qty}</span>
            <span style="color:var(--cream)">${formatPrice(item.product.price * item.qty)}</span>
          </div>`).join('')}
      </div>
      <div class="summary-line"><span>Subtotal</span><span>${formatPrice(totals.subtotal)}</span></div>
      <div class="summary-line"><span>Shipping</span><span>${totals.shipping === 0 ? '<span class="gold">Free</span>' : formatPrice(totals.shipping)}</span></div>
      <div class="summary-line"><span>Tax</span><span>${formatPrice(totals.tax)}</span></div>
      <div class="summary-line total"><span>Order Total</span><span>${formatPrice(totals.total)}</span></div>
    `;
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('#place-order-btn');
    btn.disabled    = true;
    btn.textContent = '⏳ Processing...';

    const data = Object.fromEntries(new FormData(form));
    const shippingAddress = {
      name:     data['full-name'],
      email:    data['email'],
      phone:    data['phone'],
      address:  data['address'],
      city:     data['city'],
      state:    data['state'],
      zip:      data['zip'],
      country:  data['country'] || 'US',
    };

    try {
      const orderId = await placeOrder({ shippingAddress, paymentMethod: 'cod' });
      showToast({ title: '🎉 Order Placed!', msg: `Order #${orderId.slice(-8).toUpperCase()}`, type: 'success', duration: 6000 });
      setTimeout(() => { window.location.href = `order-success.html?id=${orderId}`; }, 2000);
    } catch (err) {
      showToast({ title: 'Error', msg: err.message, type: 'error' });
      btn.disabled    = false;
      btn.textContent = '🔒 Place Order';
    }
  });
}

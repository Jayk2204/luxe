// ============================================================
// cart.js  —  Cart + Checkout (India Edition 🇮🇳)
// ============================================================

import { db, auth }                               from './firebase-config.js';
import { LocalCart, formatPrice, showToast, STORE } from './app.js';
import { observeAuth }                             from './auth.js';
import {
  collection, addDoc, doc, updateDoc, getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ============================================================
// CART PAGE
// ============================================================
export function initCartPage() {
  const itemsEl   = document.getElementById('cart-items');
  const summaryEl = document.getElementById('cart-summary-body');
  if (!itemsEl) return;

  let paymentMethod = 'upi'; // default

  function render() {
    const items  = LocalCart.get();
    const totals = LocalCart.totals(paymentMethod);

    // ── Items ──
    if (!items.length) {
      itemsEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">🛒</div>
          <h3>Aapka cart khaali hai</h3>
          <p>Kuch products add karo aur wapas aao!</p>
          <a href="products.html" class="btn btn-primary" style="margin-top:1rem">Shopping Shuru Karo</a>
        </div>`;
    } else {
      itemsEl.innerHTML = items.map(renderCartItem).join('');
      bindCartEvents(itemsEl, render);
    }

    // ── Summary ──
    if (summaryEl) {
      const freeShippingLeft = STORE.freeShippingAbove - totals.subtotal;
      summaryEl.innerHTML = `
        ${freeShippingLeft > 0
          ? `<div style="background:rgba(201,169,110,0.08);border:1px solid rgba(201,169,110,0.2);border-radius:6px;padding:0.6rem 0.9rem;margin-bottom:1rem;font-size:0.78rem;color:var(--gold)">
              🚚 Free delivery ke liye <strong>${formatPrice(freeShippingLeft)}</strong> aur add karo!
             </div>`
          : `<div style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:6px;padding:0.6rem 0.9rem;margin-bottom:1rem;font-size:0.78rem;color:#27ae60">
              ✅ Aapko Free Delivery mil rahi hai!
             </div>`
        }

        <div class="summary-line">
          <span>Subtotal (${totals.count} items)</span>
          <span>${formatPrice(totals.subtotal)}</span>
        </div>

        ${totals.savings > 0 ? `
        <div class="summary-line" style="color:var(--green)">
          <span>Aapki Bachat (Discount)</span>
          <span>− ${formatPrice(totals.savings)}</span>
        </div>` : ''}

        <div class="summary-line">
          <span>Delivery Charge</span>
          <span>${totals.shipping === 0
            ? '<span style="color:var(--green);font-weight:600">FREE</span>'
            : formatPrice(totals.shipping)}</span>
        </div>

        ${totals.codCharge > 0 ? `
        <div class="summary-line" style="color:var(--amber)">
          <span>COD Handling Fee</span>
          <span>${formatPrice(totals.codCharge)}</span>
        </div>` : ''}

        <div class="summary-line" style="font-size:0.72rem;color:var(--gray-3)">
          <span>GST (18% inclusive in MRP)</span>
          <span>${formatPrice(totals.gstIncluded)}</span>
        </div>

        <div class="summary-line total">
          <span>Total Amount</span>
          <span>${formatPrice(totals.total)}</span>
        </div>
      `;
    }

    // Count label
    const countEl = document.getElementById('cart-count-label');
    if (countEl) countEl.textContent = `${totals.count} item${totals.count !== 1 ? 's' : ''}`;
  }

  render();

  // Promo code
  document.getElementById('apply-promo')?.addEventListener('click', () => {
    const code   = document.getElementById('promo-input')?.value?.trim().toUpperCase();
    const promos = {
      'LUXE10':   { type:'pct',  val:0.10, min:999  },
      'WELCOME':  { type:'pct',  val:0.15, min:1499 },
      'VIP20':    { type:'pct',  val:0.20, min:2999 },
      'INDIA50':  { type:'flat', val:50,   min:499  },
      'FREESHIP': { type:'ship', val:0,    min:0    },
    };
    const promo = promos[code];
    if (!promo) { showToast({ msg:'Invalid promo code', type:'error' }); return; }
    const totals = LocalCart.totals();
    if (totals.subtotal < promo.min) {
      showToast({ msg:`Min order ${formatPrice(promo.min)} chahiye is code ke liye`, type:'warning' });
      return;
    }
    if (promo.type === 'pct')  showToast({ title:'🎉 Promo Lagaya!', msg:`${Math.round(promo.val*100)}% discount mila!`, type:'success' });
    if (promo.type === 'flat') showToast({ title:'🎉 Promo Lagaya!', msg:`${formatPrice(promo.val)} ka flat discount!`, type:'success' });
    if (promo.type === 'ship') showToast({ title:'🎉 Promo Lagaya!', msg:'Is order pe free delivery!', type:'success' });
  });

  // Checkout
  document.getElementById('checkout-btn')?.addEventListener('click', () => {
    window.location.href = 'checkout.html';
  });
}

// ── Render a single cart item ──────────────────────────────
function renderCartItem({ key, product, qty, variant }) {
  const mainImg = product.imageUrl || (product.images && product.images[0]) || null;
  return `
    <div class="cart-item" data-key="${key}">
      <div class="cart-item__img">
        ${mainImg
          ? `<img src="${mainImg}" alt="${product.name}"
               style="width:100%;height:100%;object-fit:cover"
               onerror="this.style.display='none';this.parentElement.innerHTML='${product.emoji||'🛍️'}'">` 
          : product.emoji || '🛍️'}
      </div>
      <div>
        <div class="cart-item__name">${product.name}</div>
        <div class="cart-item__variant">
          ${variant?.size  ? `Size: ${variant.size}`   : ''}
          ${variant?.color ? ` · Color: ${variant.color}` : ''}
        </div>
        <div class="qty-control" style="width:fit-content;margin-top:0.4rem">
          <button class="qty-btn cart-qty-minus" data-key="${key}">−</button>
          <input class="qty-input cart-qty-input" type="number"
            value="${qty}" min="1" max="99" data-key="${key}"
            style="width:50px">
          <button class="qty-btn cart-qty-plus" data-key="${key}">+</button>
        </div>
        <button class="cart-item__remove" data-key="${key}">✕ Hatao</button>
      </div>
      <div style="text-align:right">
        <div class="cart-item__price">${formatPrice(product.price * qty)}</div>
        <div style="font-size:0.72rem;color:var(--gray-3);margin-top:0.2rem">
          ${formatPrice(product.price)} / piece
        </div>
        ${product.originalPrice
          ? `<div style="font-size:0.7rem;color:var(--green);margin-top:0.2rem">
               ${formatPrice((product.originalPrice - product.price) * qty)} bachaya
             </div>` : ''}
      </div>
    </div>`;
}

function bindCartEvents(container, rerenderFn) {
  container.querySelectorAll('.cart-item__remove').forEach(btn => {
    btn.addEventListener('click', () => { LocalCart.remove(btn.dataset.key); rerenderFn(); });
  });
  container.querySelectorAll('.cart-qty-minus').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = container.querySelector(`.cart-qty-input[data-key="${btn.dataset.key}"]`);
      LocalCart.updateQty(btn.dataset.key, parseInt(input.value) - 1);
      rerenderFn();
    });
  });
  container.querySelectorAll('.cart-qty-plus').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = container.querySelector(`.cart-qty-input[data-key="${btn.dataset.key}"]`);
      LocalCart.updateQty(btn.dataset.key, parseInt(input.value) + 1);
      rerenderFn();
    });
  });
  container.querySelectorAll('.cart-qty-input').forEach(input => {
    input.addEventListener('change', () => {
      LocalCart.updateQty(input.dataset.key, parseInt(input.value));
      rerenderFn();
    });
  });
}

// ============================================================
// PLACE ORDER — Firestore
// ============================================================
export async function placeOrder({ shippingAddress, paymentMethod = 'upi' }) {
  const user   = auth.currentUser;
  const items  = LocalCart.get();
  const totals = LocalCart.totals(paymentMethod);

  if (!items.length) throw new Error('Cart khaali hai!');

  const order = {
    userId:          user?.uid   || 'guest',
    userEmail:       user?.email || shippingAddress.email,
    items:           items.map(i => ({
      productId: i.product.id,
      name:      i.product.name,
      price:     i.product.price,
      qty:       i.qty,
      variant:   i.variant,
      imageUrl:  i.product.imageUrl || null,
    })),
    shippingAddress,
    paymentMethod,
    currency:        'INR',
    subtotal:        totals.subtotal,
    shipping:        totals.shipping,
    codCharge:       totals.codCharge,
    gstIncluded:     totals.gstIncluded,
    savings:         totals.savings,
    total:           totals.total,
    status:          'pending',
    createdAt:       serverTimestamp(),
  };

  const ref = await addDoc(collection(db, 'orders'), order);
  LocalCart.clear();
  return ref.id;
}

export async function getOrder(orderId) {
  const snap = await getDoc(doc(db, 'orders', orderId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function updateOrderStatus(orderId, status) {
  return await updateDoc(doc(db, 'orders', orderId), { status, updatedAt: serverTimestamp() });
}

// ============================================================
// CHECKOUT PAGE — Indian form + payments
// ============================================================
export function initCheckoutPage() {
  const form    = document.getElementById('checkout-form');
  const summary = document.getElementById('checkout-summary');
  if (!form) return;

  let selectedPayment = 'upi';

  // ── Order Summary ──
  if (summary) {
    const items  = LocalCart.get();
    const totals = LocalCart.totals(selectedPayment);

    summary.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:0.6rem;margin-bottom:1.25rem">
        ${items.map(i => `
          <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.83rem;gap:0.5rem">
            <div style="display:flex;align-items:center;gap:0.6rem">
              <span style="font-size:1.2rem">${i.product.emoji||'🛍️'}</span>
              <span style="color:var(--gray-1)">${i.product.name} × ${i.qty}</span>
            </div>
            <span style="color:var(--cream);white-space:nowrap">${formatPrice(i.product.price * i.qty)}</span>
          </div>`).join('')}
      </div>

      <div class="summary-line"><span>Subtotal</span><span>${formatPrice(totals.subtotal)}</span></div>
      ${totals.savings>0?`<div class="summary-line" style="color:var(--green)"><span>Discount</span><span>− ${formatPrice(totals.savings)}</span></div>`:''}
      <div class="summary-line"><span>Delivery</span>
        <span>${totals.shipping===0?'<span style="color:var(--green)">FREE</span>':formatPrice(totals.shipping)}</span>
      </div>
      <div class="summary-line" style="font-size:0.72rem;color:var(--gray-3)">
        <span>GST 18% (included)</span><span>${formatPrice(totals.gstIncluded)}</span>
      </div>
      <div id="cod-line" style="display:none" class="summary-line" style="color:var(--amber)">
        <span>COD Fee</span><span>${formatPrice(STORE.codCharge)}</span>
      </div>
      <div class="summary-line total" id="order-total">
        <span>Total</span><span>${formatPrice(totals.total)}</span>
      </div>
    `;
  }

  // ── Payment method change ──
  window.selectPayment = (el) => {
    document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
    selectedPayment = el.querySelector('input').value;

    const totals   = LocalCart.totals(selectedPayment);
    const codLine  = document.getElementById('cod-line');
    const totalEl  = document.getElementById('order-total');

    if (codLine)  codLine.style.display  = selectedPayment === 'cod' ? 'flex' : 'none';
    if (totalEl)  totalEl.querySelector('span:last-child').textContent = formatPrice(totals.total);

    // Show/hide UPI field
    document.getElementById('upi-field')?.style.setProperty('display', selectedPayment === 'upi' ? 'block' : 'none');
    // Show/hide card fields
    document.getElementById('card-fields')?.style.setProperty('display', selectedPayment === 'card' ? 'block' : 'none');
  };

  // ── Form Submit ──
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('#place-order-btn');
    btn.disabled    = true;
    btn.textContent = '⏳ Order place ho raha hai...';

    const data = Object.fromEntries(new FormData(form));
    const shippingAddress = {
      name:    data['full-name'],
      email:   data['email'],
      phone:   data['phone'],
      address: data['address'],
      city:    data['city'],
      state:   data['state'],
      pincode: data['pincode'],
      country: 'India',
    };

    try {
      const orderId = await placeOrder({ shippingAddress, paymentMethod: selectedPayment });
      showToast({ title:'🎉 Order Ho Gaya!', msg:`Order #${orderId.slice(-8).toUpperCase()} confirm ho gaya!`, type:'success', duration:6000 });
      setTimeout(() => window.location.href = `order-success.html?id=${orderId}`, 1800);
    } catch (err) {
      showToast({ title:'Error', msg: err.message, type:'error' });
      btn.disabled    = false;
      btn.textContent = '🔒 Order Place Karo';
    }
  });
}
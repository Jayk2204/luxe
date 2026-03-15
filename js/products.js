// ============================================================
// products.js  —  Product Catalog & Firestore Integration
// ============================================================

import { db }                       from './firebase-config.js';
import { LocalCart, Wishlist, formatPrice, starsHTML, showToast, debounce } from './app.js';
import {
  collection, doc, getDocs, getDoc,
  addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, startAfter,
  serverTimestamp, increment
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const PRODUCTS_COL = 'products';
const PAGE_SIZE    = 12;

// ── Demo Products (fallback when Firebase not configured) ──
export const DEMO_PRODUCTS = [
  { id:'d1', name:'Obsidian Noir Jacket',  category:'Jackets',      price:289, originalPrice:389, rating:4.8, reviews:124, badge:'New',  emoji:'🧥', stock:15, featured:true,
    imageUrl:'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=533&fit=crop&q=75' },
  { id:'d2', name:'Silk Reverie Dress',    category:'Dresses',      price:199, originalPrice:299, rating:4.9, reviews:203, badge:'Sale', emoji:'👗', stock:22, featured:true,
    imageUrl:'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&h=533&fit=crop&q=75' },
  { id:'d3', name:'Velvet Dusk Blazer',    category:'Blazers',      price:349, originalPrice:null,rating:4.6, reviews:87,  badge:null,   emoji:'🪭', stock:8,  featured:true,
    imageUrl:'https://images.unsplash.com/photo-1594938298603-c8148c4b4f57?w=400&h=533&fit=crop&q=75' },
  { id:'d4', name:'Midnight Trench Coat',  category:'Coats',        price:459, originalPrice:null,rating:4.7, reviews:56,  badge:'Hot',  emoji:'🧥', stock:5,  featured:false,
    imageUrl:'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=400&h=533&fit=crop&q=75' },
  { id:'d5', name:'Aurum Knit Sweater',    category:'Tops',         price:149, originalPrice:199, rating:4.5, reviews:341, badge:'Sale', emoji:'🧶', stock:30, featured:true,
    imageUrl:'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=533&fit=crop&q=75' },
  { id:'d6', name:'Graphite Linen Suit',   category:'Suits',        price:599, originalPrice:null,rating:4.9, reviews:78,  badge:'New',  emoji:'👔', stock:7,  featured:true,
    imageUrl:'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&h=533&fit=crop&q=75' },
  { id:'d7', name:'Ivory Crepe Blouse',    category:'Tops',         price:115, originalPrice:150, rating:4.4, reviews:190, badge:null,   emoji:'👘', stock:25, featured:false,
    imageUrl:'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=400&h=533&fit=crop&q=75' },
  { id:'d8', name:'Bronzed Leather Belt',  category:'Accessories',  price:89,  originalPrice:null,rating:4.7, reviews:420, badge:'Hot',  emoji:'👜', stock:50, featured:true,
    imageUrl:'https://images.unsplash.com/photo-1591348278863-a8fb3887e2aa?w=400&h=533&fit=crop&q=75' },
];

// ── Fetch All / Paginated ─────────────────────────────────
export async function fetchProducts({ category = null, sort = 'createdAt', lastDoc = null, pageSize = PAGE_SIZE, featured = null } = {}) {
  const q           = collection(db, PRODUCTS_COL);
  const constraints = [];
  if (category)        constraints.push(where('category', '==', category));
  if (featured !== null) constraints.push(where('featured', '==', featured));
  constraints.push(orderBy(sort, sort === 'price' ? 'asc' : 'desc'));
  constraints.push(limit(pageSize));
  if (lastDoc)         constraints.push(startAfter(lastDoc));

  const snap = await getDocs(query(q, ...constraints));
  const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  const last = snap.docs[snap.docs.length - 1] || null;
  return { products: docs, lastDoc: last, hasMore: docs.length === pageSize };
}

// ── Fetch Single ──────────────────────────────────────────
export async function fetchProduct(id) {
  const snap = await getDoc(doc(db, PRODUCTS_COL, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// ── Fetch by Category ─────────────────────────────────────
export async function fetchByCategory(category, count = 4) {
  const q    = query(collection(db, PRODUCTS_COL), where('category', '==', category), limit(count));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ── Fetch Featured ────────────────────────────────────────
export async function fetchFeatured(count = 6) {
  const q    = query(collection(db, PRODUCTS_COL), where('featured', '==', true), limit(count));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ── Search (client-side) ──────────────────────────────────
export async function searchProducts(queryStr, count = 20) {
  const snap = await getDocs(query(collection(db, PRODUCTS_COL), limit(50)));
  const all  = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  const q    = queryStr.toLowerCase();
  return all
    .filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      p.tags?.some(t => t.toLowerCase().includes(q))
    )
    .slice(0, count);
}

// ── Admin: Add Product ────────────────────────────────────
export async function addProduct(data) {
  return await addDoc(collection(db, PRODUCTS_COL), {
    ...data, createdAt: serverTimestamp(), sales: 0, views: 0
  });
}

// ── Admin: Update Product ─────────────────────────────────
export async function updateProduct(id, data) {
  return await updateDoc(doc(db, PRODUCTS_COL, id), {
    ...data, updatedAt: serverTimestamp()
  });
}

// ── Admin: Delete Product ─────────────────────────────────
export async function deleteProduct(id) {
  return await deleteDoc(doc(db, PRODUCTS_COL, id));
}

// ── Increment Views ───────────────────────────────────────
export async function trackProductView(id) {
  try { await updateDoc(doc(db, PRODUCTS_COL, id), { views: increment(1) }); }
  catch { /* fail silently */ }
}

// ============================================================
// RENDER FUNCTIONS
// ============================================================

// ── Product Card HTML ─────────────────────────────────────
// ✅ FIX: was using `p.imageUrl` but variable name is `product`
export function renderProductCard(product) {
  // Use `product` — NOT `p` (that was the bug!)
  const {
    id, name, category, price, originalPrice,
    rating, reviews, badge, emoji, stock,
    imageUrl, images
  } = product;

  const isWishlisted = Wishlist.has(id);
  const discountPct  = originalPrice ? Math.round((1 - price / originalPrice) * 100) : 0;

  // Pick best available image
  const mainImage = imageUrl || (images && images[0]) || null;

  return `
    <article class="product-card reveal" data-id="${id}">
      <div class="product-card__img-wrap">

        ${badge ? `<span class="product-card__badge badge-${badge.toLowerCase()}">${badge}</span>` : ''}

        ${mainImage
          ? `<img
               src="${mainImage}"
               alt="${name}"
               class="product-card__img"
               loading="lazy"
               onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"
             >
             <div class="product-card__placeholder" style="display:none">${emoji || '🛍️'}</div>`
          : `<div class="product-card__placeholder">${emoji || '🛍️'}</div>`
        }

        <div class="product-card__actions">
          <button
            class="product-card__action-btn wishlist-btn ${isWishlisted ? 'active' : ''}"
            data-id="${id}"
            title="Wishlist"
          >
            ${isWishlisted ? '♥' : '♡'}
          </button>
          <a href="product.html?id=${id}" class="product-card__action-btn" title="Quick View">👁️</a>
        </div>

        <button class="product-card__quick-add" data-id="${id}">+ Add to Cart</button>
      </div>

      <div class="product-card__info">
        <div class="product-card__cat">${category || 'Apparel'}</div>
        <a href="product.html?id=${id}">
          <h3 class="product-card__name line-clamp-2">${name}</h3>
        </a>
        <div class="product-card__pricing">
          <span class="product-card__price">${formatPrice(price)}</span>
          ${originalPrice
            ? `<span class="product-card__price-old">${formatPrice(originalPrice)}</span>`
            : ''}
          ${discountPct
            ? `<span class="badge-sale" style="padding:0.1rem 0.4rem;font-size:0.6rem;border-radius:2px;">-${discountPct}%</span>`
            : ''}
        </div>
        ${rating
          ? `<div class="product-card__rating">
               <span class="stars">${starsHTML(rating)}</span>
               <span class="rating-count">(${reviews || 0})</span>
             </div>`
          : ''}
      </div>
    </article>`;
}

// ── Render Product Grid ───────────────────────────────────
export function renderProductGrid(container, products) {
  if (!container) return;
  container.innerHTML = products.map(renderProductCard).join('');
  bindProductCardEvents(container);

  // Staggered reveal animation
  container.querySelectorAll('.reveal').forEach((el, i) => {
    el.style.transitionDelay = `${i * 0.05}s`;
    setTimeout(() => el.classList.add('visible'), 100 + i * 60);
  });
}

// ── Skeleton Loader ───────────────────────────────────────
export function renderSkeletons(container, count = 8) {
  if (!container) return;
  container.innerHTML = Array(count).fill(0).map(() => `
    <div class="product-card">
      <div class="product-card__img-wrap">
        <div class="skeleton" style="width:100%;aspect-ratio:3/4;"></div>
      </div>
      <div class="product-card__info" style="padding:1rem">
        <div class="skeleton" style="height:10px;width:40%;margin-bottom:0.5rem;"></div>
        <div class="skeleton" style="height:16px;width:80%;margin-bottom:0.75rem;"></div>
        <div class="skeleton" style="height:14px;width:35%;"></div>
      </div>
    </div>`).join('');
}

// ── Bind Card Events (wishlist + quick-add) ───────────────
export function bindProductCardEvents(container) {
  container.querySelectorAll('.wishlist-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      const isNow = Wishlist.toggle(btn.dataset.id);
      btn.textContent = isNow ? '♥' : '♡';
      btn.classList.toggle('active', isNow);
    });
  });

  container.querySelectorAll('.product-card__quick-add').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const card    = btn.closest('.product-card');
      const id      = card.dataset.id;
      const name    = card.querySelector('.product-card__name')?.textContent?.trim() || 'Product';
      const priceEl = card.querySelector('.product-card__price')?.textContent?.replace(/[^0-9.]/g, '');
      const price   = parseFloat(priceEl) || 0;
      LocalCart.add({ id, name, price }, 1);
    });
  });
}

// ============================================================
// PRODUCTS PAGE (products.html)
// ============================================================
export async function initProductsPage() {
  const grid        = document.getElementById('products-grid');
  const filterBtns  = document.querySelectorAll('.filter-chip[data-cat]');
  const sortSelect  = document.getElementById('sort-select');
  const loadMoreBtn = document.getElementById('load-more-btn');

  if (!grid) return;

  let currentCat  = null;
  let currentSort = 'createdAt';
  let lastDoc     = null;
  let loading     = false;
  let allLoaded   = false;

  // ── Read category from URL param ──
  const urlCat = new URLSearchParams(window.location.search).get('cat');
  if (urlCat && urlCat !== 'all') {
    currentCat = urlCat;
    filterBtns.forEach(b => b.classList.toggle('active', b.dataset.cat === urlCat));
  }

  async function load(reset = true) {
    if (loading) return;
    loading = true;
    if (reset) { lastDoc = null; allLoaded = false; renderSkeletons(grid); }

    try {
      const { products, lastDoc: ld, hasMore } = await fetchProducts({
        category: currentCat,
        sort: currentSort,
        lastDoc,
        pageSize: PAGE_SIZE
      });

      lastDoc   = ld;
      allLoaded = !hasMore;

      if (reset) {
        renderProductGrid(grid, products);
      } else {
        const tmp = document.createElement('div');
        tmp.innerHTML = products.map(renderProductCard).join('');
        while (tmp.firstChild) grid.appendChild(tmp.firstChild);
        bindProductCardEvents(grid);
      }

      if (loadMoreBtn) {
        loadMoreBtn.style.display = allLoaded ? 'none' : 'block';
      }

      // Show product count
      const countEl = document.getElementById('product-count');
      if (countEl) countEl.textContent = `${products.length} products`;

    } catch (err) {
      console.error('Products load error:', err);
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-state__icon">😔</div>
          <h3>Could not load products</h3>
          <p>${err.message || 'Check your Firebase configuration.'}</p>
        </div>`;
    } finally {
      loading = false;
    }
  }

  // Category chips
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCat = btn.dataset.cat === 'all' ? null : btn.dataset.cat;
      load();
    });
  });

  // Sort
  sortSelect?.addEventListener('change', () => {
    currentSort = sortSelect.value;
    load();
  });

  // Load more
  loadMoreBtn?.addEventListener('click', () => load(false));

  // Initial load
  await load();
}

// ============================================================
// PRODUCT DETAIL PAGE (product.html)
// ============================================================
export async function initProductDetailPage() {
  const id = new URLSearchParams(window.location.search).get('id');
  if (!id) { window.location.href = 'products.html'; return; }

  const container = document.getElementById('product-detail-root');
  if (!container) return;

  // Skeleton
  container.innerHTML = `
    <div class="product-detail__grid">
      <div class="skeleton" style="aspect-ratio:3/4;border-radius:4px;"></div>
      <div style="display:flex;flex-direction:column;gap:1rem;padding-top:2rem">
        ${Array(6).fill(0).map(() =>
          '<div class="skeleton" style="height:20px;border-radius:4px;"></div>'
        ).join('')}
      </div>
    </div>`;

  try {
    const product = await fetchProduct(id);
    if (!product) { window.location.href = 'products.html'; return; }

    trackProductView(id);
    renderProductDetailPage(container, product);
    loadRelated(product);
  } catch (err) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">😔</div>
        <h3>Product not found.</h3>
        <p>${err.message}</p>
      </div>`;
  }
}

// ── Render detail page ────────────────────────────────────
function renderProductDetailPage(container, p) {
  const isWished    = Wishlist.has(p.id);
  const discountPct = p.originalPrice ? Math.round((1 - p.price / p.originalPrice) * 100) : 0;
  const sizes       = p.sizes  || ['XS','S','M','L','XL','XXL'];
  const colors      = p.colors || ['#111111','#c9a96e','#e8e8e8','#b0777a'];

  // ✅ Build images array for gallery
  const allImages = (p.images && p.images.length > 0)
    ? p.images
    : p.imageUrl
      ? [p.imageUrl]
      : null;

  const mainImage = allImages ? allImages[0] : null;

  // Gallery HTML
  const galleryMainHTML = mainImage
    ? `<img
         src="${mainImage}"
         alt="${p.name}"
         id="gallery-main-img"
         style="width:100%;height:100%;object-fit:cover;transition:opacity 0.3s"
         onerror="this.style.display='none';document.getElementById('gallery-fallback').style.display='flex'"
       >
       <div id="gallery-fallback" class="gallery-placeholder" style="display:none">${p.emoji || '🛍️'}</div>`
    : `<div class="gallery-placeholder">${p.emoji || '🛍️'}</div>`;

  // Thumbnails HTML
  const thumbsHTML = allImages
    ? allImages.map((img, i) => `
        <div class="product-gallery__thumb ${i === 0 ? 'active' : ''}"
          style="background:#1a1a1a;overflow:hidden"
          data-img="${img}">
          <img src="${img}" alt="view ${i+1}"
            style="width:100%;height:100%;object-fit:cover"
            onerror="this.parentElement.innerHTML='${p.emoji || '🛍️'}'">
        </div>`).join('')
    : `<div class="product-gallery__thumb active">${p.emoji || '🛍️'}</div>`.repeat(4);

  container.innerHTML = `
    <div class="product-detail__grid">

      <!-- ── Gallery ── -->
      <div class="product-gallery">
        <div class="product-gallery__main">
          ${galleryMainHTML}
        </div>
        <div class="product-gallery__thumbs">
          ${thumbsHTML}
        </div>
      </div>

      <!-- ── Product Info ── -->
      <div class="product-info">
        <div class="product-info__breadcrumb">
          <a href="index.html">Home</a>
          <span>/</span>
          <a href="products.html">Shop</a>
          <span>/</span>
          <a href="products.html?cat=${p.category}">${p.category}</a>
        </div>

        <h4 class="product-info__cat">${p.category}</h4>
        <h1 class="product-info__title">${p.name}</h1>

        <div class="product-info__rating">
          <span class="stars">${starsHTML(p.rating || 0)}</span>
          <span class="rating-count gold">${p.rating || 0}</span>
          <span class="rating-count">(${p.reviews || 0} reviews)</span>
        </div>

        <div class="product-info__price-wrap">
          <span class="product-info__price">${formatPrice(p.price)}</span>
          ${p.originalPrice
            ? `<span class="product-info__price-old">${formatPrice(p.originalPrice)}</span>`
            : ''}
          ${discountPct
            ? `<span class="badge-sale" style="padding:0.3rem 0.7rem;font-size:0.75rem;border-radius:4px;font-weight:600;">-${discountPct}% OFF</span>`
            : ''}
        </div>

        <div class="product-info__desc">
          <p>${p.description || 'A masterpiece of refined craftsmanship. Designed for those who understand that true style is never accidental.'}</p>
        </div>

        <!-- Sizes -->
        <div class="product-info__variants">
          <div class="variant-label">
            Size &nbsp;
            <span id="selected-size" style="color:var(--gold);font-weight:400">— Select</span>
          </div>
          <div class="size-grid">
            ${sizes.map(s => `<button class="size-btn" data-size="${s}">${s}</button>`).join('')}
          </div>
        </div>

        <!-- Colors -->
        <div class="product-info__variants" style="margin-bottom:2rem">
          <div class="variant-label">
            Color &nbsp;
            <span id="selected-color" style="color:var(--gold);font-weight:400">— Select</span>
          </div>
          <div class="color-grid">
            ${colors.map(c =>
              `<button class="color-btn" style="background:${c}" data-color="${c}" title="${c}"></button>`
            ).join('')}
          </div>
        </div>

        <!-- Qty -->
        <div class="product-info__qty">
          <div class="qty-control">
            <button class="qty-btn" id="qty-minus">−</button>
            <input class="qty-input" type="number" value="1"
              min="1" max="${p.stock || 99}" id="qty-input">
            <button class="qty-btn" id="qty-plus">+</button>
          </div>
          <span style="font-size:0.8rem;color:var(--gray-3)">
            ${p.stock ? `${p.stock} in stock` : 'In stock'}
          </span>
        </div>

        <!-- Add to Cart + Wishlist -->
        <div class="product-info__add-wrap">
          <button class="btn btn-primary btn-lg" id="add-to-cart-btn">
            🛍️ &nbsp; Add to Cart
          </button>
          <button
            class="btn btn-outline btn-icon btn-lg ${isWished ? 'active' : ''}"
            id="wishlist-btn"
            title="Wishlist"
          >
            ${isWished ? '♥' : '♡'}
          </button>
        </div>
        <button class="btn btn-outline btn-block"
          style="margin-top:0.5rem;border-color:var(--gold);color:var(--gold)">
          ⚡ Buy Now
        </button>

        <div class="product-info__meta">
          <div class="meta-row">
            <span class="meta-key">SKU</span>
            <span class="meta-val">LX-${(p.id || '').slice(-6).toUpperCase()}</span>
          </div>
          <div class="meta-row">
            <span class="meta-key">Category</span>
            <span class="meta-val">${p.category}</span>
          </div>
          <div class="meta-row">
            <span class="meta-key">Tags</span>
            <span class="meta-val">${(p.tags || []).join(', ') || '—'}</span>
          </div>
          <div class="meta-row">
            <span class="meta-key">Shipping</span>
            <span class="meta-val">Free on orders over $100</span>
          </div>
        </div>
      </div>
    </div>`;

  // ── Thumbnail click → change main image ──
  container.querySelectorAll('.product-gallery__thumb').forEach(thumb => {
    thumb.addEventListener('click', () => {
      container.querySelectorAll('.product-gallery__thumb').forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
      const imgSrc = thumb.dataset.img;
      if (imgSrc) {
        const mainImg = document.getElementById('gallery-main-img');
        if (mainImg) {
          mainImg.style.opacity = '0';
          setTimeout(() => { mainImg.src = imgSrc; mainImg.style.opacity = '1'; }, 200);
        }
      }
    });
  });

  // ── Size select ──
  let selectedSize  = '';
  let selectedColor = '';

  container.querySelectorAll('.size-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedSize = btn.dataset.size;
      document.getElementById('selected-size').textContent = selectedSize;
    });
  });

  // ── Color select ──
  container.querySelectorAll('.color-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedColor = btn.dataset.color;
      document.getElementById('selected-color').textContent = selectedColor;
    });
  });

  // ── Qty ──
  const qtyInput = document.getElementById('qty-input');
  document.getElementById('qty-minus')?.addEventListener('click', () => {
    if (parseInt(qtyInput.value) > 1) qtyInput.value = parseInt(qtyInput.value) - 1;
  });
  document.getElementById('qty-plus')?.addEventListener('click', () => {
    if (parseInt(qtyInput.value) < (p.stock || 99)) {
      qtyInput.value = parseInt(qtyInput.value) + 1;
    }
  });

  // ── Add to Cart ──
  document.getElementById('add-to-cart-btn')?.addEventListener('click', () => {
    LocalCart.add(p, parseInt(qtyInput.value) || 1, {
      size: selectedSize, color: selectedColor
    });
  });

  // ── Wishlist ──
  document.getElementById('wishlist-btn')?.addEventListener('click', (e) => {
    const isNow = Wishlist.toggle(p.id);
    e.currentTarget.innerHTML = isNow ? '♥' : '♡';
    e.currentTarget.classList.toggle('active', isNow);
  });
}

// ── Load related products ─────────────────────────────────
async function loadRelated(product) {
  const grid = document.getElementById('related-grid');
  if (!grid) return;
  try {
    const related = await fetchByCategory(product.category, 5);
    const filtered = related.filter(r => r.id !== product.id).slice(0, 4);
    if (filtered.length) renderProductGrid(grid, filtered);
  } catch {
    /* fail silently */
  }
}
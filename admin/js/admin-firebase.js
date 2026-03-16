// ============================================================
// admin-firebase.js — LUXE Admin Shared Firebase (INR Edition)
// ============================================================
import { initializeApp }    from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore, collection, doc,
  getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  query, orderBy, limit, where,
  serverTimestamp, getCountFromServer
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ── Firebase Config ───────────────────────────────────────
const FC = {
  apiKey:            "AIzaSyCBZTHSR66dnkUz2uibhrvmGoAvv18vFdM",
  authDomain:        "shopzz-ca17e.firebaseapp.com",
  projectId:         "shopzz-ca17e",
  storageBucket:     "shopzz-ca17e.firebasestorage.app",
  messagingSenderId: "158388352339",
  appId:             "1:158388352339:web:2c1016ed5c782ed6e6dda6",
};

let _app;
try       { _app = initializeApp(FC); }
catch (e) { _app = initializeApp(FC, 'admin'); }

export const auth = getAuth(_app);
export const db   = getFirestore(_app);

// ── Auth Guard ────────────────────────────────────────────
export function requireAdmin(cb) {
  // Show loading splash
  const splash = document.createElement('div');
  splash.id = '_adm_splash';
  splash.style.cssText = 'position:fixed;inset:0;background:#070b12;display:flex;align-items:center;justify-content:center;z-index:9999;flex-direction:column;gap:1rem';
  splash.innerHTML = `
    <div style="font-family:'Syne',sans-serif;font-size:1.6rem;font-weight:800;color:#f1f5f9;letter-spacing:.1em">
      LU<span style="color:#3b82f6">X</span>E <span style="color:#475569;font-size:1rem">Admin</span>
    </div>
    <div style="width:32px;height:32px;border:2.5px solid rgba(59,130,246,.2);border-top-color:#3b82f6;border-radius:50%;animation:_sp_ .7s linear infinite"></div>
    <style>@keyframes _sp_{to{transform:rotate(360deg)}}</style>`;
  document.body.prepend(splash);

  onAuthStateChanged(auth, async (user) => {
    if (!user) { window.location.href = 'login.html'; return; }
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      const data = snap.data();
      if (!data || data.role !== 'admin') {
        showToast('Access Denied', 'Admin access required.', 'error');
        setTimeout(() => { window.location.href = 'login.html'; }, 1500);
        splash.remove();
        return;
      }
      // Set user info in sidebar
      const nameEl   = document.getElementById('sidebar-user-name');
      const avatarEl = document.getElementById('sidebar-avatar');
      const name = data.displayName || user.email || 'Admin';
      if (nameEl)   nameEl.textContent   = name;
      if (avatarEl) avatarEl.textContent = name.charAt(0).toUpperCase();

      splash.remove();
      cb(user, data);
    } catch {
      // First time — no users doc, allow
      splash.remove();
      cb(user, { role:'admin', displayName: user.email });
    }
  });
}

export async function adminLogin(email, password) {
  return await signInWithEmailAndPassword(auth, email, password);
}

export async function adminLogout() {
  await signOut(auth);
  window.location.href = 'login.html';
}

// ── Products ──────────────────────────────────────────────
export async function getProducts() {
  try {
    const q    = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch {
    // If no index, fallback without sort
    const snap = await getDocs(collection(db, 'products'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }
}

export async function getProduct(id) {
  const snap = await getDoc(doc(db, 'products', id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function createProduct(data) {
  const clean = {};
  Object.keys(data).forEach(k => { if (data[k] !== null && data[k] !== undefined && data[k] !== '') clean[k] = data[k]; });
  return await addDoc(collection(db, 'products'), { ...clean, createdAt: serverTimestamp(), sales: 0, views: 0 });
}

export async function editProduct(id, data) {
  const clean = {};
  Object.keys(data).forEach(k => { if (data[k] !== null && data[k] !== undefined && data[k] !== '') clean[k] = data[k]; });
  return await updateDoc(doc(db, 'products', id), { ...clean, updatedAt: serverTimestamp() });
}

export async function removeProduct(id) {
  return await deleteDoc(doc(db, 'products', id));
}

// ── Users ─────────────────────────────────────────────────
export async function getUsers() {
  try {
    const q    = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch {
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }
}

export async function makeAdmin(uid)   { return await updateDoc(doc(db,'users',uid), { role:'admin' }); }
export async function revokeAdmin(uid) { return await updateDoc(doc(db,'users',uid), { role:'customer' }); }
export async function banUser(uid)     { return await updateDoc(doc(db,'users',uid), { banned:true }); }
export async function unbanUser(uid)   { return await updateDoc(doc(db,'users',uid), { banned:false }); }

// ── Orders ────────────────────────────────────────────────
export async function getOrders() {
  try {
    const q    = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch {
    const snap = await getDocs(collection(db, 'orders'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }
}

export async function updateOrderStatus(id, status) {
  return await updateDoc(doc(db,'orders',id), { status, updatedAt: serverTimestamp() });
}

// ── Stats ─────────────────────────────────────────────────
export async function getDashboardStats() {
  const [ps, us, os] = await Promise.all([
    getDocs(collection(db,'products')),
    getDocs(collection(db,'users')),
    getDocs(collection(db,'orders')),
  ]);
  const revenue = os.docs.reduce((s,d) => s + (d.data().total || 0), 0);
  return { products: ps.size, users: us.size, orders: os.size, revenue };
}

// ── ₹ INR Currency ───────────────────────────────────────
export function formatCurrency(n) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(Math.round(n || 0));
}

// ── Date / Time ───────────────────────────────────────────
export function formatDate(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
}

export function timeAgo(ts) {
  if (!ts) return '—';
  const d    = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Date.now() - d.getTime();
  const m    = Math.floor(diff / 60000);
  if (m < 1)    return 'Abhi';
  if (m < 60)   return `${m}m ago`;
  if (m < 1440) return `${Math.floor(m/60)}h ago`;
  return `${Math.floor(m/1440)}d ago`;
}

// ── Status Badge ─────────────────────────────────────────
export function statusBadge(status = 'pending') {
  const map = {
    pending:'badge-amber', processing:'badge-blue',
    shipped:'badge-purple', delivered:'badge-green',
    cancelled:'badge-red', refunded:'badge-gray',
  };
  const labels = {
    pending:'Pending', processing:'Processing',
    shipped:'Shipped', delivered:'Delivered',
    cancelled:'Cancelled', refunded:'Refunded',
  };
  return `<span class="badge ${map[status]||'badge-gray'}">${labels[status]||status}</span>`;
}

// ── Toast ─────────────────────────────────────────────────
export function showToast(title, msg, type = 'info', duration = 3500) {
  let box = document.querySelector('.toast-container');
  if (!box) { box = document.createElement('div'); box.className = 'toast-container'; document.body.appendChild(box); }
  const icons = { info:'ℹ️', success:'✅', error:'❌', warning:'⚠️' };
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span style="font-size:.95rem;flex-shrink:0">${icons[type]||'ℹ️'}</span>
    <div><div class="toast-title">${title}</div><div class="toast-msg">${msg}</div></div>`;
  box.appendChild(t);
  requestAnimationFrame(()=>requestAnimationFrame(()=>t.classList.add('show')));
  setTimeout(()=>{ t.classList.remove('show'); setTimeout(()=>t.remove(),350); }, duration);
}

// ── Helpers ───────────────────────────────────────────────
export function debounce(fn, ms=300) {
  let t; return (...a) => { clearTimeout(t); t = setTimeout(()=>fn(...a),ms); };
}

export function setLoading(btn, on, html='') {
  if (!btn) return;
  if (html && !on) btn.dataset.orig = btn.dataset.orig || html;
  btn.disabled  = on;
  btn.innerHTML = on
    ? '<span style="display:inline-block;width:14px;height:14px;border:2px solid currentColor;border-top-color:transparent;border-radius:50%;animation:_sp_ .7s linear infinite"></span>'
    : (btn.dataset.orig || html || btn.innerHTML);
}

export function setActiveSidebarLink() {
  const page = location.pathname.split('/').pop();
  document.querySelectorAll('.sidebar__link').forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === page);
  });
}

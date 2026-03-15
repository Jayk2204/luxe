// ============================================================
// admin-firebase.js  —  Shared Firebase + Admin Utilities
// ============================================================

import { initializeApp }   from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  collection, doc,
  getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  query, orderBy, limit, where,
  serverTimestamp, getCountFromServer, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ── CONFIG ────────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyCBZTHSR66dnkUz2uibhrvmGoAvv18vFdM",
  authDomain:        "shopzz-ca17e.firebaseapp.com",
  projectId:         "shopzz-ca17e",
  storageBucket:     "shopzz-ca17e.firebasestorage.app",
  messagingSenderId: "158388352339",
  appId:             "1:158388352339:web:2c1016ed5c782ed6e6dda6",
  measurementId:     "G-F3RSKJT6N4"
};

export const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);

// ── ADMIN AUTH GUARD ──────────────────────────────────────
// Call this on every admin page — redirects to login if not authed
export function requireAdmin(callback) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = 'login.html';
      return;
    }
    // Check admin role in Firestore
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      const data = snap.data();
      if (!data || data.role !== 'admin') {
        showToast('Access Denied', 'Admin privileges required.', 'error');
        setTimeout(() => { window.location.href = 'login.html'; }, 1500);
        return;
      }
      // Set sidebar user info
      document.getElementById('sidebar-user-name')?.textContent && (
        document.getElementById('sidebar-user-name').textContent = data.displayName || user.email
      );
      document.getElementById('sidebar-avatar')?.textContent && (
        document.getElementById('sidebar-avatar').textContent = (data.displayName || user.email).charAt(0).toUpperCase()
      );
      callback(user, data);
    } catch (e) {
      // If users collection doesn't exist yet, allow first admin
      callback(user, { role: 'admin', displayName: user.email });
    }
  });
}

// ── LOGIN ─────────────────────────────────────────────────
export async function adminLogin(email, password) {
  return await signInWithEmailAndPassword(auth, email, password);
}

// ── LOGOUT ────────────────────────────────────────────────
export async function adminLogout() {
  await signOut(auth);
  window.location.href = 'login.html';
}

// ── PRODUCTS ──────────────────────────────────────────────
export async function getProducts(sortField = 'createdAt', sortDir = 'desc') {
  const q    = query(collection(db, 'products'), orderBy(sortField, sortDir));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getProduct(id) {
  const snap = await getDoc(doc(db, 'products', id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function createProduct(data) {
  return await addDoc(collection(db, 'products'), {
    ...data,
    createdAt: serverTimestamp(),
    sales: 0, views: 0
  });
}

export async function editProduct(id, data) {
  return await updateDoc(doc(db, 'products', id), {
    ...data,
    updatedAt: serverTimestamp()
  });
}

export async function removeProduct(id) {
  return await deleteDoc(doc(db, 'products', id));
}

export async function getProductCount() {
  const snap = await getCountFromServer(collection(db, 'products'));
  return snap.data().count;
}

// ── USERS ─────────────────────────────────────────────────
export async function getUsers(max = 100) {
  const q    = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(max));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getUserCount() {
  try {
    const snap = await getCountFromServer(collection(db, 'users'));
    return snap.data().count;
  } catch { return 0; }
}

export async function makeAdmin(uid) {
  return await updateDoc(doc(db, 'users', uid), { role: 'admin' });
}

export async function revokeAdmin(uid) {
  return await updateDoc(doc(db, 'users', uid), { role: 'customer' });
}

export async function banUser(uid) {
  return await updateDoc(doc(db, 'users', uid), { banned: true });
}

export async function unbanUser(uid) {
  return await updateDoc(doc(db, 'users', uid), { banned: false });
}

// ── ORDERS ────────────────────────────────────────────────
export async function getOrders(max = 100) {
  const q    = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(max));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getOrderCount() {
  try {
    const snap = await getCountFromServer(collection(db, 'orders'));
    return snap.data().count;
  } catch { return 0; }
}

export async function updateOrderStatus(id, status) {
  return await updateDoc(doc(db, 'orders', id), {
    status,
    updatedAt: serverTimestamp()
  });
}

export async function getTotalRevenue() {
  try {
    const snap = await getDocs(collection(db, 'orders'));
    return snap.docs.reduce((sum, d) => sum + (d.data().total || 0), 0);
  } catch { return 0; }
}

// ── DASHBOARD STATS ───────────────────────────────────────
export async function getDashboardStats() {
  const [products, users, orders, revenue] = await Promise.all([
    getProductCount(),
    getUserCount(),
    getOrderCount(),
    getTotalRevenue()
  ]);
  return { products, users, orders, revenue };
}

// ── TOAST ─────────────────────────────────────────────────
export function showToast(title, msg, type = 'info', duration = 3500) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = { info:'ℹ️', success:'✅', error:'❌', warning:'⚠️' };
  const toast  = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span style="font-size:1rem;flex-shrink:0">${icons[type]||'ℹ️'}</span>
    <div>
      <div class="toast-title">${title}</div>
      <div class="toast-msg">${msg}</div>
    </div>`;

  container.appendChild(toast);
  requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('show')));
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 350); }, duration);
}

// ── FORMAT HELPERS ────────────────────────────────────────
export function formatCurrency(n) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(Math.round(n || 0));
}

export function formatDate(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function timeAgo(ts) {
  if (!ts) return '—';
  const d    = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)   return 'Just now';
  if (mins < 60)  return `${mins}m ago`;
  if (mins < 1440)return `${Math.floor(mins/60)}h ago`;
  return `${Math.floor(mins/1440)}d ago`;
}

export function statusBadge(status = 'pending') {
  const map = {
    pending:    'badge-amber',
    processing: 'badge-blue',
    shipped:    'badge-purple',
    delivered:  'badge-green',
    cancelled:  'badge-red',
    refunded:   'badge-gray',
  };
  return `<span class="badge ${map[status]||'badge-gray'}">${status}</span>`;
}

// ── DEBOUNCE ──────────────────────────────────────────────
export function debounce(fn, ms = 300) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

// ── LOADING ───────────────────────────────────────────────
export function setLoading(btn, loading, text = '') {
  if (!btn) return;
  btn.disabled = loading;
  btn.innerHTML = loading
    ? '<span class="spin-anim" style="display:inline-block;width:14px;height:14px;border:2px solid currentColor;border-top-color:transparent;border-radius:50%;"></span>'
    : (text || btn.dataset.text || btn.innerHTML);
  if (text) btn.dataset.text = text;
}

// ── SIDEBAR ACTIVE STATE ──────────────────────────────────
export function setActiveSidebarLink() {
  const page = window.location.pathname.split('/').pop();
  document.querySelectorAll('.sidebar__link').forEach(link => {
    const href = link.getAttribute('href');
    link.classList.toggle('active', href === page || href === `./${page}`);
  });
}
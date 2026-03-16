// ============================================================
// auth.js  —  Firebase Authentication utilities  (FIXED)
// ============================================================

import { auth }                       from './firebase-config.js';
import { showToast }                  from './app.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import { db } from './firebase-config.js';
import {
  doc, setDoc, getDoc, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ── Auth state observer ───────────────────────────────────
export function observeAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

// ── Create Firestore user profile ────────────────────────
async function createUserProfile(user, extras = {}) {
  const ref  = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      uid:         user.uid,
      email:       user.email,
      displayName: user.displayName || extras.displayName || '',
      photoURL:    user.photoURL || '',
      role:        'customer',
      createdAt:   serverTimestamp(),
      wishlist:    [],
      ...extras,
    });
  }
}

// ── Register ──────────────────────────────────────────────
export async function registerUser({ email, password, displayName }) {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(user, { displayName });
  await createUserProfile(user, { displayName });
  showToast({ title: 'Welcome!', msg: `Hi ${displayName}, your account is ready.`, type: 'success' });
  return user;
}

// ── Login ─────────────────────────────────────────────────
export async function loginUser({ email, password }) {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  showToast({ title: 'Welcome back!', msg: user.displayName || email, type: 'success' });
  return user;
}

// ── Google Sign-In ────────────────────────────────────────
export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.addScope('profile');
  provider.addScope('email');
  const { user } = await signInWithPopup(auth, provider);
  await createUserProfile(user);
  showToast({ title: 'Signed in!', msg: user.displayName, type: 'success' });
  return user;
}

// ── Logout ────────────────────────────────────────────────
// FIX: don't hardcode /index.html — resolve relative to current origin
export async function logoutUser() {
  await signOut(auth);
  showToast({ msg: 'You have been signed out.', type: 'info' });
  // Redirect to auth page relative to current path depth
  const base = window.location.pathname.includes('/admin/')
    ? '../auth.html'
    : 'auth.html';
  window.location.href = base;
}

// ── Password Reset ────────────────────────────────────────
export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email, {
    url: `${window.location.origin}/auth.html`,
  });
  showToast({ title: 'Email sent!', msg: 'Check your inbox for reset instructions.', type: 'success' });
}

// ── Get current user ──────────────────────────────────────
export function getCurrentUser() {
  return auth.currentUser;
}

// ── Get Firestore profile ─────────────────────────────────
export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

// ── Update nav UI based on auth state ────────────────────
export function updateNavForUser(user) {
  const loginLink   = document.querySelector('#nav-login-link');
  const profileLink = document.querySelector('#nav-profile-link');
  const logoutBtn   = document.querySelector('#nav-logout-btn');

  if (user) {
    loginLink?.classList.add('hidden');
    profileLink?.classList.remove('hidden');
    logoutBtn?.classList.remove('hidden');
  } else {
    loginLink?.classList.remove('hidden');
    profileLink?.classList.add('hidden');
    logoutBtn?.classList.add('hidden');
  }
}

// ── Loading helper ────────────────────────────────────────
function setLoading(btn, loading) {
  if (!btn) return;
  btn.disabled = loading;
  btn.dataset.originalText = btn.dataset.originalText || btn.innerHTML;
  btn.innerHTML = loading
    ? '<span class="spin" style="display:inline-block;width:16px;height:16px;border:2px solid currentColor;border-top-color:transparent;border-radius:50%;animation:sp .7s linear infinite"></span>'
    : btn.dataset.originalText;
}

// ── Error messages ────────────────────────────────────────
function handleAuthError(err) {
  const msgs = {
    'auth/user-not-found':         'No account found with this email.',
    'auth/wrong-password':         'Incorrect password.',
    'auth/invalid-credential':     'Email or password is incorrect.',
    'auth/email-already-in-use':   'An account with this email already exists.',
    'auth/invalid-email':          'Please enter a valid email address.',
    'auth/weak-password':          'Password must be at least 6 characters.',
    'auth/too-many-requests':      'Too many attempts. Try again later.',
    'auth/popup-closed-by-user':   'Sign-in popup was closed.',
    'auth/network-request-failed': 'Network error. Check your connection.',
  };
  const message = msgs[err.code] || err.message || 'Something went wrong.';
  showToast({ title: 'Error', msg: message, type: 'error' });
}

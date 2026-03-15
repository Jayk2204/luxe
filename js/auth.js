// ============================================================
// auth.js  —  Firebase Authentication
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
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import { db } from './firebase-config.js';
import {
  doc, setDoc, getDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ── Auth State Observer ───────────────────────────────────
export function observeAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

// ── Create User Profile in Firestore ─────────────────────
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
      ...extras
    });
  }
}

// ── Register ──────────────────────────────────────────────
export async function registerUser({ email, password, displayName }) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const user       = credential.user;
  await updateProfile(user, { displayName });
  await createUserProfile(user, { displayName });
  showToast({ title: 'Welcome!', msg: `Hi ${displayName}, your account is ready.`, type: 'success' });
  return user;
}

// ── Login ─────────────────────────────────────────────────
export async function loginUser({ email, password }) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  showToast({ title: 'Welcome back!', msg: credential.user.displayName || email, type: 'success' });
  return credential.user;
}

// ── Google Sign-In ────────────────────────────────────────
export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.addScope('profile');
  provider.addScope('email');
  const result = await signInWithPopup(auth, provider);
  await createUserProfile(result.user);
  showToast({ title: 'Signed in!', msg: result.user.displayName, type: 'success' });
  return result.user;
}

// ── Logout ────────────────────────────────────────────────
export async function logoutUser() {
  await signOut(auth);
  showToast({ msg: 'You have been signed out.', type: 'info' });
  window.location.href = '/index.html';
}

// ── Password Reset ────────────────────────────────────────
export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
  showToast({ title: 'Email sent!', msg: 'Check your inbox for reset instructions.', type: 'success' });
}

// ── Get Current User ──────────────────────────────────────
export function getCurrentUser() {
  return auth.currentUser;
}

// ── Get User Profile from Firestore ──────────────────────
export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

// ── Auth Form Init (used on auth.html) ───────────────────
export function initAuthPage() {
  const tabs      = document.querySelectorAll('.auth-tab');
  const loginForm = document.getElementById('login-form');
  const regForm   = document.getElementById('register-form');
  if (!tabs.length) return;

  // Tab switching
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.tab;
      loginForm?.classList.toggle('hidden', target !== 'login');
      regForm?.classList.toggle('hidden',  target !== 'register');
    });
  });

  // Login Form Submit
  loginForm?.addEventListener('submit', async e => {
    e.preventDefault();
    const btn   = loginForm.querySelector('button[type=submit]');
    const email = loginForm.querySelector('#login-email').value.trim();
    const pass  = loginForm.querySelector('#login-password').value;
    setLoading(btn, true);
    try {
      await loginUser({ email, password: pass });
      window.location.href = '/index.html';
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(btn, false);
    }
  });

  // Register Form Submit
  regForm?.addEventListener('submit', async e => {
    e.preventDefault();
    const btn  = regForm.querySelector('button[type=submit]');
    const name = regForm.querySelector('#reg-name').value.trim();
    const email= regForm.querySelector('#reg-email').value.trim();
    const pass = regForm.querySelector('#reg-password').value;
    const pass2= regForm.querySelector('#reg-password2').value;

    if (pass !== pass2) {
      showToast({ msg: 'Passwords do not match.', type: 'error' });
      return;
    }
    if (pass.length < 6) {
      showToast({ msg: 'Password must be at least 6 characters.', type: 'error' });
      return;
    }

    setLoading(btn, true);
    try {
      await registerUser({ email, password: pass, displayName: name });
      window.location.href = '/index.html';
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(btn, false);
    }
  });

  // Google Button
  document.querySelectorAll('.btn-google').forEach(btn => {
    btn.addEventListener('click', async () => {
      try {
        await loginWithGoogle();
        window.location.href = '/index.html';
      } catch (err) {
        handleAuthError(err);
      }
    });
  });

  // Password visibility toggle
  document.querySelectorAll('.form-toggle-pass').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.closest('.form-input-wrap').querySelector('input');
      if (!input) return;
      const isPass = input.type === 'password';
      input.type   = isPass ? 'text' : 'password';
      btn.textContent = isPass ? '🙈' : '👁️';
    });
  });

  // Forgot password
  document.querySelector('#forgot-pass')?.addEventListener('click', async e => {
    e.preventDefault();
    const email = document.querySelector('#login-email')?.value?.trim();
    if (!email) { showToast({ msg: 'Enter your email first.', type: 'warning' }); return; }
    try {
      await resetPassword(email);
    } catch (err) {
      handleAuthError(err);
    }
  });

  // Update nav based on auth state
  observeAuth(user => updateNavForUser(user));
}

// ── Update Nav Avatar/Links ───────────────────────────────
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

// ── Loading State ─────────────────────────────────────────
function setLoading(btn, loading) {
  if (!btn) return;
  btn.disabled = loading;
  btn.dataset.originalText = btn.dataset.originalText || btn.innerHTML;
  btn.innerHTML = loading
    ? '<span class="spin" style="display:inline-block;width:16px;height:16px;border:2px solid currentColor;border-top-color:transparent;border-radius:50%;"></span>'
    : btn.dataset.originalText;
}

// ── Error Handling ────────────────────────────────────────
function handleAuthError(err) {
  const msgs = {
    'auth/user-not-found':      'No account found with this email.',
    'auth/wrong-password':      'Incorrect password.',
    'auth/email-already-in-use':'An account with this email already exists.',
    'auth/invalid-email':       'Please enter a valid email address.',
    'auth/weak-password':       'Password must be at least 6 characters.',
    'auth/too-many-requests':   'Too many attempts. Try again later.',
    'auth/popup-closed-by-user':'Sign-in popup was closed.',
    'auth/network-request-failed': 'Network error. Check your connection.',
  };
  const msg = msgs[err.code] || err.message || 'Something went wrong.';
  showToast({ title: 'Error', msg, type: 'error' });
}

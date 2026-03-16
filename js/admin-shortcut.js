// ============================================================
// admin-shortcut.js
// 
// Secret shortcut: Press  Ctrl + Shift + A  (ya phone pe
// site footer pe 5 baar tap karo) — admin modal khulega.
// Sahi password dalo → admin dashboard pe redirect.
// ============================================================

import { initializeApp }  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore, doc, getDoc,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ── Firebase (same config) ────────────────────────────────
const FC = {
  apiKey:            "AIzaSyCBZTHSR66dnkUz2uibhrvmGoAvv18vFdM",
  authDomain:        "shopzz-ca17e.firebaseapp.com",
  projectId:         "shopzz-ca17e",
  storageBucket:     "shopzz-ca17e.firebasestorage.app",
  messagingSenderId: "158388352339",
  appId:             "1:158388352339:web:2c1016ed5c782ed6e6dda6",
};
let _app;
try { _app = initializeApp(FC); } catch { _app = initializeApp(FC, 'admin_sc'); }
const auth = getAuth(_app);
const db   = getFirestore(_app);

// ── Inject Modal HTML + CSS ───────────────────────────────
const MODAL_ID = '__admin_modal__';

function injectModal() {
  if (document.getElementById(MODAL_ID)) return; // already there

  const el = document.createElement('div');
  el.id = MODAL_ID;
  el.innerHTML = `
  <style>
    #__admin_modal__ {
      position: fixed; inset: 0; z-index: 999999;
      background: rgba(0,0,0,0.85);
      backdrop-filter: blur(12px);
      display: flex; align-items: center; justify-content: center;
      padding: 1rem;
      opacity: 0; pointer-events: none;
      transition: opacity .25s ease;
    }
    #__admin_modal__.show {
      opacity: 1; pointer-events: all;
    }
    #__admin_box__ {
      background: #0d1117;
      border: 1px solid rgba(59,130,246,.25);
      border-radius: 16px;
      padding: 2.25rem 2rem;
      width: 100%; max-width: 380px;
      box-shadow: 0 0 60px rgba(59,130,246,.15), 0 25px 60px rgba(0,0,0,.6);
      transform: translateY(20px) scale(.97);
      transition: transform .3s cubic-bezier(.16,1,.3,1);
      position: relative;
    }
    #__admin_modal__.show #__admin_box__ {
      transform: translateY(0) scale(1);
    }

    /* close btn */
    #__adm_close__ {
      position: absolute; top: .9rem; right: .9rem;
      background: rgba(255,255,255,.06); border: none;
      width: 28px; height: 28px; border-radius: 50%;
      color: #555; font-size: .85rem; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: all .2s;
    }
    #__adm_close__:hover { background: rgba(239,68,68,.15); color: #ef4444; }

    /* logo */
    #__adm_logo__ {
      text-align: center; margin-bottom: 1.5rem;
    }
    #__adm_logo__ .icon {
      width: 52px; height: 52px; border-radius: 14px;
      background: rgba(59,130,246,.12);
      border: 1px solid rgba(59,130,246,.25);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.4rem; margin: 0 auto .8rem;
      box-shadow: 0 0 20px rgba(59,130,246,.2);
    }
    #__adm_logo__ h3 {
      font-family: 'Syne','DM Sans',sans-serif;
      font-size: 1rem; font-weight: 800; color: #f1f5f9;
      letter-spacing: .05em;
    }
    #__adm_logo__ p { font-size: .72rem; color: #475569; margin-top: .25rem; }

    /* shortcut hint */
    #__adm_hint__ {
      display: inline-flex; align-items: center; gap: .3rem;
      background: rgba(59,130,246,.08);
      border: 1px solid rgba(59,130,246,.15);
      border-radius: 6px; padding: .25rem .7rem;
      font-size: .65rem; color: #60a5fa;
      font-family: 'JetBrains Mono',monospace;
      margin-bottom: 1.5rem;
    }
    kbd {
      background: rgba(255,255,255,.08);
      border: 1px solid rgba(255,255,255,.12);
      border-radius: 4px; padding: .1rem .35rem;
      font-size: .65rem; font-family: inherit;
    }

    /* alert */
    #__adm_err__ {
      background: rgba(239,68,68,.08);
      border: 1px solid rgba(239,68,68,.2);
      border-radius: 8px; padding: .6rem .9rem;
      font-size: .76rem; color: #f87171;
      margin-bottom: 1rem; display: none;
      align-items: center; gap: .4rem;
    }
    #__adm_ok__ {
      background: rgba(34,197,94,.08);
      border: 1px solid rgba(34,197,94,.2);
      border-radius: 8px; padding: .6rem .9rem;
      font-size: .76rem; color: #4ade80;
      margin-bottom: 1rem; display: none;
      align-items: center; gap: .4rem;
    }

    /* inputs */
    .__adm_fg__ { margin-bottom: .9rem; }
    .__adm_lbl__ {
      display: block; font-size: .65rem; font-weight: 700;
      letter-spacing: .12em; text-transform: uppercase;
      color: #334155; margin-bottom: .4rem;
    }
    .__adm_iw__ { position: relative; }
    .__adm_ico__ {
      position: absolute; left: .85rem; top: 50%;
      transform: translateY(-50%);
      color: #334155; font-size: .78rem; pointer-events: none;
    }
    .__adm_inp__ {
      width: 100%;
      background: #131920;
      border: 1.5px solid rgba(255,255,255,.07);
      border-radius: 9px; color: #f1f5f9;
      font-size: .88rem; padding: .7rem 1rem .7rem 2.4rem;
      outline: none; font-family: 'DM Sans',sans-serif;
      transition: border-color .2s, box-shadow .2s;
    }
    .__adm_inp__:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59,130,246,.1);
    }
    .__adm_inp__::placeholder { color: #2a3544; }
    .__adm_eye__ {
      position: absolute; right: .85rem; top: 50%;
      transform: translateY(-50%);
      background: none; border: none;
      color: #334155; cursor: pointer; font-size: .8rem;
      transition: color .2s;
    }
    .__adm_eye__:hover { color: #3b82f6; }

    /* submit */
    #__adm_btn__ {
      width: 100%; padding: .8rem;
      background: #3b82f6; color: #fff;
      border: none; border-radius: 9px;
      font-size: .88rem; font-weight: 700;
      font-family: 'DM Sans',sans-serif;
      cursor: pointer; transition: all .22s;
      display: flex; align-items: center; justify-content: center; gap: .5rem;
      box-shadow: 0 0 20px rgba(59,130,246,.25);
    }
    #__adm_btn__:hover:not(:disabled) {
      background: #2563eb; transform: translateY(-1px);
      box-shadow: 0 0 30px rgba(59,130,246,.4);
    }
    #__adm_btn__:disabled { opacity: .45; cursor: not-allowed; transform: none; }

    .__adm_spin__ {
      width: 15px; height: 15px;
      border: 2px solid rgba(255,255,255,.3);
      border-top-color: #fff; border-radius: 50%;
      animation: __adm_sp__ .7s linear infinite;
    }
    @keyframes __adm_sp__ { to { transform: rotate(360deg); } }

    /* mobile tap hint */
    #__adm_tap_hint__ {
      text-align: center; margin-top: 1rem;
      font-size: .65rem; color: #1e293b;
    }
  </style>

  <div id="__admin_box__">
    <!-- Close -->
    <button id="__adm_close__" title="Close (Esc)">✕</button>

    <!-- Logo -->
    <div id="__adm_logo__">
      <div class="icon">🛡️</div>
      <h3>LUXE <span style="color:#3b82f6">ADMIN</span></h3>
      <p>Admin credentials enter karo</p>
    </div>

    <!-- Shortcut hint -->
    <div style="text-align:center;margin-bottom:1.5rem">
      <span id="__adm_hint__">
        <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>A</kbd> &nbsp;·&nbsp; Secret Admin Panel
      </span>
    </div>

    <!-- Alerts -->
    <div id="__adm_err__">⚠️ <span id="__adm_err_msg__"></span></div>
    <div id="__adm_ok__">✅ <span id="__adm_ok_msg__"></span></div>

    <!-- Form -->
    <form id="__adm_form__" onsubmit="return false">
      <div class="__adm_fg__">
        <label class="__adm_lbl__">Admin Email</label>
        <div class="__adm_iw__">
          <input type="email" class="__adm_inp__" id="__adm_email__"
            placeholder="admin@example.com" autocomplete="email" required>
          <i class="__adm_ico__ fa fa-envelope"></i>
        </div>
      </div>

      <div class="__adm_fg__">
        <label class="__adm_lbl__">Password</label>
        <div class="__adm_iw__">
          <input type="password" class="__adm_inp__" id="__adm_pass__"
            placeholder="••••••••" autocomplete="current-password" required>
          <i class="__adm_ico__ fa fa-lock"></i>
          <button type="button" class="__adm_eye__" id="__adm_eye_btn__">
            <i class="fa fa-eye"></i>
          </button>
        </div>
      </div>

      <button type="submit" id="__adm_btn__">
        🔐 &nbsp; Admin Panel Kholo
      </button>
    </form>

    <div id="__adm_tap_hint__">
      📱 Mobile pe: Footer pe 5 baar tap karo
    </div>
  </div>
  `;
  document.body.appendChild(el);

  // ── Bind events ──────────────────────────────────────────
  const modal   = el;
  const closeBtn = el.querySelector('#__adm_close__');
  const form     = el.querySelector('#__adm_form__');
  const eyeBtn   = el.querySelector('#__adm_eye_btn__');

  // Close on overlay click or Escape
  modal.addEventListener('click', e => {
    if (e.target === modal) hideModal();
  });
  closeBtn.addEventListener('click', hideModal);

  // Eye toggle
  eyeBtn.addEventListener('click', () => {
    const inp = document.getElementById('__adm_pass__');
    const ico = eyeBtn.querySelector('i');
    inp.type = inp.type === 'password' ? 'text' : 'password';
    ico.className = `fa fa-eye${inp.type === 'password' ? '' : '-slash'}`;
  });

  // Form submit
  form.addEventListener('submit', handleAdminLogin);
}

// ── Show / Hide modal ────────────────────────────────────
function showModal() {
  injectModal();
  const modal = document.getElementById(MODAL_ID);
  modal.classList.add('show');

  // Focus email field
  setTimeout(() => {
    document.getElementById('__adm_email__')?.focus();
  }, 200);

  clearAlerts();
}

function hideModal() {
  const modal = document.getElementById(MODAL_ID);
  modal?.classList.remove('show');
}

// ── Handle login ──────────────────────────────────────────
async function handleAdminLogin(e) {
  e.preventDefault();
  const email = document.getElementById('__adm_email__').value.trim();
  const pass  = document.getElementById('__adm_pass__').value;
  const btn   = document.getElementById('__adm_btn__');
  clearAlerts();

  // Loading
  btn.disabled = true;
  btn.innerHTML = '<div class="__adm_spin__"></div>';

  try {
    // Sign in with Firebase
    const cred = await signInWithEmailAndPassword(auth, email, pass);

    // Check if role === 'admin' in Firestore
    const snap = await getDoc(doc(db, 'users', cred.user.uid));
    const data = snap.data();

    if (!data || data.role !== 'admin') {
      // Not admin — sign out immediately
      const { signOut } = await import(
        "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js"
      );
      await signOut(auth);
      showErr('Yeh account admin nahi hai.');
      btn.disabled = false;
      btn.innerHTML = '🔐 &nbsp; Admin Panel Kholo';
      return;
    }

    // ✅ Admin confirmed — redirect
    showOk('Admin verified! Dashboard khul raha hai…');
    setTimeout(() => {
      window.location.href = 'admin/dashboard.html';
    }, 800);

  } catch (err) {
    const msgs = {
      'auth/user-not-found':      'Email registered nahi hai.',
      'auth/wrong-password':      'Password galat hai.',
      'auth/invalid-credential':  'Email ya password galat hai.',
      'auth/too-many-requests':   'Bahut attempts. Thodi der baad try karo.',
      'auth/invalid-email':       'Valid email daalo.',
    };
    showErr(msgs[err.code] || 'Kuch gadbad ho gayi.');
    btn.disabled = false;
    btn.innerHTML = '🔐 &nbsp; Admin Panel Kholo';
  }
}

// ── Alerts ────────────────────────────────────────────────
function showErr(msg) {
  const el = document.getElementById('__adm_err__');
  document.getElementById('__adm_err_msg__').textContent = msg;
  el.style.display = 'flex';
}
function showOk(msg) {
  const el = document.getElementById('__adm_ok__');
  document.getElementById('__adm_ok_msg__').textContent = msg;
  el.style.display = 'flex';
}
function clearAlerts() {
  const e = document.getElementById('__adm_err__');
  const o = document.getElementById('__adm_ok__');
  if (e) e.style.display = 'none';
  if (o) o.style.display = 'none';
}

// ──────────────────────────────────────────────────────────
// 🎹 KEYBOARD SHORTCUT — Ctrl + Shift + A
// ──────────────────────────────────────────────────────────
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === 'A') {
    e.preventDefault();
    const modal = document.getElementById(MODAL_ID);
    if (modal?.classList.contains('show')) {
      hideModal();
    } else {
      showModal();
    }
  }

  // Also close on Escape
  if (e.key === 'Escape') hideModal();
});

// ──────────────────────────────────────────────────────────
// 📱 MOBILE SHORTCUT — Footer pe 5 baar tap
// ──────────────────────────────────────────────────────────
let tapCount = 0;
let tapTimer = null;

function setupMobileTap() {
  // Tap on footer
  const footer = document.querySelector('footer, .footer');
  const target = footer || document.body;

  target.addEventListener('click', () => {
    tapCount++;
    clearTimeout(tapTimer);

    if (tapCount >= 5) {
      tapCount = 0;
      showModal();
      return;
    }

    // Reset after 2 seconds of no taps
    tapTimer = setTimeout(() => { tapCount = 0; }, 2000);
  });
}

// ── Init ──────────────────────────────────────────────────
// Pre-inject modal (silent, hidden)
injectModal();
setupMobileTap();

// If already logged in as admin, show a subtle admin button in corner
onAuthStateChanged(auth, async (user) => {
  if (!user) return;
  try {
    const snap = await getDoc(doc(db, 'users', user.uid));
    if (snap.data()?.role === 'admin') {
      // Show tiny floating admin button
      const fab = document.createElement('a');
      fab.href = 'admin/dashboard.html';
      fab.title = 'Admin Dashboard';
      fab.style.cssText = `
        position: fixed; bottom: 1.5rem; left: 1.5rem;
        width: 42px; height: 42px; border-radius: 50%;
        background: #0d1117;
        border: 1px solid rgba(59,130,246,.3);
        display: flex; align-items: center; justify-content: center;
        font-size: 1rem; z-index: 9000;
        box-shadow: 0 4px 15px rgba(0,0,0,.4);
        transition: all .2s; text-decoration: none;
        color: #3b82f6;
      `;
      fab.innerHTML = '🛡️';
      fab.addEventListener('mouseenter', () => {
        fab.style.transform = 'scale(1.1)';
        fab.style.boxShadow = '0 4px 20px rgba(59,130,246,.3)';
      });
      fab.addEventListener('mouseleave', () => {
        fab.style.transform = 'scale(1)';
        fab.style.boxShadow = '0 4px 15px rgba(0,0,0,.4)';
      });
      document.body.appendChild(fab);
    }
  } catch { /* ignore */ }
});

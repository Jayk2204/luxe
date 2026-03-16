// ============================================================
// auth-guard.js  —  FIXED
// Import on any protected page. Blocks unverified users too.
// ============================================================

import { auth } from './firebase-config.js';
import { onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// ── Loading splash ────────────────────────────────────────
const splash = document.createElement('div');
splash.id = '__auth_splash';
splash.innerHTML = `
  <style>
    #__auth_splash {
      position: fixed; inset: 0; z-index: 999999;
      background: #080808;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 1.5rem;
      transition: opacity .35s ease;
    }
    #__auth_splash .sp-logo {
      font-family: 'Bebas Neue', 'Arial Black', sans-serif;
      font-size: 2.8rem; letter-spacing: .2em; color: #f5f0e8;
    }
    #__auth_splash .sp-logo span { color: #c9a96e; }
    #__auth_splash .sp-ring {
      width: 38px; height: 38px;
      border: 2.5px solid rgba(201,169,110,.2);
      border-top-color: #c9a96e;
      border-radius: 50%;
      animation: __sp_spin .75s linear infinite;
    }
    @keyframes __sp_spin { to { transform: rotate(360deg); } }
  </style>
  <div class="sp-logo">LU<span>X</span>E</div>
  <div class="sp-ring"></div>
`;
document.body.prepend(splash);

function hideSplash() {
  splash.style.opacity = '0';
  setTimeout(() => splash.remove(), 380);
}

// ── Auth check ────────────────────────────────────────────
onAuthStateChanged(auth, (user) => {
  if (!user) {
    // Not logged in → redirect to auth
    const returnUrl = encodeURIComponent(window.location.href);
    window.location.replace(`auth.html?next=${returnUrl}`);
    return;
  }

  // FIX: also block users who registered but never verified their email
  if (!user.emailVerified) {
    const returnUrl = encodeURIComponent(window.location.href);
    window.location.replace(`auth.html?next=${returnUrl}`);
    return;
  }

  // ✅ Logged in and verified — show the page
  hideSplash();
  _updateNav(user);
});

// ── Update nav ────────────────────────────────────────────
function _updateNav(user) {
  // Hide login links
  document.querySelectorAll('#nav-login-link').forEach(el => {
    el.style.display = 'none';
  });

  // Show logout button
  document.querySelectorAll('#nav-logout-btn').forEach(btn => {
    btn.style.display = 'flex';
    // Remove any previous listener to avoid stacking
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const { signOut } = await import(
        "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js"
      );
      await signOut(auth);
      window.location.href = 'auth.html';
    });
  });

  // Update user icon with initials
  const userBtn = document.getElementById('nav-user-btn');
  if (userBtn) {
    const initials = (user.displayName || user.email || 'U').charAt(0).toUpperCase();
    userBtn.innerHTML = `
      <span style="
        width:28px;height:28px;border-radius:50%;
        background:var(--gold,#c9a96e);color:#080808;
        display:flex;align-items:center;justify-content:center;
        font-size:.75rem;font-weight:700;
      ">${initials}</span>`;
    userBtn.title = user.displayName || user.email;
    userBtn.style.display = 'flex';
  }
}

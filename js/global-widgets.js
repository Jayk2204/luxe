// ============================================================
// global-widgets.js — WhatsApp Float Button + PWA Install
// Import this on every page: <script type="module" src="./js/global-widgets.js"></script>
// ============================================================

// ── CONFIG ────────────────────────────────────────────────
const WA_NUMBER  = '919876543210'; // Replace with your WhatsApp number (no + or spaces)
const WA_MESSAGE = 'Hello LUXE! I need help with my order 🛍️';

// ── 1. Register Service Worker (PWA) ──────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

// ── 2. Inject styles ──────────────────────────────────────
const style = document.createElement('style');
style.textContent = `
  /* WhatsApp float */
  .wa-float {
    position: fixed; bottom: 24px; right: 24px; z-index: 9000;
    width: 56px; height: 56px; border-radius: 50%;
    background: #25d366; color: #fff;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.5rem; text-decoration: none;
    box-shadow: 0 4px 20px rgba(37,211,102,.4);
    transition: transform .25s, box-shadow .25s;
    animation: waPop .4s cubic-bezier(.34,1.56,.64,1) both;
  }
  .wa-float:hover { transform: scale(1.1); box-shadow: 0 6px 28px rgba(37,211,102,.55); }
  @keyframes waPop { from{opacity:0;transform:scale(.5)} to{opacity:1;transform:scale(1)} }

  /* Tooltip */
  .wa-float::before {
    content: attr(data-tip);
    position: absolute; right: 68px; bottom: 50%;
    transform: translateY(50%);
    background: #1a1a1a; color: #f5f0e8;
    font-family: 'DM Sans', sans-serif; font-size: .75rem; font-weight: 500;
    padding: .4rem .75rem; border-radius: 6px; white-space: nowrap;
    opacity: 0; pointer-events: none;
    transition: opacity .2s; box-shadow: 0 4px 16px rgba(0,0,0,.4);
  }
  .wa-float::after {
    content: '';
    position: absolute; right: 60px; bottom: 50%; transform: translateY(50%);
    border: 6px solid transparent; border-left-color: #1a1a1a;
    opacity: 0; pointer-events: none; transition: opacity .2s;
  }
  .wa-float:hover::before, .wa-float:hover::after { opacity: 1; }

  /* PWA install banner */
  .pwa-banner {
    position: fixed; bottom: 90px; right: 24px; z-index: 8999;
    background: #1a1a1a; border: 1px solid rgba(201,169,110,.2);
    border-radius: 14px; padding: 1rem 1.25rem;
    max-width: 300px; box-shadow: 0 8px 32px rgba(0,0,0,.6);
    display: flex; flex-direction: column; gap: .65rem;
    animation: bannerSlide .4s cubic-bezier(.34,1.56,.64,1) both;
  }
  @keyframes bannerSlide { from{opacity:0;transform:translateX(30px)} to{opacity:1;transform:none} }
  .pwa-banner__head { display:flex; align-items:center; gap:.6rem; }
  .pwa-banner__logo { font-family:'Bebas Neue',sans-serif; font-size:1.1rem; letter-spacing:.1em; color:#f5f0e8; }
  .pwa-banner__logo span { color:#c9a96e; }
  .pwa-banner__title { font-size:.82rem; font-weight:600; color:#f5f0e8; }
  .pwa-banner__sub   { font-size:.73rem; color:#888; line-height:1.5; }
  .pwa-banner__actions { display:flex; gap:.5rem; }
  .pwa-btn-install { flex:1; padding:.55rem; background:#c9a96e; color:#080808; border:none; border-radius:7px; font-family:'DM Sans',sans-serif; font-size:.78rem; font-weight:700; cursor:pointer; transition:background .2s; }
  .pwa-btn-install:hover { background:#e2c998; }
  .pwa-btn-dismiss { padding:.55rem .8rem; background:transparent; color:#666; border:1px solid #333; border-radius:7px; font-family:'DM Sans',sans-serif; font-size:.78rem; cursor:pointer; transition:all .2s; }
  .pwa-btn-dismiss:hover { border-color:#555; color:#999; }
`;
document.head.appendChild(style);

// ── 3. WhatsApp Button ────────────────────────────────────
const wa = document.createElement('a');
wa.className   = 'wa-float';
wa.href        = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(WA_MESSAGE)}`;
wa.target      = '_blank';
wa.rel         = 'noopener';
wa.setAttribute('data-tip', 'Chat on WhatsApp');
wa.setAttribute('aria-label', 'Chat on WhatsApp');
wa.innerHTML   = `<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`;
document.body.appendChild(wa);

// ── 4. PWA Install Banner ─────────────────────────────────
let deferredPrompt = null;
const pwaKey = 'luxe_pwa_dismissed';

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
  // Only show if not dismissed in last 7 days
  const last = parseInt(localStorage.getItem(pwaKey) || '0');
  if (Date.now() - last < 7 * 24 * 60 * 60 * 1000) return;
  // Delay 5s so it doesn't interrupt initial load
  setTimeout(showPWABanner, 5000);
});

function showPWABanner() {
  if (document.querySelector('.pwa-banner')) return;
  const banner = document.createElement('div');
  banner.className = 'pwa-banner';
  banner.innerHTML = `
    <div class="pwa-banner__head">
      <span style="font-size:1.4rem">📱</span>
      <div>
        <div class="pwa-banner__title">Install LUXE App</div>
        <div class="pwa-banner__sub">Shop faster, get order notifications, works offline</div>
      </div>
    </div>
    <div class="pwa-banner__actions">
      <button class="pwa-btn-install" id="pwa-install-btn">📲 Install</button>
      <button class="pwa-btn-dismiss" id="pwa-dismiss-btn">Not now</button>
    </div>`;
  document.body.appendChild(banner);

  document.getElementById('pwa-install-btn').addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    banner.remove();
  });

  document.getElementById('pwa-dismiss-btn').addEventListener('click', () => {
    localStorage.setItem(pwaKey, Date.now());
    banner.remove();
  });
}

// Already installed — hide banner
window.addEventListener('appinstalled', () => {
  document.querySelector('.pwa-banner')?.remove();
  localStorage.setItem(pwaKey, Date.now());
});

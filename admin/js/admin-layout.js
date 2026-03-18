// ============================================================
// admin-layout.js — Sidebar + Topbar Injector
// ============================================================
export function injectLayout(pageTitle = 'Dashboard') {
  document.body.insertAdjacentHTML('afterbegin', `
  <div class="sidebar-overlay" id="sidebar-overlay"></div>

  <aside class="sidebar" id="sidebar">
    <div class="sidebar__logo">
      <div class="sidebar__logo-icon">🛡️</div>
      <span class="sidebar__logo-text">LU<span>X</span>E</span>
      <span class="sidebar__badge">Admin</span>
    </div>
    <nav class="sidebar__nav">
      <div class="sidebar__section-label">Main</div>
      <a href="dashboard.html" class="sidebar__link">
        <span class="icon">📊</span><span>Dashboard</span>
        <span class="badge" id="sb-orders-count" style="margin-left:auto">—</span>
      </a>
      <a href="products.html" class="sidebar__link">
        <span class="icon">📦</span><span>Products</span>
        <span class="badge" id="sb-products-count" style="margin-left:auto">—</span>
      </a>
      <a href="orders.html" class="sidebar__link">
        <span class="icon">🛒</span><span>Orders</span>
      </a>
      <a href="users.html" class="sidebar__link">
        <span class="icon">👥</span><span>Users</span>
        <span class="badge" id="sb-users-count" style="margin-left:auto">—</span>
      </a>
      <a href="coupons.html" class="sidebar__link">
        <span class="icon">🎟️</span><span>Coupons</span>
      </a>
      <a href="reports.html" class="sidebar__link">
        <span class="icon">R</span><span>Reports</span>
      </a>
      <div class="sidebar__section-label" style="margin-top:1.5rem">Store</div>
      <a href="../index.html" class="sidebar__link" target="_blank">
        <span class="icon">🏪</span><span>View Store</span>
      </a>
      <a href="../seed.html" class="sidebar__link" target="_blank">
        <span class="icon">🌱</span><span>Seed Products</span>
      </a>
      <div class="sidebar__section-label" style="margin-top:1.5rem">Account</div>
      <a href="#" class="sidebar__link" id="logout-btn">
        <span class="icon">🚪</span><span>Sign Out</span>
      </a>
    </nav>
    <div class="sidebar__footer">
      <div class="sidebar__user">
        <div class="sidebar__avatar" id="sidebar-avatar">A</div>
        <div style="overflow:hidden">
          <div class="sidebar__user-name" id="sidebar-user-name">Admin</div>
          <div class="sidebar__user-role">Administrator</div>
        </div>
      </div>
    </div>
  </aside>

  <header class="topbar">
    <div class="topbar__left">
      <button class="topbar__btn" id="mobile-menu-btn" style="display:none">
        <i class="fa fa-bars"></i>
      </button>
      <div class="topbar__title">${pageTitle}</div>
    </div>
    <div class="topbar__right">
      <div class="topbar__live"><div class="live-dot"></div>Live</div>
      <a href="../index.html" target="_blank" class="btn btn-outline btn-sm" style="font-size:.75rem">
        <i class="fa fa-external-link-alt"></i> Store
      </a>
    </div>
  </header>
  `);

  // Mobile sidebar toggle
  const btn     = document.getElementById('mobile-menu-btn');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');

  // Show hamburger on mobile
  if (window.innerWidth <= 900) btn.style.display = 'flex';
  window.addEventListener('resize', () => {
    btn.style.display = window.innerWidth <= 900 ? 'flex' : 'none';
  });

  btn?.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('open');
    document.body.style.overflow = sidebar.classList.contains('open') ? 'hidden' : '';
  });
  overlay?.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  });

  // Close sidebar on nav link click (mobile)
  sidebar.querySelectorAll('.sidebar__link').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 900) {
        sidebar.classList.remove('open');
        overlay.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  });
}

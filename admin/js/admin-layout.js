// ============================================================
// admin-layout.js  —  Shared Sidebar + Topbar HTML
// ============================================================

export function injectLayout(pageTitle = 'Dashboard') {
  document.body.insertAdjacentHTML('afterbegin', `

  <!-- Sidebar Overlay (mobile) -->
  <div class="sidebar-overlay" id="sidebar-overlay"></div>

  <!-- SIDEBAR -->
  <aside class="sidebar" id="sidebar">
    <div class="sidebar__logo">
      <div class="sidebar__logo-icon">🛡️</div>
      <span class="sidebar__logo-text">LU<span>X</span>E</span>
      <span class="sidebar__badge">Admin</span>
    </div>

    <nav class="sidebar__nav">
      <div class="sidebar__section-label">Main</div>
      <a href="dashboard.html" class="sidebar__link">
        <span class="icon">📊</span> Dashboard
      </a>
      <a href="products.html" class="sidebar__link">
        <span class="icon">📦</span> Products
        <span class="badge" id="sb-products-count">—</span>
      </a>
      <a href="orders.html" class="sidebar__link">
        <span class="icon">🛒</span> Orders
        <span class="badge amber" id="sb-orders-count">—</span>
      </a>
      <a href="users.html" class="sidebar__link">
        <span class="icon">👥</span> Users
        <span class="badge" id="sb-users-count">—</span>
      </a>

      <div class="sidebar__section-label" style="margin-top:1rem">Store</div>
      <a href="../index.html" class="sidebar__link" target="_blank">
        <span class="icon">🏪</span> View Store
      </a>
      <a href="../products.html" class="sidebar__link" target="_blank">
        <span class="icon">🛍️</span> Shop Page
      </a>

      <div class="sidebar__section-label" style="margin-top:1rem">Settings</div>
      <a href="#" class="sidebar__link" id="logout-btn">
        <span class="icon">🚪</span> Sign Out
      </a>
    </nav>

    <div class="sidebar__footer">
      <div class="sidebar__user">
        <div class="sidebar__avatar" id="sidebar-avatar">A</div>
        <div>
          <div class="sidebar__user-name" id="sidebar-user-name">Admin</div>
          <div class="sidebar__user-role">Administrator</div>
        </div>
      </div>
    </div>
  </aside>

  <!-- TOPBAR -->
  <header class="topbar">
    <div class="topbar__left">
      <button class="topbar__btn mobile-menu-btn" id="mobile-menu-btn">
        <i class="fa fa-bars"></i>
      </button>
      <div>
        <div class="topbar__title">${pageTitle}</div>
      </div>
    </div>
    <div class="topbar__right">
      <div class="topbar__live">
        <div class="live-dot"></div> Live
      </div>
      <button class="topbar__btn topbar-right-hide" title="Notifications">
        <i class="fa fa-bell"></i>
        <div class="topbar__notif-dot"></div>
      </button>
      <a href="../index.html" target="_blank"
        class="btn btn-outline btn-sm topbar-right-hide">
        <i class="fa fa-external-link-alt"></i> Store
      </a>
    </div>
  </header>
  `);

  // Mobile menu
  const btn     = document.getElementById('mobile-menu-btn');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');

  btn?.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('open');
  });
  overlay?.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
  });
}

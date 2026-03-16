// admin-shortcut.js
// Ctrl + Shift + A  →  seedha admin/login.html pe redirect
document.addEventListener('keydown', function (e) {
  if (e.ctrlKey && e.shiftKey && e.key === 'A') {
    e.preventDefault();
    window.location.href = 'admin/login.html';
  }
});

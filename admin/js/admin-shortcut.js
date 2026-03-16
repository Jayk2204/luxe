// admin-shortcut.js (inside admin/)
// Ctrl + Shift + A  →  admin/login.html pe redirect (already here, so dashboard)
document.addEventListener('keydown', function (e) {
  if (e.ctrlKey && e.shiftKey && e.key === 'A') {
    e.preventDefault();
    window.location.href = 'login.html';
  }
});

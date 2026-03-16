// admin-shortcut.js
// Ctrl + Shift + A  →  opens admin/login.html
document.addEventListener('keydown', function (e) {
  if (e.ctrlKey && e.shiftKey && e.key === 'A') {
    e.preventDefault();
    window.location.href = 'admin/login.html';
  }
});

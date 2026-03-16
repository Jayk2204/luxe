// admin-shortcut.js (inside admin/)
// Ctrl + Shift + A  →  already on admin, go to login
document.addEventListener('keydown', function (e) {
  if (e.ctrlKey && e.shiftKey && e.key === 'A') {
    e.preventDefault();
    window.location.href = 'login.html';
  }
});

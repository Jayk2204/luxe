// ============================================================
// firebase-config.js  —  LUXE E-Commerce
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth }        from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore }   from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage }     from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { getAnalytics }   from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";

// ✅ TERI ACTUAL CONFIG — ALREADY FILLED IN!
const firebaseConfig = {
  apiKey:            "AIzaSyCBZTHSR66dnkUz2uibhrvmGoAvv18vFdM",
  authDomain:        "shopzz-ca17e.firebaseapp.com",
  projectId:         "shopzz-ca17e",
  storageBucket:     "shopzz-ca17e.firebasestorage.app",
  messagingSenderId: "158388352339",
  appId:             "1:158388352339:web:2c1016ed5c782ed6e6dda6",
  measurementId:     "G-F3RSKJT6N4"
};

// ── Initialize ──
const app       = initializeApp(firebaseConfig);
const auth      = getAuth(app);
const db        = getFirestore(app);
const storage   = getStorage(app);
const analytics = getAnalytics(app);

export { app, auth, db, storage, analytics };
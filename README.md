# LUXE — Premium E-Commerce Store

## 🏗️ Project Structure
```
ecommerce/
├── index.html           ← Homepage (hero, categories, featured products)
├── products.html        ← Product listing with filter + sort
├── product.html         ← Product detail page
├── cart.html            ← Shopping cart
├── checkout.html        ← Checkout form
├── auth.html            ← Login / Register
├── order-success.html   ← Order confirmation
├── firestore.rules      ← Firebase security rules
│
├── css/
│   └── main.css         ← Full design system + animations
│
└── js/
    ├── firebase-config.js  ← 🔴 Edit this first!
    ├── app.js              ← Global utils: cursor, toast, cart, wishlist
    ├── auth.js             ← Firebase Auth (email + Google)
    ├── products.js         ← Firestore product CRUD + render
    └── cart.js             ← Cart logic + order placement
```

---

## ⚡ Quick Start

### Step 1 — Create Firebase Project
1. Go to [firebase.google.com](https://firebase.google.com)
2. Create a new project (e.g. `luxe-store`)
3. Enable **Authentication** → Email/Password + Google
4. Enable **Firestore Database** (Start in test mode)
5. Go to **Project Settings → Your apps → Add Web App**
6. Copy the config object

### Step 2 — Add Your Firebase Config
Open `js/firebase-config.js` and replace:
```js
const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT_ID.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID",
};
```

### Step 3 — Seed Sample Products
In Firebase Console → Firestore → Start a collection called `products`.
Add a document with these fields:
```json
{
  "name": "Obsidian Noir Jacket",
  "category": "Jackets",
  "price": 289,
  "originalPrice": 389,
  "rating": 4.8,
  "reviews": 124,
  "badge": "New",
  "emoji": "🧥",
  "tags": ["jacket", "luxury"],
  "stock": 15,
  "featured": true
}
```

Or run the seed script from browser console:
```js
// Open browser console on any page after Firebase is configured
import { addProduct, DEMO_PRODUCTS } from './js/products.js';
DEMO_PRODUCTS.forEach(p => addProduct(p));
```

### Step 4 — Deploy Security Rules
```bash
npm install -g firebase-tools
firebase login
firebase init
firebase deploy --only firestore:rules
```

### Step 5 — Host with Firebase Hosting
```bash
firebase init hosting
# Set public directory to: . (current folder)
# Configure as single-page app: No
firebase deploy
```

---

## 🔑 Key Features

| Feature | Implementation |
|---------|---------------|
| Authentication | Firebase Auth (email + Google OAuth) |
| Product Catalog | Firestore with real-time pagination |
| Shopping Cart | LocalStorage (syncs to Firestore on login) |
| Wishlist | LocalStorage (saved per user) |
| Orders | Firestore `orders` collection |
| Search | Client-side (upgrade to Algolia for scale) |
| Animations | CSS keyframes + IntersectionObserver |
| Responsive | CSS Grid + clamp() + media queries |
| Custom Cursor | Canvas-free JS cursor |

---

## 🚀 Scaling Tips

### Add Algolia Search
```bash
npm install algoliasearch
```
Replace `searchProducts()` in `products.js` with Algolia's instant search.

### Add Stripe Payments
```bash
npm install stripe
```
Replace the COD payment in `cart.js` with Stripe's payment intent API.

### Add Real Images
Replace emoji placeholders in product cards with:
```js
<img src="${product.imageUrl}" alt="${product.name}" class="product-card__img" loading="lazy">
```
Use Firebase Storage or Cloudinary for image hosting.

### Firebase Indexes Required
For the products query to work with multiple filters, add these indexes in Firebase Console:

- `products`: `category ASC, createdAt DESC`
- `products`: `featured ASC, createdAt DESC`
- `orders`: `userId ASC, createdAt DESC`

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| `--gold` | `#c9a96e` |
| `--black` | `#080808` |
| `--cream` | `#f5f0e8` |
| Font Display | Cormorant Garamond |
| Font Body | DM Sans |
| Font Accent | Bebas Neue |

---

## 📞 Support
Built with Firebase v10 + vanilla JS ES modules. No bundler required — open directly in browser or serve with `npx serve .`

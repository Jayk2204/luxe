// ============================================================
// india-config.js  —  India Store Configuration
// Currency: INR ₹ | GST: 18% | Free shipping: ₹999+
// ============================================================

// ── Currency Formatter ────────────────────────────────────
export function formatPrice(amount) {
  if (isNaN(amount) || amount === null || amount === undefined) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style:                 'currency',
    currency:              'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ── Short format (e.g. ₹1,299) ───────────────────────────
export function formatPriceShort(amount) {
  return '₹' + new Intl.NumberFormat('en-IN').format(Math.round(amount || 0));
}

// ── Cart Totals (Indian rules) ────────────────────────────
export const STORE_CONFIG = {
  currency:         'INR',
  currencySymbol:   '₹',
  country:          'India',
  locale:           'en-IN',
  gstRate:          0.18,        // 18% GST included in price (so we show 0 extra tax)
  freeShippingAbove: 999,        // Free shipping above ₹999
  shippingCharge:   79,          // ₹79 flat shipping below ₹999
  codCharge:        49,          // ₹49 COD handling fee
  codFreeAbove:     1999,        // Free COD above ₹1999
};

// ── Calculate Cart Totals ─────────────────────────────────
export function calcTotals(items) {
  const subtotal  = items.reduce((s, i) => s + (i.product.price * i.qty), 0);
  const shipping  = subtotal >= STORE_CONFIG.freeShippingAbove ? 0 : STORE_CONFIG.shippingCharge;
  const codCharge = 0; // added separately at checkout if COD selected
  const gst       = 0; // prices are GST-inclusive (show as included)
  const total     = subtotal + shipping;
  const count     = items.reduce((s, i) => s + i.qty, 0);
  const savings   = items.reduce((s, i) => {
    const orig = i.product.originalPrice;
    return orig ? s + ((orig - i.product.price) * i.qty) : s;
  }, 0);

  return { subtotal, shipping, gst, codCharge, total, count, savings };
}

// ── Indian Payment Methods ────────────────────────────────
export const PAYMENT_METHODS = [
  {
    id:    'upi',
    name:  'UPI',
    icon:  '📱',
    desc:  'GPay, PhonePe, Paytm, BHIM — instant payment',
    popular: true,
  },
  {
    id:    'card',
    name:  'Credit / Debit Card',
    icon:  '💳',
    desc:  'Visa, Mastercard, RuPay — all cards accepted',
    popular: false,
  },
  {
    id:    'netbanking',
    name:  'Net Banking',
    icon:  '🏦',
    desc:  'All major Indian banks supported',
    popular: false,
  },
  {
    id:    'wallet',
    name:  'Paytm Wallet',
    icon:  '👛',
    desc:  'Pay using your Paytm balance',
    popular: false,
  },
  {
    id:    'cod',
    name:  'Cash on Delivery',
    icon:  '💵',
    desc:  `Pay when delivered (+₹${STORE_CONFIG.codCharge} handling fee on orders below ₹${STORE_CONFIG.codFreeAbove})`,
    popular: false,
  },
  {
    id:    'emi',
    name:  'EMI',
    icon:  '📅',
    desc:  'No-cost EMI on select cards — 3, 6, 9 months',
    popular: false,
  },
];

// ── Indian States ─────────────────────────────────────────
export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar',
  'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh',
  'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra',
  'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  // UTs
  'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir',
  'Ladakh', 'Lakshadweep', 'Puducherry',
];

// ── Indian Cities (major) ─────────────────────────────────
export const MAJOR_CITIES = [
  'Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Ahmedabad', 'Chennai',
  'Kolkata', 'Surat', 'Pune', 'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur',
  'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri-Chinchwad',
  'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik',
  'Ranchi', 'Faridabad', 'Meerut', 'Rajkot', 'Kalyan-Dombivali',
  'Vasai-Virar', 'Varanasi', 'Srinagar', 'Aurangabad', 'Dhanbad',
  'Amritsar', 'Navi Mumbai', 'Allahabad', 'Howrah', 'Gwalior',
  'Jabalpur', 'Coimbatore', 'Vijayawada', 'Jodhpur', 'Madurai',
  'Raipur', 'Kota', 'Guwahati', 'Chandigarh', 'Noida',
];

// ── Promo Codes (Indian) ──────────────────────────────────
export const PROMO_CODES = {
  'LUXE10':   { discount: 0.10, minOrder: 999,  desc: '10% off on orders above ₹999' },
  'WELCOME':  { discount: 0.15, minOrder: 1499, desc: '15% off for new customers' },
  'VIP20':    { discount: 0.20, minOrder: 2999, desc: '20% off for VIP members' },
  'INDIA50':  { discount: 50,   fixed: true, minOrder: 499, desc: '₹50 flat off on orders above ₹499' },
  'FREESHIP': { shipping: true, minOrder: 0,  desc: 'Free shipping on this order' },
};

// ── Delivery Estimates ────────────────────────────────────
export function getDeliveryEstimate(city = '') {
  const metros = ['Mumbai','Delhi','Bengaluru','Hyderabad','Chennai','Kolkata','Pune','Ahmedabad','Noida','Gurugram'];
  const isMetro = metros.some(m => city.toLowerCase().includes(m.toLowerCase()));
  const today   = new Date();

  const minDays = isMetro ? 2 : 4;
  const maxDays = isMetro ? 4 : 7;

  const minDate = new Date(today); minDate.setDate(today.getDate() + minDays);
  const maxDate = new Date(today); maxDate.setDate(today.getDate() + maxDays);

  const fmt = d => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  return `${fmt(minDate)} – ${fmt(maxDate)}`;
}

// ── Format Indian Phone ───────────────────────────────────
export function formatPhone(phone) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+91 ${digits.slice(0,5)} ${digits.slice(5)}`;
  return phone;
}

// ── GST breakdown ─────────────────────────────────────────
export function gstBreakdown(amount) {
  // Prices are GST inclusive — reverse calculate
  const gst  = amount - (amount / (1 + STORE_CONFIG.gstRate));
  const base = amount - gst;
  return {
    basePrice: Math.round(base),
    gstAmount: Math.round(gst),
    gstRate:   '18%',
    total:     amount,
  };
}
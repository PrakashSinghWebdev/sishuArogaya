import { useSyncExternalStore } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';

export const CATEGORIES = [
  { name: 'Baby Clothing', emoji: '👕', bg: '#fde7dc' },
  { name: 'Nutrition',     emoji: '🥣', bg: '#e6f4ea' },
  { name: 'Baby Care',     emoji: '🧴', bg: '#f3e8dd' },
  { name: 'Toys',          emoji: '🧸', bg: '#fdf1d6' },
  { name: 'Health Kits',   emoji: '🩺', bg: '#e3eefc' },
  { name: 'Feeding',       emoji: '🍼', bg: '#ece6fb' },
];

// ponytail: static catalogue; move to a products API when the shop goes live
export const PRODUCTS = [
  { id: 1,  category: 'Baby Clothing', name: 'Cotton Baby Romper',    emoji: '👶', price: 499,  old: null, rating: 4.6, reviews: 120, tag: 'New',  subtitle: 'Soft organic cotton, 0–12 months', desc: 'Breathable, skin-friendly organic cotton with easy snap buttons for quick changes.' },
  { id: 2,  category: 'Health Kits',   name: 'Digital Thermometer',   emoji: '🌡️', price: 299,  old: 399,  rating: 4.4, reviews: 96,  tag: '-25%', subtitle: 'Fast 10-second reading',           desc: 'Flexible tip, fever alarm and memory recall — safe for oral, underarm and rectal use.' },
  { id: 3,  category: 'Health Kits',   name: 'Baby Weighing Scale',   emoji: '⚖️', price: 1299, old: null, rating: 4.7, reviews: 156, tag: 'New',  subtitle: 'Accurate to 5 grams',              desc: 'Track your baby’s weight at home and compare it with the growth chart in your parent portal.' },
  { id: 4,  category: 'Nutrition',     name: 'Ragi Cereal Mix',       emoji: '🥣', price: 249,  old: 299,  rating: 4.5, reviews: 87,  tag: '-15%', subtitle: 'Iron-rich first food, 6m+',         desc: 'Sprouted ragi with no added sugar or salt — an ideal first weaning food.' },
  { id: 5,  category: 'Feeding',       name: 'Steel Feeding Bottle',  emoji: '🍼', price: 399,  old: null, rating: 4.3, reviews: 76,  tag: 'New',  subtitle: 'BPA-free stainless steel',          desc: 'Anti-colic nipple and a durable steel body that is easy to sterilise.' },
  { id: 6,  category: 'Toys',          name: 'Soft Plush Teddy',      emoji: '🧸', price: 349,  old: 449,  rating: 4.8, reviews: 113, tag: '-20%', subtitle: 'Washable, child-safe stitching',    desc: 'Super-soft plush with embroidered eyes — no small parts to swallow.' },
  { id: 7,  category: 'Baby Care',     name: 'Mosquito Net Cradle',   emoji: '🛏️', price: 899,  old: 1099, rating: 4.7, reviews: 120, tag: 'Bestseller', subtitle: 'Foldable, zip-closed net',  desc: 'Breathable net for safe, bite-free sleep.' },
  { id: 8,  category: 'Health Kits',   name: 'ORS + Zinc Kit',        emoji: '💊', price: 149,  old: null, rating: 4.9, reviews: 98,  tag: 'Bestseller', subtitle: 'WHO-recommended formula',   desc: 'Essential diarrhoea care for every home.' },
  { id: 9,  category: 'Health Kits',   name: 'Growth Height Chart',   emoji: '📏', price: 199,  old: 249,  rating: 4.6, reviews: 75,  tag: 'Bestseller', subtitle: 'Wall chart, 0–150 cm',      desc: 'Track height month by month at home.' },
  { id: 10, category: 'Baby Care',     name: 'Baby Massage Oil',      emoji: '🧴', price: 229,  old: null, rating: 4.5, reviews: 64,  tag: null,   subtitle: 'Cold-pressed coconut & almond',     desc: 'Gentle, fragrance-free oil for daily baby massage.' },
  { id: 11, category: 'Baby Clothing', name: 'Woollen Cap & Mittens', emoji: '🧢', price: 299,  old: 349,  rating: 4.4, reviews: 52,  tag: null,   subtitle: 'Soft wool, 0–18 months',            desc: 'Keeps little heads and hands warm in winter.' },
  { id: 12, category: 'Toys',          name: 'Rattle Toy Set',        emoji: '🪀', price: 259,  old: null, rating: 4.6, reviews: 81,  tag: null,   subtitle: 'Set of 4, BPA-free',                desc: 'Bright colours and gentle sounds for sensory development.' },
  { id: 13, category: 'Feeding',       name: 'Spill-proof Sipper',    emoji: '🥤', price: 199,  old: 249,  rating: 4.3, reviews: 47,  tag: null,   subtitle: 'Soft spout, 6m+',                   desc: 'Easy-grip handles help babies learn to drink on their own.' },
  { id: 14, category: 'Nutrition',     name: 'Dry Fruit Powder',      emoji: '🥜', price: 349,  old: null, rating: 4.7, reviews: 69,  tag: null,   subtitle: 'Almond, cashew & pista, 8m+',       desc: 'Add a spoon to porridge or milk for extra energy and protein.' },
];

export const findProduct = (id) => PRODUCTS.find((p) => p.id === Number(id));
export const inr = (n) => `₹${n.toLocaleString('en-IN')}`;
export const stars = (r) => '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r));
export const FREE_SHIPPING_MIN = 499;
export const shippingFor = (subtotal) => (subtotal === 0 || subtotal >= FREE_SHIPPING_MIN ? 0 : 49);
export const offPct = (p) => (p.old ? Math.round((1 - p.price / p.old) * 100) : 0);
export const DELIVERY = '30 minutes';

// Tiny localStorage-backed store so every component (header, pages) sees the same cart/wishlist.
// Storage can throw in private mode, so reads/writes are guarded and fall back to memory.
// ponytail: browser-only; move cart/orders to the server when real checkout exists
const cache = {};
const subs = new Set();
function read(key, fallback) {
  if (!(key in cache)) {
    try { cache[key] = JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { cache[key] = fallback; }
  }
  return cache[key];
}
function useStored(key, fallback) {
  const value = useSyncExternalStore(
    (cb) => { subs.add(cb); return () => subs.delete(cb); },
    () => read(key, fallback),
  );
  const set = (next) => {
    cache[key] = typeof next === 'function' ? next(read(key, fallback)) : next;
    try { localStorage.setItem(key, JSON.stringify(cache[key])); } catch { /* memory only */ }
    subs.forEach((f) => f());
  };
  return [value, set];
}

export function useCart() {
  const [items, setItems] = useStored('shopCartItems', []);
  const lines = items.map((i) => ({ ...i, product: findProduct(i.id) })).filter((l) => l.product);
  const setQty = (id, qty) => setItems((it) => {
    if (qty < 1) return it.filter((i) => i.id !== id);
    return it.some((i) => i.id === id) ? it.map((i) => (i.id === id ? { ...i, qty } : i)) : [...it, { id, qty }];
  });
  const qtyOf = (id) => items.find((i) => i.id === id)?.qty ?? 0;
  return {
    lines,
    qtyOf,
    setQty,
    add: (id, qty = 1) => setQty(id, qtyOf(id) + qty),
    clear: () => setItems([]),
    count: lines.reduce((n, l) => n + l.qty, 0),
    subtotal: lines.reduce((n, l) => n + l.qty * l.product.price, 0),
    mrpTotal: lines.reduce((n, l) => n + l.qty * (l.product.old ?? l.product.price), 0),
  };
}

export function useWishlist() {
  const [ids, setIds] = useStored('shopWishlist', []);
  const toggle = (id) => setIds((x) => (x.includes(id) ? x.filter((i) => i !== id) : [...x, id]));
  return { ids, toggle, has: (id) => ids.includes(id) };
}

export const useOrders = () => useStored('shopOrders', []);

// Blinkit-style ADD button that turns into a − qty + stepper once the item is in the cart.
export function AddButton({ id, big }) {
  const { qtyOf, setQty } = useCart();
  const qty = qtyOf(id);
  const cls = `bk-add${big ? ' big' : ''}`;
  if (!qty) return <button className={cls} onClick={() => setQty(id, 1)}>ADD</button>;
  return (
    <div className={`${cls} on`}>
      <button onClick={() => setQty(id, qty - 1)} aria-label="Remove one">−</button>
      <span aria-live="polite">{qty}</span>
      <button onClick={() => setQty(id, qty + 1)} aria-label="Add one">+</button>
    </div>
  );
}

function HeaderSearch() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const onProducts = pathname === '/shop/products';
  const go = (q) => {
    const next = onProducts ? new URLSearchParams(params) : new URLSearchParams();
    q ? next.set('q', q) : next.delete('q');
    navigate(`/shop/products${next.size ? `?${next}` : ''}`, { replace: onProducts });
  };
  return (
    <label className="bk-search">
      <i className="bi bi-search" />
      <input
        type="search"
        placeholder='Search "baby oil", "thermometer"…'
        value={onProducts ? params.get('q') || '' : ''}
        onChange={(e) => go(e.target.value)}
        aria-label="Search products"
      />
    </label>
  );
}

export function ShopHeader() {
  const { count, subtotal } = useCart();
  const [orders] = useOrders();
  const city = orders[0]?.address?.city;
  return (
    <header className="bk-header">
      <Link to="/shop" className="bk-logo">shishu<span>shop</span></Link>
      <div className="bk-eta">
        <b>Delivery in {DELIVERY}</b>
        <span>{city ? `Home – ${city}` : 'Set address at checkout'} <i className="bi bi-caret-down-fill" /></span>
      </div>
      <HeaderSearch />
      <nav className="bk-actions">
        <Link to="/shop/orders" aria-label="My orders"><i className="bi bi-bag" /><span>Orders</span></Link>
        <Link to="/shop/wishlist" aria-label="Wishlist"><i className="bi bi-heart" /><span>Wishlist</span></Link>
        <Link to="/login" aria-label="Login"><i className="bi bi-person" /><span>Login</span></Link>
        <Link to="/shop/cart" className="bk-cart-btn" aria-label="My cart">
          <i className="bi bi-cart3" />
          {count ? <span><b>{count} item{count > 1 ? 's' : ''}</b><br />{inr(subtotal)}</span> : <span>My Cart</span>}
        </Link>
      </nav>
    </header>
  );
}

// Floating green bar shown on phones once the cart has items (hidden on cart/checkout).
function CartBar() {
  const { count, subtotal } = useCart();
  const { pathname } = useLocation();
  if (!count || pathname === '/shop/cart' || pathname === '/shop/checkout') return null;
  return (
    <Link to="/shop/cart" className="bk-cartbar">
      <i className="bi bi-cart3" />
      <span><b>{count} item{count > 1 ? 's' : ''}</b><br />{inr(subtotal)}</span>
      <span className="ms-auto fw-bold">View Cart <i className="bi bi-caret-right-fill" /></span>
    </Link>
  );
}

export function ProductCard({ p }) {
  const wish = useWishlist();
  const off = offPct(p);
  return (
    <div className="bk-card">
      {off > 0 && <span className="bk-off">{off}%<br />OFF</span>}
      <button className="bk-like" onClick={() => wish.toggle(p.id)} aria-label="Toggle wishlist">
        <i className={`bi ${wish.has(p.id) ? 'bi-heart-fill text-danger' : 'bi-heart'}`} />
      </button>
      <Link to={`/shop/${p.id}`} className="bk-card-link">
        <div className="bk-card-img">{p.emoji}</div>
        <span className="bk-time"><i className="bi bi-stopwatch" /> 30 MINS</span>
        <div className="bk-card-name">{p.name}</div>
        <div className="bk-card-sub">{p.subtitle}</div>
      </Link>
      <div className="bk-card-foot">
        <div>
          <div className="fw-bold">{inr(p.price)}</div>
          {p.old && <s className="bk-mrp">{inr(p.old)}</s>}
        </div>
        <AddButton id={p.id} />
      </div>
    </div>
  );
}

export function Rail({ title, items, to }) {
  return (
    <section className="bk-section">
      <div className="bk-section-head">
        <h2>{title}</h2>
        {to && <Link to={to}>see all</Link>}
      </div>
      <div className="bk-rail">{items.map((p) => <ProductCard key={p.id} p={p} />)}</div>
    </section>
  );
}

export function ShopPage({ children }) {
  return (
    <div className="bk">
      <ShopHeader />
      <main className="bk-main">{children}</main>
      <CartBar />
    </div>
  );
}

export function EmptyState({ icon, title, children }) {
  return (
    <div className="bk-empty">
      <i className={`bi ${icon}`} />
      <h2>{title}</h2>
      {children}
      <Link to="/shop" className="bk-btn d-inline-block mt-3">Start Shopping</Link>
    </div>
  );
}

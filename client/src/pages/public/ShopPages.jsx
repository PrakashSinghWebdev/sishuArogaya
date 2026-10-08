import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  CATEGORIES, PRODUCTS, FREE_SHIPPING_MIN, DELIVERY, findProduct, inr, shippingFor,
  useCart, useWishlist, useOrders, ShopPage, ProductCard, AddButton, EmptyState,
} from './shopShared';
import './Shop.css';

const SORTS = {
  relevance: (a, b) => b.reviews - a.reviews,
  priceLow:  (a, b) => a.price - b.price,
  priceHigh: (a, b) => b.price - a.price,
  discount:  (a, b) => (b.old ? 1 - b.price / b.old : 0) - (a.old ? 1 - a.price / a.old : 0),
};

export function Products() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const category = params.get('category') || '';
  const sale = params.get('sale') === '1';
  const sort = params.get('sort') || 'relevance';
  const pick = (next) => setParams(q ? { ...next, q } : next, { replace: true });
  const setSort = (value) => {
    const next = new URLSearchParams(params);
    next.set('sort', value);
    setParams(next, { replace: true });
  };

  const list = PRODUCTS
    .filter((p) => !category || p.category === category)
    .filter((p) => !sale || p.old)
    .filter((p) => !q || `${p.name} ${p.category} ${p.subtitle}`.toLowerCase().includes(q.toLowerCase()))
    .sort(SORTS[sort] || SORTS.relevance);

  const side = [
    { key: 'all',  label: 'All Products', emoji: '🛍️', bg: '#eef0f4', active: !category && !sale, next: {} },
    ...CATEGORIES.map((c) => ({ key: c.name, label: c.name, emoji: c.emoji, bg: c.bg, active: category === c.name, next: { category: c.name } })),
    { key: 'sale', label: 'On Sale',      emoji: '🏷️', bg: '#ffe4e4', active: sale, next: { sale: '1' } },
  ];

  let title = category || (sale ? 'On Sale' : 'All Products');
  if (q) title = `Results for "${q}"`;

  return (
    <ShopPage>
      <div className="bk-listing">
        <aside className="bk-side">
          {side.map((s) => (
            <button key={s.key} className={s.active ? 'active' : ''} onClick={() => pick(s.next)}>
              <span style={{ background: s.bg }}>{s.emoji}</span>{s.label}
            </button>
          ))}
        </aside>
        <section className="bk-listing-body">
          <div className="bk-listing-head">
            <h1>{title} <small className="bk-muted">({list.length})</small></h1>
            <label className="bk-sort">
              <span>Sort By</span>
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="relevance">Relevance</option>
                <option value="priceLow">Price (Low to High)</option>
                <option value="priceHigh">Price (High to Low)</option>
                <option value="discount">% Off</option>
              </select>
            </label>
          </div>
          {list.length
            ? <div className="bk-grid">{list.map((p) => <ProductCard key={p.id} p={p} />)}</div>
            : <EmptyState icon="bi-search" title="Nothing here yet"><p className="bk-muted">Try a different search or category.</p></EmptyState>}
        </section>
      </div>
    </ShopPage>
  );
}

function BillDetails({ subtotal, mrpTotal }) {
  const shipping = shippingFor(subtotal);
  const saved = mrpTotal - subtotal;
  return (
    <div className="bk-box">
      <h2>Bill details</h2>
      <div className="bk-bill"><span><i className="bi bi-receipt" /> Items total {saved > 0 && <em>Saved {inr(saved)}</em>}</span><span>{saved > 0 && <s className="bk-muted me-1">{inr(mrpTotal)}</s>}{inr(subtotal)}</span></div>
      <div className="bk-bill"><span><i className="bi bi-bicycle" /> Delivery charge</span><span>{shipping ? inr(shipping) : <><s className="bk-muted me-1">{inr(49)}</s><b style={{ color: 'var(--success)' }}>FREE</b></>}</span></div>
      {shipping > 0 && <p className="bk-hint">Add items worth {inr(FREE_SHIPPING_MIN - subtotal)} more for FREE delivery</p>}
      <div className="bk-bill total"><span>Grand total</span><span>{inr(subtotal + shipping)}</span></div>
    </div>
  );
}

function CartLines({ lines }) {
  return (
    <div className="bk-box">
      <div className="bk-eta-box">
        <span>⏱️</span>
        <div><b>Delivery in {DELIVERY}</b><div className="bk-muted small">Shipment of {lines.reduce((n, l) => n + l.qty, 0)} item(s)</div></div>
      </div>
      {lines.map(({ id, product: p }) => (
        <div key={id} className="bk-line">
          <Link to={`/shop/${id}`} className="bk-line-img">{p.emoji}</Link>
          <div className="flex-grow-1">
            <Link to={`/shop/${id}`} className="bk-card-name">{p.name}</Link>
            <div className="bk-muted small">{p.subtitle}</div>
            <b>{inr(p.price)}</b>{p.old && <s className="bk-mrp ms-1">{inr(p.old)}</s>}
          </div>
          <AddButton id={id} />
        </div>
      ))}
    </div>
  );
}

export function Cart() {
  const { lines, subtotal, mrpTotal } = useCart();
  if (!lines.length) {
    return <ShopPage><EmptyState icon="bi-cart3" title="You don't have any items in your cart"><p className="bk-muted">Your favourite items are just a click away.</p></EmptyState></ShopPage>;
  }
  const total = subtotal + shippingFor(subtotal);
  return (
    <ShopPage>
      <div className="bk-narrow">
        <h1 className="bk-page-title">My Cart</h1>
        <CartLines lines={lines} />
        <BillDetails subtotal={subtotal} mrpTotal={mrpTotal} />
        <div className="bk-box small">
          <b>Cancellation Policy</b>
          <div className="bk-muted">Orders cannot be cancelled once packed for delivery. In case of unexpected delays, a refund will be provided, if applicable.</div>
        </div>
        <Link to="/shop/checkout" className="bk-proceed">
          <span><b>{inr(total)}</b><br /><small>TOTAL</small></span>
          <span>Proceed <i className="bi bi-caret-right-fill" /></span>
        </Link>
      </div>
    </ShopPage>
  );
}

export function Checkout() {
  const { lines, subtotal, mrpTotal, clear } = useCart();
  const [orders, setOrders] = useOrders();
  const navigate = useNavigate();
  const [placing, setPlacing] = useState(false);
  const last = orders[0]?.address ?? {};

  if (!lines.length && !placing) return <Navigate to="/shop/cart" replace />;

  const placeOrder = (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    const id = `SA${Date.now().toString().slice(-8)}`;
    const shipping = shippingFor(subtotal);
    // ponytail: order is saved in the browser only; POST to a server orders API when payments go live
    setOrders((o) => [{
      id,
      date: new Date().toISOString(),
      items: lines.map((l) => ({ id: l.id, qty: l.qty, price: l.product.price })),
      subtotal,
      shipping,
      total: subtotal + shipping,
      payment: f.payment,
      address: { name: f.name, phone: f.phone, line: f.line, city: f.city, state: f.state, pincode: f.pincode },
      status: 'Placed',
    }, ...o]);
    setPlacing(true);
    clear();
    navigate(`/shop/orders/${id}`, { replace: true, state: { justPlaced: true } });
  };

  const field = (name, label, { col = 'col-md-6', ...props } = {}) => (
    <div className={col}>
      <label className="form-label small" htmlFor={`co-${name}`}>{label}</label>
      <input id={`co-${name}`} name={name} className="form-control" required defaultValue={last[name] ?? ''} {...props} />
    </div>
  );

  return (
    <ShopPage>
      <form className="bk-checkout" onSubmit={placeOrder}>
        <div>
          <h1 className="bk-page-title">Checkout</h1>
          <div className="bk-box">
            <h2>Delivery address</h2>
            <div className="row g-3">
              {field('name', 'Full name', { autoComplete: 'name' })}
              {field('phone', 'Mobile number', { type: 'tel', pattern: '[6-9][0-9]{9}', title: '10-digit Indian mobile number', autoComplete: 'tel' })}
              {field('line', 'House no., street, area', { col: 'col-12', autoComplete: 'street-address' })}
              {field('city', 'City / Village', { col: 'col-md-4', autoComplete: 'address-level2' })}
              {field('state', 'State', { col: 'col-md-4', autoComplete: 'address-level1' })}
              {field('pincode', 'PIN code', { col: 'col-md-4', pattern: '[1-9][0-9]{5}', title: '6-digit PIN code', inputMode: 'numeric', autoComplete: 'postal-code' })}
            </div>
          </div>
          <div className="bk-box">
            <h2>Payment method</h2>
            {[
              ['Cash on Delivery', 'Pay in cash when your order arrives', '💵'],
              ['UPI on Delivery', 'Scan & pay with any UPI app at your door', '📱'],
            ].map(([label, sub, emoji], i) => (
              <label key={label} className="bk-pay">
                <input type="radio" name="payment" value={label} defaultChecked={i === 0} />
                <span className="fs-4">{emoji}</span>
                <span><b>{label}</b><br /><small className="bk-muted">{sub}</small></span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <CartLines lines={lines} />
          <BillDetails subtotal={subtotal} mrpTotal={mrpTotal} />
          <button type="submit" className="bk-proceed w-100 border-0">
            <span><b>{inr(subtotal + shippingFor(subtotal))}</b><br /><small>TOTAL</small></span>
            <span>Place Order <i className="bi bi-caret-right-fill" /></span>
          </button>
        </div>
      </form>
    </ShopPage>
  );
}

const fmtDate = (iso) => new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });

export function OrderDetail() {
  const { id } = useParams();
  const [orders] = useOrders();
  const justPlaced = useLocation().state?.justPlaced;
  const order = orders.find((o) => o.id === id);
  if (!order) return <Navigate to="/shop/orders" replace />;
  const a = order.address;

  return (
    <ShopPage>
      <div className="bk-narrow">
        {justPlaced && (
          <div className="bk-success">
            <i className="bi bi-check-circle-fill" />
            <h1>Order placed!</h1>
            <p>Arriving in {DELIVERY}. We’ll call {a.phone} before delivery.</p>
          </div>
        )}
        <div className="bk-box">
          <div className="d-flex justify-content-between flex-wrap gap-2">
            <div><b>Order #{order.id}</b><div className="bk-muted small">{fmtDate(order.date)}</div></div>
            <span className="bk-status">{order.status}</span>
          </div>
        </div>
        <div className="bk-box">
          <h2>{order.items.reduce((n, i) => n + i.qty, 0)} item(s) in this order</h2>
          {order.items.map((it) => {
            const p = findProduct(it.id);
            return (
              <div key={it.id} className="bk-line">
                <div className="bk-line-img">{p?.emoji ?? '📦'}</div>
                <div className="flex-grow-1"><div className="bk-card-name">{p?.name ?? 'Product'}</div><div className="bk-muted small">{it.qty} × {inr(it.price)}</div></div>
                <b>{inr(it.price * it.qty)}</b>
              </div>
            );
          })}
        </div>
        <div className="bk-box">
          <h2>Bill details</h2>
          <div className="bk-bill"><span>Items total</span><span>{inr(order.subtotal)}</span></div>
          <div className="bk-bill"><span>Delivery charge</span><span>{order.shipping ? inr(order.shipping) : 'FREE'}</span></div>
          <div className="bk-bill total"><span>Grand total</span><span>{inr(order.total)}</span></div>
        </div>
        <div className="bk-box small">
          <h2>Order details</h2>
          <div className="bk-muted">Payment</div><div className="mb-2">{order.payment}</div>
          <div className="bk-muted">Deliver to</div><div>{a.name}, {a.line}, {a.city}, {a.state} – {a.pincode} · {a.phone}</div>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <Link to="/shop/orders" className="bk-btn outline">All orders</Link>
          <Link to="/shop" className="bk-btn">Continue shopping</Link>
        </div>
      </div>
    </ShopPage>
  );
}

export function Orders() {
  const [orders] = useOrders();
  if (!orders.length) {
    return <ShopPage><EmptyState icon="bi-bag" title="No orders yet"><p className="bk-muted">Your orders will show up here.</p></EmptyState></ShopPage>;
  }
  return (
    <ShopPage>
      <div className="bk-narrow">
        <h1 className="bk-page-title">My Orders</h1>
        {orders.map((o) => (
          <Link key={o.id} to={`/shop/orders/${o.id}`} className="bk-box bk-order">
            <div className="bk-line-img">{findProduct(o.items[0]?.id)?.emoji ?? '📦'}</div>
            <div className="flex-grow-1">
              <b>{inr(o.total)}</b> <span className="bk-status ms-1">{o.status}</span>
              <div className="bk-muted small">#{o.id} · {fmtDate(o.date)}</div>
            </div>
            <i className="bi bi-chevron-right" />
          </Link>
        ))}
      </div>
    </ShopPage>
  );
}

export function Wishlist() {
  const { ids } = useWishlist();
  const items = ids.map(findProduct).filter(Boolean);
  return (
    <ShopPage>
      {items.length ? (
        <section className="bk-section">
          <h1 className="bk-page-title">My Wishlist</h1>
          <div className="bk-grid">{items.map((p) => <ProductCard key={p.id} p={p} />)}</div>
        </section>
      ) : (
        <EmptyState icon="bi-heart" title="Your wishlist is empty"><p className="bk-muted">Tap the ♡ on any product to save it here.</p></EmptyState>
      )}
    </ShopPage>
  );
}

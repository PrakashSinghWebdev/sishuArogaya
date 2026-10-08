import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { PRODUCTS, findProduct, inr, offPct, useWishlist, ShopPage, AddButton, Rail } from './shopShared';
import './Shop.css';

const VIEWS = [
  { label: 'Main view',  style: {} },
  { label: 'Side view',  style: { transform: 'rotate(-15deg) scaleX(-1)' } },
  { label: 'Close-up',   style: { transform: 'scale(1.35)' } },
  { label: 'In the box', style: { transform: 'rotate(12deg)' } },
];

const WHY = [
  { emoji: '⚡', title: 'Superfast Delivery', sub: 'Get your order delivered to your doorstep at the earliest.' },
  { emoji: '🏷️', title: 'Best Prices & Offers', sub: 'Best price destination with offers directly from the manufacturers.' },
  { emoji: '🩺', title: 'Paediatrician Approved', sub: 'Every product is checked for child safety before it is listed.' },
];

export default function ProductDetail() {
  const { id } = useParams();
  const product = findProduct(id);
  const wish = useWishlist();
  const [view, setView] = useState(0);

  useEffect(() => { window.scrollTo(0, 0); setView(0); }, [id]);

  if (!product) return <Navigate to="/shop" replace />;
  const off = offPct(product);
  const catUrl = `/shop/products?category=${encodeURIComponent(product.category)}`;
  const similar = PRODUCTS.filter((p) => p.category === product.category && p.id !== product.id);
  const more = PRODUCTS.filter((p) => p.category !== product.category).slice(0, 8);

  return (
    <ShopPage>
      <div className="bk-pd">
        <div className="bk-pd-gallery">
          <div className="bk-pd-main">
            <span style={{ ...VIEWS[view].style, display: 'inline-block', transition: 'transform .3s' }}>{product.emoji}</span>
          </div>
          <div className="bk-pd-thumbs">
            {VIEWS.map((v, i) => (
              <button key={v.label} className={i === view ? 'active' : ''} onClick={() => setView(i)} aria-label={v.label}>
                <span style={{ ...v.style, display: 'inline-block' }}>{product.emoji}</span>
              </button>
            ))}
          </div>
          <div className="bk-pd-details">
            <h2>Product Details</h2>
            <h3>Key Features</h3>
            <p>{product.desc}</p>
            <h3>Suitable For</h3>
            <p>{product.subtitle}</p>
            <h3>Category</h3>
            <p>{product.category}</p>
          </div>
        </div>

        <div className="bk-pd-info">
          <nav className="bk-crumbs">
            <Link to="/shop">Home</Link> / <Link to={catUrl}>{product.category}</Link> / <span>{product.name}</span>
          </nav>
          <h1>{product.name}</h1>
          <span className="bk-time"><i className="bi bi-stopwatch" /> 30 MINS</span>
          <Link to={catUrl} className="bk-viewall">View all by {product.category} <i className="bi bi-caret-right-fill" /></Link>

          <div className="bk-pd-buy">
            <div>
              <div className="bk-muted small">{product.subtitle}</div>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <b className="fs-5">{inr(product.price)}</b>
                {product.old && <span className="bk-muted">MRP <s>{inr(product.old)}</s></span>}
                {off > 0 && <span className="bk-off-pill">{off}% OFF</span>}
              </div>
              <div className="bk-muted small">(Inclusive of all taxes)</div>
            </div>
            <div className="d-flex align-items-center gap-2">
              <button className="bk-like-lg" onClick={() => wish.toggle(product.id)} aria-label="Toggle wishlist">
                <i className={`bi ${wish.has(product.id) ? 'bi-heart-fill text-danger' : 'bi-heart'}`} />
              </button>
              <AddButton id={product.id} big />
            </div>
          </div>

          <h2 className="bk-why-title">Why shop from ShishuShop?</h2>
          {WHY.map((w) => (
            <div key={w.title} className="bk-why">
              <span>{w.emoji}</span>
              <div><b>{w.title}</b><div className="bk-muted small">{w.sub}</div></div>
            </div>
          ))}
        </div>
      </div>

      {similar.length > 0 && <Rail title="Similar products" items={similar} to={catUrl} />}
      <Rail title="You might also like" items={more} to="/shop/products" />
    </ShopPage>
  );
}

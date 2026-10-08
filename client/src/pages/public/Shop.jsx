import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CATEGORIES, PRODUCTS, ShopPage, Rail, findProduct, inr } from './shopShared';
import './Shop.css';

const byCategory = (...names) => PRODUCTS.filter((p) => names.includes(p.category));
const catLink = (name) => `/shop/products?category=${encodeURIComponent(name)}`;

const PROMOS = [
  { title: 'Health kits at your doorstep', sub: 'Thermometers, ORS & more', cta: 'Order Now', to: catLink('Health Kits'), emoji: '🩺', bg: 'linear-gradient(135deg, #0891b2, #0e7490)' },
  { title: 'Feeding time made easy',       sub: 'Bottles, sippers & cereals', cta: 'Order Now', to: catLink('Feeding'),     emoji: '🍼', bg: '#f7c948', dark: true },
  { title: 'Big savings on baby care',     sub: 'Up to 25% off',              cta: 'Shop Sale', to: '/shop/products?sale=1', emoji: '🏷️', bg: '#d9f4f8', dark: true },
];

// Animated hero: giant word with the product on a plate in the middle, items floating around.
const SLIDES = [
  { id: 4, word: 'NOURISH',  bg: '#0e7490', floaters: ['🌾', '🍌', '🥛', '🍯'], text: 'Iron-rich sprouted ragi with no added sugar — the perfect first food for growing babies.' },
  { id: 6, word: 'PLAYTIME', bg: '#c9971c', floaters: ['🎈', '⭐', '🪀', '🧩'], text: 'Soft, washable and child-safe — cuddly friends for big little adventures.' },
  { id: 3, word: 'GROWTH',   bg: '#0c2340', floaters: ['📏', '🌱', '⭐', '💙'], text: 'Weigh your baby at home, accurate to 5 grams, and track it on your growth chart.' },
];

function HeroBanner() {
  const [i, setI] = useState(0);
  const go = (d) => setI((n) => (n + d + SLIDES.length) % SLIDES.length);
  useEffect(() => {
    const id = setTimeout(() => go(1), 6000);
    return () => clearTimeout(id);
  }, [i]); // restarts after manual navigation
  const slide = SLIDES[i];
  const p = findProduct(slide.id);

  return (
    <section className="bk-hero" style={{ background: slide.bg }} aria-roledescription="carousel" aria-label="Featured products">
      <div className="bk-hero-word" key={`w${i}`} aria-hidden="true">{slide.word}</div>
      <Link to={`/shop/${p.id}`} className="bk-hero-plate" key={`p${i}`} aria-label={p.name}>
        <span>{p.emoji}</span>
      </Link>
      {slide.floaters.map((f, n) => (
        <span key={`${i}-${f}`} className={`bk-floater f${n}`} aria-hidden="true">{f}</span>
      ))}
      <div className="bk-hero-copy" key={`c${i}`}>
        <h1>{p.name}</h1>
        <p>{slide.text}</p>
        <div className="d-flex align-items-center gap-3">
          <b className="fs-5">{inr(p.price)}</b>
          <Link to={`/shop/${p.id}`} className="bk-hero-btn">ORDER NOW</Link>
        </div>
      </div>
      <div className="bk-hero-nav">
        <button onClick={() => go(-1)} aria-label="Previous slide"><i className="bi bi-arrow-left" /></button>
        <button onClick={() => go(1)} aria-label="Next slide"><i className="bi bi-arrow-right" /></button>
      </div>
    </section>
  );
}

const RAILS = [
  { title: 'Bestsellers',        items: [...PRODUCTS].sort((a, b) => b.reviews - a.reviews).slice(0, 8), to: '/shop/products' },
  { title: 'Health & Baby Care', items: byCategory('Health Kits', 'Baby Care'), to: catLink('Health Kits') },
  { title: 'Food & Feeding',     items: byCategory('Nutrition', 'Feeding'),     to: catLink('Nutrition') },
  { title: 'Clothing & Toys',    items: byCategory('Baby Clothing', 'Toys'),    to: catLink('Toys') },
];

export default function Shop() {
  return (
    <ShopPage>
      <HeroBanner />

      <div className="bk-promos">
        {PROMOS.map((p) => (
          <Link key={p.title} to={p.to} className={`bk-promo${p.dark ? ' dark' : ''}`} style={{ background: p.bg }}>
            <div>
              <h3>{p.title}</h3>
              <p>{p.sub}</p>
              <span className="bk-promo-btn">{p.cta}</span>
            </div>
            <span className="bk-promo-emoji" aria-hidden="true">{p.emoji}</span>
          </Link>
        ))}
      </div>

      <div className="bk-cats">
        {CATEGORIES.map((c) => (
          <Link key={c.name} to={catLink(c.name)} className="bk-cat">
            <span style={{ background: c.bg }}>{c.emoji}</span>
            {c.name}
          </Link>
        ))}
        <Link to="/shop/products?sale=1" className="bk-cat"><span style={{ background: '#ffe4e4' }}>🏷️</span>On Sale</Link>
        <Link to="/shop/products" className="bk-cat"><span style={{ background: '#eef0f4' }}>🛍️</span>All Products</Link>
      </div>

      {RAILS.map((r) => <Rail key={r.title} {...r} />)}
    </ShopPage>
  );
}

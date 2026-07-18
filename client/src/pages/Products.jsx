import { useState, useEffect } from 'react';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';

const CATEGORIES = ['all', 'electronics', 'clothing', 'books', 'home', 'sports', 'beauty', 'toys', 'stationery'];

export default function Products() {
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loadMs, setLoadMs] = useState(null);
  const limit = 12;

  // debounce: wait 400ms after typing stops before actually searching
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    const start = performance.now();

    api.get('/api/products', { params: { category, page, limit, search } })
      .then(({ data }) => {
        if (cancelled) return;
        setProducts(data);
        setLoadMs(Math.round(performance.now() - start));
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.response?.data?.error || 'Failed to load inventory.');
      })
      .finally(() => !cancelled && setLoading(false));

    return () => { cancelled = true; };
  }, [category, page,search]);

  return (
    <div className="min-h-screen bg-graphite">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
          <div>
            <p className="font-mono text-[11px] tracking-widest text-slate uppercase mb-1">
              Ledger — page {page}
            </p>
            <h1 className="font-display text-3xl text-paper">Inventory</h1>
          </div>
          {loadMs !== null && (
            <span className="font-mono text-[11px] text-slate">
              fetched in <span className="text-amber">{loadMs}ms</span>
            </span>
          )}
        </div>
          <div className="mb-6">
          <div className="relative max-w-md">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate"
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
            </svg>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name…"
              className="w-full bg-graphite-light border border-graphite-border rounded-sm pl-9 pr-3 py-2.5 text-paper text-sm outline-none focus:border-amber transition-colors font-mono"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate hover:text-paper transition-colors font-mono text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => { setCategory(cat); setPage(1); }}
              className={`font-mono text-[11px] uppercase tracking-wide px-3 py-1.5 rounded-sm border transition-colors ${
                category === cat
                  ? 'bg-amber text-graphite border-amber'
                  : 'border-graphite-border text-slate hover:text-paper hover:border-paper-dim'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {error && (
          <p className="text-rust font-mono text-sm border border-rust/30 bg-rust/10 rounded-sm px-4 py-3 mb-6">
            {error}
          </p>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-36 border border-graphite-border bg-graphite-light rounded-sm animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="text-paper-dim font-mono text-sm py-16 text-center">
            {search ? `No items match "${search}".` : 'No items in this category.'}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p, i) => (
              <ProductCard key={p._id} product={p} index={(page - 1) * limit + i} />
            ))}
          </div>
        )}

        <div className="flex items-center justify-center gap-4 mt-10">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="font-mono text-xs uppercase tracking-wide px-4 py-2 border border-graphite-border rounded-sm text-slate hover:text-paper disabled:opacity-30 transition-colors"
          >
            ← Prev
          </button>
          <span className="font-mono text-xs text-paper-dim">Page {page}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={products.length < limit}
            className="font-mono text-xs uppercase tracking-wide px-4 py-2 border border-graphite-border rounded-sm text-slate hover:text-paper disabled:opacity-30 transition-colors"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}

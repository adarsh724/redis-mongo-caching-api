import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import Navbar from '../components/Navbar';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/api/products/${id}`)
      .then(({ data }) => setProduct(data))
      .catch((err) => setError(err.response?.data?.error || 'Product not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="min-h-screen bg-graphite">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 py-10">
        <Link to="/products" className="font-mono text-xs text-slate hover:text-amber transition-colors">
          ← Back to inventory
        </Link>

        {loading ? (
          <div className="mt-8 h-64 border border-graphite-border bg-graphite-light rounded-sm animate-pulse" />
        ) : error ? (
          <p className="mt-8 text-rust font-mono text-sm border border-rust/30 bg-rust/10 rounded-sm px-4 py-3">
            {error}
          </p>
        ) : (
          <div className="mt-6 border border-graphite-border bg-graphite-light rounded-sm p-8 tick-in">
            <p className="font-mono text-[11px] tracking-widest text-slate uppercase mb-2">
              SKU {product._id.slice(-8)}
            </p>
            <h1 className="font-display text-3xl text-paper mb-2">{product.name}</h1>
            <p className="font-mono text-xs text-amber uppercase tracking-wide mb-6">{product.category}</p>

            {product.description && (
              <p className="text-paper-dim text-sm leading-relaxed mb-8">{product.description}</p>
            )}

            <div className="grid grid-cols-2 gap-4 border-t border-graphite-border pt-6">
              <div>
                <p className="font-mono text-[10px] text-slate uppercase tracking-wide mb-1">Price</p>
                <p className="font-mono text-2xl text-paper">${product.price.toFixed(2)}</p>
              </div>
              <div>
                <p className="font-mono text-[10px] text-slate uppercase tracking-wide mb-1">Quantity on hand</p>
                <p className="font-mono text-2xl text-paper">
                  {product.stock}
                  {product.stock < 10 && <span className="text-rust text-sm ml-2">low</span>}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

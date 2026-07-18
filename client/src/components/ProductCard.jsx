import { Link } from 'react-router-dom';

export default function ProductCard({ product, index }) {
  const lowStock = product.stock < 10;

  return (
    <Link
      to={`/products/${product._id}`}
      className="group block border border-graphite-border bg-graphite-light rounded-sm p-4 hover:border-amber/50 transition-colors tick-in"
    >
      <div className="flex items-start justify-between mb-3">
        <span className="font-mono text-[10px] text-slate tracking-widest">
          {String(index + 1).padStart(3, '0')}
        </span>
        <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded-sm uppercase tracking-wide ${
          lowStock ? 'text-rust bg-rust/10' : 'text-ok bg-ok/10'
        }`}>
          {lowStock ? 'Low' : 'In stock'}
        </span>
      </div>

      <h3 className="font-display text-paper text-base mb-1 group-hover:text-amber transition-colors">
        {product.name}
      </h3>
      <p className="font-mono text-[10px] text-slate uppercase tracking-wide mb-3">
        {product.category}
      </p>

      <div className="flex items-end justify-between">
        <span className="font-mono text-amber text-lg">${product.price.toFixed(2)}</span>
        <span className="font-mono text-paper-dim text-xs">qty {product.stock}</span>
      </div>
    </Link>
  );
}

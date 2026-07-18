import { useState, useEffect } from 'react';
import api from '../api/axios';
import Navbar from '../components/Navbar';

const emptyForm = { name: '', description: '', category: '', price: '', stock: '' };

export default function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  // debounce: wait 400ms after typing stops before actually searching
  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  function loadProducts(activeSearch = search) {
    setLoading(true);
    api.get('/api/products', { params: { limit: 12, search: activeSearch } })
      .then(({ data }) => setProducts(data))
      .catch(() => setError('Failed to load inventory.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadProducts(search); }, [search]);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function startEdit(product) {
    setEditingId(product._id);
    setForm({
      name: product.name,
      description: product.description || '',
      category: product.category,
      price: product.price,
      stock: product.stock,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setStatus('');
    const payload = { ...form, price: Number(form.price), stock: Number(form.stock) };

    try {
      if (editingId) {
        await api.put(`/api/products/${editingId}`, payload);
        setStatus('Product updated.');
      } else {
        await api.post('/api/products', payload);
        setStatus('Product created.');
      }
      cancelEdit();
      loadProducts();
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong.');
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this product?')) return;
    try {
      await api.delete(`/api/products/${id}`);
      setStatus('Product deleted.');
      loadProducts();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete.');
    }
  }

  return (
    <div className="min-h-screen bg-graphite">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-10">
        <p className="font-mono text-[11px] tracking-widest text-slate uppercase mb-1">
          Admin — 00
        </p>
        <h1 className="font-display text-3xl text-paper mb-6">Manage inventory</h1>

        <div className="relative max-w-md mb-8">
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
            placeholder="Search products to edit or delete…"
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

        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8">
          {/* Form */}
          <div className="border border-graphite-border bg-graphite-light rounded-sm p-6 h-fit">
            <h2 className="font-display text-lg text-paper mb-4">
              {editingId ? 'Edit product' : 'New product'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-3">
              <Field label="Name" value={form.name} onChange={update('name')} />
              <div>
                <label className="block font-mono text-[11px] tracking-wide text-slate uppercase mb-1.5">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={update('description')}
                  rows={2}
                  className="w-full bg-graphite border border-graphite-border rounded-sm px-3 py-2.5 text-paper text-sm outline-none focus:border-amber transition-colors resize-none"
                />
              </div>
              <Field label="Category" value={form.category} onChange={update('category')} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Price" type="number" step="0.01" value={form.price} onChange={update('price')} />
                <Field label="Stock" type="number" value={form.stock} onChange={update('stock')} />
              </div>

              {error && (
                <p className="text-rust text-xs font-mono border border-rust/30 bg-rust/10 rounded-sm px-3 py-2">
                  {error}
                </p>
              )}
              {status && (
                <p className="text-ok text-xs font-mono border border-ok/30 bg-ok/10 rounded-sm px-3 py-2">
                  {status}
                </p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 bg-amber text-graphite font-semibold text-sm rounded-sm py-2.5 hover:bg-amber-dim transition-colors"
                >
                  {editingId ? 'Save changes' : 'Create product'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-4 border border-graphite-border rounded-sm text-slate hover:text-paper text-sm transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* List */}
          <div className="border border-graphite-border bg-graphite-light rounded-sm overflow-x-auto">
  <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="border-b border-graphite-border font-mono text-[10px] uppercase tracking-wide text-slate">
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3">Category</th>
                  <th className="text-right px-4 py-3">Price</th>
                  <th className="text-right px-4 py-3">Stock</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-10 text-slate font-mono text-xs">Loading…</td></tr>
                ) : products.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-10 text-slate font-mono text-xs">
                    {search ? `No products match "${search}".` : 'No products yet.'}
                  </td></tr>
                ) : products.map((p) => (
                  <tr key={p._id} className="border-b border-graphite-border/60 hover:bg-graphite/40">
                    <td className="px-4 py-3 text-paper max-w-[220px] truncate">{p.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate uppercase">{p.category}</td>
                    <td className="px-4 py-3 text-right font-mono text-amber">${p.price.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-mono text-paper-dim">{p.stock}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => startEdit(p)}
                        className="font-mono text-[11px] uppercase text-slate hover:text-amber transition-colors mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(p._id)}
                        className="font-mono text-[11px] uppercase text-slate hover:text-rust transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, ...props }) {
  return (
    <div>
      <label className="block font-mono text-[11px] tracking-wide text-slate uppercase mb-1.5">
        {label}
      </label>
      <input
        required
        {...props}
        className="w-full bg-graphite border border-graphite-border rounded-sm px-3 py-2.5 text-paper text-sm outline-none focus:border-amber transition-colors"
      />
    </div>
  );
}

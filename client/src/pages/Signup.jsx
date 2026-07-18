import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '', phoneNumber: '', age: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await signup({ ...form, age: Number(form.age) });
      navigate('/products');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Something went wrong. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-graphite px-6 py-12">
      <div className="w-full max-w-sm tick-in">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <span className="w-2 h-2 rounded-full bg-amber" />
          <span className="font-display font-semibold text-paper text-xl tracking-tight">
            STOCKROOM
          </span>
        </div>

        <div className="border border-graphite-border bg-graphite-light rounded-sm p-8">
          <p className="font-mono text-[11px] tracking-widest text-slate uppercase mb-1">
            Access — 02
          </p>
          <h1 className="font-display text-2xl text-paper mb-6">Create account</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Full name" type="text" value={form.name} onChange={update('name')} placeholder="Jane Doe" />
            <Field label="Email" type="email" value={form.email} onChange={update('email')} placeholder="you@example.com" />
            <Field label="Password" type="password" value={form.password} onChange={update('password')} placeholder="••••••••" />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Phone" type="tel" value={form.phoneNumber} onChange={update('phoneNumber')} placeholder="9876543210" />
              <Field label="Age" type="number" value={form.age} onChange={update('age')} placeholder="25" />
            </div>

            {error && (
              <p className="text-rust text-sm font-mono border border-rust/30 bg-rust/10 rounded-sm px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-amber text-graphite font-semibold text-sm rounded-sm py-2.5 hover:bg-amber-dim transition-colors disabled:opacity-50"
            >
              {submitting ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-slate text-sm mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-amber hover:underline">
            Sign in
          </Link>
        </p>
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

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/products');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-graphite px-6">
      <div className="w-full max-w-sm tick-in">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <span className="w-2 h-2 rounded-full bg-amber" />
          <span className="font-display font-semibold text-paper text-xl tracking-tight">
            STOCKROOM
          </span>
        </div>

        <div className="border border-graphite-border bg-graphite-light rounded-sm p-8">
          <p className="font-mono text-[11px] tracking-widest text-slate uppercase mb-1">
            Access — 01
          </p>
          <h1 className="font-display text-2xl text-paper mb-6">Sign in</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-mono text-[11px] tracking-wide text-slate uppercase mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-graphite border border-graphite-border rounded-sm px-3 py-2.5 text-paper text-sm outline-none focus:border-amber transition-colors"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block font-mono text-[11px] tracking-wide text-slate uppercase mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-graphite border border-graphite-border rounded-sm px-3 py-2.5 text-paper text-sm outline-none focus:border-amber transition-colors"
                placeholder="••••••••"
              />
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
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-slate text-sm mt-6">
          No account?{' '}
          <Link to="/signup" className="text-amber hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

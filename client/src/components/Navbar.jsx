import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    setMenuOpen(false);
    await logout();
    navigate('/login');
  }

  return (
    <header className="border-b border-graphite-border bg-graphite-light relative">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/products" className="flex items-center gap-2" onClick={() => setMenuOpen(false)}>
          <span className="w-2 h-2 rounded-full bg-amber shrink-0" />
          <span className="font-display font-semibold tracking-tight text-paper text-lg">
            STOCKROOM
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-6 font-mono text-xs tracking-wide uppercase">
          <Link to="/products" className="text-slate hover:text-paper transition-colors">
            Inventory
          </Link>
          {user?.role === 'admin' && (
            <Link to="/admin" className="text-slate hover:text-amber transition-colors">
              Admin
            </Link>
          )}
          {user && (
            <div className="flex items-center gap-4 pl-4 border-l border-graphite-border">
              <span className="text-paper-dim normal-case font-body max-w-[120px] truncate">
                {user.username}
              </span>
              <button
                onClick={handleLogout}
                className="text-rust hover:text-paper transition-colors"
              >
                Log out
              </button>
            </div>
          )}
        </nav>

        {/* Mobile hamburger toggle */}
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="sm:hidden text-paper p-2 -mr-2"
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <nav className="sm:hidden border-t border-graphite-border bg-graphite-light font-mono text-xs tracking-wide uppercase">
          <Link
            to="/products"
            onClick={() => setMenuOpen(false)}
            className="block px-6 py-3 text-slate hover:text-paper hover:bg-graphite transition-colors"
          >
            Inventory
          </Link>
          {user?.role === 'admin' && (
            <Link
              to="/admin"
              onClick={() => setMenuOpen(false)}
              className="block px-6 py-3 text-slate hover:text-amber hover:bg-graphite transition-colors"
            >
              Admin
            </Link>
          )}
          {user && (
            <div className="border-t border-graphite-border px-6 py-3 flex items-center justify-between">
              <span className="text-paper-dim normal-case font-body">{user.username}</span>
              <button onClick={handleLogout} className="text-rust hover:text-paper transition-colors">
                Log out
              </button>
            </div>
          )}
        </nav>
      )}
    </header>
  );
}
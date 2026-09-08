import { useState } from 'react';
import { Plus, Heart, User, Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const NAV_LINKS = [
  { label: 'Explore', filter: 'all' },
  { label: 'For Sale', filter: 'sale' },
  { label: 'For Rent', filter: 'rent' },
  { label: 'Land', filter: 'land' },
  { label: 'About Us', filter: null },
];

export default function Navbar({ onAddClick, activeFilter, onFilterChange }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ── Left: Logo + Brand ── */}
          <Link to="/" className="flex items-center gap-3 flex-shrink-0">
            <img
              src="/logo.svg"
              alt="Sasrika Real Estate"
              className="h-10 w-auto object-contain"
            />
            <div className="hidden sm:block">
              <span className="font-extrabold text-xl text-gray-900 tracking-tight leading-none">
                Sasrika<span className="text-emerald-600">.</span>
              </span>
              <p className="text-[10px] text-emerald-600 font-semibold tracking-widest uppercase leading-none mt-0.5">
                Real Estate
              </p>
            </div>
          </Link>

          {/* ── Center: Desktop Nav Links ── */}
          {isHome && (
            <nav className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((link) => {
                const isActive = link.filter !== null && activeFilter === link.filter;
                return (
                  <button
                    key={link.label}
                    onClick={() => link.filter !== null && onFilterChange?.(link.filter)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-gray-600 hover:text-emerald-700 hover:bg-emerald-50'
                    }`}
                  >
                    {link.label}
                  </button>
                );
              })}
            </nav>
          )}
          {!isHome && (
            <nav className="hidden md:flex items-center gap-1">
              <Link to="/" className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 transition-all">
                ← Back to Listings
              </Link>
            </nav>
          )}

          {/* ── Right: Actions ── */}
          <div className="flex items-center gap-2">
            {/* Add Property button */}
            <button
              onClick={onAddClick}
              className="hidden sm:flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-all duration-200 shadow-sm hover:shadow-emerald-200 hover:shadow-md"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Add Property</span>
            </button>

            {/* Mobile add icon */}
            <button
              onClick={onAddClick}
              className="sm:hidden p-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
            >
              <Plus size={18} strokeWidth={2.5} />
            </button>

            {/* Favorites */}
            <button className="hidden md:flex p-2.5 rounded-xl text-gray-500 hover:text-rose-500 hover:bg-rose-50 transition-colors">
              <Heart size={18} />
            </button>

            {/* User */}
            <button className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
              <User size={16} className="text-white" />
            </button>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 text-gray-500 hover:text-gray-700 rounded-lg"
              onClick={() => setMobileOpen((o) => !o)}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* ── Mobile Dropdown Menu ── */}
        {mobileOpen && isHome && (
          <div className="md:hidden border-t border-gray-100 py-3 pb-4">
            <div className="flex flex-wrap gap-2">
              {NAV_LINKS.map((link) => {
                const isActive = link.filter !== null && activeFilter === link.filter;
                return (
                  <button
                    key={link.label}
                    onClick={() => {
                      if (link.filter !== null) onFilterChange?.(link.filter);
                      setMobileOpen(false);
                    }}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all border ${
                      isActive
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'text-gray-600 border-gray-200 hover:border-emerald-300'
                    }`}
                  >
                    {link.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
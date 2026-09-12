import { useState, useRef, useEffect } from 'react';
import { Plus, Heart, User, Menu, X, LogOut, Building2, ChevronDown } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import SavedListingsModal from './SavedListingsModal';
import AuthModal from './AuthModal';

export default function Navbar({ onAddClick, activeFilter, onFilterChange }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [savedModalOpen, setSavedModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const { favoritesCount } = useFavorites();
  const { user, isAuthenticated, logout } = useAuth();

  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';
  const isAbout = location.pathname === '/about';
  const isMyListings = location.pathname === '/my-listings';

  const dropdownRef = useRef(null);

  // Close user dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    };
    if (userDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [userDropdownOpen]);

  const handleTabClick = (filter) => {
    if (isHome) {
      onFilterChange?.(filter);
    } else {
      if (filter === 'all') {
        navigate('/');
      } else {
        navigate(`/?filter=${filter}`);
      }
    }
  };

  const handleAddProperty = () => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
    } else {
      onAddClick?.();
    }
  };

  const getInitials = () => {
    if (!user) return 'U';
    const first = user.firstName?.[0] || '';
    const last = user.lastName?.[0] || '';
    return (first + last).toUpperCase() || 'U';
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* ── Left: Logo + Brand ── */}
            <Link to="/" className="flex items-center gap-3 flex-shrink-0">
              <img
                src="/logo.png"
                alt="Sasrika Real Estate"
                className="h-11 w-auto object-contain"
              />
              <div className="hidden sm:block">
                <span className="font-extrabold text-xl text-gray-900 tracking-tight leading-none">
                  Sasrika<span className="text-emerald-600"></span>
                </span>
                <p className="text-[10px] text-emerald-600 font-semibold tracking-widest uppercase leading-none mt-0.5">
                  Real Estate
                </p>
              </div>
            </Link>

            {/* ── Center: Desktop Navigation ── */}
            <nav className="hidden md:flex items-center gap-1">
              <button
                onClick={() => handleTabClick('all')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  isHome && activeFilter === 'all'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                Explore
              </button>

              <button
                onClick={() => handleTabClick('sale')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  isHome && activeFilter === 'sale'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                For Sale
              </button>

              <button
                onClick={() => handleTabClick('rent')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  isHome && activeFilter === 'rent'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                For Rent
              </button>

              <Link
                to="/about"
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  isAbout
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                About Us
              </Link>
            </nav>

            {/* ── Right: Actions ── */}
            <div className="flex items-center gap-2">
              {/* Add Property button (Desktop) */}
              <button
                onClick={handleAddProperty}
                className="hidden sm:flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-all duration-200 shadow-sm hover:shadow-emerald-200 hover:shadow-md"
              >
                <Plus size={16} strokeWidth={2.5} />
                <span>Add Property</span>
              </button>

              {/* Mobile add icon */}
              <button
                onClick={handleAddProperty}
                className="sm:hidden p-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
              >
                <Plus size={18} strokeWidth={2.5} />
              </button>

              {/* Favorites button */}
              <button
                type="button"
                title="Saved Properties"
                onClick={() => setSavedModalOpen(true)}
                className="relative p-2.5 rounded-xl text-gray-500 hover:text-rose-500 hover:bg-rose-50 transition-colors flex items-center justify-center"
              >
                <Heart
                  size={18}
                  className={`transition-transform duration-200 ${
                    favoritesCount > 0 ? 'text-rose-500 fill-rose-500 scale-105' : ''
                  }`}
                />
                {favoritesCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-extrabold rounded-full h-4.5 min-w-[18px] px-1 flex items-center justify-center shadow-sm animate-pulse-once">
                    {favoritesCount}
                  </span>
                )}
              </button>

              {/* ── Authenticated User vs Guest ── */}
              {isAuthenticated && user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setUserDropdownOpen((prev) => !prev)}
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 transition-colors focus:outline-none"
                  >
                    {user.profilePictureUrl ? (
                      <img
                        src={user.profilePictureUrl}
                        alt={user.firstName}
                        className="w-8 h-8 rounded-xl object-cover border border-emerald-500 shadow-xs"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white text-xs font-black flex items-center justify-center shadow-xs">
                        {getInitials()}
                      </div>
                    )}
                    <span className="hidden lg:block text-xs font-bold text-gray-800">
                      {user.firstName}
                    </span>
                    <ChevronDown size={14} className="text-gray-400 hidden lg:block" />
                  </button>

                  {/* Dropdown Menu */}
                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-xs font-black text-gray-900 truncate">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
                      </div>

                      <div className="py-1">
                        <Link
                          to="/my-listings"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-gray-700 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                        >
                          <Building2 size={15} className="text-emerald-600" />
                          <span>My Ads &amp; Listings</span>
                        </Link>

                        <button
                          type="button"
                          onClick={() => {
                            setUserDropdownOpen(false);
                            onAddClick?.();
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-gray-700 hover:text-emerald-700 hover:bg-emerald-50 transition-colors text-left"
                        >
                          <Plus size={15} className="text-emerald-600" />
                          <span>Post New Property</span>
                        </button>
                      </div>

                      <div className="pt-1 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={() => {
                            setUserDropdownOpen(false);
                            logout();
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left"
                        >
                          <LogOut size={15} />
                          <span>Log Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Guest Sign In Button */
                <button
                  type="button"
                  onClick={() => setAuthModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 hover:border-emerald-500 bg-white text-gray-700 hover:text-emerald-700 text-xs font-bold shadow-2xs transition-all"
                >
                  <User size={15} className="text-emerald-600" />
                  <span>Sign In</span>
                </button>
              )}

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
          {mobileOpen && (
            <div className="md:hidden border-t border-gray-100 py-3 pb-4">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    handleTabClick('all');
                    setMobileOpen(false);
                  }}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all border ${
                    isHome && activeFilter === 'all'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'text-gray-600 border-gray-200 hover:border-emerald-300'
                  }`}
                >
                  Explore
                </button>
                <button
                  onClick={() => {
                    handleTabClick('sale');
                    setMobileOpen(false);
                  }}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all border ${
                    isHome && activeFilter === 'sale'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'text-gray-600 border-gray-200 hover:border-emerald-300'
                  }`}
                >
                  For Sale
                </button>
                <button
                  onClick={() => {
                    handleTabClick('rent');
                    setMobileOpen(false);
                  }}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all border ${
                    isHome && activeFilter === 'rent'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'text-gray-600 border-gray-200 hover:border-emerald-300'
                  }`}
                >
                  For Rent
                </button>
                <Link
                  to="/about"
                  onClick={() => setMobileOpen(false)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all border ${
                    isAbout
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'text-gray-600 border-gray-200 hover:border-emerald-300'
                  }`}
                >
                  About Us
                </Link>
                {isAuthenticated && (
                  <Link
                    to="/my-listings"
                    onClick={() => setMobileOpen(false)}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all border ${
                      isMyListings
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'text-emerald-700 border-emerald-200 bg-emerald-50'
                    }`}
                  >
                    My Ads
                  </Link>
                )}
                <button
                  onClick={() => {
                    setSavedModalOpen(true);
                    setMobileOpen(false);
                  }}
                  className="px-4 py-1.5 rounded-full text-sm font-semibold transition-all border text-gray-600 border-gray-200 hover:border-rose-300 hover:text-rose-600 flex items-center gap-1.5"
                >
                  <Heart size={14} className={favoritesCount > 0 ? 'fill-rose-500 text-rose-500' : ''} />
                  <span>Saved ({favoritesCount})</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ── Modals ── */}
      <SavedListingsModal
        isOpen={savedModalOpen}
        onClose={() => setSavedModalOpen(false)}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </>
  );
}
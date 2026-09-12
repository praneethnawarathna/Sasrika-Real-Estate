import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { X, Heart, Trash2, MapPin, ExternalLink, ArrowRight, Sparkles } from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext';

const API_BASE = 'http://localhost:5143/api/properties';

const PROPERTY_TYPE_LABELS = ['Land', 'House', 'Commercial'];
const LISTING_TYPE_LABELS = ['For Sale', 'For Rent'];

export default function SavedListingsModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { favorites, favoritesCount, toggleFavorite, clearFavorites } = useFavorites();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);

  // Prevent background body scrolling while modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    if (favorites.length === 0) {
      setProperties([]);
      return;
    }

    const loadSavedProperties = async () => {
      setLoading(true);
      try {
        // Fetch all approved properties
        const res = await fetch(API_BASE);
        if (res.ok) {
          const all = await res.json();
          const matched = all.filter((p) => favorites.includes(String(p.id)));

          // Check if any favorite ID was not in the general list (e.g. directly queried)
          const matchedIds = new Set(matched.map((p) => String(p.id)));
          const missingIds = favorites.filter((id) => !matchedIds.has(String(id)));

          if (missingIds.length > 0) {
            const extraPromises = missingIds.map(async (id) => {
              try {
                const singleRes = await fetch(`${API_BASE}/${id}`);
                if (singleRes.ok) return await singleRes.json();
              } catch (e) {
                // ignore if deleted
              }
              return null;
            });
            const extraResults = await Promise.all(extraPromises);
            const validExtras = extraResults.filter(Boolean);
            setProperties([...matched, ...validExtras]);
          } else {
            setProperties(matched);
          }
        }
      } catch (err) {
        console.error('Error fetching saved properties:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSavedProperties();
  }, [isOpen, favorites]);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleNavigate = (id) => {
    onClose();
    navigate(`/property/${id}`);
  };

  const handleBrowse = () => {
    onClose();
    navigate('/');
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* ── Dark Backdrop with blur & click-to-close ── */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* ── Centered Modal Dialog ── */}
      <div
        className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-gray-100 my-auto z-10 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal Header ── */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
              <Heart size={16} className="fill-rose-500 text-rose-500" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-gray-900 leading-none">
                Saved Properties
              </h3>
              <p className="text-[11px] text-gray-400 font-medium mt-1">
                {favoritesCount} {favoritesCount === 1 ? 'listing' : 'listings'} saved in your browser
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {favoritesCount > 0 && (
              <button
                type="button"
                onClick={clearFavorites}
                className="text-xs font-semibold text-gray-400 hover:text-rose-600 px-2.5 py-1 rounded-lg hover:bg-rose-50 transition-colors"
              >
                Clear All
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 flex items-center justify-center transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── Modal Body ── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {loading ? (
            <div className="py-16 text-center">
              <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-gray-400 font-medium">Loading saved properties...</p>
            </div>
          ) : favoritesCount === 0 || properties.length === 0 ? (
            /* ── Empty State ── */
            <div className="py-12 px-4 text-center">
              <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-400 flex items-center justify-center mx-auto mb-4 border border-rose-100">
                <Heart size={30} className="stroke-[1.75]" />
              </div>
              <h4 className="text-base font-extrabold text-gray-900 mb-1">
                No saved properties yet
              </h4>
              <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed mb-6">
                Explore our listings and click the heart icon on any property card to save it here for quick access.
              </p>
              <button
                type="button"
                onClick={handleBrowse}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
              >
                <span>Browse Properties</span>
                <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            /* ── Saved Items List ── */
            <div className="space-y-3">
              {properties.map((p) => {
                const isForSale = p.listingType === 0 || p.listingType === 'ForSale';
                const propTypeName =
                  (typeof p.propertyType === 'number'
                    ? PROPERTY_TYPE_LABELS[p.propertyType]
                    : p.propertyType) ?? 'Property';

                return (
                  <div
                    key={p.id}
                    onClick={() => handleNavigate(p.id)}
                    className="group bg-white rounded-2xl border border-gray-100 hover:border-emerald-200 p-3 flex items-center gap-3.5 shadow-sm hover:shadow-md transition-all cursor-pointer relative"
                  >
                    {/* Thumbnail */}
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 relative border border-gray-100">
                      <img
                        src={p.imageUrls?.[0] || 'https://placehold.co/200x200?text=No+Image'}
                        alt={p.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        onError={(e) => {
                          e.target.src = 'https://placehold.co/200x200?text=No+Image';
                        }}
                      />
                    </div>

                    {/* Details */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                            isForSale
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}
                        >
                          {isForSale ? 'FOR SALE' : 'FOR RENT'}
                        </span>
                        <span className="text-[10px] font-bold text-gray-500">
                          {propTypeName}
                        </span>
                      </div>

                      <h4 className="font-bold text-gray-900 text-xs sm:text-sm line-clamp-1 group-hover:text-emerald-700 transition-colors">
                        {p.title}
                      </h4>

                      <div className="flex items-center gap-1 text-[11px] text-gray-400">
                        <MapPin size={11} className="text-emerald-500 flex-shrink-0" />
                        <span className="truncate">
                          {p.city}
                          {p.district ? `, ${p.district}` : ''}
                        </span>
                      </div>

                      <div className="text-xs font-black text-gray-900">
                        {p.price <= 0 || p.isNegotiable ? (
                          <span className="text-amber-700 font-bold text-[11px]">Negotiable</span>
                        ) : (
                          <>
                            <span>LKR {Number(p.price).toLocaleString()}</span>
                            {!isForSale && (
                              <span className="text-[10px] text-gray-400 font-normal"> / mo</span>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Remove Action */}
                    <button
                      type="button"
                      title="Remove from saved"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(p.id);
                      }}
                      className="p-2 rounded-xl text-gray-300 hover:text-rose-600 hover:bg-rose-50 transition-colors self-center flex-shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Modal Footer ── */}
        {favoritesCount > 0 && properties.length > 0 && (
          <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Click any listing to view full details</span>
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold transition-colors shadow-2xs"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

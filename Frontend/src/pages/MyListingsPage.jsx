import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Plus, Edit3, Trash2, CheckCircle2, Clock, AlertTriangle,
  ExternalLink, Sparkles, MapPin, Ruler, BedDouble, Bath, Eye,
  Building2, Tag, Check, RefreshCw
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AddPropertyModal from '../components/AddPropertyModal';
import EditPropertyModal from '../components/EditPropertyModal';
import { useAuth } from '../context/AuthContext';

const API_BASE = 'http://localhost:5143/api/properties';

const PROPERTY_TYPE_LABELS = ['Land', 'House', 'Commercial'];

export default function MyListingsPage() {
  const { user, isAuthenticated, isLoading, authFetch } = useAuth();
  const navigate = useNavigate();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'approved' | 'pending' | 'sold'

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [deletingProperty, setDeletingProperty] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchMyListings = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError('');

    try {
      const res = await authFetch(`${API_BASE}/my-listings`);
      if (!res.ok) {
        throw new Error('Failed to load your listings.');
      }
      const data = await res.json();
      setListings(data);
    } catch (err) {
      setError(err.message || 'Error fetching your listings.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, authFetch]);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        navigate('/');
      } else {
        fetchMyListings();
      }
    }
  }, [isLoading, isAuthenticated, navigate, fetchMyListings]);

  // Handle Sold Toggle
  const handleToggleSold = async (property) => {
    setActionLoading(true);
    try {
      const res = await authFetch(`${API_BASE}/${property.id}/toggle-sold`, {
        method: 'PATCH',
      });
      if (res.ok) {
        const updated = await res.json();
        setListings((prev) =>
          prev.map((item) => (item.id === property.id ? { ...item, isSold: updated.isSold } : item))
        );
      }
    } catch (err) {
      console.error('Error toggling sold status:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Delete
  const handleDeleteConfirm = async () => {
    if (!deletingProperty) return;
    setActionLoading(true);
    try {
      const res = await authFetch(`${API_BASE}/${deletingProperty.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setListings((prev) => prev.filter((item) => item.id !== deletingProperty.id));
        setDeletingProperty(null);
      } else {
        throw new Error('Could not delete listing.');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Filter listings based on statusFilter
  const filteredListings = listings.filter((p) => {
    if (statusFilter === 'sold') return p.isSold;
    if (statusFilter === 'pending') return p.status === 0; // ModerationStatus.Pending
    if (statusFilter === 'approved') return p.status === 1 && !p.isSold; // ModerationStatus.Approved
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar onAddClick={() => setIsAddOpen(true)} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
              <Building2 size={15} />
              <span>Seller Dashboard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              My Properties &amp; Ads
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Manage your active listings, update prices, and mark properties as sold.
            </p>
          </div>

          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-5 py-3 rounded-2xl shadow-sm hover:shadow-md transition-all self-start sm:self-auto"
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>Post New Property</span>
          </button>
        </div>

        {/* ── Status Tabs ── */}
        <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-2">
          {[
            { id: 'all', label: 'All Listings', count: listings.length },
            {
              id: 'approved',
              label: 'Active / Live',
              count: listings.filter((p) => p.status === 1 && !p.isSold).length,
            },
            {
              id: 'pending',
              label: 'Pending Review',
              count: listings.filter((p) => p.status === 0).length,
            },
            {
              id: 'sold',
              label: 'Sold / Rented',
              count: listings.filter((p) => p.isSold).length,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                statusFilter === tab.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 border border-gray-200'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  statusFilter === tab.id
                    ? 'bg-emerald-800 text-emerald-100'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* ── Content Grid / List ── */}
        {loading ? (
          <div className="py-24 text-center">
            <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-gray-400 font-medium">Loading your listings...</p>
          </div>
        ) : error ? (
          <div className="my-8 p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center">
            <p className="text-sm font-semibold text-rose-700 mb-3">{error}</p>
            <button
              onClick={fetchMyListings}
              className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 text-white font-bold text-xs rounded-xl"
            >
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        ) : filteredListings.length === 0 ? (
          /* ── Empty State ── */
          <div className="my-12 py-16 px-4 bg-white rounded-3xl border border-gray-100 shadow-sm text-center max-w-xl mx-auto">
            <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-100">
              <Building2 size={36} />
            </div>
            <h3 className="text-lg font-black text-gray-900 mb-1">
              {statusFilter === 'all'
                ? "You haven't posted any properties yet"
                : `No ${statusFilter} listings found`}
            </h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed mb-6">
              Connect directly with genuine buyers &amp; tenants across Sri Lanka with zero broker fees.
            </p>
            <button
              onClick={() => setIsAddOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Post Your First Listing</span>
            </button>
          </div>
        ) : (
          /* ── Listings Grid ── */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {filteredListings.map((p) => {
              const isForSale = p.listingType === 0 || p.listingType === 'ForSale';
              const propTypeName =
                (typeof p.propertyType === 'number'
                  ? PROPERTY_TYPE_LABELS[p.propertyType]
                  : p.propertyType) ?? 'Property';

              return (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
                >
                  {/* Image & Status Badges */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                    <img
                      src={p.imageUrls?.[0] || 'https://placehold.co/800x500/e2e8f0/94a3b8?text=No+Image'}
                      alt={p.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://placehold.co/800x500/e2e8f0/94a3b8?text=No+Image';
                      }}
                    />

                    {/* Moderation Badge */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                      {p.isSold ? (
                        <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-gray-900 text-white shadow-md">
                          ● SOLD / RENTED
                        </span>
                      ) : p.status === 1 ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-600 text-white shadow-md">
                          <CheckCircle2 size={11} /> LIVE / APPROVED
                        </span>
                      ) : p.status === 0 ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-amber-500 text-white shadow-md">
                          <Clock size={11} /> PENDING REVIEW
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-rose-600 text-white shadow-md">
                          <AlertTriangle size={11} /> REJECTED
                        </span>
                      )}

                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/95 text-gray-800 shadow-sm backdrop-blur-sm self-start">
                        {isForSale ? 'For Sale' : 'For Rent'} • {propTypeName}
                      </span>
                    </div>

                    {/* View Count */}
                    <span className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Eye size={12} /> {p.viewCount} views
                    </span>
                  </div>

                  {/* Body */}
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono mb-1">
                      <span>{p.referenceCode}</span>
                      <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                    </div>

                    <h3 className="font-bold text-gray-900 text-sm line-clamp-2 leading-snug mb-2 flex-1">
                      {p.title}
                    </h3>

                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                      <MapPin size={13} className="text-emerald-600 flex-shrink-0" />
                      <span className="truncate">{p.city}, {p.district}</span>
                    </div>

                    <div className="text-base font-black text-gray-900 mb-4">
                      {p.price <= 0 || p.isNegotiable ? (
                        <span className="text-amber-700 text-xs font-bold">Negotiable</span>
                      ) : (
                        <>
                          <span>LKR {Number(p.price).toLocaleString()}</span>
                          {!isForSale && <span className="text-xs font-normal text-gray-400"> / mo</span>}
                        </>
                      )}
                    </div>

                    {/* Quick Actions Bar */}
                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {/* Edit button */}
                        <button
                          type="button"
                          onClick={() => setEditingProperty(p)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-200 hover:border-emerald-500 bg-white text-gray-700 hover:text-emerald-700 text-xs font-bold shadow-2xs transition-all"
                        >
                          <Edit3 size={13} className="text-emerald-600" />
                          <span>Edit</span>
                        </button>

                        {/* Toggle Sold button */}
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => handleToggleSold(p)}
                          title={p.isSold ? 'Mark as Active' : 'Mark as Sold'}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold shadow-2xs transition-all ${
                            p.isSold
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
                          }`}
                        >
                          <Tag size={12} />
                          <span>{p.isSold ? 'Active' : 'Sold'}</span>
                        </button>

                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={() => setDeletingProperty(p)}
                          title="Delete Listing"
                          className="p-1.5 rounded-xl border border-gray-200 hover:border-rose-300 text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {/* Public Link */}
                      {p.status === 1 && (
                        <Link
                          to={`/property/${p.id}`}
                          target="_blank"
                          title="View Public Listing"
                          className="p-1.5 text-gray-400 hover:text-emerald-600 rounded-lg transition-colors"
                        >
                          <ExternalLink size={15} />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ── Modals ── */}
      {isAddOpen && (
        <AddPropertyModal
          onClose={() => setIsAddOpen(false)}
          onCreated={() => {
            setIsAddOpen(false);
            fetchMyListings();
          }}
        />
      )}

      {editingProperty && (
        <EditPropertyModal
          property={editingProperty}
          onClose={() => setEditingProperty(null)}
          onUpdated={(updated) => {
            setEditingProperty(null);
            setListings((prev) =>
              prev.map((item) => (item.id === updated.id ? updated : item))
            );
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingProperty && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-gray-100 text-center">
            <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-3">
              <Trash2 size={26} />
            </div>
            <h4 className="text-base font-black text-gray-900 mb-1">Delete Listing?</h4>
            <p className="text-xs text-gray-500 leading-relaxed mb-6">
              Are you sure you want to delete <span className="font-semibold text-gray-800">"{deletingProperty.title}"</span>? This action cannot be undone.
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingProperty(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleDeleteConfirm}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-colors"
              >
                {actionLoading ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Search, SlidersHorizontal, Clock, LayoutGrid, AlertTriangle } from 'lucide-react';
import Navbar from '../components/Navbar';
import PropertyCard from '../components/PropertyCard';
import AddPropertyModal from '../components/AddPropertyModal';
import PinPromptModal from '../components/PinPromptModal';
import EditPropertyModal from '../components/EditPropertyModal';

const API_BASE = 'http://localhost:5143/api/properties';

const FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'For Sale', value: 'sale' },
  { label: 'For Rent', value: 'rent' },
  { label: 'Land', value: 'land' },
  { label: 'Houses', value: 'house' },
];

export default function HomePage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 4-digit PIN management state
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinAction, setPinAction] = useState(null); // 'edit' | 'delete'
  const [verifiedPin, setVerifiedPin] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleCardEdit = (p) => {
    setSelectedProperty(p);
    setPinAction('edit');
    setPinModalOpen(true);
  };

  const handleCardDelete = (p) => {
    setSelectedProperty(p);
    setPinAction('delete');
    setPinModalOpen(true);
  };

  const handlePinVerified = (pin) => {
    setVerifiedPin(pin);
    setPinModalOpen(false);
    if (pinAction === 'edit') {
      setEditModalOpen(true);
    } else if (pinAction === 'delete') {
      setDeleteConfirmOpen(true);
    }
  };

  const handlePropertyUpdated = (updated) => {
    setProperties((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item))
    );
    alert('Listing updated successfully!');
  };

  const handleDeleteConfirm = async () => {
    if (!selectedProperty) return;
    setDeleting(true);
    setDeleteError('');
    try {
      const res = await fetch(`${API_BASE}/${selectedProperty.id}?pin=${encodeURIComponent(verifiedPin)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || 'Failed to delete listing.');
      }
      setProperties((prev) => prev.filter((item) => item.id !== selectedProperty.id));
      setDeleteConfirmOpen(false);
      setSelectedProperty(null);
      alert('Listing has been successfully deleted.');
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete listing.');
    } finally {
      setDeleting(false);
    }
  };

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_BASE);
      if (!res.ok) throw new Error('Could not load listings.');
      setProperties(await res.json());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProperties(); }, []);

  const handleCreated = (newProp) => {
    setProperties((prev) => [newProp, ...prev]);
  };

  const filtered = properties.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.city.toLowerCase().includes(q) ||
      p.district.toLowerCase().includes(q);

    const matchesFilter =
      activeFilter === 'all' ||
      (activeFilter === 'sale' && p.listingType === 0) ||
      (activeFilter === 'rent' && p.listingType === 1) ||
      (activeFilter === 'land' && p.propertyType === 0) ||
      (activeFilter === 'house' && p.propertyType === 1);

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        onAddClick={() => setIsModalOpen(true)}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 md:pb-12">

        {/* Hero Search Bar */}
        <div className="py-6 md:py-8">
          <div className="max-w-3xl">
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-1">
              Find Your Perfect <span className="text-emerald-600">Property</span>
            </h1>
            <p className="text-gray-500 text-sm mb-4">
              Browse verified land, houses, and commercial listings across Sri Lanka.
            </p>
            <div className="relative">
              <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by city, district, or property title..."
                className="w-full pl-11 pr-12 py-3 bg-white border border-gray-200 rounded-2xl text-sm text-gray-700 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <SlidersHorizontal size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Filter Pills (desktop uses Navbar) */}
        <div className="flex md:hidden gap-2 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value)}
              className={`flex-shrink-0 text-sm font-semibold px-4 py-1.5 rounded-full border transition-all ${
                activeFilter === f.value
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300 hover:text-emerald-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Sort & Count Row */}
        <div className="flex items-center justify-between mt-4 mb-5">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock size={14} className="text-emerald-500" />
            <span>
              Sorted by: <strong className="text-gray-700">Newest First</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400 font-medium">
            <LayoutGrid size={14} />
            <span>
              {filtered.length} listing{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Loading Skeletons */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm"
              >
                <div className="aspect-[16/10] bg-gray-100 animate-pulse" />
                <div className="p-4 space-y-3">
                  <div className="h-3 bg-gray-100 rounded-full w-1/3 animate-pulse" />
                  <div className="h-4 bg-gray-100 rounded-full w-full animate-pulse" />
                  <div className="h-4 bg-gray-100 rounded-full w-2/3 animate-pulse" />
                  <div className="h-5 bg-gray-100 rounded-full w-1/2 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="mt-16 text-center">
            <div className="text-5xl mb-4">📡</div>
            <p className="text-gray-700 font-semibold text-lg">{error}</p>
            <p className="text-gray-400 text-sm mt-2">
              Make sure the backend API is running on port 5143.
            </p>
            <button
              onClick={fetchProperties}
              className="mt-5 px-5 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filtered.length === 0 && (
          <div className="mt-16 text-center">
            <div className="text-5xl mb-4">🏘️</div>
            <p className="text-gray-700 font-semibold text-lg">No listings found</p>
            <p className="text-gray-400 text-sm mt-2">
              Try a different filter or add the first listing.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-5 px-5 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-colors"
            >
              + Add First Listing
            </button>
          </div>
        )}

        {/* Property Grid */}
        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((p) => (
              <PropertyCard
                key={p.id}
                property={p}
                onEdit={handleCardEdit}
                onDelete={handleCardDelete}
              />
            ))}
          </div>
        )}
      </main>

      {/* Mobile Bottom Nav - hidden on md+ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-30">
        <div className="grid grid-cols-5 py-1">
          {[
            { icon: '🏠', label: 'Explore', active: true },
            { icon: '🔖', label: 'Saved' },
            { icon: '➕', label: 'Add', onClick: () => setIsModalOpen(true) },
            { icon: 'ℹ️', label: 'About' },
            { icon: '👤', label: 'Account' },
          ].map((item) => (
            <button
              key={item.label}
              onClick={item.onClick}
              className={`flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold transition-colors ${
                item.active ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <span className="text-xl leading-none">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      {isModalOpen && (
        <AddPropertyModal
          onClose={() => setIsModalOpen(false)}
          onCreated={handleCreated}
        />
      )}

      {/* PIN Verification Modal */}
      {pinModalOpen && selectedProperty && (
        <PinPromptModal
          propertyId={selectedProperty.id}
          title={pinAction === 'edit' ? 'Enter PIN to Edit' : 'Enter PIN to Delete'}
          actionDescription={
            pinAction === 'edit'
              ? `Enter the 4-digit secret PIN for "${selectedProperty.title}".`
              : `Enter the 4-digit secret PIN to authorize deleting "${selectedProperty.title}".`
          }
          onClose={() => {
            setPinModalOpen(false);
            setSelectedProperty(null);
          }}
          onSuccess={handlePinVerified}
        />
      )}

      {/* Edit Property Modal */}
      {editModalOpen && selectedProperty && (
        <EditPropertyModal
          property={selectedProperty}
          verifiedPin={verifiedPin}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedProperty(null);
          }}
          onUpdated={handlePropertyUpdated}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && selectedProperty && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-100 p-5 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Delete Listing</h3>
                <p className="text-xs text-gray-400">Permanently remove listing</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <strong className="text-gray-900">"{selectedProperty.title}"</strong>?
              This action cannot be undone.
            </p>

            {deleteError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">
                {deleteError}
              </p>
            )}

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setSelectedProperty(null);
                }}
                disabled={deleting}
                className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-xs font-bold text-white shadow-sm transition-colors flex items-center justify-center gap-1.5"
              >
                {deleting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Confirm Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
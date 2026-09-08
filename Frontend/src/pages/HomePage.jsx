import { useEffect, useState } from 'react';
import { Search, SlidersHorizontal, Clock, LayoutGrid } from 'lucide-react';
import Navbar from '../components/Navbar';
import PropertyCard from '../components/PropertyCard';
import AddPropertyModal from '../components/AddPropertyModal';

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
              <PropertyCard key={p.id} property={p} />
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
    </div>
  );
}
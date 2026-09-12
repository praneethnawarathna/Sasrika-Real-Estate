import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Clock, LayoutGrid, AlertTriangle } from 'lucide-react';
import Navbar from '../components/Navbar';
import PropertyCard from '../components/PropertyCard';
import AddPropertyModal from '../components/AddPropertyModal';
import SearchFilterBar from '../components/SearchFilterBar';
import Footer from '../components/Footer';

const API_BASE = 'http://localhost:5143/api/properties';

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlFilter = searchParams.get('filter');

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState(
    urlFilter === 'sale' || urlFilter === 'rent' ? urlFilter : 'all'
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Sync activeFilter with URL params if changed externally
  useEffect(() => {
    if (urlFilter === 'sale' || urlFilter === 'rent') {
      setActiveFilter(urlFilter);
    } else if (!urlFilter) {
      setActiveFilter('all');
    }
  }, [urlFilter]);

  // Advanced Search & Filter parameters
  const [filters, setFilters] = useState({
    searchTerm: '',
    propertyType: 'all',
    district: 'all',
    minPrice: '',
    maxPrice: '',
    sortBy: 'newest',
  });

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      // Synchronize with active header tab
      if (activeFilter === 'sale') params.append('listingType', 'sale');
      else if (activeFilter === 'rent') params.append('listingType', 'rent');

      if (filters.searchTerm?.trim()) params.append('searchTerm', filters.searchTerm.trim());
      if (filters.propertyType && filters.propertyType !== 'all') params.append('propertyType', filters.propertyType);
      if (filters.district && filters.district !== 'all') params.append('district', filters.district);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      if (filters.sortBy && filters.sortBy !== 'newest') params.append('sortBy', filters.sortBy);

      const qs = params.toString();
      const res = await fetch(`${API_BASE}${qs ? `?${qs}` : ''}`);
      if (!res.ok) throw new Error('Could not load listings.');
      setProperties(await res.json());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Debounced fetch whenever filters or active tab change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProperties();
    }, 200);
    return () => clearTimeout(timer);
  }, [activeFilter, filters]);

  const handleResetFilters = () => {
    setFilters({
      searchTerm: '',
      propertyType: 'all',
      district: 'all',
      minPrice: '',
      maxPrice: '',
      sortBy: 'newest',
    });
  };

  const handleCreated = (newProp) => {
    setProperties((prev) => [newProp, ...prev]);
  };

  const handleNavFilterChange = (filterVal) => {
    setActiveFilter(filterVal);
    if (filterVal === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ filter: filterVal });
    }
  };

  const sortLabel =
    filters.sortBy === 'price_asc'
      ? 'Price: Low to High'
      : filters.sortBy === 'price_desc'
        ? 'Price: High to Low'
        : 'Newest First';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      <div>
        <Navbar
          onAddClick={() => setIsModalOpen(true)}
          activeFilter={activeFilter}
          onFilterChange={handleNavFilterChange}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 pt-4">

          {/* Hero Section */}
          <div className="pt-6 pb-6 text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 mb-3">
              Sri Lanka's Premier Real Estate Marketplace
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight">
              Find Your Ideal Property in <span className="text-emerald-600"><br />Sri Lanka</span>
            </h1>
            <p className="mt-2.5 text-sm sm:text-base text-gray-500 max-w-xl mx-auto leading-relaxed">
              Explore verified lands, modern houses, and commercial spaces with transparent pricing and direct seller contact.
            </p>
          </div>

          {/* Advanced Search & Filter Bar */}
          <SearchFilterBar
            filters={filters}
            onFilterChange={setFilters}
            onReset={handleResetFilters}
            totalResults={properties.length}
          />

          {/* Results Header: Count & Sort */}
          <div className="flex items-center justify-between mb-5 px-1">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock size={14} className="text-emerald-500" />
              <span>
                Sorted by: <strong className="text-gray-700 font-semibold">{sortLabel}</strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-gray-500 font-medium">
              <LayoutGrid size={15} className="text-gray-400" />
              <span>
                <strong className="text-gray-800">{properties.length}</strong> listing{properties.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Loading Skeletons */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
            <div className="mt-12 text-center bg-white rounded-3xl p-10 border border-gray-100 shadow-sm max-w-lg mx-auto">
              <div className="text-5xl mb-4">📡</div>
              <p className="text-gray-800 font-bold text-lg">{error}</p>
              <p className="text-gray-400 text-sm mt-1">
                Unable to reach the backend API. Please ensure the server is active.
              </p>
              <button
                onClick={fetchProperties}
                className="mt-5 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && properties.length === 0 && (
            <div className="mt-12 text-center bg-white rounded-3xl p-12 border border-gray-100 shadow-sm max-w-md mx-auto">
              <div className="text-5xl mb-4">🏘️</div>
              <p className="text-gray-800 font-bold text-lg">No matching properties found</p>
              <p className="text-gray-400 text-sm mt-1">
                Try adjusting your search criteria, price range, or reset your filters.
              </p>
              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-colors"
                >
                  Reset Filters
                </button>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
                >
                  + Add Property
                </button>
              </div>
            </div>
          )}

          {/* Property Grid */}
          {!loading && !error && properties.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {properties.map((p) => (
                <PropertyCard
                  key={p.id}
                  property={p}
                />
              ))}
            </div>
          )}

        </main>
      </div>

      {/* Global Footer */}
      <Footer />

      {/* Mobile Bottom Nav - hidden on md+ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 z-30 shadow-lg">
        <div className="grid grid-cols-4 py-1">
          <button
            onClick={() => handleNavFilterChange('all')}
            className={`flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold transition-colors ${activeFilter === 'all' ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'
              }`}
          >
            <span className="text-lg leading-none">🏠</span>
            Explore
          </button>
          <button
            onClick={() => handleNavFilterChange('sale')}
            className={`flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold transition-colors ${activeFilter === 'sale' ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'
              }`}
          >
            <span className="text-lg leading-none">🏷️</span>
            For Sale
          </button>
          <button
            onClick={() => handleNavFilterChange('rent')}
            className={`flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold transition-colors ${activeFilter === 'rent' ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'
              }`}
          >
            <span className="text-lg leading-none">🔑</span>
            For Rent
          </button>
          <Link
            to="/about"
            className="flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold text-gray-400 hover:text-emerald-600 transition-colors"
          >
            <span className="text-lg leading-none">ℹ️</span>
            About
          </Link>
        </div>
      </nav>

      {/* Add Property Modal */}
      {isModalOpen && (
        <AddPropertyModal
          onClose={() => setIsModalOpen(false)}
          onCreated={() => {
            fetchProperties();
          }}
        />
      )}
    </div>
  );
}
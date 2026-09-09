import { useState } from 'react';
import { Search, SlidersHorizontal, RotateCcw, Building2, MapPin, ArrowUpDown, ChevronDown, ChevronUp, DollarSign } from 'lucide-react';

export const SRI_LANKAN_DISTRICTS = [
  'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
  'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
  'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
  'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
  'Monaragala', 'Ratnapura', 'Kegalle'
];

export default function SearchFilterBar({
  filters,
  onFilterChange,
  onReset,
  totalResults = 0,
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const hasActiveFilters = Boolean(
    filters.searchTerm ||
    (filters.propertyType && filters.propertyType !== 'all') ||
    (filters.district && filters.district !== 'all') ||
    filters.minPrice ||
    filters.maxPrice ||
    (filters.sortBy && filters.sortBy !== 'newest')
  );

  const handleTextChange = (field, value) => {
    onFilterChange({ ...filters, [field]: value });
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 sm:p-5 mb-8">
      {/* ── Top Row: Primary Search & Quick Selectors ── */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">

        {/* 1. Keyword Search */}
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={filters.searchTerm || ''}
            onChange={(e) => handleTextChange('searchTerm', e.target.value)}
            placeholder="Search by title, keyword, city, or district..."
            className="w-full pl-11 pr-4 py-3 bg-gray-50/80 hover:bg-gray-50 focus:bg-white border border-gray-200 rounded-2xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
          />
        </div>

        {/* 2. Property Type Select */}
        <div className="relative min-w-[170px]">
          <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <select
            value={filters.propertyType || 'all'}
            onChange={(e) => handleTextChange('propertyType', e.target.value)}
            className="w-full pl-10 pr-8 py-3 bg-gray-50/80 hover:bg-gray-50 focus:bg-white border border-gray-200 rounded-2xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none transition-all cursor-pointer"
          >
            <option value="all">All Property Types</option>
            <option value="house">House / Residential</option>
            <option value="land">Land</option>
            <option value="commercial">Commercial</option>
          </select>
          <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>

        {/* 3. District Select */}
        <div className="relative min-w-[170px]">
          <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <select
            value={filters.district || 'all'}
            onChange={(e) => handleTextChange('district', e.target.value)}
            className="w-full pl-10 pr-8 py-3 bg-gray-50/80 hover:bg-gray-50 focus:bg-white border border-gray-200 rounded-2xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none transition-all cursor-pointer"
          >
            <option value="all">All Districts</option>
            {SRI_LANKAN_DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>

        {/* 4. Toggle Advanced Filters Button */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border text-sm font-semibold transition-all ${
            showAdvanced || (filters.minPrice || filters.maxPrice || filters.sortBy !== 'newest')
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
              : 'bg-gray-50/80 hover:bg-gray-100 text-gray-700 border-gray-200'
          }`}
        >
          <SlidersHorizontal size={16} />
          <span className="hidden sm:inline">Filters</span>
          {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {/* 5. Clear Filters Button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            title="Reset all filters"
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-3 rounded-2xl text-rose-600 hover:bg-rose-50 border border-rose-200 text-sm font-semibold transition-all"
          >
            <RotateCcw size={14} />
            <span className="hidden sm:inline">Reset</span>
          </button>
        )}
      </div>

      {/* ── Advanced Dropdown Panel: Price & Sort ── */}
      {showAdvanced && (
        <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-200">

          {/* Min Price */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Min Price (LKR)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">Rs.</span>
              <input
                type="number"
                value={filters.minPrice || ''}
                onChange={(e) => handleTextChange('minPrice', e.target.value)}
                placeholder="e.g. 5,000,000"
                className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Max Price */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Max Price (LKR)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">Rs.</span>
              <input
                type="number"
                value={filters.maxPrice || ''}
                onChange={(e) => handleTextChange('maxPrice', e.target.value)}
                placeholder="e.g. 50,000,000"
                className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Sort Listings
            </label>
            <div className="relative">
              <ArrowUpDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <select
                value={filters.sortBy || 'newest'}
                onChange={(e) => handleTextChange('sortBy', e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white appearance-none cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
              <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Quick Price Ranges */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Quick Price Filter
            </label>
            <div className="flex gap-1.5 flex-wrap">
              {[
                { label: '< 10M', min: '', max: 10000000 },
                { label: '10M - 30M', min: 10000000, max: 30000000 },
                { label: '30M+', min: 30000000, max: '' },
              ].map((p) => {
                const isSelected =
                  String(filters.minPrice || '') === String(p.min) &&
                  String(filters.maxPrice || '') === String(p.max);
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        onFilterChange({ ...filters, minPrice: '', maxPrice: '' });
                      } else {
                        onFilterChange({ ...filters, minPrice: p.min, maxPrice: p.max });
                      }
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-600 border-gray-200'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* ── Active Filter Badges ── */}
      {hasActiveFilters && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 flex-wrap text-xs text-gray-500">
          <span className="font-semibold text-gray-600">Active Filters:</span>
          {filters.searchTerm && (
            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-medium">
              "{filters.searchTerm}"
              <button
                type="button"
                onClick={() => handleTextChange('searchTerm', '')}
                className="hover:text-emerald-900"
              >
                ×
              </button>
            </span>
          )}
          {filters.propertyType && filters.propertyType !== 'all' && (
            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-medium capitalize">
              Type: {filters.propertyType}
              <button
                type="button"
                onClick={() => handleTextChange('propertyType', 'all')}
                className="hover:text-emerald-900"
              >
                ×
              </button>
            </span>
          )}
          {filters.district && filters.district !== 'all' && (
            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-medium">
              {filters.district}
              <button
                type="button"
                onClick={() => handleTextChange('district', 'all')}
                className="hover:text-emerald-900"
              >
                ×
              </button>
            </span>
          )}
          {(filters.minPrice || filters.maxPrice) && (
            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-medium">
              Price: {filters.minPrice ? `Rs. ${Number(filters.minPrice).toLocaleString()}` : '0'} - {filters.maxPrice ? `Rs. ${Number(filters.maxPrice).toLocaleString()}` : 'Any'}
              <button
                type="button"
                onClick={() => onFilterChange({ ...filters, minPrice: '', maxPrice: '' })}
                className="hover:text-emerald-900"
              >
                ×
              </button>
            </span>
          )}
          {filters.sortBy && filters.sortBy !== 'newest' && (
            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-medium">
              Sort: {filters.sortBy === 'price_asc' ? 'Low to High' : 'High to Low'}
              <button
                type="button"
                onClick={() => handleTextChange('sortBy', 'newest')}
                className="hover:text-emerald-900"
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

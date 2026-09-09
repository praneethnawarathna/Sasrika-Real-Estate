import { Link } from 'react-router-dom';
import { MapPin, Heart, BedDouble, Bath, Ruler, Sparkles, Edit3, Trash2 } from 'lucide-react';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor(diff / 60000);
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (mins > 0) return `${mins} min${mins > 1 ? 's' : ''} ago`;
  return 'Just now';
}

// PropertyType: Land=0, House=1, Commercial=2
// ListingType: ForSale=0, ForRent=1
const isLandOrHouseForSale = (p) =>
  (p.propertyType === 0 || p.propertyType === 1) && p.listingType === 0;
const isRent = (p) => p.listingType === 1;

export default function PropertyCard({ property: p, onEdit, onDelete }) {
  const imgUrl =
    p.imageUrls?.[0] ||
    'https://placehold.co/800x500/e2e8f0/94a3b8?text=No+Image';
  const isForSale = p.listingType === 0;

  return (
    <Link to={`/property/${p.id}`} className="block group">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg flex flex-col h-full">

        {/* ── Image ── */}
        <div className="relative aspect-[16/10] overflow-hidden bg-gray-100 flex-shrink-0">
          <img
            src={imgUrl}
            alt={p.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.src =
                'https://placehold.co/800x500/e2e8f0/94a3b8?text=No+Image';
            }}
          />
          {/* Listing Badge */}
          <span
            className={`absolute top-3 left-3 text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm ${
              isForSale
                ? 'bg-emerald-600 text-white'
                : 'bg-indigo-600 text-white'
            }`}
          >
            {isForSale ? 'FOR SALE' : 'FOR RENT'}
          </span>

          {/* Top Actions: Edit, Delete, Favorite */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
            {onEdit && (
              <button
                type="button"
                title="Edit Listing"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onEdit(p);
                }}
                className="w-8 h-8 bg-white/90 hover:bg-white text-gray-500 hover:text-emerald-600 rounded-full flex items-center justify-center shadow-sm transition-colors"
              >
                <Edit3 size={13} />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                title="Delete Listing"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete(p);
                }}
                className="w-8 h-8 bg-white/90 hover:bg-white text-gray-500 hover:text-rose-600 rounded-full flex items-center justify-center shadow-sm transition-colors"
              >
                <Trash2 size={13} />
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-sm text-gray-400 hover:text-rose-500 transition-colors"
            >
              <Heart size={15} />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex flex-col flex-1 p-4">
          {/* Location */}
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
            <MapPin size={11} className="text-emerald-500 flex-shrink-0" />
            <span className="truncate font-medium">
              {p.city}
              {p.district ? `, ${p.district}` : ''}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-2 group-hover:text-emerald-700 transition-colors mb-3 flex-1">
            {p.title}
          </h3>

          {/* Price */}
          {p.price <= 0 || p.isNegotiable ? (
            <div className="flex items-center gap-1.5 mb-2">
              <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full">
                <Sparkles size={11} />
                Negotiable
              </span>
            </div>
          ) : (
            <div className="flex items-baseline gap-1.5 mb-2">
              <span className="text-xs text-gray-400 font-semibold">LKR</span>
              <span className="text-lg font-extrabold text-gray-900 leading-none">
                {new Intl.NumberFormat('en-LK').format(p.price)}
              </span>
              {isRent(p) && (
                <span className="text-xs text-gray-400 font-medium">/ mo</span>
              )}
            </div>
          )}

          {/* Stats row */}
          <div className="flex items-center gap-3 flex-wrap">
            {isLandOrHouseForSale(p) && p.landSizePerches != null && (
              <span className="flex items-center gap-1 text-xs text-gray-500 font-medium bg-emerald-50 px-2 py-1 rounded-lg">
                <Ruler size={11} className="text-emerald-500" />
                {p.landSizePerches} Perches
              </span>
            )}
            {isRent(p) && p.bedrooms != null && (
              <span className="flex items-center gap-1 text-xs text-gray-500 font-medium">
                <BedDouble size={12} /> {p.bedrooms} Beds
              </span>
            )}
            {isRent(p) && p.bathrooms != null && (
              <span className="flex items-center gap-1 text-xs text-gray-500 font-medium">
                <Bath size={12} /> {p.bathrooms} Baths
              </span>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50 text-xs">
            <span className="text-[11px] text-gray-400 font-medium">
              ● {timeAgo(p.createdAt)}
            </span>
            <div className="flex items-center gap-2">
              {p.pricePerPerch && isLandOrHouseForSale(p) && (
                <span className="text-[11px] text-emerald-600 font-bold mr-1">
                  LKR {Math.round(p.pricePerPerch).toLocaleString()}/perch
                </span>
              )}
              {onEdit && (
                <button
                  type="button"
                  title="Edit listing"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onEdit(p);
                  }}
                  className="p-1 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                >
                  <Edit3 size={13} />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  title="Delete listing"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete(p);
                  }}
                  className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
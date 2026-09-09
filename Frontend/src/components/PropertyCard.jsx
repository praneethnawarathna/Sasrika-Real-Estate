import { Link } from 'react-router-dom';
import { MapPin, Heart, BedDouble, Bath, Ruler, Sparkles, Edit3, Trash2 } from 'lucide-react';
import WhatsAppIcon from './WhatsAppIcon';
import { getWhatsAppUrl } from '../utils/phoneUtils';

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

const PROPERTY_TYPES = [
  { label: 'Land', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  { label: 'House', bg: 'bg-sky-50 text-sky-700 border-sky-200' },
  { label: 'Commercial', bg: 'bg-purple-50 text-purple-700 border-purple-200' },
];

export default function PropertyCard({ property: p, onEdit, onDelete }) {
  const imgUrl =
    p.imageUrls?.[0] ||
    'https://placehold.co/800x500/e2e8f0/94a3b8?text=No+Image';
  const isForSale = p.listingType === 0;
  const propType = PROPERTY_TYPES[p.propertyType] || PROPERTY_TYPES[0];

  const whatsAppUrl = getWhatsAppUrl(p.sellerPhone, p.title, p.price, p.isNegotiable);

  return (
    <Link to={`/property/${p.id}`} className="block group">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg flex flex-col h-full">

        {/* ── Image & Top Badges ── */}
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

          {/* Dual Badges: Listing Type + Property Type */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
            <span
              className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-sm tracking-wide ${
                isForSale
                  ? 'bg-emerald-600 text-white'
                  : 'bg-indigo-600 text-white'
              }`}
            >
              {isForSale ? 'FOR SALE' : 'FOR RENT'}
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-sm backdrop-blur-sm bg-white/90 ${propType.bg}`}
            >
              {propType.label}
            </span>
          </div>

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
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1.5">
            <MapPin size={12} className="text-emerald-500 flex-shrink-0" />
            <span className="truncate font-medium">
              {p.city}
              {p.district ? `, ${p.district}` : ''}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-2 group-hover:text-emerald-700 transition-colors mb-2.5 flex-1">
            {p.title}
          </h3>

          {/* Price */}
          {p.price <= 0 || p.isNegotiable ? (
            <div className="flex items-center gap-1.5 mb-2.5">
              <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full">
                <Sparkles size={11} />
                Negotiable
              </span>
            </div>
          ) : (
            <div className="flex items-baseline gap-1.5 mb-2.5">
              <span className="text-xs text-gray-400 font-semibold">LKR</span>
              <span className="text-lg font-black text-gray-900 leading-none">
                {new Intl.NumberFormat('en-LK').format(p.price)}
              </span>
              {!isForSale && (
                <span className="text-xs text-gray-400 font-medium">/ mo</span>
              )}
            </div>
          )}

          {/* Conditional Specs Row */}
          <div className="flex items-center gap-3 flex-wrap min-h-[26px]">
            {/* 1. Land (0): ONLY Perches (never show 0 beds/baths) */}
            {p.propertyType === 0 && p.landSizePerches != null && (
              <span className="flex items-center gap-1 text-xs text-gray-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-lg">
                <Ruler size={11} className="text-emerald-600" />
                {p.landSizePerches} Perches
              </span>
            )}

            {/* 2. House (1): Beds, Baths, and Perches */}
            {p.propertyType === 1 && (
              <>
                {p.bedrooms > 0 && (
                  <span className="flex items-center gap-1 text-xs text-gray-600 font-medium bg-gray-50 px-2 py-0.5 rounded-lg">
                    <BedDouble size={12} className="text-gray-500" /> {p.bedrooms} Beds
                  </span>
                )}
                {p.bathrooms > 0 && (
                  <span className="flex items-center gap-1 text-xs text-gray-600 font-medium bg-gray-50 px-2 py-0.5 rounded-lg">
                    <Bath size={12} className="text-gray-500" /> {p.bathrooms} Baths
                  </span>
                )}
                {p.landSizePerches != null && (
                  <span className="flex items-center gap-1 text-xs text-gray-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-lg">
                    <Ruler size={11} className="text-emerald-600" /> {p.landSizePerches} Perches
                  </span>
                )}
              </>
            )}

            {/* 3. Commercial (2): Baths and Land/Floor extent (NO beds) */}
            {p.propertyType === 2 && (
              <>
                {p.bathrooms > 0 && (
                  <span className="flex items-center gap-1 text-xs text-gray-600 font-medium bg-gray-50 px-2 py-0.5 rounded-lg">
                    <Bath size={12} className="text-gray-500" /> {p.bathrooms} Baths
                  </span>
                )}
                {p.landSizePerches != null && (
                  <span className="flex items-center gap-1 text-xs text-gray-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-lg">
                    <Ruler size={11} className="text-emerald-600" /> {p.landSizePerches} Perches
                  </span>
                )}
              </>
            )}
          </div>

          {/* Footer with Timestamp & WhatsApp Lead Action */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 text-xs">
            <span className="text-[11px] text-gray-400 font-medium">
              ● {timeAgo(p.createdAt)}
            </span>

            <div className="flex items-center gap-2">
              {p.pricePerPerch && (p.propertyType === 0 || p.propertyType === 1) && (
                <span className="text-[11px] text-emerald-600 font-bold mr-1">
                  Rs. {Math.round(p.pricePerPerch).toLocaleString()}/p
                </span>
              )}

              {/* Quick WhatsApp Lead Chat Button */}
              {p.sellerPhone && (
                <a
                  href={whatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  title="Chat on WhatsApp"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-[11px] shadow-sm transition-all"
                >
                  <WhatsAppIcon size={12} />
                  <span>Chat</span>
                </a>
              )}
            </div>
          </div>

        </div>
      </div>
    </Link>
  );
}
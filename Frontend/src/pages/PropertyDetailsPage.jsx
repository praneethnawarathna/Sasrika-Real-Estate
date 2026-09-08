import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Heart, Share2, MapPin, Eye, Phone, MessageSquare,
  Ruler, CheckCircle2, Sparkles, ChevronLeft, ChevronRight,
  Home, BedDouble, Bath, Tag
} from 'lucide-react';
import Navbar from '../components/Navbar';
import AddPropertyModal from '../components/AddPropertyModal';

const API_BASE = 'http://localhost:5143/api/properties';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return 'Just now';
}

function formatLKR(amount) {
  return 'LKR ' + new Intl.NumberFormat('en-LK').format(amount);
}

const PROPERTY_TYPE_LABELS = ['Land', 'House', 'Commercial'];
const LISTING_TYPE_LABELS = ['For Sale', 'For Rent'];

export default function PropertyDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImg, setActiveImg] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/${id}`);
        if (!res.ok) throw new Error('Property not found.');
        setProperty(await res.json());
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <div className="text-6xl">🏚️</div>
        <p className="text-gray-700 font-semibold text-lg">{error || 'Property not found'}</p>
        <button
          onClick={() => navigate('/')}
          className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors"
        >
          Back to Listings
        </button>
      </div>
    );
  }

  const p = property;
  const images =
    p.imageUrls?.length > 0
      ? p.imageUrls
      : ['https://placehold.co/1200x800/e2e8f0/94a3b8?text=No+Image'];
  const isForSale = p.listingType === 0;
  const showPerches =
    (p.propertyType === 0 || p.propertyType === 1) && p.listingType === 0;

  const prevImg = () =>
    setActiveImg((i) => (i - 1 + images.length) % images.length);
  const nextImg = () => setActiveImg((i) => (i + 1) % images.length);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onAddClick={() => setIsModalOpen(true)} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Back breadcrumb */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-600 font-semibold mb-6 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Listings
        </button>

        {/* ── Two-Column Desktop Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ════ LEFT COLUMN (spans 2) ════ */}
          <div className="lg:col-span-2 space-y-6">

            {/* Gallery */}
            <div className="bg-black rounded-2xl overflow-hidden shadow-md">
              <div className="relative aspect-[16/9]">
                <img
                  src={images[activeImg]}
                  alt={p.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src =
                      'https://placehold.co/1200x800/e2e8f0/94a3b8?text=No+Image';
                  }}
                />
                {/* Overlay badges */}
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span
                    className={`text-xs font-bold px-3 py-1.5 rounded-full shadow-sm ${
                      isForSale
                        ? 'bg-emerald-600 text-white'
                        : 'bg-indigo-600 text-white'
                    }`}
                  >
                    {isForSale ? '# FOR SALE' : '# FOR RENT'}
                  </span>
                  <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white/90 text-emerald-700 flex items-center gap-1.5 shadow-sm">
                    <CheckCircle2 size={12} /> Verified Title Deed
                  </span>
                </div>
                {/* Counter + Actions */}
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  <button className="w-9 h-9 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-sm text-gray-500 hover:text-rose-500 transition-colors">
                    <Heart size={16} />
                  </button>
                  <button className="w-9 h-9 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-sm text-gray-500 transition-colors">
                    <Share2 size={16} />
                  </button>
                </div>
                {/* Image counter */}
                <span className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full">
                  {activeImg + 1}/{images.length}
                </span>
                {/* Arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={prevImg}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 transition-colors"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={nextImg}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 transition-colors"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnail Row */}
              {images.length > 1 && (
                <div className="flex gap-2 p-3 bg-gray-900 overflow-x-auto scrollbar-none">
                  {images.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImg(i)}
                      className={`flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                        i === activeImg
                          ? 'border-emerald-500 opacity-100 scale-105'
                          : 'border-transparent opacity-50 hover:opacity-75'
                      }`}
                    >
                      <img
                        src={url}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src =
                            'https://placehold.co/120x80/374151/9ca3af?text=No';
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Location + Title */}
            <div>
              <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-2">
                <MapPin size={14} className="text-emerald-500" />
                <span>
                  {p.city}
                  {p.district ? `, ${p.district}` : ''}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight">
                {p.title}
              </h1>
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                  <Home size={12} />
                  {PROPERTY_TYPE_LABELS[p.propertyType] ?? 'Property'}
                </span>
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${
                  isForSale
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-indigo-100 text-indigo-700'
                }`}>
                  <Tag size={12} />
                  {LISTING_TYPE_LABELS[p.listingType] ?? ''}
                </span>
              </div>
            </div>

            {/* Key Property Highlights */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-1 h-5 bg-emerald-500 rounded-full" />
                Key Property Highlights
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { icon: '✅', title: 'Clear Freehold', desc: 'Pedigree title bank-loan approved' },
                  { icon: '📐', title: showPerches ? `${p.landSizePerches} Perches` : 'Size', desc: 'Land extent verified' },
                  { icon: '⚡', title: '3-Phase & Water', desc: 'National grid ready connections' },
                  { icon: '🚗', title: '5 Mins to City', desc: 'Quick access to city center' },
                ].map((h) => (
                  <div key={h.title} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                    <span className="text-xl flex-shrink-0">{h.icon}</span>
                    <div>
                      <p className="text-sm font-bold text-gray-800">{h.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{h.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-1 h-5 bg-emerald-500 rounded-full" />
                Overview &amp; Location Details
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {p.description}
              </p>
            </div>

            {/* Sasrika Guarantee */}
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                <CheckCircle2 size={18} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-800">Sasrika Buyer Guarantee</p>
                <p className="text-xs text-emerald-600 mt-0.5">
                  Survey plan, municipal zoning, and ownership lineage fully validated.
                </p>
              </div>
            </div>
          </div>

          {/* ════ RIGHT COLUMN - Sticky Sidebar ════ */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 space-y-4">

              {/* Price Block */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mb-1">
                  Listed Asking Price
                </p>
                <div className="flex items-center gap-3 flex-wrap mb-1">
                  {p.price > 0 ? (
                    <span className="text-2xl font-black text-emerald-600 leading-none">
                      {formatLKR(p.price)}
                    </span>
                  ) : null}
                  {p.isNegotiable && (
                    <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full">
                      <Sparkles size={11} /> NEGOTIABLE
                    </span>
                  )}
                </div>
                {p.pricePerPerch && (
                  <p className="text-sm text-gray-500">
                    Approx.{' '}
                    <strong className="text-gray-700">
                      {formatLKR(Math.round(p.pricePerPerch))}
                    </strong>{' '}
                    per Perch
                  </p>
                )}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3">
                {showPerches && p.landSizePerches != null && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <Ruler size={20} className="text-emerald-600" />
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-gray-400 font-semibold uppercase">
                        Land Extent
                      </p>
                      <p className="font-extrabold text-gray-900 text-sm">
                        {p.landSizePerches} Perch.
                      </p>
                    </div>
                  </div>
                )}
                {p.bedrooms != null && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <BedDouble size={20} className="text-emerald-600" />
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-gray-400 font-semibold uppercase">Bedrooms</p>
                      <p className="font-extrabold text-gray-900 text-sm">{p.bedrooms}</p>
                    </div>
                  </div>
                )}
                {p.bathrooms != null && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <Bath size={20} className="text-emerald-600" />
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-gray-400 font-semibold uppercase">Bathrooms</p>
                      <p className="font-extrabold text-gray-900 text-sm">{p.bathrooms}</p>
                    </div>
                  </div>
                )}
                <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <CheckCircle2 size={20} className="text-emerald-600" />
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-gray-400 font-semibold uppercase">
                      Title / Deeds
                    </p>
                    <p className="font-extrabold text-gray-900 text-sm">First-Class</p>
                  </div>
                </div>
              </div>

              {/* Meta: Views + Ref + Date */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3">
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <Eye size={13} className="text-emerald-500" />
                    <strong className="text-gray-700">{p.viewCount}</strong> views
                  </span>
                  <span className="flex items-center gap-1">
                    🗓{' '}
                    {new Date(p.createdAt).toLocaleDateString('en-LK', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}{' '}
                    ({timeAgo(p.createdAt)})
                  </span>
                  <span className="font-mono font-bold text-gray-700 text-sm">
                    {p.referenceCode}
                  </span>
                </div>
              </div>

              {/* Seller Card */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md flex-shrink-0">
                    <span className="text-white font-black text-xl">
                      {p.sellerName ? p.sellerName.charAt(0).toUpperCase() : 'S'}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 text-sm truncate">
                      {p.sellerName}
                    </p>
                    <p className="text-xs text-emerald-600 flex items-center gap-1 mt-0.5">
                      <CheckCircle2 size={11} /> Verified Sasrika Partner
                    </p>
                    <p className="font-mono text-sm text-gray-700 font-semibold mt-0.5">
                      {p.sellerPhone}
                    </p>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <a
                    href={`tel:${p.sellerPhone}`}
                    className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl py-3 text-sm shadow-sm transition-colors"
                  >
                    <Phone size={15} />
                    Call Seller
                  </a>
                  <a
                    href={`sms:${p.sellerPhone}`}
                    className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl py-3 text-sm transition-colors"
                  >
                    <MessageSquare size={15} />
                    Send SMS
                  </a>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <AddPropertyModal
          onClose={() => setIsModalOpen(false)}
          onCreated={() => {}}
        />
      )}
    </div>
  );
}
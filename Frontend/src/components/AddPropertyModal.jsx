import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, User, Phone, CheckCircle2, Clock, ShieldCheck, Building2 } from 'lucide-react';
import ImageUploadField from './ImageUploadField';
import { useAuth } from '../context/AuthContext';

const API_BASE = 'http://localhost:5143/api/properties';

export default function AddPropertyModal({ onClose, onCreated }) {
  const { user, authFetch } = useAuth();

  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    isNegotiable: false,
    city: '',
    district: '',
    propertyType: 0,
    listingType: 0,
    landSizePerches: '',
    bedrooms: '',
    bathrooms: '',
    imageUrls: [],
    sellerName: user ? `${user.firstName} ${user.lastName}`.trim() : '',
    sellerPhone: user?.phoneNumber || '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submittedProperty, setSubmittedProperty] = useState(null);

  // Prevent background scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const selectedType = Number(form.propertyType);
      const isLand = selectedType === 0;
      const isHouse = selectedType === 1;
      const isCommercial = selectedType === 2;

      const payload = {
        title: form.title,
        description: form.description,
        price: form.price === '' ? 0 : Number(form.price),
        isNegotiable: form.isNegotiable,
        city: form.city,
        district: form.district,
        propertyType: selectedType,
        listingType: Number(form.listingType),
        landSizePerches: form.landSizePerches === '' ? null : Number(form.landSizePerches),
        bedrooms: isHouse && form.bedrooms !== '' ? Number(form.bedrooms) : null,
        bathrooms: (isHouse || isCommercial) && form.bathrooms !== '' ? Number(form.bathrooms) : null,
        imageUrls: form.imageUrls,
        sellerName: form.sellerName,
        sellerPhone: form.sellerPhone,
      };

      const res = await authFetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || 'Failed to create property.');
      }
      const created = await res.json();
      setSubmittedProperty(created);
      onCreated?.(created);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent bg-gray-50';
  const labelCls = 'block text-xs font-semibold text-gray-600 mb-1';

  const selectedType = Number(form.propertyType);
  const isLand = selectedType === 0;
  const isHouse = selectedType === 1;
  const isCommercial = selectedType === 2;

  if (submittedProperty) {
    return createPortal(
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 text-center animate-in fade-in zoom-in duration-200 border border-gray-100 my-auto">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-100">
            <CheckCircle2 size={36} />
          </div>
          <h2 className="text-xl font-black text-gray-900">Listing Submitted!</h2>
          <p className="text-xs text-gray-500 mt-1">
            Your property has been linked to your account and submitted for moderation.
          </p>

          <div className="my-5 p-4 bg-gray-50 rounded-2xl border border-gray-100 text-left space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">Reference Code:</span>
              <span className="font-mono text-sm font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                {submittedProperty.referenceCode}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">Status:</span>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                <Clock size={12} /> Pending Review
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">Account:</span>
              <span className="text-xs font-bold text-gray-800 bg-white px-2 py-0.5 rounded border truncate max-w-[200px]">
                {user ? user.email : 'Active Account'}
              </span>
            </div>
          </div>

          <div className="bg-emerald-50/60 border border-emerald-100 p-3 rounded-xl text-left flex items-start gap-2.5 mb-5">
            <ShieldCheck size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              Our moderation team reviews listings for deed authenticity. Once verified (usually within 2-4 hours), your listing goes live. You can manage or edit this ad anytime from your Seller Dashboard ("My Ads").
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-sm transition-colors"
          >
            Done &amp; Close
          </button>
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Dialog */}
      <div
        className="relative bg-white w-full sm:max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto z-10 border border-gray-100 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b border-gray-100 z-10">
          <div>
            <h2 className="text-base font-extrabold text-gray-900">Post New Property</h2>
            <p className="text-xs text-gray-400">Fill in details to publish your listing across Sri Lanka</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Title */}
          <div>
            <label className={labelCls}>Property Title *</label>
            <input
              type="text"
              name="title"
              required
              value={form.title}
              onChange={handleChange}
              className={inputCls}
              placeholder="e.g. 3-Story Luxury House for Sale in Kandy"
            />
          </div>

          {/* Description */}
          <div>
            <label className={labelCls}>Description *</label>
            <textarea
              name="description"
              required
              rows={3}
              value={form.description}
              onChange={handleChange}
              className={`${inputCls} resize-none`}
              placeholder="Describe access road, deed, nearby landmarks, water & electricity..."
            />
          </div>

          {/* Listing Type & Property Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Listing Type *</label>
              <select
                name="listingType"
                value={form.listingType}
                onChange={handleChange}
                className={inputCls}
              >
                <option value={0}>For Sale</option>
                <option value={1}>For Rent</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Property Type *</label>
              <select
                name="propertyType"
                value={form.propertyType}
                onChange={handleChange}
                className={inputCls}
              >
                <option value={0}>Land</option>
                <option value={1}>House</option>
                <option value={2}>Commercial</option>
              </select>
            </div>
          </div>

          {/* Price & Negotiable */}
          <div>
            <label className={labelCls}>Price (LKR) *</label>
            <div className="flex gap-2">
              <input
                type="number"
                name="price"
                min={0}
                value={form.price}
                onChange={handleChange}
                className={inputCls}
                placeholder="e.g. 25000000"
              />
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-3 whitespace-nowrap">
                <input
                  type="checkbox"
                  name="isNegotiable"
                  checked={form.isNegotiable}
                  onChange={handleChange}
                  className="rounded text-emerald-600 focus:ring-emerald-400"
                />
                Negotiable
              </label>
            </div>
          </div>

          {/* City & District */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>City / Town *</label>
              <input
                type="text"
                name="city"
                required
                value={form.city}
                onChange={handleChange}
                className={inputCls}
                placeholder="e.g. Peradeniya"
              />
            </div>
            <div>
              <label className={labelCls}>District *</label>
              <input
                type="text"
                name="district"
                required
                value={form.district}
                onChange={handleChange}
                className={inputCls}
                placeholder="e.g. Kandy"
              />
            </div>
          </div>

          {/* Conditional Specs */}
          <div className="space-y-3 bg-gray-50/70 p-3.5 rounded-2xl border border-gray-100">
            <div>
              <label className={labelCls}>
                Land Size (Perches) {isLand && <span className="text-rose-500">*</span>}
              </label>
              <input
                type="number"
                name="landSizePerches"
                step="0.1"
                min={0}
                required={isLand}
                value={form.landSizePerches}
                onChange={handleChange}
                className={inputCls}
                placeholder="e.g. 15.5"
              />
            </div>

            {isHouse && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Bedrooms</label>
                  <input
                    type="number"
                    name="bedrooms"
                    min={0}
                    value={form.bedrooms}
                    onChange={handleChange}
                    className={inputCls}
                    placeholder="e.g. 4"
                  />
                </div>
                <div>
                  <label className={labelCls}>Bathrooms</label>
                  <input
                    type="number"
                    name="bathrooms"
                    min={0}
                    value={form.bathrooms}
                    onChange={handleChange}
                    className={inputCls}
                    placeholder="e.g. 2"
                  />
                </div>
              </div>
            )}

            {isCommercial && (
              <div>
                <label className={labelCls}>Bathrooms / Washrooms</label>
                <input
                  type="number"
                  name="bathrooms"
                  min={0}
                  value={form.bathrooms}
                  onChange={handleChange}
                  className={inputCls}
                  placeholder="e.g. 2"
                />
              </div>
            )}
          </div>

          {/* Image Upload Component */}
          <div>
            <label className={labelCls}>Photos (Max 10)</label>
            <ImageUploadField
              imageUrls={form.imageUrls}
              onChange={(urls) => setForm((prev) => ({ ...prev, imageUrls: urls }))}
            />
          </div>

          {/* Seller Details */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Seller Name *</label>
              <input
                type="text"
                name="sellerName"
                required
                value={form.sellerName}
                onChange={handleChange}
                className={inputCls}
                placeholder="e.g. Nawarathna"
              />
            </div>
            <div>
              <label className={labelCls}>Seller Phone *</label>
              <input
                type="tel"
                name="sellerPhone"
                required
                value={form.sellerPhone}
                onChange={handleChange}
                className={inputCls}
                placeholder="e.g. 077 123 4567"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 font-bold rounded-xl py-2.5 text-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold rounded-xl py-2.5 text-sm shadow-sm transition-colors"
            >
              {loading ? 'Submitting...' : 'Post Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
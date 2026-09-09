import { useState } from 'react';
import { X, Upload, User, Phone, KeyRound, Eye, EyeOff, CheckCircle2, Clock, ShieldCheck } from 'lucide-react';
import ImageUploadField from './ImageUploadField';

const API_BASE = 'http://localhost:5143/api/properties';

const defaultForm = {
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
  sellerName: '',
  sellerPhone: '',
  editPin: '',
};

export default function AddPropertyModal({ onClose, onCreated }) {
  const [form, setForm] = useState(defaultForm);
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submittedProperty, setSubmittedProperty] = useState(null);

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

    if (!/^\d{4}$/.test(form.editPin)) {
      setError('PIN must be exactly 4 digits.');
      setLoading(false);
      return;
    }

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
        editPin: form.editPin,
      };

      const res = await fetch(API_BASE, {
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

  const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent bg-gray-50';
  const labelCls = 'block text-xs font-semibold text-gray-600 mb-1';

  const selectedType = Number(form.propertyType);
  const isLand = selectedType === 0;
  const isHouse = selectedType === 1;
  const isCommercial = selectedType === 2;

  if (submittedProperty) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 text-center animate-in fade-in zoom-in duration-200 border border-gray-100">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={36} />
          </div>
          <h2 className="text-xl font-black text-gray-900">Listing Submitted!</h2>
          <p className="text-xs text-gray-500 mt-1">
            Your property has been received and is currently in pre-moderation.
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
              <span className="text-xs font-semibold text-gray-500">Your Secret PIN:</span>
              <span className="font-mono text-xs font-bold text-gray-800 bg-white px-2 py-0.5 rounded border">
                {form.editPin}
              </span>
            </div>
          </div>

          <div className="bg-emerald-50/60 border border-emerald-100 p-3 rounded-xl text-left flex items-start gap-2.5 mb-5">
            <ShieldCheck size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              Our moderation team reviews listings for accuracy and deed authenticity. Once verified (usually within 2-4 hours), your listing will go live across Sri Lanka.
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
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-3xl sm:rounded-t-2xl flex items-center justify-between px-5 py-4 border-b border-gray-100 z-10">
          <div>
            <h2 className="text-base font-bold text-gray-900">Add New Listing</h2>
            <p className="text-xs text-gray-400 mt-0.5">Fill in the property details below</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
          {/* Title */}
          <div>
            <label className={labelCls}>Property Title *</label>
            <input type="text" name="title" required value={form.title} onChange={handleChange}
              className={inputCls} placeholder="e.g. Prime Residential Land in Kandy" />
          </div>

          {/* Description */}
          <div>
            <label className={labelCls}>Description</label>
            <textarea name="description" rows={3} value={form.description} onChange={handleChange}
              className={inputCls} placeholder="Describe the property..." />
          </div>

          {/* Price + Negotiable */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Price (LKR)</label>
              <input type="number" name="price" value={form.price} onChange={handleChange}
                className={inputCls} placeholder="e.g. 18500000" />
            </div>
            <div className="flex flex-col justify-center">
              <label className={labelCls}>Negotiable?</label>
              <label className="flex items-center gap-2 cursor-pointer mt-1">
                <input type="checkbox" name="isNegotiable" checked={form.isNegotiable} onChange={handleChange}
                  className="w-4 h-4 rounded accent-emerald-600" />
                <span className="text-sm text-gray-600">Yes, negotiable</span>
              </label>
            </div>
          </div>

          {/* City + District */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>City *</label>
              <input type="text" name="city" required value={form.city} onChange={handleChange}
                className={inputCls} placeholder="e.g. Kandy" />
            </div>
            <div>
              <label className={labelCls}>District *</label>
              <input type="text" name="district" required value={form.district} onChange={handleChange}
                className={inputCls} placeholder="e.g. Central Province" />
            </div>
          </div>

          {/* Property Type + Listing Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Property Type</label>
              <select name="propertyType" value={form.propertyType} onChange={handleChange} className={inputCls}>
                <option value={0}>Land</option>
                <option value={1}>House</option>
                <option value={2}>Commercial</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Listing Type</label>
              <select name="listingType" value={form.listingType} onChange={handleChange} className={inputCls}>
                <option value={0}>For Sale</option>
                <option value={1}>For Rent</option>
              </select>
            </div>
          </div>

          {/* Specifications - Conditionally rendered based on Property Type */}
          <div
            className={`grid gap-3 transition-all duration-200 ${
              isLand ? 'grid-cols-1' : isCommercial ? 'grid-cols-2' : 'grid-cols-3'
            }`}
          >
            <div>
              <label className={labelCls}>
                {isCommercial ? 'Floor Area / Land (Perches)' : 'Land (Perches)'}
              </label>
              <input
                type="number"
                step="0.1"
                name="landSizePerches"
                value={form.landSizePerches}
                onChange={handleChange}
                className={inputCls}
                placeholder="e.g. 15.5"
              />
            </div>

            {isHouse && (
              <div className="transition-all duration-200">
                <label className={labelCls}>Bedrooms</label>
                <input
                  type="number"
                  name="bedrooms"
                  value={form.bedrooms}
                  onChange={handleChange}
                  className={inputCls}
                  placeholder="e.g. 3"
                />
              </div>
            )}

            {(isHouse || isCommercial) && (
              <div className="transition-all duration-200">
                <label className={labelCls}>Bathrooms</label>
                <input
                  type="number"
                  name="bathrooms"
                  value={form.bathrooms}
                  onChange={handleChange}
                  className={inputCls}
                  placeholder="e.g. 2"
                />
              </div>
            )}
          </div>

          {/* Property Photos (Multi-File Uploader) */}
          <ImageUploadField
            images={form.imageUrls}
            onChange={(imgs) => setForm((prev) => ({ ...prev, imageUrls: imgs }))}
          />

          {/* Seller Info */}
          <div className="bg-emerald-50 rounded-xl p-4 space-y-3">
            <p className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
              <User size={13} /> Seller Contact
            </p>
            <div>
              <label className={labelCls}>Seller Name *</label>
              <input type="text" name="sellerName" required value={form.sellerName} onChange={handleChange}
                className={inputCls} placeholder="e.g. Chaminda Senanayake" />
            </div>
            <div>
              <label className={labelCls}>Seller Phone *</label>
              <input type="tel" name="sellerPhone" required value={form.sellerPhone} onChange={handleChange}
                className={inputCls} placeholder="e.g. +94 77 123 4567" />
            </div>
          </div>

          {/* 4-Digit Secret PIN */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <KeyRound size={14} className="text-amber-600" />
                Listing 4-Digit Secret PIN *
              </label>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded">
                Required
              </span>
            </div>
            <div className="relative">
              <input
                type={showPin ? "text" : "password"}
                name="editPin"
                required
                maxLength={4}
                pattern="\d{4}"
                inputMode="numeric"
                value={form.editPin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setForm((prev) => ({ ...prev, editPin: val }));
                }}
                className={`${inputCls} font-mono tracking-widest text-base pr-10 bg-white`}
                placeholder="4-digit PIN (e.g. 1234)"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-xs text-amber-800 leading-snug">
              Remember this 4-digit PIN. You will need it to edit or delete this listing later.
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 font-semibold rounded-xl py-2.5 text-sm hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold rounded-xl py-2.5 text-sm shadow-sm transition-colors">
              {loading ? 'Saving...' : 'Post Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
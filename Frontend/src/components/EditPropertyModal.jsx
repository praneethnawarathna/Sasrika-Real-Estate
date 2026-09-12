import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, User, Edit3, Check } from 'lucide-react';
import ImageUploadField from './ImageUploadField';
import { useAuth } from '../context/AuthContext';

const API_BASE = 'http://localhost:5143/api/properties';

export default function EditPropertyModal({
  property,
  onClose,
  onUpdated,
}) {
  const { authFetch } = useAuth();

  const [form, setForm] = useState({
    title: property.title || '',
    description: property.description || '',
    price: property.price != null ? property.price : '',
    isNegotiable: !!property.isNegotiable,
    city: property.city || '',
    district: property.district || '',
    propertyType: property.propertyType ?? 0,
    listingType: property.listingType ?? 0,
    landSizePerches: property.landSizePerches ?? '',
    bedrooms: property.bedrooms ?? '',
    bathrooms: property.bathrooms ?? '',
    imageUrls: Array.isArray(property.imageUrls) ? property.imageUrls : [],
    sellerName: property.sellerName || '',
    sellerPhone: property.sellerPhone || '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Lock background scroll
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
        imageUrls: form.imageUrls.length > 0 ? form.imageUrls : property.imageUrls || [],
        sellerName: form.sellerName,
        sellerPhone: form.sellerPhone,
      };

      const res = await authFetch(`${API_BASE}/${property.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || 'Failed to update property.');
      }

      const updated = await res.json();
      onUpdated(updated);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save changes.');
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
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Edit3 size={16} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-gray-900">Edit Listing</h2>
              <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {property.referenceCode}
              </span>
            </div>
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
                />
              </div>
            )}
          </div>

          {/* Photos */}
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
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

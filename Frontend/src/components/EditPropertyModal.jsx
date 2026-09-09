import { useState } from 'react';
import { X, User, Edit3, Check } from 'lucide-react';
import ImageUploadField from './ImageUploadField';

const API_BASE = 'http://localhost:5143/api/properties';

export default function EditPropertyModal({
  property,
  verifiedPin,
  onClose,
  onUpdated,
}) {
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
        imageUrls: form.imageUrls.length > 0 ? form.imageUrls : (property.imageUrls || []),
        sellerName: form.sellerName,
        sellerPhone: form.sellerPhone,
        editPin: verifiedPin,
      };

      const res = await fetch(`${API_BASE}/${property.id}`, {
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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-3xl sm:rounded-t-2xl flex items-center justify-between px-5 py-4 border-b border-gray-100 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Edit3 size={16} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Edit Listing</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Ref: <span className="font-mono font-semibold text-gray-600">{property.referenceCode}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
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
              placeholder="e.g. Prime Residential Land in Kandy"
            />
          </div>

          {/* Description */}
          <div>
            <label className={labelCls}>Description</label>
            <textarea
              name="description"
              rows={3}
              value={form.description}
              onChange={handleChange}
              className={inputCls}
              placeholder="Describe the property..."
            />
          </div>

          {/* Price + Negotiable */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Price (LKR)</label>
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                className={inputCls}
                placeholder="e.g. 18500000"
              />
            </div>
            <div className="flex flex-col justify-center">
              <label className={labelCls}>Negotiable?</label>
              <label className="flex items-center gap-2 cursor-pointer mt-1">
                <input
                  type="checkbox"
                  name="isNegotiable"
                  checked={form.isNegotiable}
                  onChange={handleChange}
                  className="w-4 h-4 rounded accent-emerald-600"
                />
                <span className="text-sm text-gray-600">Yes, negotiable</span>
              </label>
            </div>
          </div>

          {/* City + District */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>City *</label>
              <input
                type="text"
                name="city"
                required
                value={form.city}
                onChange={handleChange}
                className={inputCls}
                placeholder="e.g. Kandy"
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
                placeholder="e.g. Central Province"
              />
            </div>
          </div>

          {/* Property Type + Listing Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Property Type</label>
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
            <div>
              <label className={labelCls}>Listing Type</label>
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
              <input
                type="text"
                name="sellerName"
                required
                value={form.sellerName}
                onChange={handleChange}
                className={inputCls}
                placeholder="e.g. Chaminda Senanayake"
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
                placeholder="e.g. +94 77 123 4567"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 font-semibold rounded-xl py-2.5 text-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold rounded-xl py-2.5 text-sm shadow-sm transition-colors flex items-center justify-center gap-1.5"
            >
              {loading ? (
                'Saving...'
              ) : (
                <>
                  <Check size={16} /> Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

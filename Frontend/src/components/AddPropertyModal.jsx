import { useState } from 'react';
import { X, Upload, User, Phone } from 'lucide-react';

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
  imageUrlsText: '',
  sellerName: '',
  sellerPhone: '',
};

export default function AddPropertyModal({ onClose, onCreated }) {
  const [form, setForm] = useState(defaultForm);
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
      const imageUrls = form.imageUrlsText
        .split('\n')
        .map((u) => u.trim())
        .filter(Boolean);

      const payload = {
        title: form.title,
        description: form.description,
        price: form.price === '' ? 0 : Number(form.price),
        isNegotiable: form.isNegotiable,
        city: form.city,
        district: form.district,
        propertyType: Number(form.propertyType),
        listingType: Number(form.listingType),
        landSizePerches: form.landSizePerches === '' ? null : Number(form.landSizePerches),
        bedrooms: form.bedrooms === '' ? null : Number(form.bedrooms),
        bathrooms: form.bathrooms === '' ? null : Number(form.bathrooms),
        imageUrls,
        sellerName: form.sellerName,
        sellerPhone: form.sellerPhone,
      };

      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to create property.');
      const created = await res.json();
      onCreated(created);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent bg-gray-50';
  const labelCls = 'block text-xs font-semibold text-gray-600 mb-1';

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

          {/* Optional fields */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Land (Perches)</label>
              <input type="number" step="0.1" name="landSizePerches" value={form.landSizePerches} onChange={handleChange}
                className={inputCls} placeholder="e.g. 15.5" />
            </div>
            <div>
              <label className={labelCls}>Bedrooms</label>
              <input type="number" name="bedrooms" value={form.bedrooms} onChange={handleChange}
                className={inputCls} placeholder="e.g. 3" />
            </div>
            <div>
              <label className={labelCls}>Bathrooms</label>
              <input type="number" name="bathrooms" value={form.bathrooms} onChange={handleChange}
                className={inputCls} placeholder="e.g. 2" />
            </div>
          </div>

          {/* Image URLs */}
          <div>
            <label className={labelCls}>Image URLs (one per line)</label>
            <textarea name="imageUrlsText" rows={3} value={form.imageUrlsText} onChange={handleChange}
              className={inputCls} placeholder={"https://example.com/image1.jpg\nhttps://example.com/image2.jpg"} />
          </div>

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
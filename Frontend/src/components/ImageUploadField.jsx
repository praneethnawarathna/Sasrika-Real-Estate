import { useState, useRef } from 'react';
import {
  UploadCloud, X, Star, Link as LinkIcon, AlertCircle, Plus, Loader2, ImageIcon,
} from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';

const API_BASE = API_ENDPOINTS.upload;
const MAX_PHOTOS = 10;
const MAX_FILE_MB = 15;

export default function ImageUploadField({ imageUrls = [], onChange }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [error, setError] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  const fileInputRef = useRef(null);

  const handleFiles = async (rawFiles) => {
    if (!rawFiles || rawFiles.length === 0) return;

    setError('');

    const remaining = MAX_PHOTOS - imageUrls.length;
    if (remaining <= 0) {
      setError(`You've reached the maximum of ${MAX_PHOTOS} photos.`);
      return;
    }

    // Slice to whatever slots remain
    const files = Array.from(rawFiles).slice(0, remaining);
    const skipped = rawFiles.length - files.length;

    // Client-side size validation
    for (const file of files) {
      if (file.size > MAX_FILE_MB * 1024 * 1024) {
        setError(`"${file.name}" exceeds the ${MAX_FILE_MB} MB limit.`);
        return;
      }
    }

    setUploading(true);
    setUploadProgress(`Uploading ${files.length} photo${files.length > 1 ? 's' : ''}…`);

    try {
      const formData = new FormData();
      for (const file of files) {
        formData.append('files', file);
      }

      const res = await fetch(API_BASE, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || 'Failed to upload images.');
      }

      const data = await res.json();
      if (data.urls && data.urls.length > 0) {
        onChange([...imageUrls, ...data.urls]);
      }

      if (skipped > 0) {
        setError(`${skipped} photo${skipped > 1 ? 's were' : ' was'} skipped — maximum of ${MAX_PHOTOS} reached.`);
      }
    } catch (err) {
      setError(err.message || 'Error uploading photos. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    onChange(imageUrls.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSetCover = (indexToCover) => {
    if (indexToCover === 0) return;
    const target = imageUrls[indexToCover];
    const rest = imageUrls.filter((_, idx) => idx !== indexToCover);
    onChange([target, ...rest]);
  };

  const handleAddUrl = (e) => {
    e.preventDefault();
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (imageUrls.length >= MAX_PHOTOS) {
      setError(`Maximum of ${MAX_PHOTOS} photos allowed.`);
      return;
    }
    onChange([...imageUrls, trimmed]);
    setUrlInput('');
  };

  const atMax = imageUrls.length >= MAX_PHOTOS;

  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-gray-700">
          Property Photos{' '}
          <span
            className={`font-bold tabular-nums ${
              atMax ? 'text-rose-500' : 'text-emerald-600'
            }`}
          >
            ({imageUrls.length}/{MAX_PHOTOS})
          </span>
        </label>
        <button
          type="button"
          onClick={() => setShowUrlInput((v) => !v)}
          className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1 transition-colors"
        >
          <LinkIcon size={12} />
          {showUrlInput ? 'Hide URL input' : '+ Add by URL'}
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/png, image/jpeg, image/jpg, image/webp, image/gif, image/avif"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
        }}
      />

      {/* Drag & Drop Upload Zone */}
      {!atMax && (
        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-emerald-500 bg-emerald-50/70 scale-[1.01]'
              : 'border-gray-200 hover:border-emerald-400 bg-gray-50/60 hover:bg-emerald-50/30'
          } ${uploading ? 'pointer-events-none opacity-70' : ''}`}
        >
          <div className="flex flex-col items-center justify-center gap-2">
            {uploading ? (
              <>
                <Loader2 size={28} className="text-emerald-600 animate-spin" />
                <p className="text-sm font-bold text-gray-800">{uploadProgress}</p>
                <p className="text-xs text-gray-400">Processing images via Cloudinary…</p>
              </>
            ) : (
              <>
                <div className="w-11 h-11 rounded-2xl bg-emerald-100/70 text-emerald-600 flex items-center justify-center shadow-xs">
                  <UploadCloud size={22} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">
                    Click to select photos{' '}
                    <span className="text-gray-400 font-normal">or drag &amp; drop</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Up to {MAX_PHOTOS - imageUrls.length} more · PNG, JPG, WEBP up to {MAX_FILE_MB} MB each
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs mt-1 transition-colors">
                  <Plus size={14} /> Browse Device Files
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* At-max banner */}
      {atMax && !uploading && (
        <div className="flex items-center gap-2 px-3.5 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 font-semibold">
          <ImageIcon size={14} className="text-amber-500 flex-shrink-0" />
          Maximum of {MAX_PHOTOS} photos reached. Remove a photo to add more.
        </div>
      )}

      {/* Optional URL input */}
      {showUrlInput && !atMax && (
        <div className="flex gap-2 p-2.5 bg-gray-50 rounded-xl border border-gray-200">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Paste image URL (https://…)"
            className="flex-1 px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
          <button
            type="button"
            onClick={handleAddUrl}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors"
          >
            Add
          </button>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
          <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Thumbnail preview grid */}
      {imageUrls.length > 0 && (
        <div className="space-y-2 pt-1">
          <p className="text-[11px] font-semibold text-gray-500 flex items-center justify-between">
            <span>Uploaded Photos ({imageUrls.length}/{MAX_PHOTOS})</span>
            <span className="text-gray-400 font-normal text-[10px]">
              First photo is the listing cover
            </span>
          </p>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-64 overflow-y-auto p-1">
            {imageUrls.map((url, index) => (
              <div
                key={`${url}-${index}`}
                className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shadow-xs"
              >
                <img
                  src={url}
                  alt={`Listing photo ${index + 1}`}
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                  onError={(e) => {
                    e.target.src =
                      'https://placehold.co/400x300/e2e8f0/94a3b8?text=Broken';
                  }}
                />

                {/* Cover / Set Cover badge */}
                {index === 0 ? (
                  <span className="absolute top-1.5 left-1.5 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-xs flex items-center gap-0.5">
                    <Star size={9} className="fill-white" /> Cover
                  </span>
                ) : (
                  <button
                    type="button"
                    title="Set as cover photo"
                    onClick={() => handleSetCover(index)}
                    className="absolute top-1.5 left-1.5 opacity-0 group-hover:opacity-100 bg-black/60 hover:bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-xs transition-all flex items-center gap-0.5"
                  >
                    Set Cover
                  </button>
                )}

                {/* Remove button */}
                <button
                  type="button"
                  title="Remove photo"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 hover:bg-rose-600 text-white flex items-center justify-center transition-colors shadow-xs opacity-0 group-hover:opacity-100"
                >
                  <X size={12} />
                </button>

                {/* Index badge */}
                <span className="absolute bottom-1 right-1 bg-black/50 text-white text-[9px] font-bold px-1 rounded">
                  {index + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useRef } from 'react';
import { UploadCloud, X, Star, Link as LinkIcon, AlertCircle, Plus, Loader2 } from 'lucide-react';

const API_BASE = 'http://localhost:5143/api/upload/images';

export default function ImageUploadField({ images = [], onChange }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [error, setError] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  const fileInputRef = useRef(null);

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;

    setError('');
    setUploading(true);
    setUploadProgress(`Uploading ${files.length} photo${files.length > 1 ? 's' : ''}...`);

    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
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
        onChange([...images, ...data.urls]);
      }
    } catch (err) {
      setError(err.message || 'Error uploading photos. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleRemoveImage = (indexToRemove) => {
    const updated = images.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);
  };

  const handleSetCover = (indexToCover) => {
    if (indexToCover === 0) return;
    const target = images[indexToCover];
    const rest = images.filter((_, idx) => idx !== indexToCover);
    onChange([target, ...rest]);
  };

  const handleAddUrl = (e) => {
    e.preventDefault();
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    onChange([...images, trimmed]);
    setUrlInput('');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-gray-700">
          Property Photos ({images.length})
        </label>
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
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
          if (e.target.files) {
            handleFiles(Array.from(e.target.files));
          }
        }}
      />

      {/* Drag & Drop Upload Zone */}
      <div
        onClick={() => !uploading && fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-emerald-500 bg-emerald-50/70 scale-[1.01]'
            : 'border-gray-200 hover:border-emerald-400 bg-gray-50/60 hover:bg-emerald-50/30'
        } ${uploading ? 'pointer-events-none opacity-80' : ''}`}
      >
        <div className="flex flex-col items-center justify-center gap-2">
          {uploading ? (
            <>
              <Loader2 size={28} className="text-emerald-600 animate-spin" />
              <p className="text-sm font-bold text-gray-800">{uploadProgress}</p>
              <p className="text-xs text-gray-400">Processing high-quality images...</p>
            </>
          ) : (
            <>
              <div className="w-11 h-11 rounded-2xl bg-emerald-100/70 text-emerald-600 flex items-center justify-center shadow-xs">
                <UploadCloud size={22} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">
                  Click to select photos <span className="text-gray-400 font-normal">or drag &amp; drop</span>
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Select multiple photos (PNG, JPG, WEBP up to 15MB each)
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs mt-1 transition-colors">
                <Plus size={14} /> Browse Device Files
              </span>
            </>
          )}
        </div>
      </div>

      {/* Optional URL input box */}
      {showUrlInput && (
        <div className="flex gap-2 p-2.5 bg-gray-50 rounded-xl border border-gray-200">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Paste image web link (https://...)"
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

      {/* Thumbnail Grid */}
      {images.length > 0 && (
        <div className="space-y-2 pt-1">
          <p className="text-[11px] font-semibold text-gray-500 flex items-center justify-between">
            <span>Uploaded Photos ({images.length})</span>
            <span className="text-gray-400 font-normal text-[10px]">First photo will be the main listing cover</span>
          </p>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto p-1 scrollbar-thin">
            {images.map((url, index) => (
              <div
                key={`${url}-${index}`}
                className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shadow-xs"
              >
                <img
                  src={url}
                  alt={`Listing photo ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://placehold.co/400x300/e2e8f0/94a3b8?text=Broken+Image';
                  }}
                />

                {/* Cover badge */}
                {index === 0 ? (
                  <span className="absolute top-1.5 left-1.5 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-xs flex items-center gap-0.5">
                    <Star size={10} className="fill-white" /> Cover
                  </span>
                ) : (
                  <button
                    type="button"
                    title="Set as Cover photo"
                    onClick={() => handleSetCover(index)}
                    className="absolute top-1.5 left-1.5 opacity-0 group-hover:opacity-100 bg-black/60 hover:bg-black/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-xs transition-opacity flex items-center gap-0.5"
                  >
                    Set Cover
                  </button>
                )}

                {/* Remove button */}
                <button
                  type="button"
                  title="Remove photo"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 hover:bg-rose-600 text-white flex items-center justify-center transition-colors shadow-xs"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

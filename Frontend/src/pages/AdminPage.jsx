import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield, Key, Lock, LogOut, RefreshCw, CheckCircle2, XCircle,
  Clock, AlertTriangle, Search, Eye, Trash2, Check, X,
  MapPin, Phone, Home, Tag, Sparkles, ExternalLink, Filter
} from 'lucide-react';
import WhatsAppIcon from '../components/WhatsAppIcon';
import { formatDisplayPhone, getWhatsAppUrl } from '../utils/phoneUtils';

const API_ADMIN = 'http://localhost:5143/api/admin';

const PROPERTY_TYPE_LABELS = ['Land', 'House', 'Commercial'];
const LISTING_TYPE_LABELS = ['For Sale', 'For Rent'];

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState(
    () => sessionStorage.getItem('sasrika_admin_key') || ''
  );
  const [keyInput, setKeyInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  const [verifying, setVerifying] = useState(false);

  // Dashboard Data
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dataError, setDataError] = useState('');

  // Filtering & Search
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'approved' | 'rejected' | 'all'
  const [searchTerm, setSearchTerm] = useState('');

  // Modals & Action States
  const [previewProperty, setPreviewProperty] = useState(null);
  const [rejectModalProperty, setRejectModalProperty] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [deleteModalProperty, setDeleteModalProperty] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionToast, setActionToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setActionToast({ message, type });
    setTimeout(() => setActionToast(null), 4000);
  };

  // Verify Admin Key
  const verifyKey = async (keyToTest) => {
    if (!keyToTest?.trim()) {
      setAuthError('Please enter the Admin Master Key.');
      return false;
    }
    setVerifying(true);
    setAuthError('');
    try {
      const res = await fetch(`${API_ADMIN}/verify`, {
        headers: { 'X-Admin-Key': keyToTest.trim() }
      });
      if (!res.ok) {
        throw new Error('Invalid Admin Master Key. Access denied.');
      }
      sessionStorage.setItem('sasrika_admin_key', keyToTest.trim());
      setAdminKey(keyToTest.trim());
      setIsAuthenticated(true);
      return true;
    } catch (err) {
      setAuthError(err.message || 'Authentication failed.');
      setIsAuthenticated(false);
      return false;
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    if (adminKey) {
      verifyKey(adminKey);
    }
  }, []);

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    verifyKey(keyInput);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('sasrika_admin_key');
    setAdminKey('');
    setKeyInput('');
    setIsAuthenticated(false);
    setProperties([]);
  };

  // Fetch Stats & Properties
  const fetchData = async () => {
    if (!adminKey) return;
    setLoading(true);
    setDataError('');
    try {
      const headers = { 'X-Admin-Key': adminKey };

      // 1. Fetch Stats
      const statsRes = await fetch(`${API_ADMIN}/stats`, { headers });
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }

      // 2. Fetch Properties
      const params = new URLSearchParams();
      if (activeTab !== 'all') params.append('status', activeTab);
      if (searchTerm.trim()) params.append('searchTerm', searchTerm.trim());

      const qs = params.toString();
      const propsRes = await fetch(`${API_ADMIN}/properties${qs ? `?${qs}` : ''}`, { headers });
      if (!propsRes.ok) {
        throw new Error('Failed to fetch properties.');
      }
      setProperties(await propsRes.json());
    } catch (err) {
      setDataError(err.message || 'Error loading dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, activeTab, searchTerm]);

  // Actions
  const handleApprove = async (id, title) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_ADMIN}/properties/${id}/approve`, {
        method: 'POST',
        headers: { 'X-Admin-Key': adminKey }
      });
      if (!res.ok) throw new Error('Failed to approve property.');
      showToast(`Listing "${title}" is now APPROVED and live on the public marketplace!`, 'success');
      fetchData();
      if (previewProperty?.id === id) setPreviewProperty(null);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectModalProperty) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_ADMIN}/properties/${rejectModalProperty.id}/reject`, {
        method: 'POST',
        headers: {
          'X-Admin-Key': adminKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: rejectionReason.trim() })
      });
      if (!res.ok) throw new Error('Failed to reject property.');
      showToast(`Listing "${rejectModalProperty.title}" has been marked REJECTED.`, 'info');
      setRejectModalProperty(null);
      setRejectionReason('');
      fetchData();
      if (previewProperty?.id === rejectModalProperty.id) setPreviewProperty(null);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModalProperty) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_ADMIN}/properties/${deleteModalProperty.id}`, {
        method: 'DELETE',
        headers: { 'X-Admin-Key': adminKey }
      });
      if (!res.ok) throw new Error('Failed to delete property.');
      showToast(`Listing "${deleteModalProperty.title}" was permanently deleted.`, 'info');
      setDeleteModalProperty(null);
      fetchData();
      if (previewProperty?.id === deleteModalProperty.id) setPreviewProperty(null);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Render Login Screen if not authenticated ──
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl relative z-10">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4 shadow-inner">
              <Shield size={28} />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Sasrika <span className="text-emerald-400">Admin Console</span>
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Enter your Master Key to manage moderation &amp; approval workflows.
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                Admin Master Key
              </label>
              <div className="relative">
                <Key size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="password"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="Enter Master Key (e.g. Sasrika@Admin2026)"
                  autoFocus
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/80 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {authError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs font-semibold text-rose-400 flex items-center gap-2">
                <AlertTriangle size={14} className="flex-shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={verifying}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-900/40 transition-all flex items-center justify-center gap-2"
            >
              {verifying ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Lock size={15} />
                  <span>Authenticate &amp; Access</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-800 text-center">
            <Link
              to="/"
              className="text-xs font-semibold text-gray-400 hover:text-emerald-400 transition-colors"
            >
              ← Return to Marketplace Public Site
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Render Authenticated Dashboard ──
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      <div>
        {/* Top Admin Navbar */}
        <header className="sticky top-0 z-40 bg-gray-900 text-white border-b border-gray-800 shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <Link to="/" className="flex items-center gap-2">
                  <img src="/logo.svg" alt="Sasrika" className="h-8 w-auto" />
                  <span className="font-black text-lg text-white">
                    Sasrika<span className="text-emerald-400">.</span>
                  </span>
                </Link>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                  <Shield size={12} />
                  Moderation Console
                </span>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={fetchData}
                  disabled={loading}
                  title="Refresh listings"
                  className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                >
                  <RefreshCw size={16} className={loading ? 'animate-spin text-emerald-400' : ''} />
                </button>
                <Link
                  to="/"
                  className="hidden md:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-gray-300 transition-colors"
                >
                  <span>Public Marketplace</span>
                  <ExternalLink size={12} />
                </Link>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 text-xs font-bold transition-colors"
                >
                  <LogOut size={13} />
                  <span className="hidden sm:inline">Lock / Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Action Toast */}
        {actionToast && (
          <div className="fixed top-20 right-4 sm:right-8 z-50 animate-in slide-in-from-top-4 fade-in duration-200">
            <div
              className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-xs font-bold ${actionToast.type === 'error'
                ? 'bg-rose-600 text-white'
                : 'bg-emerald-600 text-white'
                }`}
            >
              {actionToast.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
              <span>{actionToast.message}</span>
            </div>
          </div>
        )}

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Metrics Overview Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Total */}
            <div
              onClick={() => setActiveTab('all')}
              className={`cursor-pointer rounded-2xl p-5 border transition-all ${activeTab === 'all'
                ? 'bg-white border-gray-900 shadow-md ring-2 ring-gray-900'
                : 'bg-white border-gray-100 shadow-sm hover:shadow-md'
                }`}
            >
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Total Submissions
              </p>
              <p className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">
                {stats.total}
              </p>
            </div>

            {/* Pending */}
            <div
              onClick={() => setActiveTab('pending')}
              className={`cursor-pointer rounded-2xl p-5 border transition-all relative overflow-hidden ${activeTab === 'pending'
                ? 'bg-amber-50/80 border-amber-500 shadow-md ring-2 ring-amber-500'
                : 'bg-white border-gray-100 shadow-sm hover:shadow-md'
                }`}
            >
              {stats.pending > 0 && (
                <span className="absolute top-3 right-3 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                </span>
              )}
              <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1">
                <Clock size={12} />
                Pending Approval
              </p>
              <p className="text-2xl sm:text-3xl font-black text-amber-600 mt-1">
                {stats.pending}
              </p>
            </div>

            {/* Approved */}
            <div
              onClick={() => setActiveTab('approved')}
              className={`cursor-pointer rounded-2xl p-5 border transition-all ${activeTab === 'approved'
                ? 'bg-emerald-50/80 border-emerald-600 shadow-md ring-2 ring-emerald-600'
                : 'bg-white border-gray-100 shadow-sm hover:shadow-md'
                }`}
            >
              <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 size={12} />
                Live / Approved
              </p>
              <p className="text-2xl sm:text-3xl font-black text-emerald-700 mt-1">
                {stats.approved}
              </p>
            </div>

            {/* Rejected */}
            <div
              onClick={() => setActiveTab('rejected')}
              className={`cursor-pointer rounded-2xl p-5 border transition-all ${activeTab === 'rejected'
                ? 'bg-rose-50/80 border-rose-500 shadow-md ring-2 ring-rose-500'
                : 'bg-white border-gray-100 shadow-sm hover:shadow-md'
                }`}
            >
              <p className="text-[11px] font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1">
                <XCircle size={12} />
                Rejected
              </p>
              <p className="text-2xl sm:text-3xl font-black text-rose-600 mt-1">
                {stats.rejected}
              </p>
            </div>
          </div>

          {/* Controls Bar: Tabs & Search */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              {[
                { id: 'pending', label: 'Pending Review', count: stats.pending, alert: stats.pending > 0 },
                { id: 'approved', label: 'Approved', count: stats.approved },
                { id: 'rejected', label: 'Rejected', count: stats.rejected },
                { id: 'all', label: 'All Submissions', count: stats.total },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${activeTab === tab.id
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-600'
                    }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === tab.id
                      ? 'bg-white/20 text-white'
                      : tab.alert
                        ? 'bg-amber-100 text-amber-800 font-black'
                        : 'bg-gray-200 text-gray-600'
                      }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Keyword / Reference Search */}
            <div className="relative min-w-[260px]">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search title, Ref #, seller, phone..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Error Message */}
          {dataError && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-2xl mb-6">
              {dataError}
            </div>
          )}

          {/* Properties Moderation Table */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            {loading ? (
              <div className="py-24 text-center">
                <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs text-gray-400 font-semibold">Loading listings...</p>
              </div>
            ) : properties.length === 0 ? (
              <div className="py-20 text-center px-4">
                <div className="text-4xl mb-3">📋</div>
                <h3 className="text-base font-bold text-gray-800">No listings in this view</h3>
                <p className="text-xs text-gray-400 max-w-xs mx-auto mt-1">
                  {activeTab === 'pending'
                    ? 'Great news! All submitted properties have been moderated.'
                    : 'No properties matched your current filter criteria.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {properties.map((p) => {
                  const isPending = p.status === 0;
                  const isApproved = p.status === 1;
                  const isRejected = p.status === 2;
                  const whatsAppUrl = getWhatsAppUrl(p.sellerPhone, p.title, p.price, p.isNegotiable);
                  const displayPhone = formatDisplayPhone(p.sellerPhone);

                  return (
                    <div
                      key={p.id}
                      className={`p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors ${isPending ? 'bg-amber-50/30 hover:bg-amber-50/50' : 'hover:bg-gray-50/70'
                        }`}
                    >
                      {/* Left: Thumbnail + Core Specs */}
                      <div className="flex items-start gap-3.5 min-w-0 flex-1">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0 relative border border-gray-200">
                          <img
                            src={p.imageUrls?.[0] || 'https://placehold.co/200x200'}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = 'https://placehold.co/200x200?text=No+Img';
                            }}
                          />
                          {p.imageUrls?.length > 1 && (
                            <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.2 rounded-md">
                              +{p.imageUrls.length}
                            </span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1 space-y-1">
                          {/* Reference Code + Status Badges */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md">
                              {p.referenceCode || '#SR-NEW'}
                            </span>

                            {isPending && (
                              <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full">
                                <Clock size={11} /> Pending Review
                              </span>
                            )}
                            {isApproved && (
                              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full">
                                <CheckCircle2 size={11} /> Approved
                              </span>
                            )}
                            {isRejected && (
                              <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full">
                                <XCircle size={11} /> Rejected
                              </span>
                            )}

                            <span className="text-[11px] font-bold text-gray-500">
                              {LISTING_TYPE_LABELS[p.listingType]} • {PROPERTY_TYPE_LABELS[p.propertyType]}
                            </span>
                          </div>

                          {/* Title */}
                          <h4 className="font-bold text-gray-900 text-sm sm:text-base leading-snug line-clamp-1">
                            {p.title}
                          </h4>

                          {/* Location & Price */}
                          <div className="flex items-center gap-3 text-xs flex-wrap">
                            <span className="flex items-center gap-1 text-gray-500 font-medium">
                              <MapPin size={12} className="text-emerald-500" />
                              {p.city}, {p.district}
                            </span>

                            <span className="font-black text-emerald-700">
                              {p.price > 0
                                ? `LKR ${Number(p.price).toLocaleString()}`
                                : 'Negotiable'}
                            </span>

                            {p.landSizePerches != null && (
                              <span className="text-gray-400">
                                • {p.landSizePerches} Perches
                              </span>
                            )}
                          </div>

                          {/* Rejection Note (if any) */}
                          {isRejected && p.rejectionReason && (
                            <p className="text-xs text-rose-600 bg-rose-50/80 px-2.5 py-1 rounded-lg border border-rose-100 mt-1">
                              <strong>Rejection reason:</strong> {p.rejectionReason}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Middle: Seller Information */}
                      <div className="flex flex-col justify-center min-w-[200px] border-t lg:border-t-0 lg:border-l border-gray-100 pt-2 lg:pt-0 lg:pl-5 space-y-1 text-xs">
                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                          Seller Info
                        </p>
                        <p className="font-bold text-gray-800">{p.sellerName || 'Direct Owner'}</p>
                        <div className="flex items-center gap-2">
                          <a
                            href={`tel:${p.sellerPhone}`}
                            className="font-mono text-gray-600 hover:text-emerald-600 font-semibold"
                          >
                            {displayPhone || p.sellerPhone}
                          </a>
                          {p.sellerPhone && (
                            <a
                              href={whatsAppUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Chat on WhatsApp"
                              className="p-1 rounded-md bg-[#25D366] text-white hover:bg-[#20bd5a]"
                            >
                              <WhatsAppIcon size={12} />
                            </a>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-400">
                          Submitted: {new Date(p.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Right: Moderation Action Buttons */}
                      <div className="flex items-center gap-2 flex-wrap justify-end pt-2 lg:pt-0 border-t lg:border-t-0 border-gray-100">
                        {/* Preview */}
                        <button
                          type="button"
                          onClick={() => setPreviewProperty(p)}
                          className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors flex items-center gap-1"
                        >
                          <Eye size={13} />
                          <span>Preview</span>
                        </button>

                        {/* Approve Button */}
                        {!isApproved && (
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleApprove(p.id, p.title)}
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-1"
                          >
                            <Check size={13} />
                            <span>Approve</span>
                          </button>
                        )}

                        {/* Reject Button */}
                        {!isRejected && (
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => {
                              setRejectModalProperty(p);
                              setRejectionReason('');
                            }}
                            className="px-3 py-2 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-bold transition-colors flex items-center gap-1"
                          >
                            <X size={13} />
                            <span>Reject</span>
                          </button>
                        )}

                        {/* Delete Button */}
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => setDeleteModalProperty(p)}
                          className="p-2 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete listing permanently"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ── PREVIEW MODAL ── */}
      {previewProperty && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-gray-100 animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                  {previewProperty.referenceCode}
                </span>
                <h3 className="text-base font-black text-gray-900 mt-1">Listing Preview &amp; Audit</h3>
              </div>
              <button
                onClick={() => setPreviewProperty(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600"
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-sm">
              {/* Image gallery */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {previewProperty.imageUrls?.map((url, i) => (
                  <div key={i} className="aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>

              <div>
                <h4 className="text-lg font-bold text-gray-900">{previewProperty.title}</h4>
                <p className="text-emerald-700 font-black text-base mt-1">
                  {previewProperty.price > 0 ? `LKR ${Number(previewProperty.price).toLocaleString()}` : 'Negotiable'}
                  {previewProperty.isNegotiable && ' (Negotiable)'}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-2xl text-xs">
                <div>
                  <p className="text-gray-400 font-bold uppercase text-[10px]">Type</p>
                  <p className="font-bold text-gray-800">{PROPERTY_TYPE_LABELS[previewProperty.propertyType]}</p>
                </div>
                <div>
                  <p className="text-gray-400 font-bold uppercase text-[10px]">Listing</p>
                  <p className="font-bold text-gray-800">{LISTING_TYPE_LABELS[previewProperty.listingType]}</p>
                </div>
                <div>
                  <p className="text-gray-400 font-bold uppercase text-[10px]">Location</p>
                  <p className="font-bold text-gray-800">{previewProperty.city}, {previewProperty.district}</p>
                </div>
                <div>
                  <p className="text-gray-400 font-bold uppercase text-[10px]">Extent</p>
                  <p className="font-bold text-gray-800">{previewProperty.landSizePerches ?? 'N/A'} Perches</p>
                </div>
              </div>

              <div>
                <h5 className="font-bold text-gray-800 text-xs uppercase tracking-wider mb-1">Description</h5>
                <p className="text-xs text-gray-600 whitespace-pre-line leading-relaxed bg-gray-50 p-3 rounded-xl">
                  {previewProperty.description}
                </p>
              </div>

              <div className="border-t border-gray-100 pt-4 flex items-center justify-between text-xs">
                <div>
                  <p className="text-gray-400 text-[10px] uppercase font-bold">Seller</p>
                  <p className="font-bold text-gray-800">{previewProperty.sellerName} ({previewProperty.sellerPhone})</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-[10px] uppercase font-bold">Status</p>
                  <p className="font-bold text-emerald-700">
                    {previewProperty.status === 0 ? 'Pending' : previewProperty.status === 1 ? 'Approved' : 'Rejected'}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2.5">
              {previewProperty.status !== 1 && (
                <button
                  type="button"
                  onClick={() => handleApprove(previewProperty.id, previewProperty.title)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm"
                >
                  Approve Listing
                </button>
              )}
              {previewProperty.status !== 2 && (
                <button
                  type="button"
                  onClick={() => {
                    setRejectModalProperty(previewProperty);
                    setRejectionReason('');
                  }}
                  className="px-4 py-2 border border-rose-200 text-rose-700 font-bold text-xs rounded-xl hover:bg-rose-50"
                >
                  Reject
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── REJECTION MODAL ── */}
      {rejectModalProperty && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden p-6 border border-gray-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
                <XCircle size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Reject Property Listing</h3>
                <p className="text-xs text-gray-400">Specify reason for rejecting "{rejectModalProperty.title}"</p>
              </div>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              {/* Quick preset suggestions */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Quick Reason Presets:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Unverified ownership / deed',
                    'Low resolution / blurred photos',
                    'Inaccurate / incomplete price',
                    'Duplicate property listing',
                    'Misleading property description',
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setRejectionReason(preset)}
                      className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-medium transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Rejection Reason / Internal Note:
                </label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why this listing was not approved..."
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
                  required
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalProperty(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-xs font-bold text-white shadow-sm"
                >
                  {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE MODAL ── */}
      {deleteModalProperty && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden p-6 border border-gray-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Admin Delete</h3>
                <p className="text-xs text-gray-400">Permanently delete listing</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed mb-4">
              Are you sure you want to permanently delete{' '}
              <strong className="text-gray-900">"{deleteModalProperty.title}"</strong> ({deleteModalProperty.referenceCode})?
              This bypasses seller PIN authentication and cannot be undone.
            </p>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteModalProperty(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleDeleteConfirm}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-xs font-bold text-white shadow-sm"
              >
                {actionLoading ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

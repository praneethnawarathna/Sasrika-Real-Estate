import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, MessageSquare, KeyRound, MapPin, CheckCircle2,
  Building, Users, Phone, Mail, ArrowRight, Plus, Sparkles
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AddPropertyModal from '../components/AddPropertyModal';
import WhatsAppIcon from '../components/WhatsAppIcon';

export default function AboutPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      <div>
        <Navbar onAddClick={() => setIsModalOpen(true)} />

        {/* ── Hero Banner ── */}
        <div className="bg-gradient-to-br from-emerald-950 via-teal-950 to-gray-900 text-white py-16 md:py-24 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-4 backdrop-blur-sm">
              <Sparkles size={13} className="text-emerald-400" />
              About Sasrika Real Estate
            </span>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight max-w-4xl mx-auto">
              Empowering Transparent &amp; Direct Real Estate Across <span className="text-emerald-400">Sri Lanka</span>
            </h1>
            <p className="mt-4 text-base sm:text-lg text-emerald-100/80 max-w-2xl mx-auto leading-relaxed">
              We connect genuine buyers, tenants, and property owners directly — eliminating broker middlemen, hidden markups, and communication delays.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-900/40 transition-all hover:scale-105"
              >
                <span>Browse Verified Listings</span>
                <ArrowRight size={16} />
              </Link>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-xl border border-white/20 backdrop-blur-md transition-all"
              >
                <Plus size={16} />
                <span>List Your Property Free</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Key Value Pillars (Stats Grid) ── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <Users size={24} />
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 mb-1">100% Direct Contact</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Connect directly with landowners and property creators without intermediary commissions or inflated price markups.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#25D366] flex items-center justify-center mb-4">
                <WhatsAppIcon size={24} />
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 mb-1">WhatsApp Lead Gen</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                One-click instant inquiry chats with pre-filled title and pricing details, formatted specifically for Sri Lankan phone numbers.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <KeyRound size={24} />
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 mb-1">PIN-Secured Control</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Listing creators retain full ownership to edit or delete properties anytime using a private 4-digit secret PIN — zero sign-up hassle.
              </p>
            </div>
          </div>
        </section>

        {/* ── Main Narrative & Mission ── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-5">
              <span className="text-xs font-extrabold tracking-wider text-emerald-600 uppercase">
                Our Mission &amp; Purpose
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight leading-snug">
                Rebuilding Trust in Sri Lanka's Real Estate Marketplace
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                In Sri Lanka, finding reliable land or houses has historically been cluttered with unverified listings, phantom brokers, and outdated prices. Sasrika was established to transform that experience into a clean, modern digital portal.
              </p>
              <p className="text-gray-600 text-sm leading-relaxed">
                Whether you are seeking agricultural land in Kurunegala, residential plots in Gampaha, luxury apartments in Colombo, or commercial investments in Kandy, Sasrika delivers clear specs, genuine images, and verifiable details.
              </p>

              <div className="pt-2 space-y-3">
                {[
                  'Verified survey plans & clear pedigree title deed indicators',
                  'Conditional specs tailored per property type (Land, House, Commercial)',
                  'Direct seller telephone and WhatsApp communication channels',
                  'Island-wide coverage across all 25 administrative districts',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-xs font-semibold text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sasrika Guarantee Card */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-100/50 rounded-3xl p-8 border border-emerald-100 shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md flex-shrink-0">
                  <ShieldCheck size={26} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-emerald-950">The Sasrika Buyer Guarantee</h3>
                  <p className="text-xs text-emerald-700">Integrity and accuracy in every listing</p>
                </div>
              </div>

              <p className="text-xs text-emerald-900/80 leading-relaxed">
                Every property featured on Sasrika is presented with direct ownership contact and explicit parameters — including per-perch pricing, land extent, and room counts. We empower buyers with transparent data to negotiate with absolute confidence.
              </p>

              <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3 border border-emerald-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-600">Coverage</span>
                  <span className="font-bold text-emerald-700">All 25 Sri Lankan Districts</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-600">Listing Verification</span>
                  <span className="font-bold text-emerald-700">Pedigree Title Validation</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-600">Direct Inquiries</span>
                  <span className="font-bold text-emerald-700">WhatsApp &amp; Phone Calls</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Contact & Company Details ── */}
        <section className="bg-white border-y border-gray-100 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-extrabold tracking-wider text-emerald-600 uppercase">
                Get In Touch
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mt-1">
                Have Inquiries or Need Listing Assistance?
              </h2>
              <p className="text-gray-500 text-xs sm:text-sm mt-2">
                Our support team is based in Sri Lanka and ready to help you navigate property transactions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100 text-center space-y-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <MapPin size={20} />
                </div>
                <h4 className="font-bold text-gray-900 text-sm">Headquarters</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Sasrika Real Estate Hub<br />Colombo 03 &amp; Kandy, Sri Lanka
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100 text-center space-y-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <Phone size={20} />
                </div>
                <h4 className="font-bold text-gray-900 text-sm">Direct Phone</h4>
                <p className="text-xs text-gray-500 leading-relaxed font-mono">
                  +94 77 000 0000<br />+94 11 200 0000
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100 text-center space-y-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <Mail size={20} />
                </div>
                <h4 className="font-bold text-gray-900 text-sm">Email Support</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  support@sasrika.lk<br />info@sasrika.lk
                </p>
              </div>
            </div>
          </div>
        </section>

      </div>

      <Footer />

      {isModalOpen && (
        <AddPropertyModal
          onClose={() => setIsModalOpen(false)}
          onCreated={() => {
            setIsModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

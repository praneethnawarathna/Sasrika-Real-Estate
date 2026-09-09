import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 text-gray-600 text-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">

          {/* Brand & Mission */}
          <div className="md:col-span-2 space-y-3">
            <Link to="/" className="flex items-center gap-2.5">
              <img
                src="/logo.svg"
                alt="Sasrika Real Estate"
                className="h-8 w-auto object-contain"
              />
              <span className="font-extrabold text-xl text-gray-900 tracking-tight leading-none">
                Sasrika<span className="text-emerald-600">.</span>
              </span>
            </Link>
            <p className="text-xs text-gray-500 max-w-sm leading-relaxed">
              Sri Lanka's trusted direct property marketplace. We connect genuine buyers with verified land, residential houses, and commercial listings with transparent pricing and direct WhatsApp/call inquiries.
            </p>
            <div className="flex items-center gap-1 text-[11px] text-gray-400">
              <span>Made with</span>
              <Heart size={12} className="text-rose-500 fill-rose-500" />
              <span>for Sri Lanka Real Estate</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
              Quick Navigation
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link to="/" className="hover:text-emerald-600 transition-colors">
                  Explore All Listings
                </Link>
              </li>
              <li>
                <Link to="/?filter=sale" className="hover:text-emerald-600 transition-colors">
                  Properties for Sale
                </Link>
              </li>
              <li>
                <Link to="/?filter=rent" className="hover:text-emerald-600 transition-colors">
                  Properties for Rent
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-emerald-600 transition-colors font-medium text-emerald-700">
                  About Us &amp; Guarantee
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
              Contact &amp; Support
            </h4>
            <div className="space-y-2 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-emerald-500 flex-shrink-0" />
                <span>Colombo &amp; Kandy, Sri Lanka</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-emerald-500 flex-shrink-0" />
                <span>+94 77 000 0000 / +94 11 200 0000</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-emerald-500 flex-shrink-0" />
                <span>support@sasrika.lk</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
          <p>© {new Date().getFullYear()} Sasrika Real Estate. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <Link to="/about" className="hover:text-gray-600 transition-colors">
              About Us
            </Link>
            <span className="text-gray-300">•</span>
            <span>Direct Seller Platform</span>
            <span className="text-gray-300">•</span>
            <span>Sri Lanka</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

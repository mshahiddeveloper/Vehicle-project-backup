'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, PhoneCall, MessageSquare, ExternalLink } from 'lucide-react';
import { useCountry } from '@/app/context/CountryContext';

export function AppFooter() {
  const { country } = useCountry();
  const isPakistan = !country || country.code === 'PK';

  return (
    <footer className="bg-white border-t border-[#EEF0F2] text-[#475467] font-sans pt-12 pb-24 md:pb-12">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Col 1: Brand & Model */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-[10px] bg-[#0B6B4F] text-white flex items-center justify-center font-extrabold text-lg">
                S
              </span>
              <span className="font-heading font-extrabold text-[22px] tracking-tight text-[#101828]">
                SafarPK
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-[#475467]">
              SafarPK is a direct marketplace connecting registered vehicle owners, {isPakistan ? 'independent drivers & captains' : 'independent chauffeurs'}, commuter van operators, and home movers with customers across {country?.name || 'Pakistan'} and worldwide.
            </p>
            <div className="p-3 bg-[#F7F8FA] rounded-xl border border-[#EEF0F2] text-xs text-[#344054] leading-relaxed">
              <strong className="text-[#101828] block mb-0.5">Direct Connector Model:</strong>
              Direct transport marketplace. Renters and hosts connect directly and settle at vehicle handover.
            </div>
          </div>

          {/* Col 2: Services */}
          <div>
            <h4 className="text-sm font-bold text-[#101828] uppercase tracking-wider mb-4">
              Marketplace Services
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/" className="hover:text-[#0B6B4F] transition">
                  Rent a car {isPakistan ? '(Self-drive & Driver)' : '(Self-drive & Chauffeur)'}
                </Link>
              </li>
              <li>
                <Link href="/drivers" className="hover:text-[#0B6B4F] transition">
                  {isPakistan ? 'Hire a verified driver' : 'Hire a chauffeur'}
                </Link>
              </li>
              <li>
                <Link href="/city-to-city" className="hover:text-[#0B6B4F] transition">
                  City to city private rides
                </Link>
              </li>
              <li>
                <Link href="/shuttles" className="hover:text-[#0B6B4F] transition">
                  Pick & drop commuter shuttles
                </Link>
              </li>
              <li>
                <Link href="/movers" className="hover:text-[#0B6B4F] transition">
                  {isPakistan ? 'Home shifting & cargo trucks' : 'Moving & cargo trucks'}
                </Link>
              </li>
              <li>
                <Link href="/post-ad" className="text-[#0B6B4F] font-semibold hover:underline">
                  + List your vehicle / fleet
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Lister & Driver Portals */}
          <div>
            <h4 className="text-sm font-bold text-[#101828] uppercase tracking-wider mb-4">
              Partner Portals
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/lister" className="hover:text-[#0B6B4F] transition">
                  Fleet Owner Dashboard
                </Link>
              </li>
              <li>
                <Link href="/driver" className="hover:text-[#0B6B4F] transition">
                  {isPakistan ? 'Driver & Captain Dashboard' : 'Driver / Chauffeur Dashboard'}
                </Link>
              </li>
              <li>
                <Link href="/provider" className="hover:text-[#0B6B4F] transition">
                  Shuttle & Movers Operations
                </Link>
              </li>
              <li>
                <Link href="/subscription" className="hover:text-[#0B6B4F] transition">
                  Subscription Plans & Promos
                </Link>
              </li>
              <li>
                <Link href="/verify" className="hover:text-[#0B6B4F] transition">
                  ID & Business Verification
                </Link>
              </li>
              <li>
                <Link href="/leads" className="hover:text-[#0B6B4F] transition">
                  Leads & Ad Performance
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Trust & Help */}
          <div>
            <h4 className="text-sm font-bold text-[#101828] uppercase tracking-wider mb-4">
              Trust & Support
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/help" className="hover:text-[#0B6B4F] transition">
                  Help Centre & FAQ
                </Link>
              </li>
              <li>
                <Link href="/report" className="hover:text-[#0B6B4F] transition">
                  Report a Problem / Ticket
                </Link>
              </li>
              <li>
                <Link href="/legal" className="hover:text-[#0B6B4F] transition">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/legal#privacy" className="hover:text-[#0B6B4F] transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/legal#safety" className="hover:text-[#0B6B4F] transition">
                  Safety & Fraud Protection
                </Link>
              </li>
              <li className="pt-2">
                <Link
                  href="/agent"
                  className="text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 transition font-mono font-medium inline-block"
                >
                  Staff Agent Desk
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-[#EEF0F2] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#667085]">
          <p>© 2026 SafarPK Technologies (Pvt) Ltd. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>Direct Marketplace</span>
            <span>•</span>
            <span>24h Lead Tracking</span>
            <span>•</span>
            <span>Direct WhatsApp Booking</span>
          </div>
        </div>
      </div>
    </footer>
  );
}


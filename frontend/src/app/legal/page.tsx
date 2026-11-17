'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AppHeader } from '@/components/AppHeader';
import { AppFooter } from '@/components/AppFooter';
import { MobileNavBar } from '@/components/MobileNavBar';
import { ArrowLeft, ShieldCheck, FileText, Lock, AlertTriangle } from 'lucide-react';

export default function LegalPage() {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy' | 'listing' | 'safety'>('terms');

  const tabs = [
    { id: 'terms', label: 'Terms of Use' },
    { id: 'privacy', label: 'Privacy Policy' },
    { id: 'listing', label: 'Listing Policy' },
    { id: 'safety', label: 'Safety Guidelines' },
  ];

  const content = {
    terms: {
      title: 'Terms of Use',
      version: 'Version 3 · Effective 1 November 2026',
      sections: [
        {
          h: '1. SafarPK is a Direct Connector Only',
          p: 'SafarPK provides an online technology platform connecting vehicle owners, licensed chauffeurs, commuter shuttles, and cargo movers directly with customers. SafarPK is not an employer, broker, vehicle owner, or transport operator, and is not a party to any rental, hire or carriage agreement.',
        },
        {
          h: '2. Direct Handover & Host Settlements',
          p: 'Customers pay hosts directly at vehicle pick-up. SafarPK does not process rental amounts, security deposits, or trip fares between customers and hosts. Listers pay SafarPK solely for their listing subscription pass.',
        },
        {
          h: '3. Identity & Document Integrity',
          p: 'All users must provide genuine, non-fraudulent identification. Official documents (CNIC, driving licence, business licence, vehicle registration) are read via OCR and locked against manual tampering.',
        },
        {
          h: '4. Vehicle Compliance & Registration Smart Card',
          p: 'Every vehicle listed on SafarPK must have an uploaded, authentic vehicle registration book or smart card. Unregistered or unauthorized vehicles are permanently prohibited.',
        },
        {
          h: '5. Disputes & Resolution',
          p: 'If an issue occurs between a customer and a host, both parties may use the Report a Problem tool. Our staff agents review logs and help mediate, but the legal deal remains strictly between host and renter.',
        },
      ],
    },
    privacy: {
      title: 'Privacy Policy',
      version: 'Version 2 · Effective 15 October 2026',
      sections: [
        {
          h: '1. What Data We Collect',
          p: 'Name, phone number, email address, selected city, uploaded verification documents (CNIC, driving licence, registration smart card), geographic map coordinates, booking requests, and lead click events.',
        },
        {
          h: '2. Why We Collect Data',
          p: 'To verify partner identities, connect customers with hosts via WhatsApp and in-app chat, prevent marketplace fraud, and provide hosts with transparent 24-hour deduplicated proof of leads.',
        },
        {
          h: '3. Who Sees What',
          p: 'Hosts see your name, WhatsApp number, and (for self-drive) your verified driving licence details. Customers never see internal lead analytics. Staff agents only see the records authorized by their Super Admin access permissions.',
        },
        {
          h: '4. Document Security & Storage',
          p: 'All uploaded government identity documents and vehicle smart cards are encrypted and stored in secure private storage buckets, accessible only to authorized compliance staff.',
        },
      ],
    },
    listing: {
      title: 'Vehicle & Service Listing Policy',
      version: 'Version 4 · Effective 1 November 2026',
      sections: [
        {
          h: '1. Real Vehicles & Recent Photos',
          p: 'All uploaded photographs must represent the actual vehicle, taken within recent months. Using photos of other cars, showroom promotional brochures, or stock images is grounds for immediate listing rejection.',
        },
        {
          h: '2. Mandatory Registration Book Smart Card',
          p: 'No listing can be published live without an authentic vehicle registration card. The registration number, engine number, and model year are read by OCR and permanently locked.',
        },
        {
          h: '3. Transparent & All-Inclusive Pricing',
          p: 'Listings must clearly declare the true daily rate, chauffeur addon charges, fuel responsibility, and security deposit terms. Hidden mandatory surcharges are strictly banned.',
        },
      ],
    },
    safety: {
      title: 'Community Safety Guidelines',
      version: 'Version 1 · Effective 1 November 2026',
      sections: [
        {
          h: '1. Physical Inspection at Handover',
          p: 'Always inspect the vehicle exterior, interior, spare tyre, and fuel gauge together before signing any paperwork or transferring funds.',
        },
        {
          h: '2. Document Verification at Pick-up',
          p: 'Listers must visually inspect the original physical CNIC and driving licence of the renter. Renters should inspect the original vehicle registration smart card.',
        },
        {
          h: '3. Keep Conversations on WhatsApp & SafarPK Inbox',
          p: 'Preserve all messages, pickup dates, rates, and condition receipts on WhatsApp or the SafarPK chat thread as verifiable evidence in case of any dispute.',
        },
      ],
    },
  };

  const currentDoc = content[activeTab];

  return (
    <div className="min-h-screen bg-white font-sans text-[#101828] flex flex-col">
      <AppHeader />

      <main className="flex-1 max-w-[860px] w-full mx-auto px-4 sm:px-8 py-8 md:py-14 flex flex-col gap-6">
        <Link
          href="/help"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B6B4F] hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Help centre</span>
        </Link>

        {/* Document Tabs */}
        <div
          role="tablist"
          aria-label="Documents"
          className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1"
        >
          {tabs.map((t) => {
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(t.id as any)}
                className={`h-10 px-4 rounded-xl text-xs font-bold border transition cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-[#101828] text-white border-[#101828]'
                    : 'bg-white text-[#344054] border-[#E4E7EC] hover:bg-slate-50'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Title and version */}
        <div className="flex flex-col gap-1 border-b border-[#EEF0F2] pb-4">
          <h1 className="font-heading font-extrabold text-lg sm:text-2xl md:text-3xl lg:text-4xl text-[#101828] leading-tight">
            {currentDoc.title}
          </h1>
          <span className="text-xs text-[#667085] font-medium">{currentDoc.version}</span>
        </div>

        {/* Document Sections */}
        <div className="flex flex-col gap-6">
          {currentDoc.sections.map((s, idx) => (
            <div key={s.h} className="flex items-start gap-4">
              <span className="w-7 h-7 rounded-full bg-[#E9F3EE] text-[#08513C] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <div className="flex flex-col gap-1.5">
                <h3 className="font-heading font-bold text-base text-[#101828]">{s.h}</h3>
                <p className="text-xs sm:text-sm text-[#344054] leading-relaxed">{s.p}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 rounded-2xl bg-[#FFF4E0] border border-[#F5D9A8] text-xs text-[#8A4B00] leading-relaxed">
          SafarPK operates as a direct connector in strict adherence to national and international marketplace regulations. Super Admin configures regional compliance settings in Console › Documents by Country.
        </div>
      </main>

      <AppFooter />
      <MobileNavBar />
    </div>
  );
}


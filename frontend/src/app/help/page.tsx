'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AppHeader } from '@/components/AppHeader';
import { AppFooter } from '@/components/AppFooter';
import { MobileNavBar } from '@/components/MobileNavBar';
import {
  Search,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Phone,
  FileText,
  ShieldCheck,
  CreditCard,
  Car,
  Calendar,
  AlertCircle,
} from 'lucide-react';

interface FaqItem {
  q: string;
  a: string;
  topic: string;
}

const FAQS: FaqItem[] = [
  {
    topic: 'booking',
    q: 'How does booking work on SafarPK?',
    a: 'SafarPK connects you directly with the vehicle host or driver. When you find a car or service, submit your booking request with your contact details (and licence for self-drive). The request goes directly to the owner on WhatsApp and into your SafarPK inbox. You agree and pay the host directly at vehicle pick-up.',
  },
  {
    topic: 'booking',
    q: 'Do I pay online or in cash?',
    a: 'SafarPK is a direct marketplace — zero online rental payments are processed by us. You pay the vehicle owner or driver directly in cash or bank transfer at the time of vehicle handover.',
  },
  {
    topic: 'booking',
    q: 'What documents do I need to rent self-drive?',
    a: 'For self-drive rentals in Pakistan, you need your original computerized National Identity Card (CNIC) or Passport, and a valid Pakistani driving licence (or international permit). SafarPK requires you to upload your driving licence before sending a self-drive request so the host can pre-verify you.',
  },
  {
    topic: 'listing',
    q: 'How do I list my car, shuttle or moving truck?',
    a: 'Tap "+ List your vehicle" in the top menu or create an account as an Owner, Driver, Shuttle Operator, or Mover. You will complete a 3-step listing process (specs, photos, registration book smart card) and subscribe to a membership pass.',
  },
  {
    topic: 'plans',
    q: 'How much does a subscription plan cost?',
    a: 'Lister plans start from Rs. 3,500/month (Was Rs. 5,000) for private hosts with up to 2 cars, and Rs. 12,000/month for fleet owners with up to 15 vehicles. Independent chauffeurs can join for Rs. 2,000/month. You keep 100% of all rental proceeds directly from customers.',
  },
  {
    topic: 'plans',
    q: 'How do Promo Codes work on SafarPK?',
    a: 'You can apply promo codes at checkout for instant discounts (e.g. 20% off) or free extra validity (e.g. +14 days free). Promo codes are geo-fenced per country and automatically recalculate your total savings with clear WAS - NOW price comparisons.',
  },
  {
    topic: 'docs',
    q: 'Why are document fields locked after upload?',
    a: 'To prevent fraud and maintain marketplace integrity, all identification and registration fields are scanned via OCR from genuine documents and locked against manual typing. If your name or number was misread, simply upload a clearer photo.',
  },
];

export default function HelpPage() {
  const [selectedTopic, setSelectedTopic] = useState('booking');
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);

  const topics = [
    { id: 'booking', label: 'Booking & Requests', icon: Calendar },
    { id: 'listing', label: 'Listing Your Vehicle', icon: Car },
    { id: 'plans', label: 'Plans & Promo Codes', icon: CreditCard },
    { id: 'docs', label: 'Documents & Verification', icon: ShieldCheck },
  ];

  const filteredFaqs = FAQS.filter((f) => {
    if (searchQuery.trim()) {
      return (
        f.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.a.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return f.topic === selectedTopic;
  });

  return (
    <div className="min-h-screen bg-white font-sans text-[#101828] flex flex-col">
      <AppHeader />

      <main className="flex-1 max-w-[1100px] w-full mx-auto px-4 sm:px-8 py-8 md:py-14 flex flex-col gap-8">
        <div className="flex flex-col gap-1.5">
          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-[#101828] tracking-tight">
            Help centre & FAQs
          </h1>
          <p className="text-[#475467] text-base">
            Answers for renters, vehicle owners, independent drivers, shuttles and movers.
          </p>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-3 px-4 h-12 sm:h-14 rounded-2xl border border-[#E4E7EC] bg-white shadow-2xs">
          <Search className="w-5 h-5 text-[#667085]" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search help, e.g. promo code, driving licence, approval, payment..."
            className="w-full text-sm font-medium text-[#101828] outline-none bg-transparent"
          />
        </div>

        {/* 2-Column FAQs */}
        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-8 items-start">
          {/* Topics Sidebar */}
          <nav aria-label="Help topics" className="flex flex-col gap-1.5">
            {topics.map((t) => {
              const active = selectedTopic === t.id && !searchQuery.trim();
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setSelectedTopic(t.id);
                    setSearchQuery('');
                  }}
                  className={`flex items-center gap-2.5 h-11 px-3.5 rounded-xl text-xs sm:text-sm font-bold text-left transition cursor-pointer ${
                    active
                      ? 'bg-[#E9F3EE] text-[#08513C]'
                      : 'text-[#475467] hover:bg-slate-50 hover:text-[#101828]'
                  }`}
                >
                  <Icon className="w-4 h-4 text-[#0B6B4F]" />
                  <span>{t.label}</span>
                </button>
              );
            })}

            <Link
              href="/legal"
              className="mt-4 text-xs font-bold text-[#0B6B4F] hover:underline px-3.5"
            >
              Terms, Privacy & Listing Policies ➔
            </Link>
          </nav>

          {/* Accordion List */}
          <div className="flex flex-col gap-3">
            {filteredFaqs.map((faq, idx) => {
              const isOpen = openFaqIdx === idx;
              return (
                <div
                  key={faq.q}
                  className="border border-[#EEF0F2] rounded-2xl overflow-hidden bg-white shadow-2xs"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-heading font-bold text-sm sm:text-base text-[#101828] hover:bg-slate-50 transition cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-5 h-5 text-[#667085] shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-[#667085] shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-[#344054] leading-relaxed border-t border-[#F0F2F4]">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}

            {filteredFaqs.length === 0 && (
              <div className="p-8 text-center text-sm text-[#667085] border border-dashed border-[#D0D5DD] rounded-2xl">
                No matching answers found for "{searchQuery}". Try different keywords or contact support below.
              </div>
            )}
          </div>
        </div>

        {/* Still Need Help Cards */}
        <div className="pt-6 border-t border-[#EEF0F2] flex flex-col gap-4">
          <h2 className="font-heading font-bold text-xl text-[#101828]">
            Still need assistance?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/report"
              className="p-5 rounded-2xl bg-[#101828] text-white flex flex-col gap-1 hover:bg-slate-800 transition"
            >
              <h4 className="font-bold text-sm">Report a problem</h4>
              <p className="text-xs text-slate-300">
                Submit a support ticket · Our staff agent responds directly
              </p>
            </Link>

            <a
              href="https://wa.me/923000723275"
              target="_blank"
              rel="noreferrer"
              className="p-5 rounded-2xl bg-[#E9F3EE] text-[#08513C] flex flex-col gap-1 hover:bg-[#d8ece1] transition"
            >
              <h4 className="font-bold text-sm">WhatsApp Helpline</h4>
              <p className="text-xs text-[#067647]">
                +92 300 0723 275 · Active 9:00 AM – 9:00 PM PKT
              </p>
            </a>

            <a
              href="tel:+9242111723275"
              className="p-5 rounded-2xl border border-[#EEF0F2] bg-white text-[#101828] flex flex-col gap-1 hover:bg-slate-50 transition shadow-2xs"
            >
              <h4 className="font-bold text-sm">Direct Phone Call</h4>
              <p className="text-xs text-[#667085]">+92 42 111 723 275</p>
            </a>
          </div>
        </div>
      </main>

      <AppFooter />
      <MobileNavBar />
    </div>
  );
}

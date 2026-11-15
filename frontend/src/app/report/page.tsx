'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AppHeader } from '@/components/AppHeader';
import { AppFooter } from '@/components/AppFooter';
import { MobileNavBar } from '@/components/MobileNavBar';
import { getActiveUser } from '@/data/userAuth';
import {
  AlertCircle,
  Check,
  Upload,
  Calendar,
  User,
  Car,
  CreditCard,
  ShieldCheck,
  Wrench,
  ArrowRight,
} from 'lucide-react';

interface ReportCategory {
  id: string;
  label: string;
  sub: string;
  icon: any;
}

export default function ReportProblemPage() {
  const [selectedCat, setSelectedCat] = useState<string>('booking');
  const [description, setDescription] = useState('');
  const [attachedFile, setAttachedFile] = useState(false);
  const [contactPref, setContactPref] = useState<'whatsapp' | 'inbox' | 'phone'>('whatsapp');
  const [ticketRef, setTicketRef] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const categories: ReportCategory[] = [
    {
      id: 'booking',
      label: 'A booking or host',
      sub: 'Cancellation, host no-show, vehicle condition',
      icon: Calendar,
    },
    {
      id: 'driver',
      label: 'A driver / chauffeur',
      sub: 'Behavior, route deviation, pricing dispute',
      icon: User,
    },
    {
      id: 'listing',
      label: 'My listing or vehicle',
      sub: 'Edit vehicle data, photo update, pause ad',
      icon: Car,
    },
    {
      id: 'payment',
      label: 'Plan or payment',
      sub: 'Subscription activation, promo code, receipt issue',
      icon: CreditCard,
    },
    {
      id: 'verification',
      label: 'Verification documents',
      sub: 'CNIC, driving licence, business licence check',
      icon: ShieldCheck,
    },
    {
      id: 'other',
      label: 'Technical problem',
      sub: 'Website bug, button not working, app issue',
      icon: Wrench,
    },
  ];

  const handleSubmitTicket = () => {
    if (!description.trim()) {
      setErrorMsg('Please describe what happened');
      return;
    }

    setErrorMsg('');
    const newRef = `TK-${Math.floor(10000 + Math.random() * 90000)}`;
    setTicketRef(newRef);
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] font-sans text-[#101828] flex flex-col">
      <AppHeader />

      <main className="flex-1 max-w-[840px] w-full mx-auto px-4 sm:px-8 py-8 md:py-14 flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#101828]">
            Report a problem
          </h1>
          <p className="text-sm text-[#475467]">
            Tell us what happened. Our staff support desk will investigate and reply directly in your inbox.
          </p>
        </div>

        {ticketRef ? (
          <div className="bg-white border border-[#EEF0F2] rounded-3xl p-6 sm:p-8 flex flex-col gap-4 shadow-sm text-center items-center">
            <div className="w-16 h-16 rounded-full bg-[#E9F3EE] text-[#0B6B4F] flex items-center justify-center font-bold text-2xl">
              ✓
            </div>
            <h2 className="font-heading font-extrabold text-2xl text-[#101828]">
              Support ticket submitted
            </h2>
            <p className="text-sm text-[#475467] max-w-md leading-relaxed">
              We received your ticket. A staff agent has been assigned to your case and will reply within 4 hours.
            </p>
            <div className="p-3 bg-[#F7F8FA] rounded-xl border border-[#EEF0F2] font-mono text-sm font-bold text-[#101828]">
              Ticket Reference: {ticketRef}
            </div>
            <div className="flex items-center gap-3 mt-3">
              <Link
                href="/inbox"
                className="h-11 px-5 rounded-xl bg-[#101828] text-white font-bold text-xs flex items-center justify-center hover:bg-slate-800"
              >
                Go to Messages Inbox
              </Link>
              <Link
                href="/"
                className="h-11 px-5 rounded-xl bg-white border border-[#D0D5DD] text-[#101828] font-bold text-xs flex items-center justify-center hover:bg-slate-50"
              >
                Return Home
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-[#EEF0F2] rounded-3xl p-6 sm:p-8 flex flex-col gap-6 shadow-xs">
            {/* 1. Category selection */}
            <div className="flex flex-col gap-3">
              <span className="font-bold text-sm text-[#101828]">
                1. What is the problem about?
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {categories.map((c) => {
                  const active = selectedCat === c.id;
                  const Icon = c.icon;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedCat(c.id)}
                      className={`p-3.5 rounded-2xl border text-left flex flex-col gap-1.5 transition cursor-pointer ${
                        active
                          ? 'border-2 border-[#0B6B4F] bg-[#E9F3EE] shadow-2xs'
                          : 'border-[#EEF0F2] bg-white hover:border-slate-300'
                      }`}
                    >
                      <Icon className="w-5 h-5 text-[#0B6B4F]" />
                      <span className="font-bold text-xs text-[#101828]">
                        {c.label}
                      </span>
                      <span className="text-[11px] text-[#667085] leading-tight">
                        {c.sub}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Details Description */}
            <div className="flex flex-col gap-2">
              <span className="font-bold text-sm text-[#101828]">
                2. Describe what happened
              </span>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Include vehicle model, booking reference SF-xxxxx, or user phone number if applicable..."
                className="p-3.5 border border-[#D0D5DD] rounded-xl text-xs sm:text-sm text-[#101828] outline-none font-sans resize-y"
              />
            </div>

            {/* 3. Attachment */}
            <button
              type="button"
              onClick={() => setAttachedFile(!attachedFile)}
              className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold transition cursor-pointer ${
                attachedFile
                  ? 'border-[#0B6B4F] bg-[#E9F3EE] text-[#08513C]'
                  : 'border-[#D0D5DD] bg-white text-[#344054] hover:bg-slate-50'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>
                {attachedFile
                  ? '✓ Screenshot attached (problem_evidence.jpg)'
                  : 'Attach screenshot or proof (optional)'}
              </span>
            </button>

            {/* 4. Contact Preference */}
            <div className="flex flex-col gap-2">
              <span className="font-bold text-sm text-[#101828]">
                How should our agent contact you?
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setContactPref('whatsapp')}
                  className={`p-2.5 rounded-xl border text-center text-xs font-bold transition cursor-pointer ${
                    contactPref === 'whatsapp'
                      ? 'border-[#0B6B4F] bg-[#E9F3EE] text-[#08513C]'
                      : 'border-[#E4E7EC] bg-white text-[#475467]'
                  }`}
                >
                  WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => setContactPref('inbox')}
                  className={`p-2.5 rounded-xl border text-center text-xs font-bold transition cursor-pointer ${
                    contactPref === 'inbox'
                      ? 'border-[#0B6B4F] bg-[#E9F3EE] text-[#08513C]'
                      : 'border-[#E4E7EC] bg-white text-[#475467]'
                  }`}
                >
                  In-App Messages
                </button>
                <button
                  type="button"
                  onClick={() => setContactPref('phone')}
                  className={`p-2.5 rounded-xl border text-center text-xs font-bold transition cursor-pointer ${
                    contactPref === 'phone'
                      ? 'border-[#0B6B4F] bg-[#E9F3EE] text-[#08513C]'
                      : 'border-[#E4E7EC] bg-white text-[#475467]'
                  }`}
                >
                  Phone Call
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-red-50 text-red-700 text-xs font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleSubmitTicket}
              className="h-12 rounded-xl bg-[#0B6B4F] text-white font-bold text-sm hover:bg-[#08513C] transition cursor-pointer shadow-md flex items-center justify-center gap-2"
            >
              <span>Submit Problem Report</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>

      <AppFooter />
      <MobileNavBar />
    </div>
  );
}


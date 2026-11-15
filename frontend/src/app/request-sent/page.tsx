'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AppHeader } from '@/components/AppHeader';
import { AppFooter } from '@/components/AppFooter';
import { MobileNavBar } from '@/components/MobileNavBar';
import { Check, MessageSquare, ArrowRight, Calendar, User, ShieldCheck } from 'lucide-react';

function RequestSentContent() {
  const searchParams = useSearchParams();
  const ref = searchParams?.get('ref') || 'SF-24817';
  const name = searchParams?.get('name') || 'Kashif Motors';
  const car = searchParams?.get('car') || searchParams?.get('route') || 'Honda Civic Oriel Turbo 2024';
  const rate = searchParams?.get('rate') || 'PKR 24,000';
  const option = searchParams?.get('option') || 'Self-drive';

  return (
    <div className="min-h-screen bg-[#F7F8FA] font-sans text-[#101828] flex flex-col">
      <AppHeader />

      <main className="flex-1 max-w-[880px] w-full mx-auto px-4 sm:px-8 py-10 md:py-16 flex flex-col gap-8">
        {/* Top Success Banner */}
        <div className="flex flex-col items-center gap-3.5 text-center">
          <div className="w-18 h-18 rounded-full bg-[#E9F3EE] flex items-center justify-center shadow-xs">
            <div className="w-12 h-12 rounded-full bg-[#0B6B4F] flex items-center justify-center text-white">
              <Check className="w-7 h-7 stroke-[3]" />
            </div>
          </div>
          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-[#101828] tracking-tight">
            Request sent to {name}
          </h1>
          <p className="text-[#475467] text-sm sm:text-base max-w-lg leading-relaxed">
            We opened WhatsApp with your booking details. The host will confirm availability there — you can also track all updates in your SafarPK inbox.
          </p>
          <div className="flex items-center gap-2 text-sm text-[#475467]">
            <span>Request reference</span>
            <span className="font-mono font-bold text-[#101828] bg-white border border-[#E4E7EC] px-3 py-1 rounded-lg text-sm shadow-2xs">
              {ref}
            </span>
          </div>
        </div>

        {/* Booking Card */}
        <div className="bg-white rounded-3xl border border-[#EEF0F2] overflow-hidden shadow-xs">
          <div className="p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4 border-b border-[#F0F2F4]">
            <div className="flex items-center gap-4">
              <div className="w-20 h-14 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-400 text-xs">
                {name.slice(0, 3)}
              </div>
              <div>
                <h3 className="font-heading font-extrabold text-lg text-[#101828]">
                  {car}
                </h3>
                <p className="text-xs text-[#475467]">
                  {option} · Hosted by {name}
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#FFF4E0] text-[#8A4B00] text-xs font-bold">
              Waiting for owner
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#F0F2F4] text-xs">
            <div className="p-4 flex flex-col gap-1">
              <span className="text-[#667085] font-semibold">Pick-up</span>
              <span className="font-bold text-[#101828] text-sm">Fri 14 Nov · 10:00</span>
            </div>
            <div className="p-4 flex flex-col gap-1">
              <span className="text-[#667085] font-semibold">Return</span>
              <span className="font-bold text-[#101828] text-sm">Sun 16 Nov · 10:00</span>
            </div>
            <div className="p-4 flex flex-col gap-1">
              <span className="text-[#667085] font-semibold">Estimated Total</span>
              <span className="font-bold text-[#101828] text-sm">{rate}</span>
            </div>
            <div className="p-4 flex flex-col gap-1">
              <span className="text-[#667085] font-semibold">Payment</span>
              <span className="font-bold text-[#101828] text-sm">Direct to owner at pick-up</span>
            </div>
          </div>
        </div>

        {/* What Happens Next Steps */}
        <div className="bg-white rounded-3xl border border-[#EEF0F2] p-6 flex flex-col gap-4 shadow-xs">
          <h2 className="font-heading font-bold text-lg text-[#101828]">
            What happens next
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="flex flex-col gap-2">
              <span className="w-7 h-7 rounded-full bg-[#0B6B4F] text-white font-extrabold text-xs flex items-center justify-center">
                1
              </span>
              <h4 className="font-bold text-sm text-[#101828]">Owner replies</h4>
              <p className="text-xs text-[#475467] leading-relaxed">
                {name} verifies their fleet schedule and confirms availability via WhatsApp.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-extrabold text-xs flex items-center justify-center">
                2
              </span>
              <h4 className="font-bold text-sm text-[#101828]">Booking confirmed</h4>
              <p className="text-xs text-[#475467] leading-relaxed">
                Your request status changes to confirmed in your dashboard & inbox.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-extrabold text-xs flex items-center justify-center">
                3
              </span>
              <h4 className="font-bold text-sm text-[#101828]">Pick up & pay</h4>
              <p className="text-xs text-[#475467] leading-relaxed">
                Bring your original CNIC & driving licence. Pay the owner directly at handover.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/inbox"
            className="h-12 px-6 rounded-xl bg-white border border-[#D0D5DD] text-[#101828] font-bold text-sm hover:bg-slate-50 transition flex items-center gap-2 shadow-2xs"
          >
            <MessageSquare className="w-4 h-4 text-slate-500" />
            <span>View in inbox</span>
          </Link>
          <Link
            href="/customer"
            className="h-12 px-6 rounded-xl bg-[#0B6B4F] text-white font-bold text-sm hover:bg-[#08513C] transition flex items-center gap-2 shadow-sm"
          >
            <Calendar className="w-4 h-4" />
            <span>Go to my bookings</span>
          </Link>
        </div>
      </main>

      <AppFooter />
      <MobileNavBar />
    </div>
  );
}

export default function RequestSentPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm">Loading request details...</div>}>
      <RequestSentContent />
    </Suspense>
  );
}


'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AppHeader } from '@/components/AppHeader';
import { AppFooter } from '@/components/AppFooter';
import { MobileNavBar } from '@/components/MobileNavBar';
import { AdStats } from '@/components/AdStats';
import { getActiveUser } from '@/data/userAuth';
import { Download, Calendar, ShieldCheck, ArrowLeft, BarChart2 } from 'lucide-react';

interface LeadLogItem {
  id: string;
  when: string;
  type: 'Request to book' | 'WhatsApp click' | 'Phone call' | 'View';
  typeColor: string;
  typeBg: string;
  name: string;
  phone: string;
  item: string;
  city: string;
  delivered: string;
}

const SAMPLE_LOG: LeadLogItem[] = [
  {
    id: 'l-1',
    when: '11 Nov · 16:40',
    type: 'Request to book',
    typeColor: '#0B6B4F',
    typeBg: '#E9F3EE',
    name: 'Asad Mehmood',
    phone: '+92 300 847••••',
    item: 'Honda Civic Oriel Turbo',
    city: 'Islamabad',
    delivered: 'WhatsApp & Inbox',
  },
  {
    id: 'l-2',
    when: '11 Nov · 14:15',
    type: 'WhatsApp click',
    typeColor: '#0B6B4F',
    typeBg: '#E9F3EE',
    name: 'Farhan Zaidi',
    phone: '+92 345 889••••',
    item: 'Toyota Corolla Altis Grande',
    city: 'Lahore',
    delivered: 'WhatsApp message',
  },
  {
    id: 'l-3',
    when: '11 Nov · 11:20',
    type: 'Phone call',
    typeColor: '#B45309',
    typeBg: '#FEF3E2',
    name: 'Muhammad Usman',
    phone: '+92 321 445••••',
    item: 'Toyota Fortuner Sigma 4',
    city: 'Islamabad',
    delivered: 'Direct mobile call',
  },
  {
    id: 'l-4',
    when: '10 Nov · 20:05',
    type: 'Request to book',
    typeColor: '#0B6B4F',
    typeBg: '#E9F3EE',
    name: 'Kamran Tariq',
    phone: '+92 333 559••••',
    item: 'Honda Civic Oriel Turbo',
    city: 'Islamabad',
    delivered: 'WhatsApp & Inbox',
  },
  {
    id: 'l-5',
    when: '10 Nov · 18:30',
    type: 'WhatsApp click',
    typeColor: '#0B6B4F',
    typeBg: '#E9F3EE',
    name: 'Bilal Hassan',
    phone: '+92 301 223••••',
    item: 'Hyundai Tucson AWD',
    city: 'Lahore',
    delivered: 'WhatsApp message',
  },
];

export default function LeadsReportPage() {
  const activeUser = getActiveUser();
  const [rangeIdx, setRangeIdx] = useState<number>(1); // 0: 7 days, 1: 30 days, 2: This month, 3: All time
  const [selectedKpi, setSelectedKpi] = useState<number>(0);
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  const ranges = ['Last 7 days', 'Last 30 days', 'This month', 'All time'];

  const kpis = [
    { label: 'Booking requests', value: '68', sub: '+12% vs last period' },
    { label: 'WhatsApp chats', value: '184', sub: '+28% vs last period' },
    { label: 'Direct phone calls', value: '58', sub: '+5% vs last period' },
    { label: 'Listing views', value: '2,410', sub: '24h unique per user' },
  ];

  const dailyBars = [
    { label: '1 Nov', val: 18, requests: 2, chats: 6 },
    { label: '2 Nov', val: 24, requests: 4, chats: 8 },
    { label: '3 Nov', val: 15, requests: 1, chats: 5 },
    { label: '4 Nov', val: 32, requests: 5, chats: 12 },
    { label: '5 Nov', val: 40, requests: 8, chats: 15 },
    { label: '6 Nov', val: 28, requests: 4, chats: 10 },
    { label: '7 Nov', val: 36, requests: 6, chats: 14 },
    { label: '8 Nov', val: 45, requests: 9, chats: 18 },
    { label: '9 Nov', val: 52, requests: 11, chats: 20 },
    { label: '10 Nov', val: 48, requests: 10, chats: 19 },
    { label: '11 Nov', val: 68, requests: 14, chats: 26 },
  ];

  const handleExportCSV = () => {
    const headers = ['Date & Time', 'Event Type', 'Customer Name', 'Phone', 'Listing', 'City', 'Delivery'];
    const rows = SAMPLE_LOG.map((l) => [l.when, l.type, l.name, l.phone, l.item, l.city, l.delivered]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SafarPK_Leads_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const roleColor = activeUser?.role === 'DRIVER' ? '#B45309' : '#0B6B4F';

  return (
    <div className="min-h-screen bg-[#F7F8FA] font-sans text-[#101828] flex flex-col">
      <AppHeader />

      <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 sm:px-8 py-8 md:py-12 flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <Link
              href={activeUser?.role === 'DRIVER' ? '/driver' : '/lister'}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B6B4F] hover:underline mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to dashboard</span>
            </Link>
            <h1 className="font-heading font-extrabold text-lg sm:text-2xl md:text-3xl text-[#101828] leading-tight">
              Leads & Performance Report
            </h1>
            <p className="text-xs sm:text-sm text-[#475467]">
              {activeUser?.businessName || activeUser?.name || 'Kashif Motors'} · Every verified customer contact with date, time, and deduplication.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="h-10 px-4 rounded-xl border border-[#D0D5DD] bg-white font-bold text-xs text-[#101828] hover:bg-slate-50 transition cursor-pointer flex items-center gap-2 shadow-2xs"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Download CSV</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="h-10 px-4 rounded-xl bg-[#101828] font-bold text-xs text-white hover:bg-slate-800 transition cursor-pointer flex items-center gap-2 shadow-2xs"
            >
              <span>Download PDF report</span>
            </button>
          </div>
        </div>

        {/* Date Filters Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {ranges.map((lbl, idx) => (
            <button
              key={lbl}
              type="button"
              onClick={() => setRangeIdx(idx)}
              className={`h-9 px-3.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                rangeIdx === idx
                  ? 'bg-[#101828] text-white border-[#101828]'
                  : 'bg-white text-[#344054] border-[#E4E7EC] hover:bg-slate-50'
              }`}
            >
              {lbl}
            </button>
          ))}
          <div className="flex items-center gap-1.5 text-xs text-[#667085] ml-2">
            <input
              type="date"
              defaultValue="2026-11-01"
              className="h-9 px-2.5 rounded-lg border border-[#D0D5DD] bg-white font-sans text-xs outline-none"
            />
            <span>to</span>
            <input
              type="date"
              defaultValue="2026-11-11"
              className="h-9 px-2.5 rounded-lg border border-[#D0D5DD] bg-white font-sans text-xs outline-none"
            />
          </div>
        </div>

        {/* Top 4 KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {kpis.map((k, idx) => (
            <button
              key={k.label}
              type="button"
              onClick={() => setSelectedKpi(idx)}
              className={`p-4 rounded-2xl bg-white text-left border flex flex-col gap-1 transition cursor-pointer shadow-xs ${
                selectedKpi === idx
                  ? 'border-2 border-[#0B6B4F] shadow-sm'
                  : 'border-[#EEF0F2] hover:border-slate-300'
              }`}
            >
              <span className="text-xs font-semibold text-[#475467]">{k.label}</span>
              <span className="font-heading font-extrabold text-2xl sm:text-3xl text-[#101828]">
                {k.value}
              </span>
              <span className="text-[11px] font-medium text-[#0B6B4F]">{k.sub}</span>
            </button>
          ))}
        </div>

        {/* Daily Leads Bar Chart */}
        <section className="bg-white border border-[#EEF0F2] rounded-3xl p-6 flex flex-col gap-3 shadow-xs">
          <div className="flex justify-between items-baseline">
            <h3 className="font-heading font-bold text-base text-[#101828]">
              Daily Lead Volume & Inquiries
            </h3>
            <span className="text-xs text-[#475467]">
              {hoveredDay || 'Hover over bar to view daily breakdown'}
            </span>
          </div>

          <div className="h-40 flex items-end gap-2 border-b border-[#E4E7EC] pt-4">
            {dailyBars.map((b) => {
              const heightPct = Math.round((b.val / 70) * 100);
              return (
                <div
                  key={b.label}
                  onMouseEnter={() =>
                    setHoveredDay(
                      `${b.label}: ${b.val} total inquiries (${b.requests} booking requests, ${b.chats} WhatsApp chats)`
                    )
                  }
                  onMouseLeave={() => setHoveredDay(null)}
                  className="flex-1 h-full flex items-end justify-center group cursor-pointer"
                >
                  <div
                    className="w-full max-w-[28px] rounded-t-md transition-all group-hover:brightness-90"
                    style={{
                      height: `${heightPct}%`,
                      backgroundColor: roleColor,
                    }}
                  />
                </div>
              );
            })}
          </div>

          <div className="flex gap-2 text-[11px] text-[#667085] text-center">
            {dailyBars.map((b) => (
              <span key={b.label} className="flex-1 truncate">
                {b.label}
              </span>
            ))}
          </div>
        </section>

        {/* Per-Listing Ad Performance Table (Embedded AdStats) */}
        <AdStats
          role={activeUser?.role === 'DRIVER' ? 'driver' : 'owner'}
          color={roleColor}
        />

        {/* Every Lead Log Table */}
        <section className="bg-white border border-[#EEF0F2] rounded-3xl p-6 flex flex-col gap-4 shadow-xs">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="font-heading font-bold text-base text-[#101828]">
                Every Verified Lead · {SAMPLE_LOG.length} inquiries
              </h3>
              <p className="text-xs text-[#667085]">
                Deduplicated: clicks count once per customer per listing every 24 hours.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#E9F3EE] text-[#08513C] text-xs font-bold">
              ✓ 24h Unique Filter Active
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-[#EEF0F2] text-[#667085] font-semibold">
                  <th className="py-2.5 pr-3">Date & Time</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Target Listing</th>
                  <th className="py-2.5 px-3">City</th>
                  <th className="py-2.5 pl-3">Delivered Via</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F2F4]">
                {SAMPLE_LOG.map((l) => (
                  <tr key={l.id} className="hover:bg-[#F7F8FA] transition">
                    <td className="py-3 pr-3 font-mono text-xs text-[#475467]">
                      {l.when}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className="px-2.5 py-0.5 rounded-full text-xs font-bold"
                        style={{ color: l.typeColor, backgroundColor: l.typeBg }}
                      >
                        {l.type}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-[#101828]">{l.name}</div>
                      <div className="font-mono text-xs text-[#667085]">{l.phone}</div>
                    </td>
                    <td className="py-3 px-3 font-medium text-[#101828]">{l.item}</td>
                    <td className="py-3 px-3 text-[#475467]">{l.city}</td>
                    <td className="py-3 pl-3 text-[#0B6B4F] font-semibold">{l.delivered}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <AppFooter />
      <MobileNavBar />
    </div>
  );
}


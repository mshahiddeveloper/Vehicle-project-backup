'use client';

import React, { useState } from 'react';

export interface ListingStatItem {
  id?: string;
  name: string;
  where: string;
  imp: number;
  views: number;
  vr: string;
  wa: number;
  calls: number;
  req: number;
  saved: number;
  cr: string;
  delta: string;
  positive?: boolean;
}

interface AdStatsProps {
  role?: 'owner' | 'driver' | 'pickdrop' | 'movers';
  color?: string;
  compact?: boolean;
  ads?: ListingStatItem[];
  title?: string;
  sub?: string;
}

const DEFAULT_ADS: ListingStatItem[] = [
  {
    name: 'Honda Civic Oriel Turbo 2024',
    where: 'Islamabad · Centaurus / F-8',
    imp: 2410,
    views: 482,
    vr: '20.0%',
    wa: 28,
    calls: 14,
    req: 8,
    saved: 19,
    cr: '10.4%',
    delta: '+18%',
    positive: true,
  },
  {
    name: 'Toyota Corolla Altis Grande 2024',
    where: 'Lahore · Johar Town',
    imp: 1850,
    views: 310,
    vr: '16.7%',
    wa: 16,
    calls: 9,
    req: 5,
    saved: 12,
    cr: '9.7%',
    delta: '+8%',
    positive: true,
  },
  {
    name: 'Suzuki Alto VXR AGS 660cc',
    where: 'Islamabad · G-9 Markaz',
    imp: 3120,
    views: 620,
    vr: '19.8%',
    wa: 34,
    calls: 21,
    req: 12,
    saved: 24,
    cr: '10.8%',
    delta: '+24%',
    positive: true,
  },
];

export function AdStats({
  role = 'owner',
  color = '#0B6B4F',
  compact = false,
  ads = DEFAULT_ADS,
  title = "Each vehicle's leads",
  sub = 'Unique customer clicks in the last 30 days',
}: AdStatsProps) {
  const [sortIndex, setSortIndex] = useState(0);

  const sorts = [
    { id: 0, label: 'Most leads' },
    { id: 1, label: 'Most views' },
    { id: 2, label: 'Highest contact rate' },
  ];

  const sortedAds = [...ads].sort((a, b) => {
    if (sortIndex === 0) return (b.wa + b.calls + b.req) - (a.wa + a.calls + a.req);
    if (sortIndex === 1) return b.views - a.views;
    return parseFloat(b.cr) - parseFloat(a.cr);
  });

  const totals = {
    imp: ads.reduce((s, a) => s + a.imp, 0),
    views: ads.reduce((s, a) => s + a.views, 0),
    wa: ads.reduce((s, a) => s + a.wa, 0),
    calls: ads.reduce((s, a) => s + a.calls, 0),
    req: ads.reduce((s, a) => s + a.req, 0),
    saved: ads.reduce((s, a) => s + a.saved, 0),
  };
  const totalVr = totals.imp > 0 ? `${((totals.views / totals.imp) * 100).toFixed(1)}%` : '0%';
  const totalCr = totals.views > 0 ? `${(((totals.wa + totals.calls + totals.req) / totals.views) * 100).toFixed(1)}%` : '0%';

  const sources = [
    { label: 'Direct search & filters', pct: '62%', bar: 'width: 62%; background: ' + color },
    { label: 'Homepage recommended', pct: '21%', bar: 'width: 21%; background: #475467' },
    { label: 'Shared WhatsApp link', pct: '11%', bar: 'width: 11%; background: #667085' },
    { label: 'City landing pages', pct: '6%', bar: 'width: 6%; background: #98A2B3' },
  ];

  const facts = [
    {
      label: 'Busiest inquiry time',
      value: 'Thu & Fri 4 – 8 PM',
      note: 'Most renters book weekend trips 24 to 48 hours in advance.',
    },
    {
      label: 'Average reply speed',
      value: '14 mins',
      note: '92% of WhatsApp requests confirmed within 30 minutes.',
    },
    {
      label: 'vs similar city ads',
      value: '+22%',
      note: 'Your contact rate is significantly higher than the city category average.',
    },
  ];

  return (
    <div className="font-sans text-[#101828] flex flex-col gap-3.5">
      {/* Header and Sorting Controls */}
      <div className="flex justify-between items-center gap-2.5 flex-wrap">
        <div className="flex flex-col gap-0.5">
          <span className="font-bold text-[17px] font-heading">{title}</span>
          <span className="text-xs text-[#667085]">{sub}</span>
        </div>
        <div role="radiogroup" aria-label="Sort ads" className="flex gap-1.5 flex-wrap">
          {sorts.map((o) => {
            const active = sortIndex === o.id;
            return (
              <button
                key={o.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setSortIndex(o.id)}
                className={`h-8 px-3.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
                  active
                    ? 'bg-[#101828] text-white border-[#101828] shadow-xs'
                    : 'bg-white text-[#344054] border-[#E4E7EC] hover:bg-slate-50'
                }`}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop Wide Table (Hidden on small screens when compact or viewport is small) */}
      <div className={`${compact ? 'hidden' : 'hidden lg:block'} bg-white border border-[#EEF0F2] rounded-[20px] p-2.5 px-4 overflow-x-auto shadow-xs`}>
        <table className="w-full border-collapse text-sm min-w-[960px]">
          <thead>
            <tr className="text-right text-[#667085] text-xs">
              <th className="py-3 pr-2 text-left font-semibold">Ad</th>
              <th className="py-3 px-2 font-semibold">Shown in search</th>
              <th className="py-3 px-2 font-semibold">Views</th>
              <th className="py-3 px-2 font-semibold">View rate</th>
              <th className="py-3 px-2 font-semibold">WhatsApp clicks</th>
              <th className="py-3 px-2 font-semibold">Call clicks</th>
              <th className="py-3 px-2 font-semibold">Requests</th>
              <th className="py-3 px-2 font-semibold">Saved</th>
              <th className="py-3 px-2 font-semibold">Contact rate</th>
              <th className="py-3 pl-2 font-semibold">vs last month</th>
            </tr>
          </thead>
          <tbody>
            {sortedAds.map((a, idx) => {
              const crVal = parseFloat(a.cr) || 10;
              const barWidth = Math.min(100, Math.round((crVal / 20) * 100));

              return (
                <tr key={idx} className="border-t border-[#F0F2F4] text-right">
                  <td className="py-3 pr-2 text-left">
                    <div className="flex items-center gap-2.5">
                      <span
                        style={{ backgroundColor: color }}
                        className="w-2.5 h-2.5 rounded-[3px] shrink-0"
                      />
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-slate-900">{a.name}</span>
                        <span className="text-xs text-[#667085]">{a.where}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-[#475467] font-mono">{a.imp.toLocaleString()}</td>
                  <td className="py-3 px-2 font-bold text-slate-900 font-mono">{a.views.toLocaleString()}</td>
                  <td className="py-3 px-2 text-[#475467] font-mono">{a.vr}</td>
                  <td className="py-3 px-2 font-mono font-semibold text-emerald-800">{a.wa}</td>
                  <td className="py-3 px-2 font-mono font-semibold text-blue-800">{a.calls}</td>
                  <td className="py-3 px-2 font-mono font-semibold text-purple-800">{a.req}</td>
                  <td className="py-3 px-2 text-[#475467] font-mono">{a.saved}</td>
                  <td className="py-3 px-2">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-14 h-1.5 rounded-full bg-[#EEF0F2] overflow-hidden">
                        <div
                          style={{ width: `${barWidth}%`, backgroundColor: color }}
                          className="h-full rounded-full"
                        />
                      </div>
                      <b className="font-mono text-slate-900">{a.cr}</b>
                    </div>
                  </td>
                  <td className="py-3 pl-2">
                    <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800">
                      {a.delta}
                    </span>
                  </td>
                </tr>
              );
            })}

            {/* Total Summary Row */}
            <tr className="border-t-2 border-[#E4E7EC] text-right font-bold text-slate-900">
              <td className="py-3 pr-2 text-left">All ads ({ads.length})</td>
              <td className="py-3 px-2 font-mono">{totals.imp.toLocaleString()}</td>
              <td className="py-3 px-2 font-mono">{totals.views.toLocaleString()}</td>
              <td className="py-3 px-2 font-mono">{totalVr}</td>
              <td className="py-3 px-2 font-mono text-emerald-800">{totals.wa}</td>
              <td className="py-3 px-2 font-mono text-blue-800">{totals.calls}</td>
              <td className="py-3 px-2 font-mono text-purple-800">{totals.req}</td>
              <td className="py-3 px-2 font-mono">{totals.saved}</td>
              <td className="py-3 px-2 font-mono">{totalCr}</td>
              <td className="py-3 pl-2"></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Mobile Compact Card View */}
      <div className={`${compact ? 'block' : 'block lg:hidden'} space-y-2.5`}>
        {sortedAds.map((a, idx) => {
          const crVal = parseFloat(a.cr) || 10;
          const barWidth = Math.min(100, Math.round((crVal / 20) * 100));

          return (
            <div
              key={idx}
              className="bg-white border border-[#EEF0F2] rounded-2xl p-3.5 flex flex-col gap-2.5 shadow-2xs"
            >
              <div className="flex justify-between items-baseline gap-2">
                <span className="font-bold text-sm text-[#101828] font-heading">{a.name}</span>
                <span className="text-xs font-bold font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                  {a.delta}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-1.5 py-1 text-center bg-slate-50/70 p-2 rounded-xl border border-slate-100">
                <div className="flex flex-col gap-0.5">
                  <b className="text-sm font-mono text-[#101828]">{a.views}</b>
                  <span className="text-[10px] text-[#667085]">Views</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <b className="text-sm font-mono text-emerald-800">{a.wa}</b>
                  <span className="text-[10px] text-[#667085]">WhatsApp</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <b className="text-sm font-mono text-blue-800">{a.calls}</b>
                  <span className="text-[10px] text-[#667085]">Calls</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <b className="text-sm font-mono text-purple-800">{a.req}</b>
                  <span className="text-[10px] text-[#667085]">Requests</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-[#475467]">
                <div className="flex-1 h-1.5 rounded-full bg-[#EEF0F2] overflow-hidden">
                  <div style={{ width: `${barWidth}%`, backgroundColor: color }} className="h-full rounded-full" />
                </div>
                <span className="font-mono text-[11px] font-bold">
                  {a.cr} contacted · {a.imp.toLocaleString()} shown
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Insight Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1">
        {/* Sources Progress Bars */}
        <div className="bg-white border border-[#EEF0F2] rounded-2xl p-3.5 flex flex-col gap-2 shadow-2xs">
          <span className="text-[13px] font-bold text-[#101828]">Where customers found you</span>
          <div className="space-y-1.5 pt-1">
            {sources.map((sr, i) => (
              <div key={i} className="flex flex-col gap-1">
                <div className="flex justify-between text-xs text-[#344054]">
                  <span>{sr.label}</span>
                  <b className="font-mono">{sr.pct}</b>
                </div>
                <div className="h-1.5 rounded-full bg-[#EEF0F2] overflow-hidden">
                  <div style={{ width: sr.pct, backgroundColor: i === 0 ? color : '#667085' }} className="h-full rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3 Insight Stat Cards */}
        {facts.map((f, i) => (
          <div
            key={i}
            className="bg-white border border-[#EEF0F2] rounded-2xl p-3.5 flex flex-col gap-1 shadow-2xs justify-between"
          >
            <span className="text-[13px] font-bold text-[#101828]">{f.label}</span>
            <span className="font-extrabold text-xl font-heading text-[#101828] py-1">{f.value}</span>
            <span className="text-xs text-[#667085] leading-relaxed">{f.note}</span>
          </div>
        ))}
      </div>

      {/* Official Footnote Definition */}
      <span className="text-xs text-[#667085] pt-1 leading-relaxed">
        <strong>Shown in search</strong> = times the ad appeared in results. <strong>View rate</strong> = views ÷ shown. <strong>Contact rate</strong> = (WhatsApp + call clicks + requests) ÷ views. Clicks count once per customer per ad every 24 hours.
      </span>
    </div>
  );
}


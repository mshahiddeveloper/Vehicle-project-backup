'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface LeadsWidgetProps {
  color?: string; // e.g. '#0B6B4F' (owner), '#B45309' (driver), '#6D28D9' (pickdrop), '#C2410C' (movers)
  compact?: boolean;
  href?: string;
  requests?: number;
  whatsapp?: number;
  calls?: number;
  views?: number;
  title?: string;
  reportHref?: string;
}

export function LeadsWidget({
  color = '#0B6B4F',
  compact = false,
  href = '/leads',
  requests = 12,
  whatsapp = 19,
  calls = 7,
  views = 842,
  title = 'Leads this month',
  reportHref,
}: LeadsWidgetProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const rq = Number(requests) || 0;
  const wa = Number(whatsapp) || 0;
  const ca = Number(calls) || 0;
  const vw = Number(views) || 0;
  const total = rq + wa + ca;

  // Realistic daily distribution pattern across current period
  const shape = [3, 2, 5, 1, 4, 3, 6, 4, 2, 5, 3];
  const days = shape.map((d) => Math.max(0, Math.round((d / 38) * total)));
  const max = Math.max(1, ...days);

  const targetLink = reportHref || href;

  return (
    <section
      aria-label="Leads this month"
      className={`bg-white border border-[#EEF0F2] ${
        compact ? 'rounded-2xl p-3.5 gap-2.5' : 'rounded-[20px] p-5 gap-3.5'
      } flex flex-col font-sans shadow-xs transition`}
    >
      {/* Top Header */}
      <div className="flex justify-between items-baseline gap-2.5">
        <span
          className={`font-bold font-heading text-[#101828] ${
            compact ? 'text-[15px]' : 'text-lg'
          }`}
        >
          {title}
        </span>
        <Link
          href={targetLink}
          style={{ color }}
          className="font-semibold text-[13px] hover:underline flex items-center gap-1 transition"
        >
          Full report →
        </Link>
      </div>

      {/* 4 Stat KPIs */}
      <div
        className={`grid grid-cols-4 ${
          compact ? 'gap-1.5' : 'gap-3'
        } py-1`}
      >
        <div className="flex flex-col gap-0.5">
          <span
            className={`font-black font-heading text-[#101828] ${
              compact ? 'text-lg' : 'text-2xl'
            }`}
          >
            {rq.toLocaleString()}
          </span>
          <span className="font-semibold text-[11px] text-[#475467]">Requests</span>
        </div>

        <div className="flex flex-col gap-0.5">
          <span
            className={`font-black font-heading text-[#101828] ${
              compact ? 'text-lg' : 'text-2xl'
            }`}
          >
            {wa.toLocaleString()}
          </span>
          <span className="font-semibold text-[11px] text-[#475467]">WhatsApp</span>
        </div>

        <div className="flex flex-col gap-0.5">
          <span
            className={`font-black font-heading text-[#101828] ${
              compact ? 'text-lg' : 'text-2xl'
            }`}
          >
            {ca.toLocaleString()}
          </span>
          <span className="font-semibold text-[11px] text-[#475467]">Calls</span>
        </div>

        <div className="flex flex-col gap-0.5">
          <span
            className={`font-black font-heading text-[#101828] ${
              compact ? 'text-lg' : 'text-2xl'
            }`}
          >
            {vw.toLocaleString()}
          </span>
          <span className="font-semibold text-[11px] text-[#475467]">Views</span>
        </div>
      </div>

      {/* Daily Volume Bar Chart */}
      <div className="flex flex-col gap-1 pt-1">
        <div
          role="img"
          aria-label={`Leads per day, between 1 and ${max} a day`}
          className={`flex items-end gap-1 border-b border-[#E4E7EC] pb-0.5 ${
            compact ? 'h-14' : 'h-24'
          }`}
        >
          {days.map((d, i) => {
            const isHovered = hoverIndex === i;
            const isAnyHovered = hoverIndex !== null;
            const heightPercent = Math.max(8, Math.round((d / max) * 100));

            return (
              <button
                key={i}
                type="button"
                aria-label={`${i + 1} Nov: ${d} leads`}
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex(null)}
                onClick={() => setHoverIndex(i)}
                className="flex-1 h-full border-0 p-0 bg-transparent flex items-end cursor-pointer group"
              >
                <span
                  style={{
                    height: `${heightPercent}%`,
                    backgroundColor: color,
                    opacity: !isAnyHovered || isHovered ? 1 : 0.45,
                  }}
                  className="block w-full rounded-t-[4px] transition-all duration-150 group-hover:scale-y-105"
                />
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex justify-between font-medium text-[11px] text-[#667085] pt-0.5">
          <span>1 Nov</span>
          <span className="font-semibold text-[#101828]">
            {hoverIndex === null
              ? `${total} total leads`
              : `${hoverIndex + 1} Nov · ${days[hoverIndex]} leads`}
          </span>
          <span>11 Nov</span>
        </div>
      </div>
    </section>
  );
}


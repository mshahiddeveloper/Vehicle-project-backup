import { NextRequest, NextResponse } from 'next/server';
import { getNeonSqlClient } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
  Pragma: 'no-cache',
};

/**
 * GET /api/analytics?range=TODAY|7D|30D|MONTH|YEAR|ALL|CUSTOM&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * Returns live date-filtered Neon DB analytics for Super Admin, Agents, and Listers/Drivers/Providers.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const range = (searchParams.get('range') || '30D').toUpperCase();
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const category = searchParams.get('category');
    const listerPhone = searchParams.get('listerPhone');

    const now = new Date();
    let startDate: Date | null = null;
    let endDate: Date = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    if (range === 'TODAY') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (range === '7D') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (range === '30D') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (range === 'MONTH') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (range === 'YEAR') {
      startDate = new Date(now.getFullYear(), 0, 1);
    } else if (range === 'CUSTOM' && startDateParam) {
      startDate = new Date(startDateParam + 'T00:00:00.000Z');
      if (endDateParam) {
        endDate = new Date(endDateParam + 'T23:59:59.999Z');
      }
    } else {
      startDate = new Date('2020-01-01T00:00:00.000Z');
    }

    const sql = getNeonSqlClient();
    const startIso = startDate.toISOString();
    const endIso = endDate.toISOString();

    const rows = await sql`
      SELECT
        id, event_type, listing_id, listing_title, category,
        lister_id, lister_name, lister_phone, city,
        user_id, user_role, client_ip, created_at
      FROM analytics_events
      WHERE created_at >= ${startIso}::timestamptz
        AND created_at <= ${endIso}::timestamptz
      ORDER BY created_at DESC
      LIMIT 2000;
    `;

    const filtered = rows.filter((r: any) => {
      if (category && category !== 'ALL' && (r.category || '').toUpperCase() !== category.toUpperCase()) {
        return false;
      }
      if (listerPhone) {
        const pNorm = listerPhone.replace(/\D/g, '').slice(-9);
        const rNorm = String(r.lister_phone || '').replace(/\D/g, '').slice(-9);
        const nameMatch = String(r.lister_name || '').toLowerCase() === listerPhone.toLowerCase();
        if (!nameMatch && (!pNorm || pNorm !== rNorm)) return false;
      }
      return true;
    });

    let views = 0;
    let inAppChats = 0;
    let whatsappClicks = 0;
    let callClicks = 0;
    let bookingRequests = 0;

    const bucketByDate: Record<string, { label: string; views: number; chat: number; whatsapp: number; call: number; bookings: number }> = {};
    const byListing: Record<string, {
      id: string;
      name: string;
      category: string;
      city: string;
      ownerName: string;
      ownerPhone: string;
      views: number;
      inAppChatClicks: number;
      whatsappClicks: number;
      callClicks: number;
      bookingRequests: number;
      ips: Set<string>;
    }> = {};

    const useMonthlyBuckets = range === 'YEAR' || range === 'ALL';

    for (const r of filtered) {
      const dt = new Date(r.created_at);
      const bucketKey = useMonthlyBuckets
        ? `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`
        : dt.toISOString().slice(0, 10);
      const bucketLabel = useMonthlyBuckets
        ? dt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        : dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

      if (!bucketByDate[bucketKey]) {
        bucketByDate[bucketKey] = { label: bucketLabel, views: 0, chat: 0, whatsapp: 0, call: 0, bookings: 0 };
      }

      const lKey = r.listing_id || r.listing_title || 'unknown';
      if (!byListing[lKey]) {
        byListing[lKey] = {
          id: lKey,
          name: r.listing_title || 'Listing',
          category: r.category || 'CAR_RENTAL',
          city: r.city || 'Pakistan',
          ownerName: r.lister_name || 'Verified Host',
          ownerPhone: r.lister_phone || '',
          views: 0,
          inAppChatClicks: 0,
          whatsappClicks: 0,
          callClicks: 0,
          bookingRequests: 0,
          ips: new Set<string>(),
        };
      }
      if (r.client_ip) byListing[lKey].ips.add(r.client_ip);

      const type = String(r.event_type || '').toUpperCase();
      if (type === 'VIEW') {
        views++;
        bucketByDate[bucketKey].views++;
        byListing[lKey].views++;
      } else if (type === 'IN_APP_CHAT') {
        inAppChats++;
        bucketByDate[bucketKey].chat++;
        byListing[lKey].inAppChatClicks++;
      } else if (type === 'WHATSAPP') {
        whatsappClicks++;
        bucketByDate[bucketKey].whatsapp++;
        byListing[lKey].whatsappClicks++;
      } else if (type === 'CALL') {
        callClicks++;
        bucketByDate[bucketKey].call++;
        byListing[lKey].callClicks++;
      } else if (type === 'BOOK_VEHICLE') {
        bookingRequests++;
        bucketByDate[bucketKey].bookings++;
        byListing[lKey].bookingRequests++;
      }
    }

    const series = Object.keys(bucketByDate)
      .sort()
      .map((k) => ({ dateKey: k, ...bucketByDate[k] }));

    const listings = Object.values(byListing)
      .map((l) => {
        const actions = l.inAppChatClicks + l.whatsappClicks + l.callClicks + l.bookingRequests;
        const effectiveViews = Math.max(l.views, actions);
        return {
          id: l.id,
          name: l.name,
          category: l.category,
          city: l.city,
          ownerName: l.ownerName,
          ownerPhone: l.ownerPhone,
          views: l.views,
          inAppChatClicks: l.inAppChatClicks,
          whatsappClicks: l.whatsappClicks,
          callClicks: l.callClicks,
          bookingRequests: l.bookingRequests,
          totalActions: actions,
          uniqueIps: l.ips.size,
          conversionRate: effectiveViews > 0 ? `${((actions / effectiveViews) * 100).toFixed(1)}%` : '0.0%',
        };
      })
      .sort((a, b) => b.totalActions + b.views - (a.totalActions + a.views));

    return NextResponse.json(
      {
        success: true,
        range,
        startIso,
        endIso,
        totals: {
          views,
          inAppChats,
          whatsappClicks,
          callClicks,
          bookingRequests,
          totalActions: inAppChats + whatsappClicks + callClicks + bookingRequests,
          totalEvents: filtered.length,
        },
        series,
        listings,
        recentEvents: filtered.slice(0, 50),
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (error: any) {
    console.error('Analytics GET error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to compute analytics' }, { status: 500, headers: NO_STORE_HEADERS });
  }
}


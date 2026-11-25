import { NextRequest, NextResponse } from 'next/server';
import { getNeonSqlClient } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export type TrackedCtaType = 'VIEW' | 'BOOK_VEHICLE' | 'WHATSAPP' | 'IN_APP_CHAT' | 'CALL';

export interface ServerTrackedEvent {
  id: string;
  clientIp: string;
  ctaType: TrackedCtaType;
  listingId: string;
  listingTitle: string;
  listerPhone: string;
  listerName: string;
  listerId?: string;
  category?: string;
  city: string;
  userId?: string;
  userRole?: string;
  userAgent?: string;
  timestamp: string;
}

function extractClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0].trim();
    if (first && first !== 'unknown') return first;
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp && realIp !== 'unknown') return realIp.trim();
  const cfConnecting = req.headers.get('cf-connecting-ip');
  if (cfConnecting) return cfConnecting.trim();
  const trueClient = req.headers.get('true-client-ip');
  if (trueClient) return trueClient.trim();
  return '127.0.0.1';
}

export async function GET(req: NextRequest) {
  const clientIp = extractClientIp(req);
  return NextResponse.json(
    {
      success: true,
      clientIp,
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  );
}

/**
 * POST /api/track-click
 * Persists views, In-App Chat clicks, WhatsApp clicks, Call clicks, and Booking requests into Neon DB `analytics_events`.
 */
export async function POST(req: NextRequest) {
  try {
    const clientIp = extractClientIp(req);
    const body = await req.json().catch(() => ({}));

    const {
      listingId = 'unknown-listing',
      listingTitle = 'Marketplace Listing',
      listerPhone = '',
      listerName = 'Verified Host',
      listerId = '',
      category = 'CAR_RENTAL',
      ctaType = 'WHATSAPP',
      city = 'Pakistan',
      userId = '',
      userRole = 'GUEST',
    } = body;

    const validCtaTypes: TrackedCtaType[] = ['VIEW', 'BOOK_VEHICLE', 'WHATSAPP', 'IN_APP_CHAT', 'CALL'];
    const normalizedCta: TrackedCtaType = validCtaTypes.includes(ctaType as TrackedCtaType)
      ? (ctaType as TrackedCtaType)
      : 'WHATSAPP';

    const sql = getNeonSqlClient();
    const inserted = await sql`
      INSERT INTO analytics_events (
        event_type, listing_id, listing_title, category,
        lister_id, lister_name, lister_phone, city,
        user_id, user_role, client_ip
      ) VALUES (
        ${normalizedCta},
        ${String(listingId)},
        ${String(listingTitle)},
        ${String(category)},
        ${String(listerId)},
        ${String(listerName)},
        ${String(listerPhone)},
        ${String(city)},
        ${String(userId)},
        ${String(userRole)},
        ${clientIp}
      )
      RETURNING id, created_at;
    `;

    return NextResponse.json(
      {
        success: true,
        clientIp,
        event: {
          id: inserted[0]?.id,
          ctaType: normalizedCta,
          listingId: String(listingId),
          listingTitle: String(listingTitle),
          timestamp: inserted[0]?.created_at || new Date().toISOString(),
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (err: any) {
    console.error('Track-click POST error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to log click event' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}

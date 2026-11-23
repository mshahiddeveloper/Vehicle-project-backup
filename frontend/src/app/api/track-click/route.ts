import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export type TrackedCtaType = 'BOOK_VEHICLE' | 'WHATSAPP' | 'IN_APP_CHAT' | 'CALL';

export interface ServerTrackedEvent {
  id: string;
  clientIp: string;
  ctaType: TrackedCtaType;
  listingId: string;
  listingTitle: string;
  listerPhone: string;
  listerName: string;
  listerId?: string;
  city: string;
  userId?: string;
  userRole?: string;
  userAgent?: string;
  timestamp: string;
}

// In-memory ring buffer of the last 200 server-tracked click events
const serverTrackedEvents: ServerTrackedEvent[] = [];

/**
 * Extracts the real client IP address from request headers
 */
function extractClientIp(req: NextRequest): string {
  // Check standard reverse proxy headers
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

/**
 * GET /api/track-click
 * Returns client IP and server timestamp for client-side IP caching
 */
export async function GET(req: NextRequest) {
  const clientIp = extractClientIp(req);
  return NextResponse.json(
    {
      success: true,
      clientIp,
      timestamp: new Date().toISOString(),
      totalTrackedCount: serverTrackedEvents.length,
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
 * Logs an inquiry click event with client IP detection
 */
export async function POST(req: NextRequest) {
  try {
    const clientIp = extractClientIp(req);
    const body = await req.json().catch(() => ({}));

    const {
      listingId = 'unknown-listing',
      listingTitle = 'Marketplace Listing',
      listerPhone = '+92 300 0000000',
      listerName = 'Verified Host',
      listerId = '',
      ctaType = 'WHATSAPP',
      city = 'Pakistan',
      userId = '',
      userRole = 'GUEST',
    } = body;

    const validCtaTypes: TrackedCtaType[] = ['BOOK_VEHICLE', 'WHATSAPP', 'IN_APP_CHAT', 'CALL'];
    const normalizedCta: TrackedCtaType = validCtaTypes.includes(ctaType as TrackedCtaType)
      ? (ctaType as TrackedCtaType)
      : 'WHATSAPP';

    const event: ServerTrackedEvent = {
      id: `srv-inq-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      clientIp,
      ctaType: normalizedCta,
      listingId: String(listingId),
      listingTitle: String(listingTitle),
      listerPhone: String(listerPhone),
      listerName: String(listerName),
      listerId: String(listerId),
      city: String(city),
      userId: String(userId),
      userRole: String(userRole),
      userAgent: req.headers.get('user-agent') || 'browser',
      timestamp: new Date().toISOString(),
    };

    serverTrackedEvents.unshift(event);
    if (serverTrackedEvents.length > 200) {
      serverTrackedEvents.length = 200;
    }

    return NextResponse.json(
      {
        success: true,
        clientIp,
        event,
        message: 'Inquiry click successfully tracked with client IP.',
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to track click event' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getNeonSqlClient } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/session';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
  Pragma: 'no-cache',
};

/**
 * GET /api/leads - Fetch customer inquiry leads for admin or provider
 */
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401, headers: NO_STORE_HEADERS });
  }

  try {
    const sql = getNeonSqlClient();
    const isAdmin = session.role === 'SUPER_ADMIN' || session.role === 'AGENT';

    const rows = isAdmin
      ? await sql`SELECT * FROM leads ORDER BY created_at DESC LIMIT 200;`
      : await sql`
          SELECT * FROM leads
          WHERE provider_id::text = ${session.id} OR customer_id::text = ${session.id}
          ORDER BY created_at DESC
          LIMIT 100;
        `;

    return NextResponse.json({ success: true, leads: rows, count: rows.length }, { headers: NO_STORE_HEADERS });
  } catch (error: any) {
    console.error('Leads GET error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to fetch leads' }, { status: 500, headers: NO_STORE_HEADERS });
  }
}

/**
 * POST /api/leads - Record a Call / WhatsApp / Quote lead in Neon DB
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const {
      listingId,
      listingTitle,
      category,
      providerId,
      providerName,
      customerName,
      customerPhone,
      actionType,
      city,
      notes,
    } = body;

    const sql = getNeonSqlClient();
    const safeUuid = (v: any) => (v && /^[0-9a-f-]{36}$/i.test(String(v)) ? String(v) : null);

    const inserted = await sql`
      INSERT INTO leads (
        listing_id, listing_title, category, provider_id, provider_name,
        customer_id, customer_name, customer_phone, action_type, city, notes, status
      ) VALUES (
        ${listingId || null},
        ${listingTitle || 'Listing Inquiry'},
        ${category || 'car'},
        ${safeUuid(providerId) ? sql`${safeUuid(providerId)}::uuid` : sql`NULL`},
        ${providerName || 'SafarPK Partner'},
        ${session?.id ? sql`${session.id}::uuid` : sql`NULL`},
        ${customerName || session?.name || 'Guest Visitor'},
        ${customerPhone || session?.phone || null},
        ${actionType || 'WHATSAPP'},
        ${city || session?.city || 'Karachi'},
        ${notes || null},
        'NEW'
      )
      RETURNING *;
    `;

    return NextResponse.json({ success: true, lead: inserted[0] }, { status: 201, headers: NO_STORE_HEADERS });
  } catch (error: any) {
    console.error('Leads POST error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to save lead' }, { status: 500, headers: NO_STORE_HEADERS });
  }
}


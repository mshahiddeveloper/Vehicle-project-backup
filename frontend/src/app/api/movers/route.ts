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
 * GET /api/movers - Fetch Home Shifting & Cargo movers from Neon DB
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get('city');
    const providerId = searchParams.get('providerId');
    const includePaused = searchParams.get('includePaused') === 'true';

    const sql = getNeonSqlClient();

    let rows;
    if (providerId) {
      rows = await sql`
        SELECT m.*, u.phone as owner_phone
        FROM mover_listings m
        LEFT JOIN users u ON u.id = m.provider_id
        WHERE m.provider_id::text = ${providerId}
        ORDER BY m.created_at DESC;
      `;
    } else if (city && city !== 'All Cities' && city !== 'All') {
      rows = await sql`
        SELECT m.*, u.phone as owner_phone
        FROM mover_listings m
        LEFT JOIN users u ON u.id = m.provider_id
        WHERE (${includePaused} OR (m.is_paused = false AND COALESCE(u.is_blocked, false) = false))
          AND LOWER(m.city) = LOWER(${city})
        ORDER BY m.rating DESC NULLS LAST, m.created_at DESC
        LIMIT 100;
      `;
    } else {
      rows = await sql`
        SELECT m.*, u.phone as owner_phone
        FROM mover_listings m
        LEFT JOIN users u ON u.id = m.provider_id
        WHERE (${includePaused} OR (m.is_paused = false AND COALESCE(u.is_blocked, false) = false))
        ORDER BY m.rating DESC NULLS LAST, m.created_at DESC
        LIMIT 100;
      `;
    }

    return NextResponse.json({ success: true, movers: rows, count: rows.length }, { headers: NO_STORE_HEADERS });
  } catch (error: any) {
    console.error('Movers GET error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to fetch movers' }, { status: 500, headers: NO_STORE_HEADERS });
  }
}

/**
 * POST /api/movers - Create mover listing OR submit a moving quote
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const sql = getNeonSqlClient();

    // Mode 1: Customer submitting a Moving Quote request
    if (body.action === 'quote') {
      const session = await getSessionFromRequest(req);
      const {
        providerId,
        city,
        serviceType,
        pickupAddress,
        dropoffAddress,
        estimatedDistanceKm,
        truckType,
        helpersCount,
        floorNumber,
        hasElevator,
        quotedPricePkr,
        customerPhone,
      } = body;

      const insertedQuote = await sql`
        INSERT INTO moving_quotes (
          customer_id, provider_id, city, service_type, pickup_address, dropoff_address,
          estimated_distance_km, truck_type, helpers_count, floor_number, has_elevator,
          quoted_price_pkr, customer_phone
        ) VALUES (
          ${session?.id ? sql`${session.id}::uuid` : sql`NULL`},
          ${providerId && /^[0-9a-f-]{36}$/i.test(providerId) ? sql`${providerId}::uuid` : sql`NULL`},
          ${city || 'Karachi'},
          ${serviceType || 'Home Shifting'},
          ${pickupAddress || 'Origin Address'},
          ${dropoffAddress || 'Destination Address'},
          ${Number(estimatedDistanceKm || 15)},
          ${truckType || 'Shehzore (2.5 Ton)'},
          ${Number(helpersCount || 2)},
          ${Number(floorNumber || 0)},
          ${Boolean(hasElevator)},
          ${Number(quotedPricePkr || 8300)},
          ${customerPhone || session?.phone || ''}
        )
        RETURNING *;
      `;

      return NextResponse.json({ success: true, quote: insertedQuote[0] }, { status: 201, headers: NO_STORE_HEADERS });
    }

    // Mode 2: Provider publishing a Mover Fleet listing
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401, headers: NO_STORE_HEADERS });
    }

    const {
      companyName,
      category,
      city,
      trucks,
      truckType,
      baseRatePkr,
      perKmRatePkr,
      perHelperRatePkr,
      maxHelpers,
      features,
      phone,
    } = body;

    if (!companyName) {
      return NextResponse.json({ success: false, error: 'Company name is required.' }, { status: 400, headers: NO_STORE_HEADERS });
    }

    const inserted = await sql`
      INSERT INTO mover_listings (
        provider_id, company_name, category, city, trucks, truck_type,
        base_rate_pkr, per_km_rate_pkr, per_helper_rate_pkr, max_helpers,
        features, phone, is_paused, rating
      ) VALUES (
        ${session.id}::uuid,
        ${companyName},
        ${category || 'Home Shifting'},
        ${city || session.city || 'Karachi'},
        ${trucks || 'Hyundai Shehzore & Mazda Titan'},
        ${truckType || 'Shehzore (2.5 Ton)'},
        ${Number(baseRatePkr || 4500)},
        ${Number(perKmRatePkr || 120)},
        ${Number(perHelperRatePkr || 1000)},
        ${Number(maxHelpers || 6)},
        ${Array.isArray(features) ? features : ['Furniture blankets included', 'Trained loaders']},
        ${phone || session.phone},
        false,
        4.8
      )
      RETURNING *;
    `;

    return NextResponse.json({ success: true, mover: inserted[0] }, { status: 201, headers: NO_STORE_HEADERS });
  } catch (error: any) {
    console.error('Movers POST error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to process mover request' }, { status: 500, headers: NO_STORE_HEADERS });
  }
}

/**
 * PATCH /api/movers - Update or pause mover listing
 */
export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401, headers: NO_STORE_HEADERS });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { id, isPaused, baseRatePkr, perKmRatePkr } = body;
    if (!id) return NextResponse.json({ success: false, error: 'Mover ID required' }, { status: 400, headers: NO_STORE_HEADERS });

    const sql = getNeonSqlClient();
    const isAdmin = session.role === 'SUPER_ADMIN' || session.role === 'AGENT';

    const updated = await sql`
      UPDATE mover_listings
      SET
        is_paused = COALESCE(${typeof isPaused === 'boolean' ? isPaused : null}, is_paused),
        base_rate_pkr = COALESCE(${baseRatePkr !== undefined ? Number(baseRatePkr) : null}, base_rate_pkr),
        per_km_rate_pkr = COALESCE(${perKmRatePkr !== undefined ? Number(perKmRatePkr) : null}, per_km_rate_pkr),
        updated_at = NOW()
      WHERE id::text = ${id}
        AND (${isAdmin} OR provider_id::text = ${session.id})
      RETURNING *;
    `;

    return NextResponse.json({ success: updated.length > 0, mover: updated[0] || null }, { headers: NO_STORE_HEADERS });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500, headers: NO_STORE_HEADERS });
  }
}

/**
 * DELETE /api/movers?id=...
 */
export async function DELETE(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401, headers: NO_STORE_HEADERS });
  }

  try {
    const id = new URL(req.url).searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'ID required' }, { status: 400, headers: NO_STORE_HEADERS });
    const sql = getNeonSqlClient();
    const isAdmin = session.role === 'SUPER_ADMIN' || session.role === 'AGENT';
    const del = await sql`DELETE FROM mover_listings WHERE id::text = ${id} AND (${isAdmin} OR provider_id::text = ${session.id}) RETURNING id;`;
    return NextResponse.json({ success: del.length > 0 }, { headers: NO_STORE_HEADERS });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500, headers: NO_STORE_HEADERS });
  }
}


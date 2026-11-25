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
 * GET /api/shuttles - Fetch Pick & Drop shuttle routes from Neon DB
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get('city');
    const providerId = searchParams.get('providerId');
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const sql = getNeonSqlClient();

    let rows;
    if (providerId) {
      rows = await sql`
        SELECT
          s.*,
          COALESCE(s.operator_name, u.business_name, u.full_name, 'SafarPK Shuttle') as operator,
          COALESCE(s.phone, u.phone) as operator_phone
        FROM shuttle_routes s
        LEFT JOIN users u ON u.id = s.provider_id
        WHERE s.provider_id::text = ${providerId}
        ORDER BY s.created_at DESC;
      `;
    } else if (city && city !== 'All Cities' && city !== 'All') {
      rows = await sql`
        SELECT
          s.*,
          COALESCE(s.operator_name, u.business_name, u.full_name, 'SafarPK Shuttle') as operator,
          COALESCE(s.phone, u.phone) as operator_phone
        FROM shuttle_routes s
        LEFT JOIN users u ON u.id = s.provider_id
        WHERE (${includeInactive} OR (s.is_active = true AND COALESCE(u.is_blocked, false) = false))
          AND LOWER(s.city) = LOWER(${city})
        ORDER BY s.created_at DESC
        LIMIT 100;
      `;
    } else {
      rows = await sql`
        SELECT
          s.*,
          COALESCE(s.operator_name, u.business_name, u.full_name, 'SafarPK Shuttle') as operator,
          COALESCE(s.phone, u.phone) as operator_phone
        FROM shuttle_routes s
        LEFT JOIN users u ON u.id = s.provider_id
        WHERE (${includeInactive} OR (s.is_active = true AND COALESCE(u.is_blocked, false) = false))
        ORDER BY s.created_at DESC
        LIMIT 100;
      `;
    }

    return NextResponse.json({ success: true, shuttles: rows, count: rows.length }, { headers: NO_STORE_HEADERS });
  } catch (error: any) {
    console.error('Shuttles GET error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to fetch shuttle routes' }, { status: 500, headers: NO_STORE_HEADERS });
  }
}

/**
 * POST /api/shuttles - Create a Pick & Drop shuttle route in Neon DB
 */
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401, headers: NO_STORE_HEADERS });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const {
      city,
      routeName,
      vehicleModel,
      totalSeats,
      availableSeats,
      pickupStops,
      dropoffStops,
      morningDepartureTime,
      eveningReturnTime,
      monthlyFarePkr,
      operatorName,
      phone,
      category,
    } = body;

    if (!routeName) {
      return NextResponse.json({ success: false, error: 'Route name is required.' }, { status: 400, headers: NO_STORE_HEADERS });
    }

    const sql = getNeonSqlClient();
    const inserted = await sql`
      INSERT INTO shuttle_routes (
        provider_id, city, route_name, vehicle_model, total_seats, available_seats,
        pickup_stops, dropoff_stops, morning_departure_time, evening_return_time,
        monthly_fare_pkr, is_active, operator_name, phone, category, rating
      ) VALUES (
        ${session.id}::uuid,
        ${city || session.city || 'Karachi'},
        ${routeName},
        ${vehicleModel || 'Toyota Hiace AC'},
        ${Number(totalSeats || 14)},
        ${Number(availableSeats || totalSeats || 14)},
        ${Array.isArray(pickupStops) ? pickupStops : ['Main Stop']},
        ${Array.isArray(dropoffStops) ? dropoffStops : ['Destination Hub']},
        ${morningDepartureTime || '07:45'},
        ${eveningReturnTime || '17:30'},
        ${Number(monthlyFarePkr || 14000)},
        true,
        ${operatorName || session.name},
        ${phone || session.phone},
        ${category || 'Office & Corporate'},
        4.8
      )
      RETURNING *;
    `;

    return NextResponse.json({ success: true, shuttle: inserted[0] }, { status: 201, headers: NO_STORE_HEADERS });
  } catch (error: any) {
    console.error('Shuttles POST error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to create shuttle route' }, { status: 500, headers: NO_STORE_HEADERS });
  }
}

/**
 * PATCH /api/shuttles - Toggle active/paused or update fare/seats
 */
export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401, headers: NO_STORE_HEADERS });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { id, isActive, availableSeats, monthlyFarePkr } = body;
    if (!id) return NextResponse.json({ success: false, error: 'Shuttle ID required' }, { status: 400, headers: NO_STORE_HEADERS });

    const sql = getNeonSqlClient();
    const isAdmin = session.role === 'SUPER_ADMIN' || session.role === 'AGENT';

    const updated = await sql`
      UPDATE shuttle_routes
      SET
        is_active = COALESCE(${typeof isActive === 'boolean' ? isActive : null}, is_active),
        available_seats = COALESCE(${availableSeats !== undefined ? Number(availableSeats) : null}, available_seats),
        monthly_fare_pkr = COALESCE(${monthlyFarePkr !== undefined ? Number(monthlyFarePkr) : null}, monthly_fare_pkr)
      WHERE id::text = ${id}
        AND (${isAdmin} OR provider_id::text = ${session.id})
      RETURNING *;
    `;

    return NextResponse.json({ success: updated.length > 0, shuttle: updated[0] || null }, { headers: NO_STORE_HEADERS });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to update shuttle' }, { status: 500, headers: NO_STORE_HEADERS });
  }
}

/**
 * DELETE /api/shuttles?id=...
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
    const del = await sql`DELETE FROM shuttle_routes WHERE id::text = ${id} AND (${isAdmin} OR provider_id::text = ${session.id}) RETURNING id;`;
    return NextResponse.json({ success: del.length > 0 }, { headers: NO_STORE_HEADERS });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500, headers: NO_STORE_HEADERS });
  }
}


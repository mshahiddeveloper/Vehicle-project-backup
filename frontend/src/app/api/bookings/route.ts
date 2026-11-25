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
 * GET /api/bookings - Fetch bookings for current user (customer, lister, driver, or admin)
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
      ? await sql`
          SELECT b.*, cu.full_name as customer_name, cu.phone as customer_phone,
                 lu.full_name as lister_name, lu.phone as lister_phone
          FROM bookings b
          LEFT JOIN users cu ON cu.id = b.customer_id
          LEFT JOIN users lu ON lu.id = b.lister_id
          ORDER BY b.created_at DESC
          LIMIT 200;
        `
      : await sql`
          SELECT b.*, cu.full_name as customer_name, cu.phone as customer_phone,
                 lu.full_name as lister_name, lu.phone as lister_phone
          FROM bookings b
          LEFT JOIN users cu ON cu.id = b.customer_id
          LEFT JOIN users lu ON lu.id = b.lister_id
          WHERE b.customer_id::text = ${session.id}
             OR b.lister_id::text = ${session.id}
             OR b.driver_id::text = ${session.id}
          ORDER BY b.created_at DESC
          LIMIT 100;
        `;

    return NextResponse.json({ success: true, bookings: rows, count: rows.length }, { headers: NO_STORE_HEADERS });
  } catch (error: any) {
    console.error('Bookings GET error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to fetch bookings' }, { status: 500, headers: NO_STORE_HEADERS });
  }
}

/**
 * POST /api/bookings - Create a new booking in Neon DB
 */
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Login required to create booking' }, { status: 401, headers: NO_STORE_HEADERS });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const {
      listerId,
      driverId,
      vehicleId,
      serviceType,
      startDate,
      endDate,
      pickupLocation,
      dropoffLocation,
      totalAmountPkr,
    } = body;

    const sql = getNeonSqlClient();
    const ref = `BKG-${Date.now().toString().slice(-6)}`;
    const safeUuid = (v: any) => (v && /^[0-9a-f-]{36}$/i.test(String(v)) ? String(v) : null);

    const inserted = await sql`
      INSERT INTO bookings (
        booking_reference, customer_id, lister_id, driver_id, service_type,
        vehicle_id, start_date, end_date, pickup_location, dropoff_location,
        total_amount_pkr, payment_status, booking_status
      ) VALUES (
        ${ref},
        ${session.id}::uuid,
        ${safeUuid(listerId) ? sql`${safeUuid(listerId)}::uuid` : sql`NULL`},
        ${safeUuid(driverId) ? sql`${safeUuid(driverId)}::uuid` : sql`NULL`},
        ${serviceType || 'RENT_A_CAR'},
        ${safeUuid(vehicleId) ? sql`${safeUuid(vehicleId)}::uuid` : sql`NULL`},
        ${startDate || new Date().toISOString().slice(0, 10)}::date,
        ${endDate || new Date().toISOString().slice(0, 10)}::date,
        ${pickupLocation || session.city || 'Karachi'},
        ${dropoffLocation || pickupLocation || session.city || 'Karachi'},
        ${Number(totalAmountPkr || 0)},
        'PAY_AT_HANDOVER',
        'PENDING'
      )
      RETURNING *;
    `;

    return NextResponse.json({ success: true, booking: inserted[0] }, { status: 201, headers: NO_STORE_HEADERS });
  } catch (error: any) {
    console.error('Bookings POST error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to create booking' }, { status: 500, headers: NO_STORE_HEADERS });
  }
}

/**
 * PATCH /api/bookings - Update booking status (CONFIRMED, COMPLETED, CANCELLED)
 */
export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401, headers: NO_STORE_HEADERS });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { id, bookingStatus } = body;
    if (!id || !bookingStatus) {
      return NextResponse.json({ success: false, error: 'Booking ID and status are required' }, { status: 400, headers: NO_STORE_HEADERS });
    }

    const sql = getNeonSqlClient();
    const isAdmin = session.role === 'SUPER_ADMIN' || session.role === 'AGENT';

    const updated = await sql`
      UPDATE bookings
      SET booking_status = ${bookingStatus}::booking_status_enum, updated_at = NOW()
      WHERE id::text = ${id}
        AND (${isAdmin} OR customer_id::text = ${session.id} OR lister_id::text = ${session.id} OR driver_id::text = ${session.id})
      RETURNING *;
    `;

    return NextResponse.json({ success: updated.length > 0, booking: updated[0] || null }, { headers: NO_STORE_HEADERS });
  } catch (error: any) {
    console.error('Bookings PATCH error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to update booking' }, { status: 500, headers: NO_STORE_HEADERS });
  }
}


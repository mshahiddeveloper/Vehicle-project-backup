import { NextRequest, NextResponse } from 'next/server';
import { getNeonSqlClient } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/session';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/intercity - Search and list scheduled intercity trips (Vertical 3 - City to City)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const origin = searchParams.get('originCity') || searchParams.get('from');
    const destination = searchParams.get('destinationCity') || searchParams.get('to');

    const sql = getNeonSqlClient();

    let trips;
    if (origin && destination) {
      trips = await sql`
        SELECT 
          t.id,
          t.provider_id,
          t.origin_city,
          t.destination_city,
          t.route_via,
          t.departure_time,
          t.vehicle_type,
          t.total_seats,
          t.available_seats,
          t.per_seat_fare_pkr,
          t.status,
          t.created_at,
          u.full_name as provider_name,
          u.phone as provider_phone
        FROM intercity_trips t
        JOIN users u ON u.id = t.provider_id
        WHERE 
          LOWER(t.origin_city) = LOWER(${origin})
          AND LOWER(t.destination_city) = LOWER(${destination})
          AND t.status = 'SCHEDULED'
          AND t.available_seats > 0
        ORDER BY t.departure_time ASC;
      `;
    } else if (origin) {
      trips = await sql`
        SELECT 
          t.id,
          t.provider_id,
          t.origin_city,
          t.destination_city,
          t.route_via,
          t.departure_time,
          t.vehicle_type,
          t.total_seats,
          t.available_seats,
          t.per_seat_fare_pkr,
          t.status,
          t.created_at,
          u.full_name as provider_name,
          u.phone as provider_phone
        FROM intercity_trips t
        JOIN users u ON u.id = t.provider_id
        WHERE 
          LOWER(t.origin_city) = LOWER(${origin})
          AND t.status = 'SCHEDULED'
          AND t.available_seats > 0
        ORDER BY t.departure_time ASC;
      `;
    } else {
      trips = await sql`
        SELECT 
          t.id,
          t.provider_id,
          t.origin_city,
          t.destination_city,
          t.route_via,
          t.departure_time,
          t.vehicle_type,
          t.total_seats,
          t.available_seats,
          t.per_seat_fare_pkr,
          t.status,
          t.created_at,
          u.full_name as provider_name,
          u.phone as provider_phone
        FROM intercity_trips t
        JOIN users u ON u.id = t.provider_id
        WHERE t.status = 'SCHEDULED' AND t.available_seats > 0
        ORDER BY t.departure_time ASC
        LIMIT 50;
      `;
    }

    return NextResponse.json({
      success: true,
      trips,
      count: trips.length,
    });
  } catch (error: any) {
    console.error('Intercity GET error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch intercity trips' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/intercity - Provider schedules a new intercity route
 */
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Login required' }, { status: 401 });
  }

  if (session.role !== 'PROVIDER' && session.role !== 'LISTER' && session.role !== 'SUPER_ADMIN') {
    return NextResponse.json(
      { success: false, error: 'Only verified mobility providers or hosts can schedule intercity routes.' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const {
      originCity,
      destinationCity,
      routeVia,
      departureTime,
      vehicleType,
      totalSeats = 4,
      perSeatFarePkr,
    } = body;

    if (!originCity || !destinationCity || !routeVia || !departureTime || !perSeatFarePkr) {
      return NextResponse.json(
        { success: false, error: 'originCity, destinationCity, routeVia, departureTime, and perSeatFarePkr are required.' },
        { status: 400 }
      );
    }

    const sql = getNeonSqlClient();
    const rows = await sql`
      INSERT INTO intercity_trips (
        provider_id,
        origin_city,
        destination_city,
        route_via,
        departure_time,
        vehicle_type,
        total_seats,
        available_seats,
        per_seat_fare_pkr,
        status,
        created_at
      ) VALUES (
        ${session.id},
        ${originCity.trim()},
        ${destinationCity.trim()},
        ${routeVia.trim()},
        ${new Date(departureTime).toISOString()}::timestamptz,
        ${vehicleType || 'Executive Sedan'},
        ${parseInt(totalSeats, 10) || 4},
        ${parseInt(totalSeats, 10) || 4},
        ${parseFloat(perSeatFarePkr)},
        'SCHEDULED',
        NOW()
      )
      RETURNING id, origin_city, destination_city, departure_time, per_seat_fare_pkr;
    `;

    return NextResponse.json({
      success: true,
      trip: rows[0],
      message: 'Intercity trip scheduled successfully.',
    });
  } catch (error: any) {
    console.error('Intercity POST error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to schedule intercity trip' },
      { status: 500 }
    );
  }
}


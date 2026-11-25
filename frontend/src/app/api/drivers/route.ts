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
 * GET /api/drivers - Fetch verified chauffeur / driver profiles from Neon DB
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get('city');
    const userId = searchParams.get('userId');
    const includePaused = searchParams.get('includePaused') === 'true';

    const sql = getNeonSqlClient();

    let rows;
    if (userId) {
      rows = await sql`
        SELECT
          c.*,
          COALESCE(c.full_name, u.full_name, 'Verified Captain') as name,
          COALESCE(c.phone, u.phone) as driver_phone,
          u.kyc_status,
          u.is_blocked
        FROM chauffeur_profiles c
        LEFT JOIN users u ON u.id = c.user_id
        WHERE c.user_id::text = ${userId} OR c.id::text = ${userId}
        ORDER BY c.created_at DESC;
      `;
    } else if (city && city !== 'All Cities' && city !== 'All') {
      rows = await sql`
        SELECT
          c.*,
          COALESCE(c.full_name, u.full_name, 'Verified Captain') as name,
          COALESCE(c.phone, u.phone) as driver_phone,
          u.kyc_status,
          u.is_blocked
        FROM chauffeur_profiles c
        LEFT JOIN users u ON u.id = c.user_id
        WHERE (${includePaused} OR (COALESCE(c.is_paused, false) = false AND COALESCE(u.is_blocked, false) = false))
          AND LOWER(c.city) = LOWER(${city})
        ORDER BY c.rating DESC NULLS LAST, c.created_at DESC
        LIMIT 100;
      `;
    } else {
      rows = await sql`
        SELECT
          c.*,
          COALESCE(c.full_name, u.full_name, 'Verified Captain') as name,
          COALESCE(c.phone, u.phone) as driver_phone,
          u.kyc_status,
          u.is_blocked
        FROM chauffeur_profiles c
        LEFT JOIN users u ON u.id = c.user_id
        WHERE (${includePaused} OR (COALESCE(c.is_paused, false) = false AND COALESCE(u.is_blocked, false) = false))
        ORDER BY c.rating DESC NULLS LAST, c.created_at DESC
        LIMIT 100;
      `;
    }

    return NextResponse.json(
      { success: true, drivers: rows, count: rows.length },
      { headers: NO_STORE_HEADERS }
    );
  } catch (error: any) {
    console.error('Drivers GET error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to fetch drivers' }, { status: 500, headers: NO_STORE_HEADERS });
  }
}

/**
 * POST /api/drivers - Create or update chauffeur profile for logged-in driver
 */
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Login required' }, { status: 401, headers: NO_STORE_HEADERS });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const {
      fullName,
      city,
      experienceYears,
      languages,
      hourlyRatePkr,
      daily12hRatePkr,
      outstationDailyRatePkr,
      dutyStatus,
      vehicleExpertise,
      phone,
    } = body;

    const sql = getNeonSqlClient();
    const existing = await sql`SELECT id FROM chauffeur_profiles WHERE user_id::text = ${session.id} LIMIT 1`;

    if (existing.length > 0) {
      const updated = await sql`
        UPDATE chauffeur_profiles
        SET
          full_name = COALESCE(${fullName || null}, full_name),
          city = COALESCE(${city || null}, city),
          experience_years = COALESCE(${experienceYears !== undefined ? Number(experienceYears) : null}, experience_years),
          languages = COALESCE(${Array.isArray(languages) ? languages : null}, languages),
          hourly_rate_pkr = COALESCE(${hourlyRatePkr !== undefined ? Number(hourlyRatePkr) : null}, hourly_rate_pkr),
          daily_12h_rate_pkr = COALESCE(${daily12hRatePkr !== undefined ? Number(daily12hRatePkr) : null}, daily_12h_rate_pkr),
          outstation_daily_rate_pkr = COALESCE(${outstationDailyRatePkr !== undefined ? Number(outstationDailyRatePkr) : null}, outstation_daily_rate_pkr),
          duty_status = COALESCE(${dutyStatus || null}, duty_status),
          vehicle_expertise = COALESCE(${Array.isArray(vehicleExpertise) ? vehicleExpertise : null}, vehicle_expertise),
          phone = COALESCE(${phone || null}, phone)
        WHERE id = ${existing[0].id}
        RETURNING *;
      `;
      return NextResponse.json({ success: true, driver: updated[0] }, { headers: NO_STORE_HEADERS });
    }

    const inserted = await sql`
      INSERT INTO chauffeur_profiles (
        user_id, full_name, phone, city, experience_years, languages,
        hourly_rate_pkr, daily_12h_rate_pkr, outstation_daily_rate_pkr,
        duty_status, verified_chauffeur, vehicle_expertise, rating, is_paused
      ) VALUES (
        ${session.id}::uuid,
        ${fullName || session.name},
        ${phone || session.phone},
        ${city || session.city || 'Karachi'},
        ${Number(experienceYears || 5)},
        ${Array.isArray(languages) ? languages : ['Urdu', 'English']},
        ${Number(hourlyRatePkr || 600)},
        ${Number(daily12hRatePkr || 3000)},
        ${Number(outstationDailyRatePkr || 4000)},
        ${dutyStatus || 'AVAILABLE'},
        true,
        ${Array.isArray(vehicleExpertise) ? vehicleExpertise : ['Sedan', 'SUV']},
        4.9,
        false
      )
      RETURNING *;
    `;

    return NextResponse.json({ success: true, driver: inserted[0] }, { status: 201, headers: NO_STORE_HEADERS });
  } catch (error: any) {
    console.error('Drivers POST error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to save driver profile' }, { status: 500, headers: NO_STORE_HEADERS });
  }
}

/**
 * PATCH /api/drivers - Update driver duty status or pause state
 */
export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401, headers: NO_STORE_HEADERS });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { id, dutyStatus, isPaused } = body;
    const sql = getNeonSqlClient();
    const isAdmin = session.role === 'SUPER_ADMIN' || session.role === 'AGENT';

    const updated = await sql`
      UPDATE chauffeur_profiles
      SET
        duty_status = COALESCE(${dutyStatus || null}, duty_status),
        is_paused = COALESCE(${typeof isPaused === 'boolean' ? isPaused : null}, is_paused)
      WHERE (${id ? sql`id::text = ${id}` : sql`user_id::text = ${session.id}`})
        AND (${isAdmin} OR user_id::text = ${session.id})
      RETURNING *;
    `;

    return NextResponse.json({ success: updated.length > 0, driver: updated[0] || null }, { headers: NO_STORE_HEADERS });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to update driver' }, { status: 500, headers: NO_STORE_HEADERS });
  }
}


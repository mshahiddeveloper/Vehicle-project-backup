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
 * GET /api/listings - Fetch active vehicle listings (or owner's listings) from Neon DB
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get('city');
    const category = searchParams.get('category');
    const ownerId = searchParams.get('ownerId');
    const includePaused = searchParams.get('includePaused') === 'true';

    const sql = getNeonSqlClient();

    let rows;
    if (ownerId) {
      rows = await sql`
        SELECT 
          v.id, v.owner_id, v.title, v.brand, v.model, v.model_year, v.category,
          v.registration_number, v.city, v.pickup_address, v.daily_rate_pkr,
          v.with_driver, v.transmission, v.fuel_type, v.is_paused, v.pause_reason,
          v.image_gallery, v.created_at,
          u.full_name as owner_name, u.business_name, u.phone as owner_phone, u.city as owner_city
        FROM vehicle_listings v
        LEFT JOIN users u ON u.id = v.owner_id
        WHERE v.owner_id::text = ${ownerId}
        ORDER BY v.created_at DESC;
      `;
    } else if (city && city !== 'All Cities' && city !== 'All') {
      rows = await sql`
        SELECT 
          v.id, v.owner_id, v.title, v.brand, v.model, v.model_year, v.category,
          v.registration_number, v.city, v.pickup_address, v.daily_rate_pkr,
          v.with_driver, v.transmission, v.fuel_type, v.is_paused, v.pause_reason,
          v.image_gallery, v.created_at,
          u.full_name as owner_name, u.business_name, u.phone as owner_phone, u.city as owner_city
        FROM vehicle_listings v
        LEFT JOIN users u ON u.id = v.owner_id
        WHERE (${includePaused} OR (v.is_paused = false AND COALESCE(u.is_blocked, false) = false))
          AND LOWER(v.city) = LOWER(${city})
        ORDER BY v.created_at DESC
        LIMIT 100;
      `;
    } else {
      rows = await sql`
        SELECT 
          v.id, v.owner_id, v.title, v.brand, v.model, v.model_year, v.category,
          v.registration_number, v.city, v.pickup_address, v.daily_rate_pkr,
          v.with_driver, v.transmission, v.fuel_type, v.is_paused, v.pause_reason,
          v.image_gallery, v.created_at,
          u.full_name as owner_name, u.business_name, u.phone as owner_phone, u.city as owner_city
        FROM vehicle_listings v
        LEFT JOIN users u ON u.id = v.owner_id
        WHERE (${includePaused} OR (v.is_paused = false AND COALESCE(u.is_blocked, false) = false))
        ORDER BY v.created_at DESC
        LIMIT 100;
      `;
    }

    const filtered = category && category !== 'All' && category !== 'All Cars'
      ? rows.filter((r: any) => (r.category || '').toLowerCase().includes(category.toLowerCase()))
      : rows;

    return NextResponse.json(
      { success: true, listings: filtered, count: filtered.length },
      { headers: NO_STORE_HEADERS }
    );
  } catch (error: any) {
    console.error('Listings GET error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch listings' },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

/**
 * POST /api/listings - Create a new vehicle listing in Neon DB
 */
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Login required' }, { status: 401, headers: NO_STORE_HEADERS });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const {
      title,
      brand,
      model,
      modelYear,
      category,
      registrationNumber,
      city,
      pickupAddress,
      dailyRatePkr,
      withDriver,
      transmission,
      fuelType,
      imageGallery,
    } = body;

    if (!title && !(brand && model)) {
      return NextResponse.json({ success: false, error: 'Vehicle title or brand/model is required.' }, { status: 400, headers: NO_STORE_HEADERS });
    }

    const sql = getNeonSqlClient();
    const targetCity = city || session.city || 'Karachi';

    if (session.role !== 'SUPER_ADMIN' && session.role !== 'AGENT') {
      try {
        const policyRows = await sql`SELECT value FROM system_settings WHERE key = 'partner_city_policy' LIMIT 1;`;
        if (policyRows.length > 0 && policyRows[0].value?.partnerCityMode === 'SELECTED') {
          const allowed: string[] = Array.isArray(policyRows[0].value.allowedPartnerCities)
            ? policyRows[0].value.allowedPartnerCities
            : [];
          if (allowed.length > 0 && !allowed.some((c) => String(c).toLowerCase() === String(targetCity).toLowerCase())) {
            return NextResponse.json(
              {
                success: false,
                error: `Listing in ${targetCity} is restricted by Admin. Allowed partner cities: ${allowed.join(', ')}.`,
              },
              { status: 403, headers: NO_STORE_HEADERS }
            );
          }
        }
      } catch {}
    }

    const resolvedTitle = title || `${brand} ${model} ${modelYear || 2024}`.trim();
    const images: string[] = Array.isArray(imageGallery) ? imageGallery.filter(Boolean) : [];

    const inserted = await sql`
      INSERT INTO vehicle_listings (
        owner_id, title, brand, model, model_year, category,
        registration_number, city, pickup_address, daily_rate_pkr,
        with_driver, transmission, fuel_type, is_paused, image_gallery
      ) VALUES (
        ${session.id}::uuid,
        ${resolvedTitle},
        ${brand || resolvedTitle.split(' ')[0] || 'Toyota'},
        ${model || resolvedTitle.split(' ').slice(1).join(' ') || 'Sedan'},
        ${Number(modelYear || 2024)},
        ${category || 'Sedan'},
        ${registrationNumber || null},
        ${city || session.city || 'Karachi'},
        ${pickupAddress || `${city || session.city || 'Karachi'} Central`},
        ${Number(dailyRatePkr || 6500)},
        ${Boolean(withDriver)},
        ${transmission || 'Automatic'},
        ${fuelType || 'Petrol'},
        false,
        ${images}
      )
      RETURNING *;
    `;

    return NextResponse.json(
      { success: true, listing: inserted[0], message: 'Vehicle listing published to Neon DB.' },
      { status: 201, headers: NO_STORE_HEADERS }
    );
  } catch (error: any) {
    console.error('Listings POST error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create listing' },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

/**
 * PATCH /api/listings - Update or pause/unpause a vehicle listing
 */
export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401, headers: NO_STORE_HEADERS });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { id, isPaused, pauseReason, dailyRatePkr, title, city, category, transmission } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Listing ID is required.' }, { status: 400, headers: NO_STORE_HEADERS });
    }

    const sql = getNeonSqlClient();
    const isAdmin = session.role === 'SUPER_ADMIN' || session.role === 'AGENT';

    const updated = await sql`
      UPDATE vehicle_listings
      SET
        is_paused = COALESCE(${typeof isPaused === 'boolean' ? isPaused : null}, is_paused),
        pause_reason = COALESCE(${pauseReason !== undefined ? pauseReason : null}, pause_reason),
        daily_rate_pkr = COALESCE(${dailyRatePkr !== undefined ? Number(dailyRatePkr) : null}, daily_rate_pkr),
        title = COALESCE(${title || null}, title),
        city = COALESCE(${city || null}, city),
        category = COALESCE(${category || null}, category),
        transmission = COALESCE(${transmission || null}, transmission),
        updated_at = NOW()
      WHERE id::text = ${id}
        AND (${isAdmin} OR owner_id::text = ${session.id})
      RETURNING *;
    `;

    if (updated.length === 0) {
      return NextResponse.json({ success: false, error: 'Listing not found or unauthorized.' }, { status: 404, headers: NO_STORE_HEADERS });
    }

    return NextResponse.json({ success: true, listing: updated[0] }, { headers: NO_STORE_HEADERS });
  } catch (error: any) {
    console.error('Listings PATCH error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to update listing' }, { status: 500, headers: NO_STORE_HEADERS });
  }
}

/**
 * DELETE /api/listings?id=... - Remove a vehicle listing
 */
export async function DELETE(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401, headers: NO_STORE_HEADERS });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Listing ID required' }, { status: 400, headers: NO_STORE_HEADERS });
    }

    const sql = getNeonSqlClient();
    const isAdmin = session.role === 'SUPER_ADMIN' || session.role === 'AGENT';

    const deleted = await sql`
      DELETE FROM vehicle_listings
      WHERE id::text = ${id}
        AND (${isAdmin} OR owner_id::text = ${session.id})
      RETURNING id;
    `;

    return NextResponse.json(
      { success: deleted.length > 0, deletedId: id },
      { headers: NO_STORE_HEADERS }
    );
  } catch (error: any) {
    console.error('Listings DELETE error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to delete listing' }, { status: 500, headers: NO_STORE_HEADERS });
  }
}

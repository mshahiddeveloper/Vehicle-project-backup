import { NextRequest, NextResponse } from 'next/server';
import { getNeonSqlClient } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/listings/[id] - Fetch detailed vehicle listing from Neon DB
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const listingId = params.id;
    if (!listingId) {
      return NextResponse.json({ success: false, error: 'Listing ID is required' }, { status: 400 });
    }

    const sql = getNeonSqlClient();

    // Query vehicle listing with owner details
    const rows = await sql`
      SELECT 
        v.id,
        v.owner_id,
        v.title,
        v.brand,
        v.model,
        v.model_year,
        v.category,
        v.registration_number,
        v.city,
        v.pickup_address,
        v.daily_rate_pkr,
        v.with_driver,
        v.transmission,
        v.fuel_type,
        v.is_paused,
        v.pause_reason,
        v.image_gallery,
        v.created_at,
        u.full_name as owner_name,
        u.business_name,
        u.phone as owner_phone,
        u.city as owner_city
      FROM vehicle_listings v
      LEFT JOIN users u ON u.id = v.owner_id
      WHERE v.id::text = ${listingId}
      LIMIT 1;
    `;

    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Listing not found' }, { status: 404 });
    }

    return NextResponse.json(
      {
        success: true,
        listing: rows[0],
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          Pragma: 'no-cache',
        },
      }
    );
  } catch (error: any) {
    console.error('Fetch listing error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch listing' },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { getNeonSqlClient } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/listings - Fetch all active vehicle listings with owner details from Neon DB
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get('city');
    const category = searchParams.get('category');
    const ownerId = searchParams.get('ownerId');

    const sql = getNeonSqlClient();

    let rows;
    if (ownerId) {
      rows = await sql`
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
        WHERE v.owner_id = ${ownerId}
        ORDER BY v.created_at DESC;
      `;
    } else if (city && city !== 'All Cities' && city !== 'All') {
      rows = await sql`
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
        WHERE v.is_paused = false 
          AND LOWER(v.city) = LOWER(${city})
        ORDER BY v.created_at DESC;
      `;
    } else {
      rows = await sql`
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
        WHERE v.is_paused = false
        ORDER BY v.created_at DESC;
      `;
    }

    return NextResponse.json(
      {
        success: true,
        listings: rows,
        count: rows.length,
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          Pragma: 'no-cache',
        },
      }
    );
  } catch (error: any) {
    console.error('Listings GET error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch listings' },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }
}


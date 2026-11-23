import { NextRequest, NextResponse } from 'next/server';
import { getNeonSqlClient } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/session';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/wishlist - Fetch user wishlist items with full vehicle details
 */
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Login required' }, { status: 401 });
  }

  try {
    const sql = getNeonSqlClient();
    const rows = await sql`
      SELECT 
        w.id as wishlist_id,
        w.vehicle_id,
        w.created_at as saved_at,
        v.title,
        v.brand,
        v.model,
        v.model_year,
        v.daily_rate_pkr,
        v.city,
        v.image_gallery,
        v.category,
        v.transmission,
        v.fuel_type
      FROM wishlists w
      JOIN vehicle_listings v ON v.id = w.vehicle_id
      WHERE w.user_id = ${session.id}
      ORDER BY w.created_at DESC;
    `;

    return NextResponse.json({
      success: true,
      items: rows,
      count: rows.length,
    });
  } catch (error: any) {
    console.error('Wishlist GET error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch wishlist' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/wishlist - Add vehicle to wishlist or bulk sync from guest session
 */
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Login required' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { vehicleId, vehicleIds } = body;

    const sql = getNeonSqlClient();

    // 1. Bulk sync mode (from guest session migration)
    if (Array.isArray(vehicleIds) && vehicleIds.length > 0) {
      let syncedCount = 0;
      for (const vId of vehicleIds) {
        if (vId && /^[0-9a-f-]{36}$/i.test(vId)) {
          await sql`
            INSERT INTO wishlists (user_id, vehicle_id)
            VALUES (${session.id}, ${vId})
            ON CONFLICT (user_id, vehicle_id) DO NOTHING;
          `;
          syncedCount++;
        }
      }
      return NextResponse.json({
        success: true,
        message: `Synced ${syncedCount} wishlist item(s) to account.`,
        syncedCount,
      });
    }

    // 2. Single item save / toggle
    if (!vehicleId) {
      return NextResponse.json(
        { success: false, error: 'vehicleId is required' },
        { status: 400 }
      );
    }

    await sql`
      INSERT INTO wishlists (user_id, vehicle_id)
      VALUES (${session.id}, ${vehicleId})
      ON CONFLICT (user_id, vehicle_id) DO NOTHING;
    `;

    return NextResponse.json({
      success: true,
      saved: true,
      vehicleId,
      message: 'Vehicle saved to your wishlist.',
    });
  } catch (error: any) {
    console.error('Wishlist POST error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to update wishlist' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/wishlist - Remove vehicle from wishlist
 */
export async function DELETE(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Login required' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const vehicleId = searchParams.get('vehicleId');

    if (!vehicleId) {
      return NextResponse.json({ success: false, error: 'vehicleId is required' }, { status: 400 });
    }

    const sql = getNeonSqlClient();
    await sql`
      DELETE FROM wishlists 
      WHERE user_id = ${session.id} AND vehicle_id = ${vehicleId};
    `;

    return NextResponse.json({
      success: true,
      removed: true,
      vehicleId,
      message: 'Vehicle removed from your wishlist.',
    });
  } catch (error: any) {
    console.error('Wishlist DELETE error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to remove from wishlist' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getNeonSqlClient } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/session';
import { CARS_DATA } from '@/data/marketplaceData';

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
        w.item_category,
        w.item_title,
        w.item_city,
        w.item_price,
        w.item_specs,
        w.item_image,
        v.title as db_title,
        v.brand as db_brand,
        v.model as db_model,
        v.model_year as db_model_year,
        v.daily_rate_pkr as db_daily_rate_pkr,
        v.city as db_city,
        v.image_gallery as db_image_gallery,
        v.category as db_category,
        v.transmission as db_transmission,
        v.fuel_type as db_fuel_type
      FROM wishlists w
      LEFT JOIN vehicle_listings v ON (
        w.vehicle_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
        AND v.id = w.vehicle_id::uuid
      )
      WHERE w.user_id = ${session.id}
      ORDER BY w.created_at DESC;
    `;

    const mappedItems = rows.map((r: any) => {
      // 1. If it's a DB vehicle
      if (r.db_title) {
        return {
          wishlist_id: r.wishlist_id,
          vehicle_id: r.vehicle_id,
          saved_at: r.saved_at,
          category: r.item_category || 'car',
          title: r.db_title,
          city: r.db_city || 'Pakistan',
          price: `PKR ${Number(r.db_daily_rate_pkr || 5000).toLocaleString()} / day`,
          specs: `${r.db_transmission || 'Automatic'} · ${r.db_model_year || 2024}`,
          image: Array.isArray(r.db_image_gallery) && r.db_image_gallery[0] ? r.db_image_gallery[0] : r.item_image,
        };
      }

      // 2. If it's a catalog vehicle (l-1, l-2, l-3, etc.)
      const foundCatalog = CARS_DATA.find((c) => c.id === r.vehicle_id);
      if (foundCatalog) {
        return {
          wishlist_id: r.wishlist_id,
          vehicle_id: r.vehicle_id,
          saved_at: r.saved_at,
          category: 'car',
          title: foundCatalog.name,
          city: foundCatalog.city,
          price: `${foundCatalog.price} / day`,
          specs: foundCatalog.specs,
          image: foundCatalog.image,
        };
      }

      // 3. Fallback to stored item metadata
      return {
        wishlist_id: r.wishlist_id,
        vehicle_id: r.vehicle_id,
        saved_at: r.saved_at,
        category: r.item_category || 'car',
        title: r.item_title || 'Saved Listing',
        city: r.item_city || 'Pakistan',
        price: r.item_price || 'PKR 10,000 / day',
        specs: r.item_specs || 'Verified Listing',
        image: r.item_image || '',
      };
    });

    return NextResponse.json({
      success: true,
      items: mappedItems,
      count: mappedItems.length,
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
    const { vehicleId, vehicleIds, category, title, city, price, specs, image } = body;

    const sql = getNeonSqlClient();

    // 1. Bulk sync mode (from guest session migration)
    if (Array.isArray(vehicleIds) && vehicleIds.length > 0) {
      let syncedCount = 0;
      for (const vId of vehicleIds) {
        if (vId && typeof vId === 'string') {
          const found = CARS_DATA.find((c) => c.id === vId);
          await sql`
            INSERT INTO wishlists (
              user_id, vehicle_id, item_category, item_title, item_city, item_price, item_specs, item_image
            ) VALUES (
              ${session.id},
              ${vId},
              ${'car'},
              ${found?.name || 'Saved Vehicle'},
              ${found?.city || 'Pakistan'},
              ${found?.price || 'PKR 10,000 / day'},
              ${found?.specs || 'Verified Car'},
              ${found?.image || null}
            )
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

    // 2. Single item save
    if (!vehicleId) {
      return NextResponse.json(
        { success: false, error: 'vehicleId is required' },
        { status: 400 }
      );
    }

    const foundCatalog = CARS_DATA.find((c) => c.id === vehicleId);
    const saveCategory = category || 'car';
    const saveTitle = title || foundCatalog?.name || 'Saved Listing';
    const saveCity = city || foundCatalog?.city || 'Karachi';
    const savePrice = price || foundCatalog?.price || 'PKR 10,000 / day';
    const saveSpecs = specs || foundCatalog?.specs || 'Verified Listing';
    const saveImage = image || foundCatalog?.image || null;

    await sql`
      INSERT INTO wishlists (
        user_id, vehicle_id, item_category, item_title, item_city, item_price, item_specs, item_image
      ) VALUES (
        ${session.id},
        ${vehicleId},
        ${saveCategory},
        ${saveTitle},
        ${saveCity},
        ${savePrice},
        ${saveSpecs},
        ${saveImage}
      )
      ON CONFLICT (user_id, vehicle_id) 
      DO UPDATE SET
        item_title = EXCLUDED.item_title,
        item_city = EXCLUDED.item_city,
        item_price = EXCLUDED.item_price,
        created_at = NOW();
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

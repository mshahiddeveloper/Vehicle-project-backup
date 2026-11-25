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
 * GET /api/admin/overview - Unified Neon DB telemetry, users, listings, subscriptions, KYC, and audit logs
 */
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'AGENT')) {
    return NextResponse.json({ success: false, error: 'Forbidden: Admin access required' }, { status: 403, headers: NO_STORE_HEADERS });
  }

  try {
    const sql = getNeonSqlClient();

    const [
      users,
      vehicles,
      drivers,
      intercity,
      shuttles,
      movers,
      bookings,
      leads,
      subscriptions,
      plans,
      auditLogs,
      promoCodes,
    ] = await Promise.all([
      sql`SELECT id, phone, email, full_name, business_name, role, provider_subtype, city, kyc_status, is_blocked, phone_verified, created_at FROM users ORDER BY created_at DESC LIMIT 200`,
      sql`SELECT id, owner_id, title, category, city, daily_rate_pkr, is_paused, pause_reason, created_at FROM vehicle_listings ORDER BY created_at DESC LIMIT 100`,
      sql`SELECT id, user_id, COALESCE(full_name, 'Driver') as full_name, city, daily_12h_rate_pkr, duty_status, COALESCE(is_paused, false) as is_paused, created_at FROM chauffeur_profiles ORDER BY created_at DESC LIMIT 100`,
      sql`SELECT id, provider_id, origin_city, destination_city, vehicle_type, per_seat_fare_pkr, available_seats, status, created_at FROM intercity_trips ORDER BY created_at DESC LIMIT 100`,
      sql`SELECT id, provider_id, route_name, city, monthly_fare_pkr, available_seats, is_active, created_at FROM shuttle_routes ORDER BY created_at DESC LIMIT 100`,
      sql`SELECT id, provider_id, company_name, city, base_rate_pkr, per_km_rate_pkr, is_paused, created_at FROM mover_listings ORDER BY created_at DESC LIMIT 100`,
      sql`SELECT id, booking_reference, service_type, pickup_location, total_amount_pkr, booking_status, created_at FROM bookings ORDER BY created_at DESC LIMIT 100`,
      sql`SELECT id, listing_title, category, provider_name, customer_name, customer_phone, action_type, city, status, created_at FROM leads ORDER BY created_at DESC LIMIT 100`,
      sql`SELECT s.*, u.full_name, u.phone, u.role, p.plan_name, p.price_pkr FROM user_subscriptions s LEFT JOIN users u ON u.id = s.user_id LEFT JOIN subscription_plans p ON p.id = s.plan_id ORDER BY s.created_at DESC LIMIT 100`,
      sql`SELECT * FROM subscription_plans ORDER BY price_pkr ASC`,
      sql`SELECT id, actor_id, actor_role, action_type, target_resource, resource_id, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 50`,
      sql`SELECT * FROM promo_codes ORDER BY created_at DESC LIMIT 50`,
    ]);

    return NextResponse.json(
      {
        success: true,
        stats: {
          totalUsers: users.length,
          totalVehicles: vehicles.length,
          totalDrivers: drivers.length,
          totalIntercity: intercity.length,
          totalShuttles: shuttles.length,
          totalMovers: movers.length,
          totalBookings: bookings.length,
          totalLeads: leads.length,
          pendingKyc: users.filter((u: any) => u.kyc_status !== 'VERIFIED' && u.role !== 'CUSTOMER').length,
          pendingSubscriptions: subscriptions.filter((s: any) => s.status === 'PENDING_APPROVAL').length,
        },
        users,
        vehicles,
        drivers,
        intercity,
        shuttles,
        movers,
        bookings,
        leads,
        subscriptions,
        plans,
        auditLogs,
        promoCodes,
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (error: any) {
    console.error('Admin overview GET error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to load admin overview' }, { status: 500, headers: NO_STORE_HEADERS });
  }
}

/**
 * PATCH /api/admin/overview - Perform real Neon DB admin actions (KYC, Block/Unblock, Pause Listing, Subscriptions, Promo)
 */
export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'AGENT')) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403, headers: NO_STORE_HEADERS });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { action, targetId, value } = body;
    const sql = getNeonSqlClient();

    if (action === 'update_kyc' && targetId) {
      await sql`UPDATE users SET kyc_status = ${value || 'VERIFIED'}::kyc_status_enum, updated_at = NOW() WHERE id::text = ${targetId}`;
    } else if (action === 'toggle_block_user' && targetId) {
      await sql`UPDATE users SET is_blocked = ${Boolean(value)}, updated_at = NOW() WHERE id::text = ${targetId}`;
    } else if (action === 'toggle_pause_vehicle' && targetId) {
      await sql`UPDATE vehicle_listings SET is_paused = ${Boolean(value)}, updated_at = NOW() WHERE id::text = ${targetId}`;
    } else if (action === 'toggle_pause_driver' && targetId) {
      await sql`UPDATE chauffeur_profiles SET is_paused = ${Boolean(value)} WHERE id::text = ${targetId}`;
    } else if (action === 'toggle_pause_shuttle' && targetId) {
      await sql`UPDATE shuttle_routes SET is_active = ${!Boolean(value)} WHERE id::text = ${targetId}`;
    } else if (action === 'toggle_pause_mover' && targetId) {
      await sql`UPDATE mover_listings SET is_paused = ${Boolean(value)}, updated_at = NOW() WHERE id::text = ${targetId}`;
    } else if (action === 'update_subscription' && targetId) {
      const status = value === 'APPROVE' ? 'ACTIVE' : 'REJECTED';
      await sql`
        UPDATE user_subscriptions
        SET status = ${status}::subscription_status_enum,
            approved_by = ${session.id}::uuid,
            started_at = CASE WHEN ${status} = 'ACTIVE' THEN NOW() ELSE started_at END,
            expires_at = CASE WHEN ${status} = 'ACTIVE' THEN NOW() + INTERVAL '30 days' ELSE expires_at END
        WHERE id::text = ${targetId}
      `;
    } else if (action === 'create_promo' && body.code) {
      await sql`
        INSERT INTO promo_codes (code, discount_type, discount_value, target_role, is_active)
        VALUES (${String(body.code).toUpperCase()}, ${body.discountType || 'PERCENT'}, ${Number(body.discountValue || 100)}, ${body.targetRole || 'ALL'}, true)
        ON CONFLICT (code) DO UPDATE SET discount_value = EXCLUDED.discount_value, is_active = true;
      `;
    } else {
      return NextResponse.json({ success: false, error: 'Unsupported admin action' }, { status: 400, headers: NO_STORE_HEADERS });
    }

    return NextResponse.json({ success: true, action, targetId }, { headers: NO_STORE_HEADERS });
  } catch (error: any) {
    console.error('Admin overview PATCH error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Admin action failed' }, { status: 500, headers: NO_STORE_HEADERS });
  }
}


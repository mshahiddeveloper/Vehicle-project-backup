import { NextRequest, NextResponse } from 'next/server';
import { getNeonSqlClient } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/session';
import { logAuditEvent } from '@/lib/auditLogServer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/reviews - Fetch verified ratings and comments
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get('targetUserId');
    const bookingId = searchParams.get('bookingId');

    const sql = getNeonSqlClient();

    if (bookingId) {
      const rows = await sql`
        SELECT r.id, r.booking_id, r.rating, r.comment, r.created_at, u.full_name as reviewer_name
        FROM reviews r
        JOIN users u ON u.id = r.customer_id
        WHERE r.booking_id = ${bookingId}
        LIMIT 1;
      `;
      return NextResponse.json({ success: true, review: rows[0] || null });
    }

    if (targetUserId) {
      const rows = await sql`
        SELECT 
          r.id, 
          r.rating, 
          r.comment, 
          r.created_at, 
          u.full_name as reviewer_name,
          b.service_type
        FROM reviews r
        JOIN users u ON u.id = r.customer_id
        JOIN bookings b ON b.id = r.booking_id
        WHERE r.target_user_id = ${targetUserId}
        ORDER BY r.created_at DESC;
      `;

      const avgRating = rows.length > 0 
        ? (rows.reduce((acc: number, cur: any) => acc + cur.rating, 0) / rows.length).toFixed(1)
        : null;

      return NextResponse.json({
        success: true,
        reviews: rows,
        count: rows.length,
        averageRating: avgRating,
      });
    }

    return NextResponse.json(
      { success: false, error: 'targetUserId or bookingId query param is required' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Reviews GET error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reviews - Submit verified review for completed booking
 */
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Login required to submit review' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { bookingId, rating, comment } = body;

    if (!bookingId || !rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: 'Valid bookingId and integer rating between 1 and 5 are required.' },
        { status: 400 }
      );
    }

    const sql = getNeonSqlClient();

    // 1. Verify that booking belongs to customer
    const bookingRows = await sql`
      SELECT id, customer_id, lister_id, driver_id, booking_status, booking_reference
      FROM bookings
      WHERE id = ${bookingId}
      LIMIT 1;
    `;

    if (bookingRows.length === 0) {
      return NextResponse.json({ success: false, error: 'Booking not found.' }, { status: 404 });
    }

    const booking = bookingRows[0];
    if (booking.customer_id !== session.id && session.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'You are not authorized to review this booking.' },
        { status: 403 }
      );
    }

    const targetUserId = booking.lister_id || booking.driver_id;
    if (!targetUserId) {
      return NextResponse.json(
        { success: false, error: 'No host or driver is linked to this booking to review.' },
        { status: 400 }
      );
    }

    // 2. Insert into reviews table (enforcing UNIQUE booking_id)
    const reviewRows = await sql`
      INSERT INTO reviews (
        booking_id,
        customer_id,
        target_user_id,
        rating,
        comment,
        created_at
      ) VALUES (
        ${bookingId},
        ${session.id},
        ${targetUserId},
        ${rating},
        ${comment ? comment.trim() : null},
        NOW()
      )
      RETURNING id, rating, created_at;
    `;

    const reviewId = reviewRows[0].id;

    // 3. Emitting notification to target host/driver
    await sql`
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        link_url
      ) VALUES (
        ${targetUserId},
        'SYSTEM_ALERT',
        ${`New ${rating}★ Review Received`},
        ${`A customer left a ${rating}-star verified review for booking #${booking.booking_reference}: "${comment || 'Verified customer feedback'}"`},
        ${`/reviews?bookingId=${bookingId}`}
      );
    `.catch((e) => console.warn('Failed to dispatch review notification:', e));

    // 4. Log audit event
    await logAuditEvent({
      actorId: session.id,
      actorRole: session.role,
      actionType: 'BOOKING_REVIEW_SUBMITTED',
      targetResource: 'BOOKING',
      resourceId: bookingId,
      stateDelta: { rating, reviewId },
    });

    return NextResponse.json({
      success: true,
      reviewId,
      rating,
      message: 'Review successfully submitted and verified.',
    });
  } catch (error: any) {
    if (error?.message?.includes('reviews_booking_id_key')) {
      return NextResponse.json(
        { success: false, error: 'You have already submitted a review for this booking.' },
        { status: 409 }
      );
    }
    console.error('Reviews POST error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal review submission error' },
      { status: 500 }
    );
  }
}

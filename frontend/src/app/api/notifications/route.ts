import { NextRequest, NextResponse } from 'next/server';
import { getNeonSqlClient } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/session';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/notifications - List user alerts and notifications (auto-prunes > 90 days old)
 */
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Login required' }, { status: 401 });
  }

  try {
    const sql = getNeonSqlClient();

    // Auto-delete notifications older than 3 months (90 days) to keep DB lightweight
    await sql`
      DELETE FROM notifications
      WHERE created_at < NOW() - INTERVAL '90 days';
    `.catch(() => {});

    const rows = await sql`
      SELECT id, type, title, message, link_url, is_read, created_at
      FROM notifications
      WHERE user_id = ${session.id}
        AND created_at >= NOW() - INTERVAL '90 days'
      ORDER BY created_at DESC
      LIMIT 60;
    `;

    const unreadCount = rows.filter((r: any) => !r.is_read).length;

    return NextResponse.json(
      {
        success: true,
        notifications: rows,
        unreadCount,
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          Pragma: 'no-cache',
        },
      }
    );
  } catch (error: any) {
    console.error('Notifications GET error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications - Create a new notification for a user
 */
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Login required' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const {
      targetUserId,
      type = 'SYSTEM',
      title,
      message,
      linkUrl = '/',
    } = body;

    if (!title || !message) {
      return NextResponse.json({ success: false, error: 'title and message are required' }, { status: 400 });
    }

    const userId = targetUserId || session.id;
    const sql = getNeonSqlClient();

    const inserted = await sql`
      INSERT INTO notifications (user_id, type, title, message, link_url, is_read)
      VALUES (${userId}, ${String(type)}, ${String(title)}, ${String(message)}, ${String(linkUrl)}, FALSE)
      RETURNING id, type, title, message, link_url, is_read, created_at;
    `;

    return NextResponse.json(
      { success: true, notification: inserted[0] },
      { status: 201, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error: any) {
    console.error('Notifications POST error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create notification' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notifications - Mark notification(s) as read
 */
export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Login required' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { notificationId, markAllAsRead } = body;

    const sql = getNeonSqlClient();

    if (markAllAsRead) {
      await sql`
        UPDATE notifications 
        SET is_read = TRUE 
        WHERE user_id = ${session.id} AND is_read = FALSE;
      `;
      return NextResponse.json({ success: true, message: 'All notifications marked as read.' });
    }

    if (!notificationId) {
      return NextResponse.json({ success: false, error: 'notificationId is required' }, { status: 400 });
    }

    await sql`
      UPDATE notifications 
      SET is_read = TRUE 
      WHERE id = ${notificationId} AND user_id = ${session.id};
    `;

    return NextResponse.json({ success: true, message: 'Notification marked as read.' });
  } catch (error: any) {
    console.error('Notifications PATCH error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to update notification' },
      { status: 500 }
    );
  }
}

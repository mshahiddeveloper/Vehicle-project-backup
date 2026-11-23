import { NextRequest, NextResponse } from 'next/server';
import { getNeonSqlClient } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/session';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/notifications - List user alerts and notifications
 */
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Login required' }, { status: 401 });
  }

  try {
    const sql = getNeonSqlClient();
    const rows = await sql`
      SELECT id, type, title, message, link_url, is_read, created_at
      FROM notifications
      WHERE user_id = ${session.id}
      ORDER BY created_at DESC
      LIMIT 50;
    `;

    const unreadCount = rows.filter((r: any) => !r.is_read).length;

    return NextResponse.json({
      success: true,
      notifications: rows,
      unreadCount,
    });
  } catch (error: any) {
    console.error('Notifications GET error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch notifications' },
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

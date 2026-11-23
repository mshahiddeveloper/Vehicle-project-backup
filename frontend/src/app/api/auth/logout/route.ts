import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie, getSessionFromRequest } from '@/lib/session';
import { logAuditEvent } from '@/lib/auditLogServer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);

  if (session) {
    await logAuditEvent({
      actorId: session.id,
      actorRole: session.role,
      actionType: 'USER_LOGOUT',
      targetResource: 'USER',
      resourceId: session.id,
      ipAddress: req.headers.get('x-forwarded-for') || null,
      userAgent: req.headers.get('user-agent') || null,
    });
  }

  const res = NextResponse.json({
    success: true,
    message: 'Logged out successfully.',
  });

  clearSessionCookie(res);
  return res;
}

import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);

  if (!session) {
    return NextResponse.json(
      { authenticated: false, user: null },
      {
        status: 401,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          Pragma: 'no-cache',
        },
      }
    );
  }

  return NextResponse.json(
    {
      authenticated: true,
      user: {
        id: session.id,
        phone: session.phone,
        email: session.email,
        name: session.name,
        role: session.role,
        providerSubtype: session.providerSubtype,
        city: session.city,
      },
    },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        Pragma: 'no-cache',
      },
    }
  );
}

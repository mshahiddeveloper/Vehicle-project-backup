import { NextRequest, NextResponse } from 'next/server';
import { getNeonSqlClient } from '@/lib/db';
import { logAuditEvent } from '@/lib/auditLogServer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Server-side memory cache fallback
let memorySettingsCache = {
  whatsappVerificationEnabled: false,
  updatedAt: new Date().toISOString(),
  updatedBy: 'system',
};

/**
 * Ensures system_settings table exists in Neon PostgreSQL
 */
async function ensureSystemSettingsTable(sql: any) {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
  } catch (err) {
    console.warn('Could not ensure system_settings table:', err);
  }
}

export async function GET() {
  try {
    const sql = getNeonSqlClient();
    await ensureSystemSettingsTable(sql);

    const rows = await sql`
      SELECT key, value, updated_at 
      FROM system_settings 
      WHERE key = 'whatsapp_verification' 
      LIMIT 1;
    `;

    if (rows.length > 0) {
      const val = rows[0].value;
      const enabled = Boolean(val && val.enabled);
      memorySettingsCache = {
        whatsappVerificationEnabled: enabled,
        updatedAt: rows[0].updated_at || new Date().toISOString(),
        updatedBy: val?.updatedBy || 'superadmin',
      };
    }

    return NextResponse.json(
      {
        success: true,
        settings: memorySettingsCache,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error: any) {
    console.warn('Error reading system settings from DB, using cache fallback:', error?.message);
    return NextResponse.json(
      {
        success: true,
        settings: memorySettingsCache,
        fallback: true,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { whatsappVerificationEnabled } = body;

    const enabled = Boolean(whatsappVerificationEnabled);
    const nowIso = new Date().toISOString();

    memorySettingsCache = {
      whatsappVerificationEnabled: enabled,
      updatedAt: nowIso,
      updatedBy: 'superadmin',
    };

    try {
      const sql = getNeonSqlClient();
      await ensureSystemSettingsTable(sql);

      const jsonPayload = JSON.stringify({
        enabled,
        updatedAt: nowIso,
        updatedBy: 'superadmin',
      });

      await sql`
        INSERT INTO system_settings (key, value, updated_at)
        VALUES ('whatsapp_verification', ${jsonPayload}::jsonb, NOW())
        ON CONFLICT (key) DO UPDATE
        SET value = EXCLUDED.value, updated_at = NOW();
      `;

      // Log to platform audit logs
      try {
        await logAuditEvent({
          action: 'UPDATE_SYSTEM_SETTINGS',
          targetResource: 'system_settings/whatsapp_verification',
          actorRole: 'SUPER_ADMIN',
          details: {
            whatsappVerificationEnabled: enabled,
            description: enabled
              ? 'Super Admin enabled WhatsApp OTP verification for new registrations'
              : 'Super Admin deactivated WhatsApp OTP verification (direct registration mode active)',
          },
        });
      } catch {}
    } catch (dbErr: any) {
      console.warn('Could not persist system settings to Neon DB:', dbErr?.message);
    }

    return NextResponse.json(
      {
        success: true,
        message: enabled
          ? 'WhatsApp OTP verification has been ACTIVATED for all registrations.'
          : 'WhatsApp OTP verification has been DEACTIVATED. Direct registration is active.',
        settings: memorySettingsCache,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to update system settings.',
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  }
}


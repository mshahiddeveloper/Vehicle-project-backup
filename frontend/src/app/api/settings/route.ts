import { NextRequest, NextResponse } from 'next/server';
import { getNeonSqlClient } from '@/lib/db';
import { logAuditEvent } from '@/lib/auditLogServer';
import { DEFAULT_PARTNER_CITY_POLICY, PartnerCityPolicy } from '@/data/countries';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

let memorySettingsCache: {
  whatsappVerificationEnabled: boolean;
  partnerCityPolicy: PartnerCityPolicy;
  updatedAt: string;
  updatedBy: string;
} = {
  whatsappVerificationEnabled: false,
  partnerCityPolicy: DEFAULT_PARTNER_CITY_POLICY,
  updatedAt: new Date().toISOString(),
  updatedBy: 'system',
};

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
      WHERE key IN ('whatsapp_verification', 'partner_city_policy');
    `;

    for (const r of rows) {
      if (r.key === 'whatsapp_verification') {
        memorySettingsCache.whatsappVerificationEnabled = Boolean(r.value?.enabled);
        memorySettingsCache.updatedAt = r.updated_at || memorySettingsCache.updatedAt;
      } else if (r.key === 'partner_city_policy' && r.value) {
        memorySettingsCache.partnerCityPolicy = {
          activeCountry: r.value.activeCountry || 'PK',
          partnerCityMode: r.value.partnerCityMode === 'SELECTED' ? 'SELECTED' : 'ALL',
          allowedPartnerCities: Array.isArray(r.value.allowedPartnerCities)
            ? r.value.allowedPartnerCities
            : DEFAULT_PARTNER_CITY_POLICY.allowedPartnerCities,
          updatedAt: r.updated_at || new Date().toISOString(),
        };
      }
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
    const nowIso = new Date().toISOString();

    const sql = getNeonSqlClient();
    await ensureSystemSettingsTable(sql);

    if (typeof body.whatsappVerificationEnabled === 'boolean') {
      const enabled = Boolean(body.whatsappVerificationEnabled);
      memorySettingsCache.whatsappVerificationEnabled = enabled;
      memorySettingsCache.updatedAt = nowIso;

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

      logAuditEvent({
        action: 'UPDATE_SYSTEM_SETTINGS',
        targetResource: 'system_settings/whatsapp_verification',
        actorRole: 'SUPER_ADMIN',
        details: { whatsappVerificationEnabled: enabled },
      }).catch(() => {});
    }

    if (body.partnerCityPolicy) {
      const p = body.partnerCityPolicy;
      const cleanPolicy: PartnerCityPolicy = {
        activeCountry: String(p.activeCountry || 'PK').toUpperCase(),
        partnerCityMode: p.partnerCityMode === 'SELECTED' ? 'SELECTED' : 'ALL',
        allowedPartnerCities: Array.isArray(p.allowedPartnerCities)
          ? p.allowedPartnerCities.map((c: any) => String(c).trim()).filter(Boolean)
          : DEFAULT_PARTNER_CITY_POLICY.allowedPartnerCities,
        updatedAt: nowIso,
      };
      memorySettingsCache.partnerCityPolicy = cleanPolicy;
      memorySettingsCache.updatedAt = nowIso;

      await sql`
        INSERT INTO system_settings (key, value, updated_at)
        VALUES ('partner_city_policy', ${JSON.stringify(cleanPolicy)}::jsonb, NOW())
        ON CONFLICT (key) DO UPDATE
        SET value = EXCLUDED.value, updated_at = NOW();
      `;

      logAuditEvent({
        action: 'UPDATE_PARTNER_CITY_POLICY',
        targetResource: 'system_settings/partner_city_policy',
        actorRole: 'SUPER_ADMIN',
        details: cleanPolicy,
      }).catch(() => {});
    }

    return NextResponse.json(
      {
        success: true,
        message: 'System settings saved to Neon PostgreSQL.',
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

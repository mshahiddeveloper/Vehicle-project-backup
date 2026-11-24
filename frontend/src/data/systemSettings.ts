/**
 * SafarPK System Settings Data Store
 * Persists dynamic configuration including WhatsApp OTP verification state.
 * Synchronizes between client localStorage and Neon PostgreSQL system_settings table.
 */

export interface SystemSettings {
  whatsappVerificationEnabled: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

const SETTINGS_KEY = 'safarpk_system_settings';

// Default state: WhatsApp verification is DEACTIVATED (direct registration allowed)
export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  whatsappVerificationEnabled: false,
};

export function getLocalSystemSettings(): SystemSettings {
  if (typeof window === 'undefined') return DEFAULT_SYSTEM_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SYSTEM_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      whatsappVerificationEnabled: Boolean(parsed.whatsappVerificationEnabled),
      updatedAt: parsed.updatedAt,
      updatedBy: parsed.updatedBy,
    };
  } catch {
    return DEFAULT_SYSTEM_SETTINGS;
  }
}

export function saveLocalSystemSettings(settings: Partial<SystemSettings>): SystemSettings {
  const current = getLocalSystemSettings();
  const updated: SystemSettings = {
    ...current,
    ...settings,
    updatedAt: new Date().toISOString(),
  };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    } catch {}
  }
  return updated;
}

export async function fetchSystemSettings(): Promise<SystemSettings> {
  if (typeof window === 'undefined') return DEFAULT_SYSTEM_SETTINGS;
  try {
    const res = await fetch('/api/settings', {
      headers: { 'Cache-Control': 'no-store' },
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.settings) {
        saveLocalSystemSettings(data.settings);
        return {
          whatsappVerificationEnabled: Boolean(data.settings.whatsappVerificationEnabled),
          updatedAt: data.settings.updatedAt,
          updatedBy: data.settings.updatedBy,
        };
      }
    }
  } catch (err) {
    console.warn('Failed to fetch system settings from server, using local fallback:', err);
  }
  return getLocalSystemSettings();
}

export async function updateSystemSettings(
  settings: Partial<SystemSettings>
): Promise<{ success: boolean; settings: SystemSettings; error?: string }> {
  // Update local immediately for snappy UI
  const local = saveLocalSystemSettings(settings);
  try {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.success) {
      if (data.settings) {
        saveLocalSystemSettings(data.settings);
        return { success: true, settings: data.settings };
      }
      return { success: true, settings: local };
    }
    return { success: false, settings: local, error: data?.error || 'Failed to persist settings on server' };
  } catch (err: any) {
    // Return local state optimistically
    return { success: true, settings: local };
  }
}


export interface SiteBranding {
  portalName: string;
  desktopLogoUrl: string; // Base64 data URL or external URL
  mobileLogoUrl: string;  // Base64 data URL or external URL
  splashLogoUrl: string;  // Base64 data URL or external URL for Mobile Splash Screen
  updatedAt: string;
}

export const DEFAULT_BRANDING: SiteBranding = {
  portalName: 'SafarPK',
  desktopLogoUrl: '',
  mobileLogoUrl: '',
  splashLogoUrl: '',
  updatedAt: new Date().toISOString(),
};

const BRANDING_STORAGE_KEY = 'safarpk_site_branding';

export function getSiteBranding(): SiteBranding {
  if (typeof window === 'undefined') {
    return DEFAULT_BRANDING;
  }
  try {
    const raw = localStorage.getItem(BRANDING_STORAGE_KEY);
    if (!raw) return DEFAULT_BRANDING;
    const parsed = JSON.parse(raw);
    return {
      portalName: parsed.portalName || DEFAULT_BRANDING.portalName,
      desktopLogoUrl: parsed.desktopLogoUrl || '',
      mobileLogoUrl: parsed.mobileLogoUrl || '',
      splashLogoUrl: parsed.splashLogoUrl || '',
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
  } catch {
    return DEFAULT_BRANDING;
  }
}

export function saveSiteBranding(branding: Partial<SiteBranding>): SiteBranding {
  if (typeof window === 'undefined') return DEFAULT_BRANDING;
  const current = getSiteBranding();
  const updated: SiteBranding = {
    ...current,
    ...branding,
    updatedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(BRANDING_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('safarpk_branding_changed', { detail: updated }));
  } catch (err) {
    console.error('Failed to save branding:', err);
  }
  return updated;
}

export function resetSiteBranding(): SiteBranding {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(BRANDING_STORAGE_KEY);
      window.dispatchEvent(new CustomEvent('safarpk_branding_changed', { detail: DEFAULT_BRANDING }));
    } catch (err) {
      console.error('Failed to reset branding:', err);
    }
  }
  return DEFAULT_BRANDING;
}

'use client';

export const MAX_FEATURED_ADS = 9;
export const STORAGE_FEATURED_KEY = 'safarpk_featured_ad_ids';
export const STORAGE_STAFF_AGENTS_KEY = 'safarpk_staff_agents_perms';

export interface FeaturedItemSummary {
  id: string;
  title: string;
  serviceType: 'CAR_RENTAL' | 'DRIVER' | 'CITY_TO_CITY' | 'PICK_AND_DROP' | 'MOVERS';
  category: string;
  city: string;
  owner: string;
  price: string;
  featuredAt: string;
  slotNumber: number;
}

// Default initial featured ads (top prominent showcase)
const DEFAULT_FEATURED_IDS: string[] = ['l-1', 'drv-1', 'c2c-1'];

/**
 * Get all currently featured ad IDs in order of priority (most recent first)
 */
export function getFeaturedAdIds(): string[] {
  if (typeof window === 'undefined') return DEFAULT_FEATURED_IDS;
  try {
    const raw = localStorage.getItem(STORAGE_FEATURED_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_FEATURED_KEY, JSON.stringify(DEFAULT_FEATURED_IDS));
      return DEFAULT_FEATURED_IDS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_FEATURED_IDS;
  } catch (e) {
    return DEFAULT_FEATURED_IDS;
  }
}

/**
 * Check if a specific ad ID is featured
 */
export function isAdFeatured(id: string): boolean {
  const list = getFeaturedAdIds();
  return list.includes(id);
}

/**
 * Toggle featured state for an ad
 * Returns result and updated status
 */
export function toggleFeaturedAd(
  id: string
): { success: boolean; isFeatured: boolean; error?: string; remainingSlots: number } {
  if (typeof window === 'undefined') {
    return { success: false, isFeatured: false, remainingSlots: MAX_FEATURED_ADS };
  }

  try {
    const current = getFeaturedAdIds();
    const alreadyFeatured = current.includes(id);

    if (alreadyFeatured) {
      // Remove from featured
      const updated = current.filter((item) => item !== id);
      localStorage.setItem(STORAGE_FEATURED_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('safarpk_featured_updated'));
      return {
        success: true,
        isFeatured: false,
        remainingSlots: MAX_FEATURED_ADS - updated.length,
      };
    } else {
      // Check maximum 9 limit
      if (current.length >= MAX_FEATURED_ADS) {
        return {
          success: false,
          isFeatured: false,
          error: `Maximum ${MAX_FEATURED_ADS} featured ads slots reached. Please unfeature another listing to free up a slot.`,
          remainingSlots: 0,
        };
      }

      // Prepend to top: "whenever list on feature anyone ads that comes up first one"
      const updated = [id, ...current];
      localStorage.setItem(STORAGE_FEATURED_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('safarpk_featured_updated'));
      return {
        success: true,
        isFeatured: true,
        remainingSlots: MAX_FEATURED_ADS - updated.length,
      };
    }
  } catch (e: any) {
    return {
      success: false,
      isFeatured: false,
      error: e?.message || 'Failed to update featured ad',
      remainingSlots: MAX_FEATURED_ADS,
    };
  }
}

/**
 * Super Admin agent permission helper for featured ads
 */
export function getAgentFeaturedPermission(agentId: string): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const raw = localStorage.getItem(STORAGE_STAFF_AGENTS_KEY);
    if (!raw) return agentId === 'ag-1'; // Default: Senior Agent Kashif has permission
    const parsed = JSON.parse(raw);
    return parsed[agentId]?.manageFeaturedAds ?? (agentId === 'ag-1');
  } catch (e) {
    return agentId === 'ag-1';
  }
}

export function setAgentFeaturedPermission(agentId: string, allowed: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_STAFF_AGENTS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    parsed[agentId] = {
      ...(parsed[agentId] || {}),
      manageFeaturedAds: allowed,
    };
    localStorage.setItem(STORAGE_STAFF_AGENTS_KEY, JSON.stringify(parsed));
    window.dispatchEvent(new Event('safarpk_agent_perms_updated'));
  } catch (e) {
    console.error('Failed to save agent permission:', e);
  }
}


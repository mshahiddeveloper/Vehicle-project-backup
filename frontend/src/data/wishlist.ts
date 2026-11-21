/**
 * Central Wishlist & Saved Items Manager
 * Supports guest pending saves, post-login/register automatic restoration, and cross-tab reactive synchronization.
 */

import { CARS_DATA } from './marketplaceData';
import { getActiveUser, RegisteredUser } from './userAuth';

export interface WishlistItem {
  id: string;
  category: 'car' | 'driver' | 'shuttle' | 'mover' | string;
  name: string;
  title?: string;
  sub?: string;
  specs?: string;
  city?: string;
  rate?: string;
  price?: string;
  href?: string;
  contacted?: string;
  savedAt?: string;
}

export const STORAGE_SAVED_ITEMS_KEY = 'safarpk_saved_items';
export const STORAGE_SAVED_VEHICLES_KEY = 'safarpk_saved_vehicles';
export const STORAGE_PENDING_WISHLIST_KEY = 'safarpk_pending_wishlist';
export const STORAGE_WISHLIST_TOAST_KEY = 'safarpk_wishlist_toast';

/**
 * Get genuinely saved wishlist items for the logged-in user.
 * If user is not logged in, returns an empty array.
 */
export function getSavedWishlistItems(): WishlistItem[] {
  if (typeof window === 'undefined') return [];
  const activeUser = getActiveUser();
  if (!activeUser) return [];

  try {
    let customItems: WishlistItem[] = [];
    const raw = localStorage.getItem(STORAGE_SAVED_ITEMS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        customItems = parsed.map((p: any) => {
          const cat = (p.category || '').toLowerCase();
          const mappedCat: WishlistItem['category'] =
            cat.includes('driver') ? 'driver' :
            cat.includes('shuttle') || cat.includes('pick') ? 'shuttle' :
            cat.includes('mover') || cat.includes('cargo') ? 'mover' : 'car';

          return {
            id: p.id || `custom-${Date.now()}-${Math.random()}`,
            category: mappedCat,
            name: p.title || p.name || 'Saved Listing',
            title: p.title || p.name || 'Saved Listing',
            sub: p.specs ? `${p.specs} · ${p.city || 'Karachi'}` : (p.sub || p.city || 'Verified Listing'),
            specs: p.specs,
            city: p.city,
            rate: p.rate || p.price || 'PKR 10,000 / day',
            price: p.rate || p.price || 'PKR 10,000 / day',
            href: p.href || (p.id?.startsWith('l-') || p.id?.startsWith('car-') ? `/listing/${p.id}` : `/listing/l-1`),
            contacted: p.contacted,
            savedAt: p.savedAt,
          };
        });
      }
    }

    // Also resolve any vehicle IDs saved via mobile vehicle cards (safarpk_saved_vehicles)
    const rawVehicles = localStorage.getItem(STORAGE_SAVED_VEHICLES_KEY);
    if (rawVehicles) {
      try {
        const vIds = JSON.parse(rawVehicles);
        if (Array.isArray(vIds)) {
          for (const vId of vIds) {
            if (!customItems.some((it) => it.id === vId)) {
              const foundCar = CARS_DATA.find((c) => c.id === vId);
              if (foundCar) {
                customItems.unshift({
                  id: foundCar.id,
                  category: 'car',
                  name: foundCar.name,
                  title: foundCar.name,
                  sub: `${foundCar.specs} · ${foundCar.city}`,
                  specs: foundCar.specs,
                  city: foundCar.city,
                  rate: `${foundCar.price} / day`,
                  price: `${foundCar.price} / day`,
                  href: `/listing/${foundCar.id}`,
                });
              }
            }
          }
        }
      } catch (e) {}
    }

    // Deduplicate by ID
    const seen = new Set<string>();
    const unique: WishlistItem[] = [];
    for (const item of customItems) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        unique.push(item);
      }
    }
    return unique;
  } catch (e) {
    return [];
  }
}

/**
 * Check if a specific ID is currently saved
 */
export function isItemInWishlist(id: string): boolean {
  if (typeof window === 'undefined') return false;
  const activeUser = getActiveUser();
  if (!activeUser) return false;

  try {
    const rawVehicles = localStorage.getItem(STORAGE_SAVED_VEHICLES_KEY);
    if (rawVehicles) {
      const parsed = JSON.parse(rawVehicles);
      if (Array.isArray(parsed) && parsed.includes(id)) return true;
    }
    const rawItems = localStorage.getItem(STORAGE_SAVED_ITEMS_KEY);
    if (rawItems) {
      const parsed = JSON.parse(rawItems);
      if (Array.isArray(parsed) && parsed.some((it: any) => (it.id || it) === id)) return true;
    }
  } catch (e) {}
  return false;
}

/**
 * Save an item to the user's wishlist
 */
export function saveWishlistItem(item: WishlistItem): void {
  if (typeof window === 'undefined') return;
  try {
    // 1. Update safarpk_saved_items
    let storedList: any[] = [];
    const raw = localStorage.getItem(STORAGE_SAVED_ITEMS_KEY);
    if (raw) {
      try {
        storedList = JSON.parse(raw);
        if (!Array.isArray(storedList)) storedList = [];
      } catch (e) {
        storedList = [];
      }
    }
    // Remove if already present
    storedList = storedList.filter((it: any) => (it.id || it) !== item.id);
    storedList.unshift({
      id: item.id,
      category: item.category || 'car',
      title: item.title || item.name,
      name: item.name || item.title,
      specs: item.specs || item.sub || '',
      city: item.city || 'Pakistan',
      rate: item.rate || item.price || '',
      price: item.price || item.rate || '',
      href: item.href || `/listing/${item.id}`,
      savedAt: new Date().toISOString(),
    });
    localStorage.setItem(STORAGE_SAVED_ITEMS_KEY, JSON.stringify(storedList));

    // 2. If it is a car or vehicle, update safarpk_saved_vehicles
    let vIds: string[] = [];
    const rawVehicles = localStorage.getItem(STORAGE_SAVED_VEHICLES_KEY);
    if (rawVehicles) {
      try {
        vIds = JSON.parse(rawVehicles);
        if (!Array.isArray(vIds)) vIds = [];
      } catch (e) {
        vIds = [];
      }
    }
    if (!vIds.includes(item.id)) {
      vIds.unshift(item.id);
      localStorage.setItem(STORAGE_SAVED_VEHICLES_KEY, JSON.stringify(vIds));
    }

    // 3. Dispatch events
    window.dispatchEvent(new Event('safarpk_saved_updated'));
    window.dispatchEvent(new Event('safarpk_favorites_updated'));
  } catch (e) {
    console.error('Failed to save wishlist item:', e);
  }
}

/**
 * Remove an item from the user's wishlist
 */
export function removeWishlistItem(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_SAVED_ITEMS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const updated = parsed.filter((it: any) => (it.id || it) !== id);
        localStorage.setItem(STORAGE_SAVED_ITEMS_KEY, JSON.stringify(updated));
      }
    }

    const rawVehicles = localStorage.getItem(STORAGE_SAVED_VEHICLES_KEY);
    if (rawVehicles) {
      const parsedVehicles = JSON.parse(rawVehicles);
      if (Array.isArray(parsedVehicles)) {
        const updatedVehicles = parsedVehicles.filter((vId: string) => vId !== id);
        localStorage.setItem(STORAGE_SAVED_VEHICLES_KEY, JSON.stringify(updatedVehicles));
      }
    }

    window.dispatchEvent(new Event('safarpk_saved_updated'));
    window.dispatchEvent(new Event('safarpk_favorites_updated'));
  } catch (e) {
    console.error('Failed to remove wishlist item:', e);
  }
}

/**
 * Set a pending wishlist action for unauthenticated guests.
 * Redirects will send them to login/register, then automatically save the item.
 */
export function setPendingWishlist(item: WishlistItem, returnUrl: string): void {
  if (typeof window === 'undefined') return;
  try {
    const payload = {
      item,
      returnUrl: returnUrl || '/',
      timestamp: Date.now(),
    };
    localStorage.setItem(STORAGE_PENDING_WISHLIST_KEY, JSON.stringify(payload));
  } catch (e) {}
}

/**
 * Retrieve the current pending wishlist item if any
 */
export function getPendingWishlist(): { item: WishlistItem; returnUrl: string } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_PENDING_WISHLIST_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

/**
 * Clear the pending wishlist item
 */
export function clearPendingWishlist(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_PENDING_WISHLIST_KEY);
  } catch (e) {}
}

/**
 * Set a transient toast notification for the wishlist
 */
export function setWishlistToast(msg: string): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(STORAGE_WISHLIST_TOAST_KEY, msg);
  } catch (e) {
    try {
      localStorage.setItem(STORAGE_WISHLIST_TOAST_KEY, msg);
    } catch (e2) {}
  }
}

/**
 * Consume and clear the transient toast message
 */
export function consumeWishlistToast(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const msg = sessionStorage.getItem(STORAGE_WISHLIST_TOAST_KEY) || localStorage.getItem(STORAGE_WISHLIST_TOAST_KEY);
    if (msg) {
      sessionStorage.removeItem(STORAGE_WISHLIST_TOAST_KEY);
      localStorage.removeItem(STORAGE_WISHLIST_TOAST_KEY);
      return msg;
    }
  } catch (e) {}
  return null;
}

/**
 * Automatically execute any pending wishlist save upon login or registration.
 */
export function executePendingWishlistIfAny(): {
  executed: boolean;
  item?: WishlistItem;
  returnUrl?: string;
} {
  if (typeof window === 'undefined') return { executed: false };
  const pending = getPendingWishlist();
  if (!pending || !pending.item) return { executed: false };

  try {
    // Save the item to the now-authenticated user's wishlist
    saveWishlistItem(pending.item);
    clearPendingWishlist();

    const title = pending.item.name || pending.item.title || 'Item';
    setWishlistToast(`✓ "${title}" added to your Saved Wishlist!`);

    return {
      executed: true,
      item: pending.item,
      returnUrl: pending.returnUrl,
    };
  } catch (e) {
    clearPendingWishlist();
    return { executed: false };
  }
}


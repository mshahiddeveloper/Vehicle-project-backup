export interface PromoCode {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  currency?: string; // For FIXED_AMOUNT (e.g. 'PKR', 'EUR', 'USD', 'AED', 'GBP')
  targetCountries: string[]; // ['GLOBAL'] or specific country codes like ['PK'], ['DE']
  targetRoles: string[]; // ['ALL'] or specific roles like ['CAR_RENTAL', 'DRIVER', 'PROVIDER']
  expiryDate: string; // YYYY-MM-DD
  maxUses?: number;
  currentUses: number;
  isActive: boolean;
  description: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  targetRole: 'CAR_RENTAL' | 'DRIVER' | 'PICK_AND_DROP' | 'SHIFTING' | 'PROVIDER' | 'ALL';
  wasPrice: number; // Original crossed-out price (WAS)
  price: number;    // Active discounted price (NOW)
  billingCycle: 'MONTHLY' | 'ANNUAL';
  maxListings: number;
  features: string[];
  isActive: boolean;
  subscribersCount: number;
  badge?: string;
}

export const DEFAULT_PROMO_CODES: PromoCode[] = [
  {
    id: 'promo-1',
    code: 'LAUNCHPK',
    discountType: 'PERCENTAGE',
    discountValue: 25,
    targetCountries: ['PK'],
    targetRoles: ['ALL'],
    expiryDate: '2026-12-31',
    maxUses: 500,
    currentUses: 48,
    isActive: true,
    description: 'Pakistan Nationwide Launch 25% Discount for Fleet Owners & Chauffeurs',
  },
  {
    id: 'promo-2',
    code: 'PKFLAT1000',
    discountType: 'FIXED_AMOUNT',
    discountValue: 1000,
    currency: 'PKR',
    targetCountries: ['PK'],
    targetRoles: ['CAR_RENTAL', 'PROVIDER'],
    expiryDate: '2026-12-31',
    maxUses: 200,
    currentUses: 31,
    isActive: true,
    description: 'Flat Rs 1,000 Off Fleet Subscription in Pakistan',
  },
  {
    id: 'promo-3',
    code: 'GERMANY20',
    discountType: 'PERCENTAGE',
    discountValue: 20,
    targetCountries: ['DE'],
    targetRoles: ['ALL'],
    expiryDate: '2026-12-31',
    maxUses: 200,
    currentUses: 14,
    isActive: true,
    description: 'German Fleet Operator Launch 20% Discount',
  },
  {
    id: 'promo-4',
    code: 'DEFIX10',
    discountType: 'FIXED_AMOUNT',
    discountValue: 10,
    currency: 'EUR',
    targetCountries: ['DE'],
    targetRoles: ['ALL'],
    expiryDate: '2026-12-31',
    maxUses: 100,
    currentUses: 9,
    isActive: true,
    description: 'Flat € 10 Off German Fleet Subscription',
  },
  {
    id: 'promo-5',
    code: 'GLOBAL20',
    discountType: 'PERCENTAGE',
    discountValue: 20,
    targetCountries: ['GLOBAL'],
    targetRoles: ['ALL'],
    expiryDate: '2026-12-31',
    maxUses: 1000,
    currentUses: 112,
    isActive: true,
    description: 'Worldwide Mobility 20% Off for All Verified Providers',
  },
  {
    id: 'promo-6',
    code: 'VIP50',
    discountType: 'PERCENTAGE',
    discountValue: 50,
    targetCountries: ['GLOBAL'],
    targetRoles: ['ALL'],
    expiryDate: '2026-12-31',
    maxUses: 50,
    currentUses: 22,
    isActive: true,
    description: 'Exclusive 50% Early Bird Partner Discount',
  },
];

export const DEFAULT_SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'p-1',
    name: 'Starter Fleet Pass',
    targetRole: 'CAR_RENTAL',
    wasPrice: 5000,
    price: 3500,
    billingCycle: 'MONTHLY',
    maxListings: 2,
    features: ['Up to 2 Vehicle Listings', 'Direct Booking Leads', 'Standard Search Ranking', 'Basic Phone Support'],
    isActive: true,
    subscribersCount: 14,
  },
  {
    id: 'p-2',
    name: 'Professional Fleet Hub',
    targetRole: 'CAR_RENTAL',
    wasPrice: 16000,
    price: 12000,
    billingCycle: 'MONTHLY',
    maxListings: 15,
    features: ['Up to 15 Vehicle Listings', 'Priority Search Placement', 'Verified Blue Tick Badge', 'Chauffeur Linking Included', '24/7 Agent Desk Support'],
    isActive: true,
    subscribersCount: 38,
    badge: 'Most Popular',
  },
  {
    id: 'p-3',
    name: 'Enterprise Corporate Fleet',
    targetRole: 'CAR_RENTAL',
    wasPrice: 42000,
    price: 30000,
    billingCycle: 'MONTHLY',
    maxListings: 50,
    features: ['Up to 50 Vehicle Listings', 'Top Homepage Featured Carousel', 'Dedicated Account Manager', 'Custom City Expansion', 'Zero Commission Guarantee'],
    isActive: true,
    subscribersCount: 8,
    badge: 'Best Value',
  },
  {
    id: 'p-4',
    name: 'Independent Chauffeur Pass',
    targetRole: 'DRIVER',
    wasPrice: 3000,
    price: 2000,
    billingCycle: 'MONTHLY',
    maxListings: 1,
    features: ['Verified Driver Profile', 'Local & Outstation Direct Hiring', 'Customer Direct Booking Call', 'Traffic Police License Badge'],
    isActive: true,
    subscribersCount: 29,
    badge: 'Standard Pass',
  },
  {
    id: 'p-4b',
    name: 'VIP Executive Chauffeur Pass',
    targetRole: 'DRIVER',
    wasPrice: 4500,
    price: 3000,
    billingCycle: 'MONTHLY',
    maxListings: 1,
    features: ['Top Homepage Chauffeur Spotlight', 'High-Tier Luxury Sedan Certification', 'Direct Intercity Motorway Leads', 'Priority Support Desk'],
    isActive: true,
    subscribersCount: 16,
    badge: 'VIP Chauffeur',
  },
  {
    id: 'p-5',
    name: 'Pick & Drop Shuttle Pass',
    targetRole: 'PROVIDER',
    wasPrice: 8500,
    price: 6000,
    billingCycle: 'MONTHLY',
    maxListings: 8,
    features: ['Up to 8 Scheduled Routes', 'Intermediate Boarding Stops & Timings', 'Live Seat Vacancy Counter', 'Monthly Student & Office Commuter Leads'],
    isActive: true,
    subscribersCount: 12,
  },
  {
    id: 'p-6',
    name: 'Home Shifting & Cargo Pass',
    targetRole: 'PROVIDER',
    wasPrice: 7500,
    price: 5000,
    billingCycle: 'MONTHLY',
    maxListings: 10,
    features: ['Up to 10 Moving Trucks (Ravi/Shehzore/Mazda)', 'Per-KM & Mazdoor Fare Calculator', 'Direct Moving Quotations Queue'],
    isActive: true,
    subscribersCount: 19,
  },
];

/**
 * Returns localized pricing for subscription plans based on country code.
 */
export function getLocalizedPlanPricing(
  plan: SubscriptionPlan,
  countryCode: string = 'PK'
): { wasPrice: number; nowPrice: number; symbol: string; currency: string } {
  const code = (countryCode || 'PK').toUpperCase();

  switch (code) {
    case 'PK':
      return { wasPrice: plan.wasPrice, nowPrice: plan.price, symbol: 'Rs', currency: 'PKR' };
    case 'DE':
    case 'FR':
    case 'IT':
    case 'ES':
    case 'NL':
      return {
        wasPrice: Math.round(plan.wasPrice / 100),
        nowPrice: Math.round(plan.price / 100),
        symbol: '€',
        currency: 'EUR',
      };
    case 'GB':
      return {
        wasPrice: Math.round(plan.wasPrice / 115),
        nowPrice: Math.round(plan.price / 115),
        symbol: '£',
        currency: 'GBP',
      };
    case 'AE':
      return {
        wasPrice: Math.round(plan.wasPrice / 25),
        nowPrice: Math.round(plan.price / 25),
        symbol: 'AED',
        currency: 'AED',
      };
    case 'SA':
      return {
        wasPrice: Math.round(plan.wasPrice / 25),
        nowPrice: Math.round(plan.price / 25),
        symbol: 'SAR',
        currency: 'SAR',
      };
    case 'US':
    case 'CA':
    case 'AU':
    default:
      return {
        wasPrice: Math.round(plan.wasPrice / 90),
        nowPrice: Math.round(plan.price / 90),
        symbol: '$',
        currency: 'USD',
      };
  }
}

/**
 * Get active promo codes from localStorage or defaults
 */
export function getStoredPromoCodes(): PromoCode[] {
  if (typeof window === 'undefined') return DEFAULT_PROMO_CODES;
  try {
    const raw = localStorage.getItem('safarpk_promo_codes');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return DEFAULT_PROMO_CODES;
}

/**
 * Save promo codes to localStorage
 */
export function saveStoredPromoCodes(codes: PromoCode[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('safarpk_promo_codes', JSON.stringify(codes));
    window.dispatchEvent(new CustomEvent('safarpk_promos_updated', { detail: codes }));
  } catch (e) {}
}

/**
 * Get plans from localStorage or defaults
 */
export function getStoredPlans(): SubscriptionPlan[] {
  if (typeof window === 'undefined') return DEFAULT_SUBSCRIPTION_PLANS;
  try {
    const raw = localStorage.getItem('safarpk_subscription_plans');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return DEFAULT_SUBSCRIPTION_PLANS;
}

/**
 * Save plans to localStorage
 */
export function saveStoredPlans(plans: SubscriptionPlan[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('safarpk_subscription_plans', JSON.stringify(plans));
    window.dispatchEvent(new CustomEvent('safarpk_plans_updated', { detail: plans }));
  } catch (e) {}
}

/**
 * Returns available public promo codes for a specific country so subscribers can discover them.
 */
export function getAvailablePromosForCountry(countryCode: string = 'PK'): PromoCode[] {
  const codes = getStoredPromoCodes();
  const c = (countryCode || 'PK').toUpperCase();
  const today = new Date().toISOString().split('T')[0];

  return codes.filter((p) => {
    if (!p.isActive) return false;
    if (p.expiryDate && p.expiryDate < today) return false;
    if (p.maxUses && p.currentUses >= p.maxUses) return false;
    // Strictly verify country whitelist
    const matchesCountry = p.targetCountries.includes('GLOBAL') || p.targetCountries.includes(c);
    return matchesCountry;
  });
}

export interface PromoValidationResult {
  valid: boolean;
  error?: string;
  promo?: PromoCode;
  discountAmount: number;
  finalPrice: number;
  wasPrice: number;
  nowPrice: number;
  totalSaved: number;
  savingsPercentage: number;
}

/**
 * Validates and calculates promo code discount with strict country and role checking.
 */
export function validatePromoCode(
  inputCode: string,
  countryCode: string = 'PK',
  role: string = 'CAR_RENTAL',
  baseNowPrice: number,
  baseWasPrice: number,
  currencySymbol: string = 'Rs'
): PromoValidationResult {
  const clean = inputCode.trim().toUpperCase();
  const fallbackResult: PromoValidationResult = {
    valid: false,
    discountAmount: 0,
    finalPrice: baseNowPrice,
    wasPrice: baseWasPrice,
    nowPrice: baseNowPrice,
    totalSaved: Math.max(0, baseWasPrice - baseNowPrice),
    savingsPercentage: baseWasPrice > 0 ? Math.round(((baseWasPrice - baseNowPrice) / baseWasPrice) * 100) : 0,
  };

  if (!clean) {
    return { ...fallbackResult, error: 'Please enter a promo code.' };
  }

  const allPromos = getStoredPromoCodes();
  const promo = allPromos.find((p) => p.code.toUpperCase() === clean);

  if (!promo) {
    return { ...fallbackResult, error: `Invalid Promo Code "${clean}". Please check the spelling.` };
  }

  if (!promo.isActive) {
    return { ...fallbackResult, error: `Promo Code "${clean}" is no longer active.` };
  }

  const today = new Date().toISOString().split('T')[0];
  if (promo.expiryDate && promo.expiryDate < today) {
    return { ...fallbackResult, error: `Promo Code "${clean}" expired on ${promo.expiryDate}.` };
  }

  if (promo.maxUses && promo.currentUses >= promo.maxUses) {
    return { ...fallbackResult, error: `Promo Code "${clean}" has reached its maximum usage limit.` };
  }

  // Country restriction checking (Secret/Invisible to other countries)
  const c = (countryCode || 'PK').toUpperCase();
  const countryAllowed = promo.targetCountries.includes('GLOBAL') || promo.targetCountries.includes(c);
  if (!countryAllowed) {
    return {
      ...fallbackResult,
      error: `Promo Code "${clean}" is not applicable in your region.`,
    };
  }

  // Role restriction checking
  const roleAllowed =
    promo.targetRoles.includes('ALL') ||
    promo.targetRoles.includes(role.toUpperCase()) ||
    (role === 'PROVIDER' && (promo.targetRoles.includes('PICK_AND_DROP') || promo.targetRoles.includes('SHIFTING')));
  if (!roleAllowed) {
    return {
      ...fallbackResult,
      error: `Promo Code "${clean}" is not valid for your partner account type.`,
    };
  }

  // Calculate discount amount
  let discount = 0;
  if (promo.discountType === 'PERCENTAGE') {
    discount = Math.round((baseNowPrice * promo.discountValue) / 100);
  } else {
    // FIXED_AMOUNT
    discount = promo.discountValue;
  }

  // Discount cannot exceed the price
  discount = Math.min(discount, baseNowPrice);
  const finalPrice = Math.max(0, baseNowPrice - discount);
  const totalSaved = Math.max(0, baseWasPrice - finalPrice);
  const savingsPercentage = baseWasPrice > 0 ? Math.round((totalSaved / baseWasPrice) * 100) : 0;

  return {
    valid: true,
    promo,
    discountAmount: discount,
    finalPrice,
    wasPrice: baseWasPrice,
    nowPrice: baseNowPrice,
    totalSaved,
    savingsPercentage,
  };
}

/**
 * Increments the redemption usage count of a promo code upon successful subscription.
 */
export function incrementPromoUsage(code: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const list = getStoredPromoCodes();
    const updated = list.map((p) => {
      if (p.code.toUpperCase() === code.trim().toUpperCase()) {
        return { ...p, currentUses: (p.currentUses || 0) + 1 };
      }
      return p;
    });
    saveStoredPromoCodes(updated);
    return true;
  } catch (e) {
    console.error('Failed to increment promo usage:', e);
    return false;
  }
}

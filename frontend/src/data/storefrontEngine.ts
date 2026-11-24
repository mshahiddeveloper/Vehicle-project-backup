import {
  CARS_DATA,
  DRIVERS_DATA,
  CITY_RIDES_DATA,
  SHUTTLES_DATA,
  MOVERS_DATA,
  VehicleCardItem,
  DriverCardItem,
  CityRideItem,
  ShuttleItem,
  MoverItem,
} from './marketplaceData';
import {
  getAllRegisteredUsers,
  RegisteredUser,
  SafarServiceType,
  getApprovedServicesForUser,
  SubscriptionStatus,
  isProviderSubscriptionActive,
  isListingPaused,
} from './userAuth';

export interface StoreData {
  id: string;
  slug: string;
  name: string;
  ownerName: string;
  phone: string;
  whatsapp: string;
  city: string;
  address?: string;
  about: string;
  logoText: string;
  tint: string;
  bannerImage: string;
  memberSince: string;
  verifiedBadge: boolean;
  primaryService: SafarServiceType;
  approvedServices: SafarServiceType[];
  listings: {
    cars: VehicleCardItem[];
    rides: CityRideItem[];
    shuttles: ShuttleItem[];
    movers: MoverItem[];
  };
  cars?: VehicleCardItem[];
  rides?: CityRideItem[];
  shuttles?: ShuttleItem[];
  movers?: MoverItem[];
  totalListingsCount: number;
  isSubscriptionActive: boolean;
  subscriptionStatus: SubscriptionStatus;
  secureToken: string;
  secureStoreUrl: string;
}

export interface DriverProfileData {
  id: string;
  slug: string;
  name: string;
  initials: string;
  tint: string;
  phone: string;
  whatsapp: string;
  city: string;
  avail: 'Available' | 'Busy' | 'Offline';
  exp: string;
  yearsExpNum: number;
  langs: string[];
  bio: string;
  licenceCategories: string[];
  licenceNumberMasked: string;
  vehicleTypesCanDrive: string[];
  servicesOffered: string[];
  workPreference: string;
  driverOnlyService: boolean;
  dailyRate12h: number;
  outstationDailyRate: number;
  monthlySalaryEstimate: number;
  tags: string[];
  policeVerified: boolean;
  joinedDate: string;
  isSubscriptionActive: boolean;
  subscriptionStatus: SubscriptionStatus;
  secureToken: string;
}

/**
 * Generates an encrypted / deterministic secure token for any store or driver.
 * (e.g. sp-8f2a1b2026) for private, obfuscated shareable URLs.
 */
export function getStoreSecureToken(identifier: string): string {
  if (!identifier) return 'sp-safarpk';
  let hash = 0;
  const seed = `safarpk_sec_v3_${identifier.toLowerCase().trim()}`;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  const cleanSuffix = identifier.replace(/\D/g, '').slice(-4) || '2026';
  return `sp-${hex.slice(0, 6)}${cleanSuffix}`;
}

/**
 * URL-friendly slug generator with safe fallbacks
 */
export function slugify(text: string): string {
  if (!text) return 'partner';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
}

/**
 * Get store slug from owner/business name
 */
export function getStoreSlugForOwner(ownerName: string): string {
  const s = slugify(ownerName);
  return s || 'local-host';
}

/**
 * Get driver slug from driver name or ID
 */
export function getDriverSlug(nameOrId: string): string {
  const s = slugify(nameOrId);
  return s || 'driver';
}

/**
 * Base mock store profiles to enrich UI
 */
const KNOWN_STORES: Record<
  string,
  {
    about: string;
    city: string;
    phone: string;
    whatsapp: string;
    bannerImage: string;
    memberSince: string;
  }
> = {
  'kashif-motors': {
    about:
      'Premier independent car rental fleet operator in Islamabad & Rawalpindi. Offering meticulously maintained self-drive and chauffeur-driven sedans and 4x4 SUVs since 2019.',
    city: 'Islamabad',
    phone: '+92 300 1234567',
    whatsapp: '923001234567',
    bannerImage: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1200&auto=format&fit=crop&q=80',
    memberSince: '2021',
  },
  'zubair-car-rentals': {
    about:
      'Trusted private car rental provider based in Gulberg, Lahore. Specialized in self-drive family sedans and chauffeur-driven luxury sedans with transparent direct pricing.',
    city: 'Lahore',
    phone: '+92 300 8472910',
    whatsapp: '923008472910',
    bannerImage: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&auto=format&fit=crop&q=80',
    memberSince: '2020',
  },
  'lahore-premier-car-rentals': {
    about:
      'Lahore Premier Car Rentals operates an extensive fleet of economy hatchbacks, executive sedans, and Toyota Fortuners across Lahore, DHA, and Allama Iqbal Airport.',
    city: 'Lahore',
    phone: '+92 300 8472910',
    whatsapp: '923008472910',
    bannerImage: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=1200&auto=format&fit=crop&q=80',
    memberSince: '2019',
  },
  'ahmed-executive-motors': {
    about:
      'Karachi premier rental service catering to Clifton, DHA, and corporate business executives. Affordable daily, weekly, and monthly rates with zero hidden charges.',
    city: 'Karachi',
    phone: '+92 321 4455667',
    whatsapp: '923214455667',
    bannerImage: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1200&auto=format&fit=crop&q=80',
    memberSince: '2022',
  },
  'pak-movers-packers': {
    about:
      'Professional home shifting and commercial logistics carrier. Fleet includes Suzuki Ravi 1-Ton pickups and Shehzore 2.5-Ton containers with experienced loading labor.',
    city: 'Lahore',
    phone: '+92 300 1234567',
    whatsapp: '923001234567',
    bannerImage: 'https://images.unsplash.com/photo-1600518464441-9154a4dea21b?w=1200&auto=format&fit=crop&q=80',
    memberSince: '2020',
  },
  'al-makkah-shifting-transport': {
    about:
      'Dedicated goods transport and home relocation service covering Lahore, Gujranwala, Faisalabad, and nationwide intercity shifting with covered containers.',
    city: 'Lahore',
    phone: '+92 333 5599182',
    whatsapp: '923335599182',
    bannerImage: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&auto=format&fit=crop&q=80',
    memberSince: '2018',
  },
  'noor-shuttles': {
    about:
      'Safe, reliable daily pick & drop commuter routes for school, college, and working women across Lahore with dual AC HiAce vans and vetted drivers.',
    city: 'Lahore',
    phone: '+92 300 9876543',
    whatsapp: '923009876543',
    bannerImage: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200&auto=format&fit=crop&q=80',
    memberSince: '2021',
  },
};

/**
 * Retrieve a public Store by its unique slug, secure token, or business identifier
 */
export function getStoreDataBySlug(slugOrId: string): StoreData | null {
  if (!slugOrId) return null;
  const normSlug = slugify(slugOrId);

  // 1. Check registered users first (supports vanity slug, raw ID, and secure token sp-...)
  const allUsers = getAllRegisteredUsers();
  const matchedUser = allUsers.find((u) => {
    const uSlug = slugify(u.businessName || u.name);
    const uToken = getStoreSecureToken(u.id);
    return (
      uSlug === normSlug ||
      u.id === slugOrId ||
      slugify(u.id) === normSlug ||
      uToken === normSlug ||
      uToken.toLowerCase() === slugOrId.toLowerCase()
    );
  });

  // Collect listings for this store
  let ownerName = '';
  let businessName = '';
  let phone = '+92 300 1234567';
  let whatsapp = '923001234567';
  let city = 'Lahore';
  let memberSince = '2023';
  let primaryService: SafarServiceType = 'RENT_A_CAR';
  let approvedServices: SafarServiceType[] = ['RENT_A_CAR'];

  if (matchedUser) {
    businessName = matchedUser.businessName || `${matchedUser.name} Transport`;
    ownerName = matchedUser.name;
    phone = matchedUser.phone || phone;
    whatsapp = matchedUser.phone ? matchedUser.phone.replace(/\D/g, '') : whatsapp;
    city = matchedUser.city || city;
    approvedServices = getApprovedServicesForUser(matchedUser);
    memberSince = matchedUser.registeredAt ? new Date(matchedUser.registeredAt).getFullYear().toString() : '2024';

    if (matchedUser.role === 'PROVIDER') {
      if (matchedUser.providerSubtype === 'COMMERCIAL_CARGO' || approvedServices.includes('HOME_SHIFTING')) {
        primaryService = 'HOME_SHIFTING';
      } else {
        primaryService = 'PICK_AND_DROP';
      }
    } else {
      primaryService = 'RENT_A_CAR';
    }

    const isSubActive = isProviderSubscriptionActive(matchedUser);
    const secureToken = getStoreSecureToken(matchedUser.id);
    const secureStoreUrl = `/store/${secureToken}`;
    const subscriptionStatus: SubscriptionStatus = matchedUser.subscription?.status || 'UNSUBSCRIBED';

    // STRICT SUBSCRIPTION ENFORCEMENT:
    // If the provider has no ACTIVE subscription, their storefront is OFFLINE & listings are hidden
    if (!isSubActive) {
      return {
        id: matchedUser.id,
        slug: normSlug,
        name: businessName,
        ownerName,
        phone,
        whatsapp,
        city,
        address: `${city}, Pakistan`,
        about: `Official verified partner storefront for ${businessName}. This storefront is currently offline pending partner subscription renewal.`,
        logoText: businessName.slice(0, 2).toUpperCase(),
        tint: '#0B6B4F',
        bannerImage: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1200&auto=format&fit=crop&q=80',
        memberSince,
        verifiedBadge: false,
        primaryService,
        approvedServices,
        listings: {
          cars: [],
          rides: [],
          shuttles: [],
          movers: [],
        },
        cars: [],
        rides: [],
        shuttles: [],
        movers: [],
        totalListingsCount: 0,
        isSubscriptionActive: false,
        subscriptionStatus,
        secureToken,
        secureStoreUrl,
      };
    }

    // Active Subscriber: Load user's actual live fleet without dummy fillers
    const normTarget = slugify(businessName);
    let cars: VehicleCardItem[] = [];
    let rides: CityRideItem[] = [];
    let shuttles: ShuttleItem[] = [];
    let movers: MoverItem[] = [];

    if (primaryService === 'RENT_A_CAR') {
      if (typeof window !== 'undefined') {
        try {
          const rawFleet = localStorage.getItem(`safarpk_fleet_${matchedUser.id}`);
          if (rawFleet) {
            const list = JSON.parse(rawFleet);
            if (Array.isArray(list)) {
              cars = list
                .filter((c: any) => !isListingPaused(c.id, matchedUser.id))
                .map((c: any) => ({
                  id: c.id,
                  name: c.title || `${c.brand || ''} ${c.model || ''}`,
                  category: c.category || 'Sedan',
                  city: c.city || matchedUser.city || 'Islamabad',
                  specs: `${c.transmission || 'Automatic'} · ${c.fuelType || 'Petrol'} · ${c.seats || 5} Seats`,
                  price: `PKR ${(c.dailyRate || 5000).toLocaleString()} / day`,
                  priceNum: c.dailyRate || 5000,
                  owner: businessName,
                  phone,
                  whatsapp,
                  image: c.images?.[0] || c.image || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80',
                  featured: false,
                }));
            }
          }
        } catch {}
      }

      // Also include any catalog cars assigned to this user
      const catalogCars = CARS_DATA.filter((c) => {
        const cSlug = slugify(c.owner);
        return (cSlug === normTarget || normTarget.includes(cSlug) || cSlug.includes(normTarget)) && !isListingPaused(c.id, matchedUser.id);
      });
      for (const cc of catalogCars) {
        if (!cars.some((c) => c.id === cc.id)) {
          cars.push(cc);
        }
      }
    } else if (primaryService === 'CITY_TO_CITY') {
      rides = CITY_RIDES_DATA.filter((r) => {
        const rSlug = slugify(r.op);
        return (rSlug === normTarget || normTarget.includes(rSlug) || rSlug.includes(normTarget)) && !isListingPaused(r.id, matchedUser.id);
      });
    } else if (primaryService === 'PICK_AND_DROP') {
      shuttles = SHUTTLES_DATA.filter((s) => {
        const sSlug = slugify(s.op);
        return (sSlug === normTarget || normTarget.includes(sSlug) || sSlug.includes(normTarget)) && !isListingPaused(s.id, matchedUser.id);
      });
    } else if (primaryService === 'HOME_SHIFTING') {
      movers = MOVERS_DATA.filter((m) => {
        const mSlug = slugify(m.name);
        return (mSlug === normTarget || normTarget.includes(mSlug) || mSlug.includes(normTarget)) && !isListingPaused(m.id, matchedUser.id);
      });
    }

    const totalCount =
      primaryService === 'RENT_A_CAR'
        ? cars.length
        : primaryService === 'CITY_TO_CITY'
        ? rides.length
        : primaryService === 'PICK_AND_DROP'
        ? shuttles.length
        : movers.length;

    const known = KNOWN_STORES[normSlug] || KNOWN_STORES[slugify(businessName)];

    return {
      id: matchedUser.id,
      slug: normSlug,
      name: businessName,
      ownerName,
      phone: known?.phone || phone,
      whatsapp: known?.whatsapp || whatsapp,
      city: known?.city || city,
      address: `${known?.city || city}, Pakistan`,
      about:
        known?.about ||
        `Independent ${primaryService === 'RENT_A_CAR' ? 'car rental fleet' : primaryService === 'CITY_TO_CITY' ? 'intercity ride operator' : primaryService === 'PICK_AND_DROP' ? 'commuter shuttle provider' : 'home shifting fleet'} store for ${businessName}. Connect directly via WhatsApp.`,
      logoText: businessName.slice(0, 2).toUpperCase(),
      tint: '#0B6B4F',
      bannerImage:
        known?.bannerImage ||
        'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1200&auto=format&fit=crop&q=80',
      memberSince: known?.memberSince || memberSince,
      verifiedBadge: true,
      primaryService,
      approvedServices: [primaryService],
      listings: {
        cars,
        rides,
        shuttles,
        movers,
      },
      cars,
      rides,
      shuttles,
      movers,
      totalListingsCount: totalCount,
      isSubscriptionActive: true,
      subscriptionStatus: 'ACTIVE',
      secureToken,
      secureStoreUrl,
    };
  }

  // 2. Check known stores or match across catalog
  const matchingCar = CARS_DATA.find((c) => slugify(c.owner) === normSlug || getStoreSecureToken(c.owner) === normSlug);
  const matchingMover = MOVERS_DATA.find((m) => slugify(m.name) === normSlug || getStoreSecureToken(m.name) === normSlug);
  const matchingShuttle = SHUTTLES_DATA.find((s) => slugify(s.op) === normSlug || getStoreSecureToken(s.op) === normSlug);
  const matchingRide = CITY_RIDES_DATA.find((r) => slugify(r.op) === normSlug || getStoreSecureToken(r.op) === normSlug);
  const known = KNOWN_STORES[normSlug] || KNOWN_STORES[slugify(slugOrId)];

  if (matchingCar || matchingMover || matchingShuttle || matchingRide || known) {
    if (matchingCar) {
      businessName = matchingCar.owner;
      ownerName = matchingCar.owner;
      phone = matchingCar.phone || phone;
      whatsapp = matchingCar.whatsapp || whatsapp;
      city = matchingCar.city || city;
      primaryService = 'RENT_A_CAR';
      approvedServices = ['RENT_A_CAR'];
    } else if (matchingMover) {
      businessName = matchingMover.name;
      ownerName = matchingMover.name;
      phone = matchingMover.phone || phone;
      whatsapp = matchingMover.whatsapp || whatsapp;
      city = matchingMover.city || city;
      primaryService = 'HOME_SHIFTING';
      approvedServices = ['HOME_SHIFTING'];
    } else if (matchingShuttle) {
      businessName = matchingShuttle.op;
      ownerName = matchingShuttle.op;
      phone = matchingShuttle.phone || phone;
      whatsapp = matchingShuttle.whatsapp || whatsapp;
      city = matchingShuttle.city || city;
      primaryService = 'PICK_AND_DROP';
      approvedServices = ['PICK_AND_DROP'];
    } else if (matchingRide) {
      businessName = matchingRide.op;
      ownerName = matchingRide.op;
      phone = matchingRide.phone || phone;
      whatsapp = matchingRide.whatsapp || whatsapp;
      city = matchingRide.fromCity || city;
      primaryService = 'CITY_TO_CITY';
      approvedServices = ['CITY_TO_CITY'];
    } else if (known) {
      businessName = normSlug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      ownerName = businessName;
      phone = known.phone;
      whatsapp = known.whatsapp;
      city = known.city;
      primaryService = 'RENT_A_CAR';
      approvedServices = ['RENT_A_CAR'];
    }

    const normTarget = slugify(businessName);
    let cars: VehicleCardItem[] = [];
    let rides: CityRideItem[] = [];
    let shuttles: ShuttleItem[] = [];
    let movers: MoverItem[] = [];

    if (primaryService === 'RENT_A_CAR') {
      cars = CARS_DATA.filter((c) => {
        const cSlug = slugify(c.owner);
        return (cSlug === normTarget || normTarget.includes(cSlug) || cSlug.includes(normTarget)) && !isListingPaused(c.id, c.owner);
      });
    } else if (primaryService === 'CITY_TO_CITY') {
      rides = CITY_RIDES_DATA.filter((r) => {
        const rSlug = slugify(r.op);
        return (rSlug === normTarget || normTarget.includes(rSlug) || rSlug.includes(normTarget)) && !isListingPaused(r.id, r.op);
      });
    } else if (primaryService === 'PICK_AND_DROP') {
      shuttles = SHUTTLES_DATA.filter((s) => {
        const sSlug = slugify(s.op);
        return (sSlug === normTarget || normTarget.includes(sSlug) || sSlug.includes(normTarget)) && !isListingPaused(s.id, s.op);
      });
    } else if (primaryService === 'HOME_SHIFTING') {
      movers = MOVERS_DATA.filter((m) => {
        const mSlug = slugify(m.name);
        return (mSlug === normTarget || normTarget.includes(mSlug) || mSlug.includes(normTarget)) && !isListingPaused(m.id, m.name);
      });
    }

    const totalCount =
      primaryService === 'RENT_A_CAR'
        ? cars.length
        : primaryService === 'CITY_TO_CITY'
        ? rides.length
        : primaryService === 'PICK_AND_DROP'
        ? shuttles.length
        : movers.length;

    const secureToken = getStoreSecureToken(businessName);

    return {
      id: `store-${normSlug}`,
      slug: normSlug,
      name: businessName,
      ownerName,
      phone: known?.phone || phone,
      whatsapp: known?.whatsapp || whatsapp,
      city: known?.city || city,
      address: `${known?.city || city}, Pakistan`,
      about:
        known?.about ||
        `Independent verified ${primaryService === 'RENT_A_CAR' ? 'car rental fleet' : primaryService === 'CITY_TO_CITY' ? 'intercity ride operator' : primaryService === 'PICK_AND_DROP' ? 'commuter shuttle provider' : 'home shifting fleet'} store for ${businessName}. Connect directly via WhatsApp.`,
      logoText: businessName.slice(0, 2).toUpperCase(),
      tint: '#0B6B4F',
      bannerImage:
        known?.bannerImage ||
        'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1200&auto=format&fit=crop&q=80',
      memberSince: known?.memberSince || memberSince,
      verifiedBadge: true,
      primaryService,
      approvedServices: [primaryService],
      listings: {
        cars,
        rides,
        shuttles,
        movers,
      },
      cars,
      rides,
      shuttles,
      movers,
      totalListingsCount: totalCount,
      isSubscriptionActive: true,
      subscriptionStatus: 'ACTIVE',
      secureToken,
      secureStoreUrl: `/store/${secureToken}`,
    };
  }

  // 3. Unknown store slug - STRICT 404. Never synthesize a fake store!
  return null;
}

/**
 * Retrieve public driver profile by slug or driver ID
 */
export function getDriverProfileBySlug(slugOrId: string): DriverProfileData | null {
  if (!slugOrId) return null;
  const norm = slugify(slugOrId);

  // Check in DRIVERS_DATA
  const matched = DRIVERS_DATA.find((d) => {
    return slugify(d.name) === norm || d.id === slugOrId || slugify(d.id) === norm || getStoreSecureToken(d.id) === norm;
  });

  // Also check in registered users for role === 'DRIVER'
  const allUsers = getAllRegisteredUsers();
  const matchedUser = allUsers.find((u) => {
    return (
      u.role === 'DRIVER' &&
      (slugify(u.name) === norm ||
        u.id === slugOrId ||
        slugify(u.id) === norm ||
        getStoreSecureToken(u.id) === norm)
    );
  });

  if (!matched && !matchedUser) {
    // Return null when driver is not found! Never silently fallback to wrong person
    return null;
  }

  if (matched) {
    return buildDriverProfile(matched, norm);
  }

  // Build from registered user
  const u = matchedUser!;
  const isSubActive = isProviderSubscriptionActive(u);
  const secureToken = getStoreSecureToken(u.id);
  const subscriptionStatus: SubscriptionStatus = u.subscription?.status || 'UNSUBSCRIBED';

  const nameParts = (u.name || '').trim().split(/\s+/).filter(Boolean);
  const initials = nameParts.length > 0
    ? nameParts.map((n) => n[0] || '').join('').slice(0, 2).toUpperCase()
    : 'DR';

  return {
    id: u.id,
    slug: slugify(u.name || 'driver'),
    name: u.name || 'Professional Driver',
    initials,
    tint: '#E9F3EE',
    phone: u.phone || '+92 300 8472910',
    whatsapp: u.phone ? u.phone.replace(/\D/g, '') : '923008472910',
    city: u.city || 'Lahore',
    avail: isSubActive ? 'Available' : 'Offline',
    exp: '8 years experience',
    yearsExpNum: 8,
    langs: ['Urdu', 'English', 'Punjabi'],
    bio: `Professional independent chauffeur with extensive driving background. Available for daily city duties, executive VIP rides, and family outstation tours across Pakistan.`,
    licenceCategories: ['Car / Sedan', 'LTV (Commercial)'],
    licenceNumberMasked: u.licenseNumber ? u.licenseNumber.slice(0, 3) + '-DL-****' : 'LHR-DL-98210',
    vehicleTypesCanDrive: ['Automatic Sedans', 'SUVs & 4x4', 'Commercial Vans (LTV)'],
    servicesOffered: ['Daily City (12 Hours)', 'Outstation Tours', 'Monthly Executive Contract', 'Airport Transfers'],
    workPreference: 'Self-Employed & Direct Hire',
    driverOnlyService: true,
    dailyRate12h: 2500,
    outstationDailyRate: 3500,
    monthlySalaryEstimate: 45000,
    tags: ['Family safe', 'M-2 Motorway expert', 'Punctual & Non-smoker'],
    policeVerified: true,
    joinedDate: u.registeredAt ? new Date(u.registeredAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : 'Jan 2024',
    isSubscriptionActive: isSubActive,
    subscriptionStatus,
    secureToken,
  };
}

function buildDriverProfile(d: DriverCardItem, slug: string): DriverProfileData {
  const yrsNum = parseInt((d.exp || '').replace(/\D/g, ''), 10) || 7;

  // Infer licence categories
  const cats: string[] = ['Car / Sedan'];
  const tags = Array.isArray(d.tags) ? d.tags : [];
  if (d.category === 'Outstation' || tags.some((t) => t.includes('Motorway'))) {
    cats.push('LTV (Commercial)');
  }
  if (yrsNum >= 12 || (d.licenseNumber && d.licenseNumber.includes('HTV'))) {
    cats.push('HTV (Heavy Truck)');
  }
  if (d.category === 'VIP Executive') {
    cats.push('VIP Protocol Certified');
  }

  const vTypes: string[] = ['Automatic & Manual Sedans', 'Luxury SUVs & 4x4'];
  if (cats.includes('LTV (Commercial)')) {
    vTypes.push('Toyota HiAce & Passenger Vans');
  }
  if (cats.includes('HTV (Heavy Truck)')) {
    vTypes.push('Light Trucks & Coaster Buses');
  }

  const secureToken = getStoreSecureToken(d.id);

  return {
    id: d.id,
    slug: slugify(d.name),
    name: d.name,
    initials: d.initials || 'DR',
    tint: d.tint || '#E9F3EE',
    phone: d.phone,
    whatsapp: d.whatsapp,
    city: d.city,
    avail: d.avail || 'Available',
    exp: d.exp || '7 years',
    yearsExpNum: yrsNum,
    langs: ['Urdu', 'Punjabi', 'English'],
    bio: `${d.name} is a highly rated ${d.category} driver based in ${d.city} with ${d.exp} of incident-free road service. Available for direct booking.`,
    licenceCategories: cats,
    licenceNumberMasked: d.licenseNumber || 'PK-DL-*****',
    vehicleTypesCanDrive: vTypes,
    servicesOffered: ['12-Hour City Duty', 'Outstation Touring', 'Airport Transfer', 'Intercity Drive'],
    workPreference: 'Direct Customer Chauffeur',
    driverOnlyService: true,
    dailyRate12h: d.dailyRate,
    outstationDailyRate: Math.round(d.dailyRate * 1.4),
    monthlySalaryEstimate: Math.round(d.dailyRate * 18),
    tags,
    policeVerified: true,
    joinedDate: 'Verified 2023',
    isSubscriptionActive: true,
    subscriptionStatus: 'ACTIVE',
    secureToken,
  };
}

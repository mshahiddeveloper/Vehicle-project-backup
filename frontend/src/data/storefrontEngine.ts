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
  totalListingsCount: number;
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
 * Retrieve a public Store by its unique slug or business identifier
 */
export function getStoreDataBySlug(slugOrId: string): StoreData | null {
  const normSlug = slugify(slugOrId);

  // 1. Check registered users first
  const allUsers = getAllRegisteredUsers();
  const matchedUser = allUsers.find((u) => {
    const uSlug = slugify(u.businessName || u.name);
    return uSlug === normSlug || u.id === slugOrId || slugify(u.id) === normSlug;
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
  } else {
    // Check known stores or match across catalog
    const matchingCar = CARS_DATA.find((c) => slugify(c.owner) === normSlug || c.owner.toLowerCase().includes(normSlug.replace(/-/g, ' ')));
    const matchingMover = MOVERS_DATA.find((m) => slugify(m.name) === normSlug || m.name.toLowerCase().includes(normSlug.replace(/-/g, ' ')));
    const matchingShuttle = SHUTTLES_DATA.find((s) => slugify(s.op) === normSlug || s.op.toLowerCase().includes(normSlug.replace(/-/g, ' ')));
    const matchingRide = CITY_RIDES_DATA.find((r) => slugify(r.op) === normSlug || r.op.toLowerCase().includes(normSlug.replace(/-/g, ' ')));

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
    } else {
      // Fallback: derive title from slug
      businessName = normSlug
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      ownerName = businessName;
      primaryService = 'RENT_A_CAR';
      approvedServices = ['RENT_A_CAR'];
    }
  }

  // Strictly isolate listings to the provider's own approved service
  const normTarget = slugify(businessName);
  let cars: VehicleCardItem[] = [];
  let rides: CityRideItem[] = [];
  let shuttles: ShuttleItem[] = [];
  let movers: MoverItem[] = [];

  if (primaryService === 'RENT_A_CAR') {
    cars = CARS_DATA.filter((c) => {
      const cSlug = slugify(c.owner);
      return cSlug === normTarget || normTarget.includes(cSlug) || cSlug.includes(normTarget);
    });
    if (cars.length === 0) cars.push(CARS_DATA[0]);
  } else if (primaryService === 'CITY_TO_CITY') {
    rides = CITY_RIDES_DATA.filter((r) => {
      const rSlug = slugify(r.op);
      return rSlug === normTarget || normTarget.includes(rSlug) || rSlug.includes(normTarget);
    });
    if (rides.length === 0) rides.push(CITY_RIDES_DATA[0]);
  } else if (primaryService === 'PICK_AND_DROP') {
    shuttles = SHUTTLES_DATA.filter((s) => {
      const sSlug = slugify(s.op);
      return sSlug === normTarget || normTarget.includes(sSlug) || sSlug.includes(normTarget);
    });
    if (shuttles.length === 0) shuttles.push(SHUTTLES_DATA[0]);
  } else if (primaryService === 'HOME_SHIFTING') {
    movers = MOVERS_DATA.filter((m) => {
      const mSlug = slugify(m.name);
      return mSlug === normTarget || normTarget.includes(mSlug) || mSlug.includes(normTarget);
    });
    if (movers.length === 0) movers.push(MOVERS_DATA[0]);
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
    id: matchedUser ? matchedUser.id : `store-${normSlug}`,
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
    totalListingsCount: totalCount,
  };
}

/**
 * Retrieve public driver profile by slug or driver ID
 */
export function getDriverProfileBySlug(slugOrId: string): DriverProfileData | null {
  const norm = slugify(slugOrId);

  // Check in DRIVERS_DATA
  const matched = DRIVERS_DATA.find((d) => {
    return slugify(d.name) === norm || d.id === slugOrId || slugify(d.id) === norm;
  });

  // Also check in registered users for role === 'DRIVER'
  const allUsers = getAllRegisteredUsers();
  const matchedUser = allUsers.find((u) => {
    return u.role === 'DRIVER' && (slugify(u.name) === norm || u.id === slugOrId || slugify(u.id) === norm);
  });

  if (!matched && !matchedUser) {
    // If not found, fallback to first driver as default template so link never 404s
    const fallback = DRIVERS_DATA[0];
    return buildDriverProfile(fallback, norm);
  }

  if (matched) {
    return buildDriverProfile(matched, norm);
  }

  // Build from registered user
  const u = matchedUser!;
  return {
    id: u.id,
    slug: slugify(u.name),
    name: u.name,
    initials: u.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase(),
    tint: '#E9F3EE',
    phone: u.phone || '+92 300 8472910',
    whatsapp: u.phone ? u.phone.replace(/\D/g, '') : '923008472910',
    city: u.city || 'Lahore',
    avail: 'Available',
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
  };
}

function buildDriverProfile(d: DriverCardItem, slug: string): DriverProfileData {
  const yrsNum = parseInt(d.exp.replace(/\D/g, ''), 10) || 7;

  // Infer licence categories
  const cats: string[] = ['Car / Sedan'];
  if (d.category === 'Outstation' || d.tags.some((t) => t.includes('Motorway'))) {
    cats.push('LTV (Commercial)');
  }
  if (yrsNum >= 12 || d.licenseNumber?.includes('HTV')) {
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

  return {
    id: d.id,
    slug: slugify(d.name),
    name: d.name,
    initials: d.initials,
    tint: d.tint,
    phone: d.phone,
    whatsapp: d.whatsapp,
    city: d.city,
    avail: d.avail,
    exp: d.exp,
    yearsExpNum: yrsNum,
    langs: d.langs ? d.langs.split(',').map((s) => s.trim()) : ['Urdu', 'English'],
    bio: `${d.name} is an experienced independent chauffeur based in ${d.city} with ${d.exp}. Specializes in smooth driving, motorway navigation, and corporate protocol.`,
    licenceCategories: cats,
    licenceNumberMasked: d.licenseNumber || 'LHR-DL-98210',
    vehicleTypesCanDrive: vTypes,
    servicesOffered: [
      'Daily City (12 Hours)',
      'Outstation Motorway Trips',
      'Monthly Full-Time Chauffeur',
      'VIP Airport Pickup & Protocol',
    ],
    workPreference: 'Self-Employed & Direct Hire',
    driverOnlyService: true,
    dailyRate12h: d.city12Num || 2500,
    outstationDailyRate: parseInt(d.out.replace(/\D/g, ''), 10) || 3500,
    monthlySalaryEstimate: parseInt(d.monthly.replace(/\D/g, ''), 10) || 45000,
    tags: d.tags || ['Punctual', 'Verified Licence', 'Family Safe'],
    policeVerified: d.police || true,
    joinedDate: 'Joined March 2024',
  };
}

export interface CountryInfo {
  code: string;
  name: string;
  flag: string;
  currency: string;
  symbol: string;
  defaultCity: string;
  cities: string[];
  isLive: boolean;
  comingSoonTitle: string;
  comingSoonMessage: string;
  heroHeadline: string;
  heroSubtitle: string;
  idDocumentName: string;
  idPlaceholder: string;
  licenseDocumentName: string;
  licensePlaceholder: string;
  dialCode?: string;
}

export interface CurrencyInfo {
  code: string; // 'PKR', 'EUR', 'USD', 'AED', 'GBP', 'SAR', 'CAD', 'TRY', 'AUD', 'INR'
  name: string;
  symbol: string;
  rateToPkr: number; // 1 unit of this currency = X PKR (e.g. 1 EUR = 300 PKR)
  flag: string;
}

export const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
  { code: 'PKR', name: 'Pakistani Rupee', symbol: 'Rs', rateToPkr: 1.0, flag: '🇵🇰' },
  { code: 'EUR', name: 'Euro', symbol: '€', rateToPkr: 300.0, flag: '🇪🇺' },
  { code: 'USD', name: 'US Dollar', symbol: '$', rateToPkr: 278.5, flag: '🇺🇸' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'AED', rateToPkr: 75.8, flag: '🇦🇪' },
  { code: 'GBP', name: 'British Pound', symbol: '£', rateToPkr: 352.0, flag: '🇬🇧' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'SAR', rateToPkr: 74.2, flag: '🇸🇦' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', rateToPkr: 202.0, flag: '🇨🇦' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', rateToPkr: 8.1, flag: '🇹🇷' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', rateToPkr: 181.0, flag: '🇦🇺' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', rateToPkr: 3.3, flag: '🇮🇳' },
];

export function convertPkrToCurrency(pkrAmount: number | string, currencyCode: string): number {
  const pkr = Number(pkrAmount) || 0;
  const curr = SUPPORTED_CURRENCIES.find((c) => c.code === currencyCode) || SUPPORTED_CURRENCIES[0];
  if (!curr || curr.rateToPkr <= 0) return pkr;
  return pkr / curr.rateToPkr;
}

export function formatPriceWithRate(pkrAmount: number | string, currencyCode: string): string {
  const pkr = Number(pkrAmount) || 0;
  const curr = SUPPORTED_CURRENCIES.find((c) => c.code === currencyCode) || SUPPORTED_CURRENCIES[0];
  const converted = convertPkrToCurrency(pkr, curr.code);

  if (curr.code === 'PKR') {
    return `Rs ${Math.round(converted).toLocaleString()}`;
  }

  if (converted < 100) {
    const formatted = converted.toFixed(1).replace(/\.0$/, '');
    return `${curr.symbol} ${formatted}`;
  }
  return `${curr.symbol} ${Math.round(converted).toLocaleString()}`;
}

export const CURRENCY_MAP: Record<string, { currency: string; symbol: string }> = {
  // Eurozone
  DE: { currency: 'EUR', symbol: '€' },
  FR: { currency: 'EUR', symbol: '€' },
  IT: { currency: 'EUR', symbol: '€' },
  ES: { currency: 'EUR', symbol: '€' },
  NL: { currency: 'EUR', symbol: '€' },
  BE: { currency: 'EUR', symbol: '€' },
  AT: { currency: 'EUR', symbol: '€' },
  PT: { currency: 'EUR', symbol: '€' },
  IE: { currency: 'EUR', symbol: '€' },
  GR: { currency: 'EUR', symbol: '€' },
  FI: { currency: 'EUR', symbol: '€' },
  // North America
  US: { currency: 'USD', symbol: '$' },
  CA: { currency: 'CAD', symbol: 'CA$' },
  MX: { currency: 'MXN', symbol: 'MX$' },
  // UK
  GB: { currency: 'GBP', symbol: '£' },
  // Middle East
  AE: { currency: 'AED', symbol: 'AED' },
  SA: { currency: 'SAR', symbol: 'SAR' },
  QA: { currency: 'QAR', symbol: 'QAR' },
  KW: { currency: 'KWD', symbol: 'KWD' },
  BH: { currency: 'BHD', symbol: 'BHD' },
  OM: { currency: 'OMR', symbol: 'OMR' },
  TR: { currency: 'TRY', symbol: '₺' },
  // South & East Asia
  PK: { currency: 'PKR', symbol: 'Rs' },
  IN: { currency: 'INR', symbol: '₹' },
  JP: { currency: 'JPY', symbol: '¥' },
  CN: { currency: 'CNY', symbol: '¥' },
  SG: { currency: 'SGD', symbol: 'S$' },
  MY: { currency: 'MYR', symbol: 'RM' },
  TH: { currency: 'THB', symbol: '฿' },
  // Oceania
  AU: { currency: 'AUD', symbol: 'A$' },
  NZ: { currency: 'NZD', symbol: 'NZ$' },
  // Other Europe & Americas
  CH: { currency: 'CHF', symbol: 'CHF' },
  SE: { currency: 'SEK', symbol: 'kr' },
  NO: { currency: 'NOK', symbol: 'kr' },
  DK: { currency: 'DKK', symbol: 'kr' },
  ZA: { currency: 'ZAR', symbol: 'R' },
  BR: { currency: 'BRL', symbol: 'R$' },
};

export const DIAL_CODE_MAP: Record<string, string> = {
  PK: '+92',
  AE: '+971',
  GB: '+44',
  SA: '+966',
  US: '+1',
  CA: '+1',
  AU: '+61',
  DE: '+49',
  FR: '+33',
  IN: '+91',
  TR: '+90',
  OM: '+968',
  QA: '+974',
  KW: '+965',
  BH: '+973',
  MY: '+60',
  SG: '+65',
};

export const COUNTRIES: CountryInfo[] = [
  {
    code: 'PK',
    name: 'Pakistan',
    flag: '🇵🇰',
    currency: 'PKR',
    symbol: 'Rs',
    dialCode: '+92',
    defaultCity: 'All Pakistan',
    cities: ['All Pakistan', 'Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Peshawar', 'Multan', 'Faisalabad', 'Gujranwala', 'Sialkot'],
    isLive: true,
    comingSoonTitle: '',
    comingSoonMessage: '',
    heroHeadline: 'Rent Vehicles, Hire Drivers & Book Transport Across Pakistan',
    heroSubtitle: 'Direct connection with vehicle owners, corporate shuttles, verified drivers & captains, and home cargo movers in Lahore, Karachi, Islamabad, and nationwide.',
    idDocumentName: 'National Identity Card (CNIC / Passport)',
    idPlaceholder: '35202-8172910-3',
    licenseDocumentName: 'Driving License (LTV / PSV)',
    licensePlaceholder: 'LHR-DL-449102',
  },
  {
    code: 'DE',
    name: 'Germany',
    flag: '🇩🇪',
    currency: 'EUR',
    symbol: '€',
    dialCode: '+49',
    defaultCity: 'All Germany',
    cities: ['All Germany', 'Berlin', 'Munich', 'Frankfurt', 'Hamburg', 'Cologne', 'Stuttgart', 'Düsseldorf'],
    isLive: false,
    comingSoonTitle: 'Safar is Coming Soon to Germany 🇩🇪',
    comingSoonMessage: 'Direct peer-to-peer car rental, executive chauffeur hire, and corporate transport are launching soon in Berlin, Munich, Frankfurt, and across Germany. Pre-register your fleet below with 0% commission for 3 months!',
    heroHeadline: 'Rent Vehicles & Book Transport in Germany',
    heroSubtitle: 'Direct connection with licensed fleet operators, executive shuttles, and certified chauffeurs in Berlin, Munich, Frankfurt, and nationwide.',
    idDocumentName: 'Personalausweis / Reisepass',
    idPlaceholder: 'T220001293',
    licenseDocumentName: 'German Führerschein (Klasse B / C)',
    licensePlaceholder: 'B072R89901',
  },
  {
    code: 'AE',
    name: 'United Arab Emirates',
    flag: '🇦🇪',
    currency: 'AED',
    symbol: 'AED',
    dialCode: '+971',
    defaultCity: 'All UAE',
    cities: ['All UAE', 'Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah'],
    isLive: false,
    comingSoonTitle: 'Safar is Coming Soon to UAE 🇦🇪',
    comingSoonMessage: 'Luxury car rentals, verified private chauffeurs, and executive vanpools are launching soon across Dubai, Abu Dhabi, and Sharjah. Pre-register your vehicles to be a founding partner!',
    heroHeadline: 'Rent Vehicles & Book Transport Across UAE',
    heroSubtitle: 'Direct connection with luxury car rentals, private chauffeurs, and executive vanpools in Dubai, Abu Dhabi, Sharjah, and nationwide.',
    idDocumentName: 'Emirates ID / Resident Visa',
    idPlaceholder: '784-1990-1234567-1',
    licenseDocumentName: 'RTA / UAE Driving License',
    licensePlaceholder: 'DXB-DL-449102',
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    flag: '🇬🇧',
    currency: 'GBP',
    symbol: '£',
    dialCode: '+44',
    defaultCity: 'All UK',
    cities: ['All UK', 'London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow', 'Edinburgh'],
    isLive: false,
    comingSoonTitle: 'Safar is Coming Soon to United Kingdom 🇬🇧',
    comingSoonMessage: 'Direct vehicle hire, vetted PCO chauffeurs, and removal van services launching in London, Manchester, and Birmingham. Pre-register your fleet today!',
    heroHeadline: 'Rent Vehicles & Book Transport Across UK',
    heroSubtitle: 'Direct connection with licensed private hire operators, executive fleets, and van removal cargo movers in London, Manchester, Birmingham, and nationwide.',
    idDocumentName: 'UK Passport / National Identity',
    idPlaceholder: '502198421',
    licenseDocumentName: 'DVLA Driving Licence',
    licensePlaceholder: 'SMITH954052AB9DE',
  },
  {
    code: 'SA',
    name: 'Saudi Arabia',
    flag: '🇸🇦',
    currency: 'SAR',
    symbol: 'SAR',
    dialCode: '+966',
    defaultCity: 'All Saudi Arabia',
    cities: ['All Saudi Arabia', 'Riyadh', 'Jeddah', 'Makkah', 'Madinah', 'Dammam', 'Khobar'],
    isLive: false,
    comingSoonTitle: 'Safar is Coming Soon to Saudi Arabia 🇸🇦',
    comingSoonMessage: 'Direct vehicle rentals, Umrah executive shuttles, and licensed chauffeurs launching soon in Riyadh, Jeddah, Makkah, and Madinah. Join as a registered host!',
    heroHeadline: 'Rent Vehicles & Book Transport in Saudi Arabia',
    heroSubtitle: 'Direct connection with verified vehicle rentals, Umrah executive shuttles, and professional chauffeurs in Riyadh, Jeddah, Makkah, and Madinah.',
    idDocumentName: 'Iqama / Saudi National ID / Passport',
    idPlaceholder: '2489102841',
    licenseDocumentName: 'Saudi Driving License (Rukhsah)',
    licensePlaceholder: 'KSA-DL-882109',
  },
  {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    currency: 'USD',
    symbol: '$',
    dialCode: '+1',
    defaultCity: 'All USA',
    cities: ['All USA', 'New York', 'Los Angeles', 'Chicago', 'Houston', 'Dallas', 'Miami'],
    isLive: false,
    comingSoonTitle: 'Safar is Coming Soon to United States 🇺🇸',
    comingSoonMessage: 'Peer-to-peer car sharing, professional black car chauffeurs, and moving vans launching across major US metro hubs. Pre-register your fleet now!',
    heroHeadline: 'Rent Vehicles & Book Transport Across USA',
    heroSubtitle: 'Direct connection with verified vehicle owners, executive livery chauffeurs, and interstate movers in New York, Los Angeles, Chicago, and nationwide.',
    idDocumentName: 'State Photo ID / Passport / SSN',
    idPlaceholder: '123-45-6789 or Passport #',
    licenseDocumentName: 'State Driver License',
    licensePlaceholder: 'D1234567 (State Issued)',
  },
  {
    code: 'CA',
    name: 'Canada',
    flag: '🇨🇦',
    currency: 'CAD',
    symbol: 'CA$',
    dialCode: '+1',
    defaultCity: 'All Canada',
    cities: ['All Canada', 'Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa'],
    isLive: false,
    comingSoonTitle: 'Safar is Coming Soon to Canada 🇨🇦',
    comingSoonMessage: 'Direct vehicle rentals and professional drivers launching across Toronto, Vancouver, Montreal, and Calgary. Pre-register your car or fleet!',
    heroHeadline: 'Rent Vehicles & Book Transport Across Canada',
    heroSubtitle: 'Direct connection with verified car owners and licensed chauffeurs in Toronto, Vancouver, Montreal, and nationwide.',
    idDocumentName: 'Provincial Photo Card / Passport',
    idPlaceholder: 'AB123456',
    licenseDocumentName: 'Provincial Driver\'s Licence (G / Class 5)',
    licensePlaceholder: 'D1234-56789-01234',
  },
  {
    code: 'TR',
    name: 'Turkey',
    flag: '🇹🇷',
    currency: 'TRY',
    symbol: '₺',
    dialCode: '+90',
    defaultCity: 'All Turkey',
    cities: ['All Turkey', 'Istanbul', 'Ankara', 'Izmir', 'Antalya', 'Bursa'],
    isLive: false,
    comingSoonTitle: 'Safar is Coming Soon to Turkey 🇹🇷',
    comingSoonMessage: 'Direct vehicle rentals and private transfer chauffeurs launching in Istanbul, Antalya, Ankara, and Izmir. Pre-register your vehicles today!',
    heroHeadline: 'Rent Vehicles & Book Transport in Turkey',
    heroSubtitle: 'Direct connection with verified vehicle owners and licensed drivers in Istanbul, Ankara, Antalya, and nationwide.',
    idDocumentName: 'T.C. Kimlik Kartı / Pasaport',
    idPlaceholder: '12345678901',
    licenseDocumentName: 'Sürücü Belgesi (Ehliyet - Sınıf B)',
    licensePlaceholder: '34-TR-99210',
  },
  {
    code: 'FR',
    name: 'France',
    flag: '🇫🇷',
    currency: 'EUR',
    symbol: '€',
    dialCode: '+33',
    defaultCity: 'All France',
    cities: ['All France', 'Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice', 'Bordeaux'],
    isLive: false,
    comingSoonTitle: 'Safar is Coming Soon to France 🇫🇷',
    comingSoonMessage: 'Direct vehicle rentals and VTC private chauffeurs launching in Paris, Lyon, Marseille, and Nice. Pre-register your fleet now!',
    heroHeadline: 'Rent Vehicles & Book Transport Across France',
    heroSubtitle: 'Direct connection with verified vehicle rentals and licensed chauffeurs in Paris, Lyon, Marseille, and nationwide.',
    idDocumentName: 'Carte Nationale d\'Identité / Passeport',
    idPlaceholder: '080123456789',
    licenseDocumentName: 'Permis de Conduire (Catégorie B)',
    licensePlaceholder: '12AA34567',
  },
];

export function getFlagEmoji(countryCode: string): string {
  try {
    const code = countryCode.toUpperCase();
    if (code.length !== 2) return '🌐';
    const points = code.split('').map((c) => 127397 + c.charCodeAt(0));
    return String.fromCodePoint(...points);
  } catch {
    return '🌐';
  }
}

export function getCountryName(countryCode: string): string {
  try {
    const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
    return regionNames.of(countryCode.toUpperCase()) || countryCode.toUpperCase();
  } catch {
    return countryCode.toUpperCase();
  }
}

export function resolveAnyCountry(rawCode: string): CountryInfo {
  const code = (rawCode || 'PK').toUpperCase();
  const known = COUNTRIES.find((c) => c.code === code);
  if (known) {
    if (!known.dialCode) known.dialCode = DIAL_CODE_MAP[code] || '+92';
    return known;
  }

  const name = getCountryName(code);
  const flag = getFlagEmoji(code);
  const currencyInfo = CURRENCY_MAP[code] || { currency: 'USD', symbol: '$' };

  return {
    code,
    name,
    flag,
    currency: currencyInfo.currency,
    symbol: currencyInfo.symbol,
    dialCode: DIAL_CODE_MAP[code] || '+1',
    defaultCity: `All ${name}`,
    cities: [`All ${name}`, 'Capital Metro', 'Downtown Hub', 'Central Station', 'Airport Terminal'],
    isLive: code === 'PK',
    comingSoonTitle: `Safar is Coming Soon to ${name} ${flag}`,
    comingSoonMessage: `Direct vehicle rentals and chauffeur services are launching soon across ${name}. Pre-register your vehicles or fleet to be a founding partner!`,
    heroHeadline: `Rent Vehicles & Book Transport Across ${name}`,
    heroSubtitle: `Direct connection with vehicle owners, commuter shuttles, licensed chauffeurs, and cargo movers across ${name}.`,
    idDocumentName: `${name} National ID / Passport / State ID`,
    idPlaceholder: `Official ${name} ID or Passport #`,
    licenseDocumentName: `${name} Driving License`,
    licensePlaceholder: `Official ${name} Driving License #`,
  };
}

// ==========================================
// INTERNATIONAL PARTNER PRE-REGISTRATIONS
// ==========================================

export interface InternationalInquiry {
  id: string;
  name: string;
  phone: string;
  email: string;
  countryCode: string;
  countryName: string;
  city: string;
  serviceType: string;
  fleetDetails: string;
  notes?: string;
  createdAt: string;
  status: 'NEW' | 'CONTACTED' | 'ONBOARDED';
}

const STORAGE_INQUIRIES_KEY = 'safarpk_international_inquiries_v2';
const STORAGE_ADMIN_EMAIL_KEY = 'safarpk_admin_contact_email';
export const DEFAULT_ADMIN_EMAIL = 'support@safarpk.com';

export function getAdminContactEmail(): string {
  if (typeof window === 'undefined') return DEFAULT_ADMIN_EMAIL;
  return localStorage.getItem(STORAGE_ADMIN_EMAIL_KEY) || DEFAULT_ADMIN_EMAIL;
}

export function setAdminContactEmail(email: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_ADMIN_EMAIL_KEY, email.trim());
    window.dispatchEvent(new CustomEvent('safarpk_admin_email_changed', { detail: email.trim() }));
  }
}

export function getInternationalInquiries(): InternationalInquiry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_INQUIRIES_KEY);
    if (!raw) {
      // Seed realistic initial international partner registrations for demonstration
      const demo: InternationalInquiry[] = [
        {
          id: 'intl-demo-1',
          name: 'Klaus Schmidt',
          phone: '+49 151 23456789',
          email: 'schmidt.fleets@berlin-rent.de',
          countryCode: 'DE',
          countryName: 'Germany',
          city: 'Berlin',
          serviceType: 'Car Rental & Chauffeur',
          fleetDetails: '5 Mercedes E-Class (2023), 2 V-Class Executive Vans',
          notes: 'Interested in listing our executive fleet in Berlin & Frankfurt airports.',
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          status: 'NEW',
        },
        {
          id: 'intl-demo-2',
          name: 'Tariq Al-Mansoor',
          phone: '+971 50 9876543',
          email: 'tariq@dubaimovers.ae',
          countryCode: 'AE',
          countryName: 'United Arab Emirates',
          city: 'Dubai',
          serviceType: 'Cargo Shifting & Vanpools',
          fleetDetails: '8 Toyota HiAce Vans, 4 Isuzu 3-Ton Shifting Trucks',
          notes: 'Looking to partner for Dubai-Abu Dhabi corporate shuttles and residential shifting.',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          status: 'NEW',
        },
      ];
      localStorage.setItem(STORAGE_INQUIRIES_KEY, JSON.stringify(demo));
      return demo;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveInternationalInquiry(
  inquiry: Omit<InternationalInquiry, 'id' | 'createdAt' | 'status'>
): InternationalInquiry {
  const current = getInternationalInquiries();
  const newRecord: InternationalInquiry = {
    ...inquiry,
    id: `intl-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    createdAt: new Date().toISOString(),
    status: 'NEW',
  };
  current.unshift(newRecord);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_INQUIRIES_KEY, JSON.stringify(current));
    window.dispatchEvent(new CustomEvent('safarpk_intl_inquiry_added', { detail: newRecord }));
  }
  return newRecord;
}

export function updateInternationalInquiryStatus(id: string, status: InternationalInquiry['status']): void {
  const current = getInternationalInquiries();
  const idx = current.findIndex((item) => item.id === id);
  if (idx !== -1) {
    current[idx].status = status;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_INQUIRIES_KEY, JSON.stringify(current));
      window.dispatchEvent(new CustomEvent('safarpk_intl_inquiry_updated', { detail: current[idx] }));
    }
  }
}

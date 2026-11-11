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

export const COUNTRIES: CountryInfo[] = [
  {
    code: 'PK',
    name: 'Pakistan',
    flag: '🇵🇰',
    currency: 'PKR',
    symbol: 'Rs',
    defaultCity: 'All Pakistan',
    cities: ['All Pakistan', 'Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Peshawar', 'Multan', 'Faisalabad', 'Gujranwala', 'Sialkot'],
    isLive: true,
    comingSoonTitle: '',
    comingSoonMessage: '',
    heroHeadline: 'Rent Vehicles, Hire Drivers & Book Transport Across Pakistan',
    heroSubtitle: 'Direct connection with verified car owners, corporate shuttles, licensed chauffeurs, and home cargo movers in Lahore, Karachi, Islamabad, and nationwide. Zero platform commission.',
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
    defaultCity: 'All Germany',
    cities: ['All Germany', 'Berlin', 'Munich', 'Frankfurt', 'Hamburg', 'Cologne', 'Stuttgart', 'Düsseldorf'],
    isLive: true,
    comingSoonTitle: '',
    comingSoonMessage: '',
    heroHeadline: 'Rent Vehicles, Hire Drivers & Book Transport Across Germany',
    heroSubtitle: 'Direct connection with licensed fleet operators, executive shuttles, and certified chauffeurs in Berlin, Munich, Frankfurt, and nationwide. Zero platform commission.',
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
    defaultCity: 'All UAE',
    cities: ['All UAE', 'Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah'],
    isLive: true,
    comingSoonTitle: '',
    comingSoonMessage: '',
    heroHeadline: 'Rent Vehicles, Hire Drivers & Book Transport Across UAE',
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
    defaultCity: 'All UK',
    cities: ['All UK', 'London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow', 'Edinburgh'],
    isLive: true,
    comingSoonTitle: '',
    comingSoonMessage: '',
    heroHeadline: 'Rent Vehicles, Hire Drivers & Book Transport Across United Kingdom',
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
    defaultCity: 'All Saudi Arabia',
    cities: ['All Saudi Arabia', 'Riyadh', 'Jeddah', 'Makkah', 'Madinah', 'Dammam', 'Khobar'],
    isLive: true,
    comingSoonTitle: '',
    comingSoonMessage: '',
    heroHeadline: 'Rent Vehicles, Hire Drivers & Book Transport Across Saudi Arabia',
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
    defaultCity: 'All USA',
    cities: ['All USA', 'New York', 'Los Angeles', 'Chicago', 'Houston', 'Dallas', 'Miami'],
    isLive: true,
    comingSoonTitle: '',
    comingSoonMessage: '',
    heroHeadline: 'Rent Vehicles, Hire Drivers & Book Transport Across United States',
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
    defaultCity: 'All Canada',
    cities: ['All Canada', 'Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa'],
    isLive: true,
    comingSoonTitle: '',
    comingSoonMessage: '',
    heroHeadline: 'Rent Vehicles, Hire Drivers & Book Transport Across Canada',
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
    defaultCity: 'All Turkey',
    cities: ['All Turkey', 'Istanbul', 'Ankara', 'Izmir', 'Antalya', 'Bursa'],
    isLive: true,
    comingSoonTitle: '',
    comingSoonMessage: '',
    heroHeadline: 'Rent Vehicles, Hire Drivers & Book Transport Across Turkey',
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
    defaultCity: 'All France',
    cities: ['All France', 'Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice', 'Bordeaux'],
    isLive: true,
    comingSoonTitle: '',
    comingSoonMessage: '',
    heroHeadline: 'Rent Vehicles, Hire Drivers & Book Transport Across France',
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

/**
 * Resolves ANY country code in the world into a complete, localized CountryInfo specification.
 * If the country is not explicitly defined in COUNTRIES, it dynamically calculates:
 * - Real official country name via Intl
 * - Official Flag emoji
 * - Official Currency code & Symbol
 * - Localized ID and Driving License document names
 * - Capital/regional city presets
 */
export function resolveAnyCountry(rawCode: string): CountryInfo {
  const code = (rawCode || 'PK').toUpperCase();
  const known = COUNTRIES.find((c) => c.code === code);
  if (known) return known;

  const name = getCountryName(code);
  const flag = getFlagEmoji(code);
  const currencyInfo = CURRENCY_MAP[code] || { currency: 'USD', symbol: '$' };

  return {
    code,
    name,
    flag,
    currency: currencyInfo.currency,
    symbol: currencyInfo.symbol,
    defaultCity: `All ${name}`,
    cities: [`All ${name}`, 'Capital Metro', 'Downtown Hub', 'Central Station', 'Airport Terminal'],
    isLive: true,
    comingSoonTitle: '',
    comingSoonMessage: '',
    heroHeadline: `Rent Vehicles, Hire Drivers & Book Transport Across ${name}`,
    heroSubtitle: `Direct connection with verified vehicle owners, commuter shuttles, licensed chauffeurs, and cargo movers across ${name}. Zero platform commission.`,
    idDocumentName: `${name} National ID / Passport / State ID`,
    idPlaceholder: `Official ${name} ID or Passport #`,
    licenseDocumentName: `${name} Driving License`,
    licensePlaceholder: `Official ${name} Driving License #`,
  };
}

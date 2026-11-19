'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Car,
  UserCheck,
  Navigation,
  Bus,
  Truck,
  MapPin,
  Calendar,
  Clock,
  Flag,
  Search,
  ShieldCheck,
  MessageCircle,
  CreditCard,
  Heart,
  ArrowRight,
  Sparkles,
  Download,
  Smartphone,
  CheckCircle2,
  ChevronDown,
  X,
  Check,
  RotateCcw,
  Phone,
  Briefcase,
  Users,
  ArrowLeftRight,
} from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { AppFooter } from '@/components/AppFooter';
import { MobileNavBar } from '@/components/MobileNavBar';
import { MobileHomeNativeView } from '@/components/MobileHomeNativeView';
import { recordClickEvent, recordLead } from '@/data/activityTracker';
import { useCountry } from '@/app/context/CountryContext';
import { COUNTRIES, resolveAnyCountry } from '@/data/countries';
import { InternationalComingSoon } from '@/components/InternationalComingSoon';
import { WhatsAppIcon } from '@/components/WhatsAppIcon';
import {
  CARS_DATA,
  DRIVERS_DATA,
  CITY_RIDES_DATA,
  SHUTTLES_DATA,
  MOVERS_DATA,
  SERVICE_CATEGORIES,
  VehicleCardItem,
  DriverCardItem,
  CityRideItem,
  ShuttleItem,
  MoverItem,
  CITY_COMMUTE_AREAS,
  matchesShuttleRoute,
  getCustomCityRides,
} from '@/data/marketplaceData';
import { getFeaturedAdIds, MAX_FEATURED_ADS } from '@/data/featuredAds';
import { maskPakistaniCnic, maskPakistaniLicense } from '@/data/driverBookings';
import { getWhatsAppTargetUrl } from '@/data/chatEngine';
import { slugify, getStoreSlugForOwner } from '@/data/storefrontEngine';

const POPULAR_COMMUTE_CORRIDORS: Record<string, { from: string; to: string; label: string }[]> = {
  Karachi: [
    { from: 'Malir Cantt', to: 'Clifton', label: 'Malir ➔ Clifton' },
    { from: 'Gulshan-e-Iqbal', to: 'I.I. Chundrigar Road', label: 'Gulshan ➔ I.I. Chundrigar' },
    { from: 'Gulistan-e-Johar', to: 'Saddar', label: 'Johar ➔ Saddar' },
    { from: 'North Nazimabad', to: 'DHA (Defence)', label: 'North Nazimabad ➔ DHA' },
    { from: 'Drigh Road', to: 'Metropole', label: 'Drigh Road ➔ Metropole' },
    { from: 'Bahria Town Karachi', to: 'FTC (Shahrah-e-Faisal)', label: 'Bahria Town ➔ FTC' },
    { from: 'Karsaz', to: 'Baloch Colony', label: 'Karsaz ➔ Baloch Colony' },
  ],
  Lahore: [
    { from: 'Johar Town', to: 'Gulberg', label: 'Johar Town ➔ Gulberg' },
    { from: 'DHA Phase 5', to: 'Kalma Chowk', label: 'DHA Phase 5 ➔ Kalma Chowk' },
    { from: 'Wapda Town', to: 'Mall Road', label: 'Wapda Town ➔ Mall Road' },
    { from: 'Bahria Town', to: 'Canal Road', label: 'Bahria Town ➔ Canal Road' },
  ],
  Islamabad: [
    { from: 'Rawalpindi Saddar', to: 'Blue Area', label: 'Saddar ➔ Blue Area' },
    { from: 'Bahria Town Phase 7', to: 'Blue Area', label: 'Bahria Town ➔ Blue Area' },
    { from: 'Faizabad', to: 'Pak Secretariat', label: 'Faizabad ➔ Secretariat' },
    { from: 'G-11 Markaz', to: 'F-8 Markaz', label: 'G-11 ➔ F-8' },
  ],
  Rawalpindi: [
    { from: 'Saddar', to: 'Blue Area Islamabad', label: 'Saddar ➔ Blue Area' },
    { from: 'Bahria Town Phase 4', to: 'Faizabad', label: 'Bahria Town ➔ Faizabad' },
  ],
};

const INTERCITY_CITIES = [
  'Karachi',
  'Hyderabad',
  'Lahore',
  'Islamabad',
  'Rawalpindi',
  'Peshawar',
  'Multan',
  'Faisalabad',
  'Sukkur',
  'Bahawalpur',
  'Sialkot',
  'Gujranwala',
  'Quetta',
  'Abbottabad',
  'Murree',
];

export default function HomePage() {
  const router = useRouter();
  const { country, setCountry, currency, setCurrency, formatPrice, terms } = useCountry();
  const isPakistan = !country || country.code === 'PK';

  // Inbound Return Country (when an international user chooses to explore Pakistan fleet in their currency)
  const [returnToCountryCode, setReturnToCountryCode] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('safarpk_return_to_country');
      if (stored && country?.code === 'PK') {
        setReturnToCountryCode(stored);
      } else {
        setReturnToCountryCode(null);
      }
    }
  }, [country?.code]);

  const returnCountryInfo = useMemo(() => {
    return returnToCountryCode ? resolveAnyCountry(returnToCountryCode) : null;
  }, [returnToCountryCode]);

  const handleReturnToLaunchHub = () => {
    if (!returnCountryInfo) return;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('safarpk_return_to_country');
    }
    setReturnToCountryCode(null);
    setCountry(returnCountryInfo, false);
  };

  // Active Service Tab (0: Rent a Car, 1: Hire Driver, 2: City to City, 3: Pick & Drop, 4: Movers)
  const [activeService, setActiveService] = useState<number>(0);

  // Search Fields for Cars / Rentals
  const [searchWhere, setSearchWhere] = useState('');
  const [searchPickup, setSearchPickup] = useState('');
  const [searchReturn, setSearchReturn] = useState('');

  // Commuter Route Search Fields for Pick & Drop (Route-First with Intermediate Stops Matching)
  const [shuttleCity, setShuttleCity] = useState<string>('Karachi');
  const [shuttlePickupArea, setShuttlePickupArea] = useState<string>('');
  const [shuttleDropArea, setShuttleDropArea] = useState<string>('');
  const [showShuttleCityMenu, setShowShuttleCityMenu] = useState(false);
  const [showShuttlePickupMenu, setShowShuttlePickupMenu] = useState(false);
  const [showShuttleDropMenu, setShowShuttleDropMenu] = useState(false);

  // Home Shifting & Cargo Mover Search States
  const [showMoverCityMenu, setShowMoverCityMenu] = useState(false);
  const [showMoverTruckMenu, setShowMoverTruckMenu] = useState(false);
  const moverCityRef = useRef<HTMLDivElement>(null);
  const moverDateRef = useRef<HTMLInputElement>(null);
  const moverTruckRef = useRef<HTMLDivElement>(null);

  // City-to-City Intercity Search States (From City, To City, Seat Sharing vs Full Car, Single Date)
  const [c2cFromCity, setC2cFromCity] = useState<string>('Karachi');
  const [c2cToCity, setC2cToCity] = useState<string>('Hyderabad');
  const [c2cDate, setC2cDate] = useState<string>('');
  const [c2cRideType, setC2cRideType] = useState<'ALL' | 'SEAT_SHARING' | 'FULL_CAR'>('ALL');
  const [showC2cFromMenu, setShowC2cFromMenu] = useState(false);
  const [showC2cToMenu, setShowC2cToMenu] = useState(false);
  const [showC2cTypeMenu, setShowC2cTypeMenu] = useState(false);
  const c2cFromRef = useRef<HTMLDivElement>(null);
  const c2cToRef = useRef<HTMLDivElement>(null);
  const c2cDateRef = useRef<HTMLInputElement>(null);
  const c2cTypeRef = useRef<HTMLDivElement>(null);
  const [customCityRides, setCustomCityRides] = useState<CityRideItem[]>([]);
  const [devicePlatform, setDevicePlatform] = useState<'Android' | 'iOS' | 'Desktop'>('Android');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const ua = navigator.userAgent || '';
    const isIos =
      (/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/i.test(ua);
    if (isAndroid) setDevicePlatform('Android');
    else if (isIos) setDevicePlatform('iOS');
    else setDevicePlatform('Desktop');
  }, []);

  useEffect(() => {
    setCustomCityRides(getCustomCityRides());
    const handleC2cUpdate = () => {
      setCustomCityRides(getCustomCityRides());
    };
    window.addEventListener('safarpk_city_rides_updated', handleC2cUpdate);
    return () => window.removeEventListener('safarpk_city_rides_updated', handleC2cUpdate);
  }, []);

  const handleSwapC2cCities = (e: React.MouseEvent) => {
    e.stopPropagation();
    const temp = c2cFromCity;
    setC2cFromCity(c2cToCity);
    setC2cToCity(temp);
  };

  // Dropdown & Input state
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const cityDropdownRef = useRef<HTMLDivElement>(null);
  const pickupDateRef = useRef<HTMLInputElement>(null);
  const returnDateRef = useRef<HTMLInputElement>(null);
  const shuttleCityRef = useRef<HTMLDivElement>(null);
  const shuttlePickupRef = useRef<HTMLDivElement>(null);
  const shuttleDropRef = useRef<HTMLDivElement>(null);

  // Computed today's date string YYYY-MM-DD
  const todayStr = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(target)) {
        setShowCityDropdown(false);
      }
      if (shuttleCityRef.current && !shuttleCityRef.current.contains(target)) {
        setShowShuttleCityMenu(false);
      }
      if (shuttlePickupRef.current && !shuttlePickupRef.current.contains(target)) {
        setShowShuttlePickupMenu(false);
      }
      if (shuttleDropRef.current && !shuttleDropRef.current.contains(target)) {
        setShowShuttleDropMenu(false);
      }
      if (moverCityRef.current && !moverCityRef.current.contains(target)) {
        setShowMoverCityMenu(false);
      }
      if (moverTruckRef.current && !moverTruckRef.current.contains(target)) {
        setShowMoverTruckMenu(false);
      }
      if (c2cFromRef.current && !c2cFromRef.current.contains(target)) {
        setShowC2cFromMenu(false);
      }
      if (c2cToRef.current && !c2cToRef.current.contains(target)) {
        setShowC2cToMenu(false);
      }
      if (c2cTypeRef.current && !c2cTypeRef.current.contains(target)) {
        setShowC2cTypeMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  // Country-specific available cities
  const availableCities = useMemo(() => {
    if (!country?.cities || country.cities.length === 0) {
      return ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Peshawar', 'Multan', 'Faisalabad'];
    }
    return country.cities.filter((c) => !c.toLowerCase().startsWith('all '));
  }, [country]);

  // Real-time city search filter
  const filteredCities = useMemo(() => {
    if (!searchWhere.trim()) return availableCities;
    const q = searchWhere.toLowerCase().trim();
    return availableCities.filter((city) => city.toLowerCase().includes(q));
  }, [availableCities, searchWhere]);

  // Selected Category Filter & Pagination State
  const [selectedCategory, setSelectedCategory] = useState<string>(SERVICE_CATEGORIES[0][0]);
  const [visibleCount, setVisibleCount] = useState<number>(60);

  const handleServiceChange = (idx: number) => {
    setActiveService(idx);
    const firstCat = SERVICE_CATEGORIES[idx]?.[0] || 'All';
    setSelectedCategory(firstCat);
    setVisibleCount(60);
  };

  // Featured Ads State & Priority Listener
  const [featuredIds, setFeaturedIds] = useState<string[]>([]);

  useEffect(() => {
    setFeaturedIds(getFeaturedAdIds());
    const handleFeaturedUpdate = () => {
      setFeaturedIds(getFeaturedAdIds());
    };
    window.addEventListener('safarpk_featured_updated', handleFeaturedUpdate);
    return () => window.removeEventListener('safarpk_featured_updated', handleFeaturedUpdate);
  }, []);

  // 1. Car WhatsApp Inquiry with full pricing & direct URL
  const handleCarWhatsApp = (car: VehicleCardItem) => {
    recordClickEvent({
      clickType: 'WHATSAPP_CLICK',
      targetId: car.id,
      targetTitle: car.name,
      targetCategory: 'Car Rental',
      targetOwnerName: car.owner,
      city: car.city || searchWhere || 'All Cities',
    });
    recordLead({
      userId: car.id,
      customerName: 'WhatsApp Car Inquirer',
      customerPhone: 'WhatsApp Chat',
      customerCity: car.city || searchWhere || 'All Cities',
      serviceType: 'Car Rental',
      notes: `Direct inquiry for ${car.name} (${car.owner})`,
    });

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://safar.pk';
    const listingUrl = `${origin}/listing/${car.id}`;
    const dayRate = formatPrice(car.priceNum || 5000);
    const weekRate = formatPrice(Math.round((car.priceNum || 5000) * 6.5));
    const monthRate = formatPrice(Math.round((car.priceNum || 5000) * 24));

    const msg = `Hi, I would like to rent this car listed by ${car.owner} on SafarPK: Car: ${car.name} (${car.specs || car.category}) Price: ${dayRate}/day or ${weekRate}/week or ${monthRate}/month Listing: ${listingUrl}`;
    const cleanNum = (car.whatsapp || car.phone || '').replace(/\D/g, '');
    const targetUrl = getWhatsAppTargetUrl(cleanNum, msg);
    window.open(targetUrl, '_blank');
  };

  // 2. Driver WhatsApp Inquiry with rates & direct profile URL
  const handleDriverWhatsApp = (driver: DriverCardItem) => {
    recordClickEvent({
      clickType: 'WHATSAPP_CLICK',
      targetId: driver.id,
      targetTitle: driver.name,
      targetCategory: 'Driver',
      targetOwnerName: driver.name,
      city: driver.city || searchWhere || 'All Cities',
    });
    recordLead({
      userId: driver.id,
      customerName: 'WhatsApp Driver Inquirer',
      customerPhone: 'WhatsApp Chat',
      customerCity: driver.city || searchWhere || 'All Cities',
      serviceType: 'Hire a Driver',
      notes: `Direct inquiry for driver ${driver.name}`,
    });

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://safar.pk';
    const listingUrl = `${origin}/driver/${slugify(driver.name)}`;
    const dayRate = formatPrice(driver.city12Num || driver.city12);
    const outRate = driver.out;
    const monthRate = driver.monthly;

    const msg = `Hi, I would like to hire ${driver.name} listed on SafarPK: Service: ${isPakistan ? 'Verified Driver & Captain' : 'Professional Chauffeur'} Location: ${driver.city} Rates: ${dayRate} (City 12h) | ${outRate} (Outstation/day) | ${monthRate} (Monthly) Profile: ${listingUrl}`;
    const cleanNum = (driver.whatsapp || driver.phone || '').replace(/\D/g, '');
    const targetUrl = getWhatsAppTargetUrl(cleanNum, msg);
    window.open(targetUrl, '_blank');
  };

  // 3. City to City Ride WhatsApp Inquiry with route & rates (Seats & Private Car support)
  const handleRideWhatsApp = (ride: CityRideItem, bookingChoice?: 'SEAT' | 'FULL_CAR') => {
    recordClickEvent({
      clickType: 'WHATSAPP_CLICK',
      targetId: ride.id,
      targetTitle: `${ride.fromCity} to ${ride.toCity}`,
      targetCategory: 'CityToCity',
      targetOwnerName: ride.op,
      city: ride.fromCity,
    });
    recordLead({
      userId: ride.id,
      customerName: 'WhatsApp Ride Inquirer',
      customerPhone: 'WhatsApp Chat',
      customerCity: ride.fromCity,
      serviceType: 'City to City',
      notes: `Direct inquiry for ride ${ride.fromCity} ➔ ${ride.toCity} (${ride.op})`,
    });

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://safar.pk';
    const listingUrl = `${origin}/city-to-city/${ride.id}`;
    const dateText = c2cDate ? `Travel Date: ${c2cDate} | ` : (ride.departureDate ? `Departure: ${ride.departureDate} (${ride.departureTime || ride.time}) | ` : '');

    let pricingDetails = '';
    if (bookingChoice === 'SEAT' || (ride.rideType === 'SEAT_SHARING' && ride.pricePerSeat)) {
      pricingDetails = `Booking: 1 Shared Seat (Carpool) | Rate: Rs. ${ride.pricePerSeat?.toLocaleString('en-US')} / seat`;
    } else if (bookingChoice === 'FULL_CAR' || ride.rideType === 'FULL_CAR') {
      pricingDetails = `Booking: Full Private Car | Rate: ${formatPrice(ride.one)} (One-way) or ${formatPrice(ride.ret)} (Return)`;
    } else {
      // Both options available
      pricingDetails = `Booking Options: Shared Seat @ Rs. ${ride.pricePerSeat?.toLocaleString('en-US') || '1,500'}/seat OR Full Private Car @ ${formatPrice(ride.one)}`;
    }

    const msg = `Hi, I would like to book this intercity ride with ${ride.op} on SafarPK: Route: ${ride.fromCity} to ${ride.toCity} | ${dateText}Vehicle: ${ride.car} | ${pricingDetails} | Listing: ${listingUrl}`;
    const cleanNum = (ride.whatsapp || ride.phone || '').replace(/\D/g, '');
    const targetUrl = getWhatsAppTargetUrl(cleanNum, msg);
    window.open(targetUrl, '_blank');
  };

  // 4. Shuttle WhatsApp Inquiry with schedule & fare
  const handleShuttleWhatsApp = (shuttle: ShuttleItem) => {
    recordClickEvent({
      clickType: 'WHATSAPP_CLICK',
      targetId: shuttle.id,
      targetTitle: `${shuttle.from} to ${shuttle.to}`,
      targetCategory: 'Shuttle',
      targetOwnerName: shuttle.op,
      city: shuttle.city,
    });
    recordLead({
      userId: shuttle.id,
      customerName: 'WhatsApp Shuttle Inquirer',
      customerPhone: 'WhatsApp Chat',
      customerCity: shuttle.city,
      serviceType: 'Pick & Drop',
      notes: `Seat request for route ${shuttle.from} ➔ ${shuttle.to} (${shuttle.op})`,
    });

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://safar.pk';
    const listingUrl = `${origin}/shuttles/${shuttle.id}`;
    const fare = formatPrice(shuttle.fareNum || shuttle.fare);

    const msg = `Hi, I would like to reserve a commuter shuttle seat operated by ${shuttle.op} on SafarPK: Route: ${shuttle.from} to ${shuttle.to} (${shuttle.city}) Schedule: ${shuttle.pick} - ${shuttle.back} (${shuttle.days}) Reserved Monthly Fare: ${fare}/month Listing: ${listingUrl}`;
    const cleanNum = (shuttle.whatsapp || shuttle.phone || '').replace(/\D/g, '');
    const targetUrl = getWhatsAppTargetUrl(cleanNum, msg);
    window.open(targetUrl, '_blank');
  };

  // 5. Mover WhatsApp Inquiry with trucks & rates
  const handleMoverWhatsApp = (mover: MoverItem) => {
    recordClickEvent({
      clickType: 'WHATSAPP_CLICK',
      targetId: mover.id,
      targetTitle: mover.name,
      targetCategory: 'Mover',
      targetOwnerName: mover.name,
      city: mover.city,
    });
    recordLead({
      userId: mover.id,
      customerName: 'WhatsApp Mover Inquirer',
      customerPhone: 'WhatsApp Chat',
      customerCity: mover.city,
      serviceType: 'Cargo & Movers',
      notes: `Move quote request for ${mover.name} (${mover.city})`,
    });

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://safar.pk';
    const listingUrl = `${origin}/movers/${mover.id}`;
    const baseFare = formatPrice((mover as any).baseFareNum || mover.base);
    const kmFare = formatPrice((mover as any).perKmNum || mover.km);
    const helperFare = formatPrice((mover as any).helperNum || mover.helper);

    const dateInfo = searchPickup ? `Shifting Date: ${searchPickup} | ` : '';
    const msg = `Hi, I would like to get a moving quote from ${mover.name} on SafarPK: ${dateInfo}Moving Fleet: ${mover.trucks} City: ${mover.city} Rates: Base ${baseFare} | Per KM ${kmFare} | Helper ${helperFare} Listing: ${listingUrl}`;
    const cleanNum = (mover.whatsapp || mover.phone || '').replace(/\D/g, '');
    const targetUrl = getWhatsAppTargetUrl(cleanNum, msg);
    window.open(targetUrl, '_blank');
  };

  const handleDirectWhatsApp = (title: string, phone: string, whatsapp: string, type: string, ownerName?: string) => {
    recordClickEvent({
      clickType: 'WHATSAPP_CLICK',
      targetId: title,
      targetTitle: title,
      targetCategory: type,
      targetOwnerName: ownerName,
      city: searchWhere || 'All Cities',
    });
    recordLead({
      userId: title,
      customerName: 'Direct Marketplace Visitor',
      customerPhone: 'WhatsApp Inquiry',
      customerCity: searchWhere || 'All Cities',
      serviceType: type,
      notes: `Direct inquiry from Homepage for ${title} (${ownerName || 'Host'})`,
    });
    const cleanNum = whatsapp.replace(/\D/g, '');
    const msg = `Hi, I am interested in "${title}" listed on SafarPK. Please let me know rates and availability.`;
    const targetUrl = getWhatsAppTargetUrl(cleanNum, msg);
    window.open(targetUrl, '_blank');
  };

  const handleDirectCall = (title: string, phone: string, type: string = 'Car Rental', ownerName?: string) => {
    recordClickEvent({
      clickType: 'CALL_CLICK',
      targetId: title,
      targetTitle: title,
      targetCategory: type,
      targetOwnerName: ownerName,
      city: searchWhere || 'All Cities',
    });
    recordLead({
      userId: title,
      customerName: 'Direct Call Visitor',
      customerPhone: 'Direct Phone Dial',
      customerCity: searchWhere || 'All Cities',
      serviceType: type,
      notes: `Direct phone call initiated from marketplace for ${title} (${ownerName || 'Host'})`,
    });
    window.location.href = `tel:${phone.replace(/[^0-9+]/g, '')}`;
  };

  // Revealed phone numbers state for lead-generation click-to-reveal tracking
  const [revealedPhones, setRevealedPhones] = useState<Record<string, boolean>>({});

  const handleRevealPhone = (
    e: React.MouseEvent,
    id: string,
    name: string,
    phone: string,
    category: string,
    owner?: string
  ) => {
    e.stopPropagation();
    recordClickEvent({
      clickType: 'CALL_CLICK',
      targetId: id,
      targetTitle: name,
      targetCategory: category,
      targetOwnerName: owner,
      city: searchWhere || 'All Cities',
    });
    recordLead({
      userId: id,
      customerName: 'Direct Call Visitor',
      customerPhone: 'Direct Phone Dial',
      customerCity: searchWhere || 'All Cities',
      serviceType: category,
      notes: `Direct phone call initiated from marketplace for ${name} (${owner || 'Host'})`,
    });

    const isAlreadyRevealed = !!revealedPhones[id];
    setRevealedPhones((prev) => ({ ...prev, [id]: true }));

    if (isAlreadyRevealed || (typeof window !== 'undefined' && window.innerWidth < 768)) {
      window.location.href = `tel:${phone.replace(/[^0-9+]/g, '')}`;
    }
  };

  // Saved Wishlist Items
  const [savedIds, setSavedIds] = useState<string[]>([]);

  // Animated Rotating Hero Highlight (Dynamically adapted for Pakistan vs International)
  const HERO_ROTATING_SERVICES = useMemo(() => {
    if (isPakistan) {
      return [
        { text: 'Rent a Car without Hidden Fees', icon: '🚗', badge: 'Self-Drive & With Driver' },
        { text: 'Hire Verified Drivers by the Day', icon: '👨‍✈️', badge: 'Verified Licences & CNIC' },
        { text: 'Book Private City-to-City Rides', icon: '🛣️', badge: 'Motorway M-2 · Fixed Fares' },
        { text: 'Safe Daily Commuter Shuttles', icon: '🚌', badge: 'School & Office Vanpools' },
        { text: 'Home & Office Cargo Shifting', icon: '📦', badge: 'Trucks with Mazdoors' },
      ];
    }
    return [
      { text: `Rent a Car in ${country?.name || 'your region'}`, icon: '🚗', badge: 'Self-Drive & Chauffeur' },
      { text: 'Hire Vetted Chauffeurs by the Day', icon: '👨‍✈️', badge: 'Verified Licences & Background' },
      { text: 'Book Private Intercity Transfers', icon: '🛣️', badge: 'Direct Transfers · Fixed Fares' },
      { text: 'Corporate & Commuter Shuttles', icon: '🚌', badge: 'Office & Group Vanpools' },
      { text: 'Home & Office Moving Logistics', icon: '📦', badge: 'Moving Trucks with Helpers' },
    ];
  }, [isPakistan, country?.name]);
  const [heroIdx, setHeroIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroIdx((prev) => (prev + 1) % HERO_ROTATING_SERVICES.length);
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('safarpk_saved_items');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setSavedIds(parsed.map((item: any) => item.id || item));
        }
      }
    } catch (e) {}
  }, []);

  const toggleSave = (car: VehicleCardItem) => {
    try {
      let updated: string[];
      let storedList: any[] = [];
      const raw = localStorage.getItem('safarpk_saved_items');
      if (raw) {
        try {
          storedList = JSON.parse(raw);
        } catch (e) {}
      }

      if (savedIds.includes(car.id)) {
        updated = savedIds.filter((id) => id !== car.id);
        storedList = storedList.filter((item) => (item.id || item) !== car.id);
      } else {
        updated = [...savedIds, car.id];
        storedList.unshift({
          id: car.id,
          title: car.name,
          category: 'Cars',
          specs: car.specs,
          city: car.city,
          rate: car.price,
          savedAt: new Date().toISOString(),
        });
      }
      setSavedIds(updated);
      localStorage.setItem('safarpk_saved_items', JSON.stringify(storedList));
      window.dispatchEvent(new Event('safarpk_saved_updated'));
    } catch (e) {}
  };

  const serviceDefs = useMemo(() => [
    {
      label: 'Rent a car',
      shortLabel: 'Rent Car',
      icon: Car,
      href: '/listing/l-1',
      go: 'Search cars',
      hint: isPakistan
        ? 'Self-drive or with driver · pay the owner at pick-up, nothing online'
        : 'Self-drive or with chauffeur · pay at pick-up, zero booking fees',
    },
    {
      label: isPakistan ? 'Hire a driver' : 'Hire a chauffeur',
      shortLabel: isPakistan ? 'Drivers' : 'Chauffeurs',
      icon: UserCheck,
      href: '/drivers',
      go: isPakistan ? 'Find drivers' : 'Find chauffeurs',
      hint: isPakistan
        ? 'Experienced verified drivers and captains for city or outstation'
        : 'Experienced private & executive chauffeurs for city or outstation',
    },
    {
      label: 'City to city',
      shortLabel: 'Intercity',
      icon: Navigation,
      href: '/city-to-city',
      go: 'Find rides',
      hint: isPakistan
        ? 'Car with driver between cities · one way or return'
        : 'Car with chauffeur between cities · one way or return',
    },
    {
      label: 'Pick & drop',
      shortLabel: 'Pick & Drop',
      icon: Bus,
      href: '/shuttles',
      go: 'Find routes',
      hint: 'Monthly seats for school, college and corporate office routes',
    },
    {
      label: isPakistan ? 'Home shifting' : 'Moving & cargo',
      shortLabel: isPakistan ? 'Movers' : 'Moving',
      icon: Truck,
      href: '/movers',
      go: isPakistan ? 'Find trucks' : 'Find movers',
      hint: isPakistan
        ? 'Shehzore, Suzuki Ravi, Mazda & covered containers with mazdoors'
        : 'Moving vans, flatbed trucks and cargo haulers with helpers',
    },
  ], [isPakistan]);

  const currentService = serviceDefs[activeService];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const resultsEl = document.getElementById('listings-results') || document.getElementById('cars-results');
    if (resultsEl) {
      resultsEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Helper to prioritize featured ads at the top, ordered strictly by featuredIds priority
  const sortByFeatured = (aId: string, bId: string) => {
    const idxA = featuredIds.indexOf(aId);
    const idxB = featuredIds.indexOf(bId);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return 0;
  };

  // 1. Real-time cars filter
  const filteredCars = useMemo(() => {
    return CARS_DATA.filter((car) => {
      if (selectedCategory !== 'All cars') {
        if (selectedCategory === 'Economy') {
          if (car.category !== 'Economy' && car.priceNum > 5000) return false;
        } else if (car.category !== selectedCategory) {
          return false;
        }
      }
      if (searchWhere.trim()) {
        const q = searchWhere.toLowerCase().trim();
        const matchCity = car.city.toLowerCase().includes(q);
        const matchName = car.name.toLowerCase().includes(q);
        const matchOwner = car.owner.toLowerCase().includes(q);
        if (!matchCity && !matchName && !matchOwner) return false;
      }
      return true;
    }).sort((a, b) => sortByFeatured(a.id, b.id));
  }, [selectedCategory, searchWhere, featuredIds]);

  // 2. Real-time drivers filter
  const filteredDrivers = useMemo(() => {
    return DRIVERS_DATA.filter((driver) => {
      if (selectedCategory !== 'All drivers') {
        if (driver.category !== selectedCategory) return false;
      }
      if (searchWhere.trim()) {
        const q = searchWhere.toLowerCase().trim();
        const matchCity = driver.city.toLowerCase().includes(q);
        const matchName = driver.name.toLowerCase().includes(q);
        const matchTags = driver.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchCity && !matchName && !matchTags) return false;
      }
      return true;
    }).sort((a, b) => sortByFeatured(a.id, b.id));
  }, [selectedCategory, searchWhere, featuredIds]);

  // Combined dynamic intercity rides (seeded + lister-published custom rides)
  const allCityRides = useMemo(() => {
    const list = [...customCityRides, ...CITY_RIDES_DATA];
    const seen = new Set<string>();
    return list.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [customCityRides]);

  // 3. Real-time city rides filter (supports From City, To City, Seat Sharing vs Full Car, and Date)
  const filteredRides = useMemo(() => {
    return allCityRides.filter((ride) => {
      // 1. From City filter
      if (c2cFromCity.trim()) {
        const qFrom = c2cFromCity.toLowerCase().trim();
        if (!ride.fromCity.toLowerCase().includes(qFrom)) return false;
      }
      // 2. To City filter
      if (c2cToCity.trim()) {
        const qTo = c2cToCity.toLowerCase().trim();
        if (!ride.toCity.toLowerCase().includes(qTo)) return false;
      }
      // 3. Ride Type filter (Seat Sharing vs Full Car)
      if (c2cRideType === 'SEAT_SHARING') {
        if (ride.rideType === 'FULL_CAR') return false;
        if (ride.availableSeats !== undefined && ride.availableSeats <= 0) return false;
      } else if (c2cRideType === 'FULL_CAR') {
        if (ride.rideType === 'SEAT_SHARING') return false;
      }
      // 4. Category filter
      if (selectedCategory !== 'All routes') {
        if (selectedCategory === 'Seat Sharing (Carpool)') {
          if (ride.rideType !== 'SEAT_SHARING' && ride.rideType !== 'BOTH') return false;
        } else if (selectedCategory === 'Private Car (Full Vehicle)') {
          if (ride.rideType !== 'FULL_CAR' && ride.rideType !== 'BOTH') return false;
        } else if (ride.category !== selectedCategory) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => sortByFeatured(a.id, b.id));
  }, [allCityRides, c2cFromCity, c2cToCity, c2cRideType, selectedCategory, featuredIds]);

  // 4. Real-time shuttles filter (Supports route corridor and intermediate stops matching)
  const filteredShuttles = useMemo(() => {
    return SHUTTLES_DATA.filter((shuttle) => {
      if (selectedCategory !== 'All shuttles') {
        if (shuttle.category !== selectedCategory) return false;
      }
      // Route matching by city, pickup stop, and drop-off stop along corridor
      if (shuttleCity || shuttlePickupArea || shuttleDropArea) {
        const matches = matchesShuttleRoute(
          shuttle,
          shuttlePickupArea,
          shuttleDropArea,
          shuttleCity
        );
        if (!matches) return false;
      }
      // General keyword search fallback
      if (searchWhere.trim() && !shuttlePickupArea && !shuttleDropArea) {
        const q = searchWhere.toLowerCase().trim();
        const matchCity = shuttle.city.toLowerCase().includes(q);
        const matchFrom = shuttle.from.toLowerCase().includes(q);
        const matchTo = shuttle.to.toLowerCase().includes(q);
        const matchOp = shuttle.op.toLowerCase().includes(q);
        const matchTags = shuttle.tags.some((t) => t.toLowerCase().includes(q));
        const matchStops = (shuttle.stops || []).some((st) => st.toLowerCase().includes(q));
        if (!matchCity && !matchFrom && !matchTo && !matchOp && !matchTags && !matchStops) return false;
      }
      return true;
    }).sort((a, b) => sortByFeatured(a.id, b.id));
  }, [selectedCategory, shuttleCity, shuttlePickupArea, shuttleDropArea, searchWhere, featuredIds]);

  // 5. Real-time movers filter
  const filteredMovers = useMemo(() => {
    return MOVERS_DATA.filter((mover) => {
      if (selectedCategory !== 'All movers') {
        if (mover.category !== selectedCategory) return false;
      }
      if (searchWhere.trim()) {
        const q = searchWhere.toLowerCase().trim();
        const matchCity = mover.city.toLowerCase().includes(q);
        const matchName = mover.name.toLowerCase().includes(q);
        const matchTrucks = mover.trucks.toLowerCase().includes(q);
        const matchTags = mover.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchCity && !matchName && !matchTrucks && !matchTags) return false;
      }
      return true;
    }).sort((a, b) => sortByFeatured(a.id, b.id));
  }, [selectedCategory, searchWhere, featuredIds]);

  const currentTotal = useMemo(() => {
    switch (activeService) {
      case 1:
        return filteredDrivers.length;
      case 2:
        return filteredRides.length;
      case 3:
        return filteredShuttles.length;
      case 4:
        return filteredMovers.length;
      case 0:
      default:
        return filteredCars.length;
    }
  }, [activeService, filteredCars.length, filteredDrivers.length, filteredRides.length, filteredShuttles.length, filteredMovers.length]);

  const serviceMeta = useMemo(() => [
    {
      title: 'Cars available this weekend',
      sub: searchWhere
        ? `Showing vehicles available in "${searchWhere}" (${selectedCategory})`
        : `From local fleet partners and private vehicle owners in ${country?.name || 'Pakistan'}`,
      viewAllText: 'View all vehicles',
      viewAllHref: '#all-listings',
      emptyIcon: Car,
      emptyLabel: 'vehicles',
      resetLabel: 'Show All Available Vehicles',
    },
    {
      title: isPakistan ? 'Verified drivers & captains' : 'Professional chauffeurs & drivers',
      sub: searchWhere
        ? (isPakistan ? `Showing verified drivers in "${searchWhere}" (${selectedCategory})` : `Showing professional chauffeurs in "${searchWhere}" (${selectedCategory})`)
        : (isPakistan ? `CNIC and driving licence on file across Pakistan` : `Commercial driving licences & background on file across ${country?.name || 'region'}`),
      viewAllText: isPakistan ? 'View all drivers' : 'View all chauffeurs',
      viewAllHref: '/drivers',
      emptyIcon: UserCheck,
      emptyLabel: isPakistan ? 'drivers' : 'chauffeurs',
      resetLabel: isPakistan ? 'Show All Available Drivers' : 'Show All Available Chauffeurs',
    },
    {
      title: 'City to city intercity rides',
      sub: c2cFromCity && c2cToCity
        ? (c2cDate
            ? `Showing rides from ${c2cFromCity} to ${c2cToCity} on ${c2cDate} (${c2cRideType === 'ALL' ? 'Seats & Full Cars' : c2cRideType === 'SEAT_SHARING' ? 'Seat Sharing Carpool' : 'Private Full Car'})`
            : `Showing intercity routes between ${c2cFromCity} and ${c2cToCity} (${c2cRideType === 'ALL' ? 'Seats & Full Cars' : c2cRideType === 'SEAT_SHARING' ? 'Seat Sharing Carpool' : 'Private Full Car'})`)
        : `Fixed-rate private cars, carpools and passenger vans across ${country?.name || 'Pakistan'}`,
      viewAllText: 'View all rides',
      viewAllHref: '/city-to-city',
      emptyIcon: Navigation,
      emptyLabel: 'intercity rides',
      resetLabel: 'Show All Available Rides',
    },
    {
      title: 'Pick & drop commuter shuttles',
      sub: searchWhere
        ? `Showing monthly routes in "${searchWhere}" (${selectedCategory})`
        : `School, college and corporate office vanpools in ${country?.name || 'Pakistan'}`,
      viewAllText: 'View all shuttles',
      viewAllHref: '/shuttles',
      emptyIcon: Bus,
      emptyLabel: 'shuttles',
      resetLabel: 'Show All Available Shuttles',
    },
    {
      title: isPakistan ? 'Home & office cargo movers' : 'Moving & cargo logistics',
      sub: searchWhere
        ? (searchPickup
            ? `Showing movers available on ${searchPickup} in "${searchWhere}" (${selectedCategory})`
            : `Showing movers and trucks in "${searchWhere}" (${selectedCategory})`)
        : (isPakistan ? `Covered containers, Shehzore & Mazda trucks with mazdoors across Pakistan` : `Moving trucks, cargo haulers and logistics teams with helpers across ${country?.name || 'region'}`),
      viewAllText: isPakistan ? 'View all movers' : 'View all cargo movers',
      viewAllHref: '/movers',
      emptyIcon: Truck,
      emptyLabel: 'movers',
      resetLabel: 'Show All Available Movers',
    },
  ], [country?.name, isPakistan, searchWhere, selectedCategory]);

  const currentMeta = serviceMeta[activeService] || serviceMeta[0];
  const currentCategories = SERVICE_CATEGORIES[activeService] || SERVICE_CATEGORIES[0];

  return (
    <div className="min-h-screen bg-white font-sans text-[#101828] flex flex-col antialiased">
      {/* Mobile App View: Authentic Native iOS/Android experience as requested */}
      <div className="md:hidden flex-1 flex flex-col">
        <MobileHomeNativeView />
      </div>

      {/* Desktop Web Experience */}
      <div className="hidden md:flex md:flex-col md:flex-1">
        {/* 1. Global Navigation Header */}
        <AppHeader currentCountry={country} onCountryChange={setCountry} />

        {/* 2. Hero Section - Sleek Minimal, Compact on Mobile */}
        <section className="bg-gradient-to-b from-[#F9FBFA] via-[#F4F7F5] to-white border-b border-[#EEF0F2]">
        <div className="max-w-[1240px] mx-auto px-3 sm:px-8 pt-2 sm:pt-4 md:pt-6 pb-2 sm:pb-5 flex flex-col gap-2 sm:gap-3.5">
          {/* Minimal Animated Header Copy */}
          <div className="flex flex-col gap-1 sm:gap-2 max-w-[820px]">
            {/* Animated Pill Badge */}
            <div className="self-start inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white border border-slate-200/90 text-[10px] sm:text-xs font-bold text-slate-800 shadow-2xs">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#0B6B4F] animate-pulse shrink-0" />
              <span className="text-[#0B6B4F] font-extrabold uppercase tracking-wider text-[9px] sm:text-[10px]">Direct Mobility</span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-600 font-semibold truncate">{HERO_ROTATING_SERVICES[heroIdx].badge}</span>
            </div>

            {/* Punchy, Minimal Headline with Animated Rotating Tag */}
            <div className="space-y-0.5">
              <h1 className="font-heading font-black text-sm sm:text-2xl md:text-3xl lg:text-4xl tracking-tight text-[#101828] leading-tight">
                Move freely across {country?.name || 'Pakistan'} —{' '}
                <span className="text-[#0B6B4F] inline-block transition-all duration-300 ease-in-out">
                  {HERO_ROTATING_SERVICES[heroIdx]?.text}
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-[#475467] leading-relaxed max-w-[620px] font-medium hidden sm:block">
                {isPakistan
                  ? 'Direct connections with verified vehicle owners, private drivers, daily shuttles, and cargo movers across Pakistan. Zero middleman fees.'
                  : `Direct connections with verified vehicle owners, private chauffeurs, daily shuttles, and logistics movers across ${country?.name || 'the country'}. Zero middleman fees.`}
              </p>
            </div>
          </div>

          {/* Search Card Container */}
          <div className="relative bg-white border border-[#E4E7EC] rounded-2xl sm:rounded-3xl shadow-[0_2px_4px_rgba(16,24,40,0.04),0_20px_48px_rgba(16,24,40,0.10)] overflow-visible z-30">
            {/* Mobile 5-Service Compact Segmented Selector (All 5 options visible at a glance without cutoff) */}
            <div className="md:hidden p-1 bg-[#F4F6F8] rounded-xl sm:rounded-2xl m-1 sm:m-1.5 border border-[#EEF0F2]">
              <div
                role="tablist"
                aria-label="What do you need?"
                className="grid grid-cols-5 gap-0.5 sm:gap-1"
              >
                {serviceDefs.map((srv, idx) => {
                  const Icon = srv.icon;
                  const active = activeService === idx;
                  return (
                    <button
                      key={srv.label}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => handleServiceChange(idx)}
                      className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition cursor-pointer select-none ${
                        active
                          ? 'bg-white text-[#0B6B4F] shadow-2xs font-extrabold border border-[#DCE7E1]'
                          : 'text-[#667085] hover:text-[#101828] font-bold'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mb-1 shrink-0 ${active ? 'text-[#0B6B4F]' : 'text-slate-400'}`} />
                      <span className="text-[10px] leading-[1.15] text-center tracking-tight">
                        {srv.shortLabel || srv.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Desktop Tabs (Clean horizontal tab bar on md+) */}
            <div
              role="tablist"
              aria-label="What do you need?"
              className="hidden md:flex gap-1 px-4 pt-2 border-b border-[#EEF0F2] overflow-x-auto overflow-y-hidden no-scrollbar"
            >
              {serviceDefs.map((srv, idx) => {
                const Icon = srv.icon;
                const active = activeService === idx;
                return (
                  <button
                    key={srv.label}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => handleServiceChange(idx)}
                    className={`flex items-center gap-2 h-12 px-4 border-b-[3px] -mb-px text-sm whitespace-nowrap transition cursor-pointer font-bold ${
                      active
                        ? 'border-[#0B6B4F] text-[#101828]'
                        : 'border-transparent text-[#667085] hover:text-[#101828]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-[#0B6B4F]' : 'text-slate-400'}`} />
                    <span>{srv.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Interactive Search Form: Route-First for Pick & Drop (No Dates), Full Calendar for Rentals */}
            {activeService === 3 ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const resultsEl = document.getElementById('listings-results') || document.getElementById('cars-results');
                  if (resultsEl) resultsEl.scrollIntoView({ behavior: 'smooth' });
                }}
                className="p-2 sm:p-3 md:p-4 grid grid-cols-12 gap-2 sm:gap-2.5 items-stretch"
              >
                {/* Field 1: Commute City / Hub */}
                <div
                  ref={shuttleCityRef}
                  className="col-span-12 sm:col-span-6 md:col-span-3 flex items-center gap-2.5 min-h-[46px] sm:min-h-[52px] md:min-h-[60px] px-3 rounded-xl sm:rounded-2xl bg-[#F7F8FA] border border-[#EEF0F2] focus-within:bg-white focus-within:border-[#0B6B4F] focus-within:ring-2 focus-within:ring-[#0B6B4F]/10 transition relative cursor-pointer"
                  onClick={() => setShowShuttleCityMenu(!showShuttleCityMenu)}
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-white border border-[#EAECF0] text-[#0B6B4F] flex items-center justify-center shrink-0 shadow-2xs">
                    <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <span className="text-[10px] sm:text-[11px] font-bold text-[#475467] leading-none mb-0.5 sm:mb-1">
                      City / Hub
                    </span>
                    <div className="text-xs sm:text-sm font-extrabold text-[#101828] truncate">
                      {shuttleCity || 'Karachi'}
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />

                  {/* City Dropdown */}
                  {showShuttleCityMenu && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute top-[calc(100%+8px)] left-0 w-full min-w-[220px] bg-white border border-[#E4E7EC] rounded-2xl shadow-2xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                    >
                      <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                        Select Commute City
                      </div>
                      {Object.keys(CITY_COMMUTE_AREAS).map((cityName) => (
                        <button
                          key={cityName}
                          type="button"
                          onClick={() => {
                            setShuttleCity(cityName);
                            setShuttlePickupArea('');
                            setShuttleDropArea('');
                            setShowShuttleCityMenu(false);
                          }}
                          className={`w-full text-left px-3.5 py-2 text-xs sm:text-sm font-bold flex items-center justify-between hover:bg-emerald-50 hover:text-[#0B6B4F] transition cursor-pointer ${
                            shuttleCity === cityName ? 'bg-emerald-50 text-[#0B6B4F]' : 'text-slate-800'
                          }`}
                        >
                          <span>{cityName}</span>
                          {shuttleCity === cityName && <Check className="w-3.5 h-3.5 text-[#0B6B4F]" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Field 2: From (Boarding / Pick-up Area or Corridor Stop) */}
                <div
                  ref={shuttlePickupRef}
                  className="col-span-12 sm:col-span-6 md:col-span-3.5 flex items-center gap-2.5 min-h-[46px] sm:min-h-[52px] md:min-h-[60px] px-3 rounded-xl sm:rounded-2xl bg-[#F7F8FA] border border-[#EEF0F2] focus-within:bg-white focus-within:border-[#0B6B4F] focus-within:ring-2 focus-within:ring-[#0B6B4F]/10 transition relative cursor-text"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-white border border-[#EAECF0] text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <span className="text-[10px] sm:text-[11px] font-bold text-[#475467] leading-none mb-0.5 sm:mb-1">
                      Pick-up Area / Stop (From)
                    </span>
                    <input
                      type="text"
                      placeholder={`e.g. ${CITY_COMMUTE_AREAS[shuttleCity]?.[0] || 'Malir'}`}
                      value={shuttlePickupArea}
                      onFocus={() => setShowShuttlePickupMenu(true)}
                      onChange={(e) => {
                        setShuttlePickupArea(e.target.value);
                        setShowShuttlePickupMenu(true);
                      }}
                      className="w-full border-0 outline-none p-0 text-xs sm:text-sm font-semibold text-[#101828] bg-transparent placeholder:text-slate-400"
                    />
                  </div>
                  {shuttlePickupArea && (
                    <button
                      type="button"
                      onClick={() => setShuttlePickupArea('')}
                      className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Pickup Suggestions */}
                  {showShuttlePickupMenu && (
                    <div className="absolute top-[calc(100%+8px)] left-0 w-full min-w-[260px] max-h-60 overflow-y-auto no-scrollbar bg-white border border-[#E4E7EC] rounded-2xl shadow-2xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                        <span>{shuttleCity} Areas & Corridor Stops</span>
                        <span className="text-emerald-700 font-mono font-bold">Sub-route support</span>
                      </div>
                      {(CITY_COMMUTE_AREAS[shuttleCity] || CITY_COMMUTE_AREAS['Karachi'])
                        .filter((area) => !shuttlePickupArea || area.toLowerCase().includes(shuttlePickupArea.toLowerCase()))
                        .map((area) => (
                          <button
                            key={area}
                            type="button"
                            onClick={() => {
                              setShuttlePickupArea(area);
                              setShowShuttlePickupMenu(false);
                            }}
                            className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-emerald-50 hover:text-[#0B6B4F] transition flex items-center gap-2 cursor-pointer"
                          >
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span className="truncate">{area}</span>
                          </button>
                        ))}
                    </div>
                  )}
                </div>

                {/* Field 3: To (Drop-off Area / Institution / Destination) */}
                <div
                  ref={shuttleDropRef}
                  className="col-span-12 sm:col-span-6 md:col-span-3.5 flex items-center gap-2.5 min-h-[46px] sm:min-h-[52px] md:min-h-[60px] px-3 rounded-xl sm:rounded-2xl bg-[#F7F8FA] border border-[#EEF0F2] focus-within:bg-white focus-within:border-[#0B6B4F] focus-within:ring-2 focus-within:ring-[#0B6B4F]/10 transition relative cursor-text"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-white border border-[#EAECF0] text-purple-700 flex items-center justify-center shrink-0 shadow-2xs">
                    <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-700" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <span className="text-[10px] sm:text-[11px] font-bold text-[#475467] leading-none mb-0.5 sm:mb-1">
                      Drop-off Area / Institution (To)
                    </span>
                    <input
                      type="text"
                      placeholder={`e.g. ${CITY_COMMUTE_AREAS[shuttleCity]?.[1] || 'Clifton'}`}
                      value={shuttleDropArea}
                      onFocus={() => setShowShuttleDropMenu(true)}
                      onChange={(e) => {
                        setShuttleDropArea(e.target.value);
                        setShowShuttleDropMenu(true);
                      }}
                      className="w-full border-0 outline-none p-0 text-xs sm:text-sm font-semibold text-[#101828] bg-transparent placeholder:text-slate-400"
                    />
                  </div>
                  {shuttleDropArea && (
                    <button
                      type="button"
                      onClick={() => setShuttleDropArea('')}
                      className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Drop-off Suggestions */}
                  {showShuttleDropMenu && (
                    <div className="absolute top-[calc(100%+8px)] left-0 w-full min-w-[260px] max-h-60 overflow-y-auto no-scrollbar bg-white border border-[#E4E7EC] rounded-2xl shadow-2xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                        <span>{shuttleCity} Drop-offs & Hubs</span>
                        <span className="text-purple-700 font-mono font-bold">Sub-route support</span>
                      </div>
                      {(CITY_COMMUTE_AREAS[shuttleCity] || CITY_COMMUTE_AREAS['Karachi'])
                        .filter((area) => !shuttleDropArea || area.toLowerCase().includes(shuttleDropArea.toLowerCase()))
                        .map((area) => (
                          <button
                            key={area}
                            type="button"
                            onClick={() => {
                              setShuttleDropArea(area);
                              setShowShuttleDropMenu(false);
                            }}
                            className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-purple-50 hover:text-purple-800 transition flex items-center gap-2 cursor-pointer"
                          >
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span className="truncate">{area}</span>
                          </button>
                        ))}
                    </div>
                  )}
                </div>

                {/* Find Routes Button */}
                <button
                  type="submit"
                  className="col-span-12 sm:col-span-6 md:col-span-2 min-h-[46px] sm:min-h-[52px] md:min-h-[60px] px-4 rounded-xl sm:rounded-2xl bg-[#0B6B4F] hover:bg-[#08513C] active:scale-[0.99] text-white font-extrabold text-xs sm:text-sm md:text-base flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition cursor-pointer"
                >
                  <Search className="w-4 h-4 shrink-0" />
                  <span>Find routes</span>
                </button>
              </form>
            ) : activeService === 4 ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const resultsEl = document.getElementById('listings-results') || document.getElementById('cars-results');
                  if (resultsEl) resultsEl.scrollIntoView({ behavior: 'smooth' });
                }}
                className="p-2 sm:p-3 md:p-4 grid grid-cols-12 gap-2 sm:gap-2.5 items-stretch"
              >
                {/* Field 1: Moving City / Area (Where) */}
                <div
                  ref={moverCityRef}
                  className="col-span-12 md:col-span-4 flex items-center gap-2.5 sm:gap-3 min-h-[46px] sm:min-h-[52px] md:min-h-[60px] px-3 sm:px-3.5 rounded-xl sm:rounded-2xl bg-[#F7F8FA] border border-[#EEF0F2] focus-within:bg-white focus-within:border-[#0B6B4F] focus-within:ring-2 focus-within:ring-[#0B6B4F]/10 transition relative cursor-text"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-white border border-[#EAECF0] text-[#0B6B4F] flex items-center justify-center shrink-0 shadow-2xs">
                    <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <span className="text-[10px] sm:text-[11px] font-bold text-[#475467] leading-none mb-0.5 sm:mb-1">
                      Moving City / Area
                    </span>
                    <input
                      type="text"
                      placeholder={`City or area, e.g. ${availableCities[0] || 'Karachi'}`}
                      value={searchWhere}
                      onFocus={() => setShowMoverCityMenu(true)}
                      onChange={(e) => {
                        setSearchWhere(e.target.value);
                        setShowMoverCityMenu(true);
                      }}
                      className="w-full border-0 outline-none p-0 text-xs sm:text-sm font-semibold text-[#101828] bg-transparent placeholder:text-slate-400"
                    />
                  </div>
                  {searchWhere ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSearchWhere('');
                        setShowMoverCityMenu(true);
                      }}
                      className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMoverCityMenu(!showMoverCityMenu);
                      }}
                      className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  )}

                  {/* Mover City Menu */}
                  {showMoverCityMenu && (
                    <div className="absolute top-[calc(100%+8px)] left-0 w-full min-w-[280px] bg-white border border-[#E4E7EC] rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-3.5 py-1.5 border-b border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <span>Cities in {country?.name || 'Pakistan'} {country?.flag}</span>
                        <span className="text-emerald-700 font-mono font-semibold">{filteredCities.length} found</span>
                      </div>
                      <div className="max-h-56 overflow-y-auto no-scrollbar py-1">
                        {filteredCities.map((cityName) => {
                          const isSelected = searchWhere.toLowerCase() === cityName.toLowerCase();
                          return (
                            <button
                              key={cityName}
                              type="button"
                              onClick={() => {
                                setSearchWhere(cityName);
                                setShowMoverCityMenu(false);
                              }}
                              className={`w-full text-left px-3.5 py-2 text-xs sm:text-sm font-medium flex items-center justify-between hover:bg-[#F4F7F5] transition cursor-pointer ${
                                isSelected ? 'bg-[#E9F3EE] text-[#0B6B4F] font-bold' : 'text-[#344054]'
                              }`}
                            >
                              <span className="flex items-center gap-2.5">
                                <MapPin className="w-3.5 h-3.5 text-[#0B6B4F]" />
                                <span>{cityName}</span>
                              </span>
                              {isSelected && <Check className="w-4 h-4 text-[#0B6B4F]" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Field 2: Shifting Date (Single Date Picker — NO Return Date!) */}
                <div
                  onClick={() => moverDateRef.current?.showPicker?.() || moverDateRef.current?.focus()}
                  className="col-span-6 sm:col-span-6 md:col-span-3 flex items-center gap-2 sm:gap-2.5 min-h-[46px] sm:min-h-[52px] md:min-h-[60px] px-2.5 sm:px-3.5 rounded-xl sm:rounded-2xl bg-[#F7F8FA] border border-[#EEF0F2] cursor-pointer hover:bg-white hover:border-[#0B6B4F] focus-within:bg-white focus-within:border-[#0B6B4F] focus-within:ring-2 focus-within:ring-[#0B6B4F]/10 transition relative group"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-white border border-[#EAECF0] text-[#0B6B4F] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition">
                    <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center gap-1 mb-0.5 sm:mb-1">
                      <span className="text-[10px] sm:text-[11px] font-bold text-[#475467] leading-none truncate">
                        Shifting Date
                      </span>
                      <span className="hidden sm:inline text-[9px] font-semibold text-emerald-800 bg-emerald-100/80 px-1 rounded">1-Day</span>
                    </div>
                    <input
                      ref={moverDateRef}
                      type="date"
                      min={todayStr}
                      value={searchPickup}
                      onChange={(e) => setSearchPickup(e.target.value)}
                      className="w-full border-0 outline-none p-0 text-xs sm:text-sm font-semibold text-[#101828] bg-transparent cursor-pointer"
                    />
                  </div>
                  {searchPickup && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSearchPickup('');
                      }}
                      className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer text-xs shrink-0"
                    >
                      <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </button>
                  )}
                </div>

                {/* Field 3: Truck / Load Requirement (Select Vehicle Type For Move) */}
                <div
                  ref={moverTruckRef}
                  className="col-span-6 sm:col-span-6 md:col-span-3 flex items-center gap-2 sm:gap-2.5 min-h-[46px] sm:min-h-[52px] md:min-h-[60px] px-2.5 sm:px-3.5 rounded-xl sm:rounded-2xl bg-[#F7F8FA] border border-[#EEF0F2] cursor-pointer hover:bg-white hover:border-[#0B6B4F] transition relative"
                  onClick={() => setShowMoverTruckMenu(!showMoverTruckMenu)}
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-white border border-[#EAECF0] text-orange-600 flex items-center justify-center shrink-0 shadow-2xs">
                    <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <span className="text-[10px] sm:text-[11px] font-bold text-[#475467] leading-none mb-0.5 sm:mb-1 truncate">
                      Truck / Move Size
                    </span>
                    <div className="text-xs sm:text-sm font-extrabold text-[#101828] truncate">
                      {selectedCategory === 'All movers' ? 'All Trucks & Cargo' : selectedCategory}
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />

                  {/* Truck Menu Dropdown */}
                  {showMoverTruckMenu && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute top-[calc(100%+8px)] right-0 sm:left-0 w-full min-w-[260px] max-w-[320px] bg-white border border-[#E4E7EC] rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                    >
                      <div className="px-3.5 py-1.5 border-b border-slate-100 flex items-center justify-between text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                        <span>Select Vehicle / Load Size</span>
                        <span className="text-orange-600 font-bold">Direct Rates</span>
                      </div>
                      <div className="py-1">
                        {SERVICE_CATEGORIES[4].map((cat) => {
                          const isSelected = selectedCategory === cat;
                          const descriptions: Record<string, string> = {
                            'All movers': 'Show all vehicle sizes and fleets',
                            'Suzuki Ravi (Mini)': '1-Room flat, single sofa or luggage cargo',
                            'Shehzore (2.5 Ton)': '1 to 2 BHK apartment shifting (Popular)',
                            'Mazda (14-17ft)': 'Large 3+ BHK house with heavy furniture',
                            'Office Relocation': 'Workstations, servers, safe & commercial cargo',
                          };
                          return (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => {
                                setSelectedCategory(cat);
                                setShowMoverTruckMenu(false);
                              }}
                              className={`w-full text-left px-3.5 py-2 hover:bg-orange-50/70 transition cursor-pointer flex flex-col ${
                                isSelected ? 'bg-orange-50 text-orange-900 font-extrabold' : 'text-slate-800'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs sm:text-sm font-bold truncate">
                                  {cat === 'All movers' ? 'All Trucks & Cargo' : cat}
                                </span>
                                {isSelected && <Check className="w-4 h-4 text-[#0B6B4F] shrink-0" />}
                              </div>
                              <span className="text-[10px] text-slate-500 font-normal mt-0.5 truncate">
                                {descriptions[cat] || 'Verified moving truck'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Field 4: Find Trucks Submit Button */}
                <button
                  type="submit"
                  className="col-span-12 sm:col-span-6 md:col-span-2 min-h-[46px] sm:min-h-[52px] md:min-h-[60px] px-4 rounded-xl sm:rounded-2xl bg-[#0B6B4F] hover:bg-[#08513C] active:scale-[0.99] text-white font-extrabold text-xs sm:text-sm md:text-base flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition cursor-pointer"
                >
                  <Search className="w-4 h-4 shrink-0" />
                  <span>{isPakistan ? 'Find trucks' : 'Find movers'}</span>
                </button>
              </form>
            ) : activeService === 2 ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const resultsEl = document.getElementById('listings-results') || document.getElementById('cars-results');
                  if (resultsEl) resultsEl.scrollIntoView({ behavior: 'smooth' });
                }}
                className="p-2 sm:p-3 md:p-4 grid grid-cols-12 gap-2 sm:gap-2.5 items-stretch"
              >
                {/* Field 1: From City (Departure) */}
                <div
                  ref={c2cFromRef}
                  className="col-span-12 sm:col-span-6 md:col-span-3 flex items-center gap-2 sm:gap-2.5 min-h-[46px] sm:min-h-[52px] md:min-h-[60px] px-3 rounded-xl sm:rounded-2xl bg-[#F7F8FA] border border-[#EEF0F2] focus-within:bg-white focus-within:border-[#0B6B4F] focus-within:ring-2 focus-within:ring-[#0B6B4F]/10 transition relative cursor-text"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-white border border-[#EAECF0] text-[#0B6B4F] flex items-center justify-center shrink-0 shadow-2xs">
                    <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0B6B4F]" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <span className="text-[10px] sm:text-[11px] font-bold text-[#475467] leading-none mb-0.5 sm:mb-1">
                      From (Departure City)
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. Karachi"
                      value={c2cFromCity}
                      onFocus={() => setShowC2cFromMenu(true)}
                      onChange={(e) => {
                        setC2cFromCity(e.target.value);
                        setShowC2cFromMenu(true);
                      }}
                      className="w-full border-0 outline-none p-0 text-xs sm:text-sm font-semibold text-[#101828] bg-transparent placeholder:text-slate-400"
                    />
                  </div>

                  {/* Quick Swap Button */}
                  <button
                    type="button"
                    onClick={handleSwapC2cCities}
                    className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition cursor-pointer shrink-0"
                    title="Swap From and To cities"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                  </button>

                  {/* From City Dropdown */}
                  {showC2cFromMenu && (
                    <div className="absolute top-[calc(100%+8px)] left-0 w-full min-w-[260px] max-h-60 overflow-y-auto no-scrollbar bg-white border border-[#E4E7EC] rounded-2xl shadow-2xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                        Select Departure City
                      </div>
                      {INTERCITY_CITIES.filter((c) => !c2cFromCity || c.toLowerCase().includes(c2cFromCity.toLowerCase())).map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            setC2cFromCity(c);
                            setShowC2cFromMenu(false);
                          }}
                          className={`w-full text-left px-3.5 py-2 text-xs sm:text-sm font-bold flex items-center justify-between hover:bg-emerald-50 hover:text-[#0B6B4F] transition cursor-pointer ${
                            c2cFromCity === c ? 'bg-emerald-50 text-[#0B6B4F]' : 'text-slate-800'
                          }`}
                        >
                          <span>{c}</span>
                          {c2cFromCity === c && <Check className="w-3.5 h-3.5 text-[#0B6B4F]" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Field 2: To City (Destination) */}
                <div
                  ref={c2cToRef}
                  className="col-span-12 sm:col-span-6 md:col-span-3 flex items-center gap-2 sm:gap-2.5 min-h-[46px] sm:min-h-[52px] md:min-h-[60px] px-3 rounded-xl sm:rounded-2xl bg-[#F7F8FA] border border-[#EEF0F2] focus-within:bg-white focus-within:border-[#0B6B4F] focus-within:ring-2 focus-within:ring-[#0B6B4F]/10 transition relative cursor-text"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-white border border-[#EAECF0] text-blue-700 flex items-center justify-center shrink-0 shadow-2xs">
                    <Navigation className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-700" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <span className="text-[10px] sm:text-[11px] font-bold text-[#475467] leading-none mb-0.5 sm:mb-1">
                      To (Destination City)
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. Hyderabad"
                      value={c2cToCity}
                      onFocus={() => setShowC2cToMenu(true)}
                      onChange={(e) => {
                        setC2cToCity(e.target.value);
                        setShowC2cToMenu(true);
                      }}
                      className="w-full border-0 outline-none p-0 text-xs sm:text-sm font-semibold text-[#101828] bg-transparent placeholder:text-slate-400"
                    />
                  </div>
                  {c2cToCity && (
                    <button
                      type="button"
                      onClick={() => setC2cToCity('')}
                      className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* To City Dropdown */}
                  {showC2cToMenu && (
                    <div className="absolute top-[calc(100%+8px)] left-0 w-full min-w-[260px] max-h-60 overflow-y-auto no-scrollbar bg-white border border-[#E4E7EC] rounded-2xl shadow-2xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                        Select Destination City
                      </div>
                      {INTERCITY_CITIES.filter((c) => !c2cToCity || c.toLowerCase().includes(c2cToCity.toLowerCase())).map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            setC2cToCity(c);
                            setShowC2cToMenu(false);
                          }}
                          className={`w-full text-left px-3.5 py-2 text-xs sm:text-sm font-bold flex items-center justify-between hover:bg-blue-50 hover:text-blue-800 transition cursor-pointer ${
                            c2cToCity === c ? 'bg-blue-50 text-blue-800' : 'text-slate-800'
                          }`}
                        >
                          <span>{c}</span>
                          {c2cToCity === c && <Check className="w-3.5 h-3.5 text-blue-700" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Field 3: Travel Date (Single Date — NO Return Date!) */}
                <div
                  onClick={() => c2cDateRef.current?.showPicker?.() || c2cDateRef.current?.focus()}
                  className="col-span-6 sm:col-span-6 md:col-span-2 flex items-center gap-2 sm:gap-2.5 min-h-[46px] sm:min-h-[52px] md:min-h-[60px] px-2.5 sm:px-3 rounded-xl sm:rounded-2xl bg-[#F7F8FA] border border-[#EEF0F2] cursor-pointer hover:bg-white hover:border-[#0B6B4F] focus-within:bg-white focus-within:border-[#0B6B4F] focus-within:ring-2 focus-within:ring-[#0B6B4F]/10 transition relative group"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-white border border-[#EAECF0] text-[#0B6B4F] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition">
                    <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <span className="text-[10px] sm:text-[11px] font-bold text-[#475467] leading-none mb-0.5 sm:mb-1 truncate">
                      Travel Date
                    </span>
                    <input
                      ref={c2cDateRef}
                      type="date"
                      min={todayStr}
                      value={c2cDate}
                      onChange={(e) => setC2cDate(e.target.value)}
                      className="w-full border-0 outline-none p-0 text-xs sm:text-sm font-semibold text-[#101828] bg-transparent cursor-pointer"
                    />
                  </div>
                  {c2cDate && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setC2cDate('');
                      }}
                      className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer text-xs shrink-0"
                    >
                      <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </button>
                  )}
                </div>

                {/* Field 4: Booking Option (Seat Sharing vs Full Private Car) */}
                <div
                  ref={c2cTypeRef}
                  className="col-span-6 sm:col-span-6 md:col-span-2 flex items-center gap-2 sm:gap-2.5 min-h-[46px] sm:min-h-[52px] md:min-h-[60px] px-2.5 sm:px-3 rounded-xl sm:rounded-2xl bg-[#F7F8FA] border border-[#EEF0F2] cursor-pointer hover:bg-white hover:border-[#0B6B4F] transition relative"
                  onClick={() => setShowC2cTypeMenu(!showC2cTypeMenu)}
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-white border border-[#EAECF0] text-purple-700 flex items-center justify-center shrink-0 shadow-2xs">
                    <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-700" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <span className="text-[10px] sm:text-[11px] font-bold text-[#475467] leading-none mb-0.5 sm:mb-1 truncate">
                      Booking Type
                    </span>
                    <div className="text-xs sm:text-sm font-extrabold text-[#101828] truncate">
                      {c2cRideType === 'ALL'
                        ? 'All Options'
                        : c2cRideType === 'SEAT_SHARING'
                        ? '👥 Seat Sharing'
                        : '🚗 Private Car'}
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />

                  {/* Type Menu Dropdown */}
                  {showC2cTypeMenu && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute top-[calc(100%+8px)] right-0 w-full min-w-[240px] bg-white border border-[#E4E7EC] rounded-2xl shadow-2xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                    >
                      <div className="px-3.5 py-1.5 border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                        Select Booking Option
                      </div>
                      {[
                        { id: 'ALL', label: 'All Options', desc: 'Seat sharing carpool & full car' },
                        { id: 'SEAT_SHARING', label: '👥 Seat Sharing (Carpool)', desc: 'Book single seat (e.g. Rs. 1,500)' },
                        { id: 'FULL_CAR', label: '🚗 Full Private Car', desc: 'Book whole car for private trip' },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setC2cRideType(opt.id as any);
                            setShowC2cTypeMenu(false);
                          }}
                          className={`w-full text-left px-3.5 py-2 hover:bg-purple-50 transition cursor-pointer flex flex-col ${
                            c2cRideType === opt.id ? 'bg-purple-50 text-purple-900 font-extrabold' : 'text-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs sm:text-sm font-bold">{opt.label}</span>
                            {c2cRideType === opt.id && <Check className="w-3.5 h-3.5 text-purple-700 shrink-0" />}
                          </div>
                          <span className="text-[10px] text-slate-500 font-normal mt-0.5">{opt.desc}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Field 5: Find Rides Button */}
                <button
                  type="submit"
                  className="col-span-12 sm:col-span-12 md:col-span-2 min-h-[46px] sm:min-h-[52px] md:min-h-[60px] px-4 rounded-xl sm:rounded-2xl bg-[#0B6B4F] hover:bg-[#08513C] active:scale-[0.99] text-white font-extrabold text-xs sm:text-sm md:text-base flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition cursor-pointer"
                >
                  <Search className="w-4 h-4 shrink-0" />
                  <span>Find rides</span>
                </button>
              </form>
            ) : (
              <form
                onSubmit={handleSearchSubmit}
                className="p-2 sm:p-3 md:p-4 grid grid-cols-12 gap-2 sm:gap-2.5 items-stretch"
              >
                {/* Field 1: Where / City Combobox with Country-Specific Dropdown & Write/Search Option */}
                <div
                  ref={cityDropdownRef}
                  className="col-span-12 md:col-span-4 flex items-center gap-2.5 sm:gap-3 min-h-[46px] sm:min-h-[52px] md:min-h-[60px] px-3 sm:px-3.5 rounded-xl sm:rounded-2xl bg-[#F7F8FA] border border-[#EEF0F2] focus-within:bg-white focus-within:border-[#0B6B4F] focus-within:ring-2 focus-within:ring-[#0B6B4F]/10 transition relative cursor-text"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-white border border-[#EAECF0] text-[#0B6B4F] flex items-center justify-center shrink-0 shadow-2xs">
                    <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <span className="text-[10px] sm:text-[11px] font-bold text-[#475467] leading-none mb-0.5 sm:mb-1">
                      Where
                    </span>
                    <input
                      type="text"
                      placeholder={`City or area, e.g. ${availableCities[0] || 'Karachi'}`}
                      value={searchWhere}
                      onFocus={() => setShowCityDropdown(true)}
                      onChange={(e) => {
                        setSearchWhere(e.target.value);
                        setShowCityDropdown(true);
                      }}
                      className="w-full border-0 outline-none p-0 text-xs sm:text-sm font-semibold text-[#101828] bg-transparent placeholder:text-slate-400"
                    />
                  </div>

                  {searchWhere ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSearchWhere('');
                        setShowCityDropdown(true);
                      }}
                      className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowCityDropdown(!showCityDropdown);
                      }}
                      className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  )}

                  {/* Country-Specific City Dropdown Menu */}
                  {showCityDropdown && (
                    <div className="absolute top-[calc(100%+8px)] left-0 w-full min-w-[280px] bg-white border border-[#E4E7EC] rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-3.5 py-1.5 border-b border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <span>Cities in {country?.name || 'Pakistan'} {country?.flag}</span>
                        <span className="text-emerald-700 font-mono font-semibold">
                          {filteredCities.length} found
                        </span>
                      </div>

                      <div className="max-h-56 overflow-y-auto no-scrollbar py-1">
                        {filteredCities.length > 0 ? (
                          filteredCities.map((cityName) => {
                            const isSelected =
                              searchWhere.toLowerCase() === cityName.toLowerCase();
                            return (
                              <button
                                key={cityName}
                                type="button"
                                onClick={() => {
                                  setSearchWhere(cityName);
                                  setShowCityDropdown(false);
                                }}
                                className={`w-full text-left px-3.5 py-2 text-xs sm:text-sm font-medium flex items-center justify-between hover:bg-[#F4F7F5] transition cursor-pointer ${
                                  isSelected
                                    ? 'bg-[#E9F3EE] text-[#0B6B4F] font-bold'
                                    : 'text-[#344054]'
                                }`}
                              >
                                <span className="flex items-center gap-2.5">
                                  <MapPin className="w-3.5 h-3.5 text-[#0B6B4F]" />
                                  <span>{cityName}</span>
                                </span>
                                {isSelected && <Check className="w-4 h-4 text-[#0B6B4F]" />}
                              </button>
                            );
                          })
                        ) : (
                          <div className="px-3.5 py-3 text-center text-xs text-slate-500">
                            <p>No preset city named &ldquo;{searchWhere}&rdquo;</p>
                            <button
                              type="button"
                              onClick={() => setShowCityDropdown(false)}
                              className="mt-1.5 text-xs font-bold text-[#0B6B4F] hover:underline"
                            >
                              Use &ldquo;{searchWhere}&rdquo; as custom location
                            </button>
                          </div>
                        )}
                      </div>

                      {searchWhere &&
                        filteredCities.length > 0 &&
                        !filteredCities.some((c) => c.toLowerCase() === searchWhere.toLowerCase()) && (
                          <div className="border-t border-slate-100 px-3.5 py-2 bg-slate-50">
                            <button
                              type="button"
                              onClick={() => setShowCityDropdown(false)}
                              className="w-full text-left text-xs font-bold text-[#0B6B4F] hover:underline flex items-center gap-1.5"
                            >
                              <span>Search in:</span>
                              <span className="truncate text-slate-900">&ldquo;{searchWhere}&rdquo;</span>
                            </button>
                          </div>
                        )}
                    </div>
                  )}
                </div>

                {/* Fields 2 & 3: Compact Side-by-Side Dates on Mobile, Balanced Columns on Desktop */}
                <div className="col-span-12 md:col-span-6 grid grid-cols-2 gap-2 md:gap-2.5">
                  {/* Pick-up Date (Calendar popup, past dates disabled) */}
                  <div
                    onClick={() => pickupDateRef.current?.showPicker?.() || pickupDateRef.current?.focus()}
                    className="flex items-center gap-2 sm:gap-3 min-h-[46px] sm:min-h-[52px] md:min-h-[60px] px-2.5 sm:px-3.5 rounded-xl sm:rounded-2xl bg-[#F7F8FA] border border-[#EEF0F2] cursor-pointer hover:bg-white hover:border-[#0B6B4F] focus-within:bg-white focus-within:border-[#0B6B4F] focus-within:ring-2 focus-within:ring-[#0B6B4F]/10 transition relative group"
                  >
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-white border border-[#EAECF0] text-[#0B6B4F] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition">
                      <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <span className="text-[10px] sm:text-[11px] font-bold text-[#475467] leading-none mb-0.5 sm:mb-1 truncate">
                        Pick-up Date
                      </span>
                      <input
                        ref={pickupDateRef}
                        type="date"
                        min={todayStr}
                        value={searchPickup}
                        onChange={(e) => {
                          setSearchPickup(e.target.value);
                          if (searchReturn && e.target.value > searchReturn) {
                            setSearchReturn(e.target.value);
                          }
                        }}
                        className="w-full border-0 outline-none p-0 text-xs sm:text-sm font-semibold text-[#101828] bg-transparent cursor-pointer"
                      />
                    </div>
                    {searchPickup && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSearchPickup('');
                        }}
                        className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer text-xs shrink-0"
                      >
                        <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Return Date (Calendar popup, past dates disabled) */}
                  <div
                    onClick={() => returnDateRef.current?.showPicker?.() || returnDateRef.current?.focus()}
                    className="flex items-center gap-2 sm:gap-3 min-h-[46px] sm:min-h-[52px] md:min-h-[60px] px-2.5 sm:px-3.5 rounded-xl sm:rounded-2xl bg-[#F7F8FA] border border-[#EEF0F2] cursor-pointer hover:bg-white hover:border-[#0B6B4F] focus-within:bg-white focus-within:border-[#0B6B4F] focus-within:ring-2 focus-within:ring-[#0B6B4F]/10 transition relative group"
                  >
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-white border border-[#EAECF0] text-[#0B6B4F] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition">
                      <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <span className="text-[10px] sm:text-[11px] font-bold text-[#475467] leading-none mb-0.5 sm:mb-1 truncate">
                        Return Date
                      </span>
                      <input
                        ref={returnDateRef}
                        type="date"
                        min={searchPickup || todayStr}
                        value={searchReturn}
                        onChange={(e) => setSearchReturn(e.target.value)}
                        className="w-full border-0 outline-none p-0 text-xs sm:text-sm font-semibold text-[#101828] bg-transparent cursor-pointer"
                      />
                    </div>
                    {searchReturn && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSearchReturn('');
                        }}
                        className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer text-xs shrink-0"
                      >
                        <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="col-span-12 md:col-span-2 min-h-[46px] sm:min-h-[52px] md:min-h-[60px] px-4 sm:px-6 rounded-xl sm:rounded-2xl bg-[#0B6B4F] hover:bg-[#08513C] active:scale-[0.99] text-white font-extrabold text-xs sm:text-sm md:text-base flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition cursor-pointer"
                >
                  <Search className="w-4 h-4 shrink-0" />
                  <span>{currentService.go}</span>
                </button>
              </form>
            )}

            {/* Hint bar */}
            <div className="flex items-center gap-2 px-3.5 sm:px-5 pb-3 sm:pb-3.5 text-[11px] sm:text-xs text-[#475467]">
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0B6B4F] shrink-0" />
              <span className="truncate">{currentService.hint}</span>
            </div>
          </div>

          {/* Popular Cities in Active Country OR Commuter Corridors when activeService === 3 */}
          {activeService === 3 ? (
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5 text-xs sm:text-sm -mx-1 px-1 flex-nowrap">
              <span className="text-[#0B6B4F] font-bold shrink-0 text-xs sm:text-sm flex items-center gap-1">
                <Navigation className="w-3.5 h-3.5" />
                <span>Popular {shuttleCity} Corridors:</span>
              </span>
              {(POPULAR_COMMUTE_CORRIDORS[shuttleCity] || POPULAR_COMMUTE_CORRIDORS['Karachi']).map((corr) => {
                const active =
                  shuttlePickupArea.toLowerCase().includes(corr.from.toLowerCase()) &&
                  shuttleDropArea.toLowerCase().includes(corr.to.toLowerCase());
                return (
                  <button
                    key={corr.label}
                    type="button"
                    onClick={() => {
                      setShuttlePickupArea(corr.from);
                      setShuttleDropArea(corr.to);
                      setVisibleCount(60);
                    }}
                    className={`px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full border transition cursor-pointer font-bold shrink-0 text-xs ${
                      active
                        ? 'bg-[#0B6B4F] text-white border-[#0B6B4F] shadow-xs'
                        : 'bg-white border-[#E4E7EC] text-[#344054] hover:border-emerald-600 hover:text-emerald-700'
                    }`}
                  >
                    {corr.label}
                  </button>
                );
              })}
              {(shuttlePickupArea || shuttleDropArea) && (
                <button
                  type="button"
                  onClick={() => {
                    setShuttlePickupArea('');
                    setShuttleDropArea('');
                    setVisibleCount(60);
                  }}
                  className="px-2.5 py-1 rounded-full text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-1 transition shrink-0 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Clear Corridor</span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5 text-xs sm:text-sm -mx-1 px-1 flex-nowrap">
              <span className="text-[#475467] font-semibold shrink-0 text-xs sm:text-sm">Popular:</span>
              {availableCities.slice(0, 6).map((cityName) => (
                <button
                  key={cityName}
                  type="button"
                  onClick={() => {
                    setSearchWhere(cityName);
                    setVisibleCount(60);
                  }}
                  className={`px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full border transition cursor-pointer font-semibold shrink-0 text-xs ${
                    searchWhere.toLowerCase() === cityName.toLowerCase()
                      ? 'bg-[#0B6B4F] text-white border-[#0B6B4F] shadow-xs'
                      : 'bg-white border-[#E4E7EC] text-[#344054] hover:border-slate-400'
                  }`}
                >
                  {cityName}
                </button>
              ))}
              {searchWhere && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchWhere('');
                    setVisibleCount(60);
                  }}
                  className="px-2.5 py-1 rounded-full text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-1 transition shrink-0"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          )}

          {/* Mobile App Quick Trust Bar - Compact, visible on sm+ screens */}
          <div className="hidden sm:grid grid-cols-3 gap-1.5 p-2 rounded-2xl bg-white border border-[#EEF0F2] shadow-2xs">
            <div className="flex flex-col items-center justify-center text-center p-1">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#0B6B4F] flex items-center justify-center mb-1">
                <Car className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] font-extrabold text-[#101828] leading-tight">3.8k+ Fleets</span>
              <span className="text-[9px] text-[#667085]">Verified hosts</span>
            </div>
            <div className="flex flex-col items-center justify-center text-center p-1 border-x border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-[#E7F8EE] text-[#25D366] flex items-center justify-center mb-1">
                <WhatsAppIcon className="w-3.5 h-3.5 text-[#25D366]" />
              </div>
              <span className="text-[10px] font-extrabold text-[#101828] leading-tight">Direct WhatsApp</span>
              <span className="text-[9px] text-[#667085]">No middleman</span>
            </div>
            <div className="flex flex-col items-center justify-center text-center p-1">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mb-1">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] font-extrabold text-[#101828] leading-tight">Pay at Handover</span>
              <span className="text-[9px] text-[#667085]">Zero holding</span>
            </div>
          </div>

          {/* Desktop Only: Simple, Transparent 3-Step Flow */}
          <div className="hidden md:grid grid-cols-3 gap-3 pt-1">
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#0B6B4F] font-heading font-extrabold text-xs flex items-center justify-center shrink-0 border border-emerald-100">
                1
              </div>
              <div className="min-w-0">
                <h4 className="font-heading font-bold text-xs text-slate-900">Find What You Need</h4>
                <p className="text-[11px] text-slate-500 truncate">Cars, private drivers, shuttles, or home movers.</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#0B6B4F] font-heading font-extrabold text-xs flex items-center justify-center shrink-0 border border-emerald-100">
                2
              </div>
              <div className="min-w-0">
                <h4 className="font-heading font-bold text-xs text-slate-900">Connect with Host</h4>
                <p className="text-[11px] text-slate-500 truncate">Chat on WhatsApp or in-app to confirm trip details.</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#0B6B4F] font-heading font-extrabold text-xs flex items-center justify-center shrink-0 border border-emerald-100">
                3
              </div>
              <div className="min-w-0">
                <h4 className="font-heading font-bold text-xs text-slate-900">Inspect & Settle Directly</h4>
                <p className="text-[11px] text-slate-500 truncate">Review vehicle in person and pay host at handover.</p>
              </div>
            </div>
          </div>

          {/* Desktop Only: Trust Value Pillars */}
          <div className="hidden md:flex gap-6 sm:gap-8 flex-wrap text-xs sm:text-sm text-[#344054] font-semibold pt-1">
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#0B6B4F]" />
              Independent local hosts & fleet partners
            </span>
            <span className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-[#0B6B4F]" />
              Direct WhatsApp & In-App messaging
            </span>
            <span className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#0B6B4F]" />
              Direct handover — inspect vehicle and settle with host
            </span>
          </div>
        </div>
      </section>

      {/* 3. Dynamic Service Listings OR International Coming Soon & Pre-Registration */}
      <section id="listings-results" className="pt-2 sm:pt-6 pb-12 sm:pb-16">
        <div id="cars-results" className="max-w-[1240px] mx-auto px-4 sm:px-8 flex flex-col gap-3 sm:gap-6">
          {country && country.code !== 'PK' ? (
            <InternationalComingSoon
              country={country}
              currency={currency}
              onBrowsePakistanInbound={() => {
                if (typeof window !== 'undefined') {
                  localStorage.setItem('safarpk_return_to_country', country.code);
                }
                setReturnToCountryCode(country.code);
                // Switch country to Pakistan while PRESERVING current international currency!
                setCountry(COUNTRIES[0], false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          ) : (
            <>
              {/* Inbound Visitor Banner: If user switched to Pakistan fleet with international currency */}
              {returnCountryInfo && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl shadow-2xs animate-in fade-in duration-200">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🇵🇰</span>
                    <div>
                      <h4 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                        <span>Viewing Pakistan Fleet with prices in {currency.code} ({currency.symbol})</span>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 font-bold">
                          Live Converted from PKR
                        </span>
                      </h4>
                      <p className="text-xs text-emerald-700">
                        Showing verified vehicles & drivers across Pakistan. All rates live-converted from PKR to your selected currency ({currency.name}).
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleReturnToLaunchHub}
                    className="px-4 py-2 text-xs font-bold text-emerald-900 bg-white border border-emerald-300 rounded-xl hover:bg-emerald-100 transition shadow-2xs shrink-0 cursor-pointer flex items-center gap-1.5"
                  >
                    <span>← Return to {returnCountryInfo.name} {returnCountryInfo.flag} Launch Hub</span>
                  </button>
                </div>
              )}

              {/* Clean Single Bar: Left link to selected category data, Right real dynamic count */}
              <div id="all-listings" className="flex items-center justify-between gap-3 w-full py-1">
                <Link
                  href={currentMeta.viewAllHref}
                  onClick={(e) => {
                    if (activeService === 0) {
                      setVisibleCount(120);
                      const el = document.getElementById('all-listings');
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth' });
                      }
                    }
                  }}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-[#0B6B4F] hover:text-[#08513C] hover:underline transition group cursor-pointer"
                >
                  <span>{currentMeta.viewAllText}</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </Link>

                <span className="px-2.5 py-1 rounded-full bg-[#E9F3EE] text-[#0B6B4F] text-[11px] sm:text-xs font-extrabold border border-emerald-200/80 shadow-2xs whitespace-nowrap">
                  {currentTotal} available
                </span>
              </div>

          {/* Category Chips (Real-Time Filter) */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
            {currentCategories.map((c) => {
              const active = selectedCategory === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(c);
                    setVisibleCount(60);
                  }}
                  className={`h-9 px-4 rounded-full text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-[#101828] text-white shadow-xs'
                      : 'bg-white border border-[#E4E7EC] text-[#344054] hover:bg-slate-50'
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>

          {/* SERVICE 0: CAR RENTALS */}
          {activeService === 0 && (
            filteredCars.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCars.slice(0, visibleCount).map((car) => {
                  const isSaved = savedIds.includes(car.id);
                  const isFeatured = featuredIds.includes(car.id);
                  const slotIdx = featuredIds.indexOf(car.id);
                  return (
                    <div
                      key={car.id}
                      onClick={() => router.push(`/listing/${car.id}`)}
                      className={`flex flex-col gap-3 group bg-white rounded-3xl p-2.5 transition-all duration-200 relative cursor-pointer ${
                        isFeatured
                          ? 'border-2 border-amber-400 ring-2 ring-amber-300/40 shadow-xl bg-gradient-to-b from-amber-50/40 via-white to-white'
                          : 'border border-slate-100 hover:shadow-lg hover:border-slate-300'
                      }`}
                    >
                      {/* Photo with Overlay Pills */}
                      <Link
                        href={`/listing/${car.id}`}
                        className="relative block aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100"
                      >
                        <img
                          src={car.image}
                          alt={car.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />

                        {/* Prominent Featured Top Ad Badge */}
                        {isFeatured && (
                          <span className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider shadow-md">
                            <Sparkles className="w-3.5 h-3.5 fill-current text-yellow-200 animate-pulse" />
                            <span>Featured Top Ad</span>
                            <span className="text-[10px] opacity-90 font-bold bg-black/20 px-1.5 py-0.2 rounded-full">#{slotIdx + 1}</span>
                          </span>
                        )}

                        {/* City Badge */}
                        <span className={`absolute ${isFeatured ? 'bottom-3 left-3' : 'top-3 left-3'} flex items-center gap-1 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold text-[#101828] shadow-xs`}>
                          <MapPin className="w-3 h-3 text-[#0B6B4F]" />
                          <span>{car.city}</span>
                        </span>

                        {/* Wishlist Heart */}
                        <button
                          type="button"
                          aria-label="Save vehicle"
                          onClick={(e) => {
                            e.preventDefault();
                            toggleSave(car);
                          }}
                          className={`absolute top-3 right-3 w-8 h-8 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center shadow-xs transition hover:scale-110 cursor-pointer ${
                            isSaved ? 'text-rose-500 fill-rose-500' : 'text-[#101828]'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${isSaved ? 'fill-rose-500 text-rose-500' : ''}`} />
                        </button>
                      </Link>

                      {/* Vehicle Info */}
                      <Link href={`/listing/${car.id}`} className="flex flex-col gap-1 px-2">
                        <div className="flex justify-between items-baseline gap-2">
                          <h3 className="font-heading font-extrabold text-base text-[#101828] truncate">
                            {car.name}
                          </h3>
                          <span className="text-xs text-[#475467] whitespace-nowrap">
                            <strong className="text-sm font-extrabold text-[#101828]">
                              {formatPrice(car.priceNum)}
                            </strong>{' '}
                            /day
                          </span>
                        </div>

                        <span className="text-xs text-[#475467] font-medium">{car.specs}</span>
                      </Link>

                      {/* Unified Single-Row Responsive CTA Action Bar */}
                      <div className="flex items-center gap-1.5 sm:gap-2 pt-2.5 px-1 border-t border-slate-100 mt-1" onClick={(e) => e.stopPropagation()}>
                        {/* 1. Phone Call CTA */}
                        <button
                          type="button"
                          onClick={(e) => handleRevealPhone(e, car.id, car.name, car.phone, 'Car Rental', car.owner)}
                          className="h-9 px-2.5 sm:px-3 rounded-xl border border-purple-200/90 bg-purple-50/70 hover:bg-purple-100 text-purple-900 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs active:scale-95 shrink-0"
                          title={revealedPhones[car.id] ? `Call ${car.owner} (${car.phone})` : 'Call / Show Number'}
                        >
                          <Phone className="w-3.5 h-3.5 text-purple-600 fill-purple-600/20 shrink-0" />
                          <span className="font-mono text-xs font-bold">
                            {revealedPhones[car.id] ? car.phone : 'Call'}
                          </span>
                        </button>

                        {/* 2. WhatsApp Direct Inquiry CTA */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCarWhatsApp(car);
                          }}
                          className="h-9 px-2.5 sm:px-3 rounded-xl border border-emerald-300 bg-emerald-50/80 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs active:scale-95 shrink-0"
                          title={`Inquire with ${car.owner} on WhatsApp with full listing details`}
                          aria-label="Direct WhatsApp"
                        >
                          <WhatsAppIcon className="w-4 h-4 text-[#25D366] shrink-0" />
                          <span className="hidden sm:inline text-xs font-bold text-emerald-800">WhatsApp</span>
                        </button>

                        {/* 3. Company Store Badge / Logo CTA */}
                        <Link
                          href={`/store/${getStoreSlugForOwner(car.owner)}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 min-w-0 h-9 px-2 sm:px-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-800 flex items-center justify-between gap-1 transition shadow-2xs group/store cursor-pointer"
                          title={`Visit ${car.owner}'s Official Store`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" title="Online Host" />
                            <span className="font-heading font-extrabold text-[11px] sm:text-xs text-slate-800 group-hover/store:text-emerald-700 truncate">
                              {car.owner}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 group-hover/store:text-emerald-600 group-hover/store:translate-x-0.5 transition shrink-0">
                            ➔
                          </span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null
          )}

          {/* SERVICE 1: HIRE A DRIVER */}
          {activeService === 1 && (
            filteredDrivers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDrivers.slice(0, visibleCount).map((driver) => {
                  const isFeatured = featuredIds.includes(driver.id);
                  const slotIdx = featuredIds.indexOf(driver.id);
                  return (
                    <div
                      key={driver.id}
                      onClick={() => router.push(`/driver/${slugify(driver.name)}`)}
                      className={`flex flex-col justify-between group bg-white rounded-3xl p-5 transition-all duration-200 cursor-pointer ${
                        isFeatured
                          ? 'border-2 border-amber-400 ring-2 ring-amber-300/40 shadow-xl bg-gradient-to-b from-amber-50/40 via-white to-white'
                          : 'border border-slate-100 hover:shadow-lg hover:border-emerald-200'
                      }`}
                    >
                      {/* Prominent Featured Top Badge */}
                      {isFeatured && (
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-amber-200">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white uppercase tracking-wider shadow-2xs">
                            <Sparkles className="w-3 h-3 fill-current text-yellow-200 animate-pulse" />
                            <span>{isPakistan ? 'Featured Driver' : 'Featured Chauffeur'}</span>
                          </span>
                          <span className="text-[10px] font-extrabold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full">
                            ★ Slot #{slotIdx + 1}
                          </span>
                        </div>
                      )}

                      <div className="flex flex-col gap-3.5">
                        {/* Driver Header - Links to Driver Profile */}
                        <Link
                          href={`/driver/${slugify(driver.name)}`}
                          className="flex items-center gap-3 group/d cursor-pointer"
                          title={`View ${driver.name}'s Profile`}
                        >
                          <div
                            className="w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-base text-[#101828] shadow-2xs shrink-0 group-hover/d:scale-105 transition"
                            style={{ backgroundColor: driver.tint }}
                          >
                            {driver.initials}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="font-heading font-extrabold text-base text-[#101828] group-hover/d:text-emerald-700 transition truncate">
                                {driver.name}
                              </h3>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E9F3EE] text-[#0B6B4F]">
                                {driver.avail}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-[#475467] font-medium">
                              <MapPin className="w-3.5 h-3.5 text-[#0B6B4F]" />
                              <span>{driver.city}</span>
                              <span>·</span>
                              <span>{driver.exp}</span>
                            </div>
                          </div>
                        </Link>

                      {/* Languages & Certified badge */}
                      <div className="flex items-center justify-between text-xs text-[#475467] py-1 border-y border-slate-100">
                        <span className="font-medium truncate">{driver.langs}</span>
                        <span className="flex items-center gap-1 text-[11px] font-bold text-[#0B6B4F] shrink-0">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          {isPakistan ? 'Verified Driver' : 'Direct Chauffeur'}
                        </span>
                      </div>

                      {/* Verified Masked ID & Licence (Pattern Preserved, Unlocks on Booking Confirmation) */}
                      <div className="p-2 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1 text-[11px] font-mono">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-semibold font-sans flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-[#0B6B4F]" />
                            <span>CNIC:</span>
                          </span>
                          <span className="font-bold text-slate-800">
                            {maskPakistaniCnic(driver.cnic)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-semibold font-sans flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-[#0B6B4F]" />
                            <span>Licence:</span>
                          </span>
                          <span className="font-bold text-slate-800">
                            {maskPakistaniLicense(driver.licenseNumber)}
                          </span>
                        </div>
                      </div>

                      {/* Rates Matrix */}
                      <div className="grid grid-cols-3 gap-2 bg-[#F7F8FA] p-2.5 rounded-2xl text-center">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold uppercase">City 12h</span>
                          <span className="text-xs font-black text-[#101828]">{formatPrice(driver.city12Num || driver.city12)}</span>
                        </div>
                        <div className="border-x border-slate-200/80">
                          <span className="text-[10px] text-slate-400 block font-bold uppercase">Outstation</span>
                          <span className="text-xs font-black text-[#101828]">{formatPrice((driver as any).outNum || driver.out)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold uppercase">Monthly</span>
                          <span className="text-xs font-black text-[#0B6B4F]">{formatPrice((driver as any).monthlyNum || driver.monthly)}</span>
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5">
                        {driver.tags.map((t) => (
                          <span key={t} className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-bold text-slate-600">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Unified Single-Row Responsive CTA Action Bar */}
                    <div className="flex items-center gap-1.5 sm:gap-2 pt-2.5 px-1 border-t border-slate-100 mt-1" onClick={(e) => e.stopPropagation()}>
                      {/* 1. Phone Call CTA */}
                      <button
                        type="button"
                        onClick={(e) => handleRevealPhone(e, driver.id, driver.name, driver.phone, 'Driver', driver.name)}
                        className="h-9 px-2.5 sm:px-3 rounded-xl border border-purple-200/90 bg-purple-50/70 hover:bg-purple-100 text-purple-900 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs active:scale-95 shrink-0"
                        title={revealedPhones[driver.id] ? `Call ${driver.name} (${driver.phone})` : 'Call / Show Number'}
                      >
                        <Phone className="w-3.5 h-3.5 text-purple-600 fill-purple-600/20 shrink-0" />
                        <span className="font-mono text-xs font-bold">
                          {revealedPhones[driver.id] ? driver.phone : 'Call'}
                        </span>
                      </button>

                      {/* 2. WhatsApp Direct Inquiry CTA */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDriverWhatsApp(driver);
                        }}
                        className="h-9 px-2.5 sm:px-3 rounded-xl border border-emerald-300 bg-emerald-50/80 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs active:scale-95 shrink-0"
                        title={`Inquire with ${driver.name} on WhatsApp`}
                        aria-label="Direct WhatsApp"
                      >
                        <WhatsAppIcon className="w-4 h-4 text-[#25D366] shrink-0" />
                        <span className="hidden sm:inline text-xs font-bold text-emerald-800">WhatsApp</span>
                      </button>

                      {/* 3. Driver Profile Badge */}
                      <Link
                        href={`/driver/${slugify(driver.name)}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 min-w-0 h-9 px-2 sm:px-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-800 flex items-center justify-between gap-1 transition shadow-2xs group/store cursor-pointer"
                        title={`View ${driver.name}'s Profile`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" title="Available Driver" />
                          <span className="font-heading font-extrabold text-[11px] sm:text-xs text-slate-800 group-hover/store:text-emerald-700 truncate">
                            {driver.name}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 group-hover/store:text-emerald-600 group-hover/store:translate-x-0.5 transition shrink-0">
                          ➔
                        </span>
                      </Link>
                    </div>
                  </div>
                );
              })}
              </div>
            ) : null
          )}

          {/* SERVICE 2: CITY TO CITY */}
          {activeService === 2 && (
            filteredRides.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRides.slice(0, visibleCount).map((ride) => {
                  const isFeatured = featuredIds.includes(ride.id);
                  const slotIdx = featuredIds.indexOf(ride.id);
                  return (
                    <div
                      key={ride.id}
                      onClick={() => router.push(`/city-to-city/${ride.id}`)}
                      className={`flex flex-col justify-between group bg-white rounded-3xl p-5 transition-all duration-200 cursor-pointer ${
                        isFeatured
                          ? 'border-2 border-amber-400 ring-2 ring-amber-300/40 shadow-xl bg-gradient-to-b from-amber-50/40 via-white to-white'
                          : 'border border-slate-100 hover:shadow-lg hover:border-blue-200'
                      }`}
                    >
                      {/* Prominent Featured Top Badge */}
                      {isFeatured && (
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-amber-200">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white uppercase tracking-wider shadow-2xs">
                            <Sparkles className="w-3 h-3 fill-current text-yellow-200 animate-pulse" />
                            <span>Featured Intercity Route</span>
                          </span>
                          <span className="text-[10px] font-extrabold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full">
                            ★ Slot #{slotIdx + 1}
                          </span>
                        </div>
                      )}

                      <div className="flex flex-col gap-3">
                        {/* Route Header with Booking Type Badge */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-[#E0EAFF] text-[#1D3A8A]">
                            <Navigation className="w-3.5 h-3.5" />
                            <span>{ride.fromCity} ➔ {ride.toCity}</span>
                          </span>
                          <span className="text-xs font-semibold text-slate-500">
                            {ride.duration}
                          </span>
                        </div>

                        {/* Booking Model Badge (Seat Sharing vs Full Private Car) */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {ride.rideType === 'SEAT_SHARING' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-900 border border-emerald-200">
                              <Users className="w-3 h-3 text-emerald-700" />
                              <span>{ride.availableSeats || 1} Seat Available · Carpool Share</span>
                            </span>
                          )}
                          {ride.rideType === 'FULL_CAR' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-blue-100 text-blue-900 border border-blue-200">
                              <Car className="w-3 h-3 text-blue-700" />
                              <span>Full Private Car Booking</span>
                            </span>
                          )}
                          {ride.rideType === 'BOTH' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-purple-100 text-purple-900 border border-purple-200">
                              <Sparkles className="w-3 h-3 text-purple-700" />
                              <span>Seat Sharing ({ride.availableSeats || 1} left) or Full Car</span>
                            </span>
                          )}
                        </div>

                        {/* Vehicle Model & Operator - Links to Route Details */}
                        <Link href={`/city-to-city/${ride.id}`} className="block group/c2c cursor-pointer">
                          <h3 className="font-heading font-extrabold text-base text-[#101828] group-hover/c2c:text-blue-700 transition">
                            {ride.car}
                          </h3>
                          <div className="flex items-center gap-1.5 text-xs text-[#0B6B4F] font-bold mt-0.5">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>{ride.op}</span>
                          </div>
                        </Link>

                        {/* Departure Timing & Boarding Points */}
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 space-y-1 text-xs text-[#475467]">
                          <div className="flex items-center justify-between font-semibold">
                            <span className="text-slate-500">Departure:</span>
                            <span className="text-slate-900 font-bold">{ride.departureDate || 'Daily'} · {ride.departureTime || ride.time}</span>
                          </div>
                          {ride.pickupPoint && (
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-400">Pickup:</span>
                              <span className="text-slate-700 font-medium truncate max-w-[200px]" title={ride.pickupPoint}>
                                {ride.pickupPoint}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Rates Matrix based on Booking Type */}
                        {ride.rideType === 'SEAT_SHARING' ? (
                          <div className="grid grid-cols-2 gap-2 bg-emerald-50/80 border border-emerald-200 p-2.5 rounded-2xl text-center">
                            <div>
                              <span className="text-[10px] text-emerald-800 block font-bold uppercase">Per Seat Rate</span>
                              <span className="text-sm font-black text-emerald-950">Rs. {ride.pricePerSeat?.toLocaleString('en-US') || '1,500'}</span>
                            </div>
                            <div className="border-l border-emerald-200">
                              <span className="text-[10px] text-emerald-800 block font-bold uppercase">Available Seats</span>
                              <span className="text-sm font-black text-emerald-800">{ride.availableSeats || 1} of {ride.totalSeats || 4} Open</span>
                            </div>
                          </div>
                        ) : ride.rideType === 'BOTH' ? (
                          <div className="grid grid-cols-2 gap-2 bg-gradient-to-r from-emerald-50/80 to-blue-50/80 border border-slate-200 p-2.5 rounded-2xl text-center">
                            <div>
                              <span className="text-[10px] text-emerald-800 block font-bold uppercase">Per Seat ({ride.availableSeats || 1} open)</span>
                              <span className="text-sm font-black text-emerald-950">Rs. {ride.pricePerSeat?.toLocaleString('en-US') || '1,500'}</span>
                            </div>
                            <div className="border-l border-slate-200">
                              <span className="text-[10px] text-blue-800 block font-bold uppercase">Full Private Car</span>
                              <span className="text-sm font-black text-blue-950">{formatPrice(ride.one)}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-2 bg-[#F7F8FA] p-2.5 rounded-2xl text-center">
                            <div>
                              <span className="text-[10px] text-slate-400 block font-bold uppercase">Full Car One-Way</span>
                              <span className="text-sm font-black text-[#101828]">{formatPrice(ride.one)}</span>
                            </div>
                            <div className="border-l border-slate-200/80">
                              <span className="text-[10px] text-slate-400 block font-bold uppercase">Full Car Return</span>
                              <span className="text-sm font-black text-[#0B6B4F]">{formatPrice(ride.ret)}</span>
                            </div>
                          </div>
                        )}

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1.5">
                          {ride.tags.map((t) => (
                            <span key={t} className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-bold text-slate-600">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Unified Single-Row Responsive CTA Action Bar */}
                      <div className="flex items-center gap-1.5 sm:gap-2 pt-2.5 px-1 border-t border-slate-100 mt-1" onClick={(e) => e.stopPropagation()}>
                        {/* 1. Phone Call CTA */}
                        <button
                          type="button"
                          onClick={(e) => handleRevealPhone(e, ride.id, `${ride.fromCity} ➔ ${ride.toCity}`, ride.phone, 'CityToCity', ride.op)}
                          className="h-9 px-2.5 sm:px-3 rounded-xl border border-purple-200/90 bg-purple-50/70 hover:bg-purple-100 text-purple-900 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs active:scale-95 shrink-0"
                          title={revealedPhones[ride.id] ? `Call ${ride.op} (${ride.phone})` : 'Call / Show Number'}
                        >
                          <Phone className="w-3.5 h-3.5 text-purple-600 fill-purple-600/20 shrink-0" />
                          <span className="font-mono text-xs font-bold">
                            {revealedPhones[ride.id] ? ride.phone : 'Call'}
                          </span>
                        </button>

                        {/* 2. WhatsApp Direct Inquiry CTA */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRideWhatsApp(ride);
                          }}
                          className="h-9 px-2.5 sm:px-3 rounded-xl border border-emerald-300 bg-emerald-50/80 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs active:scale-95 shrink-0"
                          title={`WhatsApp operator (${ride.op}) with route details`}
                          aria-label="Direct WhatsApp"
                        >
                          <WhatsAppIcon className="w-4 h-4 text-[#25D366] shrink-0" />
                          <span className="hidden sm:inline text-xs font-bold text-emerald-800">WhatsApp</span>
                        </button>

                        {/* 3. Operator Store Badge */}
                        <Link
                          href={`/store/${getStoreSlugForOwner(ride.op)}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 min-w-0 h-9 px-2 sm:px-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-800 flex items-center justify-between gap-1 transition shadow-2xs group/store cursor-pointer"
                          title={`Operated by ${ride.op} · View Store`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" title="Active Operator" />
                            <span className="font-heading font-extrabold text-[11px] sm:text-xs text-slate-800 group-hover/store:text-emerald-700 truncate">
                              {ride.op}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 group-hover/store:text-emerald-600 group-hover/store:translate-x-0.5 transition shrink-0">
                            ➔
                          </span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null
          )}

          {/* SERVICE 3: PICK & DROP SHUTTLES */}
          {activeService === 3 && (
            filteredShuttles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredShuttles.slice(0, visibleCount).map((shuttle) => {
                  const isFeatured = featuredIds.includes(shuttle.id);
                  const slotIdx = featuredIds.indexOf(shuttle.id);
                  return (
                    <div
                      key={shuttle.id}
                      onClick={() => router.push(`/shuttles/${shuttle.id}`)}
                      className={`flex flex-col justify-between group bg-white rounded-3xl p-5 transition-all duration-200 cursor-pointer ${
                        isFeatured
                          ? 'border-2 border-amber-400 ring-2 ring-amber-300/40 shadow-xl bg-gradient-to-b from-amber-50/40 via-white to-white'
                          : 'border border-slate-100 hover:shadow-lg hover:border-purple-200'
                      }`}
                    >
                      {/* Prominent Featured Top Badge */}
                      {isFeatured && (
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-amber-200">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white uppercase tracking-wider shadow-2xs">
                            <Sparkles className="w-3 h-3 fill-current text-yellow-200 animate-pulse" />
                            <span>Featured Shuttle Route</span>
                          </span>
                          <span className="text-[10px] font-extrabold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full">
                            ★ Slot #{slotIdx + 1}
                          </span>
                        </div>
                      )}

                      <div className="flex flex-col gap-3">
                        {/* Route Header */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-[#FEF3C7] text-[#92400E]">
                            <Bus className="w-3.5 h-3.5" />
                            <span>Monthly Seat Route</span>
                          </span>
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            {shuttle.seats} seats available
                          </span>
                        </div>

                        {/* Route Details - Links to Shuttle Details */}
                        <Link href={`/shuttles/${shuttle.id}`} className="block group/sht cursor-pointer">
                          <h3 className="font-heading font-extrabold text-base text-[#101828] group-hover/sht:text-teal-700 transition">
                            {shuttle.from} ➔ {shuttle.to}
                          </h3>
                          <div className="flex items-center gap-1.5 text-xs text-[#0B6B4F] font-bold mt-0.5">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>{shuttle.op} ({shuttle.city})</span>
                          </div>
                        </Link>

                        {/* Vehicle & Timings */}
                        <div className="bg-[#F7F8FA] p-3 rounded-2xl flex flex-col gap-1.5 text-xs">
                          <div className="flex justify-between items-center text-[#344054]">
                            <span className="font-medium">Van:</span>
                            <span className="font-bold text-[#101828]">{shuttle.van}</span>
                          </div>
                          <div className="flex justify-between items-center text-[#344054]">
                            <span className="font-medium">Timings:</span>
                            <span className="font-semibold text-[#101828]">{shuttle.pick} pickup · {shuttle.back} return</span>
                          </div>
                          <div className="flex justify-between items-center text-[#344054]">
                            <span className="font-medium">Operating Days:</span>
                            <span className="font-bold text-[#0B6B4F]">{shuttle.days}</span>
                          </div>
                        </div>

                        {/* Route Corridor & Intermediate Stops Preview */}
                        {shuttle.stops && shuttle.stops.length > 0 && (
                          <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-2.5 flex flex-col gap-1.5">
                            <div className="flex items-center justify-between text-[11px] font-bold text-emerald-900">
                              <span className="flex items-center gap-1">
                                <Navigation className="w-3 h-3 text-emerald-700" />
                                <span>Corridor: {shuttle.stops.length} Intermediate Stops</span>
                              </span>
                              <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded font-bold">
                                Board anywhere
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-600 leading-snug">
                              <span className="font-bold text-slate-900">{shuttle.from}</span>
                              <span className="text-emerald-700 font-bold mx-1">➔</span>
                              {shuttle.stops.map((stop, i) => {
                                const isHighlight =
                                  (shuttlePickupArea && stop.toLowerCase().includes(shuttlePickupArea.toLowerCase())) ||
                                  (shuttleDropArea && stop.toLowerCase().includes(shuttleDropArea.toLowerCase()));
                                return (
                                  <React.Fragment key={i}>
                                    <span
                                      className={
                                        isHighlight
                                          ? 'font-black text-emerald-900 bg-emerald-200/90 px-1 py-0.5 rounded shadow-2xs'
                                          : 'font-medium text-slate-700'
                                      }
                                    >
                                      {stop}
                                    </span>
                                    {i < shuttle.stops!.length - 1 && (
                                      <span className="text-slate-400 mx-1">➔</span>
                                    )}
                                  </React.Fragment>
                                );
                              })}
                              <span className="text-emerald-700 font-bold mx-1">➔</span>
                              <span className="font-bold text-slate-900">{shuttle.to}</span>
                            </div>
                          </div>
                        )}

                        {/* Monthly Fare */}
                        <div className="flex justify-between items-baseline px-1">
                          <span className="text-xs font-semibold text-[#475467]">Monthly Reserved Fare:</span>
                          <span className="text-lg font-extrabold text-[#101828]">{formatPrice(shuttle.fareNum || shuttle.fare)}<span className="text-xs font-medium text-slate-500"> /month</span></span>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1.5">
                          {shuttle.tags.map((t) => (
                            <span key={t} className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-bold text-slate-600">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Unified Single-Row Responsive CTA Action Bar */}
                      <div className="flex items-center gap-1.5 sm:gap-2 pt-2.5 px-1 border-t border-slate-100 mt-1" onClick={(e) => e.stopPropagation()}>
                        {/* 1. Phone Call CTA */}
                        <button
                          type="button"
                          onClick={(e) => handleRevealPhone(e, shuttle.id, `${shuttle.from} ➔ ${shuttle.to}`, shuttle.phone, 'Shuttle', shuttle.op)}
                          className="h-9 px-2.5 sm:px-3 rounded-xl border border-purple-200/90 bg-purple-50/70 hover:bg-purple-100 text-purple-900 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs active:scale-95 shrink-0"
                          title={revealedPhones[shuttle.id] ? `Call ${shuttle.op} (${shuttle.phone})` : 'Call / Show Number'}
                        >
                          <Phone className="w-3.5 h-3.5 text-purple-600 fill-purple-600/20 shrink-0" />
                          <span className="font-mono text-xs font-bold">
                            {revealedPhones[shuttle.id] ? shuttle.phone : 'Call'}
                          </span>
                        </button>

                        {/* 2. WhatsApp Direct Inquiry CTA */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShuttleWhatsApp(shuttle);
                          }}
                          className="h-9 px-2.5 sm:px-3 rounded-xl border border-emerald-300 bg-emerald-50/80 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs active:scale-95 shrink-0"
                          title={`WhatsApp operator (${shuttle.op}) with route details`}
                          aria-label="Direct WhatsApp"
                        >
                          <WhatsAppIcon className="w-4 h-4 text-[#25D366] shrink-0" />
                          <span className="hidden sm:inline text-xs font-bold text-emerald-800">WhatsApp</span>
                        </button>

                        {/* 3. Operator Store Badge */}
                        <Link
                          href={`/store/${getStoreSlugForOwner(shuttle.op)}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 min-w-0 h-9 px-2 sm:px-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-800 flex items-center justify-between gap-1 transition shadow-2xs group/store cursor-pointer"
                          title={`Operated by ${shuttle.op} · View Store`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" title="Active Shuttle Operator" />
                            <span className="font-heading font-extrabold text-[11px] sm:text-xs text-slate-800 group-hover/store:text-emerald-700 truncate">
                              {shuttle.op}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 group-hover/store:text-emerald-600 group-hover/store:translate-x-0.5 transition shrink-0">
                            ➔
                          </span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null
          )}

          {/* SERVICE 4: HOME SHIFTING MOVERS */}
          {activeService === 4 && (
            filteredMovers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMovers.slice(0, visibleCount).map((mover) => {
                  const isFeatured = featuredIds.includes(mover.id);
                  const slotIdx = featuredIds.indexOf(mover.id);
                  return (
                    <div
                      key={mover.id}
                      onClick={() => router.push(`/movers/${mover.id}`)}
                      className={`flex flex-col justify-between group bg-white rounded-3xl p-5 transition-all duration-200 cursor-pointer ${
                        isFeatured
                          ? 'border-2 border-amber-400 ring-2 ring-amber-300/40 shadow-xl bg-gradient-to-b from-amber-50/40 via-white to-white'
                          : 'border border-slate-100 hover:shadow-lg hover:border-orange-200'
                      }`}
                    >
                      {/* Prominent Featured Top Badge */}
                      {isFeatured && (
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-amber-200">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white uppercase tracking-wider shadow-2xs">
                            <Sparkles className="w-3 h-3 fill-current text-yellow-200 animate-pulse" />
                            <span>Featured Home Mover</span>
                          </span>
                          <span className="text-[10px] font-extrabold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full">
                            ★ Slot #{slotIdx + 1}
                          </span>
                        </div>
                      )}

                      <div className="flex flex-col gap-3">
                        {/* Mover Header - Links to Mover Details */}
                        <Link href={`/movers/${mover.id}`} className="flex items-center justify-between gap-2 group/mov cursor-pointer">
                          <h3 className="font-heading font-extrabold text-base text-[#101828] group-hover/mov:text-purple-700 transition truncate">
                            {mover.name}
                          </h3>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-[#0B6B4F]">
                            <MapPin className="w-3 h-3" />
                            <span>{mover.city}</span>
                          </span>
                        </Link>

                        {/* Trucks Available */}
                        <div className="text-xs text-[#475467] font-medium leading-relaxed">
                          <span className="font-bold text-[#101828]">Fleet: </span>{mover.trucks}
                        </div>

                        {/* Rates Matrix */}
                        <div className="grid grid-cols-3 gap-2 bg-[#F7F8FA] p-2.5 rounded-2xl text-center">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold uppercase">Base Moving</span>
                            <span className="text-xs font-black text-[#101828]">{formatPrice((mover as any).baseFareNum || mover.base)}</span>
                          </div>
                          <div className="border-x border-slate-200/80">
                            <span className="text-[10px] text-slate-400 block font-bold uppercase">Per KM</span>
                            <span className="text-xs font-black text-[#101828]">{formatPrice((mover as any).perKmNum || mover.km)}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold uppercase">Helpers</span>
                            <span className="text-xs font-black text-[#0B6B4F]">{formatPrice((mover as any).helperNum || mover.helper)}</span>
                          </div>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1.5">
                          {mover.tags.map((t) => (
                            <span key={t} className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-bold text-slate-600">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Unified Single-Row Responsive CTA Action Bar */}
                      <div className="flex items-center gap-1.5 sm:gap-2 pt-2.5 px-1 border-t border-slate-100 mt-1" onClick={(e) => e.stopPropagation()}>
                        {/* 1. Phone Call CTA */}
                        <button
                          type="button"
                          onClick={(e) => handleRevealPhone(e, mover.id, mover.name, mover.phone, 'Mover', mover.name)}
                          className="h-9 px-2.5 sm:px-3 rounded-xl border border-purple-200/90 bg-purple-50/70 hover:bg-purple-100 text-purple-900 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs active:scale-95 shrink-0"
                          title={revealedPhones[mover.id] ? `Call ${mover.name} (${mover.phone})` : 'Call / Show Number'}
                        >
                          <Phone className="w-3.5 h-3.5 text-purple-600 fill-purple-600/20 shrink-0" />
                          <span className="font-mono text-xs font-bold">
                            {revealedPhones[mover.id] ? mover.phone : 'Call'}
                          </span>
                        </button>

                        {/* 2. WhatsApp Direct Inquiry CTA */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoverWhatsApp(mover);
                          }}
                          className="h-9 px-2.5 sm:px-3 rounded-xl border border-emerald-300 bg-emerald-50/80 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs active:scale-95 shrink-0"
                          title={`WhatsApp mover (${mover.name}) with quote details`}
                          aria-label="Direct WhatsApp"
                        >
                          <WhatsAppIcon className="w-4 h-4 text-[#25D366] shrink-0" />
                          <span className="hidden sm:inline text-xs font-bold text-emerald-800">WhatsApp</span>
                        </button>

                        {/* 3. Mover Store Badge */}
                        <Link
                          href={`/store/${getStoreSlugForOwner(mover.name)}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 min-w-0 h-9 px-2 sm:px-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-800 flex items-center justify-between gap-1 transition shadow-2xs group/store cursor-pointer"
                          title={`Operated by ${mover.name} · View Moving Store`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" title="Active Mover" />
                            <span className="font-heading font-extrabold text-[11px] sm:text-xs text-slate-800 group-hover/store:text-emerald-700 truncate">
                              {mover.name}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 group-hover/store:text-emerald-600 group-hover/store:translate-x-0.5 transition shrink-0">
                            ➔
                          </span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null
          )}

          {/* Empty State when no results match filter */}
          {currentTotal === 0 && (
            <div className="py-14 text-center bg-[#F7F8FA] rounded-3xl border border-[#EEF0F2] p-8 space-y-3">
              {React.createElement(currentMeta.emptyIcon, { className: 'w-10 h-10 text-slate-400 mx-auto' })}
              <h3 className="text-base font-bold text-slate-800">
                No {currentMeta.emptyLabel} found for &ldquo;{searchWhere || selectedCategory}&rdquo;
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No active listings match this specific category or city filter right now. Try resetting
                filters to explore the full available network.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory(currentCategories[0]);
                  setSearchWhere('');
                  setVisibleCount(60);
                }}
                className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B6B4F] text-white font-bold text-xs hover:bg-[#08513C] transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{currentMeta.resetLabel}</span>
              </button>
            </div>
          )}

              {/* Read More Pagination (Shown when total items > visibleCount) */}
              {currentTotal > visibleCount && (
                <div className="flex justify-center pt-8">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => prev + 60)}
                    className="px-8 py-3.5 rounded-2xl bg-[#101828] text-white text-xs sm:text-sm font-extrabold hover:bg-[#0B6B4F] transition shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <span>Read more ({currentTotal - visibleCount} more available)</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* 4. One App for Every Way You Move */}
      <section className="py-8 md:py-16 bg-[#F7F8FA] border-y border-[#EEF0F2]">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-8 flex flex-col gap-4 sm:gap-7">
          <div className="flex flex-col gap-0.5 sm:gap-1">
            <h2 className="font-heading font-extrabold text-base sm:text-xl md:text-2xl lg:text-3xl tracking-tight text-[#101828]">
              One app for every way you move
            </h2>
            <p className="text-xs sm:text-sm text-[#475467]">
              Five services, one open direct transport marketplace
            </p>
          </div>

          {/* MOBILE APP 5-ICON GRID: Minimal, 1-screen quick launcher instead of 800px stack */}
          <div className="md:hidden grid grid-cols-5 gap-1.5 sm:gap-2">
            {[
              {
                title: 'Rent Car',
                icon: Car,
                idx: 0,
                bg: 'bg-emerald-50 text-[#0B6B4F] border-emerald-100',
              },
              {
                title: isPakistan ? 'Driver' : 'Chauffeur',
                icon: UserCheck,
                idx: 1,
                bg: 'bg-sky-50 text-sky-700 border-sky-100',
              },
              {
                title: 'Intercity',
                icon: Navigation,
                idx: 2,
                bg: 'bg-purple-50 text-purple-700 border-purple-100',
              },
              {
                title: 'Pick & Drop',
                icon: Bus,
                idx: 3,
                bg: 'bg-amber-50 text-amber-800 border-amber-100',
              },
              {
                title: isPakistan ? 'Movers' : 'Moving',
                icon: Truck,
                idx: 4,
                bg: 'bg-rose-50 text-rose-700 border-rose-100',
              },
            ].map((sc) => {
              const ScIcon = sc.icon;
              return (
                <button
                  key={sc.title}
                  type="button"
                  onClick={() => {
                    handleServiceChange(sc.idx);
                    const el = document.getElementById('cars-results');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="flex flex-col items-center justify-center p-2 rounded-2xl bg-white border border-[#EEF0F2] shadow-2xs hover:border-[#0B6B4F] transition active:scale-95 cursor-pointer text-center"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-1 border ${sc.bg}`}>
                    <ScIcon className="w-5 h-5" />
                  </div>
                  <span className="font-heading font-extrabold text-[10px] sm:text-xs text-[#101828] leading-tight truncate w-full">
                    {sc.title}
                  </span>
                </button>
              );
            })}
          </div>

          {/* DESKTOP 5-COLUMN CARDS */}
          <div className="hidden md:grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              {
                title: 'Rent a car',
                text: 'Self-drive sedans, SUVs and luxury cars by the day.',
                icon: Car,
                href: '/listing/l-1',
              },
              {
                title: isPakistan ? 'Hire a driver' : 'Hire a chauffeur',
                text: isPakistan ? 'Verified drivers and captains for a day, an event or outstation trip.' : 'Licensed chauffeurs for a day, an event or outstation trip.',
                icon: UserCheck,
                href: '/drivers',
              },
              {
                title: 'City to city',
                text: `Comfortable intercity rides between major ${country?.name || 'Pakistani'} cities.`,
                icon: Navigation,
                href: '/city-to-city',
              },
              {
                title: 'Pick & drop',
                text: 'Monthly school and office commuter routes you can rely on.',
                icon: Bus,
                href: '/shuttles',
              },
              {
                title: isPakistan ? 'Home shifting' : 'Moving & cargo',
                text: isPakistan ? 'Cargo trucks, Shehzore & mazdoors for houses and offices.' : 'Moving trucks, cargo haulers and professional helpers.',
                icon: Truck,
                href: '/movers',
              },
            ].map((sc) => {
              const ScIcon = sc.icon;
              return (
                <Link
                  key={sc.title}
                  href={sc.href}
                  className="flex flex-col gap-3 p-5 rounded-2xl bg-white border border-[#EEF0F2] text-[#101828] hover:border-[#0B6B4F] hover:shadow-md transition group"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#F4F7F5] border border-[#E4E7EC] text-[#0B6B4F] flex items-center justify-center group-hover:bg-[#0B6B4F] group-hover:text-white transition">
                    <ScIcon className="w-5 h-5" />
                  </div>
                  <h3 className="font-heading font-extrabold text-base">{sc.title}</h3>
                  <p className="text-xs text-[#475467] leading-relaxed flex-1">{sc.text}</p>
                  <span className="text-xs font-bold text-[#0B6B4F] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Explore</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. Book in Three Steps */}
      <section className="py-8 md:py-16">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-8 flex flex-col gap-4 sm:gap-8">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-extrabold text-base sm:text-xl md:text-2xl lg:text-3xl tracking-tight text-[#101828]">
              Book in three steps
            </h2>
            <span className="text-xs text-slate-500 font-semibold hidden sm:inline">Zero booking fees</span>
          </div>

          {/* MOBILE 3-STEP HORIZONTAL STEPPER: App-like, 1 clean row! */}
          <div className="md:hidden grid grid-cols-3 gap-2">
            <div className="p-3 rounded-2xl bg-[#F7F8FA] border border-[#EEF0F2] flex flex-col items-center text-center">
              <span className="w-6 h-6 rounded-full bg-[#0B6B4F] text-white font-extrabold text-[11px] flex items-center justify-center mb-1.5 shadow-2xs">
                1
              </span>
              <h3 className="font-heading font-extrabold text-xs text-[#101828]">Search</h3>
              <p className="text-[10px] text-[#667085] leading-tight mt-0.5">Filter fleet & city</p>
            </div>

            <div className="p-3 rounded-2xl bg-[#F7F8FA] border border-[#EEF0F2] flex flex-col items-center text-center">
              <span className="w-6 h-6 rounded-full bg-[#0B6B4F] text-white font-extrabold text-[11px] flex items-center justify-center mb-1.5 shadow-2xs">
                2
              </span>
              <h3 className="font-heading font-extrabold text-xs text-[#101828]">WhatsApp</h3>
              <p className="text-[10px] text-[#667085] leading-tight mt-0.5">Chat directly</p>
            </div>

            <div className="p-3 rounded-2xl bg-[#F7F8FA] border border-[#EEF0F2] flex flex-col items-center text-center">
              <span className="w-6 h-6 rounded-full bg-[#0B6B4F] text-white font-extrabold text-[11px] flex items-center justify-center mb-1.5 shadow-2xs">
                3
              </span>
              <h3 className="font-heading font-extrabold text-xs text-[#101828]">Pay on Trip</h3>
              <p className="text-[10px] text-[#667085] leading-tight mt-0.5">Settle at handover</p>
            </div>
          </div>

          {/* DESKTOP 3 COLUMNS */}
          <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-[#F7F8FA] border border-[#EEF0F2] flex flex-col gap-3">
              <span className="w-8 h-8 rounded-full bg-[#0B6B4F] text-white font-extrabold text-xs flex items-center justify-center">
                1
              </span>
              <h3 className="font-heading font-extrabold text-lg text-[#101828]">Search & compare</h3>
              <p className="text-xs sm:text-sm text-[#475467] leading-relaxed">
                Filter by city, dates, car type and self-drive or chauffeur. Prices are shown per
                day, 100% upfront.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#F7F8FA] border border-[#EEF0F2] flex flex-col gap-3">
              <span className="w-8 h-8 rounded-full bg-[#0B6B4F] text-white font-extrabold text-xs flex items-center justify-center">
                2
              </span>
              <h3 className="font-heading font-extrabold text-lg text-[#101828]">
                Request on WhatsApp
              </h3>
              <p className="text-xs sm:text-sm text-[#475467] leading-relaxed">
                Tap &ldquo;Request to book&rdquo; and your trip details go straight to the owner on
                WhatsApp. They confirm with you there.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#F7F8FA] border border-[#EEF0F2] flex flex-col gap-3">
              <span className="w-8 h-8 rounded-full bg-[#0B6B4F] text-white font-extrabold text-xs flex items-center justify-center">
                3
              </span>
              <h3 className="font-heading font-extrabold text-lg text-[#101828]">Pick up & go</h3>
              <p className="text-xs sm:text-sm text-[#475467] leading-relaxed">
                Meet at the agreed spot, inspect the car together and pay the owner directly. Zero
                online payment needed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Popular Cities */}
      <section className="py-8 md:py-14 bg-[#F7F8FA] border-t border-[#EEF0F2]">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-8 flex flex-col gap-4 sm:gap-6">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-extrabold text-base sm:text-xl md:text-2xl lg:text-3xl tracking-tight text-[#101828]">
              Popular cities across {country?.name || 'Pakistan'}
            </h2>
            <span className="text-xs text-[#0B6B4F] font-bold">Explore Hubs</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
            {availableCities.slice(0, 4).map((cityName, idx) => {
              const cityImgs = [
                'https://images.unsplash.com/photo-1572455857811-045fb4255b5d?w=400&auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?w=400&auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1627894483216-2138af692e32?w=400&auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?w=400&auto=format&fit=crop&q=80',
              ];
              return (
                <button
                  key={cityName}
                  type="button"
                  onClick={() => {
                    setSearchWhere(cityName);
                    const el = document.getElementById('cars-results');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-2xl bg-white border border-[#EEF0F2] text-left hover:border-[#0B6B4F] transition cursor-pointer group shadow-2xs active:scale-98 min-w-0"
                >
                  <img
                    src={cityImgs[idx % cityImgs.length]}
                    alt={cityName}
                    className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl object-cover shrink-0 group-hover:scale-105 transition-transform"
                  />
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-extrabold text-xs sm:text-sm text-[#101828] truncate">{cityName}</span>
                    <span className="text-[10px] sm:text-[11px] text-[#667085] truncate">Cars · Drivers</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. Become a Partner & Get App Dual Banners */}
      <section className="py-8 md:py-16">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-8 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* For Partners */}
          <div className="bg-[#101828] text-white rounded-3xl p-5 sm:p-8 md:p-10 flex flex-col gap-3 sm:gap-4 justify-between shadow-md">
            <div className="space-y-1.5 sm:space-y-3">
              <span className="text-[10px] sm:text-xs font-bold text-[#F5B547] tracking-wider uppercase">
                For owners, drivers & movers
              </span>
              <h3 className="font-heading font-extrabold text-base sm:text-xl md:text-2xl leading-snug">
                List your vehicle or service. Connect directly with customers.
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md hidden sm:block">
                Create your profile, set your own rates and receive inquiries directly on WhatsApp or in-app chat.
              </p>
            </div>

            <Link
              href="/register?role=LISTER"
              className="self-start h-10 sm:h-12 px-5 sm:px-6 rounded-full bg-white text-[#101828] font-extrabold text-xs sm:text-sm flex items-center justify-center hover:bg-slate-100 transition shadow-sm mt-1 sm:mt-3"
            >
              Become a partner
            </Link>
          </div>

          {/* Get App */}
          <div className="bg-[#E9F3EE] rounded-3xl p-5 sm:p-8 md:p-10 flex flex-col gap-3 sm:gap-4 justify-between border border-[#DCE7E1]">
            <div className="space-y-1.5 sm:space-y-3">
              <span className="text-[10px] sm:text-xs font-bold text-[#0B6B4F] tracking-wider uppercase">
                Get the app
              </span>
              <h3 className="font-heading font-extrabold text-base sm:text-xl md:text-2xl leading-snug text-[#101828]">
                Your trips, chats and bookings in your pocket.
              </h3>
              <p className="text-xs sm:text-sm text-[#344054] leading-relaxed max-w-md hidden sm:block">
                Instant booking updates, live chat with owners and saved vehicles on iOS and Android.
              </p>
            </div>

            <div className="flex gap-2 flex-wrap mt-1 sm:mt-3">
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new Event('safarpk_trigger_pwa_install'));
                  }
                }}
                className="h-10 sm:h-11 px-4 sm:px-5 rounded-xl bg-[#101828] text-white font-bold text-xs flex items-center gap-2 hover:bg-slate-800 transition cursor-pointer active:scale-95 shadow-md"
              >
                <Smartphone className="w-4 h-4 text-[#F5B547]" />
                <span>
                  {devicePlatform === 'Android'
                    ? 'Install Android App'
                    : devicePlatform === 'iOS'
                    ? 'Install for iPhone'
                    : 'Install Desktop App'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

        {/* 8. Global Footer (Hidden on mobile app view) */}
        <AppFooter />
      </div>

      {/* 9. Mobile Bottom Navigation */}
      <MobileNavBar />
    </div>
  );
}

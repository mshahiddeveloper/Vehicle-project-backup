'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AppHeader } from '@/components/AppHeader';
import { AppFooter } from '@/components/AppFooter';
import { MobileNavBar } from '@/components/MobileNavBar';
import { recordLead, recordClickEvent } from '@/data/activityTracker';
import { getActiveUser, setActiveUser } from '@/data/userAuth';
import { getApiBaseUrl } from '@/lib/api';
import { startOrOpenConversation, getWhatsAppTargetUrl } from '@/data/chatEngine';
import { getStoreSlugForOwner } from '@/data/storefrontEngine';
import { useCountry } from '@/app/context/CountryContext';
import { WhatsAppIcon } from '@/components/WhatsAppIcon';
import {
  getRenterDocRequirement,
  isMasterDocAskEnabled,
  DocRequirement,
} from '@/data/docRules';
import {
  ShieldCheck,
  MapPin,
  Lock,
  Upload,
  CheckCircle2,
  AlertCircle,
  Phone,
  MessageSquare,
  ArrowRight,
  ChevronLeft,
  ChevronDown,
  Users,
  Fuel,
  Gauge,
  Briefcase,
  Calendar,
  CalendarCheck,
  Zap,
  X,
  Sparkles,
  Info,
  Car,
  Key,
  Check,
  Clock,
  Award,
  Layers,
  Shield,
  Compass,
  FileText,
  Heart,
  Share2,
} from 'lucide-react';

interface VehicleDetail {
  id: string;
  ref: string;
  title: string;
  category: string;
  bodyType?: string;
  year: number;
  city: string;
  area: string;
  dailyRate: number;
  dailyRateWithDriver: number;
  weeklyRate?: number;
  monthlyRate?: number;
  mileageDaily?: string;
  mileageWeekly?: string;
  mileageMonthly?: string;
  extraKmRate?: string;
  extraKmRateNum?: number;
  serviceScope?: 'BOTH' | 'WITH_DRIVER' | 'WITHOUT_DRIVER';
  fuelIncluded?: boolean;
  fuelKmAllowance?: string;
  insuranceIncluded?: boolean;
  insuranceType?: string;
  deposit?: number;
  transmission: string;
  fuelType: string;
  engineCapacity?: string;
  horsepower?: string;
  seats: number;
  doors?: number;
  bags: string;
  minAge?: number;
  exteriorColor?: string;
  interiorColor?: string;
  interiorFeatures?: string[];
  safetyFeatures?: string[];
  exteriorFeatures?: string[];
  comfortFeatures?: string[];
  infotainmentFeatures?: string[];
  features: string[];
  description: string;
  images: string[];
  hostName: string;
  hostPhone: string;
  hostWhatsapp: string;
  hostResponseTime?: string;
}

const VEHICLE_CATALOG: Record<string, VehicleDetail> = {
  'l-1': {
    id: 'l-1',
    ref: 'LST-480853',
    title: 'Honda Civic Oriel Turbo 2024',
    category: 'Sedan',
    bodyType: 'Executive Sedan',
    year: 2024,
    city: 'Islamabad',
    area: 'Centaurus Mall, F-8',
    dailyRate: 14000,
    dailyRateWithDriver: 16500,
    weeklyRate: 88000,
    monthlyRate: 310000,
    mileageDaily: '250 km / day',
    mileageWeekly: '1,750 km / week',
    mileageMonthly: '5,500 km / month',
    extraKmRate: 'PKR 25 / km',
    extraKmRateNum: 25,
    serviceScope: 'BOTH',
    insuranceIncluded: true,
    insuranceType: 'Comprehensive Insurance Included',
    deposit: 30000,
    transmission: 'Automatic (CVT)',
    fuelType: 'Petrol',
    engineCapacity: '1.5L VTEC Turbo',
    horsepower: '178 HP',
    seats: 5,
    doors: 4,
    bags: '3 large bags',
    minAge: 21,
    exteriorColor: 'Crystal Black Pearl',
    interiorColor: 'Black Leather',
    interiorFeatures: [
      'Premium Black Leather Upholstery',
      'Dual-Zone Automatic Climate Control AC',
      'Rear Passenger Air Conditioning Vents',
      '8-Way Power Adjustable Driver Seat',
      'Ambient LED Footwell Lighting',
      'Leather-Wrapped Steering Wheel',
    ],
    safetyFeatures: [
      'Multi-Angle Rearview Camera with Dynamic Guidelines',
      'Front & Rear Ultrasonic Parking Sensors',
      'Vehicle Stability Assist (VSA) with Traction Control',
      'Anti-Lock Braking System (ABS) with EBD & Brake Assist',
      '6 SRS Airbags (Dual Front, Side & Curtain)',
      'ISOFIX Child Seat Anchors',
      'Hill Start Assist (HSA)',
    ],
    exteriorFeatures: [
      '17-Inch Dual-Tone Diamond Cut Alloy Wheels',
      'Full LED Headlights with Daytime Running Lights (DRLs)',
      'Electric Tilt & Slide Sunroof',
      'Power-Folding Heated Side Mirrors with LED Indicators',
      'Aerodynamic Shark Fin Antenna',
    ],
    comfortFeatures: [
      'Push Button Engine Start / Stop',
      'Smart Keyless Entry & Remote Trunk Release',
      'Cruise Control with Steering Controls',
      'Steering-Mounted Paddle Shifters',
      'Tilt & Telescopic Steering Column',
    ],
    infotainmentFeatures: [
      '9-Inch Advanced Display Audio Touchscreen',
      'Wireless Apple CarPlay & Android Auto',
      'Bluetooth Hands-Free Calling & Audio Streaming',
      'Wireless Smartphone Fast Charging Pad',
      'High-Fidelity 8-Speaker Audio System',
      'Front & Rear Dual USB Fast Charging Ports',
    ],
    features: [
      'Dual Zone Climate Control AC',
      'Sunroof & Cruise Control',
      'Front & Rear Dashcam',
      'Apple CarPlay & Android Auto',
      'Comprehensive Insurance Included',
    ],
    description:
      'Well kept 2024 Civic Oriel Turbo, serviced exclusively at authorized dealership every 5,000 km. Comes with full fuel tank, pristine leather interior, tinted privacy windows, and child seat on advance request. Strict non-smoking policy inside the vehicle.',
    images: [
      'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1200&q=80',
    ],
    hostName: 'Kashif Motors Islamabad',
    hostPhone: '+92 300 1234567',
    hostWhatsapp: '923001234567',
    hostResponseTime: 'Replies in ~5 minutes',
  },
  'l-2': {
    id: 'l-2',
    ref: 'LST-065123',
    title: 'Toyota Corolla Altis Grande 1.8 2024',
    category: 'Sedan',
    bodyType: 'Sedan',
    year: 2024,
    city: 'Lahore',
    area: 'Gulberg III, Main Boulevard',
    dailyRate: 11000,
    dailyRateWithDriver: 13500,
    weeklyRate: 69000,
    monthlyRate: 245000,
    mileageDaily: '250 km / day',
    mileageWeekly: '1,750 km / week',
    mileageMonthly: '5,000 km / month',
    extraKmRate: 'PKR 20 / km',
    extraKmRateNum: 20,
    serviceScope: 'BOTH',
    insuranceIncluded: true,
    insuranceType: 'Comprehensive Insurance Included',
    deposit: 25000,
    transmission: 'Automatic (7-Speed Super CVT-i)',
    fuelType: 'Petrol',
    engineCapacity: '1.8L Dual VVT-i',
    horsepower: '138 HP',
    seats: 5,
    doors: 4,
    bags: '3 large bags',
    minAge: 21,
    exteriorColor: 'Super White',
    interiorColor: 'Beige & Black',
    interiorFeatures: [
      'High-Grade Leather / Fabric Combination Seats',
      'Digital Climate Control Air Conditioning',
      'Rear Passenger Center Armrest with Cup Holders',
      'Chilled Storage Glove Box',
    ],
    safetyFeatures: [
      'Reverse Camera with Guidance Assist',
      'Front & Rear Parking Sonar Sensors',
      'Vehicle Stability Control (VSC)',
      'ABS + EBD with Emergency Brake Assist',
      'Dual Front Airbags',
      'Immobilizer Anti-Theft Security System',
    ],
    exteriorFeatures: [
      '16-Inch Factory Alloy Rims with Brand New Tyres',
      'Bi-Beam LED Headlights with DRLs',
      'Electric Sunroof',
      'Electrically Retractable Side Mirrors',
      'Rear Trunk Lip Spoiler',
    ],
    comfortFeatures: [
      'Push Start & Smart Keyless Entry',
      'Paddle Shifters behind Steering Wheel',
      'Cruise Control for Highway Driving',
      'Steering Wheel Audio & Phone Controls',
    ],
    infotainmentFeatures: [
      '9-Inch Touchscreen Android Infotainment System',
      'Bluetooth Hands-Free & Media Connectivity',
      'Pre-Installed Google Maps Navigation',
      'Front & Rear High-Speed USB Chargers',
    ],
    features: [
      'Automatic Climate Control',
      'Paddle Shifters',
      'Rear Camera & Parking Sensors',
      'Alloy Rims & Brand New Tyres',
      'Motorway M-2 Tag Active',
    ],
    description:
      'Executive family sedan in immaculate condition. Clean exterior and interior, regularly sanitized. Ideal for city corporate meetings or Lahore-Islamabad motorway travel. Fully insured with 24/7 roadside assistance.',
    images: [
      'https://images.unsplash.com/photo-1623869675781-80aa31012a5a?auto=format&fit=crop&w=1200&q=80',
    ],
    hostName: 'Lahore Premier Car Rentals',
    hostPhone: '+92 321 4455667',
    hostWhatsapp: '923214455667',
    hostResponseTime: 'Replies in ~8 minutes',
  },
  'l-3': {
    id: 'l-3',
    ref: 'LST-890214',
    title: 'Toyota Fortuner Legender 2.8 4x4 2024',
    category: 'SUV',
    bodyType: 'Luxury 4x4 SUV',
    year: 2024,
    city: 'Islamabad',
    area: 'F-7 Markaz, Jinnah Super',
    dailyRate: 26000,
    dailyRateWithDriver: 29500,
    weeklyRate: 165000,
    monthlyRate: 590000,
    mileageDaily: '200 km / day',
    mileageWeekly: '1,400 km / week',
    mileageMonthly: '4,500 km / month',
    extraKmRate: 'PKR 35 / km',
    extraKmRateNum: 35,
    serviceScope: 'BOTH',
    insuranceIncluded: true,
    insuranceType: 'Full Comprehensive Insurance Included',
    deposit: 50000,
    transmission: 'Automatic (6-Speed with Sequential)',
    fuelType: 'Diesel (Turbo)',
    engineCapacity: '2.8L 1GD-FTV Turbo Diesel',
    horsepower: '201 HP',
    seats: 7,
    doors: 5,
    bags: '4 large bags',
    minAge: 25,
    exteriorColor: 'Dual-Tone Pearl White & Black Roof',
    interiorColor: 'Maroon & Black Premium Leather',
    interiorFeatures: [
      'Perforated Maroon & Black Dual-Tone Leather Seats',
      'Dual-Zone Automatic Climate Control (Front & Rear)',
      'Illuminated Scuff Plates & Ambient Cabin Lighting',
      'Power Adjustable Front Passenger & Driver Seats',
      'Third-Row 50:50 Split Folding Seats',
    ],
    safetyFeatures: [
      '360-Degree Panoramic View Camera System',
      'Front & Rear Parking Clearance Sonar',
      'Active Traction Control (A-TRC) & Downhill Assist (DAC)',
      '7 SRS Airbags (Front, Side, Curtain & Driver Knee)',
      'Vehicle Stability Control (VSC)',
      'Vehicle Immobilizer & Security Alarm',
    ],
    exteriorFeatures: [
      '18-Inch Legender Exclusive Alloy Wheels',
      'Quad-LED Headlights with Sequential Turn Signals',
      'Power Back Door with Kick Sensor (Hands-Free Tailgate)',
      'Gloss Black Honeycomb Front Grille',
      'Aerodynamic Roof Rails',
    ],
    comfortFeatures: [
      'Push Button Start & Smart Entry',
      'Drive Mode Selector (Eco / Normal / Sport)',
      'Paddle Shifters for Manual Override',
      'Wireless Smartphone Charger',
      'Cooled Upper Glove Box',
    ],
    infotainmentFeatures: [
      '8.9-Inch High-Resolution Touchscreen System',
      'Apple CarPlay & Android Auto Integration',
      'JBL Premium 11-Speaker Audio System with Subwoofer',
      'USB Fast Charging in All 3 Seating Rows',
    ],
    features: [
      '4x4 Off-Road Capabilities',
      '360 Degree Camera',
      '7 Seater Capacity',
      'Handsfree Power Tailgate',
      'JBL Sound System',
    ],
    description:
      'Brand new 2024 Fortuner Legender 2.8 4x4. The ultimate vehicle for VIP northern areas travel (Naran, Hunza, Skardu) or executive delegations in Islamabad. Chauffeur option includes certified mountain drivers.',
    images: [
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80',
    ],
    hostName: 'Capital VIP Fleets Islamabad',
    hostPhone: '+92 333 5566778',
    hostWhatsapp: '923335566778',
    hostResponseTime: 'Replies in ~3 minutes',
  },
};

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const listingId = (params?.id as string) || 'l-1';

  const [car, setCar] = useState<VehicleDetail>(
    VEHICLE_CATALOG[listingId] || VEHICLE_CATALOG['l-1']
  );

  // Scan localStorage for custom lister vehicles if not in static catalog
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (VEHICLE_CATALOG[listingId]) {
      setCar(VEHICLE_CATALOG[listingId]);
      return;
    }
    try {
      const keys = Object.keys(localStorage).filter((k) => k.startsWith('safarpk_fleet_'));
      for (const k of keys) {
        const raw = localStorage.getItem(k);
        if (raw) {
          const list = JSON.parse(raw);
          const found = list.find((v: any) => v.id === listingId);
          if (found) {
            setCar({
              id: found.id,
              ref: found.reg || 'Direct Reservation',
              title: found.title,
              category: found.category || 'Sedan',
              bodyType: found.bodyType || found.category || 'Standard Sedan',
              year: found.year || 2024,
              city: found.city || 'Islamabad',
              area: found.location || 'Fleet Office',
              dailyRate: found.dailyRate || 5000,
              dailyRateWithDriver:
                found.withDriverRate || (found.dailyRate ? found.dailyRate + 2500 : 7500),
              weeklyRate: found.weeklyRate ? Number(found.weeklyRate) : undefined,
              monthlyRate: found.monthlyRate ? Number(found.monthlyRate) : undefined,
              mileageDaily: found.mileageDaily || undefined,
              mileageWeekly: found.mileageWeekly || undefined,
              mileageMonthly: found.mileageMonthly || undefined,
              extraKmRate: found.extraKmRate || undefined,
              extraKmRateNum:
                found.extraKmRateNum !== undefined && found.extraKmRateNum !== ''
                  ? Number(found.extraKmRateNum)
                  : found.extraKmRate
                  ? Number(String(found.extraKmRate).replace(/\D/g, '')) || undefined
                  : undefined,
              serviceScope: found.serviceScope || 'BOTH',
              fuelIncluded: !!found.fuelIncluded,
              fuelKmAllowance: found.fuelKmAllowance || undefined,
              insuranceIncluded: found.insuranceIncluded ?? true,
              insuranceType: found.insuranceType || 'Comprehensive Insurance Included',
              deposit:
                found.deposit !== undefined && found.deposit !== '' && Number(found.deposit) > 0
                  ? Number(found.deposit)
                  : undefined,
              transmission: found.transmission || 'Automatic',
              fuelType: found.fuelType || 'Petrol',
              engineCapacity: found.engineCapacity,
              horsepower: found.horsepower,
              seats: found.seats || 5,
              doors: found.doors || 4,
              bags: found.bags || '2 large bags',
              minAge: found.minAge ? Number(found.minAge) : 21,
              exteriorColor: found.exteriorColor,
              interiorColor: found.interiorColor,
              interiorFeatures: found.interiorFeatures,
              safetyFeatures: found.safetyFeatures,
              exteriorFeatures: found.exteriorFeatures,
              comfortFeatures: found.comfortFeatures,
              infotainmentFeatures: found.infotainmentFeatures,
              features: found.features || [
                found.transmission || 'Automatic',
                'Air Conditioning & Heating',
                'Comprehensive Insurance Included',
              ],
              description:
                found.description ||
                `Clean and well maintained ${found.title}. Available for daily, weekly, or monthly rental with direct host support.`,
              images: found.img
                ? [found.img]
                : [
                    'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=600&auto=format&fit=crop&q=80',
                  ],
              hostName: found.shopName || 'SafarPK Verified Host',
              hostPhone: found.phone || '+92 300 1234567',
              hostWhatsapp: (found.phone || '923001234567').replace(/\D/g, ''),
              hostResponseTime: 'Replies in ~8 minutes',
            });
            break;
          }
        }
      }
    } catch (e) {}
  }, [listingId]);

  const [withDriver, setWithDriver] = useState(car.serviceScope === 'WITH_DRIVER');
  const [hostPhoneRevealed, setHostPhoneRevealed] = useState(false);
  const [specsOpen, setSpecsOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [policiesOpen, setPoliciesOpen] = useState(false);

  const scrollToBooking = () => {
    if (typeof window !== 'undefined') {
      const el = document.getElementById('booking-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
    setStep(1);
  };

  useEffect(() => {
    if (car.serviceScope === 'WITH_DRIVER') {
      setWithDriver(true);
    } else if (car.serviceScope === 'WITHOUT_DRIVER') {
      setWithDriver(false);
    }
  }, [car.serviceScope]);

  const pickupInputRef = useRef<HTMLInputElement>(null);
  const returnInputRef = useRef<HTMLInputElement>(null);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const initialReturnStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  }, []);

  const [pickupDate, setPickupDate] = useState<string>(todayStr);
  const [returnDate, setReturnDate] = useState<string>(initialReturnStr);

  const daysCount = useMemo(() => {
    if (!pickupDate || !returnDate) return 1;
    const p = new Date(pickupDate + 'T00:00:00').getTime();
    const r = new Date(returnDate + 'T00:00:00').getTime();
    const diff = Math.ceil((r - p) / (1000 * 60 * 60 * 24));
    return Math.max(1, isNaN(diff) ? 1 : diff);
  }, [pickupDate, returnDate]);

  const formatDisplayDate = (dStr: string) => {
    if (!dStr) return '';
    const d = new Date(dStr + 'T00:00:00');
    if (isNaN(d.getTime())) return dStr;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  const [step, setStep] = useState<number>(0); // 0: Review, 1: Details & Verification
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('+92 300 ');
  const [customerNote, setCustomerNote] = useState('');
  const [savedInfoLoaded, setSavedInfoLoaded] = useState(false);

  // Self-drive OCR Licence State
  const [licenceUploaded, setLicenceUploaded] = useState(false);
  const [licenceFileName, setLicenceFileName] = useState('');
  const [ocrLicenceNumber, setOcrLicenceNumber] = useState('');
  const [ocrExpiry, setOcrExpiry] = useState('');
  const [cnicNumber, setCnicNumber] = useState('');
  const [validationError, setValidationError] = useState('');

  // Wishlist & Share State (Page 8 Specification)
  const [isSaved, setIsSaved] = useState(false);
  const [shareNotice, setShareNotice] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const rawVehicles = localStorage.getItem('safarpk_saved_vehicles');
      const rawItems = localStorage.getItem('safarpk_saved_items');
      let saved = false;
      if (rawVehicles) {
        const parsed = JSON.parse(rawVehicles);
        if (Array.isArray(parsed) && parsed.includes(car.id)) saved = true;
      }
      if (!saved && rawItems) {
        const parsed = JSON.parse(rawItems);
        if (Array.isArray(parsed) && parsed.some((it: any) => (it.id || it) === car.id)) saved = true;
      }
      setIsSaved(saved);
    } catch (e) {}
  }, [car.id]);

  const handleToggleSave = () => {
    try {
      const nextSaved = !isSaved;
      setIsSaved(nextSaved);

      let vIds: string[] = [];
      const rawVehicles = localStorage.getItem('safarpk_saved_vehicles');
      if (rawVehicles) {
        try { vIds = JSON.parse(rawVehicles); } catch (e) {}
      }
      if (nextSaved) {
        if (!vIds.includes(car.id)) vIds.push(car.id);
      } else {
        vIds = vIds.filter((id) => id !== car.id);
      }
      localStorage.setItem('safarpk_saved_vehicles', JSON.stringify(vIds));

      let storedList: any[] = [];
      const rawItems = localStorage.getItem('safarpk_saved_items');
      if (rawItems) {
        try { storedList = JSON.parse(rawItems); } catch (e) {}
      }
      if (nextSaved) {
        storedList = storedList.filter((item) => (item.id || item) !== car.id);
        storedList.unshift({
          id: car.id,
          title: car.title,
          name: car.title,
          category: 'Cars',
          specs: `${car.transmission} · ${car.year} · ${car.seats} seats`,
          city: car.city,
          rate: `PKR ${car.dailyRate.toLocaleString()} / day`,
          price: `PKR ${car.dailyRate.toLocaleString()} / day`,
          savedAt: new Date().toISOString(),
        });
      } else {
        storedList = storedList.filter((item) => (item.id || item) !== car.id);
      }
      localStorage.setItem('safarpk_saved_items', JSON.stringify(storedList));

      window.dispatchEvent(new Event('safarpk_saved_updated'));
      window.dispatchEvent(new Event('safarpk_favorites_updated'));

      setShareNotice(nextSaved ? 'Saved to wishlist!' : 'Removed from wishlist');
      setTimeout(() => setShareNotice(null), 2500);
    } catch (e) {}
  };

  const handleShareListing = async () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://safar.pk';
    const shareUrl = `${origin}/listing/${car.id}`;
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      try {
        await (navigator as any).share({
          title: `${car.title} on SafarPK`,
          text: `Check out this ${car.title} for rent in ${car.city} on SafarPK!`,
          url: shareUrl,
        });
        return;
      } catch (e) {}
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      setShareNotice('Link copied to clipboard!');
      setTimeout(() => setShareNotice(null), 2500);
    }
  };

  // Populate active user info if logged in or previously saved
  useEffect(() => {
    const user = getActiveUser();
    let hasLoaded = false;
    if (user && user.name) {
      setCustomerName(user.name);
      setCustomerPhone(user.phone || '+92 300 ');
      if (user.nationalId) setCnicNumber(user.nationalId);
      if (user.licenseNumber) {
        setLicenceUploaded(true);
        setLicenceFileName('account_verified_licence.jpg');
        setOcrLicenceNumber(user.licenseNumber);
        setOcrExpiry('14 Oct 2028');
      }
      hasLoaded = true;
    } else {
      try {
        const raw = localStorage.getItem('safarpk_saved_customer_info');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.name) setCustomerName(parsed.name);
          if (parsed?.phone) setCustomerPhone(parsed.phone);
          if (parsed?.cnic) setCnicNumber(parsed.cnic);
          if (parsed?.licence) {
            setLicenceUploaded(true);
            setLicenceFileName('saved_verified_licence.jpg');
            setOcrLicenceNumber(parsed.licence);
            setOcrExpiry(parsed.licenceExpiry || '14 Oct 2028');
          }
          hasLoaded = true;
        }
      } catch (e) {}
    }
    setSavedInfoLoaded(hasLoaded);
  }, []);

  // Dynamic Country & Document Requirements from Super Admin Matrix
  const { country, formatPrice } = useCountry();
  const isPakistan = country?.code === 'PK';
  const countryCode = country?.code || 'PK';
  const [docReqs, setDocReqs] = useState({
    licence: getRenterDocRequirement(countryCode, 'licence'),
    id: getRenterDocRequirement(countryCode, 'id'),
    masterAsk: isMasterDocAskEnabled(),
  });

  useEffect(() => {
    const updateRules = () => {
      setDocReqs({
        licence: getRenterDocRequirement(countryCode, 'licence'),
        id: getRenterDocRequirement(countryCode, 'id'),
        masterAsk: isMasterDocAskEnabled(),
      });
    };
    updateRules();
    window.addEventListener('safarpk_doc_rules_updated', updateRules);
    return () => window.removeEventListener('safarpk_doc_rules_updated', updateRules);
  }, [countryCode]);

  const effectiveLicenceReq: DocRequirement = docReqs.masterAsk
    ? docReqs.licence.requirement
    : 'Off';
  const effectiveIdReq: DocRequirement = docReqs.masterAsk
    ? docReqs.id.requirement
    : 'Off';
  const licenceDocTitle = docReqs.licence.docName || 'Driving licence';
  const idDocTitle = docReqs.id.docName || 'National ID (CNIC)';

  // Document satisfaction check
  const areDocumentsSatisfied = () => {
    if (withDriver) return true;

    if (effectiveLicenceReq === 'Upload' && !licenceUploaded) return false;
    if (effectiveLicenceReq === 'Type it' && !ocrLicenceNumber.trim()) return false;

    if (effectiveIdReq === 'Type it') {
      const digits = cnicNumber.replace(/\D/g, '');
      if (countryCode === 'PK' && digits.length !== 13) return false;
      if (!cnicNumber.trim()) return false;
    } else if (effectiveIdReq === 'Upload') {
      if (!cnicNumber.trim() && !licenceUploaded) return false;
    }

    return true;
  };

  const formatPKR = (v: number) => formatPrice(v);

  const calculateTotal = () => {
    const baseDaily = withDriver ? car.dailyRateWithDriver : car.dailyRate;
    return baseDaily * daysCount;
  };

  // CNIC formatting helper (35202-1234567-1)
  const handleCnicChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 13);
    let formatted = digits;
    if (digits.length > 5 && digits.length <= 12) {
      formatted = `${digits.slice(0, 5)}-${digits.slice(5)}`;
    } else if (digits.length > 12) {
      formatted = `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12, 13)}`;
    }
    setCnicNumber(formatted);
  };

  // Simulate OCR Scan of driving licence
  const handleSimulatedLicenceUpload = () => {
    setLicenceUploaded(true);
    setLicenceFileName('Driving_Licence_Front.jpg');
    setOcrLicenceNumber('LHR-DL-492019-B');
    setOcrExpiry('14 Oct 2028');
    setValidationError('');
  };

  const handleDirectHostCall = () => {
    recordClickEvent({
      clickType: 'CALL_CLICK',
      targetId: car.id,
      targetTitle: car.title,
      targetCategory: 'CAR_RENTAL',
      targetOwnerName: car.hostName,
      city: car.city,
    });
    recordLead({
      listingId: car.id,
      listingTitle: car.title,
      listerPhone: car.hostPhone,
      customerCity: car.city,
      type: 'DIRECT_CALL',
      notes: `Direct phone call initiated from vehicle page for ${car.title}`,
    });

    const isAlreadyRevealed = hostPhoneRevealed;
    setHostPhoneRevealed(true);

    if (isAlreadyRevealed || (typeof window !== 'undefined' && window.innerWidth < 768)) {
      window.location.href = `tel:${car.hostPhone.replace(/[^0-9+]/g, '')}`;
    }
  };

  const handleInstantWhatsAppChat = () => {
    recordClickEvent({
      clickType: 'WHATSAPP_CLICK',
      targetId: car.id,
      targetTitle: car.title,
      targetCategory: 'CAR_RENTAL',
      targetOwnerName: car.hostName,
      city: car.city,
    });
    recordLead({
      listingId: car.id,
      listingTitle: car.title,
      listerPhone: car.hostPhone,
      customerCity: car.city,
      type: 'WHATSAPP',
      notes: `Instant direct WhatsApp inquiry without login for ${car.title}`,
    });
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://safar.pk';
    const listingUrl = `${origin}/listing/${car.id}`;
    const dayRate = formatPrice(car.dailyRate);
    const weekRate = formatPrice(Math.round(car.dailyRate * 6.5));
    const monthRate = formatPrice(Math.round(car.dailyRate * 24));
    const serviceMode = withDriver ? (isPakistan ? 'with driver' : 'with chauffeur') : 'self-drive';
    const msg = `Hi, I would like to rent this car listed by ${car.hostName} on SafarPK: Car: ${car.title} (${serviceMode}) Price: ${dayRate}/day or ${weekRate}/week or ${monthRate}/month Listing: ${listingUrl}`;
    const cleanNum = car.hostPhone.replace(/\D/g, '');
    const url = getWhatsAppTargetUrl(cleanNum, msg);
    window.open(url, '_blank');
  };

  const handleConfirmBookingAndChat = (openWhatsAppAlso: boolean = false) => {
    if (!customerName.trim()) {
      setValidationError('Please enter your full name');
      return;
    }
    if (!customerPhone.trim()) {
      setValidationError('Please enter your phone number');
      return;
    }

    if (!withDriver) {
      // Validate licence according to Super Admin matrix
      if (effectiveLicenceReq === 'Upload' && !licenceUploaded) {
        setValidationError(`Self-drive rental requires ${licenceDocTitle} upload.`);
        return;
      }
      if (effectiveLicenceReq === 'Type it' && !ocrLicenceNumber.trim()) {
        setValidationError(`Please enter your ${licenceDocTitle} number.`);
        return;
      }

      // Validate ID / CNIC according to Super Admin matrix
      if (effectiveIdReq === 'Type it') {
        const digits = cnicNumber.replace(/\D/g, '');
        if (countryCode === 'PK' && digits.length !== 13) {
          setValidationError(`Please enter a valid 13-digit ${idDocTitle} number.`);
          return;
        } else if (!cnicNumber.trim()) {
          setValidationError(`Please enter your ${idDocTitle} number.`);
          return;
        }
      } else if (effectiveIdReq === 'Upload' && !cnicNumber.trim() && !licenceUploaded) {
        setValidationError(`Please provide your ${idDocTitle} details.`);
        return;
      }
    }

    setValidationError('');

    // Persist customer profile details so customer does not have to fill again
    try {
      localStorage.setItem(
        'safarpk_saved_customer_info',
        JSON.stringify({
          name: customerName.trim(),
          phone: customerPhone.trim(),
          cnic: cnicNumber,
          licence: ocrLicenceNumber,
          licenceExpiry: ocrExpiry,
        })
      );
      const user = getActiveUser();
      if (user) {
        user.name = customerName.trim();
        user.phone = customerPhone.trim();
        if (cnicNumber) user.nationalId = cnicNumber;
        if (ocrLicenceNumber) user.licenseNumber = ocrLicenceNumber;
        setActiveUser(user);
      }
    } catch (e) {}

    const bookingRef = `BKG-${Math.floor(1000 + Math.random() * 9000)}`;
    const totalAmt = calculateTotal();
    const totalCostStr = formatPrice(totalAmt);
    const durationStr = `${daysCount} ${daysCount === 1 ? 'day' : 'days'}`;
    const serviceModeStr = withDriver ? 'With Professional Chauffeur' : 'Self-Drive';
    const pickFormatted = formatDisplayDate(pickupDate);
    const returnFormatted = formatDisplayDate(returnDate);

    // 1. Build Booking Record for Dashboards
    const newBookingRecord = {
      id: `bkg-${Date.now()}`,
      bookingRef,
      vehicleName: car.title,
      assignedVehicleReg: car.ref || 'Direct Reservation',
      city: car.city,
      startDate: pickupDate,
      endDate: returnDate,
      dailyRate: withDriver ? car.dailyRateWithDriver : car.dailyRate,
      totalAmount: totalAmt,
      withDriver,
      pickupArea: `${car.city} Fleet Station`,
      listerPhone: car.hostPhone,
      listerBusinessName: car.hostName,
      customerName: customerName.trim() || 'Valued Customer',
      customerPhone: customerPhone.trim() || '+92 300 0000000',
      customerCnic: cnicNumber || 'Pending At Pickup',
      customerLicense: ocrLicenceNumber || (withDriver ? 'Chauffeur Included' : 'Pending At Pickup'),
      status: 'CONFIRMED',
      paymentStatus: 'PAY_ON_PICKUP',
      serviceType: 'CAR_RENTAL',
      assignedDriver: withDriver ? 'Designated VIP Chauffeur' : 'Self-Drive (Customer Driving)',
      createdAt: new Date().toISOString(),
    };

    // 2. Save into Customer Dashboard (safarpk_customer_bookings)
    try {
      const existingCust = JSON.parse(localStorage.getItem('safarpk_customer_bookings') || '[]');
      const updatedCust = [newBookingRecord, ...existingCust.filter((b: any) => b.bookingRef !== bookingRef)];
      localStorage.setItem('safarpk_customer_bookings', JSON.stringify(updatedCust));
    } catch (e) {}

    // 3. Save into Lister Dashboard (safarpk_lister_bookings)
    try {
      const existingList = JSON.parse(localStorage.getItem('safarpk_lister_bookings') || '[]');
      const updatedList = [newBookingRecord, ...existingList.filter((b: any) => b.bookingRef !== bookingRef)];
      localStorage.setItem('safarpk_lister_bookings', JSON.stringify(updatedList));
    } catch (e) {}

    // 4. Record Lead & Analytics
    recordLead({
      listingId: car.id,
      listingTitle: car.title,
      listerPhone: car.hostPhone,
      customerCity: car.city,
      type: 'BOOKING_REQUEST',
      notes: `Confirmed direct booking & chat for ${car.title} (Ref: ${bookingRef})`,
    });
    recordClickEvent({
      clickType: 'BOOKING_CONFIRMED',
      targetId: car.id,
      targetTitle: car.title,
      targetCategory: 'CAR_RENTAL',
      targetOwnerName: car.hostName,
      city: car.city,
    });

    // 5. Start / Open Direct In-App Chat
    let convId = '';
    try {
      const activeU = getActiveUser() || {
        id: 'usr-customer-active',
        name: customerName.trim() || 'Valued Customer',
        phone: customerPhone.trim() || '+92 300 0000000',
        city: car.city,
        countryCode: 'PK',
        role: 'CUSTOMER' as const,
        registeredAt: new Date().toISOString(),
        subscription: { status: 'UNSUBSCRIBED' as const, quota: 0, usedQuota: 0 },
        metrics: { viewCount: 0, leadsCount: 0, clickCount: 0, lastActive: new Date().toISOString() },
        activities: [],
      };

      convId = startOrOpenConversation({
        currentUser: activeU,
        partnerId: 'usr-demo-lister',
        partnerName: car.hostName,
        partnerRole: 'LISTER',
        partnerPhone: car.hostPhone,
        about: `${car.title} · ${serviceModeStr}`,
        bookingRef,
        bookingMetadata: {
          category: 'rent_a_car',
          customerName: customerName.trim() || activeU.name,
          customerPhone: customerPhone.trim() || activeU.phone,
          customerCity: car.city,
          providerName: car.hostName,
          providerManager: `${car.hostName} Fleet Reservation`,
          providerPhone: car.hostPhone,
          itemName: car.title,
          pickupDate: pickFormatted,
          returnDate: returnFormatted,
          duration: durationStr,
          totalEstimate: totalCostStr,
          serviceMode: serviceModeStr,
          bookingRef,
        },
      });
    } catch (e) {}

    // 6. Sync with backend API
    if (typeof window !== 'undefined') {
      fetch(`${getApiBaseUrl()}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingRef,
          isGuest: !getActiveUser(),
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerCnic: cnicNumber.trim() || undefined,
          serviceCategory: 'CAR_RENTAL',
          listingId: car.id,
          startDate: pickupDate,
          endDate: returnDate,
          pickupCity: car.city,
          withDriver,
          totalAmount: totalAmt,
        }),
      }).catch(() => {});
    }

    // 7. Optional WhatsApp Launch if requested
    if (openWhatsAppAlso) {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://safar.pk';
      const listingUrl = `${origin}/listing/${car.id}`;
      const dayRate = formatPrice(car.dailyRate);
      const weekRate = formatPrice(Math.round(car.dailyRate * 6.5));
      const monthRate = formatPrice(Math.round(car.dailyRate * 24));
      const rawMessageText = `Hi, I booked this car with ${car.hostName} on SafarPK (Booking Ref: *${bookingRef}*):\n• Car: ${car.title} (${
        withDriver ? 'With Chauffeur' : 'Self-Drive'
      })\n• Price: ${dayRate}/day or ${weekRate}/week or ${monthRate}/month\n• Dates: ${pickFormatted} to ${returnFormatted} (${daysCount} days)\n• Estimated Total: ${totalCostStr}\n• Customer: ${customerName} (${customerPhone})\n• Listing: ${listingUrl}`;
      const targetWhatsAppUrl = getWhatsAppTargetUrl(car.hostWhatsapp || car.hostPhone, rawMessageText);
      window.open(targetWhatsAppUrl, '_blank');
    }

    // 8. Redirect directly to direct in-app chat
    if (convId) {
      router.push(`/inbox?conv=${convId}`);
    } else {
      router.push('/customer');
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-[#101828] flex flex-col">
      <AppHeader />

      <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 sm:px-8 py-6 md:py-10 flex flex-col gap-6">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="text-sm text-[#667085] flex items-center gap-2">
          <Link href="/" className="hover:text-[#101828]">
            Home
          </Link>
          <span>/</span>
          <span className="hover:text-[#101828]">{car.city}</span>
          <span>/</span>
          <span className="text-[#101828] font-semibold truncate">{car.title}</span>
        </nav>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-2.5 rounded-3xl overflow-hidden h-72 sm:h-96">
          <div className="md:col-span-2 md:row-span-2 relative bg-slate-100 flex items-center justify-center overflow-hidden">
            <img
              src={car.images[0]}
              alt={car.title}
              className="w-full h-full object-cover"
            />

            {/* Top action overlay (Back, Share, Save) matching App-Detail.dc.html & Page 8 */}
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Back"
              className="absolute top-4 left-4 z-20 w-10 h-10 rounded-full bg-white/95 backdrop-blur-sm border border-slate-200/60 shadow-md flex items-center justify-center text-slate-800 hover:bg-white active:scale-95 transition cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.4]" />
            </button>

            <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
              <button
                type="button"
                onClick={handleShareListing}
                aria-label="Share"
                className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-sm border border-slate-200/60 shadow-md flex items-center justify-center text-slate-800 hover:bg-white active:scale-95 transition cursor-pointer"
              >
                <Share2 className="w-4 h-4 stroke-[2.2]" />
              </button>
              <button
                type="button"
                onClick={handleToggleSave}
                aria-label="Save"
                className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-sm border border-slate-200/60 shadow-md flex items-center justify-center hover:bg-white active:scale-95 transition cursor-pointer"
              >
                <Heart
                  className={`w-4.5 h-4.5 transition ${
                    isSaved ? 'text-rose-500 fill-rose-500 stroke-rose-500' : 'text-slate-800'
                  }`}
                />
              </button>
            </div>

            {/* Share / Save Feedback Toast */}
            {shareNotice && (
              <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 bg-slate-900/90 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm animate-in fade-in duration-150">
                {shareNotice}
              </div>
            )}

            <span className="absolute left-4 bottom-4 text-xs font-bold text-[#667085] bg-white/95 px-3 py-1 rounded-md shadow-xs">
              Exterior Photo
            </span>

            {/* Photo counter chip 1/8 */}
            <span className="absolute right-4 bottom-4 z-20 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full">
              1 / 8
            </span>
          </div>
          <div className="hidden md:flex bg-slate-100 items-end p-3 text-xs font-semibold text-[#667085]">
            Front Cabin & Console
          </div>
          <div className="hidden md:flex bg-slate-100 items-end p-3 text-xs font-semibold text-[#667085]">
            Rear Passenger Seats
          </div>
          <div className="hidden md:flex bg-slate-100 items-end p-3 text-xs font-semibold text-[#667085]">
            Dashboard & Steering
          </div>
          <div className="hidden md:flex bg-slate-100 items-end justify-between p-3 text-xs font-semibold text-[#667085]">
            Luggage Boot
            <button
              type="button"
              className="px-2.5 py-1 rounded-lg border border-[#101828] bg-white text-[#101828] font-bold text-xs"
            >
              All photos
            </button>
          </div>
        </div>

        {/* Main 2-Column Content */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10 items-start pt-2">
          {/* Left Column: Car Specs, Owner Profile, Features, Location */}
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-[#E9F3EE] text-[#0B6B4F] text-xs font-bold">
                  Registered fleet partner
                </span>
                <span className="px-3 py-1 rounded-full bg-[#F2F4F7] text-[#344054] text-xs font-semibold">
                  Self-drive or with driver
                </span>
                {car.bodyType && (
                  <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                    {car.bodyType}
                  </span>
                )}
              </div>
              <h1 className="font-heading font-extrabold text-lg sm:text-2xl md:text-3xl lg:text-4xl text-[#101828] tracking-tight leading-tight">
                {car.title}
              </h1>
              <p className="text-[#475467] text-xs sm:text-sm flex items-center gap-1.5 flex-wrap">
                <MapPin className="w-4 h-4 text-[#0B6B4F] shrink-0" />
                <span>
                  {car.city} · {car.area} (pick-up at fleet office or delivery)
                </span>
              </p>
            </div>

            {/* 1. Rental Pricing Plans (Daily, Weekly, Monthly) - OneClickDrive inspired */}
            <div className="flex flex-col gap-3 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-600" />
                  <span>Rental Pricing & Mileage Plans</span>
                </h3>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Direct Rates · No Hidden Fees
                </span>
              </div>

              {/* Service Scope Badges & Fuel Status */}
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                {car.serviceScope === 'WITH_DRIVER' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    {isPakistan ? 'With Driver / Captain Only' : 'With Chauffeur Only'}
                  </span>
                ) : car.serviceScope === 'WITHOUT_DRIVER' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200">
                    <Key className="w-3.5 h-3.5 text-purple-600" />
                    Self-Drive (Without Driver) Only
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    Self-Drive & {isPakistan ? 'With Driver' : 'With Chauffeur'} Both Available
                  </span>
                )}

                {car.fuelIncluded && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300">
                    <Fuel className="w-3.5 h-3.5 text-amber-600" />
                    Fuel Included Package {car.fuelKmAllowance ? `(${car.fuelKmAllowance})` : ''}
                  </span>
                )}
              </div>

              {/* All-Inclusive Fuel & Driver Package Highlight Box */}
              {car.fuelIncluded && (
                <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-800 flex items-center justify-center font-bold shrink-0">
                      <Fuel className="w-4 h-4 text-amber-700" />
                    </div>
                    <div>
                      <strong className="text-amber-950 font-bold block text-xs sm:text-sm">
                        All-Inclusive Fuel & Driver Package
                      </strong>
                      <span className="text-amber-800 text-[11px]">
                        {car.fuelKmAllowance
                          ? `Includes vehicle rent, driver service & fuel up to ${car.fuelKmAllowance}.`
                          : 'Includes vehicle rent, driver service & fuel package.'}{' '}
                        Extra kilometers billed separately at host rate.
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-200 text-amber-900 px-2 py-0.5 rounded-md border border-amber-300 shrink-0">
                    Package Included
                  </span>
                </div>
              )}

              {/* Tier Cards Grid - Responsive & Strictly Conditional */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                {/* Daily Plan (Always present) */}
                <div className="p-3.5 rounded-xl border-2 border-emerald-600/30 bg-emerald-50/40 flex flex-col justify-between gap-1 shadow-2xs">
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800">Daily Plan</span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="font-heading font-extrabold text-xl sm:text-2xl text-slate-900">
                        {formatPrice(withDriver ? car.dailyRateWithDriver : car.dailyRate)}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">/ day</span>
                    </div>
                  </div>
                  {car.mileageDaily ? (
                    <div className="text-[11px] font-semibold text-slate-600 flex items-center gap-1 pt-1.5 border-t border-emerald-200/60">
                      <Gauge className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>{car.mileageDaily}</span>
                    </div>
                  ) : car.fuelIncluded && car.fuelKmAllowance ? (
                    <div className="text-[11px] font-semibold text-amber-800 flex items-center gap-1 pt-1.5 border-t border-emerald-200/60">
                      <Fuel className="w-3 h-3 text-amber-600 shrink-0" />
                      <span>{car.fuelKmAllowance} (Fuel Included)</span>
                    </div>
                  ) : (
                    <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1 pt-1.5 border-t border-emerald-200/60">
                      <Gauge className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>Unlimited / Host Terms</span>
                    </div>
                  )}
                </div>

                {/* Weekly Plan (Only if provided by lister) */}
                {car.weeklyRate && car.weeklyRate > 0 ? (
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex flex-col justify-between gap-1 shadow-2xs">
                    <div>
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Weekly Plan</span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="font-heading font-extrabold text-xl sm:text-2xl text-slate-900">
                          {formatPrice(car.weeklyRate)}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">/ week</span>
                      </div>
                    </div>
                    {car.mileageWeekly && (
                      <div className="text-[11px] font-semibold text-slate-600 flex items-center gap-1 pt-1.5 border-t border-slate-100">
                        <Gauge className="w-3 h-3 text-slate-500 shrink-0" />
                        <span>{car.mileageWeekly}</span>
                      </div>
                    )}
                  </div>
                ) : null}

                {/* Monthly Plan (Only if provided by lister) */}
                {car.monthlyRate && car.monthlyRate > 0 ? (
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex flex-col justify-between gap-1 shadow-2xs">
                    <div>
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Monthly Plan</span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="font-heading font-extrabold text-xl sm:text-2xl text-slate-900">
                          {formatPrice(car.monthlyRate)}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">/ mo.</span>
                      </div>
                    </div>
                    {car.mileageMonthly && (
                      <div className="text-[11px] font-semibold text-slate-600 flex items-center gap-1 pt-1.5 border-t border-slate-100">
                        <Gauge className="w-3 h-3 text-slate-500 shrink-0" />
                        <span>{car.mileageMonthly}</span>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              {/* Pricing Sub-bar: Extra Km, Insurance, Deposit */}
              <div className="flex flex-wrap items-center gap-y-2 gap-x-4 pt-2 border-t border-slate-200/80 text-xs text-slate-600">
                {(car.extraKmRateNum || car.extraKmRate) && (
                  <span className="flex items-center gap-1">
                    <span className="text-slate-400">Additional mileage:</span>
                    <strong className="text-slate-800">
                      {car.extraKmRateNum ? `${formatPrice(car.extraKmRateNum)} / km` : car.extraKmRate}
                    </strong>
                  </span>
                )}
                {car.insuranceIncluded && (
                  <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{car.insuranceType || 'Comprehensive Insurance Included'}</span>
                  </span>
                )}
                {car.deposit !== undefined && car.deposit > 0 && (
                  <span className="flex items-center gap-1 text-slate-700">
                    <Shield className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      Refundable Deposit: <strong>{formatPrice(car.deposit)}</strong>
                    </span>
                  </span>
                )}
              </div>
            </div>

            {/* Quick Mobile Action Bar: Direct Jump to Booking & WhatsApp */}
            <div className="lg:hidden flex items-center gap-2 p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200 shadow-2xs">
              <button
                type="button"
                onClick={scrollToBooking}
                className="flex-1 h-11 px-4 bg-[#0B6B4F] hover:bg-[#08513C] text-white rounded-xl font-heading font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.99] cursor-pointer"
              >
                <CalendarCheck className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>Book Now & Check Dates</span>
              </button>
              <button
                type="button"
                onClick={handleInstantWhatsAppChat}
                className="h-11 px-3.5 bg-white hover:bg-slate-50 text-emerald-800 border border-emerald-300 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-[0.99] cursor-pointer shrink-0"
              >
                <WhatsAppIcon className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>WhatsApp</span>
              </button>
            </div>

            {/* 2. Car Overview / Technical Specifications Table (Mobile Accordion) */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden transition">
              <button
                type="button"
                onClick={() => setSpecsOpen((prev) => !prev)}
                className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left hover:bg-slate-50/80 transition cursor-pointer"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-heading font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                      <Car className="w-4 h-4 text-emerald-600" />
                      <span>Specifications & Overview</span>
                    </h2>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Key Highlights
                    </span>
                  </div>
                  {/* Summary preview pills visible when closed */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1.5 text-[11px] text-slate-600 font-medium">
                    {car.transmission && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/60">
                        {car.transmission}
                      </span>
                    )}
                    {car.fuelType && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/60">
                        {car.fuelType}
                      </span>
                    )}
                    {car.seats && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/60">
                        {car.seats} Seats
                      </span>
                    )}
                    {car.engineCapacity && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/60">
                        {car.engineCapacity}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 text-slate-400">
                  <span className="text-[11px] font-bold hidden sm:inline text-slate-500">
                    {specsOpen ? 'Collapse' : 'View all'}
                  </span>
                  <div className={`p-1.5 rounded-lg bg-slate-100 text-slate-600 transition-transform duration-200 ${specsOpen ? 'rotate-180' : ''}`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </button>

              {specsOpen && (
                <div className="p-4 sm:p-5 pt-0 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-2.5 animate-in fade-in">
                  {car.bodyType && (
                    <div className="p-3 border border-[#EEF0F2] rounded-xl flex items-center gap-2.5 bg-slate-50/50">
                      <Car className="w-4 h-4 text-emerald-700 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[11px] text-slate-500 block truncate">Body Type</span>
                        <span className="font-heading font-bold text-xs sm:text-sm text-slate-900 truncate block">
                          {car.bodyType}
                        </span>
                      </div>
                    </div>
                  )}

                  {car.transmission && (
                    <div className="p-3 border border-[#EEF0F2] rounded-xl flex items-center gap-2.5 bg-slate-50/50">
                      <Gauge className="w-4 h-4 text-emerald-700 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[11px] text-slate-500 block truncate">Transmission</span>
                        <span className="font-heading font-bold text-xs sm:text-sm text-slate-900 truncate block">
                          {car.transmission}
                        </span>
                      </div>
                    </div>
                  )}

                  {car.engineCapacity && (
                    <div className="p-3 border border-[#EEF0F2] rounded-xl flex items-center gap-2.5 bg-slate-50/50">
                      <Zap className="w-4 h-4 text-emerald-700 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[11px] text-slate-500 block truncate">Engine Capacity</span>
                        <span className="font-heading font-bold text-xs sm:text-sm text-slate-900 truncate block">
                          {car.engineCapacity}
                        </span>
                      </div>
                    </div>
                  )}

                  {car.horsepower && (
                    <div className="p-3 border border-[#EEF0F2] rounded-xl flex items-center gap-2.5 bg-slate-50/50">
                      <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[11px] text-slate-500 block truncate">Horsepower</span>
                        <span className="font-heading font-bold text-xs sm:text-sm text-slate-900 truncate block">
                          {car.horsepower}
                        </span>
                      </div>
                    </div>
                  )}

                  {car.seats !== undefined && car.seats > 0 && (
                    <div className="p-3 border border-[#EEF0F2] rounded-xl flex items-center gap-2.5 bg-slate-50/50">
                      <Users className="w-4 h-4 text-emerald-700 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[11px] text-slate-500 block truncate">Seating Capacity</span>
                        <span className="font-heading font-bold text-xs sm:text-sm text-slate-900 truncate block">
                          {car.seats} Passengers
                        </span>
                      </div>
                    </div>
                  )}

                  {car.doors !== undefined && car.doors > 0 && (
                    <div className="p-3 border border-[#EEF0F2] rounded-xl flex items-center gap-2.5 bg-slate-50/50">
                      <Layers className="w-4 h-4 text-emerald-700 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[11px] text-slate-500 block truncate">Doors</span>
                        <span className="font-heading font-bold text-xs sm:text-sm text-slate-900 truncate block">
                          {car.doors} Doors
                        </span>
                      </div>
                    </div>
                  )}

                  {car.bags && (
                    <div className="p-3 border border-[#EEF0F2] rounded-xl flex items-center gap-2.5 bg-slate-50/50">
                      <Briefcase className="w-4 h-4 text-emerald-700 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[11px] text-slate-500 block truncate">Luggage Capacity</span>
                        <span className="font-heading font-bold text-xs sm:text-sm text-slate-900 truncate block">
                          {car.bags}
                        </span>
                      </div>
                    </div>
                  )}

                  {car.minAge !== undefined && car.minAge > 0 && (
                    <div className="p-3 border border-[#EEF0F2] rounded-xl flex items-center gap-2.5 bg-slate-50/50">
                      <Award className="w-4 h-4 text-emerald-700 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[11px] text-slate-500 block truncate">Minimum Age</span>
                        <span className="font-heading font-bold text-xs sm:text-sm text-slate-900 truncate block">
                          {car.minAge} Years
                        </span>
                      </div>
                    </div>
                  )}

                  {car.fuelType && (
                    <div className="p-3 border border-[#EEF0F2] rounded-xl flex items-center gap-2.5 bg-slate-50/50">
                      <Fuel className="w-4 h-4 text-emerald-700 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[11px] text-slate-500 block truncate">Fuel Type</span>
                        <span className="font-heading font-bold text-xs sm:text-sm text-slate-900 truncate block">
                          {car.fuelType}
                        </span>
                      </div>
                    </div>
                  )}

                  {car.exteriorColor && (
                    <div className="p-3 border border-[#EEF0F2] rounded-xl flex items-center gap-2.5 bg-slate-50/50">
                      <Compass className="w-4 h-4 text-emerald-700 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[11px] text-slate-500 block truncate">Exterior Color</span>
                        <span className="font-heading font-bold text-xs sm:text-sm text-slate-900 truncate block">
                          {car.exteriorColor}
                        </span>
                      </div>
                    </div>
                  )}

                  {car.interiorColor && (
                    <div className="p-3 border border-[#EEF0F2] rounded-xl flex items-center gap-2.5 bg-slate-50/50">
                      <Layers className="w-4 h-4 text-emerald-700 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[11px] text-slate-500 block truncate">Interior Color</span>
                        <span className="font-heading font-bold text-xs sm:text-sm text-slate-900 truncate block">
                          {car.interiorColor}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 3. Features & Inclusions (Mobile Accordion) */}
            {(car.interiorFeatures?.length ||
              car.safetyFeatures?.length ||
              car.exteriorFeatures?.length ||
              car.comfortFeatures?.length ||
              car.infotainmentFeatures?.length ||
              car.features?.length) && (
              <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden transition">
                <button
                  type="button"
                  onClick={() => setFeaturesOpen((prev) => !prev)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left hover:bg-slate-50/80 transition cursor-pointer"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-heading font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        <span>Features & Equipment</span>
                      </h2>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200">
                        Verified Inclusions
                      </span>
                    </div>
                    {/* Summary preview of features */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1.5 text-[11px] text-slate-600">
                      {(car.features || ['Climate Control', 'Insurance Included', 'Sunroof']).slice(0, 3).map((f, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/60 truncate max-w-[140px]">
                          ✓ {f}
                        </span>
                      ))}
                      <span className="text-[10px] font-bold text-emerald-700">
                        + More
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 text-slate-400">
                    <span className="text-[11px] font-bold hidden sm:inline text-slate-500">
                      {featuresOpen ? 'Collapse' : 'View all'}
                    </span>
                    <div className={`p-1.5 rounded-lg bg-slate-100 text-slate-600 transition-transform duration-200 ${featuresOpen ? 'rotate-180' : ''}`}>
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </button>

                {featuresOpen && (
                  <div className="p-4 sm:p-5 pt-0 border-t border-slate-100 flex flex-col gap-3.5 animate-in fade-in">
                    {/* Interior Features */}
                    {car.interiorFeatures && car.interiorFeatures.length > 0 && (
                      <div className="p-4 rounded-xl border border-slate-200/90 bg-white shadow-2xs">
                        <h4 className="font-heading font-bold text-xs sm:text-sm text-emerald-800 mb-2.5">
                          Interior Features
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-slate-700">
                          {car.interiorFeatures.map((f, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 font-bold" />
                              <span>{f}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Safety & Driver Assistance */}
                    {car.safetyFeatures && car.safetyFeatures.length > 0 && (
                      <div className="p-4 rounded-xl border border-slate-200/90 bg-white shadow-2xs">
                        <h4 className="font-heading font-bold text-xs sm:text-sm text-emerald-800 mb-2.5">
                          Safety & Driver Assistance
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-slate-700">
                          {car.safetyFeatures.map((f, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 font-bold" />
                              <span>{f}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Exterior Features */}
                    {car.exteriorFeatures && car.exteriorFeatures.length > 0 && (
                      <div className="p-4 rounded-xl border border-slate-200/90 bg-white shadow-2xs">
                        <h4 className="font-heading font-bold text-xs sm:text-sm text-emerald-800 mb-2.5">
                          Exterior Features
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-slate-700">
                          {car.exteriorFeatures.map((f, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 font-bold" />
                              <span>{f}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Comfort & Convenience */}
                    {car.comfortFeatures && car.comfortFeatures.length > 0 && (
                      <div className="p-4 rounded-xl border border-slate-200/90 bg-white shadow-2xs">
                        <h4 className="font-heading font-bold text-xs sm:text-sm text-emerald-800 mb-2.5">
                          Comfort & Convenience
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-slate-700">
                          {car.comfortFeatures.map((f, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 font-bold" />
                              <span>{f}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Infotainment & Audio */}
                    {car.infotainmentFeatures && car.infotainmentFeatures.length > 0 && (
                      <div className="p-4 rounded-xl border border-slate-200/90 bg-white shadow-2xs">
                        <h4 className="font-heading font-bold text-xs sm:text-sm text-emerald-800 mb-2.5">
                          Infotainment & Audio
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-slate-700">
                          {car.infotainmentFeatures.map((f, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 font-bold" />
                              <span>{f}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Legacy Features Inclusions (if categorized arrays are absent) */}
                    {(!car.interiorFeatures || car.interiorFeatures.length === 0) &&
                      car.features &&
                      car.features.length > 0 && (
                        <div className="p-4 rounded-xl border border-slate-200/90 bg-white shadow-2xs">
                          <h4 className="font-heading font-bold text-xs sm:text-sm text-emerald-800 mb-2.5">
                            Inclusions & Features
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-slate-700">
                            {car.features.map((f, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 font-bold" />
                                <span>{f}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                )}
              </div>
            )}

            {/* 4. Host Profile Card */}
            <Link
              href={`/store/${getStoreSlugForOwner(car.hostName)}`}
              className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200 flex items-center gap-4 border border-slate-200 transition group cursor-pointer"
              title={`View ${car.hostName}'s Public Storefront`}
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-900 text-white flex items-center justify-center font-heading font-extrabold text-lg sm:text-xl shrink-0 group-hover:scale-105 transition shadow-sm">
                {car.hostName.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-heading font-extrabold text-sm sm:text-base text-[#101828] group-hover:text-emerald-700 transition truncate">
                    Hosted by {car.hostName}
                  </h3>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    Fleet Store ➔
                  </span>
                </div>
                <p className="text-xs text-[#475467] truncate mt-0.5">
                  SafarPK Certified Fleet Partner · {car.hostResponseTime || 'Replies quickly'}
                </p>
              </div>
              <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-white text-slate-700 text-xs font-bold border border-slate-200 shadow-2xs group-hover:border-slate-300">
                Certified Host
              </span>
            </Link>

            {/* SafarPK Certified Trust & Privacy Shield Card */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#0B6B4F] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-extrabold text-slate-900 block">SafarPK Certified Vehicle & Host</span>
                  <span className="text-[11px] text-slate-500 block">
                    Excise Smart Card & host identity certified on file. Full mutual credentials unlock upon booking confirmation.
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full shrink-0">
                🛡️ Privacy Shield
              </span>
            </div>

            {/* 5. About This Vehicle (Collapsible Accordion) */}
            {car.description && (
              <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden transition">
                <button
                  type="button"
                  onClick={() => setAboutOpen((prev) => !prev)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left hover:bg-slate-50/80 transition cursor-pointer"
                >
                  <div className="min-w-0 flex-1">
                    <h2 className="font-heading font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                      <Info className="w-4 h-4 text-emerald-600" />
                      <span>About this Vehicle & Host Notes</span>
                    </h2>
                    {!aboutOpen && (
                      <p className="text-xs text-slate-500 line-clamp-1 pt-1">
                        {car.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0 text-slate-400">
                    <span className="text-[11px] font-bold hidden sm:inline text-slate-500">
                      {aboutOpen ? 'Collapse' : 'Read'}
                    </span>
                    <div className={`p-1.5 rounded-lg bg-slate-100 text-slate-600 transition-transform duration-200 ${aboutOpen ? 'rotate-180' : ''}`}>
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </button>
                {aboutOpen && (
                  <div className="p-4 sm:p-5 pt-0 border-t border-slate-100 text-[#344054] text-xs sm:text-sm leading-relaxed animate-in fade-in">
                    {car.description}
                  </div>
                )}
              </div>
            )}

            {/* 6. Rental Guidelines & Document Requirements (Mobile Accordion) */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden transition">
              <button
                type="button"
                onClick={() => setPoliciesOpen((prev) => !prev)}
                className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left hover:bg-slate-50/80 transition cursor-pointer"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-heading font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Rental Requirements & Policies</span>
                    </h2>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                      Terms & Deposit
                    </span>
                  </div>
                  {/* Summary preview */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1.5 text-[11px] text-slate-600">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/60">
                      Original CNIC / ID
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/60">
                      Driving Licence
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/60">
                      Direct Host Handover
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 text-slate-400">
                  <span className="text-[11px] font-bold hidden sm:inline text-slate-500">
                    {policiesOpen ? 'Collapse' : 'View all'}
                  </span>
                  <div className={`p-1.5 rounded-lg bg-slate-100 text-slate-600 transition-transform duration-200 ${policiesOpen ? 'rotate-180' : ''}`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </button>

              {policiesOpen && (
                <div className="p-4 sm:p-5 pt-0 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-[#475467] leading-relaxed animate-in fade-in">
                  <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/60">
                    <strong className="block text-[#101828] font-bold mb-1 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-emerald-700" />
                      For Local Residents
                    </strong>
                    <span>Original Driving License and National ID (CNIC) must be presented upon vehicle handover.</span>
                  </div>
                  <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/60">
                    <strong className="block text-[#101828] font-bold mb-1 flex items-center gap-1.5">
                      <Compass className="w-4 h-4 text-emerald-700" />
                      For Tourists & Visitors
                    </strong>
                    <span>Valid Passport, Entry Visa, and Home Country / International Driving Permit (IDP) required.</span>
                  </div>
                  <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/60">
                    <strong className="block text-[#101828] font-bold mb-1 flex items-center gap-1.5">
                      <Fuel className="w-4 h-4 text-emerald-700" />
                      Fuel & Mileage Terms
                    </strong>
                    <span>Return vehicle with same fuel level. Mileage allowances apply as per chosen plan; additional km charged at standard host rate.</span>
                  </div>
                  <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/60">
                    <strong className="block text-[#101828] font-bold mb-1 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-700" />
                      Direct Payment & Deposit
                    </strong>
                    <span>Pay 100% rental directly to host. Security deposit settled at handover and refunded immediately upon safe return.</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Sleek, Minimalist Booking Card */}
          <aside id="booking-section" className="sticky top-24 border border-slate-200/90 rounded-3xl p-4 sm:p-6 bg-white shadow-lg flex flex-col gap-3.5 transition-all w-full max-w-full overflow-hidden scroll-mt-24">
            {/* Price & Status Row */}
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block">Daily Rate</span>
                <div className="flex items-baseline gap-1">
                  <span className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900">
                    {formatPrice(withDriver ? car.dailyRateWithDriver : car.dailyRate)}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">/ day</span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                Direct Host
              </span>
            </div>

            {/* Compact Dates Picker with Real Calendar Trigger & Past Dates Disabled */}
            <div className="p-1.5 sm:p-2 rounded-2xl bg-slate-50 border border-slate-200/80 grid grid-cols-[1fr_auto_1fr] items-center gap-1.5 w-full">
              <div
                onClick={() => {
                  try {
                    pickupInputRef.current?.showPicker();
                  } catch {
                    pickupInputRef.current?.focus();
                  }
                }}
                className="min-w-0 flex flex-col px-2.5 py-1.5 bg-white rounded-xl border border-slate-200/80 hover:border-emerald-500 cursor-pointer shadow-2xs transition group"
                title="Click to select Pick-up Date from calendar"
              >
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[9px] font-black tracking-wider uppercase group-hover:text-emerald-700 transition">Pick-up</span>
                  <Calendar className="w-3 h-3 text-slate-400 group-hover:text-emerald-600 transition shrink-0" />
                </div>
                <input
                  ref={pickupInputRef}
                  type="date"
                  min={todayStr}
                  value={pickupDate}
                  onClick={(e) => {
                    try {
                      e.currentTarget.showPicker();
                    } catch {}
                  }}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val) {
                      setPickupDate(val);
                      if (returnDate && val >= returnDate) {
                        const nextD = new Date(val + 'T00:00:00');
                        nextD.setDate(nextD.getDate() + 1);
                        setReturnDate(nextD.toISOString().split('T')[0]);
                      }
                    }
                  }}
                  className="w-full min-w-0 bg-transparent font-bold text-[11px] sm:text-xs text-slate-900 cursor-pointer outline-none mt-0.5 p-0 max-w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
                  aria-label="Pick-up Date"
                />
              </div>

              <div className="flex flex-col items-center justify-center shrink-0 px-0.5">
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-mono whitespace-nowrap">
                  {daysCount}d
                </span>
              </div>

              <div
                onClick={() => {
                  try {
                    returnInputRef.current?.showPicker();
                  } catch {
                    returnInputRef.current?.focus();
                  }
                }}
                className="min-w-0 flex flex-col px-2.5 py-1.5 bg-white rounded-xl border border-slate-200/80 hover:border-emerald-500 cursor-pointer shadow-2xs transition group"
                title="Click to select Return Date from calendar"
              >
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[9px] font-black tracking-wider uppercase group-hover:text-emerald-700 transition">Return</span>
                  <Calendar className="w-3 h-3 text-slate-400 group-hover:text-emerald-600 transition shrink-0" />
                </div>
                <input
                  ref={returnInputRef}
                  type="date"
                  min={pickupDate || todayStr}
                  value={returnDate}
                  onClick={(e) => {
                    try {
                      e.currentTarget.showPicker();
                    } catch {}
                  }}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val) setReturnDate(val);
                  }}
                  className="w-full min-w-0 bg-transparent font-bold text-[11px] sm:text-xs text-slate-900 cursor-pointer outline-none mt-0.5 p-0 max-w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
                  aria-label="Return Date"
                />
              </div>
            </div>

            {/* Driver Option / Service Scope Selection */}
            {car.serviceScope === 'WITH_DRIVER' ? (
              <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-200 text-xs text-blue-900 font-bold flex items-center justify-center gap-2">
                <Users className="w-4 h-4 text-blue-700 shrink-0" />
                <span>{isPakistan ? 'Professional Driver / Captain Included' : 'Professional Chauffeur Included'}</span>
              </div>
            ) : car.serviceScope === 'WITHOUT_DRIVER' ? (
              <div className="p-2.5 rounded-xl bg-purple-50/80 border border-purple-200 text-xs text-purple-900 font-bold flex items-center justify-center gap-2">
                <Key className="w-4 h-4 text-purple-700 shrink-0" />
                <span>Self-Drive Rental (Without Driver) Only</span>
              </div>
            ) : (
              <div
                role="radiogroup"
                aria-label="Driver option"
                className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl text-xs font-bold"
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={!withDriver}
                  onClick={() => setWithDriver(false)}
                  className={`h-8 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                    !withDriver ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <span>Self-drive</span>
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={withDriver}
                  onClick={() => setWithDriver(true)}
                  className={`h-8 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                    withDriver ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <span>{isPakistan ? 'With driver' : 'With chauffeur'}</span>
                  {car.dailyRateWithDriver > car.dailyRate && (
                    <span className="text-[10px] text-emerald-700 font-normal">
                      (+{formatPrice(car.dailyRateWithDriver - car.dailyRate)})
                    </span>
                  )}
                </button>
              </div>
            )}

            {/* Minimalist Price & Deposit Summary */}
            <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Estimated Total ({daysCount} days):</span>
              <span className="font-heading font-extrabold text-sm text-slate-900">{formatPrice(calculateTotal())}</span>
            </div>

            {/* Streamlined, Direct Actions (WhatsApp, Book Now & Direct Chat, Show Number) */}
            <div className="flex flex-col gap-2 pt-1">
              {/* Option 1: WhatsApp Instant Direct Chat */}
              <button
                type="button"
                onClick={handleInstantWhatsAppChat}
                className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-heading font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-sm hover:shadow active:scale-[0.99]"
              >
                <WhatsAppIcon className="w-4 h-4 text-white shrink-0" />
                <span>Chat on WhatsApp (Direct)</span>
              </button>

              {/* Option 2: Instant Booking & Direct Chat (Syncs to both Customer and Lister dashboards) */}
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full h-11 rounded-xl bg-[#101828] hover:bg-emerald-950 text-white font-heading font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-sm hover:shadow active:scale-[0.99]"
              >
                <CalendarCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Book Vehicle & Direct Chat</span>
              </button>

              {/* Option 3: Call Host / Show Number */}
              <button
                type="button"
                onClick={handleDirectHostCall}
                className="w-full h-10 rounded-xl border border-purple-200 bg-purple-50/70 hover:bg-purple-100 text-purple-900 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs active:scale-[0.99]"
                title={hostPhoneRevealed ? `Call host: ${car.hostPhone}` : 'Click to show phone number'}
              >
                <Phone className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span>{hostPhoneRevealed ? `Call Host: ${car.hostPhone}` : 'Show Phone Number'}</span>
              </button>
            </div>

            {/* Single Trust Badge Line */}
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 text-center pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Direct host booking · Settle payment & inspect vehicle at handover</span>
            </div>
          </aside>

          {/* Quick Booking Modal (Clean, Non-Intrusive Drawer / Dialog) */}
          {step === 1 && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
              <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-heading font-extrabold text-base text-slate-900">Instant Booking & Direct Chat</h3>
                    <p className="text-xs text-slate-500">
                      {car.title} · {withDriver ? 'With Chauffeur' : 'Self-Drive'} · {formatDisplayDate(pickupDate)} to {formatDisplayDate(returnDate)} ({daysCount}d)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(0)}
                    className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3 bg-emerald-50/80 rounded-2xl border border-emerald-200 text-xs text-emerald-950 flex items-center justify-between">
                  <div>
                    <span className="font-bold block">Estimated Total ({daysCount} days):</span>
                    <span className="text-[11px] text-emerald-800">Pay directly to host at vehicle handover</span>
                  </div>
                  <span className="font-heading font-extrabold text-base text-emerald-900">{formatPrice(calculateTotal())}</span>
                </div>

                <div className="flex flex-col gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-slate-700">Your Full Name *</span>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Asad Mehmood"
                      className="h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/50 font-medium text-xs sm:text-sm text-slate-900 outline-none focus:border-emerald-600 focus:bg-white"
                    />
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-slate-700">Contact / WhatsApp Phone Number *</span>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="+92 300 1234567"
                      className="h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/50 font-medium text-xs sm:text-sm text-slate-900 outline-none focus:border-emerald-600 focus:bg-white"
                    />
                  </label>

                  {/* Self-Drive Verification (Only if Self-Drive) */}
                  {!withDriver && (effectiveLicenceReq !== 'Off' || effectiveIdReq !== 'Off') && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>Self-Drive Requirement</span>
                      </div>

                      {/* Licence Upload / OCR */}
                      {effectiveLicenceReq !== 'Off' && (
                        <div className="space-y-1">
                          <span className="text-[11px] font-semibold text-slate-600">Driving Licence *</span>
                          {!licenceUploaded ? (
                            <button
                              type="button"
                              onClick={handleSimulatedLicenceUpload}
                              className="w-full py-2.5 px-3 border border-dashed border-emerald-300 rounded-xl bg-emerald-50/40 hover:bg-emerald-50 text-xs font-bold text-emerald-800 flex items-center justify-center gap-2 transition cursor-pointer"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>Upload Driving Licence Photo</span>
                            </button>
                          ) : (
                            <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                {ocrLicenceNumber} (Verified)
                              </span>
                              <button
                                type="button"
                                onClick={handleSimulatedLicenceUpload}
                                className="text-[11px] underline text-slate-600"
                              >
                                Change
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* CNIC Input */}
                      {effectiveIdReq !== 'Off' && (
                        <div className="space-y-1">
                          <span className="text-[11px] font-semibold text-slate-600">National ID / CNIC (13 digits)</span>
                          <input
                            type="text"
                            value={cnicNumber}
                            onChange={(e) => handleCnicChange(e.target.value)}
                            placeholder="35202-1234567-1"
                            className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-white font-mono text-xs text-slate-900 outline-none"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {validationError && (
                    <div className="p-2 rounded-lg bg-rose-50 text-rose-700 text-xs font-semibold flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{validationError}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleConfirmBookingAndChat(false)}
                    className="w-full h-11 rounded-xl bg-[#0B6B4F] hover:bg-[#08513C] text-white font-heading font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow active:scale-[0.99]"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Confirm Booking & Start Direct Chat</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleConfirmBookingAndChat(true)}
                    className="w-full h-10 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer active:scale-[0.99]"
                  >
                    <WhatsAppIcon className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>Confirm & Also Open on WhatsApp</span>
                  </button>

                  <p className="text-[11px] text-slate-400 text-center">
                    Saves to both Customer & Lister dashboards · Settle payment at vehicle handover
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Floating Sticky Booking Bar for Mobile */}
      <div className="lg:hidden fixed bottom-14 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2 flex items-center justify-between shadow-lg">
        <div className="min-w-0 pr-2">
          <div className="flex items-baseline gap-1">
            <span className="font-heading font-extrabold text-sm text-slate-900 truncate">
              {formatPrice(withDriver ? car.dailyRateWithDriver : car.dailyRate)}
            </span>
            <span className="text-[10px] text-slate-500">/day</span>
          </div>
          <span className="text-[10px] font-bold text-[#0B6B4F] block truncate">
            {daysCount}d · {formatPrice(calculateTotal())}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleDirectHostCall}
            className="w-9 h-9 rounded-xl border border-purple-200 bg-purple-50 text-purple-950 flex items-center justify-center shadow-2xs active:scale-95 transition"
            title={hostPhoneRevealed ? `Call host directly: ${car.hostPhone}` : 'Click to call host'}
          >
            <Phone className="w-4 h-4 text-purple-600" />
          </button>

          <button
            type="button"
            onClick={handleInstantWhatsAppChat}
            className="h-9 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-heading font-extrabold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition"
          >
            <WhatsAppIcon className="w-3.5 h-3.5 text-white shrink-0" />
            <span>WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={() => setStep(1)}
            className="h-9 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-heading font-extrabold text-xs flex items-center gap-1 shadow-sm active:scale-95 transition"
          >
            <CalendarCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Book</span>
          </button>
        </div>
      </div>

      <AppFooter />
      <MobileNavBar />
    </div>
  );
}

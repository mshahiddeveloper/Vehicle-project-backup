'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Car,
  Calendar,
  MessageCircle,
  PlusCircle,
  ShieldCheck,
  MapPin,
  Clock,
  ArrowRight,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Trash2,
  RefreshCw,
  Star,
  CreditCard,
  Building2,
  Users,
  Settings,
  DollarSign,
  FileText,
  Navigation,
  Search,
  Crosshair,
  X,
  Scan,
  Check,
  Edit3,
  Sparkles,
  BarChart2,
  TrendingUp,
  Eye,
  Download,
  Receipt,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { MobileNavBar } from '@/components/MobileNavBar';
import { MobilePullToRefresh } from '@/components/MobilePullToRefresh';
import { OfflineStatusBanner } from '@/components/OfflineStatusBanner';
import { API_BASE, formatPKR, maskCnic, maskLicense, maskPhone } from '@/lib/api';
import { isValidYouTubeUrl } from '@/lib/youtubeHelper';
import { SubscriptionPricingSection } from '@/components/SubscriptionPricingSection';
import { BillingHistoryManager } from '@/components/BillingHistoryManager';
import { getActiveUser, RegisteredUser, getUserDashboardPath, syncSubscriptionExpiries } from '@/data/userAuth';
import { DashboardStoreWidget } from '@/components/DashboardStoreWidget';
import { AnalyticsReportHub } from '@/components/AnalyticsReportHub';
import { useCountry } from '@/app/context/CountryContext';
import {
  isDocActiveForRole,
  isDocMandatoryForRole,
} from '@/data/docRules';
import {
  CityRideItem,
  getCustomCityRides,
  saveCustomCityRide,
  deleteCustomCityRide,
} from '@/data/marketplaceData';

const STANDARD_CAR_BRANDS = [
  'Suzuki',
  'Toyota',
  'Honda',
  'Hyundai',
  'KIA',
  'Changan',
  'MG',
  'Haval',
  'Nissan',
  'Daihatsu',
  'Audi',
  'BMW',
  'Mercedes-Benz',
  'Chery',
  'Proton',
  'Peugeot',
  'DFSK',
  'FAW',
  'Isuzu',
  'Mitsubishi',
  'Lexus',
  'Land Rover',
  'Porsche',
  'Tesla',
];

const POPULAR_CAR_SUGGESTIONS = [
  'Toyota Corolla',
  'Honda Civic',
  'Toyota Hiace',
  'Suzuki APV',
  'Toyota Prado',
  'Toyota Land Cruiser V8',
  'Suzuki Alto',
  'Suzuki Cultus',
  'Hyundai Tucson',
  'KIA Sportage',
  'Changan Alsvin',
  'Suzuki WagonR',
];

const AVAILABLE_SERVICE_TAGS = [
  'With Driver',
  'Self-Drive',
  'Wedding',
  'Airport Pickup',
  'Tourist Tours',
  'Corporate Monthly',
  'Luxury',
];

export default function ListerDashboardPage() {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'fleet' | 'intercity' | 'analytics' | 'add_vehicle' | 'requests' | 'availability' | 'reviews' | 'subscription' | 'profile' | 'team' | 'settings'
  >('overview');

  const { country } = useCountry();
  const isPakistan = !country || country.code === 'PK';

  // Intercity City-to-City Lister State
  const [listerIntercityRides, setListerIntercityRides] = useState<CityRideItem[]>([]);
  const [showAddIntercityModal, setShowAddIntercityModal] = useState(false);
  const [newC2cFrom, setNewC2cFrom] = useState('Karachi');
  const [newC2cTo, setNewC2cTo] = useState('Hyderabad');
  const [newC2cDate, setNewC2cDate] = useState('Daily Departure');
  const [newC2cTime, setNewC2cTime] = useState('08:30 AM');
  const [newC2cRideType, setNewC2cRideType] = useState<'SEAT_SHARING' | 'FULL_CAR' | 'BOTH'>('BOTH');
  const [newC2cCar, setNewC2cCar] = useState('Toyota Corolla Altis · AC');
  const [newC2cPricePerSeat, setNewC2cPricePerSeat] = useState<number>(1500);
  const [newC2cAvailableSeats, setNewC2cAvailableSeats] = useState<number>(3);
  const [newC2cFullCarOne, setNewC2cFullCarOne] = useState<number>(8500);
  const [newC2cFullCarRet, setNewC2cFullCarRet] = useState<number>(15000);
  const [newC2cPickup, setNewC2cPickup] = useState('Sohrab Goth / M-9 Toll Plaza');
  const [newC2cDrop, setNewC2cDrop] = useState('Qasim Chowk / Autobahn, Hyderabad');
  const [newC2cBag, setNewC2cBag] = useState('1 bag per passenger');

  useEffect(() => {
    setListerIntercityRides(getCustomCityRides());
    const handleC2cUpdate = () => {
      setListerIntercityRides(getCustomCityRides());
    };
    window.addEventListener('safarpk_city_rides_updated', handleC2cUpdate);
    return () => window.removeEventListener('safarpk_city_rides_updated', handleC2cUpdate);
  }, []);

  const handlePublishIntercityRide = (e: React.FormEvent) => {
    e.preventDefault();
    const newRide: CityRideItem = {
      id: `c2c-lister-${Date.now()}`,
      op: businessName || listerName || 'Verified Fleet Partner',
      car: newC2cCar,
      fromCity: newC2cFrom,
      toCity: newC2cTo,
      bag: newC2cBag,
      time: newC2cTime,
      duration: 'Direct Highway / Motorway',
      one: Number(newC2cFullCarOne) || 8000,
      ret: Number(newC2cFullCarRet) || 15000,
      ver: true,
      tags: [
        newC2cRideType === 'SEAT_SHARING' ? `${newC2cAvailableSeats} Seat Available` : 'Full Private Car',
        'Direct Motorway',
        'AC Chilled',
      ],
      category: newC2cRideType === 'SEAT_SHARING' ? 'Seat Sharing (Carpool)' : 'Private Car (Full Vehicle)',
      phone: listerPhone || '+92 300 1234567',
      whatsapp: listerWhatsApp || listerPhone || '923001234567',
      rideType: newC2cRideType,
      availableSeats: Number(newC2cAvailableSeats) || 1,
      totalSeats: 4,
      pricePerSeat: Number(newC2cPricePerSeat) || 1500,
      departureDate: newC2cDate,
      departureTime: newC2cTime,
      pickupPoint: newC2cPickup,
      dropPoint: newC2cDrop,
      rating: 4.8,
    };
    saveCustomCityRide(newRide);
    setShowAddIntercityModal(false);
  };

  // Handle URL query parameters (?tab=add_vehicle&step=1)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (
        tabParam &&
        [
          'overview',
          'fleet',
          'intercity',
          'analytics',
          'add_vehicle',
          'requests',
          'availability',
          'reviews',
          'subscription',
          'profile',
          'team',
          'settings',
        ].includes(tabParam)
      ) {
        setActiveTab(tabParam as any);
      }
      const stepParam = params.get('step');
      if (stepParam) {
        setWizardStep(Number(stepParam) || 1);
      }
    }
  }, []);

  // Lister Data State (Step 1: Your Business)
  const [currentUser, setCurrentUser] = useState<RegisteredUser | null>(null);
  const [showSubscriptionRequiredModal, setShowSubscriptionRequiredModal] = useState(false);
  const [businessName, setBusinessName] = useState('Salman Rent a Car & Tours');
  const [operatingCity, setOperatingCity] = useState('Islamabad');

  // Sync with active authenticated registered user & enforce Lister role guard
  useEffect(() => {
    syncSubscriptionExpiries();
    const user = getActiveUser();
    if (!user) {
      if (typeof window !== 'undefined') {
        window.location.replace('/login?redirect=/lister');
      }
      return;
    }
    if (user.role !== 'LISTER' && (user.role as string) !== 'OWNER') {
      if (typeof window !== 'undefined') {
        window.location.replace(getUserDashboardPath(user));
      }
      return;
    }

    setCurrentUser(user);
    if (user.businessName) setBusinessName(user.businessName);
    else if (user.name) setBusinessName(`${user.name} Fleet`);
    if (user.city) setOperatingCity(user.city);
    if (user.phone) {
      setListerPhone(user.phone);
      setListerWhatsApp(user.phone);
    }
    if (user.name) setListerName(user.name);

    // Load user's personal fleet, driver team & bookings if registered non-demo
    if (user.id !== 'usr-demo-lister') {
      try {
        const userFleet = localStorage.getItem(`safarpk_fleet_${user.id}`);
        setFleetList(userFleet ? JSON.parse(userFleet) : []);
      } catch (e) {
        setFleetList([]);
      }
      try {
        const userDrivers = localStorage.getItem(`safarpk_lister_drivers_${user.id}`);
        setListerDriverTeam(userDrivers ? JSON.parse(userDrivers) : []);
      } catch (e) {
        setListerDriverTeam([]);
      }
      try {
        const userRequests = localStorage.getItem(`safarpk_lister_bookings_${user.id}`);
        setIncomingRequests(userRequests ? JSON.parse(userRequests) : []);
      } catch (e) {
        setIncomingRequests([]);
      }
    }
  }, []);
  const [operatingArea, setOperatingArea] = useState('F-10 Markaz');
  const [listerAddress, setListerAddress] = useState('Plaza 14, Main Road, F-10 Markaz');
  const [listerWebsite, setListerWebsite] = useState('https://salmanrentacar.pk');
  const [listerGoogleMaps, setListerGoogleMaps] = useState('https://maps.google.com/?q=Islamabad+F10');
  const [fleetSize, setFleetSize] = useState('3-5 Cars');

  // Claim Listing Mock Database (Matching Reference Screenshots)
  const [claimSearchQuery, setClaimSearchQuery] = useState('');
  const [showClaimDropdown, setShowClaimDropdown] = useState(false);
  const CLAIMABLE_BUSINESSES = [
    {
      companyName: 'Summers Puckett Inc',
      city: 'Islamabad',
      area: 'Eaque odit in except',
      address: 'Lorem maxime deserun',
      website: 'https://www.qijuwuvafaleb.com',
      googleMaps: 'https://maps.google.com/?q=Islamabad+Centaurus',
      name: 'Naida Rasmussen',
      whatsapp: '+92 19 41283690',
      phone: '+92 16 61378870',
      fleetCount: '6-10 Cars',
      bio: 'Leading corporate and executive car rental in Islamabad with modern fleet and vetted chauffeurs.',
    },
    {
      companyName: 'Salman Rent a Car & Tours',
      city: 'Islamabad',
      area: 'F-10 Markaz',
      address: 'Plaza 14, Main Road, F-10 Markaz',
      website: 'https://salmanrentacar.pk',
      googleMaps: 'https://maps.google.com/?q=Islamabad+F10',
      name: 'Muhammad Salman',
      whatsapp: '+92 300 1234567',
      phone: '+92 312 9876543',
      fleetCount: '3-5 Cars',
      bio: 'Reliable, clean, and inspected fleet in Islamabad & Rawalpindi. On-time doorstep delivery with Chilled AC and 24/7 road assistance.',
    },
    {
      companyName: 'Royal Wheels Rent a Car',
      city: 'Lahore',
      area: 'DHA Phase 5',
      address: 'Shop 22, Commercial Broadway, DHA Phase 5',
      website: 'https://royalwheels.pk',
      googleMaps: 'https://maps.google.com/?q=Lahore+DHA5',
      name: 'Chaudhry Kamran',
      whatsapp: '+92 321 8472910',
      phone: '+92 301 5544332',
      fleetCount: '10+ Cars',
      bio: 'Luxury Prado, Land Cruiser, and Civic rentals for weddings, executive delegations, and outstation trips.',
    },
  ];

  const handleClaimListing = (biz: any) => {
    setBusinessName(biz.companyName);
    setOperatingCity(biz.city);
    setOperatingArea(biz.area);
    setListerAddress(biz.address);
    setListerWebsite(biz.website);
    setListerGoogleMaps(biz.googleMaps);
    setConfirmedMapLocation(`${biz.area}, ${biz.city}`);
    setListerName(biz.name);
    setListerWhatsApp(biz.whatsapp);
    setListerSecondaryPhone(biz.phone);
    setFleetSize(biz.fleetCount);
    setListerBio(biz.bio);
    setClaimSearchQuery('');
    setShowClaimDropdown(false);
    setWizardSuccessMsg(`✓ Claimed "${biz.companyName}" listing! Profile data auto-populated.`);
    setTimeout(() => setWizardSuccessMsg(null), 3000);
  };

  // 3-Step Lister Ad Posting State (Matching Reference Screenshots & Prompt)
  // Step 1: Car Details
  const [carBrand, setCarBrand] = useState('Suzuki');
  const [isCustomBrand, setIsCustomBrand] = useState(false);
  const [showDetailedSpecs, setShowDetailedSpecs] = useState(false);
  const [customFeatureInput, setCustomFeatureInput] = useState('');
  const [showCustomFeatureInput, setShowCustomFeatureInput] = useState(false);
  const [customFeaturesList, setCustomFeaturesList] = useState<string[]>([]);
  const [carModel, setCarModel] = useState('Alto VXR');
  const [carYear, setCarYear] = useState('2024');
  const [carRentPerDay, setCarRentPerDay] = useState('4500');
  const [carDescription, setCarDescription] = useState(
    'Clean interior, chilled AC & heater, family driven, fuel efficient. Available for rental in Islamabad & Rawalpindi with or without driver.'
  );
  const [carDriver, setCarDriver] = useState<'WITH_DRIVER' | 'WITHOUT_DRIVER' | 'BOTH'>('BOTH');
  const [carTransmission, setCarTransmission] = useState<'AUTOMATIC' | 'MANUAL'>('MANUAL');
  const [carAcHeater, setCarAcHeater] = useState<'AC_HEATER' | 'NONE'>('AC_HEATER');
  const [carSeats, setCarSeats] = useState<number>(4);

  // Detailed Specifications & Pricing (OneClickDrive grade, optional)
  const [carWeeklyRent, setCarWeeklyRent] = useState('');
  const [carMonthlyRent, setCarMonthlyRent] = useState('');
  const [carBodyType, setCarBodyType] = useState('Hatchback');
  const [carEngineCapacity, setCarEngineCapacity] = useState('660cc');
  const [carHorsepower, setCarHorsepower] = useState('');
  const [carDoors, setCarDoors] = useState<number>(4);
  const [carBags, setCarBags] = useState('2 large bags');
  const [carMinAge, setCarMinAge] = useState('21');
  const [carDeposit, setCarDeposit] = useState('');
  const [carMileageDaily, setCarMileageDaily] = useState('');
  const [carMileageWeekly, setCarMileageWeekly] = useState('');
  const [carMileageMonthly, setCarMileageMonthly] = useState('');
  const [carExtraKmRate, setCarExtraKmRate] = useState('');
  const [carServiceScope, setCarServiceScope] = useState<'BOTH' | 'WITH_DRIVER' | 'WITHOUT_DRIVER'>('BOTH');
  const [carFuelIncluded, setCarFuelIncluded] = useState(false);
  const [carFuelKmAllowance, setCarFuelKmAllowance] = useState('');
  const [carExteriorColor, setCarExteriorColor] = useState('White');
  const [carInteriorColor, setCarInteriorColor] = useState('Grey Fabric');

  // Categorized Features
  const [selectedInteriorFeatures, setSelectedInteriorFeatures] = useState<string[]>([
    'Air Conditioning & Heating',
  ]);
  const [selectedSafetyFeatures, setSelectedSafetyFeatures] = useState<string[]>([
    'ABS with EBD',
    'Dual Front Airbags',
  ]);
  const [selectedExteriorFeatures, setSelectedExteriorFeatures] = useState<string[]>([
    'Factory Alloy Wheels',
  ]);
  const [selectedComfortFeatures, setSelectedComfortFeatures] = useState<string[]>([
    'Keyless Entry',
  ]);
  const [selectedInfotainmentFeatures, setSelectedInfotainmentFeatures] = useState<string[]>([
    'Bluetooth Audio & Calling',
  ]);

  // Step 2: Upload Photos (6 Photo Slots) & Optional YouTube Video Link
  const [carYoutubeUrl, setCarYoutubeUrl] = useState('');
  const [carPhotoSlots, setCarPhotoSlots] = useState<
    Array<{ id: number; label: string; file: File | null; url: string | null }>
  >([
    {
      id: 1,
      label: 'Front View',
      file: null,
      url: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 2,
      label: 'Rear Angle',
      file: null,
      url: 'https://images.unsplash.com/photo-1590362891988-f77804703088?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 3,
      label: 'Dashboard / Interior',
      file: null,
      url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop&q=80',
    },
    { id: 4, label: 'Passenger Seats', file: null, url: null },
    { id: 5, label: 'Trunk / Boot Space', file: null, url: null },
    { id: 6, label: 'Side Profile', file: null, url: null },
  ]);

  // Step 3: Personal Info (Matching Reference Image 1)
  const [personalFullName, setPersonalFullName] = useState('Muhammad Salman');
  const [personalPrimaryNumber, setPersonalPrimaryNumber] = useState('03102355671');
  const [personalSecondaryNumber, setPersonalSecondaryNumber] = useState('03219876543');
  const [shopName, setShopName] = useState('Salman Rent a Car & Tours');
  const [personalCity, setPersonalCity] = useState('Islamabad');
  const [personalSearchLocation, setPersonalSearchLocation] = useState('Centaurus Mall, F-8, Islamabad');
  const [showGeoBanner, setShowGeoBanner] = useState(true);
  const [listerAvailableCities, setListerAvailableCities] = useState<string[]>([
    'Islamabad',
    'Rawalpindi',
    'Lahore',
    'Karachi',
    'Peshawar',
    'Multan',
    'Faisalabad',
    'Quetta',
    'Gujranwala',
    'Sialkot',
    'Abbottabad',
  ]);
  const [showCustomCityLister, setShowCustomCityLister] = useState(false);
  const [customCityListerInput, setCustomCityListerInput] = useState('');

  // Legacy Contact Info Sync
  const [listerName, setListerName] = useState('Muhammad Salman');
  const [listerPhone, setListerPhone] = useState('+92 300 1234567');
  const [listerWhatsApp, setListerWhatsApp] = useState('03102355671');
  const [listerSecondaryPhone, setListerSecondaryPhone] = useState('03219876543');

  // Step 3: Cars & Services
  const [selectedOfferTags, setSelectedOfferTags] = useState<string[]>([
    'With Driver',
    'Self-Drive',
    'Airport Pickup',
    'Wedding',
  ]);
  const [multiCars, setMultiCars] = useState<
    Array<{
      id: number;
      model: string;
      dailyRate: string;
      driverMode: 'WITH_DRIVER' | 'WITHOUT_DRIVER' | 'BOTH';
    }>
  >([
    { id: 1, model: 'Toyota Corolla Altis Grande', dailyRate: '8500', driverMode: 'BOTH' },
    { id: 2, model: 'Honda Civic Oriel Turbo', dailyRate: '14000', driverMode: 'BOTH' },
  ]);
  const [vehicleTransmission, setVehicleTransmission] = useState<'AUTOMATIC' | 'MANUAL'>('AUTOMATIC');
  const [vehicleAcMode, setVehicleAcMode] = useState<'AC_HEATER' | 'NONE'>('AC_HEATER');
  const [vehicleSeats, setVehicleSeats] = useState<number>(5);
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState<number | null>(null);

  // Step 4: Legal & Security OCR
  const [ownerCnic, setOwnerCnic] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [cnicDocPreview, setCnicDocPreview] = useState<string | null>(null);
  const [cnicFileName, setCnicFileName] = useState<string | null>(null);
  const [cnicScanState, setCnicScanState] = useState<'IDLE' | 'SCANNING' | 'SCANNED'>('IDLE');

  const [regNumber, setRegNumber] = useState('');
  const [engineNumber, setEngineNumber] = useState('');
  const [chassisNumber, setChassisNumber] = useState('');
  const [smartCardDocPreview, setSmartCardDocPreview] = useState<string | null>(null);
  const [smartCardFileName, setSmartCardFileName] = useState<string | null>(null);
  const [smartCardScanState, setSmartCardScanState] = useState<'IDLE' | 'SCANNING' | 'SCANNED'>('IDLE');

  const [poaDocPreview, setPoaDocPreview] = useState<string | null>(null);
  const [poaFileName, setPoaFileName] = useState<string | null>(null);
  const [ownershipType, setOwnershipType] = useState<'REGISTERED_OWNER' | 'AUTHORIZED_REPRESENTATIVE'>('REGISTERED_OWNER');
  const [termsAgreed, setTermsAgreed] = useState(false);

  // Step 5: About & Logo & Photos
  const [listerBio, setListerBio] = useState(
    'Reliable, clean, and inspected fleet in Islamabad & Rawalpindi. On-time doorstep delivery with Chilled AC and 24/7 road assistance.'
  );
  const [listerLogoName, setListerLogoName] = useState<string | null>('salman_rentals_logo.png');
  const [uploadedPhotos, setUploadedPhotos] = useState<any[]>([
    { id: 1, label: 'Front Exterior', url: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=600&auto=format&fit=crop&q=80' },
    { id: 2, label: 'Rear Exterior', url: 'https://images.unsplash.com/photo-1590362891988-f77804703088?w=600&auto=format&fit=crop&q=80' },
    { id: 3, label: 'Interior Cockpit', url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop&q=80' },
  ]);

  // Wizard Navigation
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardSubmitting, setWizardSubmitting] = useState(false);
  const [wizardSuccessMsg, setWizardSuccessMsg] = useState<string | null>(null);

  // Interactive Free Map Picker Modal State
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapSearchTerm, setMapSearchTerm] = useState('Centaurus Mall, Islamabad');
  const [confirmedMapLocation, setConfirmedMapLocation] = useState('Centaurus Mall, F-8, Islamabad');
  const [isLocating, setIsLocating] = useState(false);

  // EDIT VEHICLE STATE & HANDLERS (FULL CRUD)
  const [editingVehicle, setEditingVehicle] = useState<any | null>(null);

  const handleOpenEditVehicle = (vehicle: any) => {
    setEditingVehicle({ ...vehicle });
  };

  const handleSaveVehicleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVehicle) return;
    setFleetList(
      fleetList.map((f) => (f.id === editingVehicle.id ? { ...editingVehicle } : f))
    );
    setEditingVehicle(null);
    setWizardSuccessMsg('✅ Vehicle specifications, rental rates & chauffeur allotment updated live!');
    setTimeout(() => setWizardSuccessMsg(null), 3500);
  };

  // Existing Fleet
  const [fleetList, setFleetList] = useState<any[]>([
    {
      id: 'f-1',
      title: 'Toyota Corolla Altis Grande 2024',
      reg: 'LEA-24-9988',
      city: 'Islamabad',
      dailyRate: 8500,
      withDriverRate: 11000,
      assignedDriver: 'Tariq Mahmood',
      bookingRequirement: 'REQUIRED_DETAILS',
      status: 'LIVE',
      views: 342,
      leads: 28,
      img: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 'f-2',
      title: 'Honda Civic Oriel Turbo 2024',
      reg: 'ISB-24-4412',
      city: 'Islamabad',
      dailyRate: 14000,
      withDriverRate: 17000,
      assignedDriver: 'Muhammad Akram',
      bookingRequirement: 'REQUIRED_DETAILS',
      status: 'LIVE',
      views: 512,
      leads: 45,
      img: 'https://images.unsplash.com/photo-1590362891988-f77804703088?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 'f-3',
      title: 'Toyota Prado TX 2.8D 2023',
      reg: 'ISB-PR-770',
      city: 'Islamabad',
      dailyRate: 35000,
      withDriverRate: 40000,
      assignedDriver: 'Sheraz Ali',
      bookingRequirement: 'REQUIRED_DETAILS',
      status: 'LIVE',
      views: 780,
      leads: 62,
      img: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop&q=80',
    },
  ]);

  // Lister Employed Driver / Chauffeur Team
  const [listerDriverTeam, setListerDriverTeam] = useState<any[]>([
    {
      id: 'ldrv-1',
      name: 'Muhammad Akram',
      phone: '+92 301 8472910',
      cnic: '35201-9921045-3',
      licenseCategory: 'HTV Commercial Chauffeur',
      assignedVehicleTitle: 'Honda Civic Oriel Turbo 2024 (ISB-24-4412)',
      status: 'AVAILABLE',
      rating: 4.9,
      tripsCompleted: 48,
    },
    {
      id: 'ldrv-2',
      name: 'Tariq Mahmood',
      phone: '+92 301 9821045',
      cnic: '35202-4412098-1',
      licenseCategory: 'VIP Chauffeur Special',
      assignedVehicleTitle: 'Toyota Corolla Altis Grande 2024 (LEA-24-9988)',
      status: 'ON_DUTY',
      rating: 5.0,
      tripsCompleted: 76,
    },
    {
      id: 'ldrv-3',
      name: 'Sheraz Ali',
      phone: '+92 321 8812049',
      cnic: '35201-1120498-7',
      licenseCategory: 'Luxury SUV Specialist',
      assignedVehicleTitle: 'Toyota Prado TX 2.8D 2023 (ISB-PR-770)',
      status: 'AVAILABLE',
      rating: 4.8,
      tripsCompleted: 34,
    },
  ]);

  const [showAddListerDriverModal, setShowAddListerDriverModal] = useState(false);
  const [newListerDriverName, setNewListerDriverName] = useState('');
  const [newListerDriverPhone, setNewListerDriverPhone] = useState('');
  const [newListerDriverCnic, setNewListerDriverCnic] = useState('');
  const [newListerDriverLicense, setNewListerDriverLicense] = useState('HTV Commercial Chauffeur');
  const [newListerDriverAssignVehicle, setNewListerDriverAssignVehicle] = useState('Toyota Corolla Altis Grande 2024 (LEA-24-9988)');

  // Add Driver to Lister Fleet Handler
  const handleAddListerDriverSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListerDriverName || !newListerDriverPhone) return;

    const newDrv = {
      id: `ldrv-${Date.now()}`,
      name: newListerDriverName,
      phone: newListerDriverPhone,
      cnic: newListerDriverCnic || '35201-XXXXXXX-X',
      licenseCategory: newListerDriverLicense,
      assignedVehicleTitle: newListerDriverAssignVehicle,
      status: 'AVAILABLE',
      rating: 5.0,
      tripsCompleted: 0,
    };

    setListerDriverTeam([...listerDriverTeam, newDrv]);

    // Update fleet vehicle assigned driver as well
    setFleetList(
      fleetList.map((f) =>
        newListerDriverAssignVehicle.includes(f.reg) || newListerDriverAssignVehicle.includes(f.title)
          ? { ...f, assignedDriver: newListerDriverName }
          : f
      )
    );

    setShowAddListerDriverModal(false);
    setNewListerDriverName('');
    setNewListerDriverPhone('');
    setNewListerDriverCnic('');
  };

  // Incoming Booking Requests
  const [incomingRequests, setIncomingRequests] = useState<any[]>([
    {
      id: 'req-1',
      bookingRef: 'BKG-8492',
      vehicleName: 'Toyota Corolla Altis Grande 2024',
      customerName: 'Hamza Tariq',
      customerPhone: '+92 300 8472910',
      customerCnic: '35202-8172910-3',
      customerLicense: 'LHR-DL-449102',
      licenseExpiry: '2028-11-20',
      startDate: '2026-11-12',
      endDate: '2026-11-15',
      totalAmount: 25500,
      withDriver: false,
      pickupArea: 'DHA Phase 5, Lahore',
      assignedDriver: 'Self-Drive (Customer Driving)',
      status: 'CONFIRMED',
      customerVerified: true,
    },
    {
      id: 'req-2',
      bookingRef: 'BKG-4412',
      vehicleName: 'Honda Civic Oriel Turbo 2024',
      customerName: 'Ayesha Malik',
      customerPhone: '+92 321 9988771',
      customerCnic: '35201-8849201-4',
      customerLicense: 'N/A (Driver Service Requested)',
      licenseExpiry: '',
      startDate: '2026-11-20',
      endDate: '2026-11-22',
      totalAmount: 34000,
      withDriver: true,
      pickupArea: 'Centaurus Mall, F-8, Islamabad',
      assignedDriver: 'Muhammad Akram',
      driverPhone: '+92 301 8472910',
      status: 'CONFIRMED',
      customerVerified: true,
    },
  ]);

  const [selectedCustomerVaultModal, setSelectedCustomerVaultModal] = useState<any | null>(null);

  // Load newly submitted bookings from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('safarpk_lister_bookings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setIncomingRequests((prev) => {
            const ids = new Set(parsed.map((p: any) => p.bookingRef));
            const filteredPrev = prev.filter((p) => !ids.has(p.bookingRef));
            return [...parsed, ...filteredPrev];
          });
        }
      }
    } catch (e) {}
  }, []);

  // Seating calculator helper
  const getSuggestedSeats = (modelName: string): number => {
    const combined = modelName.toLowerCase();
    if (combined.includes('hiace') || combined.includes('coaster') || combined.includes('cabin')) return 13;
    if (combined.includes('apv') || combined.includes('bolan')) return 9;
    if (combined.includes('prado') || combined.includes('fortuner') || combined.includes('br-v') || combined.includes('v8')) return 7;
    if (combined.includes('alto') || combined.includes('cultus') || combined.includes('mira')) return 4;
    return 5;
  };

  // Toggle Service Tag
  const handleToggleTag = (tag: string) => {
    if (selectedOfferTags.includes(tag)) {
      setSelectedOfferTags(selectedOfferTags.filter((t) => t !== tag));
    } else {
      setSelectedOfferTags([...selectedOfferTags, tag]);
    }
  };

  // Multi-car Handlers
  const handleAddCarRow = () => {
    setMultiCars([
      ...multiCars,
      {
        id: Date.now(),
        model: 'Toyota Corolla',
        dailyRate: '8000',
        driverMode: 'BOTH',
      },
    ]);
  };

  const handleUpdateCarRow = (id: number, field: string, val: any) => {
    setMultiCars(
      multiCars.map((c) => {
        if (c.id === id) {
          const updated = { ...c, [field]: val };
          if (field === 'model') {
            setVehicleSeats(getSuggestedSeats(val));
          }
          return updated;
        }
        return c;
      })
    );
  };

  const handleRemoveCarRow = (id: number) => {
    if (multiCars.length <= 1) return;
    setMultiCars(multiCars.filter((c) => c.id !== id));
  };

  // 3-Step Photo Upload Handlers
  const handlePhotoUpload = (slotIdx: number, file: File) => {
    const url = URL.createObjectURL(file);
    const updated = [...carPhotoSlots];
    updated[slotIdx] = { ...updated[slotIdx], file, url };
    setCarPhotoSlots(updated);
  };

  const handleRemovePhoto = (slotIdx: number) => {
    const updated = [...carPhotoSlots];
    updated[slotIdx] = { ...updated[slotIdx], file: null, url: null };
    setCarPhotoSlots(updated);
  };

  const handleFillDemoPhotos = () => {
    setCarPhotoSlots([
      {
        id: 1,
        label: 'Front View',
        file: null,
        url: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=600&auto=format&fit=crop&q=80',
      },
      {
        id: 2,
        label: 'Rear Angle',
        file: null,
        url: 'https://images.unsplash.com/photo-1590362891988-f77804703088?w=600&auto=format&fit=crop&q=80',
      },
      {
        id: 3,
        label: 'Dashboard / Interior',
        file: null,
        url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop&q=80',
      },
      {
        id: 4,
        label: 'Passenger Seats',
        file: null,
        url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&auto=format&fit=crop&q=80',
      },
      {
        id: 5,
        label: 'Trunk / Boot Space',
        file: null,
        url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600&auto=format&fit=crop&q=80',
      },
      {
        id: 6,
        label: 'Side Profile',
        file: null,
        url: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=600&auto=format&fit=crop&q=80',
      },
    ]);
  };

  // Geolocation Trigger
  const handleUseCurrentLocation = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsLocating(false);
          const locStr = `${personalCity || operatingCity} (GPS: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`;
          setMapSearchTerm(locStr);
        },
        () => {
          setIsLocating(false);
          setMapSearchTerm(`${personalCity || operatingCity} Central Area, Pakistan`);
        }
      );
    } else {
      setIsLocating(false);
    }
  };

  // Confirm Location Picker (Matching Reference Image 2)
  const handleConfirmLocation = () => {
    setConfirmedMapLocation(mapSearchTerm);
    setPersonalSearchLocation(mapSearchTerm);
    setOperatingArea(mapSearchTerm);
    setListerGoogleMaps(`https://maps.google.com/?q=${encodeURIComponent(mapSearchTerm)}`);
    setShowMapModal(false);
  };

  // CNIC File Upload & Extraction
  const handleCnicFileUpload = (file?: File) => {
    setCnicScanState('SCANNING');
    setCnicFileName(file ? file.name : 'national_id_card.jpg');
    if (file) {
      const url = URL.createObjectURL(file);
      setCnicDocPreview(url);
    } else {
      setCnicDocPreview('https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&auto=format&fit=crop&q=80');
    }

    setTimeout(() => {
      setCnicScanState('SCANNED');
      setOwnerCnic('35201-9876543-1');
      setOwnerName(personalFullName || 'Muhammad Salman');
    }, 1200);
  };

  // Vehicle Smart Card Upload & Extraction
  const handleSmartCardFileUpload = (file?: File) => {
    setSmartCardScanState('SCANNING');
    setSmartCardFileName(file ? file.name : 'excise_smart_card_doc.jpg');
    if (file) {
      const url = URL.createObjectURL(file);
      setSmartCardDocPreview(url);
    } else {
      setSmartCardDocPreview('https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400&auto=format&fit=crop&q=80');
    }

    setTimeout(() => {
      setSmartCardScanState('SCANNED');
      setRegNumber('LEA-24-9988');
      setEngineNumber('1NZ-FE-829104');
      setChassisNumber('NZE141-9081245');
    }, 1200);
  };

  // Power of Attorney Upload
  const handlePoaFileUpload = (file?: File) => {
    setPoaFileName(file ? file.name : 'power_of_attorney_stamped.pdf');
    if (file) {
      const url = URL.createObjectURL(file);
      setPoaDocPreview(url);
    } else {
      setPoaDocPreview('https://images.unsplash.com/photo-1450133064473-71024230f91b?w=400&auto=format&fit=crop&q=80');
    }
  };

  // Publish Listing Handler (Supporting 3-Step Streamlined Flow & Double-Gate Approval)
  const handlePublishVehicle = (isDraft: boolean) => {
    if (!isDraft) {
      const isListerCnicMandatory = isDocMandatoryForRole('LISTER', 'cnic', country?.code || 'PK');
      const isListerOwnerCardMandatory = isDocMandatoryForRole('LISTER', 'owner_card', country?.code || 'PK');
      if (isListerCnicMandatory && !ownerCnic && !currentUser?.cnicFrontUrl) {
        alert('⚠️ National ID (CNIC) is marked mandatory by platform administration. Please upload your CNIC before publishing.');
        setWizardStep(2);
        return;
      }
      if (isListerOwnerCardMandatory && !regNumber && !smartCardDocPreview && !currentUser?.carOwnerCardUploaded) {
        alert('⚠️ Car Owner Card / Excise Smart Card is marked mandatory by platform administration. Please upload vehicle documents before publishing.');
        setWizardStep(2);
        return;
      }
    }

    setWizardSubmitting(true);
    setTimeout(() => {
      const hasActiveSub = currentUser?.subscription?.status === 'ACTIVE';
      // If user has no active subscription or chooses draft, strictly save as DRAFT/PAUSED
      const vehicleStatus = (!hasActiveSub || isDraft) ? 'DRAFT' : 'PENDING_APPROVAL';
      const vehicleImg =
        carPhotoSlots.find((p) => p.url)?.url ||
        uploadedPhotos[0]?.url ||
        'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=600&auto=format&fit=crop&q=80';

      const newVehicle = {
        id: `f-${Date.now()}`,
        title: `${carBrand} ${carModel} ${carYear}`,
        reg: regNumber || 'ISB-24-9988',
        city: personalCity || operatingCity,
        dailyRate: Number(carRentPerDay) || 4500,
        withDriverRate: (Number(carRentPerDay) || 4500) + 2500,
        weeklyRate: carWeeklyRent ? Number(carWeeklyRent) : undefined,
        monthlyRate: carMonthlyRent ? Number(carMonthlyRent) : undefined,
        bodyType: carBodyType || 'Sedan',
        serviceScope: carServiceScope,
        fuelIncluded: carFuelIncluded,
        fuelKmAllowance: carFuelIncluded && carFuelKmAllowance ? carFuelKmAllowance : undefined,
        mileageDaily: carMileageDaily ? (carMileageDaily.includes('km') ? carMileageDaily : `${carMileageDaily} km / day`) : undefined,
        mileageWeekly: carWeeklyRent && carMileageWeekly ? (carMileageWeekly.includes('km') ? carMileageWeekly : `${carMileageWeekly} km / week`) : undefined,
        mileageMonthly: carMonthlyRent && carMileageMonthly ? (carMileageMonthly.includes('km') ? carMileageMonthly : `${carMileageMonthly} km / month`) : undefined,
        extraKmRate: carExtraKmRate ? `PKR ${carExtraKmRate} / km` : undefined,
        extraKmRateNum: carExtraKmRate ? Number(carExtraKmRate.replace(/\D/g, '')) || undefined : undefined,
        deposit: carDeposit ? Number(carDeposit) : undefined,
        insuranceIncluded: true,
        insuranceType: 'Comprehensive Insurance Included',
        engineCapacity: carEngineCapacity || undefined,
        horsepower: carHorsepower ? `${carHorsepower} HP` : undefined,
        doors: carDoors || 4,
        bags: carBags || '2 large bags',
        minAge: carMinAge ? Number(carMinAge) : 21,
        exteriorColor: carExteriorColor || undefined,
        interiorColor: carInteriorColor || undefined,
        interiorFeatures: selectedInteriorFeatures.length > 0 ? selectedInteriorFeatures : undefined,
        safetyFeatures: selectedSafetyFeatures.length > 0 ? selectedSafetyFeatures : undefined,
        exteriorFeatures: selectedExteriorFeatures.length > 0 ? selectedExteriorFeatures : undefined,
        comfortFeatures: selectedComfortFeatures.length > 0 ? selectedComfortFeatures : undefined,
        infotainmentFeatures:
          selectedInfotainmentFeatures.length > 0 ? selectedInfotainmentFeatures : undefined,
        status: vehicleStatus,
        isPaused: !hasActiveSub || isDraft,
        pauseReason: !hasActiveSub ? 'Awaiting Active Subscription Payment' : undefined,
        views: 0,
        leads: 0,
        img: vehicleImg,
        youtubeUrl: carYoutubeUrl && isValidYouTubeUrl(carYoutubeUrl) ? carYoutubeUrl.trim() : undefined,
        driverMode: carDriver,
        transmission: carTransmission === 'AUTOMATIC' ? 'Automatic' : 'Manual',
        acMode: carAcHeater,
        seats: carSeats,
        assignedDriver: carDriver === 'WITHOUT_DRIVER' ? 'Self-Drive Only' : 'Muhammad Akram',
        registrationNumber: regNumber || 'LEA-24-9988',
        chassisNumber: chassisNumber || 'NZE141-9081245',
        engineNumber: engineNumber || '1NZ-FE-829104',
        exciseLocked: true,
        smartCardUrl: smartCardDocPreview || undefined,
        shopName: shopName || businessName,
        location: personalSearchLocation || confirmedMapLocation,
        phone: personalPrimaryNumber || listerWhatsApp,
      };

      const updated = [newVehicle, ...fleetList];
      setFleetList(updated);
      if (currentUser && currentUser.id !== 'usr-demo-lister') {
        try {
          localStorage.setItem(`safarpk_fleet_${currentUser.id}`, JSON.stringify(updated));
        } catch (e) {}
        fetch('/api/listings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: newVehicle.title,
            brand: newVehicle.brand,
            model: newVehicle.model,
            modelYear: newVehicle.year,
            category: newVehicle.category,
            registrationNumber: newVehicle.registrationNumber,
            city: newVehicle.city,
            pickupAddress: newVehicle.location,
            dailyRatePkr: newVehicle.dailyRate,
            withDriver: carDriver !== 'WITHOUT_DRIVER',
            transmission: newVehicle.transmission,
            fuelType: 'Petrol',
            imageGallery: newVehicle.image ? [newVehicle.image] : [],
            youtubeUrl: newVehicle.youtubeUrl || null,
          }),
        }).catch(() => {});
      }

      // Synchronize Lister profile details
      if (shopName) setBusinessName(shopName);
      if (personalFullName) setListerName(personalFullName);
      if (personalPrimaryNumber) setListerWhatsApp(personalPrimaryNumber);
      if (personalSecondaryNumber) setListerSecondaryPhone(personalSecondaryNumber);
      if (personalCity) setOperatingCity(personalCity);
      if (personalSearchLocation) setOperatingArea(personalSearchLocation);

      setWizardSubmitting(false);

      if (isDraft) {
        setWizardSuccessMsg('💾 Saved as Draft in your Fleet Roster!');
        setActiveTab('fleet');
      } else if (!hasActiveSub) {
        setWizardSuccessMsg('⚠️ Vehicle saved as Draft / Paused! Active subscription is required before listings can be published LIVE.');
        setShowSubscriptionRequiredModal(true);
        setActiveTab('fleet');
      } else {
        setWizardSuccessMsg(`✅ Vehicle "${carBrand} ${carModel}" saved! Submitted for Admin/Agent approval before going LIVE.`);
        setActiveTab('fleet');
      }
      setTimeout(() => {
        setWizardSuccessMsg(null);
        setWizardStep(1);
      }, 2000);
    }, 700);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-32 md:pb-0">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-lg shadow-sm">
                S
              </div>
              <span className="font-extrabold text-xl text-slate-900 tracking-tight">SafarPK</span>
            </Link>
            <span className="hidden sm:inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              Lister & Fleet Partner Desk
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs font-bold px-3 py-1.5 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition"
            >
              ← Public Marketplace
            </Link>
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center shadow">
                🏢
              </div>
              <div className="hidden md:block text-left text-xs">
                <span className="font-bold text-slate-900 block leading-tight">{businessName}</span>
                <span className="text-[10px] text-emerald-700 font-semibold">{operatingCity} Verified Partner</span>
              </div>
            </div>
          </div>
        </div>
        <MobilePullToRefresh />
        <OfflineStatusBanner />
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Mobile App Navigation Bar (Horizontal Scrollable Chips with zero clutter) */}
        <div className="lg:hidden col-span-1 space-y-2.5">
          <div className="p-3 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-base font-black shrink-0">
                🏢
              </div>
              <div className="min-w-0">
                <h3 className="font-heading font-extrabold text-xs text-slate-900 truncate">{businessName}</h3>
                <span className="text-[10px] text-emerald-700 font-bold block truncate">{operatingCity} Verified Partner</span>
              </div>
            </div>
            <span
              className={`text-[9px] font-black px-2 py-0.5 rounded-full border shrink-0 ${
                currentUser?.subscription?.status === 'ACTIVE'
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  : currentUser?.subscription?.status === 'PENDING_APPROVAL'
                  ? 'text-amber-800 bg-amber-50 border-amber-300'
                  : 'text-slate-600 bg-slate-100 border-slate-300'
              }`}
            >
              {currentUser?.subscription?.status === 'ACTIVE'
                ? 'Pro Fleet'
                : currentUser?.subscription?.status === 'PENDING_APPROVAL'
                ? 'Pending'
                : 'Unsubscribed'}
            </span>
          </div>

          {/* Swipeable Native App Tabs */}
          <div className="overflow-x-auto no-scrollbar py-1">
            <div className="flex items-center gap-1.5 min-w-max px-0.5">
              {[
                { id: 'overview', label: 'Overview', icon: Car },
                { id: 'fleet', label: 'My Vehicles', icon: Car, badge: fleetList.length },
                { id: 'add_vehicle', label: '+ Add Car', icon: PlusCircle },
                { id: 'requests', label: 'Requests', icon: Calendar, badge: incomingRequests.length },
                { id: 'analytics', label: 'Leads & Clicks', icon: BarChart2 },
                { id: 'availability', label: 'Calendar', icon: Clock },
                { id: 'subscription', label: 'Billing & History', icon: Receipt, badge: 'Active' },
                { id: 'profile', label: 'Storefront Profile', icon: Building2 },
                { id: 'team', label: 'Drivers', icon: Users },
                { id: 'settings', label: 'Settings', icon: Settings },
              ].map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition shrink-0 cursor-pointer active:scale-95 ${
                      active
                        ? 'bg-emerald-600 text-white shadow-xs font-heading'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{item.label}</span>
                    {item.badge !== undefined && (
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                          active ? 'bg-white/30 text-white' : 'bg-emerald-100 text-emerald-900 font-bold'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Desktop Sidebar Nav */}
        <aside className="hidden lg:block space-y-1">
          <div className="p-4 bg-white rounded-2xl border border-slate-200 mb-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xl font-bold">
                🚗
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">{businessName}</h3>
                <span className="text-[11px] text-slate-500 block">{listerName} (Manager)</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border inline-block mt-0.5 ${
                    currentUser?.subscription?.status === 'ACTIVE'
                      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                      : currentUser?.subscription?.status === 'PENDING_APPROVAL'
                      ? 'text-amber-800 bg-amber-50 border-amber-300'
                      : 'text-rose-700 bg-rose-50 border-rose-200'
                  }`}
                >
                  {currentUser?.subscription?.planName ||
                    (currentUser?.subscription?.status === 'ACTIVE'
                      ? 'Pro Fleet Plan'
                      : currentUser?.subscription?.status === 'PENDING_APPROVAL'
                      ? 'Pending Approval'
                      : 'Unsubscribed')}
                </span>
              </div>
            </div>
          </div>

          <nav className="bg-white rounded-2xl border border-slate-200 p-2 space-y-1 shadow-xs text-xs font-semibold">
            {[
              { id: 'overview', label: 'Fleet Overview', icon: Car },
              { id: 'fleet', label: 'My Vehicles Roster', icon: Car, badge: fleetList.length },
              { id: 'intercity', label: 'Intercity & Carpool', icon: Navigation, badge: listerIntercityRides.length || 'New' },
              { id: 'analytics', label: 'Ad Analytics & Leads', icon: BarChart2, badge: 'Live' },
              { id: 'add_vehicle', label: '+ Add New Vehicle', icon: PlusCircle },
              { id: 'requests', label: 'Customer Requests', icon: Calendar, badge: incomingRequests.length },
              { id: 'availability', label: 'Availability Calendar', icon: Clock },
              { id: 'subscription', label: 'Billing & Invoices', icon: Receipt, badge: 'Active' },
              { id: 'profile', label: 'Business Profile & Map', icon: Building2 },
              { id: 'team', label: 'Team & Drivers', icon: Users },
              { id: 'settings', label: 'Lister Settings', icon: Settings },
            ].map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition cursor-pointer ${
                    active
                      ? 'bg-emerald-600 text-white shadow-sm font-bold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                        active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Tab Canvas */}
        <main className="lg:col-span-3 space-y-6">
          {/* SUBSCRIPTION GATEWAY & PROMOTIONAL BANNER */}
          {currentUser && (!currentUser.subscription || currentUser.subscription.status === 'UNSUBSCRIBED') && (
            <div className="p-4 bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-amber-500/10 border-2 border-emerald-600/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-sm text-slate-900">
                      Welcome, {businessName}! Activate Your Fleet Listing Quota
                    </h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                      Subscription Pass Required
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    You can create and manage your vehicle drafts right now. To publish vehicles live on the marketplace and receive direct customer calls, please select an active subscription pass.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('subscription')}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md transition cursor-pointer shrink-0"
              >
                ⚡ Choose Package & Unlock Quota
              </button>
            </div>
          )}

          {currentUser?.subscription?.status === 'PENDING_APPROVAL' && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-amber-600 shrink-0 animate-pulse" />
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-xs text-amber-950">
                      ⏳ Subscription Payment Under Super Admin Review
                    </h4>
                    <span className="px-2 py-0.2 rounded text-[9px] font-bold bg-amber-200 text-amber-900">
                      Ref: {currentUser.subscription.paymentRef || 'Submitted'}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Your payment receipt for &ldquo;{currentUser.subscription.planName}&rdquo; has been submitted. Your vehicles are safely drafted and will go LIVE automatically once approved.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('subscription')}
                className="px-3.5 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-xl text-xs font-bold shrink-0"
              >
                View Status
              </button>
            </div>
          )}

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="p-6 bg-[#101828] text-white rounded-[24px] shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-800">
                <div>
                  <span className="text-xs uppercase tracking-wider font-bold text-emerald-400">Lister Control Center</span>
                  <h2 className="text-lg sm:text-2xl font-black mt-1 text-white">{businessName}</h2>
                  <p className="text-xs sm:text-sm text-slate-200 font-medium mt-1.5 leading-relaxed">
                    {currentUser?.subscription?.status === 'ACTIVE'
                      ? `Your fleet is currently LIVE in ${operatingCity}. Direct booking leads and online booking requests appear instantly below.`
                      : currentUser?.subscription?.status === 'PENDING_APPROVAL'
                      ? `Your subscription payment receipt is under review. Your vehicles are saved as Draft / Paused until approved.`
                      : `Your subscription is inactive. Your vehicles are saved as Draft / Paused. Please activate a subscription package to publish your fleet live in ${operatingCity}.`}
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('add_vehicle')}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md whitespace-nowrap self-start sm:self-auto cursor-pointer"
                >
                  + Add Another Vehicle
                </button>
              </div>

              {/* Shareable Public Storefront Widget */}
              <DashboardStoreWidget
                type="STORE"
                identifier={businessName}
                isSubscribed={currentUser?.subscription?.status === 'ACTIVE'}
                subtitle="Share your dedicated store link with private clients or on WhatsApp status to let anyone view all your active vehicles in one place without needing to send individual car links."
              />

              {/* KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] text-slate-400 font-semibold block">Total Fleet</span>
                  <span className="text-2xl font-black text-slate-900 mt-1 block">{fleetList.length} Cars</span>
                  <span className="text-[10px] text-emerald-600 font-bold mt-1 block">All LIVE & Inspected</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('analytics')}
                  className="p-4 bg-white hover:bg-emerald-50/50 rounded-2xl border border-slate-200 hover:border-emerald-300 shadow-2xs transition text-left cursor-pointer group"
                  title="Click to view full Ad Analytics & Customer Leads"
                >
                  <span className="text-[11px] text-slate-400 font-semibold block group-hover:text-emerald-700">Monthly Leads</span>
                  <span className="text-2xl font-black text-emerald-600 mt-1 block">135</span>
                  <span className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                    <span>View Ad Analytics</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
                  </span>
                </button>
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] text-slate-400 font-semibold block">Booking Requests</span>
                  <span className="text-2xl font-black text-slate-900 mt-1 block">{incomingRequests.length} Active</span>
                  <span className="text-[10px] text-purple-600 font-bold mt-1 block">Verified Documents</span>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] text-slate-400 font-semibold block">Quota Status</span>
                  <span className="text-2xl font-black text-slate-900 mt-1 block">{fleetList.length} / 15</span>
                  <span className="text-[10px] text-slate-500 mt-1 block">12 Slots Remaining</span>
                </div>
              </div>

              {/* Ad Analytics & Customer Leads Banner in Overview */}
              <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 rounded-2xl border border-emerald-800/60 p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-300">
                      Live Vehicle Ad Analytics
                    </span>
                  </div>
                  <h4 className="font-heading font-extrabold text-base text-white">
                    Track Customer Clicks, Number Reveals & WhatsApp Leads
                  </h4>
                  <p className="text-xs text-slate-300 max-w-xl">
                    View real-time impressions, page views, click-to-reveals, and direct inquiries for all {fleetList.length} cars in your fleet roster.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('analytics')}
                  className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 shadow-sm shrink-0 cursor-pointer"
                >
                  <BarChart2 className="w-4 h-4" />
                  <span>Open Ad Analytics →</span>
                </button>
              </div>

              {/* Incoming Booking Requests Alert */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-extrabold text-sm text-slate-900">Incoming Customer Requests (Action Required)</h3>
                  </div>
                  <button onClick={() => setActiveTab('requests')} className="text-xs font-bold text-emerald-600 hover:underline">
                    Manage All →
                  </button>
                </div>

                <div className="space-y-3">
                  {incomingRequests.map((r) => (
                    <div key={r.id} className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-amber-200/60">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-amber-950 bg-white px-2 py-0.5 rounded border border-amber-300">
                              {r.bookingRef}
                            </span>
                            <h4 className="font-bold text-xs text-slate-900">{r.vehicleName}</h4>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900">
                              Pending Keys Handover
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-600 mt-1 block">
                            Dates: <strong>{r.startDate}</strong> to <strong>{r.endDate}</strong> ({r.pickupArea})
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black text-slate-900">PKR {formatPKR(r.totalAmount)}</span>
                          <span className="text-[10px] text-slate-500 block">Payment: Cash on Handover</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div>
                          <span className="text-slate-500 text-[10px] block">Customer</span>
                          <span className="font-bold text-slate-800">{r.customerName}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] block">CNIC (Protected)</span>
                          <span className="font-mono font-bold text-slate-800">{maskCnic(r.customerCnic)}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] block">License # (Protected)</span>
                          <span className="font-mono font-bold text-slate-800">{maskLicense(r.customerLicense)}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] block">Direct Contact</span>
                          <a
                            href={`https://wa.me/${r.customerPhone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-bold text-emerald-700 hover:underline flex items-center gap-1"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>{r.customerPhone}</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FLEET ROSTER */}
          {activeTab === 'fleet' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">My Vehicles Roster</h3>
                  <p className="text-xs text-slate-500">Currently active and inspected rental fleet.</p>
                </div>
                <button
                  onClick={() => setActiveTab('add_vehicle')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  + Add Vehicle
                </button>
              </div>

              <div className="space-y-3">
                {fleetList.map((f) => (
                  <div key={f.id} className="p-3.5 sm:p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    {/* Top: Thumbnail + Info */}
                    <div className="flex items-start gap-3">
                      <div className="relative w-16 h-16 sm:w-20 sm:h-16 shrink-0 rounded-xl overflow-hidden bg-slate-200 border border-slate-200">
                        <img
                          src={f.img}
                          alt={f.title}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80';
                          }}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1.5">
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">{f.title}</h4>
                          <span
                            className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              f.status === 'LIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {f.status}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500 mt-1">
                          <span className="font-mono font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-800 text-[10px]">
                            {f.reg}
                          </span>
                          <span>📍 {f.city}</span>
                          <span className="font-bold text-emerald-700">PKR {formatPKR(f.dailyRate)}/day</span>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                          <span>{f.views} Views</span>
                          <span>•</span>
                          <span className="text-emerald-700 font-bold">{f.leads} Leads</span>
                        </div>
                      </div>
                    </div>

                    {/* Driver & Booking Mode */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/80 text-xs">
                      <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1 min-w-0">
                        <Users className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="shrink-0">{isPakistan ? 'Driver / Captain:' : 'Chauffeur:'}</span>
                        <span className="font-bold text-[11px] text-emerald-950 bg-white px-2 py-0.5 rounded-md border border-emerald-300 truncate max-w-[130px] sm:max-w-none">
                          {f.assignedDriver || 'Self-Drive'}
                        </span>
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          const next = f.bookingRequirement === 'DIRECT_CONTACT' ? 'REQUIRED_DETAILS' : 'DIRECT_CONTACT';
                          setFleetList(fleetList.map((item) => (item.id === f.id ? { ...item, bookingRequirement: next } : item)));
                        }}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition cursor-pointer flex items-center gap-1 ${
                          f.bookingRequirement === 'DIRECT_CONTACT'
                            ? 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                        }`}
                        title="Click to toggle customer booking requirement"
                      >
                        <span>{f.bookingRequirement === 'DIRECT_CONTACT' ? '⚡ Instant Contact' : '🔒 Required Details'}</span>
                      </button>
                    </div>

                    {/* Actions Toolbar */}
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditVehicle(f)}
                        className="py-1.5 px-2 text-xs font-bold rounded-xl border border-emerald-600 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const isActivating = f.status !== 'LIVE';
                          if (isActivating && currentUser?.subscription?.status !== 'ACTIVE') {
                            setShowSubscriptionRequiredModal(true);
                            setWizardSuccessMsg('⚠️ Active subscription required to make listings LIVE. Please activate your subscription pass or contact support.');
                            setTimeout(() => setWizardSuccessMsg(null), 4000);
                            return;
                          }
                          const updated = fleetList.map((item) =>
                            item.id === f.id ? { ...item, status: item.status === 'LIVE' ? 'PAUSED' : 'LIVE' } : item
                          );
                          setFleetList(updated);
                          if (currentUser && currentUser.id !== 'usr-demo-lister') {
                            try {
                              localStorage.setItem(`safarpk_fleet_${currentUser.id}`, JSON.stringify(updated));
                            } catch (e) {}
                          }
                        }}
                        className="py-1.5 px-2 text-xs font-bold rounded-xl border border-slate-300 bg-white hover:bg-slate-100 transition cursor-pointer text-center truncate"
                      >
                        {f.status === 'LIVE' ? 'Pause' : 'Activate'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete listing "${f.title}" (${f.reg}) from your fleet roster?`)) {
                            setFleetList(fleetList.filter((item) => item.id !== f.id));
                          }
                        }}
                        className="py-1.5 px-2 bg-white text-rose-600 border border-slate-200 rounded-xl hover:bg-rose-50 transition cursor-pointer flex items-center justify-center gap-1"
                        title="Delete vehicle"
                      >
                        <Trash2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2A: INTERCITY ROUTES & SEAT SHARING CARPOOL */}
          {activeTab === 'intercity' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
                    <h3 className="font-extrabold text-base text-slate-900">
                      Intercity Routes & Seat Sharing (Carpool)
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Post scheduled city-to-city trips with Seat Sharing (per-seat carpool) or full private car bookings.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddIntercityModal(true)}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ Post New Intercity Route</span>
                </button>
              </div>

              {/* Informational Callout */}
              <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-start gap-3">
                <Navigation className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-900 leading-relaxed space-y-1">
                  <p className="font-bold">How City-to-City Intercity Works on SafarPK:</p>
                  <p className="text-blue-800">
                    <strong>1. Seat Sharing (Carpool):</strong> Traveling with spare seats (e.g. Karachi ➔ Hyderabad or Lahore ➔ Islamabad)? Set a per-seat fare (e.g. Rs. 1,500/seat) and number of available seats. Passengers can call or WhatsApp to join.
                  </p>
                  <p className="text-blue-800">
                    <strong>2. Full Private Car:</strong> Offering a private vehicle with driver for families or executives? Set one-way and return fares.
                  </p>
                  <p className="text-blue-800">
                    <strong>3. Both:</strong> Allow passengers to book individual spare seats OR rent the entire vehicle for their group.
                  </p>
                </div>
              </div>

              {/* Active Published Routes List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Your Published Intercity Routes ({listerIntercityRides.length})</span>
                  <span className="text-emerald-600 font-medium">Live on SafarPK Marketplace</span>
                </div>

                {listerIntercityRides.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {listerIntercityRides.map((r) => (
                      <div key={r.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 hover:border-blue-300 transition">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-[#E0EAFF] text-[#1D3A8A]">
                            <Navigation className="w-3.5 h-3.5" />
                            <span>{r.fromCity} ➔ {r.toCity}</span>
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            r.rideType === 'SEAT_SHARING'
                              ? 'bg-emerald-100 text-emerald-800'
                              : r.rideType === 'FULL_CAR'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {r.rideType === 'SEAT_SHARING'
                              ? `👥 Seat Sharing (${r.availableSeats} open)`
                              : r.rideType === 'FULL_CAR'
                              ? '🚗 Full Private Car'
                              : '✨ Seats & Full Car'}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-bold text-sm text-slate-900">{r.car}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {r.departureDate || 'Daily'} · {r.departureTime || r.time}
                          </p>
                        </div>

                        {/* Pricing details */}
                        <div className="grid grid-cols-2 gap-2 p-2.5 bg-white rounded-xl border border-slate-200 text-center">
                          {r.rideType !== 'FULL_CAR' && (
                            <div>
                              <span className="text-[10px] text-slate-400 block font-bold uppercase">Per Seat</span>
                              <span className="text-xs font-black text-emerald-700">Rs. {r.pricePerSeat?.toLocaleString('en-US') || '1,500'}</span>
                            </div>
                          )}
                          {r.rideType !== 'SEAT_SHARING' && (
                            <div className={r.rideType === 'BOTH' ? 'border-l border-slate-100' : 'col-span-2'}>
                              <span className="text-[10px] text-slate-400 block font-bold uppercase">Full Car Fare</span>
                              <span className="text-xs font-black text-blue-900">{formatPKR(r.one)}</span>
                            </div>
                          )}
                        </div>

                        <div className="text-[11px] text-slate-600 space-y-0.5 border-t border-slate-200/60 pt-2">
                          <p className="truncate"><strong>Pickup:</strong> {r.pickupPoint || r.fromCity}</p>
                          <p className="truncate"><strong>Drop:</strong> {r.dropPoint || r.toCity}</p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                          <Link
                            href={`/city-to-city/${r.id}`}
                            className="text-blue-600 hover:underline font-bold"
                          >
                            View Live Listing ➔
                          </Link>
                          <button
                            type="button"
                            onClick={() => deleteCustomCityRide(r.id)}
                            className="text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-300 rounded-2xl space-y-2">
                    <Navigation className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-sm font-bold text-slate-700">No Custom Intercity Routes Published Yet</p>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Click below to post your first route (e.g. Karachi ➔ Hyderabad or Lahore ➔ Islamabad) with seat sharing or whole vehicle booking.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowAddIntercityModal(true)}
                      className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition cursor-pointer"
                    >
                      + Post Intercity Route
                    </button>
                  </div>
                )}
              </div>

              {/* POST INTERCITY ROUTE MODAL */}
              {showAddIntercityModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-4 my-8">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <h3 className="font-extrabold text-base text-slate-900">Post New Intercity Route</h3>
                        <p className="text-xs text-slate-500">List seat sharing carpool or private whole car</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAddIntercityModal(false)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <form onSubmit={handlePublishIntercityRide} className="space-y-4 text-xs">
                      {/* From City & To City */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">From (Departure City) *</label>
                          <input
                            type="text"
                            value={newC2cFrom}
                            onChange={(e) => setNewC2cFrom(e.target.value)}
                            placeholder="e.g. Karachi"
                            required
                            className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-blue-600"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">To (Destination City) *</label>
                          <input
                            type="text"
                            value={newC2cTo}
                            onChange={(e) => setNewC2cTo(e.target.value)}
                            placeholder="e.g. Hyderabad"
                            required
                            className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-blue-600"
                          />
                        </div>
                      </div>

                      {/* Ride / Booking Offering */}
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Booking Model *</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: 'SEAT_SHARING', label: 'Seat Sharing Only', desc: 'Per seat price' },
                            { id: 'FULL_CAR', label: 'Full Car Only', desc: 'Private trip' },
                            { id: 'BOTH', label: 'Both Options', desc: 'Seats or full car' },
                          ].map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setNewC2cRideType(opt.id as any)}
                              className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                                newC2cRideType === opt.id
                                  ? 'bg-blue-50 border-blue-600 text-blue-900 font-extrabold shadow-2xs'
                                  : 'bg-slate-50 border-slate-200 text-slate-700 font-medium'
                              }`}
                            >
                              <span className="block font-bold">{opt.label}</span>
                              <span className="text-[10px] text-slate-500">{opt.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Fares & Seats based on Selection */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                        {newC2cRideType !== 'FULL_CAR' && (
                          <>
                            <div>
                              <label className="font-bold text-slate-700 block mb-1">Price Per Seat (PKR) *</label>
                              <input
                                type="number"
                                value={newC2cPricePerSeat}
                                onChange={(e) => setNewC2cPricePerSeat(Number(e.target.value))}
                                placeholder="1500"
                                required
                                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl font-bold text-emerald-700 font-mono"
                              />
                            </div>
                            <div>
                              <label className="font-bold text-slate-700 block mb-1">Available Seats (1–4) *</label>
                              <select
                                value={newC2cAvailableSeats}
                                onChange={(e) => setNewC2cAvailableSeats(Number(e.target.value))}
                                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl font-bold"
                              >
                                <option value={1}>1 Seat Available</option>
                                <option value={2}>2 Seats Available</option>
                                <option value={3}>3 Seats Available</option>
                                <option value={4}>4 Seats Available</option>
                              </select>
                            </div>
                          </>
                        )}
                        {newC2cRideType !== 'SEAT_SHARING' && (
                          <>
                            <div>
                              <label className="font-bold text-slate-700 block mb-1">Full Car One-Way (PKR) *</label>
                              <input
                                type="number"
                                value={newC2cFullCarOne}
                                onChange={(e) => setNewC2cFullCarOne(Number(e.target.value))}
                                placeholder="8500"
                                required
                                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl font-bold font-mono"
                              />
                            </div>
                            <div>
                              <label className="font-bold text-slate-700 block mb-1">Full Car Return Trip (PKR)</label>
                              <input
                                type="number"
                                value={newC2cFullCarRet}
                                onChange={(e) => setNewC2cFullCarRet(Number(e.target.value))}
                                placeholder="15000"
                                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl font-bold font-mono"
                              />
                            </div>
                          </>
                        )}
                      </div>

                      {/* Car Details & Schedule */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">Vehicle Model *</label>
                          <input
                            type="text"
                            value={newC2cCar}
                            onChange={(e) => setNewC2cCar(e.target.value)}
                            placeholder="e.g. Honda City 1.2 · Chilled AC"
                            required
                            className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">Departure Schedule *</label>
                          <input
                            type="text"
                            value={newC2cTime}
                            onChange={(e) => setNewC2cTime(e.target.value)}
                            placeholder="e.g. 08:30 AM Daily or Flexible"
                            required
                            className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                          />
                        </div>
                      </div>

                      {/* Pickup & Drop Points */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">Pickup Landmark in {newC2cFrom}</label>
                          <input
                            type="text"
                            value={newC2cPickup}
                            onChange={(e) => setNewC2cPickup(e.target.value)}
                            placeholder="e.g. Sohrab Goth M-9 Toll Plaza"
                            className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">Drop-off Landmark in {newC2cTo}</label>
                          <input
                            type="text"
                            value={newC2cDrop}
                            onChange={(e) => setNewC2cDrop(e.target.value)}
                            placeholder="e.g. Qasim Chowk / Autobahn"
                            className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl"
                          />
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setShowAddIntercityModal(false)}
                          className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                        >
                          <Check className="w-4 h-4" />
                          <span>Publish Route to Marketplace</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2B: CAR RENTAL AD ANALYTICS & LEADS HUB */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <AnalyticsReportHub
                role="LISTER"
                viewerName={businessName}
                viewerPhone={listerPhone}
                allowExport={true}
                allowClaim={false}
                accentColor="#059669"
              />
            </div>
          )}

          {/* TAB 3: ADD VEHICLE WIZARD (STREAMLINED 3-STEP PROCESS) */}
          {activeTab === 'add_vehicle' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Rent Out Your Car in Just 3 Simple Steps</h3>
                  <p className="text-xs text-slate-500">
                    Share car details, upload photos, and start earning — it’s that easy!
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('fleet')}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  ✕ Cancel
                </button>
              </div>

              {wizardSuccessMsg && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold text-center">
                  {wizardSuccessMsg}
                </div>
              )}

              {/* 3 Simple Steps Header */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold">
                {[
                  { num: 1, label: '1. Enter Your Car Details' },
                  { num: 2, label: '2. Upload Photos' },
                  { num: 3, label: '3. Enter Your Personal Info' },
                ].map((s) => (
                  <button
                    key={s.num}
                    type="button"
                    onClick={() => setWizardStep(s.num)}
                    className={`py-3 px-2 rounded-xl transition text-xs font-bold cursor-pointer ${
                      wizardStep === s.num
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : wizardStep > s.num
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* ========================================================================= */}
              {/* STEP 1: ENTER YOUR CAR DETAILS                                            */}
              {/* ========================================================================= */}
              {wizardStep === 1 && (
                <div className="space-y-5 text-xs">
                  {/* Claim Showroom Listing Top Banner */}
                  <div className="relative p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-[11px] text-emerald-900 font-medium">
                      Already registered on SafarPK? <strong>Find and claim your showroom listing</strong> to auto-fill details.
                    </span>
                    <div className="relative flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-emerald-200 text-slate-500">
                      <Search className="w-3 h-3 text-slate-400" />
                      <input
                        type="text"
                        value={claimSearchQuery}
                        onChange={(e) => {
                          setClaimSearchQuery(e.target.value);
                          setShowClaimDropdown(true);
                        }}
                        onFocus={() => setShowClaimDropdown(true)}
                        placeholder="Name or phone"
                        className="text-[11px] outline-none w-36 bg-transparent"
                      />
                      {showClaimDropdown && claimSearchQuery.trim().length > 0 && (
                        <div className="absolute right-0 top-full mt-1.5 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 p-2 space-y-1.5">
                          <span className="text-[10px] font-bold text-slate-400 block px-2 py-0.5">Matching Registered Listings:</span>
                          {CLAIMABLE_BUSINESSES.filter(
                            (b) =>
                              b.companyName.toLowerCase().includes(claimSearchQuery.toLowerCase()) ||
                              b.whatsapp.includes(claimSearchQuery) ||
                              b.city.toLowerCase().includes(claimSearchQuery.toLowerCase())
                          ).map((biz) => (
                            <button
                              key={biz.companyName}
                              type="button"
                              onClick={() => {
                                handleClaimListing(biz);
                                setShopName(biz.companyName);
                                setPersonalFullName(biz.name);
                                setPersonalPrimaryNumber(biz.whatsapp);
                                setPersonalCity(biz.city);
                                setPersonalSearchLocation(`${biz.area}, ${biz.city}`);
                              }}
                              className="w-full text-left p-2 rounded-xl hover:bg-emerald-50 transition border border-transparent hover:border-emerald-200"
                            >
                              <span className="font-bold text-xs text-slate-900 block">{biz.companyName}</span>
                              <span className="text-[10px] text-slate-500 block">
                                📍 {biz.city} ({biz.area}) · {biz.whatsapp}
                              </span>
                              <span className="text-[9px] font-bold text-emerald-700 mt-0.5 inline-block">
                                Click to Claim & Auto-populate Details →
                              </span>
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => setShowClaimDropdown(false)}
                            className="w-full text-center py-1 bg-slate-50 text-[10px] text-slate-500 hover:text-slate-800 rounded-lg mt-1"
                          >
                            Close
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Car Details</h4>
                    <p className="text-[11px] text-slate-500">Include Some Details</p>
                  </div>

                  {/* Make / Brand */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-bold text-slate-700">Make / Brand *</label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomBrand(!isCustomBrand);
                          if (!isCustomBrand) setCarBrand('');
                        }}
                        className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>{isCustomBrand ? 'Choose from brand list' : '+ Add Custom Brand'}</span>
                      </button>
                    </div>

                    {/* Quick top brand pills */}
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {['Suzuki', 'Toyota', 'Honda', 'KIA', 'Hyundai'].map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => {
                            setIsCustomBrand(false);
                            setCarBrand(b);
                            if (b === 'Suzuki') {
                              setCarModel('Alto VXR');
                              setCarSeats(4);
                            } else if (b === 'Toyota') {
                              setCarModel('Corolla Altis');
                              setCarSeats(5);
                            } else if (b === 'Honda') {
                              setCarModel('Civic Oriel');
                              setCarSeats(5);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                            !isCustomBrand && carBrand === b
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {b}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomBrand(true);
                          setCarBrand('');
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                          isCustomBrand
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        + Other / Custom
                      </button>
                    </div>

                    {/* Dropdown or Custom Input */}
                    {isCustomBrand ? (
                      <div className="space-y-1">
                        <input
                          type="text"
                          value={carBrand}
                          onChange={(e) => setCarBrand(e.target.value)}
                          placeholder="Type custom brand name (e.g. BYD, Deepal, Baic, GWM...)"
                          className="w-full p-2.5 bg-slate-50 border border-emerald-400 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20"
                          required
                          autoFocus
                        />
                        <p className="text-[10px] text-slate-500">Enter any local, imported, or custom vehicle manufacturer.</p>
                      </div>
                    ) : (
                      <div className="relative">
                        <select
                          value={STANDARD_CAR_BRANDS.includes(carBrand) ? carBrand : 'CUSTOM'}
                          onChange={(e) => {
                            if (e.target.value === 'CUSTOM') {
                              setIsCustomBrand(true);
                              setCarBrand('');
                            } else {
                              setCarBrand(e.target.value);
                            }
                          }}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 cursor-pointer text-xs"
                        >
                          <option value="" disabled>Choose brand or manufacturer...</option>
                          {STANDARD_CAR_BRANDS.map((b) => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                          <option value="CUSTOM">+ Add Custom / Other Brand...</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Model */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Model is required *</label>
                    <input
                      type="text"
                      value={carModel}
                      onChange={(e) => {
                        setCarModel(e.target.value);
                        setCarSeats(getSuggestedSeats(e.target.value));
                      }}
                      placeholder="e.g. Alto VXR / Cultus AGS / Corolla Altis / Civic Oriel / HiAce"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                      required
                    />
                  </div>

                  {/* Year & Rent Per Day */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Year *</label>
                      <select
                        value={carYear}
                        onChange={(e) => setCarYear(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium cursor-pointer text-xs"
                      >
                        {['2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016', '2015', '2014', '2012'].map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Rent / Day (PKR) *</label>
                      <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2">
                        <span className="font-bold text-slate-500 text-xs">PKR</span>
                        <input
                          type="number"
                          value={carRentPerDay}
                          onChange={(e) => setCarRentPerDay(e.target.value)}
                          placeholder="4500"
                          className="w-full font-mono font-bold outline-none text-slate-900 bg-transparent text-xs"
                          required
                        />
                        <span className="text-[10px] text-slate-400">/d</span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Description</label>
                    <textarea
                      rows={3}
                      value={carDescription}
                      onChange={(e) => setCarDescription(e.target.value)}
                      placeholder="Share condition, fuel average, chilled AC, cleanliness, and booking requirements..."
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>

                  {/* Driver : */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1.5">Driver :</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'WITH_DRIVER', label: 'With Driver' },
                        { id: 'WITHOUT_DRIVER', label: 'Without Driver' },
                        { id: 'BOTH', label: 'Both' },
                      ].map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => setCarDriver(d.id as any)}
                          className={`p-2.5 rounded-xl border text-center font-bold text-xs transition cursor-pointer ${
                            carDriver === d.id
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/20'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Transmission : */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1.5">Transmission :</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'AUTOMATIC', label: 'automatic' },
                        { id: 'MANUAL', label: 'manual' },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setCarTransmission(t.id as any)}
                          className={`p-2.5 rounded-xl border text-center font-bold text-xs transition cursor-pointer capitalize ${
                            carTransmission === t.id
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/20'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* AC/Heater : */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1.5">AC/Heater :</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'AC_HEATER', label: 'AC / Heater installed' },
                        { id: 'NONE', label: 'None' },
                      ].map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => setCarAcHeater(a.id as any)}
                          className={`p-2.5 rounded-xl border text-center font-bold text-xs transition cursor-pointer ${
                            carAcHeater === a.id
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/20'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {a.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Seats : */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1.5">Seats :</label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {[2, 4, 5, 7, 9, 13].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setCarSeats(s)}
                          className={`p-2.5 rounded-xl border text-center font-bold text-xs transition cursor-pointer ${
                            carSeats === s
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {s} Persons
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Detailed Specifications & Categorized Options (Collapsible to save mobile height) */}
                  <div className="rounded-2xl bg-slate-50 border border-slate-200/90 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowDetailedSpecs(!showDetailedSpecs)}
                      className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-100/70 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <span className="font-heading font-extrabold text-xs sm:text-sm text-slate-900 block">
                            Detailed Specifications & Optional Rates
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">
                            Weekly/Monthly rates, engine size, baggage, security deposit & colors
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[9px] font-bold text-slate-500 uppercase bg-white px-2 py-0.5 rounded border border-slate-200">
                          Optional
                        </span>
                        <span className="text-xs font-bold text-emerald-700 flex items-center gap-0.5 ml-1">
                          {showDetailedSpecs ? (
                            <><span>Hide</span> <ChevronUp className="w-4 h-4" /></>
                          ) : (
                            <><span>More Specs</span> <ChevronDown className="w-4 h-4" /></>
                          )}
                        </span>
                      </div>
                    </button>

                    {showDetailedSpecs && (
                      <div className="p-4 pt-2 space-y-4 border-t border-slate-200/60 mt-1">
                        {/* Driver & Service Scope Selection */}
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                          <label className="font-bold text-slate-800 text-xs block">
                            Driver Service Scope *
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <label className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer text-xs font-bold transition ${carServiceScope === 'BOTH' ? 'bg-emerald-50 border-emerald-500 text-emerald-900' : 'bg-white border-slate-200 text-slate-700'}`}>
                              <input
                                type="radio"
                                name="serviceScope"
                                value="BOTH"
                                checked={carServiceScope === 'BOTH'}
                                onChange={() => setCarServiceScope('BOTH')}
                                className="accent-[#0B6B4F]"
                              />
                              <span>Both (Self-Drive or Driver)</span>
                            </label>
                            <label className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer text-xs font-bold transition ${carServiceScope === 'WITH_DRIVER' ? 'bg-emerald-50 border-emerald-500 text-emerald-900' : 'bg-white border-slate-200 text-slate-700'}`}>
                              <input
                                type="radio"
                                name="serviceScope"
                                value="WITH_DRIVER"
                                checked={carServiceScope === 'WITH_DRIVER'}
                                onChange={() => setCarServiceScope('WITH_DRIVER')}
                                className="accent-[#0B6B4F]"
                              />
                              <span>With Driver Only</span>
                            </label>
                            <label className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer text-xs font-bold transition ${carServiceScope === 'WITHOUT_DRIVER' ? 'bg-emerald-50 border-emerald-500 text-emerald-900' : 'bg-white border-slate-200 text-slate-700'}`}>
                              <input
                                type="radio"
                                name="serviceScope"
                                value="WITHOUT_DRIVER"
                                checked={carServiceScope === 'WITHOUT_DRIVER'}
                                onChange={() => setCarServiceScope('WITHOUT_DRIVER')}
                                className="accent-[#0B6B4F]"
                              />
                              <span>Self-Drive Only</span>
                            </label>
                          </div>
                        </div>

                        {/* Fuel Package Option (For Driver Bundles) */}
                        <div className="p-3 bg-emerald-50/50 border border-emerald-200/80 rounded-xl space-y-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={carFuelIncluded}
                              onChange={(e) => setCarFuelIncluded(e.target.checked)}
                              className="w-4 h-4 rounded text-[#0B6B4F] accent-[#0B6B4F]"
                            />
                            <span className="font-extrabold text-xs text-slate-900">
                              Include Fuel in Rental Package (Mandatory Fuel & Km by Driver)?
                            </span>
                          </label>
                          {carFuelIncluded && (
                            <div className="pt-1.5 pl-6">
                              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                                Included Fuel Mileage Allowance:
                              </label>
                              <input
                                type="text"
                                value={carFuelKmAllowance}
                                onChange={(e) => setCarFuelKmAllowance(e.target.value)}
                                placeholder="e.g. 100 km / day with fuel included in package"
                                className="w-full p-2 bg-white border border-emerald-300 rounded-xl text-xs font-semibold text-slate-900"
                              />
                              <span className="text-[10px] text-slate-500 block mt-1">
                                💡 Commuters will see that Fuel is bundled up to this limit. Extra km beyond this will be charged at the extra km rate.
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Tiered Weekly & Monthly Rates (All Blank by Default, Hidden if not set) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="font-bold text-slate-700 block mb-1">Weekly Rent (PKR) <span className="text-[10px] text-slate-400 font-normal">(Optional)</span></label>
                            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2">
                              <span className="font-bold text-slate-400 text-xs">PKR</span>
                              <input
                                type="number"
                                value={carWeeklyRent}
                                onChange={(e) => setCarWeeklyRent(e.target.value)}
                                placeholder="Leave blank if none"
                                className="w-full font-mono font-bold outline-none text-slate-900 bg-transparent text-xs"
                              />
                              <span className="text-[10px] text-slate-400">/week</span>
                            </div>
                          </div>

                          <div>
                            <label className="font-bold text-slate-700 block mb-1">Monthly Rent (PKR) <span className="text-[10px] text-slate-400 font-normal">(Optional)</span></label>
                            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2">
                              <span className="font-bold text-slate-400 text-xs">PKR</span>
                              <input
                                type="number"
                                value={carMonthlyRent}
                                onChange={(e) => setCarMonthlyRent(e.target.value)}
                                placeholder="Leave blank if none"
                                className="w-full font-mono font-bold outline-none text-slate-900 bg-transparent text-xs"
                              />
                              <span className="text-[10px] text-slate-400">/mo</span>
                            </div>
                          </div>
                        </div>

                        {/* Kilometers Allowances (Daily, Weekly, Monthly - All Blank by default) */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="font-bold text-slate-700 block mb-1">Daily Km Limit <span className="text-[10px] text-slate-400 font-normal">(Blank = Unlimited)</span></label>
                            <input
                              type="text"
                              value={carMileageDaily}
                              onChange={(e) => setCarMileageDaily(e.target.value)}
                              placeholder="e.g. 200 km / day"
                              className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                            />
                          </div>

                          <div>
                            <label className="font-bold text-slate-700 block mb-1">Weekly Km Limit <span className="text-[10px] text-slate-400 font-normal">(Optional)</span></label>
                            <input
                              type="text"
                              value={carMileageWeekly}
                              onChange={(e) => setCarMileageWeekly(e.target.value)}
                              placeholder="e.g. 1400 km / week"
                              className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                            />
                          </div>

                          <div>
                            <label className="font-bold text-slate-700 block mb-1">Monthly Km Limit <span className="text-[10px] text-slate-400 font-normal">(Optional)</span></label>
                            <input
                              type="text"
                              value={carMileageMonthly}
                              onChange={(e) => setCarMileageMonthly(e.target.value)}
                              placeholder="e.g. 4500 km / mo"
                              className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                            />
                          </div>
                        </div>

                        {/* Extra Mileage Rate & Deposit */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="font-bold text-slate-700 block mb-1">Extra Mileage Rate (PKR / km) <span className="text-[10px] text-slate-400 font-normal">(Optional)</span></label>
                            <input
                              type="text"
                              value={carExtraKmRate}
                              onChange={(e) => setCarExtraKmRate(e.target.value)}
                              placeholder="e.g. 25"
                              className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-medium font-mono"
                            />
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              Automatically converted into foreign currencies for international renters.
                            </span>
                          </div>

                          <div>
                            <label className="font-bold text-slate-700 block mb-1">Refundable Security Deposit (PKR) <span className="text-[10px] text-slate-400 font-normal">(Optional)</span></label>
                            <input
                              type="number"
                              value={carDeposit}
                              onChange={(e) => setCarDeposit(e.target.value)}
                              placeholder="Leave blank if 0"
                              className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                            />
                          </div>
                        </div>

                        {/* Body Type & Engine */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="font-bold text-slate-700 block mb-1">Body Type</label>
                            <select
                              value={carBodyType}
                              onChange={(e) => setCarBodyType(e.target.value)}
                              className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-medium cursor-pointer"
                            >
                              <option value="Hatchback">Hatchback</option>
                              <option value="Sedan">Sedan</option>
                              <option value="SUV / 4x4">SUV / 4x4</option>
                              <option value="Crossover">Crossover</option>
                              <option value="Van / Hiace">Van / Hiace</option>
                              <option value="Luxury Sedan">Luxury Sedan</option>
                              <option value="Sports Car">Sports Car</option>
                            </select>
                          </div>

                          <div>
                            <label className="font-bold text-slate-700 block mb-1">Engine Capacity</label>
                            <input
                              type="text"
                              value={carEngineCapacity}
                              onChange={(e) => setCarEngineCapacity(e.target.value)}
                              placeholder="e.g. 660cc, 1.5L Turbo"
                              className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                            />
                          </div>

                          <div>
                            <label className="font-bold text-slate-700 block mb-1">Horsepower (HP)</label>
                            <input
                              type="text"
                              value={carHorsepower}
                              onChange={(e) => setCarHorsepower(e.target.value)}
                              placeholder="e.g. 68, 178"
                              className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                            />
                          </div>
                        </div>

                        {/* Doors, Luggage Boot, Min Age, Security Deposit */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div>
                            <label className="font-bold text-slate-700 block mb-1">Doors</label>
                            <select
                              value={carDoors}
                              onChange={(e) => setCarDoors(Number(e.target.value))}
                              className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-medium cursor-pointer"
                            >
                              <option value={2}>2 Doors</option>
                              <option value={4}>4 Doors</option>
                              <option value={5}>5 Doors</option>
                            </select>
                          </div>

                          <div>
                            <label className="font-bold text-slate-700 block mb-1">Luggage Boot</label>
                            <input
                              type="text"
                              value={carBags}
                              onChange={(e) => setCarBags(e.target.value)}
                              placeholder="e.g. 2 large bags"
                              className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                            />
                          </div>

                          <div>
                            <label className="font-bold text-slate-700 block mb-1">Min Driver Age</label>
                            <input
                              type="number"
                              value={carMinAge}
                              onChange={(e) => setCarMinAge(e.target.value)}
                              placeholder="21"
                              className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                            />
                          </div>
                        </div>

                        {/* Colors */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="font-bold text-slate-700 block mb-1">Exterior Color</label>
                            <input
                              type="text"
                              value={carExteriorColor}
                              onChange={(e) => setCarExteriorColor(e.target.value)}
                              placeholder="e.g. White / Black / Silver"
                              className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                            />
                          </div>

                          <div>
                            <label className="font-bold text-slate-700 block mb-1">Interior Color</label>
                            <input
                              type="text"
                              value={carInteriorColor}
                              onChange={(e) => setCarInteriorColor(e.target.value)}
                              placeholder="e.g. Black Leather / Beige"
                              className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Features & Inclusions with Custom Feature Adding */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-800 block text-xs">Features & Inclusions</label>
                      <button
                        type="button"
                        onClick={() => setShowCustomFeatureInput(!showCustomFeatureInput)}
                        className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>{showCustomFeatureInput ? 'Done' : '+ Add Custom Feature'}</span>
                      </button>
                    </div>

                    {showCustomFeatureInput && (
                      <div className="flex items-center gap-1.5 p-2 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                        <input
                          type="text"
                          value={customFeatureInput}
                          onChange={(e) => setCustomFeatureInput(e.target.value)}
                          placeholder="e.g. Roof Carrier, Dashcam, Child Safety Seat..."
                          className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && customFeatureInput.trim()) {
                              e.preventDefault();
                              const feat = customFeatureInput.trim();
                              if (!customFeaturesList.includes(feat)) {
                                setCustomFeaturesList([...customFeaturesList, feat]);
                                setSelectedComfortFeatures((prev) => [...prev, feat]);
                              }
                              setCustomFeatureInput('');
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (customFeatureInput.trim()) {
                              const feat = customFeatureInput.trim();
                              if (!customFeaturesList.includes(feat)) {
                                setCustomFeaturesList([...customFeaturesList, feat]);
                                setSelectedComfortFeatures((prev) => [...prev, feat]);
                              }
                              setCustomFeatureInput('');
                            }
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                        >
                          Add
                        </button>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-1.5">
                      {[
                        'Air Conditioning & Heating',
                        'Leather Seats',
                        'Sunroof / Moonroof',
                        'Factory Alloy Wheels',
                        'Push Button Start',
                        'Keyless Entry',
                        'Cruise Control',
                        'Apple CarPlay & Android Auto',
                        'Reverse Camera',
                        '360-Degree Camera',
                        'Parking Sensors',
                        'ABS with EBD',
                        'Dual Airbags',
                        'Bluetooth Audio',
                        ...customFeaturesList,
                      ].map((feature) => {
                        const isSelected =
                          selectedInteriorFeatures.includes(feature) ||
                          selectedSafetyFeatures.includes(feature) ||
                          selectedExteriorFeatures.includes(feature) ||
                          selectedComfortFeatures.includes(feature) ||
                          selectedInfotainmentFeatures.includes(feature);

                        const toggle = () => {
                          if (isSelected) {
                            setSelectedInteriorFeatures((prev) => prev.filter((x) => x !== feature));
                            setSelectedSafetyFeatures((prev) => prev.filter((x) => x !== feature));
                            setSelectedExteriorFeatures((prev) => prev.filter((x) => x !== feature));
                            setSelectedComfortFeatures((prev) => prev.filter((x) => x !== feature));
                            setSelectedInfotainmentFeatures((prev) => prev.filter((x) => x !== feature));
                          } else {
                            setSelectedComfortFeatures((prev) => [...prev, feature]);
                          }
                        };

                        return (
                          <button
                            key={feature}
                            type="button"
                            onClick={toggle}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition cursor-pointer flex items-center gap-1 ${
                              isSelected
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 text-emerald-700" />}
                            <span>{feature}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-end pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setWizardStep(2)}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Next: Upload Photos</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* STEP 2: UPLOAD PHOTOS (6 Photo Slots)                                     */}
              {/* ========================================================================= */}
              {wizardStep === 2 && (
                <div className="space-y-5 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">Upload Photos</h4>
                      <p className="text-[11px] text-slate-500">
                        Upload clear photos of your {carBrand} {carModel}. 6 angles maximize renter trust.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleFillDemoPhotos}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl font-bold text-xs border border-emerald-200 flex items-center gap-1.5 transition self-start sm:self-auto cursor-pointer"
                    >
                      <span>⚡ Auto-Fill Demo Photos</span>
                    </button>
                  </div>

                  {/* 6 Photo Slots (Matching 6 'No file chosen' slots from prompt) */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {carPhotoSlots.map((slot, idx) => (
                      <div
                        key={slot.id}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between h-36 relative group"
                      >
                        {slot.url ? (
                          <div className="relative w-full h-full rounded-xl overflow-hidden">
                            <img src={slot.url} alt={slot.label} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleRemovePhoto(idx)}
                                className="p-1.5 bg-white text-rose-600 rounded-lg hover:bg-rose-50 shadow-sm cursor-pointer"
                                title="Remove photo"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <span className="absolute bottom-1.5 left-1.5 bg-black/70 text-white text-[9px] px-2 py-0.5 rounded font-bold backdrop-blur-xs">
                              {slot.label}
                            </span>
                          </div>
                        ) : (
                          <label className="w-full h-full border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl flex flex-col items-center justify-center p-2 text-center cursor-pointer transition bg-white group">
                            <Upload className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 mb-1" />
                            <span className="font-bold text-xs text-slate-700">{slot.label}</span>
                            <span className="text-[10px] text-slate-400 mt-0.5">No file chosen</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handlePhotoUpload(idx, f);
                              }}
                            />
                          </label>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Optional YouTube Vehicle / Intro Video Link */}
                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-xs font-extrabold text-slate-900">
                        Vehicle / Intro Video (YouTube Link Only · Optional)
                      </label>
                      {carYoutubeUrl.trim() && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isValidYouTubeUrl(carYoutubeUrl)
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {isValidYouTubeUrl(carYoutubeUrl) ? '✓ Valid YouTube Video' : 'YouTube links only'}
                        </span>
                      )}
                    </div>
                    <input
                      type="url"
                      value={carYoutubeUrl}
                      onChange={(e) => setCarYoutubeUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 outline-none focus:border-[#0B6B4F]"
                    />
                    <p className="text-[11px] text-slate-500">
                      Only YouTube links are accepted. Plays smoothly inside your listing gallery on loop without recommended end-screen videos.
                    </p>
                  </div>

                  {/* Verified Lister Documents OCR (Strictly Controlled by Super Admin docRules) */}
                  {(() => {
                    const isCnicActive = isDocActiveForRole('LISTER', 'cnic', country?.code || 'PK');
                    const isOwnerCardActive = isDocActiveForRole('LISTER', 'owner_card', country?.code || 'PK');
                    const isCnicMandatory = isDocMandatoryForRole('LISTER', 'cnic', country?.code || 'PK');
                    const isOwnerCardMandatory = isDocMandatoryForRole('LISTER', 'owner_card', country?.code || 'PK');
                    const hasActive = isCnicActive || isOwnerCardActive;
                    const hasMandatory = isCnicMandatory || isOwnerCardMandatory;

                    if (!hasActive) return null;

                    return (
                      <details
                        open={hasMandatory}
                        className={`p-4 rounded-2xl border space-y-3 cursor-pointer ${
                          hasMandatory ? 'bg-amber-50/50 border-amber-300' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <summary className="font-bold text-slate-800 flex items-center justify-between text-xs outline-none">
                          <span className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            <span>
                              {hasMandatory
                                ? 'Mandatory Verification: Upload Required Documents'
                                : 'Optional: Get "Verified Owner" Badge (Upload CNIC & Excise Smart Card)'}
                            </span>
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              hasMandatory ? 'text-amber-800 bg-amber-100 border border-amber-300' : 'text-emerald-700 bg-emerald-100'
                            }`}
                          >
                            {hasMandatory ? 'Mandatory' : 'Recommended'}
                          </span>
                        </summary>

                        <div className="pt-3 space-y-3 border-t border-slate-200">
                          {/* CNIC Scan */}
                          {isCnicActive && (
                            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-slate-900">
                                  Owner National ID {isCnicMandatory && <span className="text-rose-600">*</span>}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCnicFileUpload()}
                                  className="text-emerald-700 font-bold hover:underline flex items-center gap-1"
                                >
                                  <Scan className="w-3.5 h-3.5" />
                                  <span>⚡ Scan Demo CNIC</span>
                                </button>
                              </div>
                              {cnicDocPreview ? (
                                <div className="flex items-center gap-2 p-2 bg-emerald-50 rounded-lg">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                  <span className="text-xs font-mono font-bold text-emerald-950">
                                    CNIC: {ownerCnic || '35201-9876543-1'}
                                  </span>
                                </div>
                              ) : (
                                <label className="block p-3 border border-dashed border-slate-300 rounded-lg text-center cursor-pointer hover:border-emerald-500">
                                  <span className="text-xs text-slate-600 font-bold">Choose CNIC file (No file chosen)</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      const f = e.target.files?.[0];
                                      if (f) handleCnicFileUpload(f);
                                    }}
                                  />
                                </label>
                              )}
                            </div>
                          )}

                          {/* Smart Card Scan (Authentic OCR, Immutable Locking & Privacy Shield) */}
                          {isOwnerCardActive && (
                            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-slate-900">
                                  Vehicle Excise Smart Card / Registration {isOwnerCardMandatory && <span className="text-rose-600">*</span>}
                                </span>
                                {!smartCardDocPreview && (
                                  <button
                                    type="button"
                                    onClick={() => handleSmartCardFileUpload()}
                                    className="text-emerald-700 font-bold hover:underline flex items-center gap-1"
                                  >
                                    <Scan className="w-3.5 h-3.5" />
                                    <span>⚡ Scan Demo Smart Card</span>
                                  </button>
                                )}
                              </div>
                              {smartCardDocPreview ? (
                                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-950">
                                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                      <span>Excise Registration Authenticated</span>
                                    </span>
                                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-200/80 text-emerald-900">
                                      🔒 Locked Record
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-800 pt-1">
                                    <div>Reg #: <strong className="text-slate-950">{regNumber || 'LEA-24-9988'}</strong></div>
                                    <div>Chassis: <strong className="text-slate-950">{chassisNumber || 'NZE141-9081245'}</strong></div>
                                    <div>Engine: <strong className="text-slate-950">{engineNumber || '1NZ-FE-829104'}</strong></div>
                                    <div>Tax Paid: <strong className="text-emerald-800">30-Jun-2027</strong></div>
                                  </div>
                                  <p className="text-[10px] font-sans text-emerald-900 bg-white/80 p-2 rounded-lg leading-tight border border-emerald-200/60">
                                    🛡️ <strong>Privacy Shield Guaranteed:</strong> These sensitive vehicle documents and chassis numbers are confidential. They will NOT appear on public search or listing pages, and unlock for customers only upon booking confirmation.
                                  </p>
                                </div>
                              ) : (
                                <label className="block p-3 border border-dashed border-slate-300 rounded-lg text-center cursor-pointer hover:border-emerald-500">
                                  <span className="text-xs text-slate-600 font-bold">Choose Smart Card file (No file chosen)</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      const f = e.target.files?.[0];
                                      if (f) handleSmartCardFileUpload(f);
                                    }}
                                  />
                                </label>
                              )}
                            </div>
                          )}
                        </div>
                      </details>
                    );
                  })()}

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setWizardStep(1)}
                      className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer"
                    >
                      ← Back
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handlePublishVehicle(true)}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
                      >
                        Save as Draft
                      </button>
                      <button
                        type="button"
                        onClick={() => setWizardStep(3)}
                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
                      >
                        <span>Next: Enter Personal Info</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* STEP 3: ENTER YOUR PERSONAL INFO (Matching Reference Image 1)             */}
              {/* ========================================================================= */}
              {wizardStep === 3 && (
                <div className="space-y-4 text-xs">
                  <div>
                    <h4 className="font-black text-base text-slate-900">Personal Info</h4>
                    <p className="text-[11px] text-slate-500">Please fill all fields marked required to continue.</p>
                  </div>

                  {/* First and Last Name */}
                  <div>
                    <input
                      type="text"
                      value={personalFullName}
                      onChange={(e) => setPersonalFullName(e.target.value)}
                      placeholder="First and Last Name"
                      className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                      required
                    />
                  </div>

                  {/* Primary Phone / WhatsApp */}
                  <div>
                    <input
                      type="tel"
                      value={personalPrimaryNumber}
                      onChange={(e) => setPersonalPrimaryNumber(e.target.value)}
                      placeholder="03102355671"
                      className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                      required
                    />
                  </div>

                  {/* Secondary Number */}
                  <div>
                    <input
                      type="tel"
                      value={personalSecondaryNumber}
                      onChange={(e) => setPersonalSecondaryNumber(e.target.value)}
                      placeholder="Secondary Number"
                      className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>

                  {/* Shop Name */}
                  <div>
                    <input
                      type="text"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      placeholder="Shop Name"
                      className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>

                  {/* City Dropdown with + Custom City Option */}
                  <div>
                    {!showCustomCityLister ? (
                      <div className="relative">
                        <select
                          value={personalCity}
                          onChange={(e) => {
                            if (e.target.value === '__CUSTOM__') {
                              setShowCustomCityLister(true);
                            } else {
                              setPersonalCity(e.target.value);
                              setMapSearchTerm(`${e.target.value}, Pakistan`);
                            }
                          }}
                          className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 appearance-none outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 cursor-pointer"
                        >
                          <option value="" disabled>
                            City
                          </option>
                          {listerAvailableCities.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                          <option value="__CUSTOM__">+ Custom City (Add Your City)...</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                          </svg>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-1.5 bg-white border-2 border-emerald-600 rounded-xl">
                        <input
                          type="text"
                          autoFocus
                          value={customCityListerInput}
                          onChange={(e) => setCustomCityListerInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const trimmed = customCityListerInput.trim();
                              if (trimmed) {
                                const formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
                                if (!listerAvailableCities.includes(formatted)) {
                                  setListerAvailableCities([formatted, ...listerAvailableCities]);
                                }
                                setPersonalCity(formatted);
                                setMapSearchTerm(`${formatted}, Pakistan`);
                                setCustomCityListerInput('');
                                setShowCustomCityLister(false);
                              }
                            } else if (e.key === 'Escape') {
                              setShowCustomCityLister(false);
                            }
                          }}
                          placeholder="Type city name (e.g. Sargodha, Bahawalpur, Swat...)"
                          className="flex-1 p-2 text-xs outline-none font-bold text-slate-900"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const trimmed = customCityListerInput.trim();
                            if (trimmed) {
                              const formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
                              if (!listerAvailableCities.includes(formatted)) {
                                setListerAvailableCities([formatted, ...listerAvailableCities]);
                              }
                              setPersonalCity(formatted);
                              setMapSearchTerm(`${formatted}, Pakistan`);
                              setCustomCityListerInput('');
                              setShowCustomCityLister(false);
                            }
                          }}
                          className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs cursor-pointer"
                        >
                          + Add City
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowCustomCityLister(false)}
                          className="px-2 py-2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                    <div className="flex justify-end mt-1">
                      <button
                        type="button"
                        onClick={() => setShowCustomCityLister(true)}
                        className="text-[10px] font-bold text-emerald-700 hover:underline cursor-pointer"
                      >
                        + City not listed? Add custom city
                      </button>
                    </div>
                  </div>

                  {/* Search Location with Pin Icon on the Right (Matching Image 1) */}
                  <div className="relative">
                    <input
                      type="text"
                      value={personalSearchLocation}
                      onClick={() => setShowMapModal(true)}
                      readOnly
                      placeholder="Search Location"
                      className="w-full p-3 pr-10 bg-white border border-emerald-600 rounded-xl text-xs font-medium text-slate-900 outline-none cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => setShowMapModal(true)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-emerald-700 cursor-pointer"
                      aria-label="Pick on Map"
                    >
                      <MapPin className="w-4 h-4 text-emerald-600" />
                    </button>
                  </div>

                  {/* Platform Disclaimer */}
                  <p className="text-[10px] text-slate-400 pt-1">
                    * Renters will contact you directly ({personalPrimaryNumber || 'your number'}). Direct marketplace contact between parties.
                  </p>

                  {/* Bottom Buttons (Matching Reference Image 1) */}
                  <div className="flex items-center justify-between gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setWizardStep(2)}
                      className="flex-1 py-3 px-6 rounded-xl border border-emerald-700 text-emerald-800 bg-white hover:bg-emerald-50 text-xs font-bold transition text-center cursor-pointer"
                    >
                      Back
                    </button>

                    <button
                      type="button"
                      disabled={wizardSubmitting}
                      onClick={() => handlePublishVehicle(false)}
                      className="flex-1 py-3 px-6 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold transition text-center shadow-md cursor-pointer disabled:bg-slate-300"
                    >
                      {wizardSubmitting ? 'Posting...' : 'Post Now'}
                    </button>
                  </div>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => handlePublishVehicle(true)}
                      className="text-[11px] font-bold text-slate-500 hover:text-slate-800 underline cursor-pointer"
                    >
                      Save as Draft
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: REQUESTS */}
          {activeTab === 'requests' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <h3 className="font-extrabold text-base text-slate-900">Incoming Customer Booking Requests</h3>
              <p className="text-xs text-slate-500">Review customer identity credentials before handing over vehicle keys.</p>

              <div className="space-y-3">
                {incomingRequests.map((r) => (
                  <div key={r.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <div>
                        <span className="font-mono text-xs font-bold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200">
                          {r.bookingRef}
                        </span>
                        <h4 className="font-bold text-sm text-slate-900 mt-1">{r.vehicleName}</h4>
                      </div>
                      <span className="text-sm font-black text-slate-900">PKR {formatPKR(r.totalAmount)}</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px] font-semibold block">Customer</span>
                        <span className="font-bold text-slate-800">{r.customerName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] font-semibold block">National ID</span>
                        <span className="font-mono font-bold text-slate-800">{maskCnic(r.customerCnic)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] font-semibold block">License #</span>
                        <span className="font-mono font-bold text-slate-800">{maskLicense(r.customerLicense)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] font-semibold block">Pickup Point</span>
                        <span className="font-bold text-slate-800">{r.pickupArea}</span>
                      </div>
                    </div>

                    {/* Driver Allotment & WhatsApp Dispatch */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white rounded-xl border border-slate-200 text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 w-full min-w-0">
                        <span className="font-bold text-slate-700 shrink-0">
                          {isPakistan ? 'Driver / Captain Allotted:' : 'Chauffeur Allotted:'}
                        </span>
                        <select
                          value={r.assignedDriver || 'Muhammad Akram'}
                          onChange={(e) => {
                            setIncomingRequests(
                              incomingRequests.map((item) => (item.id === r.id ? { ...item, assignedDriver: e.target.value } : item))
                            );
                          }}
                          className="p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 cursor-pointer w-full sm:w-auto max-w-full truncate outline-none"
                        >
                          {listerDriverTeam.map((d) => (
                            <option key={d.id} value={d.name}>
                              {d.name} ({d.assignedVehicleTitle})
                            </option>
                          ))}
                          <option value="Self-Drive (Customer Driving)">Self-Drive (Customer Driving)</option>
                        </select>
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto shrink-0">
                        <button
                          type="button"
                          onClick={() => setSelectedCustomerVaultModal(r)}
                          className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition cursor-pointer w-full sm:w-auto text-center"
                        >
                          <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="truncate">Inspect Vault</span>
                        </button>
                        <a
                          href={`https://wa.me/${r.customerPhone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(r.customerName)}!%20Your%20booking%20${r.bookingRef}%20for%20${encodeURIComponent(r.vehicleName)}%20is%20confirmed.%20Assigned%20Driver:%20${encodeURIComponent(r.assignedDriver || 'Muhammad Akram')}.`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition w-full sm:w-auto text-center"
                        >
                          <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>Confirm Booking</span>
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: AVAILABILITY */}
          {activeTab === 'availability' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <h3 className="font-extrabold text-base text-slate-900">Fleet Availability Calendar</h3>
              <p className="text-xs text-slate-500">Block booked dates, maintenance downtime, and scheduled bookings.</p>
              
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
                <Calendar className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                <h4 className="font-bold text-sm text-slate-800">All 3 Vehicles Currently Available</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Dates booked by customers are automatically blocked from receiving conflicting booking requests.
                </p>
              </div>
            </div>
          )}

          {/* TAB 6: BILLING & SUBSCRIPTION */}
          {activeTab === 'subscription' && (
            <BillingHistoryManager
              role="CAR_RENTAL"
              roleTitle="Fleet Lister"
              businessName={businessName}
              initialPlanName="Professional Fleet Hub (15 Vehicles)"
            />
          )}

          {/* TAB 7: PROFILE & MAP */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <h3 className="font-extrabold text-base text-slate-900">Business Profile & Map Location</h3>
              <p className="text-xs text-slate-500">Public profile details displayed on your vehicle listing cards.</p>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Company Name</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Operating City</label>
                  <input
                    type="text"
                    value={operatingCity}
                    onChange={(e) => setOperatingCity(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Confirmed Location Pin</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={confirmedMapLocation}
                    readOnly
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowMapModal(true)}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold whitespace-nowrap cursor-pointer"
                  >
                    Change Pin
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: TEAM & DRIVERS ROSTER (COMPANY CHAUFFEURS ASSIGNED TO VEHICLES) */}
          {activeTab === 'team' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    {isPakistan ? 'Company Drivers & Captains Roster' : 'Company Drivers & Chauffeurs Roster'}
                  </h3>
                  <p className="text-slate-500">
                    {isPakistan
                      ? 'Register company drivers/captains and assign them to your fleet vehicles. When a customer books a car with driver, they receive the driver name and phone.'
                      : 'Register company drivers and assign them to your fleet vehicles. When a customer books a car with chauffeur, they receive the driver name and phone.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddListerDriverModal(true)}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-sm cursor-pointer whitespace-nowrap"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ Add {isPakistan ? 'Driver / Captain' : 'Driver / Chauffeur'}</span>
                </button>
              </div>

              {/* Summary Metric Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-semibold block">Total Employed Drivers</span>
                  <span className="text-xl font-black text-slate-900 mt-1 block">{listerDriverTeam.length}</span>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="text-[10px] text-emerald-700 font-semibold block">Assigned to Vehicles</span>
                  <span className="text-xl font-black text-emerald-800 mt-1 block">
                    {listerDriverTeam.filter((d) => d.assignedVehicleTitle).length}
                  </span>
                </div>
                <div className="p-3 bg-sky-50 rounded-xl border border-sky-200">
                  <span className="text-[10px] text-sky-700 font-semibold block">On Duty / Active</span>
                  <span className="text-xl font-black text-sky-800 mt-1 block">
                    {listerDriverTeam.filter((d) => d.status === 'ON_DUTY').length}
                  </span>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <span className="text-[10px] text-amber-700 font-semibold block">Available in Depot</span>
                  <span className="text-xl font-black text-amber-800 mt-1 block">
                    {listerDriverTeam.filter((d) => d.status === 'AVAILABLE').length}
                  </span>
                </div>
              </div>

              {/* Drivers Cards */}
              <div className="space-y-3">
                {listerDriverTeam.map((drv) => (
                  <div
                    key={drv.id}
                    className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xl shrink-0">
                        👨‍✈️
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-sm text-slate-900">{drv.name}</h4>
                          <span className="font-mono text-[10px] font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
                            {drv.licenseCategory}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              drv.status === 'ON_DUTY' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                            }`}
                          >
                            {drv.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Phone: <strong>{drv.phone}</strong> · ID: {drv.cnic} · ⭐ {drv.rating} ({drv.tripsCompleted} trips)
                        </p>
                        <div className="flex items-center gap-1.5 text-xs text-emerald-900 font-bold mt-1">
                          <Car className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Currently Driving: {drv.assignedVehicleTitle}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div>
                        <label className="text-[10px] text-slate-400 block font-semibold mb-0.5">Assign Fleet Vehicle</label>
                        <select
                          value={drv.assignedVehicleTitle}
                          onChange={(e) => {
                            const newCar = e.target.value;
                            setListerDriverTeam(
                              listerDriverTeam.map((d) => (d.id === drv.id ? { ...d, assignedVehicleTitle: newCar } : d))
                            );
                            setFleetList(
                              fleetList.map((f) => (newCar.includes(f.reg) ? { ...f, assignedDriver: drv.name } : f))
                            );
                          }}
                          className="p-2 bg-white border border-slate-300 rounded-xl font-bold text-xs text-slate-800 cursor-pointer"
                        >
                          {fleetList.map((f) => (
                            <option key={f.id} value={`${f.title} (${f.reg})`}>
                              {f.title} ({f.reg})
                            </option>
                          ))}
                          <option value="Unassigned / Pool Reserve">Unassigned / Pool Reserve</option>
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => setListerDriverTeam(listerDriverTeam.filter((d) => d.id !== drv.id))}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition mt-4"
                        title="Remove driver"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 9: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4 text-xs">
              <h3 className="font-extrabold text-base text-slate-900">Lister Portal Settings</h3>
              <p className="text-slate-500">Manage notification preferences, automatic booking confirmations, and bank accounts.</p>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900">Instant Direct Booking Alerts</h4>
                    <p className="text-slate-500 text-[11px]">Forward booking leads and inquiries directly to your registered phone.</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-4 h-4 text-emerald-600 rounded" />
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <div>
                    <h4 className="font-bold text-slate-900">Auto-Allot Dedicated Drivers</h4>
                    <p className="text-slate-500 text-[11px]">Automatically include the assigned vehicle driver info on customer requests.</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-4 h-4 text-emerald-600 rounded" />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* ADD DRIVER TO FLEET MODAL                                                 */}
      {/* ========================================================================= */}
      {showAddListerDriverModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowAddListerDriverModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">+ Add {isPakistan ? 'Company Driver / Captain' : 'Company Chauffeur'}</h3>
                <p className="text-[11px] text-slate-500">Register a driver and assign them to your fleet car.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddListerDriverModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddListerDriverSubmit} className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Driver Full Name *</label>
                <input
                  type="text"
                  required
                  value={newListerDriverName}
                  onChange={(e) => setNewListerDriverName(e.target.value)}
                  placeholder="e.g. Zahid Iqbal"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Direct Contact / Phone *</label>
                  <input
                    type="tel"
                    required
                    value={newListerDriverPhone}
                    onChange={(e) => setNewListerDriverPhone(e.target.value)}
                    placeholder="+92 300 1234567"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">National ID (CNIC / Passport)</label>
                  <input
                    type="text"
                    value={newListerDriverCnic}
                    onChange={(e) => setNewListerDriverCnic(e.target.value)}
                    placeholder="35201-1234567-1"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">License Category</label>
                <select
                  value={newListerDriverLicense}
                  onChange={(e) => setNewListerDriverLicense(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  <option value="HTV Commercial Chauffeur">HTV Commercial Chauffeur</option>
                  <option value="LTV Certified Chauffeur">LTV Certified Chauffeur</option>
                  <option value="VIP Executive Chauffeur">VIP Executive Chauffeur</option>
                  <option value="Luxury 4x4 Specialist">Luxury 4x4 Specialist</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Assign to Fleet Vehicle *</label>
                <select
                  value={newListerDriverAssignVehicle}
                  onChange={(e) => setNewListerDriverAssignVehicle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                >
                  {fleetList.map((f) => (
                    <option key={f.id} value={`${f.title} (${f.reg})`}>
                      {f.title} ({f.reg})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition shadow-sm cursor-pointer mt-2"
              >
                Confirm & Allot Driver to Vehicle
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOMER CREDENTIALS VAULT (UNMASKED FOR KEY HANDOVER COMPLIANCE) */}
      {selectedCustomerVaultModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={() => setSelectedCustomerVaultModal(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100 my-auto text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  🛡️
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Customer Identity & License Vault
                  </h3>
                  <span className="text-[10px] text-emerald-700 font-bold">
                    ✓ Unmasked under Mutual Consent for Key Handover
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomerVaultModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Customer Contact & Booking Info */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Customer Full Name</span>
                  <strong className="text-slate-900 text-sm">{selectedCustomerVaultModal.customerName}</strong>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-semibold">Booking Reference</span>
                  <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {selectedCustomerVaultModal.bookingRef}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-1 text-[11px] text-slate-600">
                <span>Phone: <strong className="text-slate-900 font-mono">{selectedCustomerVaultModal.customerPhone}</strong></span>
                <span>Vehicle: <strong className="text-slate-900">{selectedCustomerVaultModal.vehicleName}</strong></span>
              </div>
            </div>

            {/* Driving License & CNIC Unmasked Details */}
            <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-amber-950 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-amber-700" />
                  <span>Unmasked Identity Credentials (Key Handover Audit)</span>
                </span>
                <span className="text-[10px] font-bold bg-white text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                  Customer Direct Disclosure
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-white rounded-xl border border-amber-200">
                  <span className="text-[10px] font-bold text-slate-500 block uppercase">National ID (Unmasked)</span>
                  <span className="font-mono font-black text-slate-900 text-sm">
                    {selectedCustomerVaultModal.customerCnic}
                  </span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Match with physical card</span>
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-amber-200">
                  <span className="text-[10px] font-bold text-slate-500 block uppercase">Driving License #</span>
                  <span className="font-mono font-black text-slate-900 text-sm">
                    {selectedCustomerVaultModal.customerLicense}
                  </span>
                  <span className="text-[9px] text-emerald-700 block mt-0.5">Valid Motorcar / LTV</span>
                </div>
              </div>

              {/* License Preview */}
              <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center gap-3">
                <img
                  src={selectedCustomerVaultModal.licensePreview || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80'}
                  alt="License Scan"
                  className="w-14 h-10 object-cover rounded-md border shrink-0"
                />
                <div>
                  <span className="font-bold text-xs text-slate-900 block">Driving License Document Scan</span>
                  <span className="text-[10px] text-emerald-700 font-medium">✓ Uploaded by customer for direct host review</span>
                </div>
              </div>
            </div>

            {/* Handover Security Checklist */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5 text-[11px] text-slate-700">
              <span className="font-bold text-slate-900 block text-xs">Vehicle Handover Verification Checklist:</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-3.5 h-3.5 text-emerald-600 rounded" />
                <span>Physical National ID inspected & matches {selectedCustomerVaultModal.customerCnic}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-3.5 h-3.5 text-emerald-600 rounded" />
                <span>Physical original Driving License checked before giving car keys</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-3.5 h-3.5 text-emerald-600 rounded" />
                <span>Vehicle odometer reading & fuel level recorded in physical rental form</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-3.5 h-3.5 text-emerald-600 rounded" />
                <span>Refundable security deposit / payment collected directly</span>
              </label>
            </div>

            <p className="text-[10px] text-slate-500 leading-tight">
              * Protected under Pakistan Electronic Crimes Act (PECA 2016) & Electronic Transactions Ordinance (ETO 2002). Customer details are unmasked strictly for key handover security verification.
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  alert(`✅ Handover verified! Booking ${selectedCustomerVaultModal.bookingRef} marked as in-progress.`);
                  setSelectedCustomerVaultModal(null);
                }}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                ✓ Mark Keys Handed Over & Verified
              </button>
              <button
                type="button"
                onClick={() => setSelectedCustomerVaultModal(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* INTERACTIVE FREE MAP LOCATION PICKER MODAL (Matching Reference Image 2)    */}
      {/* ========================================================================= */}
      {showMapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 text-xs relative">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-base text-slate-900">Search & Confirm Vehicle Location</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowMapModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Browser Permission Popup Simulation (Matching Image 2) */}
            {showGeoBanner && (
              <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-lg space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-700" />
                    <div>
                      <span className="font-bold text-slate-900 text-xs block">safarpk.com wants to</span>
                      <span className="text-[11px] text-slate-600">Know your location</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowGeoBanner(false)}
                    className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleUseCurrentLocation();
                      setShowGeoBanner(false);
                    }}
                    className="flex-1 py-2 px-3 bg-blue-100 hover:bg-blue-200 text-blue-900 font-bold rounded-xl text-center text-xs transition cursor-pointer"
                  >
                    Allow while visiting the site
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleUseCurrentLocation();
                      setShowGeoBanner(false);
                    }}
                    className="flex-1 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-800 font-semibold rounded-xl text-center text-xs transition cursor-pointer"
                  >
                    Allow this time
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowGeoBanner(false)}
                    className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-center text-xs transition cursor-pointer"
                  >
                    Never allow
                  </button>
                </div>
              </div>
            )}

            {/* Search Input for Pakistani Locations */}
            <div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={mapSearchTerm}
                    onChange={(e) => setMapSearchTerm(e.target.value)}
                    placeholder="Search Location (e.g. Centaurus Mall, Islamabad / DHA Phase 5, Lahore)"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none text-xs"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setMapSearchTerm(mapSearchTerm)}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold cursor-pointer"
                >
                  Search
                </button>
              </div>
            </div>

            {/* Quick Pakistani Landmark Chips */}
            <div className="flex flex-wrap gap-1.5">
              {[
                'Centaurus Mall, Islamabad',
                'F-8 Markaz, Islamabad',
                'G-8 / Shifa Hospital, Islamabad',
                'DHA Phase 5, Lahore',
                'Gulberg Main Blvd, Lahore',
                'Clifton Block 5, Karachi',
                'Saddar, Rawalpindi',
              ].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setMapSearchTerm(chip)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-900 text-slate-600 text-[10px] font-semibold transition cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Keyless Live Google Maps Embed (Islamabad / Selected City) */}
            <div className="relative w-full h-72 rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100">
              <iframe
                title="Location Map"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                src={`https://maps.google.com/maps?q=${encodeURIComponent(mapSearchTerm || 'Islamabad, Pakistan')}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
              />
              <div className="absolute top-2 right-2 px-3 py-1 bg-white/95 backdrop-blur-md rounded-lg text-[10px] font-bold text-slate-800 shadow-sm border border-slate-200 pointer-events-none">
                📍 {mapSearchTerm}
              </div>
            </div>

            {/* Bottom Actions (Matching Reference Image 2: Cancel | Confirm Location) */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowMapModal(false)}
                className="px-6 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold transition cursor-pointer text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmLocation}
                className="px-7 py-2.5 rounded-xl bg-slate-500 hover:bg-emerald-700 text-white font-black shadow-sm transition cursor-pointer text-xs"
              >
                Confirm Location
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT VEHICLE LISTING (FULL CRUD)                                   */}
      {/* ========================================================================= */}
      {editingVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 text-xs my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-base text-slate-900">Edit Vehicle Listing</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingVehicle(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveVehicleEdit} className="space-y-3.5">
              {/* Vehicle Title & Model */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Vehicle Make, Model & Year *</label>
                <input
                  type="text"
                  required
                  value={editingVehicle.title}
                  onChange={(e) => setEditingVehicle({ ...editingVehicle, title: e.target.value })}
                  placeholder="e.g. Toyota Corolla Altis Grande 2024"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>

              {/* Registration Number & City */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Registration # *</label>
                  <input
                    type="text"
                    required
                    value={editingVehicle.reg}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, reg: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Operating City</label>
                  <select
                    value={editingVehicle.city}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, city: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    {listerAvailableCities.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Rates */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Daily Rent Rate (PKR / Day) *</label>
                  <input
                    type="number"
                    required
                    value={editingVehicle.dailyRate}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, dailyRate: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-emerald-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">With-Driver Daily Rent (PKR)</label>
                  <input
                    type="number"
                    value={editingVehicle.withDriverRate || editingVehicle.dailyRate + 2500}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, withDriverRate: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              {/* Transmission & Status */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Transmission</label>
                  <select
                    value={editingVehicle.transmission || 'Automatic'}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, transmission: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="Automatic">Automatic Transmission</option>
                    <option value="Manual">Manual Transmission</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Listing Status</label>
                  <select
                    value={editingVehicle.status}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, status: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="LIVE">🟢 LIVE on Marketplace</option>
                    <option value="PAUSED">⏸️ Paused (Hidden)</option>
                    <option value="MAINTENANCE">🔧 In Workshop / Maintenance</option>
                    <option value="DRAFT">💾 Draft Roster</option>
                  </select>
                </div>
              </div>

              {/* Assigned Driver / Captain */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {isPakistan ? 'Assigned Driver / Captain Name' : 'Assigned Chauffeur / Driver Name'}
                </label>
                <input
                  type="text"
                  value={editingVehicle.assignedDriver || ''}
                  onChange={(e) => setEditingVehicle({ ...editingVehicle, assignedDriver: e.target.value })}
                  placeholder={isPakistan ? 'e.g. Tariq Mahmood (or leave empty for Self-Drive Only)' : 'e.g. Tariq Mahmood (or leave empty for Self-Drive Only)'}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              {/* Location Area */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Showroom / Pickup Location</label>
                <input
                  type="text"
                  value={editingVehicle.location || ''}
                  onChange={(e) => setEditingVehicle({ ...editingVehicle, location: e.target.value })}
                  placeholder="e.g. DHA Phase 5 / Centaurus Mall"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              {/* Customer Booking & Contact Requirement */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Customer Booking & Direct Contact Policy</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingVehicle({ ...editingVehicle, bookingRequirement: 'REQUIRED_DETAILS' })}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      (editingVehicle.bookingRequirement || 'REQUIRED_DETAILS') === 'REQUIRED_DETAILS'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold ring-1 ring-emerald-500'
                        : 'bg-slate-50 border-slate-200 text-slate-700 font-medium'
                    }`}
                  >
                    <span className="block text-xs">🔒 Required Details (Default)</span>
                    <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                      Customer must provide verified Name & Phone before connecting.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingVehicle({ ...editingVehicle, bookingRequirement: 'DIRECT_CONTACT' })}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      editingVehicle.bookingRequirement === 'DIRECT_CONTACT'
                        ? 'bg-blue-50 border-blue-500 text-blue-950 font-bold ring-1 ring-blue-500'
                        : 'bg-slate-50 border-slate-200 text-slate-700 font-medium'
                    }`}
                  >
                    <span className="block text-xs">⚡ Direct Contact (No Form)</span>
                    <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                      Allow customers to connect directly on WhatsApp without forms.
                    </span>
                  </button>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingVehicle(null)}
                  className="px-4 py-2 border border-slate-200 bg-white rounded-xl font-bold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black rounded-xl shadow-sm transition cursor-pointer"
                >
                  Save Listing Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOMER CREDENTIALS VAULT (UNMASKED FOR KEY HANDOVER COMPLIANCE) */}
      {selectedCustomerVaultModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={() => setSelectedCustomerVaultModal(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100 my-auto text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  🛡️
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Customer Identity & License Vault
                  </h3>
                  <span className="text-[10px] text-emerald-700 font-bold">
                    ✓ Unmasked under Mutual Consent for Key Handover
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomerVaultModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Customer Contact & Booking Info */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Customer Full Name</span>
                  <strong className="text-slate-900 text-sm">{selectedCustomerVaultModal.customerName}</strong>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-semibold">Booking Reference</span>
                  <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {selectedCustomerVaultModal.bookingRef}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-1 text-[11px] text-slate-600">
                <span>Phone: <strong className="text-slate-900 font-mono">{selectedCustomerVaultModal.customerPhone}</strong></span>
                <span>Vehicle: <strong className="text-slate-900">{selectedCustomerVaultModal.vehicleName}</strong></span>
              </div>
            </div>

            {/* Driving License & CNIC Unmasked Details */}
            <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-amber-950 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-amber-700" />
                  <span>Unmasked Identity Credentials (Key Handover Audit)</span>
                </span>
                <span className="text-[10px] font-bold bg-white text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                  Customer Direct Disclosure
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-white rounded-xl border border-amber-200">
                  <span className="text-[10px] font-bold text-slate-500 block uppercase">National ID (Unmasked)</span>
                  <span className="font-mono font-black text-slate-900 text-sm">
                    {selectedCustomerVaultModal.customerCnic}
                  </span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Match with physical card</span>
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-amber-200">
                  <span className="text-[10px] font-bold text-slate-500 block uppercase">Driving License #</span>
                  <span className="font-mono font-black text-slate-900 text-sm">
                    {selectedCustomerVaultModal.customerLicense}
                  </span>
                  <span className="text-[9px] text-emerald-700 block mt-0.5">Valid Motorcar / LTV</span>
                </div>
              </div>

              {/* License Preview */}
              <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center gap-3">
                <img
                  src={selectedCustomerVaultModal.licensePreview || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80'}
                  alt="License Scan"
                  className="w-14 h-10 object-cover rounded-md border shrink-0"
                />
                <div>
                  <span className="font-bold text-xs text-slate-900 block">Driving License Document Scan</span>
                  <span className="text-[10px] text-emerald-700 font-medium">✓ Uploaded by customer for direct host review</span>
                </div>
              </div>
            </div>

            {/* Handover Security Checklist */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5 text-[11px] text-slate-700">
              <span className="font-bold text-slate-900 block text-xs">Vehicle Handover Verification Checklist:</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-3.5 h-3.5 text-emerald-600 rounded" />
                <span>Physical National ID inspected & matches {selectedCustomerVaultModal.customerCnic}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-3.5 h-3.5 text-emerald-600 rounded" />
                <span>Physical original Driving License checked before giving car keys</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-3.5 h-3.5 text-emerald-600 rounded" />
                <span>Vehicle odometer reading & fuel level recorded in physical rental form</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-3.5 h-3.5 text-emerald-600 rounded" />
                <span>Refundable security deposit / payment collected directly</span>
              </label>
            </div>

            <p className="text-[10px] text-slate-500 leading-tight">
              * Protected under Pakistan Electronic Crimes Act (PECA 2016) & Electronic Transactions Ordinance (ETO 2002). Customer details are unmasked strictly for key handover security verification.
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  alert(`✅ Handover verified! Booking ${selectedCustomerVaultModal.bookingRef} marked as in-progress.`);
                  setSelectedCustomerVaultModal(null);
                }}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                ✓ Mark Keys Handed Over & Verified
              </button>
              <button
                type="button"
                onClick={() => setSelectedCustomerVaultModal(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUBSCRIPTION REQUIRED MODAL */}
      {showSubscriptionRequiredModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-2xl">
                ⚡
              </div>
              <button
                type="button"
                onClick={() => setShowSubscriptionRequiredModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900">
                Listing Saved as Pending — Subscription Required to Go LIVE
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Your vehicle has been successfully saved to your roster as <strong className="text-amber-700">Pending Approval</strong>. To make this listing LIVE on the public marketplace and start receiving customer booking calls & WhatsApp leads, please activate your subscription pass.
              </p>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 space-y-1.5 text-xs text-emerald-950">
              <div className="flex items-center gap-2 font-bold">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Unlimited direct customer phone & WhatsApp calls</span>
              </div>
              <div className="flex items-center gap-2 font-bold">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Zero commission on bookings (Keep 100% earnings)</span>
              </div>
              <div className="flex items-center gap-2 font-bold">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Super Admin / Agent verified badge on all listings</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowSubscriptionRequiredModal(false);
                  setActiveTab('subscription');
                }}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md transition cursor-pointer flex items-center justify-center gap-2"
              >
                <span>⚡ View Subscription Packages & Activate</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowSubscriptionRequiredModal(false);
                  setActiveTab('fleet');
                }}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                👀 View My Listings (Saved as Pending)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Mobile Bottom Navigation Bar */}
      <MobileNavBar />
    </div>
  );
}

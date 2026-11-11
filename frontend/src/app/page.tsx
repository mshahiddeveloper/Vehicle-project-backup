'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Car,
  Search,
  MapPin,
  Calendar,
  ShieldCheck,
  MessageCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  UserCheck,
  CreditCard,
  Building2,
  Users,
  Settings,
  ArrowRight,
  Check,
  X,
  PlusCircle,
  Sunrise,
  Sun,
  Sunset,
  Moon,
  ChevronRight,
  Share2,
  Heart,
  Upload,
  Image as ImageIcon,
  Star,
  RefreshCw,
  AlertCircle,
  SlidersHorizontal,
  ChevronLeft,
  Smartphone,
  ExternalLink,
  Award,
  Bus,
  Navigation,
  Truck,
  Package,
  User,
  HelpCircle,
  LogIn,
  Scan,
  FileText,
  Globe,
} from 'lucide-react';
import { API_BASE, formatPKR, maskCnic, maskLicense, maskPhone } from '@/lib/api';
import { COUNTRIES, CountryInfo, resolveAnyCountry } from '@/data/countries';
import {
  registerNewUser,
  loginAsDemoUser,
  getAllRegisteredUsers,
  setActiveUser,
  getActiveUser,
  authenticateUser,
  RegisteredUser,
} from '@/data/userAuth';
import { recordLead, recordClickEvent } from '@/data/activityTracker';
import { MobilePWAExperience } from '@/components/MobilePWAExperience';

export type MarketplaceCountry = CountryInfo;
const SUPPORTED_COUNTRIES: CountryInfo[] = COUNTRIES;

const DEFAULT_CATALOG_LISTINGS: any[] = [
  // ===================== SEDANS =====================
  {
    id: 'l-1',
    listingRef: 'LST-480853',
    title: 'Honda Civic Oriel Turbo 1.5 RS',
    category: 'SEDAN',
    productionYear: 2024,
    city: 'Islamabad',
    area: 'Centaurus Mall, F-8',
    dailyRate: 14000,
    dailyRateWithDriver: 16500,
    serviceType: 'CAR_RENTAL',
    transmission: 'AUTOMATIC',
    fuelType: 'PETROL',
    manufacturer: { name: 'Honda' },
    model: { name: 'Civic Oriel Turbo' },
    assignedDriver: {
      name: 'Muhammad Akram',
      phone: '+92 301 8472910',
      license: 'HTV Commercial Chauffeur',
    },
    lister: { businessName: 'Kashif Autos Islamabad', user: { phone: '+923001234567' } },
    images: [{ originalUrl: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1200&q=80' }],
  },
  {
    id: 'l-2',
    listingRef: 'LST-065123',
    title: 'Toyota Corolla Altis Grande 1.8',
    category: 'SEDAN',
    productionYear: 2024,
    city: 'Lahore',
    area: 'Gulberg III',
    dailyRate: 8500,
    dailyRateWithDriver: 11000,
    serviceType: 'CAR_RENTAL',
    transmission: 'AUTOMATIC',
    fuelType: 'PETROL',
    manufacturer: { name: 'Toyota' },
    model: { name: 'Corolla Altis Grande' },
    assignedDriver: {
      name: 'Tariq Mahmood',
      phone: '+92 301 9821045',
      license: 'LTV Certified Chauffeur',
    },
    lister: { businessName: 'Salman Rent a Car & Tours', user: { phone: '+923001234567' } },
    images: [{ originalUrl: 'https://images.unsplash.com/photo-1590362891988-f77804703088?auto=format&fit=crop&w=1200&q=80' }],
  },
  {
    id: 'l-s3',
    listingRef: 'LST-194022',
    title: 'Hyundai Elantra GLS 2.0',
    category: 'SEDAN',
    productionYear: 2023,
    city: 'Karachi',
    area: 'Clifton Block 4',
    dailyRate: 11500,
    dailyRateWithDriver: 14000,
    serviceType: 'CAR_RENTAL',
    transmission: 'AUTOMATIC',
    fuelType: 'PETROL',
    manufacturer: { name: 'Hyundai' },
    model: { name: 'Elantra GLS' },
    assignedDriver: {
      name: 'Zubair Ahmed',
      phone: '+92 313 5591024',
      license: 'LTV Executive Chauffeur',
    },
    lister: { businessName: 'Indus Prestige Fleet Karachi', user: { phone: '+923135591024' } },
    images: [{ originalUrl: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80' }],
  },
  {
    id: 'l-s4',
    listingRef: 'LST-381920',
    title: 'Changan Alsvin 1.5 Lumiere',
    category: 'SEDAN',
    productionYear: 2024,
    city: 'Rawalpindi',
    area: 'Saddar Commercial',
    dailyRate: 6500,
    dailyRateWithDriver: 9000,
    serviceType: 'CAR_RENTAL',
    transmission: 'AUTOMATIC',
    fuelType: 'PETROL',
    manufacturer: { name: 'Changan' },
    model: { name: 'Alsvin Lumiere' },
    assignedDriver: {
      name: 'Bilal Tariq',
      phone: '+92 334 8812901',
      license: 'LTV Certified',
    },
    lister: { businessName: 'Capital Drive Rentals', user: { phone: '+923348812901' } },
    images: [{ originalUrl: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1200&q=80' }],
  },

  // ===================== SUVS & 4X4 =====================
  {
    id: 'l-suv1',
    listingRef: 'LST-771920',
    title: 'Toyota Fortuner Legender 4x4 Sigma 4',
    category: 'SUV',
    productionYear: 2024,
    city: 'Islamabad',
    area: 'Blue Area / F-7',
    dailyRate: 26000,
    dailyRateWithDriver: 29000,
    serviceType: 'CAR_RENTAL',
    transmission: 'AUTOMATIC',
    fuelType: 'DIESEL',
    manufacturer: { name: 'Toyota' },
    model: { name: 'Fortuner Legender' },
    assignedDriver: {
      name: 'Malik Asif',
      phone: '+92 300 5599182',
      license: '4x4 Mountain & Highway Master',
    },
    lister: { businessName: 'Royal Pak 4x4 Club', user: { phone: '+923005599182' } },
    images: [{ originalUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80' }],
  },
  {
    id: 'l-suv2',
    listingRef: 'LST-882910',
    title: 'Toyota Land Cruiser Prado TX L',
    category: 'SUV',
    productionYear: 2023,
    city: 'Lahore',
    area: 'DHA Phase 5',
    dailyRate: 32000,
    dailyRateWithDriver: 35500,
    serviceType: 'CAR_RENTAL',
    transmission: 'AUTOMATIC',
    fuelType: 'PETROL',
    manufacturer: { name: 'Toyota' },
    model: { name: 'Prado TX L' },
    assignedDriver: {
      name: 'Farhan Munir',
      phone: '+92 321 4455667',
      license: 'VIP Security & Escort Driver',
    },
    lister: { businessName: 'Executive Motors Lahore', user: { phone: '+923214455667' } },
    images: [{ originalUrl: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80' }],
  },
  {
    id: 'l-suv3',
    listingRef: 'LST-391029',
    title: 'KIA Sportage AWD 2.0',
    category: 'SUV',
    productionYear: 2024,
    city: 'Lahore',
    area: 'Model Town Link Road',
    dailyRate: 15500,
    dailyRateWithDriver: 18000,
    serviceType: 'CAR_RENTAL',
    transmission: 'AUTOMATIC',
    fuelType: 'PETROL',
    manufacturer: { name: 'KIA' },
    model: { name: 'Sportage AWD' },
    assignedDriver: {
      name: 'Kamran Ali',
      phone: '+92 304 9912837',
      license: 'LTV Chauffeur',
    },
    lister: { businessName: 'Premium Wheels Punjab', user: { phone: '+923049912837' } },
    images: [{ originalUrl: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80' }],
  },
  {
    id: 'l-suv4',
    listingRef: 'LST-551029',
    title: 'Hyundai Tucson AWD Ultimate',
    category: 'SUV',
    productionYear: 2024,
    city: 'Karachi',
    area: 'DHA Phase 6',
    dailyRate: 15000,
    dailyRateWithDriver: 17500,
    serviceType: 'CAR_RENTAL',
    transmission: 'AUTOMATIC',
    fuelType: 'PETROL',
    manufacturer: { name: 'Hyundai' },
    model: { name: 'Tucson AWD' },
    assignedDriver: {
      name: 'Arshad Qureshi',
      phone: '+92 311 2233445',
      license: 'Coastal Highway Certified',
    },
    lister: { businessName: 'Coastal Cruisers Karachi', user: { phone: '+923112233445' } },
    images: [{ originalUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80' }],
  },

  // ===================== LUXURY & VIP =====================
  {
    id: 'l-lux1',
    listingRef: 'LST-991001',
    title: 'Toyota Land Cruiser V8 ZX (VIP Protocol)',
    category: 'LUXURY',
    productionYear: 2023,
    city: 'Islamabad',
    area: 'Serena Hotel / Diplomatic Enclave',
    dailyRate: 55000,
    dailyRateWithDriver: 60000,
    serviceType: 'CAR_RENTAL',
    transmission: 'AUTOMATIC',
    fuelType: 'PETROL',
    manufacturer: { name: 'Toyota' },
    model: { name: 'Land Cruiser V8 ZX' },
    assignedDriver: {
      name: 'Capt. Javed Iqbal',
      phone: '+92 300 8877665',
      license: 'State Protocol Master Driver',
    },
    lister: { businessName: 'VIP Protocol Fleet Services', user: { phone: '+923008877665' } },
    images: [{ originalUrl: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1200&q=80' }],
  },
  {
    id: 'l-lux2',
    listingRef: 'LST-992002',
    title: 'Mercedes-Benz C-Class C200 AMG',
    category: 'LUXURY',
    productionYear: 2023,
    city: 'Lahore',
    area: 'MM Alam Road, Gulberg',
    dailyRate: 48000,
    dailyRateWithDriver: 53000,
    serviceType: 'CAR_RENTAL',
    transmission: 'AUTOMATIC',
    fuelType: 'PETROL',
    manufacturer: { name: 'Mercedes-Benz' },
    model: { name: 'C-Class C200' },
    assignedDriver: {
      name: 'Rizwan Sheikh',
      phone: '+92 322 7788990',
      license: 'Five Star Luxury Chauffeur',
    },
    lister: { businessName: 'Crown Chauffeur Limousines', user: { phone: '+923227788990' } },
    images: [{ originalUrl: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1200&q=80' }],
  },
  {
    id: 'l-lux3',
    listingRef: 'LST-993003',
    title: 'Audi A6 Matrix TFSI Executive',
    category: 'LUXURY',
    productionYear: 2024,
    city: 'Karachi',
    area: 'Clifton / KDA Scheme 1',
    dailyRate: 52000,
    dailyRateWithDriver: 57000,
    serviceType: 'CAR_RENTAL',
    transmission: 'AUTOMATIC',
    fuelType: 'PETROL',
    manufacturer: { name: 'Audi' },
    model: { name: 'A6 Matrix TFSI' },
    assignedDriver: {
      name: 'Naeem Shah',
      phone: '+92 333 4455667',
      license: 'Executive VIP Escort',
    },
    lister: { businessName: 'Presidential Rentals KHI', user: { phone: '+923334455667' } },
    images: [{ originalUrl: 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&w=1200&q=80' }],
  },

  // ===================== VANS & HIACE =====================
  {
    id: 'l-van1',
    listingRef: 'LST-772910',
    title: 'Toyota HiAce Grand Cabin Executive (14 Seats)',
    category: 'VAN',
    productionYear: 2024,
    city: 'Lahore',
    area: 'Thokar Niaz Baig / Canal Rd',
    dailyRate: 16000,
    dailyRateWithDriver: 18500,
    serviceType: 'CAR_RENTAL',
    transmission: 'AUTOMATIC',
    fuelType: 'DIESEL',
    manufacturer: { name: 'Toyota' },
    model: { name: 'HiAce Grand Cabin' },
    assignedDriver: {
      name: 'Tariq Mahmood',
      phone: '+92 301 9821045',
      license: 'PSV Qualified Chauffeur',
    },
    lister: { businessName: 'Al-Makkah Luxury Vans', user: { phone: '+923019821045' } },
    images: [{ originalUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80' }],
  },
  {
    id: 'l-van2',
    listingRef: 'LST-773820',
    title: 'Suzuki APV GLX 7-Seater AC Family Van',
    category: 'VAN',
    productionYear: 2023,
    city: 'Rawalpindi',
    area: 'Faizabad / Murree Road',
    dailyRate: 8000,
    dailyRateWithDriver: 10500,
    serviceType: 'CAR_RENTAL',
    transmission: 'MANUAL',
    fuelType: 'PETROL',
    manufacturer: { name: 'Suzuki' },
    model: { name: 'APV GLX Family Van' },
    assignedDriver: {
      name: 'Imran Shah',
      phone: '+92 312 8844221',
      license: 'LTV Hill Area Specialist',
    },
    lister: { businessName: 'Twin Cities Family Vans', user: { phone: '+923128844221' } },
    images: [{ originalUrl: 'https://images.unsplash.com/photo-1559297434-fae8a1916a79?auto=format&fit=crop&w=1200&q=80' }],
  },
  {
    id: 'l-van3',
    listingRef: 'LST-774911',
    title: 'Hyundai Starex VIP Lounge (9 Seats)',
    category: 'VAN',
    productionYear: 2024,
    city: 'Islamabad',
    area: 'G-9 Markaz / Peshawar Morr',
    dailyRate: 19000,
    dailyRateWithDriver: 22000,
    serviceType: 'CAR_RENTAL',
    transmission: 'AUTOMATIC',
    fuelType: 'DIESEL',
    manufacturer: { name: 'Hyundai' },
    model: { name: 'Starex Grand Royale' },
    assignedDriver: {
      name: 'Zeeshan Abbasi',
      phone: '+92 345 5566778',
      license: 'VIP Tourism Chauffeur',
    },
    lister: { businessName: 'Falcon Chauffeurs Islamabad', user: { phone: '+923455566778' } },
    images: [{ originalUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80' }],
  },

  // ===================== BUDGET & ALTO =====================
  {
    id: 'l-eco1',
    listingRef: 'LST-110291',
    title: 'Suzuki Alto VXR AGS 660cc',
    category: 'ECONOMY',
    productionYear: 2024,
    city: 'Lahore',
    area: 'Johar Town / Expo Center',
    dailyRate: 4200,
    dailyRateWithDriver: 6200,
    serviceType: 'CAR_RENTAL',
    transmission: 'AUTOMATIC',
    fuelType: 'PETROL',
    manufacturer: { name: 'Suzuki' },
    model: { name: 'Alto VXR AGS' },
    assignedDriver: {
      name: 'Hamza Rafiq',
      phone: '+92 305 6677889',
      license: 'LTV Clean Record',
    },
    lister: { businessName: 'Budget City Cars Lahore', user: { phone: '+923056677889' } },
    images: [{ originalUrl: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&w=1200&q=80' }],
  },
  {
    id: 'l-eco2',
    listingRef: 'LST-110392',
    title: 'Suzuki Cultus VXL AGS 1000cc',
    category: 'ECONOMY',
    productionYear: 2023,
    city: 'Islamabad',
    area: 'G-10 Markaz',
    dailyRate: 5000,
    dailyRateWithDriver: 7000,
    serviceType: 'CAR_RENTAL',
    transmission: 'AUTOMATIC',
    fuelType: 'PETROL',
    manufacturer: { name: 'Suzuki' },
    model: { name: 'Cultus VXL AGS' },
    assignedDriver: {
      name: 'Sajjad Ali',
      phone: '+92 300 1122334',
      license: 'LTV Safe Driver',
    },
    lister: { businessName: 'QuickRent Islamabad', user: { phone: '+923001122334' } },
    images: [{ originalUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80' }],
  },
  {
    id: 'l-eco3',
    listingRef: 'LST-110493',
    title: 'Suzuki Wagon R VXL',
    category: 'ECONOMY',
    productionYear: 2023,
    city: 'Karachi',
    area: 'Gulshan-e-Iqbal Block 13D',
    dailyRate: 4500,
    dailyRateWithDriver: 6500,
    serviceType: 'CAR_RENTAL',
    transmission: 'MANUAL',
    fuelType: 'PETROL',
    manufacturer: { name: 'Suzuki' },
    model: { name: 'Wagon R VXL' },
    assignedDriver: {
      name: 'Danish Raza',
      phone: '+92 331 9988776',
      license: 'Karachi City Expert',
    },
    lister: { businessName: 'Smart Choice Rentals', user: { phone: '+923319988776' } },
    images: [{ originalUrl: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80' }],
  },
  {
    id: 'l-eco4',
    listingRef: 'LST-110594',
    title: 'Suzuki Swift GLX 1.2 CVT',
    category: 'ECONOMY',
    productionYear: 2024,
    city: 'Rawalpindi',
    area: 'Bahria Town Phase 4',
    dailyRate: 7000,
    dailyRateWithDriver: 9500,
    serviceType: 'CAR_RENTAL',
    transmission: 'AUTOMATIC',
    fuelType: 'PETROL',
    manufacturer: { name: 'Suzuki' },
    model: { name: 'Swift GLX CVT' },
    assignedDriver: {
      name: 'Waqas Ahmed',
      phone: '+92 333 1239874',
      license: 'LTV Chauffeur',
    },
    lister: { businessName: 'Metro Fleet Hub', user: { phone: '+923331239874' } },
    images: [{ originalUrl: 'https://images.unsplash.com/photo-1508974239320-0a029497e820?auto=format&fit=crop&w=1200&q=80' }],
  },

  // ===================== INTERNATIONAL FLEET: GERMANY (DE) =====================
  {
    id: 'l-de-1',
    listingRef: 'LST-DE-8821',
    title: 'BMW 320i M-Sport 2024',
    category: 'SEDAN',
    productionYear: 2024,
    city: 'Berlin',
    area: 'Mitte / Alexanderplatz',
    country: 'DE',
    currency: 'EUR',
    symbol: '€',
    dailyRate: 65,
    dailyRateWithDriver: 95,
    serviceType: 'CAR_RENTAL',
    transmission: 'AUTOMATIC',
    fuelType: 'PETROL',
    manufacturer: { name: 'BMW' },
    model: { name: '320i M-Sport' },
    assignedDriver: {
      name: 'Hans Müller',
      phone: '+49 151 2345678',
      license: 'EU Class B Certified Chauffeur',
    },
    lister: { businessName: 'Berlin Premium Fleet GmbH', user: { phone: '+491512345678' } },
    images: [{ originalUrl: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80' }],
  },
  {
    id: 'l-de-2',
    listingRef: 'LST-DE-9102',
    title: 'Mercedes-Benz E 220d Exclusive 2024',
    category: 'LUXURY',
    productionYear: 2024,
    city: 'Munich',
    area: 'Schwabing / Leopoldstraße',
    country: 'DE',
    currency: 'EUR',
    symbol: '€',
    dailyRate: 85,
    dailyRateWithDriver: 120,
    serviceType: 'CAR_RENTAL',
    transmission: 'AUTOMATIC',
    fuelType: 'DIESEL',
    manufacturer: { name: 'Mercedes-Benz' },
    model: { name: 'E 220d Exclusive' },
    assignedDriver: {
      name: 'Klaus Weber',
      phone: '+49 170 9876543',
      license: 'Chauffeur Chauffeurschein DE',
    },
    lister: { businessName: 'Bavaria Chauffeur Service', user: { phone: '+491709876543' } },
    images: [{ originalUrl: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80' }],
  },
  {
    id: 'l-de-3',
    listingRef: 'LST-DE-4412',
    title: 'Audi A6 Avant Quattro 2024',
    category: 'SEDAN',
    productionYear: 2024,
    city: 'Frankfurt',
    area: 'Bankenviertel / Mainzer Landstraße',
    country: 'DE',
    currency: 'EUR',
    symbol: '€',
    dailyRate: 90,
    dailyRateWithDriver: 130,
    serviceType: 'CAR_RENTAL',
    transmission: 'AUTOMATIC',
    fuelType: 'HYBRID',
    manufacturer: { name: 'Audi' },
    model: { name: 'A6 Avant Quattro' },
    assignedDriver: {
      name: 'Stefan Meyer',
      phone: '+49 160 5544332',
      license: 'EU Commercial Driver',
    },
    lister: { businessName: 'Hessen Executive Mobility', user: { phone: '+491605544332' } },
    images: [{ originalUrl: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1200&q=80' }],
  },
  {
    id: 'l-de-4',
    listingRef: 'LST-DE-7782',
    title: 'Volkswagen Golf 8 TSI Style 2024',
    category: 'ECONOMY',
    productionYear: 2024,
    city: 'Hamburg',
    area: 'Altona / HafenCity',
    country: 'DE',
    currency: 'EUR',
    symbol: '€',
    dailyRate: 45,
    dailyRateWithDriver: 75,
    serviceType: 'CAR_RENTAL',
    transmission: 'AUTOMATIC',
    fuelType: 'PETROL',
    manufacturer: { name: 'Volkswagen' },
    model: { name: 'Golf 8 TSI Style' },
    assignedDriver: {
      name: 'Lukas Fischer',
      phone: '+49 152 7788990',
      license: 'Class B Chauffeur',
    },
    lister: { businessName: 'Hanseatic City Fleet', user: { phone: '+491527788990' } },
    images: [{ originalUrl: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1200&q=80' }],
  },
  {
    id: 'l-de-5',
    listingRef: 'LST-DE-3391',
    title: 'Mercedes-Benz V-Class VIP Chauffeur (7 Seats)',
    category: 'VAN',
    productionYear: 2024,
    city: 'Berlin',
    area: 'Potsdamer Platz / Kurfürstendamm',
    country: 'DE',
    currency: 'EUR',
    symbol: '€',
    dailyRate: 130,
    dailyRateWithDriver: 165,
    serviceType: 'CAR_RENTAL',
    transmission: 'AUTOMATIC',
    fuelType: 'DIESEL',
    manufacturer: { name: 'Mercedes-Benz' },
    model: { name: 'V-Class Exclusive' },
    assignedDriver: {
      name: 'Jürgen Klein',
      phone: '+49 171 1122334',
      license: 'P-Schein VIP Chauffeur',
    },
    lister: { businessName: 'Berlin VIP Vanpool Ltd', user: { phone: '+491711122334' } },
    images: [{ originalUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80' }],
  },

  // ===================== INTERNATIONAL FLEET: UAE (AE) =====================
  {
    id: 'l-ae-1',
    listingRef: 'LST-AE-9901',
    title: 'Mercedes-AMG G63 Night Package 2024',
    category: 'SUV',
    productionYear: 2024,
    city: 'Dubai',
    area: 'Downtown / Burj Khalifa',
    country: 'AE',
    currency: 'AED',
    symbol: 'AED',
    dailyRate: 1200,
    dailyRateWithDriver: 1500,
    serviceType: 'CAR_RENTAL',
    transmission: 'AUTOMATIC',
    fuelType: 'PETROL',
    manufacturer: { name: 'Mercedes-Benz' },
    model: { name: 'G63 AMG' },
    assignedDriver: {
      name: 'Tariq Al-Hashimi',
      phone: '+971 50 1234567',
      license: 'RTA Certified Executive Chauffeur',
    },
    lister: { businessName: 'Emirates Prestige Supercars Dubai', user: { phone: '+971501234567' } },
    images: [{ originalUrl: 'https://images.unsplash.com/photo-1520050206274-a1ae44613e6d?auto=format&fit=crop&w=1200&q=80' }],
  },
  {
    id: 'l-ae-2',
    listingRef: 'LST-AE-8842',
    title: 'Toyota Land Cruiser 300 VXR Twin Turbo 2024',
    category: 'SUV',
    productionYear: 2024,
    city: 'Abu Dhabi',
    area: 'Corniche / Al Bateen',
    country: 'AE',
    currency: 'AED',
    symbol: 'AED',
    dailyRate: 650,
    dailyRateWithDriver: 850,
    serviceType: 'CAR_RENTAL',
    transmission: 'AUTOMATIC',
    fuelType: 'PETROL',
    manufacturer: { name: 'Toyota' },
    model: { name: 'Land Cruiser 300 VXR' },
    assignedDriver: {
      name: 'Mansoor Al-Zaabi',
      phone: '+971 55 9988776',
      license: 'Abu Dhabi Commercial Chauffeur',
    },
    lister: { businessName: 'Capital Luxury Fleet Abu Dhabi', user: { phone: '+971559988776' } },
    images: [{ originalUrl: 'https://images.unsplash.com/photo-1594502184342-2e12f877aa73?auto=format&fit=crop&w=1200&q=80' }],
  },

  // ===================== INTERNATIONAL FLEET: UNITED KINGDOM (GB) =====================
  {
    id: 'l-gb-1',
    listingRef: 'LST-GB-7711',
    title: 'Mercedes-Benz S350d Chauffeur Executive 2024',
    category: 'LUXURY',
    productionYear: 2024,
    city: 'London',
    area: 'Mayfair / Park Lane',
    country: 'GB',
    currency: 'GBP',
    symbol: '£',
    dailyRate: 160,
    dailyRateWithDriver: 220,
    serviceType: 'CAR_RENTAL',
    transmission: 'AUTOMATIC',
    fuelType: 'HYBRID',
    manufacturer: { name: 'Mercedes-Benz' },
    model: { name: 'S-Class S350d' },
    assignedDriver: {
      name: 'James Wilson',
      phone: '+44 7700 900123',
      license: 'TfL Licensed PCO Executive Driver',
    },
    lister: { businessName: 'London Royal Chauffeurs Ltd', user: { phone: '+447700900123' } },
    images: [{ originalUrl: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1200&q=80' }],
  },

  // ===================== INTERNATIONAL FLEET: UNITED STATES (US) =====================
  {
    id: 'l-us-1',
    listingRef: 'LST-US-5520',
    title: 'Cadillac Escalade ESV Sport Platinum 2024',
    category: 'SUV',
    productionYear: 2024,
    city: 'New York',
    area: 'Manhattan / Upper East Side',
    country: 'US',
    currency: 'USD',
    symbol: '$',
    dailyRate: 220,
    dailyRateWithDriver: 310,
    serviceType: 'CAR_RENTAL',
    transmission: 'AUTOMATIC',
    fuelType: 'PETROL',
    manufacturer: { name: 'Cadillac' },
    model: { name: 'Escalade ESV Platinum' },
    assignedDriver: {
      name: 'Michael Vance',
      phone: '+1 212 555 0192',
      license: 'NYC TLC Licensed Livery Driver',
    },
    lister: { businessName: 'Manhattan VIP Fleet Inc', user: { phone: '+12125550192' } },
    images: [{ originalUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80' }],
  },

  // ===================== PICK AND DROP ROUTES =====================
  {
    id: 'l-3',
    listingRef: 'PND-LHR-001',
    title: 'Johar Town ➔ Gulberg Main Blvd / Mall Road',
    productionYear: 2023,
    city: 'Lahore',
    area: 'Johar Town ➔ Gulberg ➔ Mall Road',
    routeDetails: 'Johar Town (07:20) ➔ Shaukat Khanum (07:35) ➔ Campus Bridge (07:50) ➔ Muslim Town (08:05) ➔ Gulberg (08:20) ➔ Mall Road (08:35)',
    morningPickupTime: '07:20 AM',
    eveningDropTime: '05:30 PM',
    monthlyRatePerSeat: 8500,
    dailySeatRate: 450,
    totalSeats: 14,
    availableSeats: 3,
    targetAudience: 'Office & Bank Executives',
    acStatus: 'Chilled Dual AC',
    serviceType: 'PICK_AND_DROP',
    transmission: 'MANUAL',
    manufacturer: { name: 'Toyota' },
    model: { name: 'HiAce Grand Cabin (14 Seats)' },
    assignedDriver: {
      name: 'Tariq Mahmood',
      phone: '+92 301 9821045',
      license: 'PSV Certified Chauffeur',
    },
    routeStops: [
      { stop: 'Johar Town G-1 Market', time: '07:20 AM' },
      { stop: 'Shaukat Khanum Chowk', time: '07:35 AM' },
      { stop: 'Campus Bridge / Canal Rd', time: '07:50 AM' },
      { stop: 'Muslim Town Morr', time: '08:05 AM' },
      { stop: 'Gulberg Main Blvd (Siddiq Trade)', time: '08:20 AM' },
      { stop: 'Mall Road / Charing Cross', time: '08:35 AM' },
    ],
    lister: { businessName: 'Al-Makkah Commute Express', user: { phone: '+923214409124' } },
    images: [{ originalUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80' }],
  },
  {
    id: 'l-3b',
    listingRef: 'PND-ISB-002',
    title: 'Rawalpindi Saddar ➔ Islamabad Blue Area / F-8',
    productionYear: 2024,
    city: 'Islamabad',
    area: 'Rawalpindi Saddar ➔ Faizabad ➔ Blue Area ➔ F-8',
    routeDetails: 'Saddar (07:15) ➔ Chandni Chowk (07:30) ➔ Faizabad (07:45) ➔ Zero Point (08:00) ➔ Blue Area (08:15) ➔ F-8 Markaz (08:30)',
    morningPickupTime: '07:15 AM',
    eveningDropTime: '05:00 PM',
    monthlyRatePerSeat: 9500,
    dailySeatRate: 500,
    totalSeats: 14,
    availableSeats: 4,
    targetAudience: 'Corporate Staff & Ministry Employees',
    acStatus: 'Chilled Dual AC',
    serviceType: 'PICK_AND_DROP',
    transmission: 'MANUAL',
    manufacturer: { name: 'Toyota' },
    model: { name: 'HiAce Grand Cabin (14 Seats)' },
    assignedDriver: {
      name: 'Nadeem Akhtar',
      phone: '+92 333 5510291',
      license: 'PSV Coaster Special',
    },
    routeStops: [
      { stop: 'Saddar Metro Station, Rawalpindi', time: '07:15 AM' },
      { stop: 'Chandni Chowk Murree Road', time: '07:30 AM' },
      { stop: 'Faizabad Interchange', time: '07:45 AM' },
      { stop: 'Zero Point Islamabad', time: '08:00 AM' },
      { stop: 'Blue Area (Stock Exchange)', time: '08:15 AM' },
      { stop: 'F-8 Markaz / Islamabad Courts', time: '08:30 AM' },
    ],
    lister: { businessName: 'Twin Cities Executive Vanpool', user: { phone: '+923335510291' } },
    images: [{ originalUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80' }],
  },
  {
    id: 'l-3c',
    listingRef: 'PND-ISB-003',
    title: 'Bahria Town Phase 1-8 ➔ NUST / FAST / H-12',
    productionYear: 2024,
    city: 'Islamabad',
    area: 'Bahria Town ➔ Soan Bridge ➔ FAST ➔ NUST H-12',
    routeDetails: 'Bahria Town Ph 4 (07:00) ➔ Soan Bridge (07:20) ➔ T-Chowk (07:35) ➔ Kachehri (07:55) ➔ FAST Campus (08:20) ➔ NUST Gate 2 (08:35)',
    morningPickupTime: '07:00 AM',
    eveningDropTime: '04:30 PM',
    monthlyRatePerSeat: 11000,
    dailySeatRate: 600,
    totalSeats: 22,
    availableSeats: 6,
    targetAudience: 'University & College Students',
    acStatus: 'Chilled Dual AC',
    serviceType: 'PICK_AND_DROP',
    transmission: 'MANUAL',
    manufacturer: { name: 'Toyota' },
    model: { name: 'Coaster Executive (22 Seats)' },
    assignedDriver: {
      name: 'Sheraz Ali',
      phone: '+92 321 8812049',
      license: 'PSV Heavy Duty Bus Specialist',
    },
    routeStops: [
      { stop: 'Bahria Town Phase 4 Civic Center', time: '07:00 AM' },
      { stop: 'Soan Bridge / GT Road', time: '07:20 AM' },
      { stop: 'Rawat / T-Chowk', time: '07:35 AM' },
      { stop: 'Kachehri Chowk Rawalpindi', time: '07:55 AM' },
      { stop: 'FAST University Campus H-9', time: '08:20 AM' },
      { stop: 'NUST Gate 2 H-12 Islamabad', time: '08:35 AM' },
    ],
    lister: { businessName: 'UniRoute Student Transport', user: { phone: '+923218812049' } },
    images: [{ originalUrl: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=1200&q=80' }],
  },
  {
    id: 'l-3d',
    listingRef: 'PND-KHI-004',
    title: 'DHA Phase 5 / Clifton ➔ I.I. Chundrigar Road',
    productionYear: 2024,
    city: 'Karachi',
    area: 'DHA 5 ➔ Teen Talwar ➔ Metropole ➔ I.I. Chundrigar',
    routeDetails: 'DHA 5 (07:45) ➔ Clifton Teen Talwar (08:00) ➔ Metropole (08:15) ➔ Shaheen Complex (08:30) ➔ I.I. Chundrigar Tower (08:45)',
    morningPickupTime: '07:45 AM',
    eveningDropTime: '06:00 PM',
    monthlyRatePerSeat: 12000,
    dailySeatRate: 650,
    totalSeats: 7,
    availableSeats: 2,
    targetAudience: 'Women Working Group & Corporate',
    acStatus: 'Chilled AC',
    serviceType: 'PICK_AND_DROP',
    transmission: 'AUTOMATIC',
    manufacturer: { name: 'Suzuki' },
    model: { name: 'APV GLX Executive (7 Seats)' },
    assignedDriver: {
      name: 'Muhammad Imran',
      phone: '+92 312 4491029',
      license: 'VIP Chauffeur Specialist',
    },
    routeStops: [
      { stop: 'Khayaban-e-Shamsheer DHA Phase 5', time: '07:45 AM' },
      { stop: 'Clifton Teen Talwar', time: '08:00 AM' },
      { stop: 'Metropole Hotel / Club Road', time: '08:15 AM' },
      { stop: 'Shaheen Complex MR Kiyani Rd', time: '08:30 AM' },
      { stop: 'I.I. Chundrigar Road Tower', time: '08:45 AM' },
    ],
    lister: { businessName: 'Karachi Metro Vanpool', user: { phone: '+923124491029' } },
    images: [{ originalUrl: 'https://images.unsplash.com/photo-1559297434-fae8a1916a79?auto=format&fit=crop&w=1200&q=80' }],
  },

  // ===================== CITY TO CITY =====================
  {
    id: 'l-4',
    listingRef: 'CTC-2026-001',
    productionYear: 2024,
    originCity: 'Lahore',
    destinationCity: 'Islamabad',
    city: 'Lahore',
    pricePerSeat: 2800,
    dailyRate: 14000,
    availableSeats: 4,
    serviceType: 'CITY_TO_CITY',
    transmission: 'AUTOMATIC',
    manufacturer: { name: 'Toyota' },
    model: { name: 'Corolla Altis (M-2 Express)' },
    assignedDriver: {
      name: 'Zahid Hussain',
      phone: '+92 300 7654321',
      license: 'Motorway Qualified Chauffeur',
    },
    lister: { businessName: 'Motorway Express Rides', user: { phone: '+923007654321' } },
    images: [{ originalUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80' }],
  },

  // ===================== HOME SHIFTING & CARGO =====================
  {
    id: 'l-5',
    listingRef: 'SHF-2026-001',
    productionYear: 2023,
    city: 'Lahore',
    area: 'All Lahore & Intercity Coverage',
    dailyRate: 4500,
    movingCapacityTons: 2.5,
    helpersAvailable: true,
    helperRate: 1500,
    serviceType: 'GOODS_TRANSPORT',
    transmission: 'MANUAL',
    manufacturer: { name: 'Hyundai' },
    model: { name: 'Shehzore D-100 Shifting Truck' },
    assignedDriver: {
      name: 'Aslam Khan',
      phone: '+92 302 8819204',
      license: 'HTV Heavy Goods Driver',
    },
    lister: { businessName: 'Pak Movers & Shifting Logistics', user: { phone: '+923009988776' } },
    images: [{ originalUrl: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1200&q=80' }],
  },
];

function detectUserCountry(): CountryInfo {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (tz.includes('Karachi') || tz.includes('Asia/Karachi')) return resolveAnyCountry('PK');
    if (tz.includes('Berlin') || tz.includes('Munich') || tz.includes('Europe/Berlin')) return resolveAnyCountry('DE');
    if (tz.includes('Dubai') || tz.includes('Asia/Dubai')) return resolveAnyCountry('AE');
    if (tz.includes('London') || tz.includes('Europe/London')) return resolveAnyCountry('GB');
    if (tz.includes('Riyadh') || tz.includes('Asia/Riyadh')) return resolveAnyCountry('SA');
    if (tz.includes('New_York') || tz.includes('Chicago') || tz.includes('Los_Angeles') || tz.includes('America/')) return resolveAnyCountry('US');
    if (tz.includes('Toronto') || tz.includes('Vancouver')) return resolveAnyCountry('CA');
    if (tz.includes('Paris') || tz.includes('Europe/Paris')) return resolveAnyCountry('FR');
    if (tz.includes('Istanbul') || tz.includes('Asia/Istanbul')) return resolveAnyCountry('TR');
  } catch (e) {}
  return resolveAnyCountry('PK');
}

export default function PublicMarketplaceHome() {
  // Country Localization State (Auto-detected from IP)
  const [selectedCountry, setSelectedCountry] = useState<CountryInfo>(resolveAnyCountry('PK'));
  const [detectedCountryNotice, setDetectedCountryNotice] = useState(false);
  const [detectedMessageText, setDetectedMessageText] = useState('');
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifySuccess, setNotifySuccess] = useState(false);

  // Customer Profile Persistence & 1-Click Verification State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerCnic, setCustomerCnic] = useState('');
  const [customerLicense, setCustomerLicense] = useState('');
  const [isCustomerProfileSaved, setIsCustomerProfileSaved] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);

  // Quick Verification Modal when Lister requires details before Direct Contact
  const [directContactPendingVehicle, setDirectContactPendingVehicle] = useState<any | null>(null);
  const [directContactPendingDriver, setDirectContactPendingDriver] = useState<any | null>(null);

  // Load customer profile from local storage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('safarpk_saved_customer_profile');
      if (stored) {
        const p = JSON.parse(stored);
        if (p.name) setCustomerName(p.name);
        if (p.phone) setCustomerPhone(p.phone);
        if (p.idNumber) setCustomerCnic(p.idNumber);
        if (p.licenseNumber) setCustomerLicense(p.licenseNumber);
        setIsCustomerProfileSaved(true);
      } else {
        const authUser = localStorage.getItem('safarpk_auth_user');
        if (authUser) {
          const u = JSON.parse(authUser);
          if (u.name) setCustomerName(u.name);
          if (u.phone) setCustomerPhone(u.phone);
        }
      }
    } catch (e) {}
  }, []);

  const handleSaveCustomerProfile = (name: string, phone: string, idNum?: string, licNum?: string) => {
    const prof = {
      name: name.trim(),
      phone: phone.trim(),
      idNumber: (idNum !== undefined ? idNum : customerCnic).trim(),
      licenseNumber: (licNum !== undefined ? licNum : customerLicense).trim(),
    };
    setCustomerName(prof.name);
    setCustomerPhone(prof.phone);
    if (idNum !== undefined) setCustomerCnic(idNum);
    if (licNum !== undefined) setCustomerLicense(licNum);
    setIsCustomerProfileSaved(true);
    try {
      localStorage.setItem('safarpk_saved_customer_profile', JSON.stringify(prof));
    } catch (e) {}
  };

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setBookingVehicle(null);
        setBookingSuccessMsg(null);
        setDetailVehicle(null);
        setShowAuthModal(false);
        setShowOnboardingModal(false);
        setShowMutualDocModal(false);
        setDirectContactPendingVehicle(null);
        setDirectContactPendingDriver(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-detect visitor country via Client IP / Timezone
  useEffect(() => {
    let isMounted = true;
    const detectCountryFromIP = async () => {
      // 1. Direct URL query param override (e.g. ?country=DE, ?country=US, ?country=AE)
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const paramCountry = urlParams.get('country');
        if (paramCountry) {
          const resolved = resolveAnyCountry(paramCountry);
          if (isMounted) {
            setSelectedCountry(resolved);
            setSearchCity(resolved.defaultCity);
            localStorage.setItem('safarpk_selected_country', JSON.stringify(resolved));
            setDetectedMessageText(`Marketplace localized to ${resolved.flag} ${resolved.name}. Localized currency (${resolved.symbol} ${resolved.currency}) & regional inventory active.`);
            setDetectedCountryNotice(true);
          }
          return;
        }
      }

      // 2. LIVE IP Geolocation lookup — checked on every visit & VPN toggle
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);
        const res = await fetch('https://api.country.is/', { signal: controller.signal }).catch(() => null);
        clearTimeout(timeoutId);

        if (res && res.ok) {
          const data = await res.json();
          const countryCode = data?.country?.toUpperCase();
          if (countryCode && isMounted) {
            const resolved = resolveAnyCountry(countryCode);
            setSelectedCountry(resolved);
            setSearchCity(resolved.defaultCity);
            localStorage.setItem('safarpk_selected_country', JSON.stringify(resolved));
            localStorage.setItem('safarpk_detected_ip', countryCode);

            // Sync URL query param dynamically without reloading
            if (typeof window !== 'undefined') {
              const currentUrl = new URL(window.location.href);
              if (currentUrl.searchParams.get('country') !== countryCode) {
                currentUrl.searchParams.set('country', countryCode);
                window.history.replaceState({}, '', currentUrl.toString());
              }
            }

            setDetectedMessageText(`Auto-detected location: ${resolved.flag} ${resolved.name}. Localized currency (${resolved.symbol} ${resolved.currency}) & regional regulations active.`);
            setDetectedCountryNotice(true);
            return;
          }
        }
      } catch (e) {}

      // 3. Fallback: stored country or timezone
      if (isMounted) {
        try {
          const stored = localStorage.getItem('safarpk_selected_country');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed?.code) {
              const resolved = resolveAnyCountry(parsed.code);
              setSelectedCountry(resolved);
              setSearchCity(resolved.defaultCity);
              return;
            }
          }
        } catch (e) {}

        const detected = detectUserCountry();
        setSelectedCountry(detected);
        setSearchCity(detected.defaultCity);
      }
    };

    detectCountryFromIP();
    return () => {
      isMounted = false;
    };
  }, []);

  // Public Service Channels
  const [selectedService, setSelectedService] = useState<
    'CAR_RENTAL' | 'HIRE_DRIVER' | 'CITY_TO_CITY' | 'PICK_AND_DROP' | 'GOODS_TRANSPORT'
  >('CAR_RENTAL');

  // Search & Filter State
  const [searchCity, setSearchCity] = useState('All Pakistan');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const [filterStartDate, setFilterStartDate] = useState(todayStr);

  // Time of Day Pakistani Greeting State
  const [currentTimeStr, setCurrentTimeStr] = useState('');
  const [timeGreeting, setTimeGreeting] = useState<{
    text: string;
    icon: string;
    sub: string;
    badgeColor: string;
  }>({
    text: 'Dopehar Bakhair · Good Afternoon',
    icon: '☀️',
    sub: 'Verified car rentals, intercity rides, and home moving',
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  });

  // Master Listings & Drivers Data
  const [listings, setListings] = useState<any[]>(DEFAULT_CATALOG_LISTINGS);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedListingIds, setSavedListingIds] = useState<string[]>([]);

  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (savedListingIds.includes(id)) {
      setSavedListingIds(savedListingIds.filter((item) => item !== id));
    } else {
      setSavedListingIds([...savedListingIds, id]);
    }
  };

  // Modals State
  const [detailVehicle, setDetailVehicle] = useState<any | null>(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [bookingVehicle, setBookingVehicle] = useState<any | null>(null);
  const [hireDriverModal, setHireDriverModal] = useState<any | null>(null);
  const [pndModalVehicle, setPndModalVehicle] = useState<any | null>(null);
  const [ctcModalVehicle, setCtcModalVehicle] = useState<any | null>(null);
  const [shfModalVehicle, setShfModalVehicle] = useState<any | null>(null);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Platform Master Switches State (Synced with Super Admin)
  const [platformModules, setPlatformModules] = useState({
    carRental: true,
    pickAndDrop: true,
    cityToCity: true,
    homeShifting: true,
    hireDriver: true,
  });

  // Smart Auth State (Auto-Role Detection on Login)
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [loginPhone, setLoginPhone] = useState('+92 300 8472910');
  const [loginPassword, setLoginPassword] = useState('password123');
  const [registerRole, setRegisterRole] = useState<'CUSTOMER' | 'LISTER' | 'DRIVER' | 'PICK_DROP' | 'SHIFTING'>('CUSTOMER');
  const [regName, setRegName] = useState('');
  const [regBusinessName, setRegBusinessName] = useState('');
  const [regPhone, setRegPhone] = useState('+92 300 ');
  const [regEmail, setRegEmail] = useState('');
  const [regCity, setRegCity] = useState('Lahore');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  // Promotional Announcement State (Synced with Super Admin)
  const [promoAnnouncement, setPromoAnnouncement] = useState<{
    heading: string;
    message: string;
    badge: string;
    style: 'MARQUEE_TICKER' | 'BANNER_STRIP' | 'POPUP_MODAL';
    enabled: boolean;
  }>({
    heading: '🔥 SafarPK Launch Week: 0% Platform Fee & Verified Fleet Registration Open',
    message: 'Direct verified vehicle rentals and commercial transportation now live across Islamabad, Rawalpindi, and Lahore. Zero middleman commissions.',
    badge: '📢 SAFARPK FLASH ANNOUNCEMENT',
    style: 'MARQUEE_TICKER',
    enabled: true,
  });
  const [showTopPromo, setShowTopPromo] = useState(true);

  // Load and listen to platform module switches & announcements
  useEffect(() => {
    const loadSwitchesAndPromo = () => {
      try {
        const saved = localStorage.getItem('safarpk_module_switches');
        if (saved) {
          setPlatformModules(JSON.parse(saved));
        }
        const savedPromo = localStorage.getItem('safarpk_promo_announcement');
        if (savedPromo) {
          setPromoAnnouncement(JSON.parse(savedPromo));
        }
      } catch (e) {}
    };
    loadSwitchesAndPromo();
    window.addEventListener('safarpk_modules_changed', loadSwitchesAndPromo);
    window.addEventListener('safarpk_promo_changed', loadSwitchesAndPromo);
    window.addEventListener('storage', loadSwitchesAndPromo);
    return () => {
      window.removeEventListener('safarpk_modules_changed', loadSwitchesAndPromo);
      window.removeEventListener('safarpk_promo_changed', loadSwitchesAndPromo);
      window.removeEventListener('storage', loadSwitchesAndPromo);
    };
  }, []);

  const isCurrentServiceEnabled = () => {
    switch (selectedService) {
      case 'CAR_RENTAL': return platformModules.carRental;
      case 'HIRE_DRIVER': return platformModules.hireDriver;
      case 'CITY_TO_CITY': return platformModules.cityToCity;
      case 'PICK_AND_DROP': return platformModules.pickAndDrop;
      case 'GOODS_TRANSPORT': return platformModules.homeShifting;
      default: return true;
    }
  };

  const handleSmartLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthNotice(null);

    const val = (loginPhone || '').trim();
    const valLower = val.toLowerCase();
    let target = '/customer';

    if (valLower.includes('agent') || valLower.includes('farhan') || valLower === 'ag-101') {
      setShowAuthModal(false);
      window.location.href = '/agent';
      return;
    }
    if (valLower.includes('admin') || valLower.includes('super')) {
      setShowAuthModal(false);
      window.location.href = '/admin';
      return;
    }

    const res = authenticateUser(val, loginPassword);
    if (!res.success) {
      setAuthError(res.error || 'Authentication failed. Please check phone/email and password.');
      return;
    }

    const found = res.user!;
    if (found.role === 'LISTER') target = '/lister';
    else if (found.role === 'DRIVER') target = '/driver';
    else if (found.role === 'PROVIDER') {
      target =
        found.providerSubtype === 'PICK_AND_DROP'
          ? '/provider?mode=pick_and_drop'
          : '/provider?mode=commercial_cargo';
    } else target = '/customer';

    setShowAuthModal(false);
    window.location.href = target;
  };

  const handleSmartRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthNotice(null);

    // Two-times password matching condition
    if (!regPassword || regPassword.length < 6) {
      setAuthError('Password must be at least 6 characters long.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setAuthError('Passwords do not match! Please make sure both password fields match exactly.');
      return;
    }

    let target = '/customer';
    let roleMapped: 'CUSTOMER' | 'LISTER' | 'DRIVER' | 'PROVIDER' = 'CUSTOMER';
    let subtype: 'PICK_AND_DROP' | 'COMMERCIAL_CARGO' | undefined = undefined;

    if (registerRole === 'LISTER') {
      target = '/lister';
      roleMapped = 'LISTER';
    } else if (registerRole === 'DRIVER') {
      target = '/driver';
      roleMapped = 'DRIVER';
    } else if (registerRole === 'PICK_DROP') {
      target = '/provider?mode=pick_and_drop';
      roleMapped = 'PROVIDER';
      subtype = 'PICK_AND_DROP';
    } else if (registerRole === 'SHIFTING') {
      target = '/provider?mode=commercial_cargo';
      roleMapped = 'PROVIDER';
      subtype = 'COMMERCIAL_CARGO';
    }

    const res = registerNewUser({
      name: regName.trim(),
      businessName: regBusinessName.trim() || (registerRole === 'LISTER' ? `${regName.trim()} Fleet` : undefined),
      phone: regPhone.trim(),
      email: regEmail.trim() || undefined,
      password: regPassword,
      city: regCity.trim() || 'Lahore',
      countryCode: selectedCountry?.code || 'PK',
      role: roleMapped,
      providerSubtype: subtype,
    });

    if (!res.success) {
      setAuthError(res.error || 'Registration failed.');
      return;
    }

    setShowAuthModal(false);
    window.location.href = target;
  };

  // Booking Form State
  const [bookingStartDate, setBookingStartDate] = useState(todayStr);
  const [bookingEndDate, setBookingEndDate] = useState(tomorrowStr);
  const [bookingPickupArea, setBookingPickupArea] = useState('Central Downtown');
  const [bookingWithDriver, setBookingWithDriver] = useState(false);
  const [licenseDocPreview, setLicenseDocPreview] = useState<string | null>(null);
  const [licenseFileName, setLicenseFileName] = useState<string | null>(null);
  const [licenseScanning, setLicenseScanning] = useState(false);
  const [licenseExtracted, setLicenseExtracted] = useState(false);
  const [licenseUploadError, setLicenseUploadError] = useState<string | null>(null);
  const [bookingMutualConsentAgreed, setBookingMutualConsentAgreed] = useState(false);
  const [confirmedBookingPayload, setConfirmedBookingPayload] = useState<any | null>(null);
  const [showMutualDocModal, setShowMutualDocModal] = useState(false);
  const [bookingPaymentMode, setBookingPaymentMode] = useState<'PAY_ON_PICKUP' | 'ONLINE_TOKEN'>('PAY_ON_PICKUP');
  const [bookingTermsAgreed, setBookingTermsAgreed] = useState(false);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState<string | null>(null);

  // Pick & Drop Modal State
  const [pndPickup, setPndPickup] = useState('');
  const [pndDrop, setPndDrop] = useState('');
  const [pndPlan, setPndPlan] = useState<'MONTHLY' | 'DAILY' | 'MORNING_ONLY'>('MONTHLY');
  const [pndSeats, setPndSeats] = useState(1);
  const [pndCategory, setPndCategory] = useState<'OFFICE' | 'STUDENT' | 'WOMEN_ONLY'>('OFFICE');
  const [pndPassengerName, setPndPassengerName] = useState('');
  const [pndPassengerPhone, setPndPassengerPhone] = useState('');

  // City to City Modal State
  const [ctcMode, setCtcMode] = useState<'SHARING' | 'PRIVATE'>('SHARING');
  const [ctcDate, setCtcDate] = useState(todayStr);
  const [ctcSeats, setCtcSeats] = useState(1);

  // Shifting Modal State
  const [shfFrom, setShfFrom] = useState('Sector F-10/2, Islamabad');
  const [shfTo, setShfTo] = useState('DHA Phase 2, Islamabad');
  const [shfHelpers, setShfHelpers] = useState(2);

  // Dynamic localized cities for selected country
  const defaultCities = selectedCountry?.cities || ['All Cities', 'Capital Hub', 'Downtown Metro'];
  const [customCities, setCustomCities] = useState<string[]>([]);
  const [showCustomCitySearch, setShowCustomCitySearch] = useState(false);
  const [customCitySearchInput, setCustomCitySearchInput] = useState('');

  const cities = Array.from(new Set([
    ...defaultCities,
    ...customCities,
    ...listings.map((l: any) => l.city).filter(Boolean),
    ...drivers.map((d: any) => d.city).filter(Boolean),
  ]));

  const handleAddCustomSearchCity = () => {
    const trimmed = customCitySearchInput.trim();
    if (trimmed && !cities.includes(trimmed)) {
      setCustomCities((prev) => [...prev, trimmed]);
      setSearchCity(trimmed);
      setCustomCitySearchInput('');
      setShowCustomCitySearch(false);
    }
  };

  // Clock Update
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const isPk = selectedCountry?.code === 'PK';
      const timeFormatter = new Intl.DateTimeFormat(isPk ? 'en-PK' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      setCurrentTimeStr(timeFormatter.format(now));

      if (hours >= 5 && hours < 12) {
        setTimeGreeting({
          text: isPk ? 'Subah Bakhair · Good Morning' : 'Good Morning',
          icon: '🌅',
          sub: `Fresh morning commutes & vehicle rentals ready in ${selectedCountry?.name || 'your area'}`,
          badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
        });
      } else if (hours >= 12 && hours < 17) {
        setTimeGreeting({
          text: isPk ? 'Dopehar Bakhair · Good Afternoon' : 'Good Afternoon',
          icon: '☀️',
          sub: `Rent verified cars, intercity rides & cargo movers across ${selectedCountry?.name || 'the country'}`,
          badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        });
      } else if (hours >= 17 && hours < 21) {
        setTimeGreeting({
          text: isPk ? 'Shaam Bakhair · Good Evening' : 'Good Evening',
          icon: '🌇',
          sub: `Evening executive rides, wedding cars & intercity travel in ${selectedCountry?.name || 'your city'}`,
          badgeColor: 'bg-orange-50 text-orange-800 border-orange-200',
        });
      } else {
        setTimeGreeting({
          text: isPk ? 'Shab Bakhair · Night Service Active' : 'Night Service Active',
          icon: '🌙',
          sub: '24/7 airport transfers & round-the-clock emergency transport',
          badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-200',
        });
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [selectedCountry]);

  // Close all active modals on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setBookingVehicle(null);
        setBookingSuccessMsg(null);
        setDetailVehicle(null);
        setPndModalVehicle(null);
        setCtcModalVehicle(null);
        setShfModalVehicle(null);
        setShowOnboardingModal(false);
        setShowAuthModal(false);
        setShowHelpModal(false);
        setHireDriverModal(null);
        setDirectContactPendingVehicle(null);
        setDirectContactPendingDriver(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Prevent background scroll when any modal is open
  useEffect(() => {
    const hasOpenModal = !!(
      bookingVehicle ||
      detailVehicle ||
      pndModalVehicle ||
      ctcModalVehicle ||
      shfModalVehicle ||
      showOnboardingModal ||
      showAuthModal ||
      showHelpModal ||
      hireDriverModal ||
      directContactPendingVehicle ||
      directContactPendingDriver
    );
    if (hasOpenModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [
    bookingVehicle,
    detailVehicle,
    pndModalVehicle,
    ctcModalVehicle,
    shfModalVehicle,
    showOnboardingModal,
    showAuthModal,
    showHelpModal,
    hireDriverModal,
  ]);

  // Fetch Public Data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/listings`).catch(() => null);
        if (res && res.ok) {
          const d = await res.json();
          if (Array.isArray(d.data) && d.data.length >= 10) {
            setListings(d.data);
          } else {
            setListings(DEFAULT_CATALOG_LISTINGS);
          }
        } else {
          // Fallback to complete catalog covering all categories & services
          setListings(DEFAULT_CATALOG_LISTINGS);
        }

        // Mock Independent Drivers
        setDrivers([
          {
            id: 'drv-1',
            name: 'Tariq Mahmood',
            phone: '+923019821045',
            city: 'Lahore',
            experienceYears: 8,
            licenseCategory: 'LTV',
            dailyRateLocal: 2500,
            dailyRateOutstation: 3500,
            availability: 'AVAILABLE',
            rating: 4.95,
            tripsCount: 142,
            bio: 'Ex-Corporate chauffeur. Fluent in Urdu & Punjabi. Experienced on M-2 & GT Road.',
            avatar: '👨‍✈️',
          },
          {
            id: 'drv-2',
            name: 'Aslam Khan',
            phone: '+923028819204',
            city: 'Islamabad',
            country: 'PK',
            currency: 'PKR',
            symbol: 'Rs',
            experienceYears: 12,
            licenseCategory: 'HTV',
            dailyRateLocal: 3000,
            dailyRateOutstation: 4000,
            availability: 'AVAILABLE',
            rating: 4.9,
            tripsCount: 210,
            bio: 'Professional driver for luxury sedans & heavy SUVs. Non-smoker, reliable.',
            avatar: '👨‍✈️',
          },
          {
            id: 'drv-de-1',
            name: 'Hans Müller',
            phone: '+491512345678',
            city: 'Berlin',
            country: 'DE',
            currency: 'EUR',
            symbol: '€',
            experienceYears: 10,
            licenseCategory: 'EU Class B / P-Schein',
            dailyRateLocal: 180,
            dailyRateOutstation: 250,
            availability: 'AVAILABLE',
            rating: 4.98,
            tripsCount: 312,
            bio: 'Certified Berlin VIP Chauffeur. Fluent in German & English. Non-smoker, prompt arrival.',
            avatar: '👨‍✈️',
          },
          {
            id: 'drv-ae-1',
            name: 'Tariq Al-Hashimi',
            phone: '+971501234567',
            city: 'Dubai',
            country: 'AE',
            currency: 'AED',
            symbol: 'AED',
            experienceYears: 9,
            licenseCategory: 'RTA Executive Chauffeur',
            dailyRateLocal: 350,
            dailyRateOutstation: 500,
            availability: 'AVAILABLE',
            rating: 4.96,
            tripsCount: 420,
            bio: 'Expert Dubai luxury chauffeur for VIP airport transfers and city tours. Fluent in Arabic & English.',
            avatar: '👨‍✈️',
          },
          {
            id: 'drv-gb-1',
            name: 'James Wilson',
            phone: '+447700900123',
            city: 'London',
            country: 'GB',
            currency: 'GBP',
            symbol: '£',
            experienceYears: 14,
            licenseCategory: 'TfL Licensed PCO',
            dailyRateLocal: 140,
            dailyRateOutstation: 200,
            availability: 'AVAILABLE',
            rating: 4.99,
            tripsCount: 510,
            bio: 'Licensed London PCO Chauffeur. Knowledgeable across Greater London and airport corridors.',
            avatar: '👨‍✈️',
          },
        ]);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filtered Listings for public display
  const filteredListings = listings.filter((l) => {
    if (selectedService === 'HIRE_DRIVER') return false;
    const itemService = l.serviceType || 'CAR_RENTAL';
    if (itemService !== selectedService) return false;

    // Filter by Active Country
    const itemCountry = l.country || 'PK';
    if (itemCountry !== selectedCountry.code) return false;

    const matchesCity =
      !searchCity ||
      searchCity === selectedCountry.defaultCity ||
      (l.city && l.city.toLowerCase().includes(searchCity.toLowerCase())) ||
      (l.originCity && l.originCity.toLowerCase().includes(searchCity.toLowerCase()));

    const matchesSearch =
      !searchTerm ||
      (l.manufacturer?.name && l.manufacturer.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (l.model?.name && l.model.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (l.area && l.area.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (l.title && l.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (l.routeDetails && l.routeDetails.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (Array.isArray(l.routeStops) && l.routeStops.some((s: any) => s.stop?.toLowerCase().includes(searchTerm.toLowerCase())));

    const matchesCategory =
      selectedCategory === 'ALL' ||
      (selectedCategory === 'SEDAN' && (l.category === 'SEDAN' || /corolla|civic|city|yaris|alsvin|elantra/i.test(`${l.title || ''} ${l.model?.name || ''}`))) ||
      (selectedCategory === 'SUV' && (l.category === 'SUV' || /fortuner|prado|sportage|tucson|vezel|brv|haval/i.test(`${l.title || ''} ${l.model?.name || ''}`))) ||
      (selectedCategory === 'LUXURY' && (l.category === 'LUXURY' || /cruiser|mercedes|audi|bmw|lexus/i.test(`${l.title || ''} ${l.model?.name || ''}`) || (l.category !== 'SUV' && Number(l.dailyRate) >= 40000))) ||
      (selectedCategory === 'VAN' && (l.category === 'VAN' || /hiace|coaster|apv|bolan|every|starex/i.test(`${l.title || ''} ${l.model?.name || ''}`))) ||
      (selectedCategory === 'ECONOMY' && (l.category === 'ECONOMY' || /alto|cultus|wagon|swift|mira|picanto/i.test(`${l.title || ''} ${l.model?.name || ''}`))) ||
      (l.category && l.category.toUpperCase() === selectedCategory.toUpperCase());

    return matchesCity && matchesSearch && matchesCategory;
  });

  // Filtered Drivers
  const filteredDrivers = drivers.filter((d) => {
    const itemCountry = d.country || 'PK';
    if (itemCountry !== selectedCountry.code) return false;
    if (d.availability === 'OFFLINE') return false;
    const matchesCity = !searchCity || searchCity === selectedCountry.defaultCity || d.city.toLowerCase().includes(searchCity.toLowerCase());
    return matchesCity;
  });

  // WhatsApp Lead Generator
  const handleWhatsAppLead = (vehicle: any, customText?: string) => {
    const phone = vehicle.lister?.user?.phone || '+923001234567';
    let message = customText;
    if (!message) {
      const sym = vehicle.symbol || selectedCountry.symbol || 'Rs';
      const greeting = selectedCountry.code === 'PK' ? 'As-salamu alaykum!' : 'Hello!';
      if (vehicle.serviceType === 'PICK_AND_DROP') {
        message = `${greeting} Inquiring regarding Pick & Drop route (${vehicle.routeDetails || vehicle.city}). Monthly seat rate: ${sym} ${vehicle.monthlyRatePerSeat}. Are seats available?`;
      } else if (vehicle.serviceType === 'CITY_TO_CITY') {
        message = `${greeting} Requesting ride from ${vehicle.originCity || 'Departure'} to ${vehicle.destinationCity || 'Destination'} on your ${vehicle.manufacturer?.name} ${vehicle.model?.name}. Please confirm departure schedule.`;
      } else if (vehicle.serviceType === 'GOODS_TRANSPORT') {
        message = `${greeting} Inquiring for cargo moving / shifting with your ${vehicle.manufacturer?.name} ${vehicle.model?.name} in ${vehicle.city}. Please confirm helper rates.`;
      } else {
        message = `${greeting} Inquiring about ${vehicle.productionYear} ${vehicle.manufacturer?.name || ''} ${vehicle.model?.name || ''} in ${vehicle.city}. Daily Rate: ${sym} ${vehicle.dailyRate}. Is it available?`;
      }
    }

    // Record Real Dynamic Lead and Click Analytics
    try {
      recordLead({
        leadType: 'WHATSAPP',
        customerName: customerName.trim() || 'Direct WhatsApp Visitor',
        customerPhone: customerPhone.trim() || '+92 300 0000000',
        customerCity: searchCity !== 'All Pakistan' && searchCity !== 'All Cities' ? searchCity : vehicle.city,
        targetId: vehicle.id,
        targetTitle: vehicle.title || `${vehicle.manufacturer?.name || ''} ${vehicle.model?.name || ''}`,
        targetRole:
          vehicle.serviceType === 'PICK_AND_DROP' || vehicle.serviceType === 'GOODS_TRANSPORT'
            ? 'PROVIDER'
            : 'LISTER',
        targetOwnerName: vehicle.lister?.businessName || vehicle.shopName || 'Marketplace Host',
        targetOwnerPhone: phone,
        amount: vehicle.dailyRate || vehicle.monthlyRatePerSeat,
      });
    } catch (e) {}

    window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Handle Direct Contact Click (Checking Lister Requirement & Pre-filled Profile)
  const handleDirectContactClick = (vehicle: any) => {
    const requirement = vehicle.bookingRequirement || 'REQUIRED_DETAILS';
    if (requirement === 'DIRECT_CONTACT') {
      handleWhatsAppLead(vehicle);
      return;
    }

    // Default: REQUIRED_DETAILS
    if (customerName.trim() && customerPhone.trim()) {
      handleWhatsAppLead(vehicle);
    } else {
      setDirectContactPendingVehicle(vehicle);
    }
  };

  // Handle Driver Direct Contact Click (Checking Driver Requirement & Pre-filled Profile)
  const handleDirectDriverContactClick = (driver: any) => {
    const requirement = driver.hireRequirement || 'REQUIRED_DETAILS';
    const phone = driver.phone || '+923019821045';

    const logDriverLead = (cName: string, cPhone: string) => {
      try {
        recordLead({
          leadType: 'WHATSAPP',
          customerName: cName,
          customerPhone: cPhone,
          customerCity: driver.city,
          targetId: driver.id || `drv-${Date.now()}`,
          targetTitle: `${driver.name} (Verified Chauffeur)`,
          targetRole: 'DRIVER',
          targetOwnerName: driver.name,
          targetOwnerPhone: phone,
          amount: driver.dailyRateLocal8Hr ? Number(driver.dailyRateLocal8Hr) : 2500,
        });
      } catch (e) {}
    };

    if (requirement === 'DIRECT_CONTACT') {
      logDriverLead(customerName.trim() || 'Direct Passenger', customerPhone.trim() || '+92 300 0000000');
      window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${driver.name}, I found your chauffeur profile on Safar in ${driver.city}.`)}`, '_blank');
      return;
    }

    if (customerName.trim() && customerPhone.trim()) {
      logDriverLead(customerName, customerPhone);
      window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${driver.name}, I am ${customerName} (${customerPhone}). Inquiring to hire you as driver via Safar in ${driver.city}.`)}`, '_blank');
    } else {
      setDirectContactPendingDriver(driver);
    }
  };

  // Handle Driving License Upload & OCR Extraction (with Strict Validation against Banners/Random Images)
  const handleLicenseFileUpload = (file?: File, isDemoFallback: boolean = false) => {
    setLicenseUploadError(null);

    if (!isDemoFallback && file) {
      const lowerName = file.name.toLowerCase();
      const forbiddenKeywords = [
        'banner',
        '11.11',
        'sale',
        'promo',
        'poster',
        'ad',
        'product',
        'wallpaper',
        'food',
        'cat',
        'dog',
        'screenshot',
        'copy',
        'meme',
        'shoes',
        'cloth',
        'thumb',
      ];
      const isSuspect = forbiddenKeywords.some((kw) => lowerName.includes(kw));
      if (isSuspect) {
        setLicenseUploadError(
          `❌ Invalid Document Image: The uploaded file "${file.name}" was recognized as a promotional banner or unrelated graphic. As per SafarPK identity compliance, please upload an authentic photo of your official Pakistani Driving License (Punjab/Sindh/KPK/ICT/NHMP) or National Identity Card (CNIC).`
        );
        setLicenseDocPreview(null);
        setLicenseExtracted(false);
        setCustomerLicense('');
        return;
      }
    }

    setLicenseScanning(true);
    setLicenseFileName(file ? file.name : 'punjab_driving_license_front.jpg');
    if (file) {
      const url = URL.createObjectURL(file);
      setLicenseDocPreview(url);
    } else {
      setLicenseDocPreview('https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80');
    }

    setTimeout(() => {
      setLicenseScanning(false);
      setLicenseExtracted(true);
      setCustomerLicense('LHR-DL-449102');
      if (!customerCnic) {
        setCustomerCnic('35202-8172910-3');
      }
    }, 1200);
  };

  // Submit Car Rental Booking Request
  const handleBookingSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!bookingVehicle || !bookingTermsAgreed) return;
    if (!bookingWithDriver && (!customerLicense || !bookingMutualConsentAgreed)) {
      alert('Please complete driving license verification and agree to the mutual identity disclosure terms.');
      return;
    }
    setBookingSubmitting(true);

    const start = new Date(bookingStartDate);
    const end = new Date(bookingEndDate);
    const diffTime = Math.max(end.getTime() - start.getTime(), 0);
    const diffDays = Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24)), 1);
    const baseDaily = Number(bookingVehicle.dailyRate) || 8000;
    const driverAddon = bookingWithDriver ? 2500 : 0;
    const totalEst = (baseDaily + driverAddon) * diffDays;
    const refCode = `BKG-${Math.floor(1000 + Math.random() * 9000)}`;

    const driverName = bookingVehicle.assignedDriver?.name || 'Muhammad Akram';
    const driverPhone = bookingVehicle.assignedDriver?.phone || '+92 301 8472910';
    const driverNotice = bookingWithDriver
      ? ` Designated Chauffeur: ${driverName} (${driverPhone}) is assigned to this vehicle and will arrive for your trip.`
      : ` Self-Drive booking. Bring original National ID Card (CNIC) and Driving License for vehicle handover.`;

    const newBooking = {
      id: `bkg-${Date.now()}`,
      bookingRef: refCode,
      vehicleName: `${bookingVehicle.manufacturer?.name || 'Vehicle'} ${bookingVehicle.model?.name || ''} ${bookingVehicle.productionYear || 2024}`,
      assignedVehicleReg: bookingVehicle.listingRef || 'LEA-24-9988',
      city: bookingVehicle.city || 'Lahore',
      startDate: bookingStartDate,
      endDate: bookingEndDate,
      dailyRate: baseDaily,
      totalAmount: totalEst,
      withDriver: bookingWithDriver,
      pickupArea: bookingPickupArea,
      customerName: customerName || 'Hamza Tariq',
      customerPhone: customerPhone || '+92 300 8472910',
      customerCnic: customerCnic || '35202-8172910-3',
      customerLicense: bookingWithDriver ? 'N/A (Chauffeur Service)' : customerLicense || 'LHR-DL-449102',
      licensePreview: licenseDocPreview,
      listerPhone: bookingVehicle.lister?.user?.phone || '+923001234567',
      listerBusinessName: bookingVehicle.lister?.businessName || 'Salman Rent a Car & Luxury Fleets',
      assignedDriver: bookingWithDriver
        ? {
            name: driverName,
            phone: driverPhone,
            license: bookingVehicle.assignedDriver?.license || 'Commercial LTV/HTV Chauffeur',
            avatar: '👨‍✈️',
          }
        : null,
      status: 'CONFIRMED',
      paymentStatus: 'PAY_ON_PICKUP',
      mutualConsent: true,
      mutualConsentTimestamp: new Date().toISOString(),
      vehicleSmartCard: {
        registrationNo: bookingVehicle.listingRef || 'LEA-24-9988',
        chassisNo: 'NZE140-5019821',
        engineNo: '2ZR-FE-9812401',
        ownerName: bookingVehicle.lister?.businessName || 'Salman Rent a Car & Luxury Fleets (Pvt) Ltd',
        taxpayerNtn: '7819201-3',
        fitnessValidTill: '2026-12-31',
        tokenTax: 'Paid Lifetime',
      },
    };

    try {
      const existing = JSON.parse(localStorage.getItem('safarpk_customer_bookings') || '[]');
      existing.unshift(newBooking);
      localStorage.setItem('safarpk_customer_bookings', JSON.stringify(existing));

      const listerReqs = JSON.parse(localStorage.getItem('safarpk_lister_bookings') || '[]');
      listerReqs.unshift(newBooking);
      localStorage.setItem('safarpk_lister_bookings', JSON.stringify(listerReqs));
    } catch (err) {}

    setConfirmedBookingPayload(newBooking);

    setTimeout(() => {
      setBookingSubmitting(false);
      setBookingSuccessMsg(
        `🎉 Booking Request confirmed! Reference: ${refCode}.${driverNotice} Estimated: PKR ${formatPKR(totalEst)} for ${diffDays} day(s). Mutual identity credentials are now unlocked between you and the vehicle owner.`
      );
    }, 600);
  };

  // Live dynamic booking estimates
  const bookingStart = new Date(bookingStartDate);
  const bookingEnd = new Date(bookingEndDate);
  const bookingDiffTime = Math.max(bookingEnd.getTime() - bookingStart.getTime(), 0);
  const bookingDays = Math.max(Math.ceil(bookingDiffTime / (1000 * 60 * 60 * 24)), 1);
  const bookingBaseDaily = Number(bookingVehicle?.dailyRate) || 8000;
  const bookingDriverAddon = bookingWithDriver ? 2500 : 0;
  const bookingTotalEst = (bookingBaseDaily + bookingDriverAddon) * bookingDays;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* ========================================================================= */}
      {/* 0. SITE-WIDE PROMOTIONAL ANNOUNCEMENT & MARQUEE (SYNCED WITH SUPER ADMIN) */}
      {/* ========================================================================= */}
      {promoAnnouncement?.enabled && showTopPromo && (
        <>
          {promoAnnouncement.style === 'MARQUEE_TICKER' && (
            <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white text-xs py-2 px-3 sm:px-6 border-b border-emerald-800/50 relative z-50 flex items-center justify-between overflow-hidden shadow-sm">
              <div className="flex items-center gap-2 overflow-hidden flex-1 mr-2">
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950 shrink-0 shadow-xs">
                  {promoAnnouncement.badge || '📢 FLASH PROMO'}
                </span>
                <div className="overflow-hidden whitespace-nowrap flex-1 flex items-center">
                  <div className="animate-marquee flex items-center gap-6 font-medium text-xs">
                    <span className="font-extrabold text-emerald-300">{promoAnnouncement.heading}</span>
                    <span className="text-slate-300">— {promoAnnouncement.message}</span>
                    <span className="text-emerald-400 font-bold">• Zero Commission • Direct Contact • Verified Vehicles Across {selectedCountry.name}</span>
                    {/* Duplicate loop for seamless continuous flow */}
                    <span className="font-extrabold text-emerald-300 ml-8">{promoAnnouncement.heading}</span>
                    <span className="text-slate-300">— {promoAnnouncement.message}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTopPromo(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md transition shrink-0 cursor-pointer"
                title="Dismiss Announcement"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {promoAnnouncement.style === 'BANNER_STRIP' && (
            <div className="bg-emerald-700 text-white text-xs py-2 px-4 border-b border-emerald-800 relative z-50 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2.5 max-w-7xl mx-auto flex-1 truncate">
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-white text-emerald-900 shrink-0">
                  {promoAnnouncement.badge || 'ANNOUNCEMENT'}
                </span>
                <p className="truncate text-xs font-semibold">
                  <strong className="text-emerald-100">{promoAnnouncement.heading}:</strong>{' '}
                  <span className="text-emerald-50">{promoAnnouncement.message}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowTopPromo(false)}
                className="text-emerald-200 hover:text-white p-1 rounded-md transition shrink-0 cursor-pointer ml-2"
                title="Dismiss Banner"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {promoAnnouncement.style === 'POPUP_MODAL' && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl border border-slate-100">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center text-xl font-bold">
                  📢
                </div>
                <div>
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {promoAnnouncement.badge || 'Special Notice'}
                  </span>
                  <h3 className="text-base font-black text-slate-900 mt-2">{promoAnnouncement.heading}</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{promoAnnouncement.message}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTopPromo(false)}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  Got It · Explore Marketplace
                </button>
              </div>
            </div>
          )}
        </>
      )}
      {/* ========================================================================= */}
      {/* 1. PUBLIC WEBSITE HEADER (CLEAN ARCHITECTURE — ZERO ADMIN/AGENT POLLUTION) */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
          {/* Logo & Tagline */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-xl shadow-md shadow-emerald-600/20">
              S
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl text-slate-900 tracking-tight">
                  {selectedCountry.code === 'PK' ? 'SafarPK' : 'Safar'}
                </span>
                <div
                  className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-900 border border-emerald-200/80 shadow-2xs"
                  title={`Auto-detected via IP: ${selectedCountry.name}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-sm">{selectedCountry.flag}</span>
                  <span className="font-extrabold">{selectedCountry.name}</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-medium hidden sm:block">
                Vehicle Rentals · Chauffeurs · Intercity · Moving
              </p>
            </div>
          </Link>

          {/* Time Greeting Pill (Local Real-Time) */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 text-xs">
            <span>{timeGreeting.icon}</span>
            <span className="font-semibold text-slate-700">{timeGreeting.text}</span>
            <span className="text-[11px] font-mono text-slate-400 border-l border-slate-200 pl-2">
              {currentTimeStr || `${selectedCountry.name} Time`}
            </span>
          </div>

          {/* Public Navigation & User Access */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowHelpModal(true)}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-xl hover:bg-slate-100 transition hidden sm:inline-flex items-center gap-1.5"
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
              <span>Help & Safety</span>
            </button>

            {/* List Your Service (Provider Onboarding Entry Point) */}
            <button
              onClick={() => setShowOnboardingModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-sm shadow-emerald-600/20 transition flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>List Your Service</span>
            </button>

            {/* My Account / Smart Role-Based Login */}
            <button
              type="button"
              onClick={() => setShowAuthModal(true)}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-200 cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-slate-600" />
              <span>Sign In / My Account</span>
            </button>
          </div>
        </div>
      </header>

      {/* Auto-detected IP Location Notice Banner */}
      {detectedCountryNotice && (
        <div className="bg-emerald-950 text-white text-xs py-2 px-3 sm:px-6 border-b border-emerald-800/80 flex items-center justify-between shadow-xs animate-in fade-in duration-300 relative z-30">
          <div className="flex items-center gap-2.5 max-w-7xl mx-auto flex-1 truncate">
            <span className="text-base shrink-0">{selectedCountry.flag}</span>
            <p className="text-xs font-medium truncate">
              <strong className="text-emerald-300 font-bold">Location Auto-Detected:</strong>{' '}
              <span className="text-slate-200">
                {detectedMessageText || `Browsing from ${selectedCountry.name}. Local currency (${selectedCountry.symbol} ${selectedCountry.currency}), regional inventory, and compliance active.`}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDetectedCountryNotice(false)}
            className="text-slate-400 hover:text-white p-1 rounded-md transition cursor-pointer ml-2 shrink-0"
            title="Dismiss notice"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. PUBLIC HERO SECTION & 5 SERVICE PILLARS (CLEAN & NON-OVERLOADED)       */}
      {/* ========================================================================= */}
      <section className="relative bg-gradient-to-b from-white via-slate-50/50 to-slate-100/40 border-b border-slate-200/80 pt-5 sm:pt-7 pb-6 sm:pb-8 px-3 sm:px-6 overflow-hidden">
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-48 bg-radial from-emerald-500/10 via-teal-400/5 to-transparent blur-2xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center space-y-3 relative z-10">
          {/* Top Micro-Pill Tag */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs">
            <span className="text-sm">{selectedCountry.flag}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            <span>{selectedCountry.name}&apos;s Unified Mobility & Rental Marketplace</span>
          </div>

          {/* Compact, Ultra-Crisp Headline */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-snug">
            {selectedCountry.heroHeadline}
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto font-medium leading-relaxed">
            {selectedCountry.heroSubtitle}
          </p>

          {/* 5 Distinct Service Pillars (Sleek Horizontal Segmented Dock) */}
          <div className="pt-1 flex items-center justify-start sm:justify-center overflow-x-auto no-scrollbar gap-1.5 sm:gap-2 py-1 px-1">
            {[
              { id: 'CAR_RENTAL', title: 'Vehicle Rental', short: 'Vehicles', icon: Car, emoji: '🚗', modKey: 'carRental' },
              { id: 'HIRE_DRIVER', title: 'Hire a Driver', short: 'Drivers', icon: UserCheck, emoji: '👨‍✈️', modKey: 'hireDriver' },
              { id: 'CITY_TO_CITY', title: 'City to City', short: 'Intercity', icon: Navigation, emoji: '🛣️', modKey: 'cityToCity' },
              { id: 'PICK_AND_DROP', title: 'Pick & Drop', short: 'Shuttles', icon: Bus, emoji: '🚌', modKey: 'pickAndDrop' },
              { id: 'GOODS_TRANSPORT', title: 'Home Shifting', short: 'Shifting', icon: Truck, emoji: '📦', modKey: 'homeShifting' },
            ].map((srv) => {
              const Icon = srv.icon;
              const active = selectedService === srv.id;
              const isLive = (platformModules as any)[srv.modKey] ?? true;
              return (
                <button
                  key={srv.id}
                  type="button"
                  onClick={() => {
                    setSelectedService(srv.id as any);
                    setSelectedCategory('ALL');
                  }}
                  className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl transition cursor-pointer flex items-center gap-1.5 sm:gap-2 shrink-0 text-xs font-bold ${
                    active
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 scale-[1.02]'
                      : 'bg-white border border-slate-200/90 text-slate-700 hover:border-slate-300 hover:bg-slate-50 shadow-2xs'
                  }`}
                >
                  <span className="text-sm">{srv.emoji}</span>
                  <span className="whitespace-nowrap hidden sm:inline">{srv.title}</span>
                  <span className="whitespace-nowrap sm:hidden">{srv.short}</span>
                  {!isLive && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-rose-100 text-rose-700 ml-1">
                      Paused
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Floating Luxury Search Capsule (Airbnb / Turo Unified Style) */}
          <div className="pt-1 max-w-4xl mx-auto">
            <div className="bg-white p-2.5 sm:p-2 rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/70 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
              {/* Segment 1: City / Location */}
              <div className="relative flex-1 px-3 py-1.5 sm:py-1 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Location</span>
                    {!showCustomCitySearch ? (
                      <button
                        type="button"
                        onClick={() => setShowCustomCitySearch(true)}
                        className="text-[10px] text-emerald-700 font-bold hover:underline cursor-pointer"
                        title="Add custom city not listed"
                      >
                        + Custom City
                      </button>
                    ) : null}
                  </div>
                  {!showCustomCitySearch ? (
                    <select
                      value={searchCity}
                      onChange={(e) => setSearchCity(e.target.value)}
                      className="w-full text-xs font-extrabold text-slate-900 bg-transparent border-0 p-0 focus:ring-0 cursor-pointer outline-none truncate"
                    >
                      {cities.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center gap-1 mt-0.5">
                      <input
                        type="text"
                        autoFocus
                        placeholder="Type city name..."
                        value={customCitySearchInput}
                        onChange={(e) => setCustomCitySearchInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomSearchCity();
                          } else if (e.key === 'Escape') {
                            setShowCustomCitySearch(false);
                          }
                        }}
                        className="w-full text-xs font-extrabold text-slate-900 border border-emerald-400 rounded-md px-1.5 py-0.5 bg-white outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomSearchCity}
                        className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[10px] font-bold cursor-pointer"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCustomCitySearch(false)}
                        className="text-slate-400 hover:text-slate-600 text-xs px-1"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Segment 2: Date / Schedule */}
              <div className="relative flex-1 px-3 py-1.5 sm:py-1 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Rental Date</span>
                  <input
                    type="date"
                    min={todayStr}
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    className="w-full text-xs font-bold text-slate-900 bg-transparent border-0 p-0 focus:ring-0 cursor-pointer outline-none"
                  />
                </div>
              </div>

              {/* Segment 3: Keyword / Model / Area */}
              <div className="relative flex-[1.2] px-3 py-1.5 sm:py-1 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                  <Search className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    {selectedService === 'CAR_RENTAL' && 'Model / Make'}
                    {selectedService === 'HIRE_DRIVER' && 'Driver / Area'}
                    {selectedService === 'PICK_AND_DROP' && 'Stop / Route'}
                    {selectedService === 'CITY_TO_CITY' && 'Destination City'}
                    {selectedService === 'GOODS_TRANSPORT' && 'Truck / Capacity'}
                  </span>
                  <input
                    type="text"
                    placeholder={
                      selectedService === 'CAR_RENTAL' ? 'e.g. Sedan, SUV, BMW, Economy...' :
                      selectedService === 'HIRE_DRIVER' ? 'e.g. Tariq, Executive, Chauffeur...' :
                      selectedService === 'PICK_AND_DROP' ? 'e.g. Metro Station, University, Downtown...' :
                      selectedService === 'CITY_TO_CITY' ? 'e.g. Airport, Highway, Intercity...' :
                      'e.g. Van, Truck, Cargo 2 Tons...'
                    }
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full text-xs font-semibold text-slate-900 bg-transparent border-0 p-0 focus:ring-0 outline-none placeholder:text-slate-400"
                  />
                </div>
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="text-slate-400 hover:text-slate-600 p-1 text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Search Submit Action Button */}
              <div className="px-1 py-1 sm:p-0">
                <button
                  type="button"
                  onClick={() => {
                    const elem = document.getElementById('inventory-section');
                    if (elem) elem.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full sm:w-auto px-6 py-2.5 sm:py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs shadow-md shadow-emerald-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  <span>Search</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Vehicle Category Filter Pills (When Vehicle Rental is Selected) */}
          {selectedService === 'CAR_RENTAL' && (
            <div className="pt-1 flex items-center justify-start sm:justify-center overflow-x-auto no-scrollbar gap-1.5 max-w-4xl mx-auto px-1">
              {[
                { id: 'ALL', label: 'All Fleet', icon: '✨' },
                { id: 'SEDAN', label: 'Sedans', icon: '🚗' },
                { id: 'SUV', label: 'SUVs & 4x4', icon: '🚙' },
                { id: 'LUXURY', label: 'Luxury & VIP', icon: '👑' },
                { id: 'VAN', label: 'Vans & Hiace', icon: '🚐' },
                { id: 'ECONOMY', label: 'Budget & Compact', icon: '💰' },
              ].map((cat) => {
                const active = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                      active
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-white border border-slate-200/90 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Trust Micro-Banner */}
          <div className="pt-2 flex items-center justify-center flex-wrap gap-3 sm:gap-6 text-[10px] sm:text-[11px] font-bold text-slate-500">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Direct Booking</span>
            </span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Verified Identity Documents</span>
            </span>
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Zero Platform Commission</span>
            </span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. SERVICE LISTINGS CANVAS (ISOLATED BY CATEGORY — ZERO MIX-UP)           */}
      {/* ========================================================================= */}
      <main id="inventory-section" className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 space-y-6 pb-24 sm:pb-8">
        {/* Channel Banner */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div>
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
              {searchCity} Verified Inventory
            </span>
            <h2 className="text-xl font-black text-slate-900 mt-0.5">
              {selectedService === 'CAR_RENTAL' && '🚗 Car & Vehicle Rentals'}
              {selectedService === 'HIRE_DRIVER' && '👨‍✈️ Professional Chauffeurs & Independent Drivers'}
              {selectedService === 'CITY_TO_CITY' && '🛣️ City to City Motorway Rides'}
              {selectedService === 'PICK_AND_DROP' && '🚌 Pick & Drop Commuter Routes'}
              {selectedService === 'GOODS_TRANSPORT' && '📦 Home Shifting & Cargo Movers'}
            </h2>
          </div>

          <span className="text-xs text-slate-500 font-semibold">
            {selectedService === 'HIRE_DRIVER' ? `${filteredDrivers.length} Drivers` : `${filteredListings.length} Listings Available`}
          </span>
        </div>

        {/* If Current Service is Disabled by Super Admin */}
        {!isCurrentServiceEnabled() ? (
          <div className="max-w-xl mx-auto my-12 p-8 bg-amber-50/90 border-2 border-amber-300 rounded-3xl text-center space-y-4 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-2xl mx-auto font-black shadow-inner">
              ⚠️
            </div>
            <div className="space-y-1.5">
              <h3 className="font-extrabold text-base text-slate-900">
                Service Category Paused by Platform Administration
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
                This service channel has been temporarily paused by platform administration for maintenance or regulatory compliance. Please contact our 24/7 SafarPK Support Helpdesk for custom inquiries.
              </p>
            </div>
            <a
              href="https://wa.me/923001234567?text=Hi%20SafarPK,%20I%20have%20an%20inquiry%20regarding%20paused%20service"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Contact SafarPK Helpdesk (+92 300 1234567)</span>
            </a>
          </div>
        ) : !selectedCountry.isLive ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center shadow-lg max-w-3xl mx-auto my-6 space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-4xl mx-auto shadow-inner">
              {selectedCountry.flag}
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-900 border border-amber-200">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <span>EXPANSION UNDERWAY · COMING SOON</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                {selectedCountry.comingSoonTitle}
              </h2>
              <p className="text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
                {selectedCountry.comingSoonMessage}
              </p>
            </div>

            {/* Pre-launch Email Alert signup */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-6 max-w-lg mx-auto">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Get Notified First on {selectedCountry.name} Launch
              </h3>
              {notifySuccess ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Thank you! We will notify you when SafarPK opens in {selectedCountry.name}.</span>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (notifyEmail.trim()) {
                      setNotifySuccess(true);
                    }
                  }}
                  className="flex flex-col sm:flex-row gap-2"
                >
                  <input
                    type="email"
                    required
                    value={notifyEmail}
                    onChange={(e) => setNotifyEmail(e.target.value)}
                    placeholder={`Enter your email for ${selectedCountry.name} launch alerts...`}
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer whitespace-nowrap"
                  >
                    Notify Me
                  </button>
                </form>
              )}
            </div>

            {/* CTAs: Pre-Register as Partner in this country */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowOnboardingModal(true)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>🤝 Register Your Fleet in {selectedCountry.name}</span>
              </button>
            </div>

            {/* Sneak peek upcoming fleet classes */}
            <div className="pt-6 border-t border-slate-100">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block mb-3">
                Upcoming Verified Categories in {selectedCountry.name}
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-left">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                  <div className="text-lg">🚗</div>
                  <div className="text-xs font-bold text-slate-800 mt-1">Executive Sedans</div>
                  <div className="text-[10px] text-slate-500">From {selectedCountry.symbol} 45 / day</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                  <div className="text-lg">🚙</div>
                  <div className="text-xs font-bold text-slate-800 mt-1">SUVs & 4x4</div>
                  <div className="text-[10px] text-slate-500">From {selectedCountry.symbol} 75 / day</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                  <div className="text-lg">👑</div>
                  <div className="text-xs font-bold text-slate-800 mt-1">VIP & Chauffeur</div>
                  <div className="text-[10px] text-slate-500">From {selectedCountry.symbol} 120 / day</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                  <div className="text-lg">🚐</div>
                  <div className="text-xs font-bold text-slate-800 mt-1">Passenger Vans</div>
                  <div className="text-[10px] text-slate-500">From {selectedCountry.symbol} 90 / day</div>
                </div>
              </div>
            </div>
          </div>
        ) : selectedService === 'HIRE_DRIVER' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDrivers.map((driver) => (
              <div key={driver.id} className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-800 flex items-center justify-center text-xl font-bold">
                      {driver.avatar}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{driver.name}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <span>{driver.city}</span>
                        <span>•</span>
                        <span className="font-bold text-sky-700 bg-sky-50 px-1.5 py-0.2 rounded border border-sky-200">
                          {driver.licenseCategory} License
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                    {driver.bio}
                  </p>

                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 text-center">
                    <div className="p-2 bg-slate-50 rounded-xl">
                      <span className="text-[10px] text-slate-400 font-semibold block">Local Daily Rate</span>
                      <span className="text-sm font-black text-slate-900">PKR {formatPKR(driver.dailyRateLocal)}</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-xl">
                      <span className="text-[10px] text-slate-400 font-semibold block">Outstation Rate</span>
                      <span className="text-sm font-black text-sky-700">PKR {formatPKR(driver.dailyRateOutstation)}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleDirectDriverContactClick(driver)}
                    className="py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Direct Contact</span>
                  </button>
                  <button
                    onClick={() => setHireDriverModal(driver)}
                    className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition"
                  >
                    Hire Driver
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* VEHICLES / SHUTTLES / TRUCKS VIEW */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredListings.length === 0 ? (
              <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-slate-200 p-8 space-y-2">
                <Car className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="font-bold text-slate-700 text-base">No listings found in {searchCity}</h3>
                <p className="text-slate-400 text-xs">Try selecting &quot;{selectedCountry.defaultCity}&quot; or clearing your search term.</p>
              </div>
            ) : (
              filteredListings.map((vehicle) => {
                const coverImage = vehicle.images?.[0]?.originalUrl || 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1200&q=80';
                return (
                  <div
                    key={vehicle.id}
                    className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-2xs hover:shadow-md transition flex flex-col justify-between group"
                  >
                    <div>
                      {/* Photo Header */}
                      <div
                        className="relative aspect-[16/10] bg-slate-100 overflow-hidden cursor-pointer"
                        onClick={() => {
                          setDetailVehicle(vehicle);
                          setActiveImageIdx(0);
                        }}
                      >
                        <img
                          src={coverImage}
                          alt="Vehicle"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md text-[10px] font-bold text-slate-800 shadow-sm flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-emerald-600" />
                          <span>{vehicle.city}</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handleToggleFavorite(vehicle.id, e)}
                          className={`absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center transition cursor-pointer backdrop-blur-md ${
                            savedListingIds.includes(vehicle.id)
                              ? 'bg-rose-500 text-white shadow-sm'
                              : 'bg-black/30 hover:bg-black/50 text-white'
                          }`}
                          aria-label="Save to Favorites"
                        >
                          <Heart className={`w-3.5 h-3.5 ${savedListingIds.includes(vehicle.id) ? 'fill-current' : ''}`} />
                        </button>
                        <div className="absolute bottom-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/90 text-slate-800 shadow-sm">
                          {vehicle.productionYear} · {vehicle.transmission || 'Automatic'}
                        </div>
                      </div>

                      {/* Content Card */}
                      <div className="p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
                              {vehicle.lister?.businessName || 'Verified Fleet Partner'}
                            </span>
                            <h3 className="font-extrabold text-base text-slate-900 group-hover:text-emerald-700 transition">
                              {vehicle.manufacturer?.name} {vehicle.model?.name}
                            </h3>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block font-semibold">
                              {vehicle.serviceType === 'PICK_AND_DROP'
                                ? 'Monthly / Seat'
                                : vehicle.serviceType === 'CITY_TO_CITY'
                                ? 'Per Seat'
                                : vehicle.serviceType === 'GOODS_TRANSPORT'
                                ? 'Base Moving'
                                : 'Daily Rate'}
                            </span>
                            <span className="text-base font-black text-slate-900">
                              PKR {formatPKR(
                                vehicle.serviceType === 'PICK_AND_DROP'
                                  ? vehicle.monthlyRatePerSeat
                                  : vehicle.serviceType === 'CITY_TO_CITY'
                                  ? vehicle.pricePerSeat
                                  : vehicle.dailyRate
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Service specific details */}
                        {vehicle.serviceType === 'PICK_AND_DROP' && (
                          <div className="space-y-2 mt-2">
                            {/* Target Audience & Available Seats Pill */}
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="font-extrabold px-2 py-0.5 rounded-md bg-teal-50 text-teal-900 border border-teal-200">
                                {vehicle.targetAudience || 'Office & School Commute'}
                              </span>
                              <span
                                className={`font-black px-2 py-0.5 rounded-full ${
                                  vehicle.availableSeats > 2
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : vehicle.availableSeats > 0
                                    ? 'bg-amber-100 text-amber-900 animate-pulse'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {vehicle.availableSeats > 0
                                  ? `🟢 ${vehicle.availableSeats} of ${vehicle.totalSeats || 14} Seats Free`
                                  : '🔴 Route Full'}
                              </span>
                            </div>

                            {/* Route & Timings Card */}
                            <div className="p-2.5 bg-teal-50/70 rounded-xl border border-teal-100 text-xs text-teal-950 space-y-1.5">
                              <div className="flex items-start gap-1.5">
                                <Navigation className="w-3.5 h-3.5 text-teal-600 mt-0.5 shrink-0" />
                                <div>
                                  <span className="font-bold block leading-tight text-slate-900">{vehicle.area || vehicle.title}</span>
                                  <span className="text-[10px] text-teal-700 block mt-0.5">
                                    Pickup: <strong>{vehicle.morningPickupTime}</strong> · Return: <strong>{vehicle.eveningDropTime}</strong>
                                  </span>
                                </div>
                              </div>

                              {/* Stop Waypoints Chips */}
                              {vehicle.routeStops && vehicle.routeStops.length > 0 && (
                                <div className="pt-1 border-t border-teal-200/60">
                                  <span className="text-[9px] font-bold text-slate-400 block mb-1">Key Route Stops:</span>
                                  <div className="flex flex-wrap gap-1">
                                    {vehicle.routeStops.slice(0, 4).map((s: any, idx: number) => (
                                      <span key={idx} className="px-1.5 py-0.5 bg-white rounded text-[9px] font-medium text-slate-700 border border-teal-200">
                                        🚏 {s.stop} ({s.time})
                                      </span>
                                    ))}
                                    {vehicle.routeStops.length > 4 && (
                                      <span className="px-1.5 py-0.5 bg-teal-100 rounded text-[9px] font-bold text-teal-800">
                                        +{vehicle.routeStops.length - 4} more
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Assigned Vehicle & Driver */}
                            <div className="flex items-center justify-between text-[11px] text-slate-500 px-0.5">
                              <span className="font-medium truncate max-w-[65%]">
                                🚐 {vehicle.manufacturer?.name} {vehicle.model?.name}
                              </span>
                              <span className="font-semibold text-teal-800">
                                👨‍✈️ {vehicle.assignedDriver?.name || 'Verified Driver'}
                              </span>
                            </div>
                          </div>
                        )}

                        {vehicle.serviceType === 'CITY_TO_CITY' && (
                          <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-100 text-xs text-amber-900 flex items-center justify-between font-bold">
                            <span>{vehicle.originCity} ➔ {vehicle.destinationCity}</span>
                            <span className="text-[11px] font-normal">M-2 Motorway</span>
                          </div>
                        )}

                        {vehicle.serviceType === 'GOODS_TRANSPORT' && (
                          <div className="p-2.5 bg-purple-50 rounded-xl border border-purple-100 text-xs text-purple-900 flex items-center justify-between">
                            <span className="font-bold">Capacity: {vehicle.movingCapacityTons} Tons</span>
                            <span className="text-[11px] text-purple-700">+{vehicle.symbol || selectedCountry.symbol} {vehicle.helperRate} / Helper</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons: Pure Direct Connections */}
                    <div className="p-4 pt-0 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleDirectContactClick(vehicle)}
                        className="py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Direct Contact</span>
                      </button>

                      {vehicle.serviceType === 'PICK_AND_DROP' && (
                        <button
                          onClick={() => {
                            setPndModalVehicle(vehicle);
                            if (vehicle.routeStops && vehicle.routeStops.length > 0) {
                              setPndPickup(vehicle.routeStops[0].stop);
                              setPndDrop(vehicle.routeStops[vehicle.routeStops.length - 1].stop);
                            }
                          }}
                          className="py-2.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span>Check Stops & Join</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {vehicle.serviceType === 'CITY_TO_CITY' && (
                        <button
                          onClick={() => setCtcModalVehicle(vehicle)}
                          className="py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition"
                        >
                          Request Ride
                        </button>
                      )}

                      {vehicle.serviceType === 'GOODS_TRANSPORT' && (
                        <button
                          onClick={() => setShfModalVehicle(vehicle)}
                          className="py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition"
                        >
                          Request Quote
                        </button>
                      )}

                      {(!vehicle.serviceType || vehicle.serviceType === 'CAR_RENTAL') && (
                        <button
                          onClick={() => setBookingVehicle(vehicle)}
                          className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition"
                        >
                          Booking Request
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* 4. PUBLIC FOOTER (DISCRETE ACCESS TO ALL RELEVANT PORTALS & STAFF)        */}
      {/* ========================================================================= */}
      <footer className="bg-white border-t border-slate-200 mt-12 pt-10 pb-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                S
              </div>
              <span className="font-black text-slate-900 text-base">{selectedCountry.code === 'PK' ? 'SafarPK' : 'Safar'}</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {selectedCountry.name}&apos;s premier connecting platform for private car rentals, certified chauffeurs, intercity travel, and cargo shifting.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-800 mb-2">Our Services</h4>
            <ul className="space-y-1.5">
              <li><button onClick={() => setSelectedService('CAR_RENTAL')} className="hover:text-slate-900">Vehicle Rental</button></li>
              <li><button onClick={() => setSelectedService('HIRE_DRIVER')} className="hover:text-slate-900">Hire a Driver</button></li>
              <li><button onClick={() => setSelectedService('CITY_TO_CITY')} className="hover:text-slate-900">City to City Rides</button></li>
              <li><button onClick={() => setSelectedService('PICK_AND_DROP')} className="hover:text-slate-900">Pick & Drop Shuttles</button></li>
              <li><button onClick={() => setSelectedService('GOODS_TRANSPORT')} className="hover:text-slate-900">Home Shifting Movers</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-800 mb-2">Partner Portals</h4>
            <ul className="space-y-1.5">
              <li><Link href="/lister" className="hover:text-slate-900">Lister / Vehicle Owner Portal</Link></li>
              <li><Link href="/driver" className="hover:text-slate-900">Independent Driver Portal</Link></li>
              <li><Link href="/provider?mode=pick_and_drop" className="hover:text-slate-900">School & Office Pick & Drop Portal</Link></li>
              <li><Link href="/provider?mode=commercial_cargo" className="hover:text-slate-900">Home & Office Shifting Logistics</Link></li>
              <li><Link href="/customer" className="hover:text-slate-900">Customer Personal Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-800 mb-2">Authorized Staff</h4>
            <ul className="space-y-1.5">
              <li><Link href="/agent" className="hover:text-blue-600">Verification Agent Desk</Link></li>
              <li><Link href="/admin" className="hover:text-rose-600">Super Admin Control Center</Link></li>
              <li><button onClick={() => setShowHelpModal(true)} className="hover:text-slate-900">Safety & Legal Disclaimer</button></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
          <span>© 2026 {selectedCountry.code === 'PK' ? 'SafarPK' : 'Safar'} Technology Platform. All rights reserved.</span>
          <span>Zero Commission Directory · Built for {selectedCountry.name} & Worldwide Expansion</span>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 5. MODAL: PROVIDER ONBOARDING SELECTOR ("LIST YOUR SERVICE")              */}
      {/* ========================================================================= */}
      {showOnboardingModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 overflow-hidden transition-opacity"
          onClick={() => setShowOnboardingModal(false)}
        >
          <div
            className="bg-white w-full sm:max-w-lg rounded-t-[28px] sm:rounded-3xl shadow-2xl flex flex-col max-h-[90dvh] sm:max-h-[85vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />
            
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md px-5 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-black text-base text-slate-900">Join SafarPK as a Partner</h3>
                <p className="text-[11px] text-slate-500">Select your operational service type to register.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowOnboardingModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-2.5 overflow-y-auto overscroll-contain">
              {/* Option 1: Vehicle Owner & Rental Fleet */}
              <Link
                href="/lister?tab=add_vehicle"
                onClick={() => setShowOnboardingModal(false)}
                className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-lg">
                    🚗
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 group-hover:text-emerald-700">
                      Vehicle Owner & Private Fleet (Lister)
                    </h4>
                    <p className="text-[11px] text-slate-500">Rent out personal cars, luxury sedans, or commercial rental fleet.</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
              </Link>

              {/* Option 2: Independent Chauffeur / Driver */}
              <Link
                href="/driver"
                onClick={() => setShowOnboardingModal(false)}
                className="p-4 rounded-2xl border border-slate-200 hover:border-sky-500 hover:bg-sky-50/50 transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center text-lg">
                    👨‍✈️
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 group-hover:text-sky-700">
                      Independent Chauffeur / Driver
                    </h4>
                    <p className="text-[11px] text-slate-500">Offer your personal driving services for local, hourly & outstation trips.</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600" />
              </Link>

              {/* Option 3: School & Office Pick & Drop Service Provider (Separate Category) */}
              <Link
                href="/provider?mode=pick_and_drop"
                onClick={() => setShowOnboardingModal(false)}
                className="p-4 rounded-2xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center text-lg">
                    🚌
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs text-slate-900 group-hover:text-teal-700">
                        School & Office Pick & Drop Commute Provider
                      </h4>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-teal-100 text-teal-800">
                        Passenger Shuttles
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Demonstrate ongoing routes, intermediate stops, timings, live seat availability, and monthly passenger passes.
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600" />
              </Link>

              {/* Option 4: Home & Office Shifting / Cargo Logistics (Separate Category) */}
              <Link
                href="/provider?mode=commercial_cargo"
                onClick={() => setShowOnboardingModal(false)}
                className="p-4 rounded-2xl border border-slate-200 hover:border-purple-500 hover:bg-purple-50/50 transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center text-lg">
                    📦
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs text-slate-900 group-hover:text-purple-700">
                        Home & Office Shifting / Cargo Logistics
                      </h4>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-100 text-purple-800">
                        Commercial Freight
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Offer Shehzore, Ravi, and Mazda moving trucks with per-KM rates, mazdoor helpers, and packing services.
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5B. MODAL: SMART ROLE-BASED LOGIN & REGISTRATION                          */}
      {/* ========================================================================= */}
      {showAuthModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 overflow-hidden transition-opacity"
          onClick={() => setShowAuthModal(false)}
        >
          <div
            className="bg-white w-full sm:max-w-md rounded-t-[28px] sm:rounded-3xl shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[85vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

            {/* Header with Switcher */}
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md px-5 py-3 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAuthMode('LOGIN')}
                  className={`text-sm font-extrabold pb-0.5 border-b-2 transition cursor-pointer ${
                    authMode === 'LOGIN' ? 'text-emerald-700 border-emerald-600' : 'text-slate-400 border-transparent hover:text-slate-700'
                  }`}
                >
                  Log In
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => setAuthMode('REGISTER')}
                  className={`text-sm font-extrabold pb-0.5 border-b-2 transition cursor-pointer ${
                    authMode === 'REGISTER' ? 'text-emerald-700 border-emerald-600' : 'text-slate-400 border-transparent hover:text-slate-700'
                  }`}
                >
                  Create Account
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              {authError && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs font-semibold flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}
              {authNotice && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs font-semibold flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{authNotice}</span>
                </div>
              )}

              {authMode === 'LOGIN' ? (
                <>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-base text-slate-900">Sign in to SafarPK</h3>
                    <p className="text-[11px] text-slate-500">
                      Enter your phone number or email and password. The platform automatically detects your account role and opens your assigned portal.
                    </p>
                  </div>

                  <form onSubmit={handleSmartLogin} className="space-y-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Phone Number (+92) or Email Address *</label>
                      <input
                        type="text"
                        required
                        placeholder="+92 300 8472910 or name@example.com"
                        value={loginPhone}
                        onChange={(e) => setLoginPhone(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Password *</label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold shadow-sm transition cursor-pointer"
                    >
                      Sign In to My Dashboard
                    </button>
                  </form>

                  {/* 1-Click Fast Demo Logins */}
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      ⚡ Quick 1-Click Demo Profiles (Auto-Role Routed):
                    </span>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                      <button
                        type="button"
                        onClick={() => {
                          loginAsDemoUser('CUSTOMER');
                          setShowAuthModal(false);
                          window.location.href = '/customer';
                        }}
                        className="p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 text-left transition font-bold text-slate-700 cursor-pointer"
                      >
                        👤 Customer
                        <span className="text-[9px] font-normal text-slate-400 block">Hamza Tariq</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          loginAsDemoUser('LISTER');
                          setShowAuthModal(false);
                          window.location.href = '/lister';
                        }}
                        className="p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 text-left transition font-bold text-slate-700 cursor-pointer"
                      >
                        🚗 Vehicle Lister
                        <span className="text-[9px] font-normal text-slate-400 block">Salman Rentals</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          loginAsDemoUser('DRIVER');
                          setShowAuthModal(false);
                          window.location.href = '/driver';
                        }}
                        className="p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 text-left transition font-bold text-slate-700 cursor-pointer"
                      >
                        👨‍✈️ Driver Chauffeur
                        <span className="text-[9px] font-normal text-slate-400 block">Tariq Mahmood</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          loginAsDemoUser('PROVIDER', 'PICK_AND_DROP');
                          setShowAuthModal(false);
                          window.location.href = '/provider?mode=pick_and_drop';
                        }}
                        className="p-2 rounded-xl bg-slate-50 hover:bg-teal-50 border border-slate-200 text-left transition font-bold text-slate-700 cursor-pointer"
                      >
                        🚌 Pick & Drop Commute
                        <span className="text-[9px] font-normal text-slate-400 block">Metro Commute</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          loginAsDemoUser('PROVIDER', 'COMMERCIAL_CARGO');
                          setShowAuthModal(false);
                          window.location.href = '/provider?mode=commercial_cargo';
                        }}
                        className="p-2 rounded-xl bg-slate-50 hover:bg-purple-50 border border-slate-200 text-left transition font-bold text-slate-700 cursor-pointer"
                      >
                        📦 Home Shifting Mover
                        <span className="text-[9px] font-normal text-slate-400 block">Al-Makkah Transport</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowAuthModal(false);
                          window.location.href = '/agent';
                        }}
                        className="p-2 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 text-left transition font-bold text-slate-700 cursor-pointer"
                      >
                        👮 Staff Agent
                        <span className="text-[9px] font-normal text-slate-400 block">Farhan (Lahore)</span>
                      </button>
                    </div>

                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAuthModal(false);
                          window.location.href = '/admin';
                        }}
                        className="w-full p-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-center transition font-bold text-[11px] cursor-pointer"
                      >
                        ⚡ Super Admin Root Authority (Direct Access)
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-base text-slate-900">Create SafarPK Account</h3>
                    <p className="text-[11px] text-slate-500">
                      Select your operational role once upon registration. You will be directly logged into this portal every time without selecting category again.
                    </p>
                  </div>

                  <form onSubmit={handleSmartRegister} className="space-y-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Select Your Role *</label>
                      <div className="grid grid-cols-1 gap-1.5">
                        {[
                          { id: 'CUSTOMER', label: 'Customer / Commuter / Tourist', icon: '👤', path: '/customer' },
                          { id: 'LISTER', label: 'Vehicle Owner & Private Fleet (Lister)', icon: '🚗', path: '/lister' },
                          { id: 'DRIVER', label: 'Independent Chauffeur / Driver', icon: '👨‍✈️', path: '/driver' },
                          { id: 'PICK_DROP', label: 'Pick & Drop Passenger Commuter Operator', icon: '🚌', path: '/provider?mode=pick_and_drop' },
                          { id: 'SHIFTING', label: 'Home & Office Shifting Cargo Mover', icon: '📦', path: '/provider?mode=commercial_cargo' },
                        ].map((role) => (
                          <label
                            key={role.id}
                            className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                              registerRole === role.id ? 'bg-emerald-50 border-emerald-600 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span>{role.icon}</span>
                              <span className="font-bold text-xs">{role.label}</span>
                            </div>
                            <input
                              type="radio"
                              name="role"
                              checked={registerRole === role.id}
                              onChange={() => setRegisterRole(role.id as any)}
                              className="accent-emerald-600"
                            />
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Asad Mehmood"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-xl"
                      />
                    </div>

                    {(registerRole === 'LISTER' || registerRole === 'PICK_DROP' || registerRole === 'SHIFTING') && (
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          {registerRole === 'LISTER' ? 'Business / Fleet / Showroom Name *' : 'Company / Fleet Title *'}
                        </label>
                        <input
                          type="text"
                          required
                          placeholder={registerRole === 'LISTER' ? 'e.g. Shahid Rent a Car & Tours' : 'e.g. Shahid Express Logistics'}
                          value={regBusinessName}
                          onChange={(e) => setRegBusinessName(e.target.value)}
                          className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-slate-900"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          Phone ({selectedCountry?.dialCode || '+92'}) *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder={`${selectedCountry?.dialCode || '+92'} 300 1234567`}
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">City *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Lahore / Berlin"
                          value={regCity}
                          onChange={(e) => setRegCity(e.target.value)}
                          className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Email Address <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="email"
                        placeholder="e.g. name@example.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-xl"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Password * (Min 6 chars)</label>
                        <input
                          type="password"
                          required
                          minLength={6}
                          placeholder="Create strong password"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          className="w-full p-2.5 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-bold text-slate-700 block">Confirm Password *</label>
                          {regConfirmPassword && (
                            <span
                              className={`text-[10px] font-black ${
                                regPassword === regConfirmPassword ? 'text-emerald-600' : 'text-rose-600'
                              }`}
                            >
                              {regPassword === regConfirmPassword ? '✓ Match' : '✕ Mismatch'}
                            </span>
                          )}
                        </div>
                        <input
                          type="password"
                          required
                          minLength={6}
                          placeholder="Re-enter password"
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          className={`w-full p-2.5 border rounded-xl font-medium focus:ring-2 ${
                            regConfirmPassword && regPassword !== regConfirmPassword
                              ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                              : 'border-slate-300 focus:ring-emerald-500'
                          }`}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold shadow-sm transition cursor-pointer"
                    >
                      Complete Registration & Enter Dashboard
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL: CAR RENTAL BOOKING REQUEST (MOBILE-FIRST & ERGONOMIC)            */}
      {/* ========================================================================= */}
      {bookingVehicle && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-md overflow-y-auto cursor-pointer"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setBookingVehicle(null);
              setBookingSuccessMsg(null);
            }
          }}
        >
          <div
            className="bg-white w-full max-w-lg rounded-3xl shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[88vh] overflow-hidden my-auto border border-slate-100 cursor-default animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Pull Indicator */}
            <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

            {/* STICKY HEADER - NEVER SCROLLS OFF */}
            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-5 py-3 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={bookingVehicle.images?.[0]?.originalUrl || 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=400&q=80'}
                  alt="Vehicle"
                  className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0"
                />
                <div className="min-w-0">
                  <h3 className="font-extrabold text-sm text-slate-900 truncate">
                    {bookingVehicle.manufacturer?.name} {bookingVehicle.model?.name}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="font-bold text-emerald-700">
                      {bookingVehicle.symbol || selectedCountry.symbol} {formatPKR(bookingVehicle.dailyRate)}/day
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-500 truncate flex items-center gap-0.5">
                      <MapPin className="w-3 h-3 text-emerald-600 inline" />
                      {bookingVehicle.city}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setBookingVehicle(null);
                  setBookingSuccessMsg(null);
                }}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 flex items-center justify-center transition shrink-0 ml-2 cursor-pointer shadow-xs"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* SUCCESS VIEW */}
            {bookingSuccessMsg ? (
              <div className="p-6 text-center space-y-4 my-auto overflow-y-auto">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-2xl font-bold">
                  ✓
                </div>
                <h3 className="font-black text-lg text-slate-900">Request Sent & Mutual Clearance Unlocked!</h3>
                <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                  {bookingSuccessMsg}
                </p>

                {/* Mutual Document Vault Badge */}
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-left space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-emerald-950 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-700" />
                      <span>Mutual Identity Credentials Unlocked</span>
                    </span>
                    <span className="text-[10px] font-bold bg-white text-emerald-900 px-2 py-0.5 rounded-full border border-emerald-300">
                      ETO 2002 Compliant
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-tight">
                    Under platform mutual disclosure policy, you can now inspect the vehicle&apos;s official <strong>Excise Registration Smart Card</strong>, engine/chassis numbers, and the fleet owner&apos;s <strong>FBR NTN tax record</strong>.
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
                  <button
                    type="button"
                    onClick={() => setShowMutualDocModal(true)}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <span>View Vehicle Smart Card & FBR NTN</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleWhatsAppLead(bookingVehicle)}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Direct Booking Chat</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBookingVehicle(null);
                      setBookingSuccessMsg(null);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              /* FORM BODY (COMPACT & BEAUTIFUL) */
              <>
                <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-3.5 text-xs">
                  {/* Duration & Dates */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-slate-700">Rental Duration</span>
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        {bookingDays} Day{bookingDays > 1 ? 's' : ''} Selected
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Start Date</label>
                        <input
                          type="date"
                          min={todayStr}
                          value={bookingStartDate}
                          onChange={(e) => {
                            setBookingStartDate(e.target.value);
                            if (bookingEndDate < e.target.value) setBookingEndDate(e.target.value);
                          }}
                          className="w-full text-xs font-bold text-slate-900 bg-transparent border-0 p-0 focus:ring-0 cursor-pointer"
                          required
                        />
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">End Date</label>
                        <input
                          type="date"
                          min={bookingStartDate || todayStr}
                          value={bookingEndDate}
                          onChange={(e) => setBookingEndDate(e.target.value)}
                          className="w-full text-xs font-bold text-slate-900 bg-transparent border-0 p-0 focus:ring-0 cursor-pointer"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Drive Mode Segmented Selector */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1.5">Driving Option</label>
                    <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                      <button
                        type="button"
                        onClick={() => {
                          setBookingWithDriver(false);
                          setLicenseUploadError(null);
                        }}
                        className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          !bookingWithDriver
                            ? 'bg-white text-emerald-800 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <span>🚗</span>
                        <span>Self-Drive</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setBookingWithDriver(true);
                          setLicenseUploadError(null);
                        }}
                        className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          bookingWithDriver
                            ? 'bg-white text-emerald-800 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <span>👨‍✈️</span>
                        <span>With Chauffeur (+2,500)</span>
                      </button>
                    </div>
                  </div>

                  {/* Chauffeur Note vs Self-Drive License Check */}
                  {bookingWithDriver ? (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5 text-emerald-950">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs flex items-center gap-1.5">
                          <UserCheck className="w-4 h-4 text-emerald-700" />
                          <span>Designated Company Chauffeur Assigned</span>
                        </span>
                        <span className="text-[10px] font-bold bg-white text-emerald-900 px-2 py-0.5 rounded-full border border-emerald-300">
                          Assigned to this Vehicle
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs pt-1">
                        <div>
                          <span className="font-extrabold text-slate-900 block text-xs">
                            {bookingVehicle.assignedDriver?.name || 'Muhammad Akram'}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {bookingVehicle.assignedDriver?.phone || '+92 301 8472910'}
                          </span>
                        </div>
                        <span className="text-[11px] text-emerald-800 font-medium">
                          {bookingVehicle.assignedDriver?.license || 'Commercial Licensed Chauffeur'}
                        </span>
                      </div>
                      <p className="text-[10px] text-emerald-700 leading-tight pt-0.5">
                        * Designated driver <strong>{bookingVehicle.assignedDriver?.name || 'Muhammad Akram'}</strong> will arrive with this {bookingVehicle.manufacturer?.name} {bookingVehicle.model?.name}. You do not need to provide a driving license.
                      </p>
                    </div>
                  ) : (() => {
                    const activePolicy = (() => {
                      if (typeof window === 'undefined') return 'REQUIRED';
                      try {
                        const stored = localStorage.getItem('safarpk_country_settings');
                        if (stored) {
                          const parsed = JSON.parse(stored);
                          if (parsed.countryRules && parsed.countryRules[selectedCountry.code]) {
                            return parsed.countryRules[selectedCountry.code].cardUploadPolicy || 'REQUIRED';
                          }
                          return parsed.globalCardUploadPolicy || 'REQUIRED';
                        }
                      } catch (e) {}
                      return selectedCountry.code === 'DE' ? 'OPTIONAL' : 'REQUIRED';
                    })();

                    if (activePolicy === 'HIDDEN') {
                      return (
                        <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-950">
                          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                          <div>
                            <span className="font-bold block">Instant Direct Booking Active for {selectedCountry.name}</span>
                            <span className="text-[11px] text-emerald-800">
                              Document upload is disabled by platform for this country. Please present your valid license and ID in person during key handover.
                            </span>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                            <span>Driving License & Identity Verification</span>
                          </span>
                          {activePolicy === 'OPTIONAL' ? (
                            <span className="text-[10px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded-full border border-amber-300">
                              Optional for {selectedCountry.name}
                            </span>
                          ) : licenseExtracted ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-700" />
                              <span>Verified</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full">
                              Required by Platform
                            </span>
                          )}
                        </div>

                        {/* Error Alert if uploaded invalid image like banner */}
                        {licenseUploadError && (
                          <div className="p-2.5 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-950 flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <strong className="block text-rose-800 font-bold text-[11px]">Upload Validation Error</strong>
                              <p className="text-[11px] leading-tight text-rose-900">{licenseUploadError}</p>
                            </div>
                          </div>
                        )}

                        {!licenseDocPreview ? (
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <label className="flex-1 py-2 px-3 bg-white border border-amber-300 hover:border-amber-500 rounded-xl text-center cursor-pointer transition flex items-center justify-center gap-2 group shadow-2xs">
                                <Upload className="w-4 h-4 text-amber-700 group-hover:scale-110 transition" />
                                <span className="font-bold text-xs text-amber-950">
                                  Upload Driving License Photo {activePolicy === 'OPTIONAL' ? '(Optional)' : '*'}
                                </span>
                                <input
                                  type="file"
                                  accept="image/*,.pdf"
                                  className="hidden"
                                  onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) handleLicenseFileUpload(f);
                                  }}
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => handleLicenseFileUpload(undefined, true)}
                                className="py-2 px-3 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                                title="Test with authentic sample driving license"
                              >
                                <Scan className="w-3.5 h-3.5 text-amber-700" />
                                <span>⚡ Demo License</span>
                              </button>
                            </div>
                            <span className="text-[10px] text-slate-500 block">
                              Upload front photo of your official Driving License ({selectedCountry.name}).
                            </span>
                          </div>
                        ) : licenseScanning ? (
                          <div className="p-2.5 bg-white border border-amber-200 rounded-xl text-center flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                            <span className="font-bold text-xs text-amber-950">Validating & Extracting DLIMS License OCR...</span>
                          </div>
                        ) : (
                          <div className="p-2 bg-white border border-amber-200 rounded-xl flex items-center justify-between gap-2 shadow-2xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <img src={licenseDocPreview} alt="License" className="w-10 h-7 object-cover rounded-md border shrink-0" />
                              <div className="min-w-0">
                                <span className="font-bold text-xs text-slate-900 block truncate">{licenseFileName}</span>
                                <span className="text-[10px] text-emerald-700 font-semibold">✓ License Scanned & Verified</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setLicenseDocPreview(null);
                                setLicenseExtracted(false);
                                setCustomerLicense('');
                                setLicenseUploadError(null);
                              }}
                              className="text-[11px] font-bold text-rose-600 hover:underline px-2 py-1 shrink-0 cursor-pointer"
                            >
                              Change
                            </button>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-slate-700 block mb-1">
                              Driving License # {activePolicy === 'REQUIRED' ? '*' : '(Optional)'}
                            </label>
                            <input
                              type="text"
                              value={customerLicense}
                              onChange={(e) => setCustomerLicense(e.target.value)}
                              placeholder={licenseExtracted ? '' : 'DL-Number...'}
                              className={`w-full p-2 bg-white border rounded-lg font-mono font-bold text-xs ${
                                licenseExtracted ? 'border-emerald-400 bg-emerald-50/30 text-emerald-950' : 'border-amber-200 text-slate-900'
                              }`}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-700 block mb-1">
                              {selectedCountry.idDocumentName || 'National ID / Passport'} *
                            </label>
                            <input
                              type="text"
                              value={customerCnic}
                              onChange={(e) => setCustomerCnic(e.target.value)}
                              placeholder={selectedCountry.idPlaceholder || 'Official ID or Passport #'}
                              className="w-full p-2 bg-white border border-amber-200 rounded-lg font-mono font-bold text-xs"
                              required
                            />
                          </div>
                        </div>

                        {/* Statutory Privacy Protection Guarantee */}
                        <div className="p-2.5 bg-blue-50/80 border border-blue-200 rounded-xl text-[11px] text-blue-950 space-y-1">
                          <span className="font-bold flex items-center gap-1.5 text-blue-900">
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
                            Privacy Notice & Consent Protection
                          </span>
                          <p className="text-[10px] text-blue-800 leading-tight">
                            As per {selectedCountry.name} privacy regulations and electronic commerce guidelines, your documents are strictly encrypted and never published publicly. Verified credentials are <strong>only shared with the vehicle owner upon confirmed booking</strong> to establish bilateral trust and safeguard key handover.
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Customer Contact & Saved Profile Integration */}
                  {isCustomerProfileSaved && customerName && !showEditProfileModal ? (
                    <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                            ✓ Saved Profile Linked
                          </span>
                          <span className="text-xs font-black text-slate-900">{customerName}</span>
                        </div>
                        <div className="text-[11px] text-slate-600 mt-1 flex items-center gap-2">
                          <span>📞 {customerPhone}</span>
                          <span>•</span>
                          <span>{selectedCountry.idDocumentName}: {customerCnic || 'Saved'}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowEditProfileModal(true)}
                        className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-white hover:bg-emerald-100 border border-emerald-300 rounded-lg transition cursor-pointer"
                      >
                        Edit Details
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-1">Your Full Name *</label>
                          <input
                            type="text"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            placeholder="Full Name"
                            className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-1">Phone Number *</label>
                          <input
                            type="tel"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            placeholder="Phone / WhatsApp Number"
                            className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white font-mono font-bold"
                            required
                          />
                        </div>
                      </div>
                      {isCustomerProfileSaved && showEditProfileModal && (
                        <div className="text-right">
                          <button
                            type="button"
                            onClick={() => {
                              handleSaveCustomerProfile(customerName, customerPhone, customerCnic, customerLicense);
                              setShowEditProfileModal(false);
                            }}
                            className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
                          >
                            ✓ Save & Minimize
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">Delivery Address / Area in {bookingVehicle.city} *</label>
                    <input
                      type="text"
                      value={bookingPickupArea}
                      onChange={(e) => setBookingPickupArea(e.target.value)}
                      placeholder="e.g. Central Metro, Airport Terminal, Downtown"
                      className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white"
                      required
                    />
                  </div>

                  {/* Mutual Consent Checkbox */}
                  {!bookingWithDriver && (
                    <div className="p-2.5 bg-emerald-50/70 rounded-xl border border-emerald-200">
                      <label className="flex items-start gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={bookingMutualConsentAgreed}
                          onChange={(e) => setBookingMutualConsentAgreed(e.target.checked)}
                          className="w-4 h-4 text-emerald-600 rounded mt-0.5 cursor-pointer shrink-0"
                        />
                        <span className="text-[11px] text-emerald-950 leading-tight">
                          <strong>Mutual Verification Consent:</strong> I agree to exchange verified credentials with the vehicle owner (I can view their official <strong>Vehicle Registration Certificate & Identity</strong>, and the owner will inspect my driving license upon key handover).
                        </span>
                      </label>
                    </div>
                  )}

                  {/* Platform Zero Liability Terms */}
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={bookingTermsAgreed}
                        onChange={(e) => setBookingTermsAgreed(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 rounded mt-0.5 cursor-pointer shrink-0"
                      />
                      <span className="text-[11px] text-slate-600 leading-tight">
                        I agree to Platform Terms. Safar connects me directly with the vehicle provider with <strong>zero platform middleman liability</strong> for cash or mechanical condition.
                      </span>
                    </label>
                  </div>
                </div>

                {/* STICKY FOOTER ACTION BAR */}
                <div className="sticky bottom-0 z-20 bg-white/95 backdrop-blur-md px-5 py-3 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0 pb-safe">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold leading-none mb-0.5">Estimated Total</span>
                    <span className="font-extrabold text-base text-slate-900 leading-tight">
                      {bookingVehicle.symbol || selectedCountry.symbol} {formatPKR(bookingTotalEst)}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold block">
                      {bookingDays} day(s) {bookingWithDriver ? '· w/ chauffeur' : '· self-drive'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleBookingSubmit}
                    disabled={!bookingTermsAgreed || bookingSubmitting || (!bookingWithDriver && !bookingMutualConsentAgreed)}
                    className={`px-5 py-2.5 rounded-xl font-extrabold text-xs text-white transition cursor-pointer flex items-center gap-1.5 shadow-sm ${
                      bookingTermsAgreed && (bookingWithDriver || bookingMutualConsentAgreed) && !bookingSubmitting
                        ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20 active:scale-95'
                        : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {bookingSubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <span>Confirm Booking Request</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6B. MODAL: MUTUAL CREDENTIALS VAULT (EXCISE SMART CARD & OWNER FBR NTN)   */}
      {/* ========================================================================= */}
      {showMutualDocModal && confirmedBookingPayload && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={() => setShowMutualDocModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  📄
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Vehicle Registration & Fleet Owner Credentials
                  </h3>
                  <span className="text-[10px] text-emerald-700 font-bold">
                    ✓ Verified by SafarPK Compliance & Excise Records
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowMutualDocModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Excise Registration Smart Card Scan Preview */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                  <Car className="w-4 h-4 text-emerald-600" />
                  <span>Excise & Taxation Vehicle Smart Card</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Govt Verified
                </span>
              </div>

              {/* Sample Smart Card Visual Preview */}
              <div className="p-3 bg-gradient-to-tr from-slate-900 to-slate-800 text-white rounded-xl shadow-inner space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-slate-700 pb-1.5 text-[10px] font-mono">
                  <span className="text-emerald-400 font-bold">PUNJAB EXCISE & TAXATION DEPT</span>
                  <span className="text-slate-400">SMART REGISTRATION CARD</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[9px] text-slate-400 block uppercase">Registration Mark</span>
                    <span className="text-base font-black tracking-widest text-white font-mono">
                      {confirmedBookingPayload.vehicleSmartCard?.registrationNo || 'LEA-24-9988'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-slate-400 block uppercase">Token Status</span>
                    <span className="text-[11px] font-bold text-emerald-400">Lifetime Tax Paid</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] pt-1 border-t border-slate-700/60 font-mono text-slate-300">
                  <div>
                    <span className="text-slate-500 block">Chassis Number:</span>
                    <span>{confirmedBookingPayload.vehicleSmartCard?.chassisNo || 'NZE140-5019821'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Engine Number:</span>
                    <span>{confirmedBookingPayload.vehicleSmartCard?.engineNo || '2ZR-FE-9812401'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Fleet Owner Business & Tax Credentials */}
            <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-emerald-950 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-emerald-700" />
                  <span>Fleet Owner Tax & Business Credentials</span>
                </span>
                <span className="text-[10px] font-bold bg-white text-emerald-900 px-2 py-0.5 rounded-full border border-emerald-300">
                  ATL Active Taxpayer
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div>
                  <span className="text-slate-500 block text-[10px]">Business Name:</span>
                  <strong className="text-slate-900">{confirmedBookingPayload.listerBusinessName || 'Salman Rent a Car & Tours'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">FBR NTN Number:</span>
                  <span className="font-mono font-bold text-slate-900">{confirmedBookingPayload.vehicleSmartCard?.taxpayerNtn || '7819201-3'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Contact Direct:</span>
                  <span className="font-mono font-bold text-emerald-800">{confirmedBookingPayload.listerPhone || '+92 300 1234567'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Vehicle Fitness Expiry:</span>
                  <span className="font-mono font-bold text-slate-900">{confirmedBookingPayload.vehicleSmartCard?.fitnessValidTill || '2026-12-31'}</span>
                </div>
              </div>
            </div>

            {/* Legal Notice */}
            <p className="text-[10px] text-slate-500 leading-tight">
              * This document vault is shared exclusively with you under mutual booking contract in compliance with Electronic Transactions Ordinance (ETO 2002) & PECA 2016 for key handover security.
            </p>

            <button
              type="button"
              onClick={() => setShowMutualDocModal(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Close Credentials Vault
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. MODAL: VEHICLE SPECIFICATIONS & GALLERY DETAILS                         */}
      {/* ========================================================================= */}
      {detailVehicle && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 overflow-hidden transition-opacity"
          onClick={() => setDetailVehicle(null)}
        >
          <div
            className="bg-white w-full sm:max-w-xl rounded-t-[28px] sm:rounded-3xl shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[88vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-5 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                  {detailVehicle.lister?.businessName || 'Verified Fleet Partner'}
                </span>
                <h3 className="font-black text-base text-slate-900">
                  {detailVehicle.manufacturer?.name} {detailVehicle.model?.name} ({detailVehicle.productionYear})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailVehicle(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain p-5 space-y-4 text-xs">
              <div className="relative aspect-[16/10] bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
                <img
                  src={detailVehicle.images?.[activeImageIdx]?.originalUrl || detailVehicle.images?.[0]?.originalUrl || 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1200&q=80'}
                  alt="Vehicle View"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/95 text-[10px] font-bold text-slate-800 shadow-sm flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-600" />
                  <span>{detailVehicle.city}</span>
                </div>
              </div>

              {detailVehicle.images && detailVehicle.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {detailVehicle.images.map((img: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIdx(idx)}
                      className={`w-14 h-10 rounded-lg overflow-hidden border-2 shrink-0 transition ${
                        activeImageIdx === idx ? 'border-emerald-600 ring-2 ring-emerald-200' : 'border-slate-200'
                      }`}
                    >
                      <img src={img.originalUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Specs Grid */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">Transmission</span>
                  <span className="font-bold text-slate-800 capitalize">{detailVehicle.transmission?.toLowerCase() || 'Automatic'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">Fuel Type</span>
                  <span className="font-bold text-slate-800 capitalize">{detailVehicle.fuelType?.toLowerCase() || 'Petrol'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">Location</span>
                  <span className="font-bold text-slate-800">{detailVehicle.area || detailVehicle.city}</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Verified Safe Platform Booking</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Documents verified by SafarPK compliance agents. Connect directly with the owner for key handover.
                </p>
              </div>
            </div>

            <div className="sticky bottom-0 z-20 bg-white/95 backdrop-blur-md px-5 py-3 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0 pb-safe">
              <div>
                <span className="text-[10px] text-slate-400 block">Daily Rate</span>
                <span className="font-extrabold text-base text-slate-900">
                  {detailVehicle.symbol || selectedCountry.symbol || 'Rs'} {formatPKR(detailVehicle.dailyRate)}/day
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleWhatsAppLead(detailVehicle)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>Direct Contact</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const v = detailVehicle;
                    setDetailVehicle(null);
                    setBookingVehicle(v);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition cursor-pointer"
                >
                  Request to Book
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. MODAL: INDEPENDENT DRIVER HIRE REQUEST                                  */}
      {/* ========================================================================= */}
      {hireDriverModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 overflow-hidden transition-opacity"
          onClick={() => setHireDriverModal(null)}
        >
          <div
            className="bg-white w-full sm:max-w-md rounded-t-[28px] sm:rounded-3xl shadow-2xl flex flex-col max-h-[90dvh] sm:max-h-[85vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-5 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center text-xl font-bold">
                  {hireDriverModal.avatar || '👨‍✈️'}
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">{hireDriverModal.name}</h3>
                  <span className="text-[11px] text-sky-700 font-bold">
                    {hireDriverModal.licenseCategory} Licensed · {hireDriverModal.city}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHireDriverModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 overflow-y-auto overscroll-contain text-xs">
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">Local Daily Rate</span>
                  <span className="font-black text-sm text-slate-900">PKR {formatPKR(hireDriverModal.dailyRateLocal)}</span>
                </div>
                <div className="p-2.5 bg-sky-50 rounded-xl border border-sky-100">
                  <span className="text-[10px] text-sky-700 block font-semibold">Outstation Rate</span>
                  <span className="font-black text-sm text-sky-800">PKR {formatPKR(hireDriverModal.dailyRateOutstation)}</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">Your Full Name *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">Phone Number *</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl font-mono text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">Duty Location & Dates</label>
                <input
                  type="text"
                  placeholder="e.g. Lahore to Islamabad (3 Days trip)"
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 leading-tight">
                Direct engagement between customer and driver. SafarPK provides directory matching with zero liability.
              </div>
            </div>

            <div className="sticky bottom-0 z-20 bg-white/95 backdrop-blur-md px-5 py-3 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0 pb-safe">
              <button
                type="button"
                onClick={() => {
                  const phone = hireDriverModal.phone || '+923019821045';
                  const text = `As-salamu alaykum ${hireDriverModal.name}! I am looking to hire a professional driver in ${hireDriverModal.city}. Please let me know your availability.`;
                  window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
                  setHireDriverModal(null);
                }}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold text-xs transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Contact Driver Directly</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. MODAL: PICK & DROP ROUTE REQUEST (WITH LIVE STOPS & TIMELINE)           */}
      {/* ========================================================================= */}
      {pndModalVehicle && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 overflow-hidden transition-opacity"
          onClick={() => setPndModalVehicle(null)}
        >
          <div
            className="bg-white w-full sm:max-w-lg rounded-t-[28px] sm:rounded-3xl shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[88vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

            {/* STICKY HEADER */}
            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-5 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider block">
                  {pndModalVehicle.lister?.businessName || 'Verified Commuter Vanpool'}
                </span>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 leading-tight">
                  {pndModalVehicle.title || pndModalVehicle.area}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPndModalVehicle(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* BODY */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-5 space-y-4 text-xs">
              {/* Vehicle & Chauffeur Live Status Card */}
              <div className="p-3.5 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-2xl border border-teal-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🚐</span>
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-900">
                        {pndModalVehicle.manufacturer?.name} {pndModalVehicle.model?.name}
                      </h4>
                      <span className="text-[10px] text-teal-800 font-semibold block">
                        {pndModalVehicle.acStatus || '❄️ Chilled Dual AC'} · {pndModalVehicle.city}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black ${
                        pndModalVehicle.availableSeats > 2
                          ? 'bg-emerald-100 text-emerald-900'
                          : pndModalVehicle.availableSeats > 0
                          ? 'bg-amber-100 text-amber-900 animate-pulse'
                          : 'bg-rose-100 text-rose-900'
                      }`}
                    >
                      {pndModalVehicle.availableSeats > 0
                        ? `🟢 ${pndModalVehicle.availableSeats} of ${pndModalVehicle.totalSeats || 14} Seats Left`
                        : '🔴 Route Full'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-teal-200/60 text-[11px] text-slate-600">
                  <span>
                    Chauffeur: <strong>{pndModalVehicle.assignedDriver?.name || 'Assigned Driver'}</strong> (
                    {pndModalVehicle.assignedDriver?.phone || '+92 300 1234567'})
                  </span>
                  <span className="text-teal-900 font-bold">
                    Daily Schedule: {pndModalVehicle.morningPickupTime} – {pndModalVehicle.eveningDropTime}
                  </span>
                </div>
              </div>

              {/* Interactive Stops & Waypoints Timeline */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                    <Navigation className="w-4 h-4 text-teal-600" />
                    <span>Scheduled Route Stops (Click to select)</span>
                  </span>
                  <span className="text-[10px] text-teal-700 font-semibold">Morning Pickup Times</span>
                </div>

                <p className="text-[11px] text-slate-500 leading-tight">
                  If your office, school, or residence lies between any of these points, you can join this shuttle!
                </p>

                <div className="space-y-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-200 max-h-48 overflow-y-auto">
                  {(pndModalVehicle.routeStops || [
                    { stop: 'Origin Terminal', time: pndModalVehicle.morningPickupTime || '07:30 AM' },
                    { stop: 'Intermediate Stop A', time: '07:50 AM' },
                    { stop: 'Intermediate Stop B', time: '08:10 AM' },
                    { stop: 'Destination Office Hub', time: pndModalVehicle.eveningDropTime || '08:30 AM' },
                  ]).map((s: any, idx: number, arr: any[]) => {
                    const isPickup = pndPickup === s.stop;
                    const isDrop = pndDrop === s.stop;
                    return (
                      <div
                        key={idx}
                        className={`p-2 rounded-xl transition flex items-center justify-between gap-2 border ${
                          isPickup
                            ? 'bg-teal-50 border-teal-500 text-teal-950 font-bold'
                            : isDrop
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold'
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="truncate text-xs">{s.stop}</span>
                          <span className="font-mono text-[10px] text-slate-400">({s.time})</span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => setPndPickup(s.stop)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                              isPickup
                                ? 'bg-teal-600 text-white'
                                : 'bg-slate-100 hover:bg-teal-100 text-slate-700'
                            }`}
                          >
                            {isPickup ? '✓ Pickup' : 'Set Pickup'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setPndDrop(s.stop)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                              isDrop
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 hover:bg-emerald-100 text-slate-700'
                            }`}
                          >
                            {isDrop ? '✓ Drop' : 'Set Drop'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Boarding & Drop-off Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1">
                    My Boarding / Pickup Point *
                  </label>
                  <input
                    type="text"
                    value={pndPickup}
                    onChange={(e) => setPndPickup(e.target.value)}
                    placeholder="e.g. Faizabad Interchange or Saddar"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1">
                    My Drop-off Point / Office Hub *
                  </label>
                  <input
                    type="text"
                    value={pndDrop}
                    onChange={(e) => setPndDrop(e.target.value)}
                    placeholder="e.g. Blue Area Islamabad or F-8"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                    required
                  />
                </div>
              </div>

              {/* Commute Category & Plan Selection */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1">Commuter Category</label>
                  <select
                    value={pndCategory}
                    onChange={(e: any) => setPndCategory(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    <option value="OFFICE">🏢 Office Staff & Corporate</option>
                    <option value="STUDENT">🎓 School / College / Uni</option>
                    <option value="WOMEN_ONLY">👩‍💼 Women / Family Group</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1">Commute Plan</label>
                  <select
                    value={pndPlan}
                    onChange={(e: any) => setPndPlan(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    <option value="MONTHLY">Monthly Round-Trip (Morning + Eve)</option>
                    <option value="MORNING_ONLY">Monthly (Morning Only - 60%)</option>
                    <option value="DAILY">Daily Seat Commute (1-Day Trial)</option>
                  </select>
                </div>
              </div>

              {/* Seats & Contact Details */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1">Seats Count</label>
                  <select
                    value={pndSeats}
                    onChange={(e) => setPndSeats(Number(e.target.value))}
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>
                        {n} Seat{n > 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1">Your Name</label>
                  <input
                    type="text"
                    value={pndPassengerName}
                    onChange={(e) => setPndPassengerName(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs"
                    placeholder="Hamza Tariq"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={pndPassengerPhone}
                    onChange={(e) => setPndPassengerPhone(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold"
                    placeholder="+92 300 8472910"
                  />
                </div>
              </div>
            </div>

            {/* STICKY FOOTER */}
            <div className="sticky bottom-0 z-20 bg-white/95 backdrop-blur-md px-5 py-3 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0 pb-safe">
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold leading-none mb-0.5">
                  {pndPlan === 'DAILY' ? 'Daily Fare' : 'Monthly Seat Fare'}
                </span>
                <span className="font-black text-base text-teal-900 leading-tight">
                  {pndModalVehicle.symbol || selectedCountry.symbol || 'Rs'}{' '}
                  {formatPKR(
                    (pndPlan === 'DAILY'
                      ? pndModalVehicle.dailySeatRate || 500
                      : pndPlan === 'MORNING_ONLY'
                      ? Math.round((pndModalVehicle.monthlyRatePerSeat || 9500) * 0.6)
                      : pndModalVehicle.monthlyRatePerSeat || 9500) * pndSeats
                  )}
                </span>
                <span className="text-[10px] text-teal-700 font-bold block">
                  {pndSeats} Seat{pndSeats > 1 ? 's' : ''} · {pndPlan === 'DAILY' ? 'Single day' : 'Monthly pass'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  const calculatedFare =
                    (pndPlan === 'DAILY'
                      ? pndModalVehicle.dailySeatRate || 500
                      : pndPlan === 'MORNING_ONLY'
                      ? Math.round((pndModalVehicle.monthlyRatePerSeat || 9500) * 0.6)
                      : pndModalVehicle.monthlyRatePerSeat || 9500) * pndSeats;

                  const text = `As-salamu alaykum! Inquiring for Pick & Drop route (${pndModalVehicle.title || pndModalVehicle.area}).
- Pickup Stop: ${pndPickup || 'Along route'}
- Drop Stop: ${pndDrop || 'Destination'}
- Passenger Name: ${pndPassengerName}
- Commuter Category: ${pndCategory}
- Seats Required: ${pndSeats}
- Plan: ${pndPlan} (Est: PKR ${formatPKR(calculatedFare)})
Please confirm seat availability on this route.`;

                  handleWhatsAppLead(pndModalVehicle, text);
                  setPndModalVehicle(null);
                }}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-extrabold text-xs transition flex items-center gap-1.5 shadow-sm shadow-teal-600/20 active:scale-95 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Confirm Route Booking</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. MODAL: CITY TO CITY RIDE REQUEST                                      */}
      {/* ========================================================================= */}
      {ctcModalVehicle && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 overflow-hidden transition-opacity"
          onClick={() => setCtcModalVehicle(null)}
        >
          <div
            className="bg-white w-full sm:max-w-md rounded-t-[28px] sm:rounded-3xl shadow-2xl flex flex-col max-h-[90dvh] sm:max-h-[85vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-5 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">City to City Ride Request</h3>
                <span className="text-[11px] text-amber-700 font-bold">
                  {ctcModalVehicle.originCity} ➔ {ctcModalVehicle.destinationCity}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setCtcModalVehicle(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 overflow-y-auto overscroll-contain text-xs">
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">Per Seat Sharing</span>
                  <span className="font-black text-sm text-slate-900">PKR {formatPKR(ctcModalVehicle.pricePerSeat || 2800)}</span>
                </div>
                <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200">
                  <span className="text-[10px] text-amber-700 block font-semibold">Full Private Car</span>
                  <span className="font-black text-sm text-amber-900">PKR {formatPKR(ctcModalVehicle.dailyRate || 14000)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setCtcMode('SHARING')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition ${
                    ctcMode === 'SHARING' ? 'bg-white text-amber-800 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Shared Seat
                </button>
                <button
                  type="button"
                  onClick={() => setCtcMode('PRIVATE')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition ${
                    ctcMode === 'PRIVATE' ? 'bg-white text-amber-800 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Full Private Car
                </button>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">Departure Date</label>
                <input
                  type="date"
                  min={todayStr}
                  value={ctcDate}
                  onChange={(e) => setCtcDate(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                />
              </div>

              {ctcMode === 'SHARING' && (
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1">Number of Seats</label>
                  <select
                    value={ctcSeats}
                    onChange={(e) => setCtcSeats(Number(e.target.value))}
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    {[1, 2, 3, 4].map((n) => (
                      <option key={n} value={n}>{n} Passenger{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 z-20 bg-white/95 backdrop-blur-md px-5 py-3 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0 pb-safe">
              <button
                type="button"
                onClick={() => {
                  const text = `As-salamu alaykum! Requesting ride from ${ctcModalVehicle.originCity} to ${ctcModalVehicle.destinationCity} on ${ctcDate}. Mode: ${ctcMode} (${ctcMode === 'SHARING' ? `${ctcSeats} seat(s)` : 'Full Car'}). Please confirm departure time.`;
                  handleWhatsAppLead(ctcModalVehicle, text);
                  setCtcModalVehicle(null);
                }}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-extrabold text-xs transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Confirm Intercity Ride Directly</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 11. MODAL: HOME & OFFICE SHIFTING QUOTE REQUEST                           */}
      {/* ========================================================================= */}
      {shfModalVehicle && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 overflow-hidden transition-opacity"
          onClick={() => setShfModalVehicle(null)}
        >
          <div
            className="bg-white w-full sm:max-w-md rounded-t-[28px] sm:rounded-3xl shadow-2xl flex flex-col max-h-[90dvh] sm:max-h-[85vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-5 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Home & Office Shifting Quote</h3>
                <span className="text-[11px] text-purple-700 font-bold">
                  {shfModalVehicle.manufacturer?.name} {shfModalVehicle.model?.name} ({shfModalVehicle.movingCapacityTons} Tons)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShfModalVehicle(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 overflow-y-auto overscroll-contain text-xs">
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-purple-700 font-semibold block">Base Moving Fare</span>
                  <span className="font-black text-sm text-slate-900">{shfModalVehicle.symbol || selectedCountry.symbol || 'Rs'} {formatPKR(shfModalVehicle.dailyRate)}</span>
                </div>
                <span className="text-xs font-bold text-purple-800 bg-white px-2.5 py-1 rounded-lg border border-purple-200">
                  +{shfModalVehicle.symbol || selectedCountry.symbol || 'Rs'} {shfModalVehicle.helperRate || 1500} / Helper
                </span>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">Moving From (Current Address)</label>
                <input
                  type="text"
                  value={shfFrom}
                  onChange={(e) => setShfFrom(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">Moving To (New Address)</label>
                <input
                  type="text"
                  value={shfTo}
                  onChange={(e) => setShfTo(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">Labor Helpers (Mazdoors)</label>
                <select
                  value={shfHelpers}
                  onChange={(e) => setShfHelpers(Number(e.target.value))}
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                >
                  <option value={0}>No Helpers (Vehicle & Driver only)</option>
                  <option value={1}>1 Mazdoor Helper</option>
                  <option value={2}>2 Mazdoor Helpers (Recommended)</option>
                  <option value={3}>3 Mazdoor Helpers</option>
                  <option value={4}>4 Mazdoor Helpers (Heavy luggage/stairs)</option>
                </select>
              </div>
            </div>

            <div className="sticky bottom-0 z-20 bg-white/95 backdrop-blur-md px-5 py-3 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0 pb-safe">
              <button
                type="button"
                onClick={() => {
                  const text = `As-salamu alaykum! Requesting shifting quote for ${shfModalVehicle.manufacturer?.name} ${shfModalVehicle.model?.name} (${shfModalVehicle.movingCapacityTons} Tons). From: ${shfFrom}, To: ${shfTo}, Helpers: ${shfHelpers}. Please share total quote.`;
                  handleWhatsAppLead(shfModalVehicle, text);
                  setShfModalVehicle(null);
                }}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-extrabold text-xs transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Request Moving Quote Directly</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 12. MODAL: SAFETY & LEGAL DISCLAIMER                                      */}
      {/* ========================================================================= */}
      {showHelpModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 overflow-hidden transition-opacity"
          onClick={() => setShowHelpModal(false)}
        >
          <div
            className="bg-white w-full sm:max-w-lg rounded-t-[28px] sm:rounded-3xl shadow-2xl flex flex-col max-h-[90dvh] sm:max-h-[85vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md px-5 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="font-black text-base text-slate-900">Safety & Legal Notice</h3>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs text-slate-600 leading-relaxed overflow-y-auto overscroll-contain">
              <p>
                SafarPK is a zero-commission technology directory that facilitates direct connections between customers and independent vehicle owners, licensed drivers, and logistics providers.
              </p>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-950 font-medium">
                SafarPK assumes zero platform liability for advance tokens, vehicle roadworthiness, rental disputes, or accidents. Customers must inspect original registration documents and agree on terms directly with the service partner.
              </div>
              <ul className="list-disc pl-4 space-y-1 text-slate-500">
                <li>Verify original Excise Registration Smart Card before key handover.</li>
                <li>Ensure a physical walk-around check for preexisting dents/scratches.</li>
                <li>Obtain written receipts for cash security deposits.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 12B. MODAL: DIRECT CONTACT REQUIRED DETAILS (VEHICLE)                     */}
      {/* ========================================================================= */}
      {directContactPendingVehicle && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-hidden transition-opacity cursor-pointer"
          onClick={() => setDirectContactPendingVehicle(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 my-auto cursor-default animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-sm text-slate-900">Direct Contact Verification</h3>
              </div>
              <button
                type="button"
                onClick={() => setDirectContactPendingVehicle(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>{directContactPendingVehicle.lister?.businessName || 'The vehicle provider'}</strong> requires your contact information before connecting. Fill once to save your profile permanently.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-700 block mb-1">Your Full Name *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Your Full Name"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-700 block mb-1">Phone / WhatsApp Number *</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="e.g. +1 555 123 4567"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-700 block mb-1">
                  {selectedCountry.idDocumentName} (Optional)
                </label>
                <input
                  type="text"
                  value={customerCnic}
                  onChange={(e) => setCustomerCnic(e.target.value)}
                  placeholder={selectedCountry.idPlaceholder}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white font-mono"
                />
              </div>
            </div>

            <button
              type="button"
              disabled={!customerName.trim() || !customerPhone.trim()}
              onClick={() => {
                handleSaveCustomerProfile(customerName, customerPhone, customerCnic, customerLicense);
                const v = directContactPendingVehicle;
                setDirectContactPendingVehicle(null);
                handleWhatsAppLead(v);
              }}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Save & Connect Directly via WhatsApp</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 12C. MODAL: DIRECT CONTACT REQUIRED DETAILS (DRIVER)                      */}
      {/* ========================================================================= */}
      {directContactPendingDriver && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-hidden transition-opacity cursor-pointer"
          onClick={() => setDirectContactPendingDriver(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 my-auto cursor-default animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-sm text-slate-900">Chauffeur Contact Verification</h3>
              </div>
              <button
                type="button"
                onClick={() => setDirectContactPendingDriver(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>{directContactPendingDriver.name}</strong> requires verified client details before booking.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-700 block mb-1">Your Full Name *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Your Full Name"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-700 block mb-1">Phone / WhatsApp Number *</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="e.g. +1 555 123 4567"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white font-mono font-bold"
                  required
                />
              </div>
            </div>

            <button
              type="button"
              disabled={!customerName.trim() || !customerPhone.trim()}
              onClick={() => {
                handleSaveCustomerProfile(customerName, customerPhone, customerCnic, customerLicense);
                const d = directContactPendingDriver;
                setDirectContactPendingDriver(null);
                const phone = d.phone || '+923001234567';
                window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${d.name}, I am ${customerName} (${customerPhone}). Inquiring to hire you via Safar.`)}`, '_blank');
              }}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Save & Connect with Chauffeur</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 13. MOBILE BOTTOM NAVIGATION DOCK (APPLE & ANDROID NATIVE EXPERIENCE)     */}
      {/* ========================================================================= */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 px-3 py-1.5 flex items-center justify-around shadow-2xl pb-safe">
        <button
          type="button"
          onClick={() => {
            setSelectedService('CAR_RENTAL');
            setSelectedCategory('ALL');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition cursor-pointer ${
            selectedService === 'CAR_RENTAL' ? 'text-emerald-700 font-extrabold' : 'text-slate-400 font-medium'
          }`}
        >
          <Car className="w-5 h-5" />
          <span className="text-[10px]">Vehicles</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedService('HIRE_DRIVER');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition cursor-pointer ${
            selectedService === 'HIRE_DRIVER' ? 'text-emerald-700 font-extrabold' : 'text-slate-400 font-medium'
          }`}
        >
          <UserCheck className="w-5 h-5" />
          <span className="text-[10px]">Drivers</span>
        </button>

        {/* Center Elevated Action: List Your Service */}
        <button
          type="button"
          onClick={() => setShowOnboardingModal(true)}
          className="flex flex-col items-center gap-0.5 -mt-4 cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/40 active:scale-95 transition border-2 border-white">
            <PlusCircle className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-black text-slate-800">List Ad</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedService('PICK_AND_DROP');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition cursor-pointer ${
            selectedService === 'PICK_AND_DROP' ? 'text-emerald-700 font-extrabold' : 'text-slate-400 font-medium'
          }`}
        >
          <Bus className="w-5 h-5" />
          <span className="text-[10px]">Shuttles</span>
        </button>

        <button
          type="button"
          onClick={() => setShowAuthModal(true)}
          className="flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl text-slate-400 hover:text-slate-900 transition font-medium cursor-pointer"
        >
          <User className="w-5 h-5" />
          <span className="text-[10px]">Account</span>
        </button>
      </nav>

      {/* Progressive Web App (PWA) Install Prompt & Mobile App Shell */}
      <MobilePWAExperience
        onOpenAuthModal={() => setShowAuthModal(true)}
        countryName={selectedCountry?.name}
        countryFlag={selectedCountry?.flag}
      />
    </div>
  );
}

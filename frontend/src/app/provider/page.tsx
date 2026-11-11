'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Bus,
  Truck,
  Users,
  Navigation,
  Calendar,
  Clock,
  ShieldCheck,
  CreditCard,
  Building2,
  DollarSign,
  PlusCircle,
  MessageCircle,
  FileText,
  MapPin,
  ArrowRight,
  CheckCircle2,
  Trash2,
  Calculator,
  Layers,
  Settings,
  HelpCircle,
  Edit3,
  X,
} from 'lucide-react';
import { API_BASE, formatPKR, maskPhone } from '@/lib/api';
import { SubscriptionPricingSection } from '@/components/SubscriptionPricingSection';

export default function ServiceProviderDashboardPage() {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'pricing' | 'team' | 'fleet' | 'routes' | 'quotes' | 'subscription'
  >('overview');

  // Provider Mode: Distinguish Pick & Drop Shuttles vs Commercial Cargo/Shifting
  const [providerMode, setProviderMode] = useState<'ALL' | 'PICK_AND_DROP' | 'COMMERCIAL_CARGO'>('ALL');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const mode = params.get('mode');
      if (mode === 'pick_and_drop') {
        setProviderMode('PICK_AND_DROP');
        setActiveTab('routes');
      } else if (mode === 'commercial_cargo') {
        setProviderMode('COMMERCIAL_CARGO');
        setActiveTab('pricing');
      }
      const tab = params.get('tab');
      if (tab && ['overview', 'pricing', 'team', 'fleet', 'routes', 'quotes', 'subscription'].includes(tab)) {
        setActiveTab(tab as any);
      }
    }
  }, []);

  // Commercial Provider Business State
  const [companyName, setCompanyName] = useState('Pak Movers & Al-Makkah Logistics');
  const [managerName, setManagerName] = useState('Haji Abdul Rasheed');
  const [contactPhone, setContactPhone] = useState('+92 321 4409124');
  const [cityBase, setCityBase] = useState('Lahore');
  const [availableCoverageCities, setAvailableCoverageCities] = useState<string[]>([
    'Lahore',
    'Islamabad',
    'Rawalpindi',
    'Karachi',
    'Faisalabad',
    'Multan',
    'Peshawar',
    'Gujranwala',
  ]);
  const [serviceCoverageCities, setServiceCoverageCities] = useState<string[]>([
    'Lahore',
    'Islamabad',
    'Rawalpindi',
    'Karachi',
    'Faisalabad',
  ]);
  const [customCityInput, setCustomCityInput] = useState('');
  const [showCustomCityInput, setShowCustomCityInput] = useState(false);

  const handleAddCustomCity = () => {
    const trimmed = customCityInput.trim();
    if (!trimmed) return;
    const formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    if (!availableCoverageCities.includes(formatted)) {
      setAvailableCoverageCities([...availableCoverageCities, formatted]);
    }
    if (!serviceCoverageCities.includes(formatted)) {
      setServiceCoverageCities([...serviceCoverageCities, formatted]);
    }
    setCustomCityInput('');
    setShowCustomCityInput(false);
  };

  // Pricing Model State (Base Fare, Per KM, Per Mazdoor/Labor, Capacity)
  const [rates, setRates] = useState({
    // Base Fares by Truck Capacity (includes first 5 km)
    baseFareRavi: 2000, // Suzuki Ravi 0.8 Ton
    baseFareShehzore: 3500, // Hyundai Shehzore 2.5 Ton
    baseFareMazda: 6500, // Mazda Titan 5.0 Ton
    baseFareContainer: 12000, // 20ft Cargo Container 10 Ton

    // Per Kilometer Rates
    ratePerKmLocal: 120, // Intra-city
    ratePerKmIntercity: 180, // Inter-city (e.g. M-2 Motorway)

    // Labor / Mazdoor Rates
    ratePerMazdoor: 1500, // Per helper for loading & unloading
    floorSurchargePerFloor: 500, // Per floor if no elevator

    // Free distance included in base fare
    includedBaseKm: 5,
  });
  const [ratesSavedNotice, setRatesSavedNotice] = useState<string | null>(null);

  // Interactive Live Shifting Quote Calculator State
  const [calcVehicle, setCalcVehicle] = useState<'RAVI' | 'SHEHZORE' | 'MAZDA' | 'CONTAINER'>('SHEHZORE');
  const [calcDistanceKm, setCalcDistanceKm] = useState<number>(25);
  const [calcMazdoorCount, setCalcMazdoorCount] = useState<number>(3);
  const [calcFloorCount, setCalcFloorCount] = useState<number>(2);
  const [calcIsIntercity, setCalcIsIntercity] = useState<boolean>(false);

  // Compute Live Quote
  const computeQuote = () => {
    let base = rates.baseFareShehzore;
    if (calcVehicle === 'RAVI') base = rates.baseFareRavi;
    if (calcVehicle === 'MAZDA') base = rates.baseFareMazda;
    if (calcVehicle === 'CONTAINER') base = rates.baseFareContainer;

    const extraKm = Math.max(calcDistanceKm - rates.includedBaseKm, 0);
    const kmRate = calcIsIntercity ? rates.ratePerKmIntercity : rates.ratePerKmLocal;
    const kmCost = extraKm * kmRate;
    const mazdoorCost = calcMazdoorCount * rates.ratePerMazdoor;
    const floorCost = calcFloorCount * rates.floorSurchargePerFloor;
    const total = base + kmCost + mazdoorCost + floorCost;

    return { base, extraKm, kmRate, kmCost, mazdoorCost, floorCost, total };
  };
  const liveCalc = computeQuote();

  // Company Driver Team
  const [driverTeam, setDriverTeam] = useState<any[]>([
    {
      id: 'drv-team-1',
      name: 'Tariq Mahmood',
      phone: '+92 301 9821045',
      cnic: '35201-4412098-5',
      licenseCategory: 'PSV / HTV',
      assignedTruck: 'Toyota HiAce Grand Cabin (LEA-24-9988)',
      status: 'ON_DUTY',
    },
    {
      id: 'drv-team-2',
      name: 'Aslam Khan',
      phone: '+92 302 8819204',
      cnic: '35202-9981240-1',
      licenseCategory: 'HTV Heavy Transport',
      assignedTruck: 'Hyundai Shehzore D-100 (LHR-SH-202)',
      status: 'AVAILABLE',
    },
    {
      id: 'drv-team-3',
      name: 'Muhammad Imran',
      phone: '+92 312 4491029',
      cnic: '35201-7712049-3',
      licenseCategory: 'LTV / HTV',
      assignedTruck: 'Suzuki Ravi Cargo (LHR-RV-99)',
      status: 'AVAILABLE',
    },
    {
      id: 'drv-team-4',
      name: 'Nadeem Akhtar',
      phone: '+92 333 5510291',
      cnic: '35202-1102948-7',
      licenseCategory: 'PSV Coaster Special',
      assignedTruck: 'Toyota Coaster Executive (ISB-CS-202)',
      status: 'ON_ROUTE',
    },
  ]);

  // New Driver Form State
  const [showAddDriverModal, setShowAddDriverModal] = useState(false);
  const [newDriverName, setNewDriverName] = useState('');
  const [newDriverPhone, setNewDriverPhone] = useState('');
  const [newDriverCnic, setNewDriverCnic] = useState('');
  const [newDriverLicense, setNewDriverLicense] = useState<'LTV' | 'HTV' | 'PSV'>('HTV');
  const [newDriverAssignTruck, setNewDriverAssignTruck] = useState('Hyundai Shehzore D-100 (LHR-SH-202)');

  // Commercial Fleet Roster
  const [commercialFleet, setCommercialFleet] = useState<any[]>([
    {
      id: 'cf-1',
      model: 'Hyundai Shehzore D-100 Shifting Truck',
      type: 'CARGO_MOVING',
      reg: 'LHR-SH-202',
      capacityTons: 2.5,
      capacityCubicFt: '350 cu. ft',
      driverName: 'Aslam Khan',
      baseCity: 'Lahore',
      status: 'READY_FOR_DISPATCH',
    },
    {
      id: 'cf-2',
      model: 'Suzuki Ravi Pickup 800cc',
      type: 'CARGO_MOVING',
      reg: 'LHR-RV-99',
      capacityTons: 0.8,
      capacityCubicFt: '120 cu. ft',
      driverName: 'Muhammad Imran',
      baseCity: 'Lahore',
      status: 'READY_FOR_DISPATCH',
    },
    {
      id: 'cf-3',
      model: 'Mazda Titan 14-ft Cargo Truck',
      type: 'CARGO_MOVING',
      reg: 'LEA-MZD-410',
      capacityTons: 5.0,
      capacityCubicFt: '750 cu. ft',
      driverName: 'Unassigned',
      baseCity: 'Lahore',
      status: 'IN_DEPOT',
    },
    {
      id: 'cf-4',
      model: 'Toyota HiAce Grand Cabin (14 Seats)',
      type: 'PASSENGER_SHUTTLE',
      reg: 'LEA-24-9988',
      capacityTons: null,
      capacityCubicFt: '14 Passengers',
      driverName: 'Tariq Mahmood',
      baseCity: 'Lahore',
      status: 'ON_DAILY_ROUTE',
    },
  ]);

  // Commuter Routes State
  const [routes, setRoutes] = useState<any[]>([
    {
      id: 'rt-1',
      title: 'Johar Town ➔ Gulberg Main Blvd / Mall Road',
      type: 'PICK_AND_DROP',
      city: 'Lahore',
      vehicle: 'Toyota HiAce Grand Cabin (LEA-24-9988)',
      assignedDriver: 'Tariq Mahmood',
      driverPhone: '+92 301 9821045',
      timings: '07:20 AM – 05:30 PM',
      capacity: 14,
      filledSeats: 11,
      availableSeats: 3,
      monthlySeatRate: 8500,
      dailySeatRate: 450,
      category: 'Office Staff & Corporate',
      acStatus: 'Chilled Dual AC',
      stops: [
        { stop: 'Johar Town G-1 Market', time: '07:20 AM' },
        { stop: 'Shaukat Khanum Chowk', time: '07:35 AM' },
        { stop: 'Campus Bridge / Canal Rd', time: '07:50 AM' },
        { stop: 'Muslim Town Morr', time: '08:05 AM' },
        { stop: 'Gulberg Main Blvd (Siddiq Trade)', time: '08:20 AM' },
        { stop: 'Mall Road / Charing Cross', time: '08:35 AM' },
      ],
      status: 'ACTIVE',
    },
    {
      id: 'rt-2',
      title: 'Rawalpindi Saddar ➔ Islamabad Blue Area / F-8',
      type: 'PICK_AND_DROP',
      city: 'Islamabad',
      vehicle: 'Toyota HiAce Grand Cabin (LEA-24-9988)',
      assignedDriver: 'Nadeem Akhtar',
      driverPhone: '+92 333 5510291',
      timings: '07:15 AM – 05:00 PM',
      capacity: 14,
      filledSeats: 10,
      availableSeats: 4,
      monthlySeatRate: 9500,
      dailySeatRate: 500,
      category: 'Office Staff & Executives',
      acStatus: 'Chilled Dual AC',
      stops: [
        { stop: 'Saddar Metro Station', time: '07:15 AM' },
        { stop: 'Chandni Chowk Murree Rd', time: '07:30 AM' },
        { stop: 'Faizabad Interchange', time: '07:45 AM' },
        { stop: 'Zero Point Islamabad', time: '08:00 AM' },
        { stop: 'Blue Area (Stock Exchange)', time: '08:15 AM' },
        { stop: 'F-8 Markaz Courts', time: '08:30 AM' },
      ],
      status: 'ACTIVE',
    },
    {
      id: 'rt-3',
      title: 'Bahria Town Phase 1-8 ➔ NUST / FAST / H-12',
      type: 'PICK_AND_DROP',
      city: 'Islamabad',
      vehicle: 'Toyota Coaster Executive (ISB-CS-202)',
      assignedDriver: 'Sheraz Ali',
      driverPhone: '+92 321 8812049',
      timings: '07:00 AM – 04:30 PM',
      capacity: 22,
      filledSeats: 16,
      availableSeats: 6,
      monthlySeatRate: 11000,
      dailySeatRate: 600,
      category: 'University & College Students',
      acStatus: 'Chilled Dual AC',
      stops: [
        { stop: 'Bahria Town Phase 4 Civic Center', time: '07:00 AM' },
        { stop: 'Soan Bridge / GT Road', time: '07:20 AM' },
        { stop: 'Rawat / T-Chowk', time: '07:35 AM' },
        { stop: 'Kachehri Chowk Rawalpindi', time: '07:55 AM' },
        { stop: 'FAST University Campus', time: '08:20 AM' },
        { stop: 'NUST Gate 2 H-12', time: '08:35 AM' },
      ],
      status: 'ACTIVE',
    },
  ]);

  // Live Seat Occupancy Stepper
  const handleAdjustSeats = (routeId: string, delta: number) => {
    setRoutes(
      routes.map((r) => {
        if (r.id === routeId) {
          const newAvail = Math.max(0, Math.min(r.capacity, r.availableSeats + delta));
          const newFilled = r.capacity - newAvail;
          return {
            ...r,
            availableSeats: newAvail,
            filledSeats: newFilled,
            status: newAvail === 0 ? 'FULL' : 'ACTIVE',
          };
        }
        return r;
      })
    );
  };

  // Add Route Modal State
  const [showAddRouteModal, setShowAddRouteModal] = useState(false);
  const [newRouteTitle, setNewRouteTitle] = useState('');
  const [newRouteCity, setNewRouteCity] = useState('Islamabad');
  const [newRouteCategory, setNewRouteCategory] = useState('Office Staff & Corporate');
  const [newRouteVehicle, setNewRouteVehicle] = useState('Toyota HiAce Grand Cabin (LEA-24-9988)');
  const [newRouteDriver, setNewRouteDriver] = useState('Nadeem Akhtar');
  const [newRouteCapacity, setNewRouteCapacity] = useState(14);
  const [newRouteAvailableSeats, setNewRouteAvailableSeats] = useState(4);
  const [newRouteMonthlyRate, setNewRouteMonthlyRate] = useState(9500);
  const [newRouteDailyRate, setNewRouteDailyRate] = useState(500);
  const [newRouteMorningTime, setNewRouteMorningTime] = useState('07:30 AM');
  const [newRouteEveningTime, setNewRouteEveningTime] = useState('05:30 PM');
  const [newRouteStopsText, setNewRouteStopsText] = useState('Saddar (07:15) ➔ Faizabad (07:45) ➔ Blue Area (08:15)');

  const handleAddRouteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRouteTitle) return;

    const parsedStops = newRouteStopsText
      .split(/➔|->|,/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s, idx) => ({
        stop: s.replace(/\(.*?\)/g, '').trim(),
        time: s.match(/\((.*?)\)/)?.[1] || `${7 + Math.floor(idx / 2)}:${(idx % 2) * 30 || '00'} AM`,
      }));

    const newRt = {
      id: `rt-${Date.now()}`,
      title: newRouteTitle,
      type: 'PICK_AND_DROP',
      city: newRouteCity,
      vehicle: newRouteVehicle,
      assignedDriver: newRouteDriver,
      driverPhone: contactPhone,
      timings: `${newRouteMorningTime} – ${newRouteEveningTime}`,
      capacity: Number(newRouteCapacity) || 14,
      filledSeats: (Number(newRouteCapacity) || 14) - (Number(newRouteAvailableSeats) || 4),
      availableSeats: Number(newRouteAvailableSeats) || 4,
      monthlySeatRate: Number(newRouteMonthlyRate) || 9500,
      dailySeatRate: Number(newRouteDailyRate) || 500,
      category: newRouteCategory,
      acStatus: 'Chilled Dual AC',
      stops:
        parsedStops.length > 0
          ? parsedStops
          : [
              { stop: `${newRouteCity} Origin Point`, time: newRouteMorningTime },
              { stop: 'Faizabad / Midway', time: '08:00 AM' },
              { stop: 'Commercial Hub / Office Stop', time: '08:30 AM' },
            ],
      status: 'ACTIVE',
    };

    setRoutes([newRt, ...routes]);
    setShowAddRouteModal(false);
    setNewRouteTitle('');
  };

  // EDIT ROUTE STATE & HANDLERS (FULL CRUD)
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [editingRoute, setEditingRoute] = useState<any | null>(null);
  const [editRouteStops, setEditRouteStops] = useState<{ stop: string; time: string }[]>([]);
  const [newStopInput, setNewStopInput] = useState('');
  const [newStopTimeInput, setNewStopTimeInput] = useState('08:00 AM');

  // EDIT TRUCK STATE & HANDLERS (FULL CRUD)
  const [editingTruck, setEditingTruck] = useState<any | null>(null);

  const handleOpenEditRoute = (route: any) => {
    setEditingRoute({ ...route });
    setEditRouteStops(route.stops ? route.stops.map((s: any) => ({ ...s })) : []);
  };

  const handleSaveRouteEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoute) return;
    setRoutes(
      routes.map((r) =>
        r.id === editingRoute.id ? { ...editingRoute, stops: editRouteStops } : r
      )
    );
    setEditingRoute(null);
    setSaveNotice('✅ Route details, stops & scheduled timings updated live!');
    setTimeout(() => setSaveNotice(null), 3500);
  };

  const handleAddStopToEdit = () => {
    if (!newStopInput.trim()) return;
    setEditRouteStops([...editRouteStops, { stop: newStopInput.trim(), time: newStopTimeInput }]);
    setNewStopInput('');
  };

  const handleRemoveStopFromEdit = (index: number) => {
    setEditRouteStops(editRouteStops.filter((_, idx) => idx !== index));
  };

  const handleOpenEditTruck = (truck: any) => {
    setEditingTruck({ ...truck });
  };

  const handleSaveTruckEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTruck) return;
    setCommercialFleet(
      commercialFleet.map((t: any) => (t.id === editingTruck.id ? { ...editingTruck } : t))
    );
    setEditingTruck(null);
    setSaveNotice('✅ Vehicle capacity, registration & driver allotment updated live!');
    setTimeout(() => setSaveNotice(null), 3500);
  };

  // Customer Shifting Quotations Queue
  const [quoteRequests, setQuoteRequests] = useState<any[]>([
    {
      id: 'q-101',
      customerName: 'Dr. Usman Farooq',
      customerPhone: '+92 333 4910291',
      shiftingType: '3 BHK Full House Shifting',
      fromAddress: 'House 42, Sector G-11/2, Islamabad',
      toAddress: 'Apartment 402, Bahria Town Phase 7, Rawalpindi',
      distanceKm: 28,
      truckRequired: 'Hyundai Shehzore (2.5 Ton)',
      helpersNeeded: 3,
      floorCount: 2,
      date: '2026-11-16',
      quotedAmount: 11400,
      assignedDriver: 'Aslam Khan',
      status: 'CONFIRMED',
    },
    {
      id: 'q-102',
      customerName: 'Saima Waqas',
      customerPhone: '+92 300 8192041',
      shiftingType: 'Office Furniture & Electronics Relocation',
      fromAddress: 'Gulberg III, Main Boulevard, Lahore',
      toAddress: 'DHA Phase 6, Raya Fairways, Lahore',
      distanceKm: 18,
      truckRequired: 'Mazda Titan (5.0 Ton)',
      helpersNeeded: 4,
      floorCount: 1,
      date: '2026-11-18',
      quotedAmount: 14500,
      assignedDriver: 'Muhammad Imran',
      status: 'PENDING_APPROVAL',
    },
  ]);

  // Allot Driver to Vehicle Handler
  const handleAllotDriverToVehicle = (vehicleId: string, driverName: string) => {
    const targetVeh = commercialFleet.find((v) => v.id === vehicleId);
    setCommercialFleet(
      commercialFleet.map((v) => (v.id === vehicleId ? { ...v, driverName } : v))
    );
    if (targetVeh && driverName !== 'Unassigned') {
      setDriverTeam(
        driverTeam.map((d) =>
          d.name === driverName ? { ...d, assignedTruck: `${targetVeh.model} (${targetVeh.reg})` } : d
        )
      );
    }
  };

  // Add Driver to Team Handler
  const handleAddDriverSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDriverName || !newDriverPhone) return;

    const newDrv = {
      id: `drv-team-${Date.now()}`,
      name: newDriverName,
      phone: newDriverPhone,
      cnic: newDriverCnic || '35201-XXXXXXX-X',
      licenseCategory: newDriverLicense,
      assignedTruck: newDriverAssignTruck,
      status: 'AVAILABLE',
    };

    setDriverTeam([...driverTeam, newDrv]);

    // Update fleet vehicle driver as well
    setCommercialFleet(
      commercialFleet.map((f) =>
        newDriverAssignTruck.includes(f.reg) || newDriverAssignTruck.includes(f.model)
          ? { ...f, driverName: newDriverName }
          : f
      )
    );

    setShowAddDriverModal(false);
    setNewDriverName('');
    setNewDriverPhone('');
    setNewDriverCnic('');
  };

  // Save Pricing Settings
  const handleSaveRates = (e: React.FormEvent) => {
    e.preventDefault();
    setRatesSavedNotice('✅ Logistics & Shifting Rates saved! Automatic fare calculator is updated.');
    setTimeout(() => setRatesSavedNotice(null), 3500);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center font-black text-lg shadow-sm">
                S
              </div>
              <span className="font-extrabold text-xl text-slate-900 tracking-tight">SafarPK</span>
            </Link>
            <span className="hidden sm:inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-purple-800 border border-purple-200">
              Commercial Logistics & Commuter Transport
            </span>
          </div>

          {/* Quick Category Mode Switcher */}
          <div className="hidden md:flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setProviderMode('PICK_AND_DROP');
                setActiveTab('routes');
              }}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'routes'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Bus className="w-3.5 h-3.5" />
              <span>🚌 Pick & Drop Commuter Routes</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setProviderMode('COMMERCIAL_CARGO');
                setActiveTab('pricing');
              }}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                activeTab !== 'routes'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>📦 Home Shifting & Cargo Movers</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs font-bold px-3 py-1.5 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition"
            >
              ← Public Marketplace
            </Link>
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-purple-700 text-white font-bold text-xs flex items-center justify-center shadow">
                🏢
              </div>
              <div className="hidden md:block text-left text-xs">
                <span className="font-bold text-slate-900 block leading-tight">{companyName}</span>
                <span className="text-[10px] text-purple-700 font-semibold">{cityBase} Fleet Hub</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Nav */}
        <aside className="space-y-1">
          <div className="p-4 bg-white rounded-2xl border border-slate-200 mb-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center text-xl font-bold">
                🏢
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">{companyName}</h3>
                <span className="text-[11px] text-slate-500 block">Manager: {managerName}</span>
                <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 inline-block mt-0.5">
                  Verified Transport Partner
                </span>
              </div>
            </div>
          </div>

          <nav className="bg-white rounded-2xl border border-slate-200 p-2 space-y-1 shadow-xs text-xs font-semibold">
            {[
              { id: 'routes', label: '🚌 Pick & Drop Shuttle Routes', icon: Navigation, badge: routes.length, highlight: 'teal' },
              { id: 'pricing', label: '📦 Shifting Rates & Mazdoor Calc', icon: DollarSign },
              { id: 'overview', label: 'Logistics Overview', icon: Building2 },
              { id: 'team', label: 'Driver Team & Allocations', icon: Users, badge: driverTeam.length },
              { id: 'fleet', label: 'Trucks & Shuttle Fleet', icon: Truck, badge: commercialFleet.length },
              { id: 'quotes', label: 'Shifting Quotes Queue', icon: FileText, badge: quoteRequests.length },
              { id: 'subscription', label: 'Provider Fleet Pass', icon: CreditCard },
            ].map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              const isTeal = item.id === 'routes';
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition cursor-pointer ${
                    active
                      ? isTeal
                        ? 'bg-teal-600 text-white shadow-sm font-bold'
                        : 'bg-purple-600 text-white shadow-sm font-bold'
                      : isTeal
                      ? 'text-teal-900 bg-teal-50/50 hover:bg-teal-100 font-bold'
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
                        active
                          ? 'bg-white/20 text-white'
                          : isTeal
                          ? 'bg-teal-200 text-teal-900'
                          : 'bg-slate-100 text-slate-700'
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

        {/* Canvas */}
        <main className="lg:col-span-3 space-y-6">
          {saveNotice && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 text-xs font-bold flex items-center justify-between shadow-2xs">
              <span>{saveNotice}</span>
              <button onClick={() => setSaveNotice(null)} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">✕</button>
            </div>
          )}
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="p-6 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-3xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs uppercase tracking-wider font-bold text-purple-300">
                    Commercial Dispatch & Cargo Desk
                  </span>
                  <h2 className="text-2xl font-black mt-1">{companyName}</h2>
                  <p className="text-xs text-slate-300 mt-1">
                    Operating home shifting, office relocations, freight cargo, and pick & drop shuttles in {cityBase} and nationwide.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('pricing')}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-md whitespace-nowrap self-start sm:self-auto cursor-pointer flex items-center gap-1.5"
                >
                  <Calculator className="w-4 h-4" />
                  <span>Configure Fare Calculator</span>
                </button>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] text-slate-400 font-semibold block">Total Trucks</span>
                  <span className="text-2xl font-black text-slate-900 mt-1 block">
                    {commercialFleet.length} Vehicles
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold mt-1 block">Ravi, Shehzore, Mazda</span>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] text-slate-400 font-semibold block">Company Drivers</span>
                  <span className="text-2xl font-black text-purple-700 mt-1 block">
                    {driverTeam.length} Drivers
                  </span>
                  <span className="text-[10px] text-slate-500 mt-1 block">100% HTV / PSV Allotted</span>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] text-slate-400 font-semibold block">Base Shehzore Fare</span>
                  <span className="text-2xl font-black text-slate-900 mt-1 block">
                    PKR {formatPKR(rates.baseFareShehzore)}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-1 block">Includes first {rates.includedBaseKm} km</span>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] text-slate-400 font-semibold block">Mazdoor / Labor</span>
                  <span className="text-2xl font-black text-emerald-600 mt-1 block">
                    PKR {formatPKR(rates.ratePerMazdoor)}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-1 block">Per Helper with Packing</span>
                </div>
              </div>

              {/* Live Calculator Preview Card */}
              <div className="bg-purple-50/60 border border-purple-200 rounded-3xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-purple-700" />
                    <h3 className="font-extrabold text-sm text-purple-950">
                      Live Shifting Fare Formula (Active on Public Portal)
                    </h3>
                  </div>
                  <button onClick={() => setActiveTab('pricing')} className="text-xs font-bold text-purple-700 hover:underline">
                    Edit Pricing Rules →
                  </button>
                </div>
                <p className="text-xs text-purple-900">
                  Total Fare = <strong>Base Truck Fare</strong> + (<strong>Distance km</strong> × PKR {rates.ratePerKmLocal}/km) + (<strong>Mazdoor Count</strong> × PKR {rates.ratePerMazdoor}) + Floor Surcharge.
                </p>
                <div className="p-3 bg-white rounded-2xl border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 text-[11px] block">Sample: Shehzore + 25 km + 3 Mazdoors + 2 Floors</span>
                    <strong className="text-slate-900 text-sm">
                      Base {formatPKR(rates.baseFareShehzore)} + KM {formatPKR(liveCalc.kmCost)} + Mazdoor {formatPKR(liveCalc.mazdoorCost)} + Floor {formatPKR(liveCalc.floorCost)}
                    </strong>
                  </div>
                  <span className="text-base font-black text-purple-900 bg-purple-100 px-3 py-1 rounded-xl">
                    Total: PKR {formatPKR(liveCalc.total)}
                  </span>
                </div>
              </div>

              {/* Shifting Quotes Queue Alert */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="font-extrabold text-sm text-slate-900">Recent Shifting Bookings & Assigned Drivers</h3>
                  <button onClick={() => setActiveTab('quotes')} className="text-xs font-bold text-purple-700 hover:underline">
                    Manage All Quotes →
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  {quoteRequests.map((q) => (
                    <div key={q.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-purple-900 bg-white px-2 py-0.5 rounded border border-purple-200">
                            {q.id}
                          </span>
                          <h4 className="font-bold text-xs text-slate-900">{q.shiftingType}</h4>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900">
                            {q.truckRequired}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1">
                          From: {q.fromAddress} ➔ To: {q.toAddress} ({q.distanceKm} km · {q.helpersNeeded} Mazdoors)
                        </p>
                        <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                          Assigned Driver: <strong>{q.assignedDriver}</strong>
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-black text-slate-900 block">PKR {formatPKR(q.quotedAmount)}</span>
                        <a
                          href={`https://wa.me/${q.customerPhone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-bold text-emerald-700 hover:underline inline-flex items-center gap-1 mt-1"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Direct Contact Client</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRICING RULES & KM / MAZDOOR CALCULATOR */}
          {activeTab === 'pricing' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6 text-xs">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  Logistics & Shifting Rate Engine (KM, Mazdoor, Base Fare)
                </h3>
                <p className="text-slate-500">
                  Configure your pricing rules. The portal automatically computes transparent customer moving quotes based on distance, truck capacity, and helpers.
                </p>
              </div>

              {ratesSavedNotice && (
                <div className="p-3 bg-emerald-50 text-emerald-800 font-bold rounded-xl border border-emerald-200">
                  {ratesSavedNotice}
                </div>
              )}

              {/* Interactive Live Fare Simulator */}
              <div className="p-5 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-3xl space-y-4">
                <div className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-purple-700" />
                  <h4 className="font-bold text-sm text-purple-950">Live Fare Simulator (Test Your Calculation)</h4>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Truck Capacity</label>
                    <select
                      value={calcVehicle}
                      onChange={(e: any) => setCalcVehicle(e.target.value)}
                      className="w-full p-2.5 bg-white border border-purple-200 rounded-xl font-medium"
                    >
                      <option value="RAVI">Suzuki Ravi (0.8T)</option>
                      <option value="SHEHZORE">Hyundai Shehzore (2.5T)</option>
                      <option value="MAZDA">Mazda Titan (5.0T)</option>
                      <option value="CONTAINER">20ft Container (10T)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Estimated Distance</label>
                    <div className="flex items-center gap-1 bg-white border border-purple-200 rounded-xl px-2.5 py-1.5">
                      <input
                        type="number"
                        value={calcDistanceKm}
                        onChange={(e) => setCalcDistanceKm(Number(e.target.value))}
                        className="w-full font-bold outline-none"
                      />
                      <span className="text-[10px] text-slate-500">km</span>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Mazdoor / Helpers</label>
                    <select
                      value={calcMazdoorCount}
                      onChange={(e) => setCalcMazdoorCount(Number(e.target.value))}
                      className="w-full p-2.5 bg-white border border-purple-200 rounded-xl font-medium"
                    >
                      <option value={0}>0 Helpers (Truck Only)</option>
                      <option value={1}>1 Mazdoor</option>
                      <option value={2}>2 Mazdoors</option>
                      <option value={3}>3 Mazdoors</option>
                      <option value={4}>4 Mazdoors</option>
                      <option value={6}>6 Mazdoors (Heavy Moving)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Floor / Stairs</label>
                    <select
                      value={calcFloorCount}
                      onChange={(e) => setCalcFloorCount(Number(e.target.value))}
                      className="w-full p-2.5 bg-white border border-purple-200 rounded-xl font-medium"
                    >
                      <option value={0}>Ground Floor / Elevator</option>
                      <option value={1}>1st Floor (Stairs)</option>
                      <option value={2}>2nd Floor (Stairs)</option>
                      <option value={3}>3rd Floor (Stairs)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="intercityCheck"
                    checked={calcIsIntercity}
                    onChange={(e) => setCalcIsIntercity(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                  <label htmlFor="intercityCheck" className="font-bold text-slate-800 cursor-pointer">
                    Inter-City Travel Route (Applies outstation rate: PKR {rates.ratePerKmIntercity}/km)
                  </label>
                </div>

                {/* Calculation Breakdown Result */}
                <div className="p-4 bg-white rounded-2xl border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-400 block font-semibold">Formula Breakdown:</span>
                    <div className="flex flex-wrap gap-2 text-[11px] text-slate-700 font-medium">
                      <span className="bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        Base: PKR {formatPKR(liveCalc.base)}
                      </span>
                      <span>+</span>
                      <span className="bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        Distance ({liveCalc.extraKm} km × {liveCalc.kmRate}): PKR {formatPKR(liveCalc.kmCost)}
                      </span>
                      <span>+</span>
                      <span className="bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        Labor ({calcMazdoorCount} Mazdoors): PKR {formatPKR(liveCalc.mazdoorCost)}
                      </span>
                      {liveCalc.floorCost > 0 && (
                        <>
                          <span>+</span>
                          <span className="bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                            Stairs: PKR {formatPKR(liveCalc.floorCost)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Estimated Total</span>
                    <span className="text-2xl font-black text-purple-950">PKR {formatPKR(liveCalc.total)}</span>
                  </div>
                </div>
              </div>

              {/* Form to Edit Standard Rates */}
              <form onSubmit={handleSaveRates} className="space-y-5">
                {/* 1. Base Fares by Capacity */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="font-bold text-sm text-slate-900">
                    1. Truck Capacity Base Fares (Includes first {rates.includedBaseKm} km)
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Suzuki Ravi (0.8 Ton)</label>
                      <input
                        type="number"
                        value={rates.baseFareRavi}
                        onChange={(e) => setRates({ ...rates, baseFareRavi: Number(e.target.value) })}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Hyundai Shehzore (2.5 Ton)</label>
                      <input
                        type="number"
                        value={rates.baseFareShehzore}
                        onChange={(e) => setRates({ ...rates, baseFareShehzore: Number(e.target.value) })}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono font-bold text-purple-900"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Mazda Titan (5.0 Ton)</label>
                      <input
                        type="number"
                        value={rates.baseFareMazda}
                        onChange={(e) => setRates({ ...rates, baseFareMazda: Number(e.target.value) })}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">20ft Container (10 Ton)</label>
                      <input
                        type="number"
                        value={rates.baseFareContainer}
                        onChange={(e) => setRates({ ...rates, baseFareContainer: Number(e.target.value) })}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Distance & Labor Rates */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="font-bold text-sm text-slate-900">2. Distance & Mazdoor / Labor Charges</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Per KM Local (PKR / km)</label>
                      <input
                        type="number"
                        value={rates.ratePerKmLocal}
                        onChange={(e) => setRates({ ...rates, ratePerKmLocal: Number(e.target.value) })}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Per KM Inter-City (PKR / km)</label>
                      <input
                        type="number"
                        value={rates.ratePerKmIntercity}
                        onChange={(e) => setRates({ ...rates, ratePerKmIntercity: Number(e.target.value) })}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Per Mazdoor Rate (PKR / helper)</label>
                      <input
                        type="number"
                        value={rates.ratePerMazdoor}
                        onChange={(e) => setRates({ ...rates, ratePerMazdoor: Number(e.target.value) })}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono font-bold text-emerald-800"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Floor Stairs Surcharge (PKR)</label>
                      <input
                        type="number"
                        value={rates.floorSurchargePerFloor}
                        onChange={(e) => setRates({ ...rates, floorSurchargePerFloor: Number(e.target.value) })}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Coverage Cities */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <div>
                      <label className="font-bold text-slate-700 block text-xs">Service Area & Operating Cities</label>
                      <span className="text-[10px] text-slate-400">
                        Select cities your cargo moving & logistics team actively covers.
                      </span>
                    </div>
                    <span className="text-[11px] text-purple-700 font-bold bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200 self-start sm:self-auto">
                      ✓ {serviceCoverageCities.length} Cities Active
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 items-center">
                    {availableCoverageCities.map((c) => {
                      const active = serviceCoverageCities.includes(c);
                      const isCustom = !['Lahore', 'Islamabad', 'Rawalpindi', 'Karachi', 'Faisalabad', 'Multan', 'Peshawar', 'Gujranwala'].includes(c);
                      return (
                        <div key={c} className="flex items-center">
                          <button
                            type="button"
                            onClick={() => {
                              if (active) {
                                setServiceCoverageCities(serviceCoverageCities.filter((x) => x !== c));
                              } else {
                                setServiceCoverageCities([...serviceCoverageCities, c]);
                              }
                            }}
                            className={`px-3 py-1.5 rounded-xl border font-bold transition cursor-pointer text-xs ${
                              active
                                ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {active ? '✓ ' : '+ '} {c}
                          </button>
                          {isCustom && (
                            <button
                              type="button"
                              onClick={() => {
                                setAvailableCoverageCities(availableCoverageCities.filter((x) => x !== c));
                                setServiceCoverageCities(serviceCoverageCities.filter((x) => x !== c));
                              }}
                              className="ml-1 text-slate-400 hover:text-rose-600 p-1 text-[11px] transition"
                              title={`Delete custom city ${c}`}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      );
                    })}

                    {/* Inline Custom City Input & Button */}
                    {!showCustomCityInput ? (
                      <button
                        type="button"
                        onClick={() => setShowCustomCityInput(true)}
                        className="px-3 py-1.5 rounded-xl border-2 border-dashed border-purple-300 text-purple-700 hover:border-purple-500 hover:bg-purple-50 font-bold transition flex items-center gap-1.5 cursor-pointer text-xs"
                      >
                        <span>+ Custom City</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border-2 border-purple-500 shadow-sm">
                        <input
                          type="text"
                          autoFocus
                          value={customCityInput}
                          onChange={(e) => setCustomCityInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddCustomCity();
                            } else if (e.key === 'Escape') {
                              setShowCustomCityInput(false);
                            }
                          }}
                          placeholder="Type city name (e.g. Sialkot, Sargodha)"
                          className="px-2.5 py-1 text-xs outline-none w-44 font-medium text-slate-800"
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomCity}
                          className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowCustomCityInput(false);
                            setCustomCityInput('');
                          }}
                          className="px-2 py-1 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-100">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl transition shadow-sm cursor-pointer"
                  >
                    Save Logistics & Moving Rates
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: DRIVER TEAM & ALLOCATIONS */}
          {activeTab === 'team' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Driver Team & Truck Allotments</h3>
                  <p className="text-slate-500">
                    Manage your in-house commercial drivers, assign them to vehicles, and track their daily status.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddDriverModal(true)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ Add Driver</span>
                </button>
              </div>

              <div className="space-y-3">
                {driverTeam.map((drv) => (
                  <div key={drv.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-lg">
                        👨‍✈️
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-900">{drv.name}</h4>
                          <span className="font-mono text-[10px] font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
                            {drv.licenseCategory}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              drv.status === 'ON_DUTY' || drv.status === 'ON_ROUTE'
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-emerald-100 text-emerald-900'
                            }`}
                          >
                            {drv.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Phone: <strong>{drv.phone}</strong> · CNIC: {drv.cnic}
                        </p>
                        <p className="text-[11px] text-purple-900 font-semibold mt-0.5">
                          Assigned Vehicle: {drv.assignedTruck}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={drv.assignedTruck}
                        onChange={(e) => {
                          const updated = driverTeam.map((d) =>
                            d.id === drv.id ? { ...d, assignedTruck: e.target.value } : d
                          );
                          setDriverTeam(updated);
                        }}
                        className="p-2 bg-white border border-slate-200 rounded-xl font-medium text-xs text-slate-700"
                      >
                        {commercialFleet.map((f) => (
                          <option key={f.id} value={`${f.model} (${f.reg})`}>
                            Allot: {f.model} ({f.reg})
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setDriverTeam(driverTeam.filter((d) => d.id !== drv.id))}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition"
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

          {/* TAB 4: COMMERCIAL FLEET & CAPACITY */}
          {activeTab === 'fleet' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Commercial Fleet & Vehicle Capacity</h3>
                  <p className="text-slate-500">
                    Suzuki Ravi, Hyundai Shehzore, Mazda Titan, and Coasters with driver allotments.
                  </p>
                </div>
                <Link
                  href="/lister"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ Register New Truck</span>
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {commercialFleet.map((c) => (
                  <div key={c.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {c.reg}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {c.status}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{c.model}</h4>
                      <p className="text-slate-500 mt-0.5">
                        Capacity: <strong>{c.capacityTons ? `${c.capacityTons} Tons (${c.capacityCubicFt})` : c.capacityCubicFt}</strong>
                      </p>
                    </div>

                    {/* Allot Driver Dropdown */}
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 block">Allotted Driver</label>
                      <select
                        value={c.driverName}
                        onChange={(e) => handleAllotDriverToVehicle(c.id, e.target.value)}
                        className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-xs text-purple-900"
                      >
                        <option value="Unassigned">-- Unassigned Driver --</option>
                        {driverTeam.map((d) => (
                          <option key={d.id} value={d.name}>
                            👨‍✈️ {d.name} ({d.licenseCategory})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Actions: Edit Truck & Delete */}
                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditTruck(c)}
                        className="px-3 py-1.5 rounded-lg border border-purple-600 bg-purple-50 hover:bg-purple-100 text-purple-900 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-purple-700" />
                        <span>Edit Truck</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Remove truck ${c.model} (${c.reg}) from fleet?`)) {
                            setCommercialFleet(commercialFleet.filter((f: any) => f.id !== c.id));
                          }
                        }}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Delete vehicle"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: SHIFTING QUOTES QUEUE */}
          {activeTab === 'quotes' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4 text-xs">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Customer Shifting Quotes & Booking Requests</h3>
                <p className="text-slate-500">
                  Manage incoming customer shifting inquiries, assign trucks and drivers, and send booking confirmations.
                </p>
              </div>

              <div className="space-y-3">
                {quoteRequests.map((q) => (
                  <div key={q.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-purple-900 bg-white px-2 py-0.5 rounded border border-purple-200">
                            {q.id}
                          </span>
                          <h4 className="font-bold text-sm text-slate-900">{q.shiftingType}</h4>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Client: <strong>{q.customerName}</strong> ({q.customerPhone}) · Date: {q.date}
                        </p>
                      </div>
                      <span className="text-base font-black text-purple-900">PKR {formatPKR(q.quotedAmount)}</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                        <span className="text-slate-400 text-[10px] font-semibold block">Pickup</span>
                        <span className="font-bold text-slate-800">{q.fromAddress}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] font-semibold block">Destination</span>
                        <span className="font-bold text-slate-800">{q.toAddress}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] font-semibold block">Truck & Mazdoors</span>
                        <span className="font-bold text-slate-800">
                          {q.truckRequired} · {q.helpersNeeded} Helpers
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] font-semibold block mb-0.5">Allotted Driver</span>
                        <select
                          value={q.assignedDriver}
                          onChange={(e) => {
                            const newDriver = e.target.value;
                            setQuoteRequests(
                              quoteRequests.map((item) => (item.id === q.id ? { ...item, assignedDriver: newDriver } : item))
                            );
                          }}
                          className="p-1 bg-white border border-purple-200 rounded-lg text-xs font-bold text-purple-900 cursor-pointer"
                        >
                          {driverTeam.map((d) => (
                            <option key={d.id} value={d.name}>
                              {d.name} ({d.assignedTruck})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                      <a
                        href={`https://wa.me/${q.customerPhone.replace(/[^0-9]/g, '')}?text=As-salamu%20alaykum%20${encodeURIComponent(q.customerName)}!%20Your%20shifting%20booking%20${q.id}%20with%20${encodeURIComponent(companyName)}%20is%20CONFIRMED.%20Designated%20Driver:%20${encodeURIComponent(q.assignedDriver)}%20will%20arrive%20with%20${encodeURIComponent(q.truckRequired)}%20on%20${encodeURIComponent(q.date)}.%20Total:%20PKR%20${formatPKR(q.quotedAmount)}.`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Confirm Booking ({q.customerPhone})</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: COMMUTER ROUTES (PICK & DROP EXPANDED DASHBOARD) */}
          {activeTab === 'routes' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-lg bg-teal-100 text-teal-800 font-bold text-sm">🚌</span>
                    <h3 className="font-extrabold text-base text-slate-900">
                      School & Office Pick & Drop Commuter Routes
                    </h3>
                  </div>
                  <p className="text-slate-500 mt-1">
                    Demonstrate your ongoing vehicles, scheduled stops, live vacant seats, and monthly fares so commuters can join your route.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddRouteModal(true)}
                  className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer self-start sm:self-auto shrink-0"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ Add New Commuter Route</span>
                </button>
              </div>

              {/* KPI Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-semibold block">Active Routes</span>
                  <span className="text-xl font-black text-slate-900 mt-1 block">{routes.length} Routes</span>
                  <span className="text-[10px] text-teal-700 font-bold mt-0.5 block">Lahore & Islamabad</span>
                </div>
                <div className="p-3.5 bg-teal-50 rounded-2xl border border-teal-200">
                  <span className="text-[10px] text-teal-700 font-semibold block">Available Vacant Seats</span>
                  <span className="text-xl font-black text-teal-900 mt-1 block">
                    {routes.reduce((acc, r) => acc + (r.availableSeats || 0), 0)} Seats
                  </span>
                  <span className="text-[10px] text-teal-700 font-bold mt-0.5 block">Live for Customer Booking</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-semibold block">Occupied / Registered</span>
                  <span className="text-xl font-black text-slate-900 mt-1 block">
                    {routes.reduce((acc, r) => acc + (r.filledSeats || 0), 0)} Passengers
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Monthly Passes Active</span>
                </div>
                <div className="p-3.5 bg-purple-50 rounded-2xl border border-purple-200">
                  <span className="text-[10px] text-purple-700 font-semibold block">Fleet Assigned</span>
                  <span className="text-xl font-black text-purple-900 mt-1 block">
                    {routes.length} Shuttles
                  </span>
                  <span className="text-[10px] text-purple-700 font-bold mt-0.5 block">HiAce & Coasters</span>
                </div>
              </div>

              {/* Commuter Routes Cards */}
              <div className="space-y-4">
                {routes.map((r) => {
                  const occupancyPct = Math.round(((r.capacity - r.availableSeats) / r.capacity) * 100);
                  return (
                    <div
                      key={r.id}
                      className="p-5 bg-slate-50 rounded-3xl border border-slate-200 hover:border-teal-300 transition space-y-3.5 shadow-2xs"
                    >
                      {/* Route Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-teal-900 bg-white px-2 py-0.5 rounded border border-teal-200">
                              {r.city}
                            </span>
                            <h4 className="font-extrabold text-sm text-slate-900">{r.title}</h4>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                r.availableSeats > 0 ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'
                              }`}
                            >
                              {r.availableSeats > 0 ? '🟢 LIVE ON MARKETPLACE' : '🔴 ROUTE FULL'}
                            </span>
                          </div>
                          <span className="text-[11px] text-teal-800 font-semibold mt-1 block">
                            Target Group: <strong>{r.category}</strong> · {r.acStatus}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-base font-black text-slate-900">
                            PKR {formatPKR(r.monthlySeatRate)}
                          </span>
                          <span className="text-[10px] text-slate-500 block">per seat / month (Daily: PKR {r.dailySeatRate || 500})</span>
                        </div>
                      </div>

                      {/* Route Vehicle & Driver Allocation */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-white p-3 rounded-2xl border border-slate-200">
                        <div>
                          <span className="text-[10px] text-slate-400 font-semibold block">Vehicle In Service</span>
                          <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                            <span>🚐</span>
                            <span className="truncate">{r.vehicle}</span>
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-semibold block">Designated Chauffeur</span>
                          <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                            <span>👨‍✈️</span>
                            <span>{r.assignedDriver} ({r.driverPhone})</span>
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-semibold block">Scheduled Timings</span>
                          <span className="font-bold text-teal-800 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3.5 h-3.5 text-teal-600" />
                            <span>{r.timings}</span>
                          </span>
                        </div>
                      </div>

                      {/* Waypoints Strip */}
                      {r.stops && r.stops.length > 0 && (
                        <div className="p-3 bg-teal-50/60 rounded-2xl border border-teal-100 space-y-1.5">
                          <span className="text-[10px] font-bold text-teal-900 block">
                            Intermediate Boarding Stops & Scheduled Timings:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {r.stops.map((s: any, idx: number) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-white rounded-xl text-[10px] font-semibold text-slate-800 border border-teal-200 flex items-center gap-1"
                              >
                                <span className="w-3.5 h-3.5 rounded-full bg-teal-100 text-teal-800 text-[8px] font-bold flex items-center justify-center">
                                  {idx + 1}
                                </span>
                                <span>{s.stop}</span>
                                <span className="font-mono text-teal-700">({s.time})</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* LIVE SEATS OCCUPANCY CONTROLLER */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                        {/* Stepper */}
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] font-bold text-slate-700">Live Vacant Space:</span>
                          <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl p-1 shadow-2xs">
                            <button
                              type="button"
                              onClick={() => handleAdjustSeats(r.id, -1)}
                              disabled={r.availableSeats <= 0}
                              className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-sm flex items-center justify-center disabled:opacity-40 transition cursor-pointer"
                              title="Decrease available seats (passenger boarded)"
                            >
                              -
                            </button>
                            <span className="px-3 font-mono font-black text-xs text-slate-900">
                              {r.availableSeats} of {r.capacity} Available
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAdjustSeats(r.id, 1)}
                              disabled={r.availableSeats >= r.capacity}
                              className="w-7 h-7 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-black text-sm flex items-center justify-center disabled:opacity-40 transition cursor-pointer"
                              title="Increase available seats (seat vacated)"
                            >
                              +
                            </button>
                          </div>
                          <span className="text-[10px] text-slate-400">({occupancyPct}% Full)</span>
                        </div>

                        {/* Actions: Edit, Pause, Delete */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditRoute(r)}
                            className="px-3 py-1.5 rounded-xl border border-teal-600 bg-teal-50 hover:bg-teal-100 font-bold text-teal-800 text-xs transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-teal-700" />
                            <span>Edit Route</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setRoutes(
                                routes.map((item) =>
                                  item.id === r.id ? { ...item, status: item.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' } : item
                                )
                              )
                            }
                            className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 font-bold text-slate-700 text-xs transition cursor-pointer"
                          >
                            {r.status === 'ACTIVE' ? 'Pause Route' : 'Make Active'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Delete commuter route "${r.title}"?`)) {
                                setRoutes(routes.filter((item) => item.id !== r.id));
                              }
                            }}
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                            title="Delete route"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 7: SUBSCRIPTION */}
          {activeTab === 'subscription' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5 text-xs">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Commercial Provider Monthly Pass</h3>
                <p className="text-slate-500">
                  Unlimited commercial cargo listings, commuter shuttles, WAS - NOW pricing, and zero booking fee.
                </p>
              </div>

              <SubscriptionPricingSection
                role="PROVIDER"
                roleTitle="Logistics & Mobility Provider"
                initialPlanName="Enterprise Cargo & Shuttle Pass"
              />
            </div>
          )}
        </main>
      </div>

      {/* MODAL: ADD DRIVER TO COMPANY ROSTER */}
      {showAddDriverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-black text-base text-slate-900">Add Driver to Company Fleet</h3>
              <button
                type="button"
                onClick={() => setShowAddDriverModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddDriverSubmit} className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Driver Full Name *</label>
                <input
                  type="text"
                  value={newDriverName}
                  onChange={(e) => setNewDriverName(e.target.value)}
                  placeholder="e.g. Muhammad Asif"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Direct Contact / Phone *</label>
                <input
                  type="tel"
                  value={newDriverPhone}
                  onChange={(e) => setNewDriverPhone(e.target.value)}
                  placeholder="+92 300 1234567"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">National ID (CNIC / Passport)</label>
                <input
                  type="text"
                  value={newDriverCnic}
                  onChange={(e) => setNewDriverCnic(e.target.value)}
                  placeholder="35201-1234567-1"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">License Category</label>
                  <select
                    value={newDriverLicense}
                    onChange={(e: any) => setNewDriverLicense(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="HTV">HTV (Heavy Transport)</option>
                    <option value="PSV">PSV (Passenger Public)</option>
                    <option value="LTV">LTV (Light Transport)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assign Truck</label>
                  <select
                    value={newDriverAssignTruck}
                    onChange={(e) => setNewDriverAssignTruck(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    {commercialFleet.map((f) => (
                      <option key={f.id} value={`${f.model} (${f.reg})`}>
                        {f.model} ({f.reg})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddDriverModal(false)}
                  className="px-4 py-2 border border-slate-200 bg-white rounded-xl font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl"
                >
                  Add & Allot Driver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD COMMUTER PICK & DROP ROUTE */}
      {showAddRouteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowAddRouteModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-xs max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-base text-slate-900">+ Add Pick & Drop Commuter Route</h3>
                <p className="text-[11px] text-slate-500">
                  Publish a new school, college, or corporate route with stops & live seats.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddRouteModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddRouteSubmit} className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Route Title / Main Path *</label>
                <input
                  type="text"
                  required
                  value={newRouteTitle}
                  onChange={(e) => setNewRouteTitle(e.target.value)}
                  placeholder="e.g. Rawalpindi Saddar to Islamabad Blue Area / F-8"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Operating City</label>
                  <select
                    value={newRouteCity}
                    onChange={(e) => setNewRouteCity(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    {availableCoverageCities.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target Commute Audience</label>
                  <select
                    value={newRouteCategory}
                    onChange={(e) => setNewRouteCategory(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="Office Staff & Corporate">🏢 Office Staff & Corporate</option>
                    <option value="School / College Students">🎒 School & College Students</option>
                    <option value="University Campus Commute">🎓 University Students (NUST/FAST/LUMS)</option>
                    <option value="Women Only & Families">👩‍💼 Women Only & Working Women</option>
                  </select>
                </div>
              </div>

              {/* Stops & Timings */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Scheduled Waypoints / Stops with Timings
                </label>
                <textarea
                  rows={2}
                  value={newRouteStopsText}
                  onChange={(e) => setNewRouteStopsText(e.target.value)}
                  placeholder="e.g. Saddar (07:15) ➔ Chandni Chowk (07:30) ➔ Faizabad (07:45) ➔ Blue Area (08:15)"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Separate stops with &quot;➔&quot; or commas. Customers can click these stops to book in-between locations.
                </span>
              </div>

              {/* Timings */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Morning Pickup Time</label>
                  <input
                    type="text"
                    value={newRouteMorningTime}
                    onChange={(e) => setNewRouteMorningTime(e.target.value)}
                    placeholder="07:15 AM"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Evening Return Time</label>
                  <input
                    type="text"
                    value={newRouteEveningTime}
                    onChange={(e) => setNewRouteEveningTime(e.target.value)}
                    placeholder="05:30 PM"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono"
                  />
                </div>
              </div>

              {/* Vehicle & Driver */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assign Shuttle Vehicle</label>
                  <select
                    value={newRouteVehicle}
                    onChange={(e) => setNewRouteVehicle(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="Toyota HiAce Grand Cabin (LEA-24-9988)">Toyota HiAce Grand Cabin (14 Seats)</option>
                    <option value="Toyota Coaster Executive (ISB-CS-202)">Toyota Coaster Executive (22 Seats)</option>
                    <option value="Suzuki APV GLX (KHI-AP-881)">Suzuki APV GLX (7 Seats)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assign Chauffeur</label>
                  <select
                    value={newRouteDriver}
                    onChange={(e) => setNewRouteDriver(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    {driverTeam.map((d) => (
                      <option key={d.id} value={d.name}>
                        👨‍✈️ {d.name} ({d.licenseCategory})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Capacity & Live Available Seats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Total Capacity</label>
                  <input
                    type="number"
                    value={newRouteCapacity}
                    onChange={(e) => setNewRouteCapacity(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Available Seats</label>
                  <input
                    type="number"
                    value={newRouteAvailableSeats}
                    onChange={(e) => setNewRouteAvailableSeats(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-teal-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Monthly Fare (PKR)</label>
                  <input
                    type="number"
                    value={newRouteMonthlyRate}
                    onChange={(e) => setNewRouteMonthlyRate(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Daily Rate (PKR)</label>
                  <input
                    type="number"
                    value={newRouteDailyRate}
                    onChange={(e) => setNewRouteDailyRate(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddRouteModal(false)}
                  className="px-4 py-2 border border-slate-200 bg-white rounded-xl font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold rounded-xl shadow-sm transition cursor-pointer"
                >
                  Publish & List Commuter Route
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT PICK & DROP COMMUTER ROUTE (FULL CRUD)                         */}
      {/* ========================================================================= */}
      {editingRoute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 text-xs my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-teal-600" />
                <h3 className="font-black text-base text-slate-900">Edit Commuter Route</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingRoute(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRouteEdit} className="space-y-3.5">
              {/* Route Title */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Route Title / Path *</label>
                <input
                  type="text"
                  required
                  value={editingRoute.title}
                  onChange={(e) => setEditingRoute({ ...editingRoute, title: e.target.value })}
                  placeholder="e.g. Johar Town ➔ Gulberg Main Blvd / Mall Road"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>

              {/* City & Target Group */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Base Operating City</label>
                  <select
                    value={editingRoute.city}
                    onChange={(e) => setEditingRoute({ ...editingRoute, city: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    {availableCoverageCities.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target Commuter Group</label>
                  <select
                    value={editingRoute.category}
                    onChange={(e) => setEditingRoute({ ...editingRoute, category: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="Office Staff & Corporate">🏢 Office Staff & Corporate</option>
                    <option value="School / College Students">🎒 School & College Students</option>
                    <option value="University Campus Commute">🎓 University Students (NUST/FAST/LUMS)</option>
                    <option value="Women Only & Families">👩‍💼 Women Only & Working Women</option>
                  </select>
                </div>
              </div>

              {/* Vehicle & Chauffeur */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Designated Shuttle Vehicle</label>
                  <input
                    type="text"
                    value={editingRoute.vehicle}
                    onChange={(e) => setEditingRoute({ ...editingRoute, vehicle: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Designated Chauffeur & Phone</label>
                  <div className="grid grid-cols-2 gap-1">
                    <input
                      type="text"
                      value={editingRoute.assignedDriver}
                      onChange={(e) => setEditingRoute({ ...editingRoute, assignedDriver: e.target.value })}
                      placeholder="Driver Name"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    />
                    <input
                      type="text"
                      value={editingRoute.driverPhone}
                      onChange={(e) => setEditingRoute({ ...editingRoute, driverPhone: e.target.value })}
                      placeholder="+92 301 0000000"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>

              {/* Timings */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Scheduled Duty Timings</label>
                <input
                  type="text"
                  value={editingRoute.timings}
                  onChange={(e) => setEditingRoute({ ...editingRoute, timings: e.target.value })}
                  placeholder="e.g. 07:20 AM – 05:30 PM"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                />
              </div>

              {/* Fares & Seats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Total Capacity</label>
                  <input
                    type="number"
                    value={editingRoute.capacity}
                    onChange={(e) => setEditingRoute({ ...editingRoute, capacity: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Available Seats</label>
                  <input
                    type="number"
                    value={editingRoute.availableSeats}
                    onChange={(e) => setEditingRoute({ ...editingRoute, availableSeats: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-teal-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Monthly Fare (PKR)</label>
                  <input
                    type="number"
                    value={editingRoute.monthlySeatRate}
                    onChange={(e) => setEditingRoute({ ...editingRoute, monthlySeatRate: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Daily Pass (PKR)</label>
                  <input
                    type="number"
                    value={editingRoute.dailySeatRate}
                    onChange={(e) => setEditingRoute({ ...editingRoute, dailySeatRate: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              {/* Intermediate Boarding Stops Manager */}
              <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs text-teal-950 flex items-center gap-1.5">
                    <span>🚏</span>
                    <span>Intermediate Boarding Stops & Timings</span>
                  </span>
                  <span className="text-[10px] text-teal-800 font-bold">{editRouteStops.length} Stops Configured</span>
                </div>

                {/* Existing Stops Editor */}
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {editRouteStops.map((st, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-teal-100">
                      <span className="w-5 h-5 rounded-full bg-teal-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={st.stop}
                        onChange={(e) => {
                          const updated = [...editRouteStops];
                          updated[idx].stop = e.target.value;
                          setEditRouteStops(updated);
                        }}
                        className="flex-1 p-1 text-xs font-bold text-slate-900 border-b border-slate-200 outline-none"
                      />
                      <input
                        type="text"
                        value={st.time}
                        onChange={(e) => {
                          const updated = [...editRouteStops];
                          updated[idx].time = e.target.value;
                          setEditRouteStops(updated);
                        }}
                        className="w-20 p-1 font-mono text-[11px] font-bold text-teal-800 border-b border-slate-200 outline-none text-center"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveStopFromEdit(idx)}
                        className="w-6 h-6 rounded-lg text-rose-500 hover:bg-rose-50 flex items-center justify-center cursor-pointer"
                        title="Remove stop"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add New Stop Inline Input */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newStopInput}
                    onChange={(e) => setNewStopInput(e.target.value)}
                    placeholder="New stop name (e.g. Canal View, F-8 Markaz...)"
                    className="flex-1 p-2 bg-white border border-teal-200 rounded-xl text-xs font-bold text-slate-900 outline-none"
                  />
                  <input
                    type="text"
                    value={newStopTimeInput}
                    onChange={(e) => setNewStopTimeInput(e.target.value)}
                    placeholder="08:00 AM"
                    className="w-24 p-2 bg-white border border-teal-200 rounded-xl text-xs font-mono font-bold text-center"
                  />
                  <button
                    type="button"
                    onClick={handleAddStopToEdit}
                    className="px-3 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-xs cursor-pointer shrink-0"
                  >
                    + Add Stop
                  </button>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingRoute(null)}
                  className="px-4 py-2 border border-slate-200 bg-white rounded-xl font-bold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-xl shadow-sm transition cursor-pointer"
                >
                  Save Route Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT CARGO TRUCK / MOVING VEHICLE (FULL CRUD)                      */}
      {/* ========================================================================= */}
      {editingTruck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-purple-600" />
                <h3 className="font-black text-base text-slate-900">Edit Commercial Truck</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingTruck(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTruckEdit} className="space-y-3.5">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Truck Model & Specification</label>
                <input
                  type="text"
                  required
                  value={editingTruck.model}
                  onChange={(e) => setEditingTruck({ ...editingTruck, model: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Registration #</label>
                  <input
                    type="text"
                    required
                    value={editingTruck.reg}
                    onChange={(e) => setEditingTruck({ ...editingTruck, reg: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Base Operating City</label>
                  <select
                    value={editingTruck.baseCity}
                    onChange={(e) => setEditingTruck({ ...editingTruck, baseCity: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    {availableCoverageCities.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Capacity in Tons</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingTruck.capacityTons || 2.5}
                    onChange={(e) => setEditingTruck({ ...editingTruck, capacityTons: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Cubic Ft Volume</label>
                  <input
                    type="text"
                    value={editingTruck.capacityCubicFt}
                    onChange={(e) => setEditingTruck({ ...editingTruck, capacityCubicFt: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Allotted Chauffeur / Driver</label>
                <select
                  value={editingTruck.driverName}
                  onChange={(e) => setEditingTruck({ ...editingTruck, driverName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-purple-900"
                >
                  <option value="Unassigned">-- Unassigned Driver --</option>
                  {driverTeam.map((d) => (
                    <option key={d.id} value={d.name}>
                      👨‍✈️ {d.name} ({d.licenseCategory})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTruck(null)}
                  className="px-4 py-2 border border-slate-200 bg-white rounded-xl font-bold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl shadow-sm transition cursor-pointer"
                >
                  Save Truck Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Car,
  MapPin,
  Clock,
  Calendar,
  Users,
  ShieldCheck,
  PlusCircle,
  Phone,
  MessageCircle,
  Trash2,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  ArrowRight,
  Sparkles,
  ExternalLink,
  ChevronDown,
  Navigation,
  FileText,
  CreditCard,
  Building,
  HelpCircle,
  Eye,
  LogOut,
  X,
  Share2,
} from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { MobileNavBar } from '@/components/MobileNavBar';
import { BillingHistoryManager } from '@/components/BillingHistoryManager';
import {
  CITY_RIDES_DATA,
  CityRideItem,
  getCustomCityRides,
  saveCustomCityRide,
  deleteCustomCityRide,
} from '@/data/marketplaceData';
import { getActiveUser, logoutActiveUser, RegisteredUser } from '@/data/userAuth';
import { formatPKR, maskPhone } from '@/lib/api';

interface PassengerInquiry {
  id: string;
  passengerName: string;
  phone: string;
  route: string;
  travelDate: string;
  seatsRequested: number;
  type: 'SEAT_SHARING' | 'FULL_CAR';
  status: 'CONFIRMED' | 'PENDING' | 'COMPLETED';
  notes: string;
}

const DEFAULT_INQUIRIES: PassengerInquiry[] = [
  {
    id: 'inq-1',
    passengerName: 'Zubair Hashmi',
    phone: '+92 333 4512988',
    route: 'Karachi → Hyderabad (M-9)',
    travelDate: 'Tomorrow · 08:30 AM',
    seatsRequested: 1,
    type: 'SEAT_SHARING',
    status: 'CONFIRMED',
    notes: 'Pickup from Sohrab Goth M-9 Toll. Travelling light with 1 backpack.',
  },
  {
    id: 'inq-2',
    passengerName: 'Dr. Ayesha Siddiqui',
    phone: '+92 321 8847291',
    route: 'Hyderabad → Karachi (M-9)',
    travelDate: 'Saturday · 04:00 PM',
    seatsRequested: 4,
    type: 'FULL_CAR',
    status: 'PENDING',
    notes: 'Family booking for 3 adults + 1 child. Requested doorstep pickup from Latifabad.',
  },
  {
    id: 'inq-3',
    passengerName: 'Hamza Tariq',
    phone: '+92 345 7712390',
    route: 'Karachi → Hyderabad (M-9)',
    travelDate: 'Completed Yesterday',
    seatsRequested: 1,
    type: 'SEAT_SHARING',
    status: 'COMPLETED',
    notes: 'Met at Maskan Chowrangi. Fare paid in cash.',
  },
];

const DEFAULT_HIGHWAY_FLEET = [
  {
    id: 'fleet-1',
    model: 'Honda City 1.2 i-VTEC (2022)',
    reg: 'BDX-421 (Sindh)',
    seats: 4,
    mTagStatus: 'Active & Funded (M-9 & M-2)',
    acStatus: 'Chilled Dual AC',
    fitness: 'Highway Safety Inspected · Nov 2026',
    assignedRoute: 'Karachi ⇄ Hyderabad',
  },
  {
    id: 'fleet-2',
    model: 'Toyota Corolla Altis 1.6 (2023)',
    reg: 'LEA-901 (Islamabad)',
    seats: 4,
    mTagStatus: 'Active & Funded',
    acStatus: 'Automatic Climate Control',
    fitness: 'Motorway Police Compliant',
    assignedRoute: 'Lahore ⇄ Islamabad / Rawalpindi',
  },
];

function IntercityPortalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeUser, setActiveUserState] = useState<RegisteredUser | null>(null);
  const [currentTab, setCurrentTab] = useState<'routes' | 'inquiries' | 'fleet' | 'billing'>('routes');
  const [customRides, setCustomRides] = useState<CityRideItem[]>([]);
  const [inquiries, setInquiries] = useState<PassengerInquiry[]>(DEFAULT_INQUIRIES);
  const [isNewRouteModalOpen, setIsNewRouteModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Form State for New Intercity Route
  const [fromCity, setFromCity] = useState('Karachi');
  const [pickupPoint, setPickupPoint] = useState('Sohrab Goth / Maskan Chowrangi');
  const [toCity, setToCity] = useState('Hyderabad');
  const [dropPoint, setDropPoint] = useState('Latifabad By-Pass / Auto Bhan');
  const [rideType, setRideType] = useState<'SEAT_SHARING' | 'FULL_CAR' | 'BOTH'>('SEAT_SHARING');
  const [carModel, setCarModel] = useState('Honda City 1.2 · Chilled AC');
  const [availableSeats, setAvailableSeats] = useState(2);
  const [totalSeats, setTotalSeats] = useState(4);
  const [pricePerSeat, setPricePerSeat] = useState(1500);
  const [fullCarPrice, setFullCarPrice] = useState(6500);
  const [departureTime, setDepartureTime] = useState('08:30 AM Daily');
  const [departureDate, setDepartureDate] = useState('Daily Available');
  const [highwayTag, setHighwayTag] = useState('M-9 Motorway');
  const [baggageNote, setBaggageNote] = useState('1 medium bag / backpack per seat');
  const [operatorPhone, setOperatorPhone] = useState('+92 312 9988776');
  const [operatorWhatsApp, setOperatorWhatsApp] = useState('923129988776');

  // Load Active User & Routes
  useEffect(() => {
    const user = getActiveUser();
    setActiveUserState(user);
    setCustomRides(getCustomCityRides());

    if (user?.phone) {
      setOperatorPhone(user.phone);
      const cleanPhone = user.phone.replace(/[^0-9]/g, '');
      if (cleanPhone) setOperatorWhatsApp(cleanPhone.startsWith('0') ? '92' + cleanPhone.slice(1) : cleanPhone);
    }

    const onRidesUpdated = () => {
      setCustomRides(getCustomCityRides());
    };
    window.addEventListener('safarpk_city_rides_updated', onRidesUpdated);
    return () => window.removeEventListener('safarpk_city_rides_updated', onRidesUpdated);
  }, []);

  // Sync tab with URL query parameter if present
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'routes' || tabParam === 'inquiries' || tabParam === 'fleet' || tabParam === 'billing') {
      setCurrentTab(tabParam);
    }
    if (searchParams.get('action') === 'new') {
      setIsNewRouteModalOpen(true);
    }
  }, [searchParams]);

  const showNotificationBanner = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4500);
  };

  const handleCreateRoute = (e: React.FormEvent) => {
    e.preventDefault();

    const operatorName = activeUser?.businessName || activeUser?.name || 'Farhan Executive Carpool';

    const newRoute: CityRideItem = {
      id: `c2c-user-${Date.now()}`,
      op: operatorName,
      car: carModel,
      fromCity: fromCity.trim(),
      toCity: toCity.trim(),
      bag: baggageNote,
      time: departureTime,
      duration: `${highwayTag} route`,
      one: fullCarPrice,
      ret: fullCarPrice * 1.8,
      ver: true,
      tags: [highwayTag, `${availableSeats} Seats Open`, 'Tolls Included', 'Chilled AC'],
      category: rideType === 'SEAT_SHARING' ? 'Seat Sharing (Carpool)' : 'Private Highway Car',
      phone: operatorPhone,
      whatsapp: operatorWhatsApp,
      rideType: rideType,
      pricePerSeat: rideType !== 'FULL_CAR' ? pricePerSeat : undefined,
      availableSeats: availableSeats,
      totalSeats: totalSeats,
      departureTime: departureTime,
      departureDate: departureDate,
      pickupPoint: pickupPoint,
      dropPoint: dropPoint,
    };

    saveCustomCityRide(newRoute);
    setIsNewRouteModalOpen(false);
    showNotificationBanner(`Route from ${fromCity} to ${toCity} has been published live on SafarPK!`);
  };

  const handleDeleteRoute = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove the route "${name}"?`)) {
      deleteCustomCityRide(id);
      showNotificationBanner(`Route has been removed from marketplace.`);
    }
  };

  // Compile operator's visible routes (custom routes + Farhan demo routes)
  const operatorRoutes = [
    ...customRides,
    ...CITY_RIDES_DATA.filter((r) => r.id === 'c2c-khi-hyd-share' || (activeUser && r.whatsapp === operatorWhatsApp)),
  ];

  // Distinct count
  const uniqueRoutes = Array.from(new Map(operatorRoutes.map((r) => [r.id, r])).values());

  const totalSeatsAvailable = uniqueRoutes.reduce((acc, r) => acc + (r.availableSeats || 0), 0);

  const tabs = [
    { id: 'routes', label: 'Published Routes', icon: Navigation, count: uniqueRoutes.length },
    { id: 'inquiries', label: 'Passenger Requests', icon: Users, count: inquiries.filter((i) => i.status === 'PENDING').length },
    { id: 'fleet', label: 'Highway Fleet', icon: Car, count: DEFAULT_HIGHWAY_FLEET.length },
    { id: 'billing', label: 'Subscription & Pass', icon: CreditCard, count: undefined },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans flex flex-col pb-24 md:pb-12">
      <AppHeader />

      {/* Operator Sub-Header */}
      <div className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-400 shrink-0">
                <Navigation className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                    {activeUser?.businessName || 'Farhan Executive Carpool & Highway Fleet'}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Highway Operator
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 mt-0.5 flex items-center gap-2 flex-wrap">
                  <span>Operator: {activeUser?.name || 'Farhan Ahmed'}</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-teal-300 font-mono text-xs">{operatorPhone}</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-emerald-400 font-semibold">Motorway M-9 & M-2 Verified</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setIsNewRouteModalOpen(true)}
                className="flex-1 sm:flex-none h-10 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Post Intercity Route</span>
              </button>
              <Link
                href="/city-to-city"
                target="_blank"
                className="h-10 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                title="View how passengers see city-to-city rides"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Public Search</span>
              </Link>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80">
            <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60">
              <span className="text-[11px] font-semibold text-slate-400 block">Active Intercity Routes</span>
              <span className="text-lg sm:text-xl font-black text-white mt-0.5 block">{uniqueRoutes.length} Published</span>
            </div>
            <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60">
              <span className="text-[11px] font-semibold text-slate-400 block">Available Carpool Seats</span>
              <span className="text-lg sm:text-xl font-black text-teal-300 mt-0.5 block">{totalSeatsAvailable} Seats Open</span>
            </div>
            <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60">
              <span className="text-[11px] font-semibold text-slate-400 block">Passenger Requests</span>
              <span className="text-lg sm:text-xl font-black text-amber-300 mt-0.5 block">{inquiries.length} Active</span>
            </div>
            <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60">
              <span className="text-[11px] font-semibold text-slate-400 block">Operator Subscription</span>
              <span className="text-lg sm:text-xl font-black text-emerald-400 mt-0.5 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Active Pass
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm font-semibold flex items-center justify-between shadow-sm animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{notification}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-emerald-700 hover:text-emerald-900">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1">
        {/* Navigation Tabs (Mobile Select & Desktop Pills) */}
        <div className="mb-6">
          {/* Mobile Select (Compact UI/UX) */}
          <div className="sm:hidden mb-3">
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Select Section</label>
            <div className="relative">
              <select
                value={currentTab}
                onChange={(e) => setCurrentTab(e.target.value as any)}
                className="w-full h-11 px-3.5 pr-8 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-800 shadow-sm appearance-none outline-none focus:border-teal-500"
              >
                {tabs.map((tab) => (
                  <option key={tab.id} value={tab.id}>
                    {tab.label} {tab.count !== undefined ? `(${tab.count})` : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
            </div>
          </div>

          {/* Desktop Tab Pills */}
          <div className="hidden sm:flex items-center gap-2 border-b border-slate-200 pb-3">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setCurrentTab(tab.id as any)}
                  className={`h-11 px-4 rounded-xl font-bold text-sm flex items-center gap-2 transition cursor-pointer ${
                    isActive
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full font-extrabold ${
                        isActive ? 'bg-teal-800 text-teal-100' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* TAB 1: PUBLISHED ROUTES */}
        {currentTab === 'routes' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Your Highway Routes & Daily Carpools</h2>
                <p className="text-xs text-slate-500">
                  Manage seats, per-passenger pricing, and full private car options between Pakistani cities.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewRouteModalOpen(true)}
                className="h-9 px-3.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add Route</span>
              </button>
            </div>

            {uniqueRoutes.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center border border-slate-200">
                <Navigation className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">No Intercity Routes Added Yet</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                  Start by adding your regular city to city routes (e.g. Karachi to Hyderabad or Lahore to Islamabad) to
                  receive direct passenger bookings.
                </p>
                <button
                  type="button"
                  onClick={() => setIsNewRouteModalOpen(true)}
                  className="h-10 px-5 rounded-xl bg-teal-600 text-white font-bold text-xs inline-flex items-center gap-2 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Create First Route</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {uniqueRoutes.map((route) => (
                  <div
                    key={route.id}
                    className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-teal-300 transition shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2.5 py-1 rounded-md bg-teal-50 text-teal-800 border border-teal-200 text-[11px] font-black uppercase tracking-wider">
                            {route.rideType === 'SEAT_SHARING'
                              ? '💺 Seat Sharing / Carpool'
                              : route.rideType === 'FULL_CAR'
                              ? '🚗 Full Private Car'
                              : '💺 Seats + Full Car'}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold">
                            {route.tags?.[0] || 'Highway Motorway'}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Live on SafarPK
                        </span>
                      </div>

                      {/* Route Path */}
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 mb-3">
                        <div className="flex items-center gap-2 font-black text-slate-900 text-base">
                          <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
                          <span>{route.fromCity}</span>
                          <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>{route.toCity}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 pl-6 flex flex-col gap-0.5">
                          {route.pickupPoint && (
                            <span>
                              <strong>Pickup:</strong> {route.pickupPoint}
                            </span>
                          )}
                          {route.dropPoint && (
                            <span>
                              <strong>Drop:</strong> {route.dropPoint}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Vehicle & Pricing Details */}
                      <div className="space-y-1.5 text-xs text-slate-700 mb-4">
                        <div className="flex justify-between items-center py-1 border-b border-slate-100">
                          <span className="text-slate-500 flex items-center gap-1.5">
                            <Car className="w-3.5 h-3.5 text-slate-400" />
                            Vehicle:
                          </span>
                          <span className="font-bold text-slate-900">{route.car}</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-slate-100">
                          <span className="text-slate-500 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            Schedule:
                          </span>
                          <span className="font-bold text-slate-900">{route.departureTime || route.time}</span>
                        </div>
                        {route.pricePerSeat && (
                          <div className="flex justify-between items-center py-1 border-b border-slate-100">
                            <span className="text-slate-500">Carpool Seat Fare:</span>
                            <span className="font-black text-teal-700 text-sm">
                              {formatPKR(route.pricePerSeat)}
                              <span className="text-[10px] font-normal text-slate-500 ml-1">/ passenger</span>
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between items-center py-1">
                          <span className="text-slate-500">Full Vehicle Fare:</span>
                          <span className="font-black text-slate-900 text-sm">{formatPKR(route.one)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <a
                          href={`https://wa.me/${route.whatsapp}?text=${encodeURIComponent(
                            `Assalam o Alaikum, inquiring about ${route.fromCity} to ${route.toCity} ride on SafarPK.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-8 px-3 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold inline-flex items-center gap-1.5 transition"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>WhatsApp Link</span>
                        </a>
                      </div>

                      {route.id.startsWith('c2c-user-') && (
                        <button
                          type="button"
                          onClick={() => handleDeleteRoute(route.id, `${route.fromCity} to ${route.toCity}`)}
                          className="h-8 px-2.5 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-semibold inline-flex items-center gap-1 transition"
                          title="Delete route"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PASSENGER INQUIRIES */}
        {currentTab === 'inquiries' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200">
              <h2 className="text-base font-extrabold text-slate-900">Passenger Seat Bookings & Inquiries</h2>
              <p className="text-xs text-slate-500">
                Direct phone and WhatsApp inquiries from travelers wanting to join your highway rides.
              </p>
            </div>

            <div className="space-y-3">
              {inquiries.map((inq) => (
                <div
                  key={inq.id}
                  className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 hover:border-slate-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-slate-900 text-base">{inq.passengerName}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          inq.status === 'CONFIRMED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : inq.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {inq.status}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 text-[11px] font-bold">
                        {inq.type === 'SEAT_SHARING' ? `${inq.seatsRequested} Seat(s)` : 'Full Car'}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-800">{inq.route}</span>
                      <span>·</span>
                      <span className="text-slate-500">{inq.travelDate}</span>
                    </div>

                    {inq.notes && (
                      <p className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-100 max-w-xl">
                        "{inq.notes}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <a
                      href={`tel:${inq.phone}`}
                      className="h-9 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold inline-flex items-center gap-1.5 transition"
                    >
                      <Phone className="w-3.5 h-3.5 text-slate-600" />
                      <span>Call</span>
                    </a>
                    <a
                      href={`https://wa.me/${inq.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                        `Assalam o Alaikum ${inq.passengerName}, regarding your seat request for ${inq.route} on SafarPK.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 transition shadow-sm"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>WhatsApp Passenger</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: HIGHWAY FLEET */}
        {currentTab === 'fleet' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Motorway Verified Fleet & M-Tags</h2>
                <p className="text-xs text-slate-500">
                  Vehicles meeting National Highways & Motorway Police safety standards for intercity travel.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DEFAULT_HIGHWAY_FLEET.map((vehicle) => (
                <div key={vehicle.id} className="bg-white rounded-2xl p-5 border border-slate-200 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base">{vehicle.model}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Registration: <span className="font-mono font-bold text-slate-700">{vehicle.reg}</span>
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-black uppercase">
                      Motorway Ready
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-500">M-Tag Motorway Pass:</span>
                      <span className="font-bold text-teal-700">{vehicle.mTagStatus}</span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-500">Air Conditioning:</span>
                      <span className="font-bold text-slate-800">{vehicle.acStatus}</span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-500">Police & Safety:</span>
                      <span className="font-bold text-emerald-700">{vehicle.fitness}</span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-500">Active Route:</span>
                      <span className="font-bold text-slate-900">{vehicle.assignedRoute}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: BILLING & ROUTE OPERATOR PASS */}
        {currentTab === 'billing' && (
          <div className="space-y-4">
            <BillingHistoryManager
              role="PROVIDER"
              roleTitle="Intercity Highway Route Operator"
              businessName={activeUser?.businessName || 'Farhan Executive Carpool'}
              initialPlanName="Intercity Highway Route Operator Pass"
            />
          </div>
        )}
      </div>

      {/* POST INTERCITY ROUTE MODAL */}
      {isNewRouteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                  <Navigation className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-lg text-slate-900">Post New Intercity Route</h3>
                  <p className="text-xs text-slate-500">Publish your motorway or carpool route on SafarPK</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewRouteModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRoute} className="space-y-4">
              {/* Origin & Destination */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-slate-700">From (Departure City)</span>
                  <select
                    value={fromCity}
                    onChange={(e) => setFromCity(e.target.value)}
                    className="h-10 px-3 rounded-xl border border-slate-300 text-sm font-semibold outline-none focus:border-teal-600 bg-white"
                  >
                    <option value="Karachi">Karachi</option>
                    <option value="Hyderabad">Hyderabad</option>
                    <option value="Lahore">Lahore</option>
                    <option value="Islamabad">Islamabad</option>
                    <option value="Rawalpindi">Rawalpindi</option>
                    <option value="Peshawar">Peshawar</option>
                    <option value="Faisalabad">Faisalabad</option>
                    <option value="Multan">Multan</option>
                    <option value="Sukkur">Sukkur</option>
                  </select>
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-slate-700">To (Arrival City)</span>
                  <select
                    value={toCity}
                    onChange={(e) => setToCity(e.target.value)}
                    className="h-10 px-3 rounded-xl border border-slate-300 text-sm font-semibold outline-none focus:border-teal-600 bg-white"
                  >
                    <option value="Hyderabad">Hyderabad</option>
                    <option value="Karachi">Karachi</option>
                    <option value="Islamabad">Islamabad</option>
                    <option value="Lahore">Lahore</option>
                    <option value="Rawalpindi">Rawalpindi</option>
                    <option value="Peshawar">Peshawar</option>
                    <option value="Faisalabad">Faisalabad</option>
                    <option value="Multan">Multan</option>
                    <option value="Sukkur">Sukkur</option>
                  </select>
                </label>
              </div>

              {/* Landmark points */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-slate-700">Pickup Landmark</span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sohrab Goth / Maskan Chowrangi"
                    value={pickupPoint}
                    onChange={(e) => setPickupPoint(e.target.value)}
                    className="h-10 px-3 rounded-xl border border-slate-300 text-xs font-medium outline-none focus:border-teal-600"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-slate-700">Dropoff Landmark</span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Latifabad By-Pass / Qasim Chowk"
                    value={dropPoint}
                    onChange={(e) => setDropPoint(e.target.value)}
                    className="h-10 px-3 rounded-xl border border-slate-300 text-xs font-medium outline-none focus:border-teal-600"
                  />
                </label>
              </div>

              {/* Ride Mode Selection */}
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-700">Ride Type</span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRideType('SEAT_SHARING')}
                    className={`h-10 rounded-xl text-xs font-bold border transition ${
                      rideType === 'SEAT_SHARING'
                        ? 'border-teal-600 bg-teal-50 text-teal-900'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    💺 Seat Sharing
                  </button>
                  <button
                    type="button"
                    onClick={() => setRideType('FULL_CAR')}
                    className={`h-10 rounded-xl text-xs font-bold border transition ${
                      rideType === 'FULL_CAR'
                        ? 'border-teal-600 bg-teal-50 text-teal-900'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    🚗 Full Car
                  </button>
                  <button
                    type="button"
                    onClick={() => setRideType('BOTH')}
                    className={`h-10 rounded-xl text-xs font-bold border transition ${
                      rideType === 'BOTH'
                        ? 'border-teal-600 bg-teal-50 text-teal-900'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    🔄 Both Options
                  </button>
                </div>
              </div>

              {/* Pricing & Seats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {rideType !== 'FULL_CAR' && (
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-slate-700">Per Seat Price (PKR)</span>
                    <input
                      type="number"
                      required
                      min={100}
                      step={50}
                      value={pricePerSeat}
                      onChange={(e) => setPricePerSeat(Number(e.target.value))}
                      className="h-10 px-3 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-teal-600"
                    />
                  </label>
                )}

                <label className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-slate-700">Full Vehicle Fare (PKR)</span>
                  <input
                    type="number"
                    required
                    min={500}
                    step={100}
                    value={fullCarPrice}
                    onChange={(e) => setFullCarPrice(Number(e.target.value))}
                    className="h-10 px-3 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-teal-600"
                  />
                </label>

                {rideType !== 'FULL_CAR' && (
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-slate-700">Available Seats Now</span>
                    <select
                      value={availableSeats}
                      onChange={(e) => setAvailableSeats(Number(e.target.value))}
                      className="h-10 px-3 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-teal-600 bg-white"
                    >
                      <option value={1}>1 Seat Left</option>
                      <option value={2}>2 Seats Left</option>
                      <option value={3}>3 Seats Left</option>
                      <option value={4}>4 Seats Available</option>
                    </select>
                  </label>
                )}
              </div>

              {/* Vehicle & Highway Tag */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-slate-700">Vehicle Model & AC</span>
                  <input
                    type="text"
                    required
                    value={carModel}
                    onChange={(e) => setCarModel(e.target.value)}
                    placeholder="e.g. Honda City 1.2 · Chilled AC"
                    className="h-10 px-3 rounded-xl border border-slate-300 text-xs font-medium outline-none focus:border-teal-600"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-slate-700">Highway Route / Motorway</span>
                  <select
                    value={highwayTag}
                    onChange={(e) => setHighwayTag(e.target.value)}
                    className="h-10 px-3 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-teal-600 bg-white"
                  >
                    <option value="M-9 Motorway">M-9 Motorway (Karachi - Hyderabad)</option>
                    <option value="M-2 Motorway">M-2 Motorway (Lahore - Islamabad)</option>
                    <option value="M-1 Motorway">M-1 Motorway (Islamabad - Peshawar)</option>
                    <option value="M-3 / M-4 Motorway">M-3 / M-4 Motorway (Faisalabad - Multan)</option>
                    <option value="M-5 Motorway">M-5 Motorway (Multan - Sukkur)</option>
                    <option value="N-5 National Highway">N-5 National Highway (GT Road)</option>
                  </select>
                </label>
              </div>

              {/* Schedule */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-slate-700">Departure Timing</span>
                  <input
                    type="text"
                    required
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    placeholder="e.g. 08:30 AM Daily or Flexible"
                    className="h-10 px-3 rounded-xl border border-slate-300 text-xs font-medium outline-none focus:border-teal-600"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-slate-700">Departure Cadence</span>
                  <input
                    type="text"
                    required
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    placeholder="e.g. Daily or Specific Date"
                    className="h-10 px-3 rounded-xl border border-slate-300 text-xs font-medium outline-none focus:border-teal-600"
                  />
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsNewRouteModalOpen(false)}
                  className="h-11 px-4 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-11 px-6 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs flex items-center gap-2 transition cursor-pointer shadow-md"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Publish Route Live</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <MobileNavBar />
    </div>
  );
}

export default function IntercityPortalPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 text-slate-500 font-semibold text-sm">
          Loading Intercity Partner Portal...
        </div>
      }
    >
      <IntercityPortalContent />
    </Suspense>
  );
}

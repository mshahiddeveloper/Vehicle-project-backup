'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Car,
  Calendar,
  MessageCircle,
  Heart,
  ShieldCheck,
  MapPin,
  Clock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  FileText,
  User,
  Lock,
  ChevronRight,
  RefreshCw,
  LogOut,
  Navigation,
  Bus,
  Truck,
  PlusCircle,
  HelpCircle,
  Upload,
  Scan,
  Check,
  ExternalLink,
} from 'lucide-react';
import { MobileNavBar } from '@/components/MobileNavBar';
import { MobilePullToRefresh } from '@/components/MobilePullToRefresh';
import { OfflineStatusBanner } from '@/components/OfflineStatusBanner';
import { API_BASE, formatPKR, maskCnic, maskLicense, maskPhone } from '@/lib/api';
import { getActiveUser, setActiveUser, RegisteredUser, getUserDashboardPath, getAllRegisteredUsers } from '@/data/userAuth';
import { WhatsAppIcon } from '@/components/WhatsAppIcon';
import { CARS_DATA } from '@/data/marketplaceData';
import {
  getDriverBookings,
  confirmDriverBooking,
  maskPakistaniCnic,
  maskPakistaniLicense,
  DriverBooking,
} from '@/data/driverBookings';

export default function CustomerDashboardPage() {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'bookings' | 'rides' | 'drivers' | 'shifting' | 'wishlist' | 'leads' | 'complaints' | 'profile' | 'security'
  >('overview');

  // Customer State
  const [customerName, setCustomerName] = useState('Hamza Tariq');
  const [customerPhone, setCustomerPhone] = useState('+92 300 8472910');
  const [customerEmail, setCustomerEmail] = useState('hamza.tariq@gmail.com');
  const [customerCity, setCustomerCity] = useState('Lahore');
  const [customerCnic, setCustomerCnic] = useState('35202-8172910-3');
  const [customerLicense, setCustomerLicense] = useState('LHR-DL-449102');
  const [customerLicenseExpiry, setCustomerLicenseExpiry] = useState('2028-11-20');
  const [showFullCnic, setShowFullCnic] = useState(false);
  const [licenseDocPreview, setLicenseDocPreview] = useState<string | null>(
    'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80'
  );
  const [licenseFileName, setLicenseFileName] = useState<string | null>('punjab_driving_license.jpg');
  const [licenseScanning, setLicenseScanning] = useState(false);
  const [licenseUploadNotice, setLicenseUploadNotice] = useState<string | null>(null);

  const handleCustomerLicenseUpload = (file?: File) => {
    setLicenseScanning(true);
    setLicenseFileName(file ? file.name : 'punjab_driving_license_scanned.jpg');
    if (file) {
      setLicenseDocPreview(URL.createObjectURL(file));
    }
    setTimeout(() => {
      setLicenseScanning(false);
      setCustomerLicense('LHR-DL-449102');
      setCustomerLicenseExpiry('2028-11-20');
      setLicenseUploadNotice('Driving License OCR scanned & verified successfully.');
      const user = getActiveUser();
      if (user) {
        user.licenseNumber = 'LHR-DL-449102';
        setActiveUser(user);
      }
      setTimeout(() => setLicenseUploadNotice(null), 3000);
    }, 1200);
  };

  // Data states
  const [selectedSmartCardModal, setSelectedSmartCardModal] = useState<any | null>(null);
  const [driverBookings, setDriverBookings] = useState<DriverBooking[]>([]);

  useEffect(() => {
    setDriverBookings(getDriverBookings());
    const handleDriverBookings = () => {
      setDriverBookings(getDriverBookings());
    };
    window.addEventListener('safarpk_driver_booking_status_updated', handleDriverBookings);
    return () => window.removeEventListener('safarpk_driver_booking_status_updated', handleDriverBookings);
  }, []);

  const [bookings, setBookings] = useState<any[]>([
    {
      id: 'bkg-101',
      bookingRef: 'BKG-8492',
      vehicleName: 'Toyota Corolla Altis Grande 2024',
      assignedVehicleReg: 'LEA-24-9988',
      city: 'Lahore',
      startDate: '2026-11-12',
      endDate: '2026-11-15',
      dailyRate: 8500,
      totalAmount: 25500,
      withDriver: true,
      pickupArea: 'DHA Phase 5, Lahore',
      listerPhone: '+923001234567',
      listerBusinessName: 'Salman Rent a Car & Luxury Fleets',
      assignedDriver: {
        name: 'Tariq Mahmood',
        phone: '+92 301 9821045',
        cnic: '35201-4412098-5',
        license: 'VIP Chauffeur (LTV/HTV)',
        avatar: '👨‍✈️',
      },
      status: 'CONFIRMED',
      paymentStatus: 'PAY_ON_PICKUP',
      serviceType: 'CAR_RENTAL',
      vehicleSmartCard: {
        registrationNo: 'LEA-24-9988',
        chassisNo: 'NZE140-5019821',
        engineNo: '2ZR-FE-9812401',
        ownerName: 'Salman Rent a Car & Luxury Fleets (Pvt) Ltd',
        taxpayerNtn: '7819201-3',
        fitnessValidTill: '2026-12-31',
        tokenTax: 'Paid Lifetime',
      },
    },
    {
      id: 'bkg-102',
      bookingRef: 'BKG-4412',
      vehicleName: 'Honda Civic Oriel Turbo 2024',
      assignedVehicleReg: 'ISB-24-4412',
      city: 'Islamabad',
      startDate: '2026-11-20',
      endDate: '2026-11-22',
      dailyRate: 14000,
      totalAmount: 28000,
      withDriver: false,
      pickupArea: 'Centaurus Mall, F-8, Islamabad',
      listerPhone: '+923007654321',
      status: 'REQUESTED',
      paymentStatus: 'PENDING',
      serviceType: 'CAR_RENTAL',
    },
  ]);

  const [authChecked, setAuthChecked] = useState(false);

  // Load newly submitted bookings from localStorage & enforce Customer role guard
  useEffect(() => {
    // Sync active authenticated profile
    const user = getActiveUser();
    if (!user) {
      if (typeof window !== 'undefined') {
        window.location.replace('/login?redirect=/customer');
      }
      return;
    }
    if (user.role !== 'CUSTOMER') {
      if (typeof window !== 'undefined') {
        window.location.replace(getUserDashboardPath(user));
      }
      return;
    }
    setAuthChecked(true);

    if (user.name) setCustomerName(user.name);
    if (user.phone) setCustomerPhone(user.phone);
    if (user.email) setCustomerEmail(user.email);
    if (user.city) setCustomerCity(user.city);
    if (user.nationalId) setCustomerCnic(user.nationalId);
    if (user.licenseNumber) setCustomerLicense(user.licenseNumber);

    try {
      const saved = localStorage.getItem('safarpk_customer_bookings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setBookings((prev) => {
            const ids = new Set(parsed.map((p: any) => p.bookingRef));
            const filteredPrev = prev.filter((p) => !ids.has(p.bookingRef));
            return [...parsed, ...filteredPrev];
          });
        }
      }
    } catch (e) {}
  }, []);

  const [leadsHistory, setLeadsHistory] = useState<any[]>([
    {
      id: 'lead-01',
      vehicleTitle: 'Toyota Corolla Altis Grande 2024',
      city: 'Lahore',
      dailyRate: 8500,
      createdAt: '2026-11-09T14:20:00Z',
      status: 'CONTACTED',
    },
    {
      id: 'lead-02',
      vehicleTitle: 'Toyota HiAce Grand Cabin (14 Seats Shuttle)',
      city: 'Lahore',
      dailyRate: 11000,
      createdAt: '2026-11-08T09:15:00Z',
      status: 'CONTACTED',
    },
  ]);

  const [wishlist, setWishlist] = useState<any[]>([
    {
      id: 'w-1',
      title: 'Toyota Prado TX 2.8D 2023',
      city: 'Islamabad',
      dailyRate: 35000,
      seats: 7,
      transmission: 'Automatic',
      img: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 'w-2',
      title: 'Hyundai Shehzore D-100 Shifting Truck',
      city: 'Lahore',
      dailyRate: 4500,
      seats: 3,
      transmission: 'Manual',
      img: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=600&auto=format&fit=crop&q=80',
    },
  ]);

  // Complaints
  const [complaintSubject, setComplaintSubject] = useState('');
  const [complaintCategory, setComplaintCategory] = useState('VEHICLE_CONDITION');
  const [complaintDetails, setComplaintDetails] = useState('');
  const [complaintSuccess, setComplaintSuccess] = useState<string | null>(null);

  const handleSubmitComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintSubject || !complaintDetails) return;
    const ticketId = `DISP-${Math.floor(10000 + Math.random() * 90000)}`;
    setComplaintSuccess(`Your complaint has been submitted. Reference Ticket ID: ${ticketId}. Our compliance agent will review within 24 hours.`);
    setComplaintSubject('');
    setComplaintDetails('');
    setTimeout(() => setComplaintSuccess(null), 6000);
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-600">Verifying customer portal credentials...</span>
        </div>
      </div>
    );
  }

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
              Customer Portal
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs font-bold px-3 py-1.5 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition"
            >
              ← Back to Marketplace
            </Link>
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shadow">
                {customerName.charAt(0)}
              </div>
              <div className="hidden md:block text-left text-xs">
                <span className="font-bold text-slate-900 block leading-tight">{customerName}</span>
                <span className="text-[10px] text-slate-400 font-mono">{maskPhone(customerPhone)}</span>
              </div>
            </div>
          </div>
        </div>
        <MobilePullToRefresh />
        <OfflineStatusBanner />
      </header>

      {/* Main Body with Sidebar Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Mobile App Navigation Bar (Horizontal Scrollable Chips with zero clutter) */}
        <div className="lg:hidden col-span-1 space-y-2.5">
          <div className="p-3 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-base font-black shrink-0">
                👤
              </div>
              <div className="min-w-0">
                <h3 className="font-heading font-extrabold text-xs text-slate-900 truncate">{customerName}</h3>
                <span className="text-[10px] text-emerald-700 font-bold block truncate">Verified Member Portal</span>
              </div>
            </div>
            <span className="text-[9px] font-black px-2 py-0.5 rounded-full border border-emerald-200 text-emerald-700 bg-emerald-50 shrink-0">
              Active
            </span>
          </div>

          {/* Swipeable Native App Tabs */}
          <div className="overflow-x-auto no-scrollbar py-1">
            <div className="flex items-center gap-1.5 min-w-max px-0.5">
              {[
                { id: 'overview', label: 'Overview', icon: Car },
                { id: 'bookings', label: 'Rentals', icon: Calendar, badge: bookings.length },
                { id: 'rides', label: 'Shuttles', icon: Bus },
                { id: 'drivers', label: 'Drivers', icon: User },
                { id: 'shifting', label: 'Movers', icon: Truck },
                { id: 'wishlist', label: 'Saved', icon: Heart, badge: wishlist.length },
                { id: 'leads', label: 'Inquiries', icon: MessageCircle },
                { id: 'complaints', label: 'Disputes', icon: AlertCircle },
                { id: 'profile', label: 'Profile', icon: ShieldCheck },
                { id: 'security', label: 'Security', icon: Lock },
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
                👤
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">{customerName}</h3>
                <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Verified Customer
                </span>
              </div>
            </div>
          </div>

          <nav className="bg-white rounded-2xl border border-slate-200 p-2 space-y-1 shadow-xs text-xs font-semibold">
            {[
              { id: 'overview', label: 'Dashboard Overview', icon: Car },
              { id: 'bookings', label: 'My Rental Bookings', icon: Calendar, badge: bookings.length },
              { id: 'rides', label: 'Intercity & Shuttle Rides', icon: Bus },
              { id: 'drivers', label: 'My Hired Drivers', icon: User },
              { id: 'shifting', label: 'Home Shifting Quotes', icon: Truck },
              { id: 'wishlist', label: 'Saved Wishlist', icon: Heart, badge: wishlist.length },
              { id: 'leads', label: 'WhatsApp Inquiries Log', icon: MessageCircle },
              { id: 'complaints', label: 'Disputes & Complaints', icon: AlertCircle },
              { id: 'profile', label: 'Identity & Verification', icon: ShieldCheck },
              { id: 'security', label: 'Security & Privacy', icon: Lock },
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

          <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl mt-4 text-xs text-emerald-950 space-y-2">
            <span className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Helpful Safety Guide
            </span>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              SafarPK connects you directly with independent hosts and drivers. For your peace of mind, always inspect the vehicle in person, check original registration documents upon arrival, and settle rental payments directly with the host at handover.
            </p>
          </div>
        </aside>

        {/* Tab Content Canvas */}
        <main className="lg:col-span-3 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Welcome Banner */}
              <div className="p-6 bg-gradient-to-r from-emerald-800 to-teal-700 text-white rounded-3xl shadow-md">
                <span className="text-xs uppercase tracking-wider font-extrabold text-emerald-300">Welcome Back</span>
                <h2 className="text-lg sm:text-2xl font-black mt-1 text-white">Hello, {customerName}!</h2>
                <p className="text-xs sm:text-sm text-white font-medium mt-1.5 max-w-xl leading-relaxed">
                  Manage all your car rentals, scheduled shuttle routes, intercity rides, and cargo quotes in one centralized dashboard.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href="/"
                    className="px-4 py-2 bg-white text-emerald-900 rounded-xl text-xs font-bold hover:bg-emerald-50 transition shadow"
                  >
                    + Book Another Vehicle
                  </Link>
                  <button
                    onClick={() => setActiveTab('bookings')}
                    className="px-4 py-2 bg-emerald-700/60 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold border border-emerald-500/50 transition"
                  >
                    View Active Requests ({bookings.length})
                  </button>
                </div>
              </div>

              {/* KPI Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] text-slate-400 font-semibold block">Total Rentals</span>
                  <span className="text-2xl font-black text-slate-900 mt-1 block">12</span>
                  <span className="text-[10px] text-emerald-600 font-bold mt-1 block">★ 4.9 Customer Rating</span>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] text-slate-400 font-semibold block">Active Requests</span>
                  <span className="text-2xl font-black text-emerald-600 mt-1 block">{bookings.length}</span>
                  <span className="text-[10px] text-slate-500 mt-1 block">1 Confirmed</span>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] text-slate-400 font-semibold block">WhatsApp Leads</span>
                  <span className="text-2xl font-black text-slate-900 mt-1 block">{leadsHistory.length}</span>
                  <span className="text-[10px] text-slate-500 mt-1 block">Direct Inquiries</span>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] text-slate-400 font-semibold block">Saved Vehicles</span>
                  <span className="text-2xl font-black text-slate-900 mt-1 block">{wishlist.length}</span>
                  <span className="text-[10px] text-slate-500 mt-1 block">In Wishlist</span>
                </div>
              </div>

              {/* Recent Bookings Snapshot */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-extrabold text-sm text-slate-900">Recent Rental Requests</h3>
                  <button onClick={() => setActiveTab('bookings')} className="text-xs font-bold text-emerald-600 hover:underline">
                    View All →
                  </button>
                </div>

                <div className="space-y-3">
                  {bookings.map((b) => (
                    <div key={b.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                            {b.bookingRef}
                          </span>
                          <h4 className="font-bold text-xs text-slate-900">{b.vehicleName}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            b.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {b.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          {b.startDate} to {b.endDate} · {b.pickupArea} · Total: PKR {formatPKR(b.totalAmount)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {b.status === 'CONFIRMED' && (
                          <button
                            type="button"
                            onClick={() => setSelectedSmartCardModal(b)}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer whitespace-nowrap shrink-0"
                          >
                            <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>View Documents</span>
                          </button>
                        )}
                        <a
                          href={`https://wa.me/${b.listerPhone.replace(/[^0-9]/g, '')}?text=Hello%20regarding%20my%20booking%20${b.bookingRef}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition whitespace-nowrap shrink-0"
                        >
                          <WhatsAppIcon className="w-3.5 h-3.5 fill-white shrink-0" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MY BOOKINGS */}
          {activeTab === 'bookings' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Vehicle Rental Requests</h3>
                  <p className="text-xs text-slate-500">Track your local within-city car rental requests and confirmations.</p>
                </div>
                <Link
                  href="/"
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  + New Booking
                </Link>
              </div>

              <div className="space-y-4">
                {bookings.map((b) => (
                  <div key={b.id} className="p-4 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {b.bookingRef}
                          </span>
                          <h4 className="font-bold text-sm text-slate-900">{b.vehicleName}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            b.withDriver ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {b.withDriver ? '👨‍✈️ With Driver' : '🚗 Self-Drive'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Dates: <strong>{b.startDate}</strong> to <strong>{b.endDate}</strong> · Pickup: {b.pickupArea}
                        </p>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between">
                        <span className="text-xs font-bold text-slate-400">Total Estimate</span>
                        <span className="text-base font-black text-slate-900">PKR {formatPKR(b.totalAmount)}</span>
                      </div>
                    </div>

                    {/* Assigned Chauffeur Details (So Customer Knows Who is Arriving & In Which Vehicle) */}
                    {b.withDriver && b.assignedDriver ? (
                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shrink-0">
                            {b.assignedDriver.avatar || '👨‍✈️'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide">
                                Assigned Company Chauffeur
                              </span>
                              <span className="text-[10px] font-bold text-emerald-900 bg-white px-2 py-0.2 rounded-full border border-emerald-300">
                                Dispatched with Vehicle
                              </span>
                            </div>
                            <h5 className="font-extrabold text-xs text-slate-900 mt-0.5">
                              {b.assignedDriver.name} · <span className="text-emerald-800 font-semibold font-mono">Reg: {b.assignedVehicleReg}</span>
                            </h5>
                            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono mt-0.5">
                              <span className="text-slate-600">Phone: {b.assignedDriver.phone}</span>
                              <span className="text-slate-300">·</span>
                              {b.status === 'CONFIRMED' ? (
                                <>
                                  <span className="text-slate-700">CNIC: <strong className="text-slate-900">{b.assignedDriver.cnic || '35201-4412098-5'}</strong></span>
                                  <span className="text-slate-300">·</span>
                                  <span className="text-slate-700">Licence: <strong className="text-slate-900">{b.assignedDriver.license || 'LHR-DL-99210'}</strong></span>
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-sans font-bold bg-emerald-100 text-emerald-800">✓ ID Unlocked</span>
                                </>
                              ) : (
                                <>
                                  <span className="text-slate-500">CNIC: <strong>{maskPakistaniCnic(b.assignedDriver.cnic || '35201-4412098-5')}</strong></span>
                                  <span className="text-slate-300">·</span>
                                  <span className="text-slate-500">Licence: <strong>{maskPakistaniLicense(b.assignedDriver.license || 'LHR-DL-99210')}</strong></span>
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-sans font-bold bg-amber-100 text-amber-800">Unlocks on Confirmation</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <a
                            href={`https://wa.me/${b.assignedDriver.phone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(b.assignedDriver.name)},%20I%20am%20your%20customer%20for%20booking%20${b.bookingRef}%20(${encodeURIComponent(b.vehicleName)}).`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3.5 py-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-2xs transition whitespace-nowrap shrink-0"
                          >
                            <WhatsAppIcon className="w-3.5 h-3.5 fill-white shrink-0" />
                            <span>WhatsApp</span>
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2.5 bg-amber-50/70 rounded-xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-950">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">🚗 Self-Drive Key Handover</span>
                          <span className="text-amber-300">•</span>
                          <span>Assigned Vehicle Reg: <strong>{b.assignedVehicleReg || 'Assigned on Location'}</strong></span>
                        </div>
                        <span className="text-[10px] font-bold text-amber-900 bg-white px-2 py-0.5 rounded border border-amber-300">
                          Bring Original NADRA CNIC & License for Physical Inspection
                        </span>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs pt-1">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">Payment Mode:</span>
                        <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                          {b.paymentStatus === 'PAY_ON_PICKUP' ? '💵 Cash / Direct on Handover' : '💳 Online Verified'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {b.status === 'CONFIRMED' && (
                          <button
                            type="button"
                            onClick={() => setSelectedSmartCardModal(b)}
                            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer whitespace-nowrap shrink-0"
                          >
                            <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>View Documents</span>
                          </button>
                        )}
                        <a
                          href={`https://wa.me/${b.listerPhone.replace(/[^0-9]/g, '')}?text=Hello%20regarding%20booking%20${b.bookingRef}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition whitespace-nowrap shrink-0"
                        >
                          <WhatsAppIcon className="w-3.5 h-3.5 fill-white shrink-0" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: RIDES (CITY TO CITY & PICK AND DROP) */}
          {activeTab === 'rides' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Intercity Rides & Commuter Shuttles</h3>
                  <p className="text-xs text-slate-500">Fixed daily routes, office pick & drop passes, and motorway city-to-city rides.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href="/city-to-city"
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                  >
                    🛣️ City to City
                  </Link>
                  <Link
                    href="/shuttles"
                    className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                  >
                    🚌 Pick & Drop
                  </Link>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <span className="text-2xl">🛣️</span>
                  <h4 className="font-bold text-sm text-slate-800">City to City Intercity Rides</h4>
                  <p className="text-xs text-slate-500">
                    Book dedicated or shared rides on Lahore – Islamabad – Peshawar motorways with verified fleet drivers.
                  </p>
                  <Link
                    href="/city-to-city"
                    className="inline-block mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
                  >
                    Explore Intercity Routes
                  </Link>
                </div>

                <div className="p-6 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <span className="text-2xl">🚌</span>
                  <h4 className="font-bold text-sm text-slate-800">Pick & Drop Commuter Passes</h4>
                  <p className="text-xs text-slate-500">
                    Subscribe to monthly office commutes or school routes with reserved seat allocation and chilled AC.
                  </p>
                  <Link
                    href="/shuttles"
                    className="inline-block mt-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold"
                  >
                    Explore Commuter Vans
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: MY HIRED DRIVERS */}
          {activeTab === 'drivers' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Independent Drivers Hired</h3>
                  <p className="text-xs text-slate-500">Chauffeurs hired for your personal or company vehicles.</p>
                </div>
                <Link
                  href="/drivers"
                  className="px-3.5 py-1.5 bg-[#0B6B4F] hover:bg-[#08513C] text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  + Hire Another Driver
                </Link>
              </div>

              {driverBookings.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <User className="w-10 h-10 text-slate-400 mx-auto mb-1" />
                  <h4 className="font-bold text-sm text-slate-800">No Active Chauffeur Bookings</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Need a professional driver for within-city meetings or outstation family trips? Hire verified drivers with 1-tap.
                  </p>
                  <Link
                    href="/drivers"
                    className="inline-block mt-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
                  >
                    Hire a Driver
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {driverBookings.map((b) => {
                    const isConfirmed = b.status === 'CONFIRMED';
                    return (
                      <div
                        key={b.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          isConfirmed
                            ? 'border-emerald-200 bg-white shadow-xs'
                            : 'border-amber-200 bg-amber-50/20'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                {b.bookingRef}
                              </span>
                              <h4 className="font-bold text-sm text-slate-900">{b.driverName}</h4>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  isConfirmed
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {isConfirmed ? '✓ Booking Confirmed by Driver' : '⏳ Awaiting Driver Confirmation'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              Pickup: <strong>{b.startDate}</strong> ({b.days} days) · {b.dutyType} · {b.destination}
                            </p>
                          </div>

                          <div className="text-left sm:text-right">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Fare</span>
                            <span className="text-sm font-extrabold text-[#101828]">
                              PKR {formatPKR(b.totalFare)}
                            </span>
                          </div>
                        </div>

                        {/* Driver Verified Credential Card */}
                        <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                          <div className="flex items-center justify-between flex-wrap gap-1">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                              <ShieldCheck className="w-4 h-4 text-[#0B6B4F]" />
                              <span>Driver Credentials on File</span>
                            </div>
                            {isConfirmed ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                                ✓ Full ID Details Unlocked
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                🔒 Masked (Unlocks on Confirmation)
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            {/* CNIC */}
                            <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between">
                              <div>
                                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                                  CNIC Number (13 Digits)
                                </span>
                                <span className="font-mono text-xs font-extrabold text-slate-900">
                                  {isConfirmed ? b.driverCnic : maskPakistaniCnic(b.driverCnic)}
                                </span>
                              </div>
                              <span className="text-[10px] font-semibold text-slate-500">
                                {isConfirmed ? 'Verified Match' : 'Masked Pattern'}
                              </span>
                            </div>

                            {/* Driving Licence */}
                            <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between">
                              <div>
                                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                                  Driving Licence Number
                                </span>
                                <span className="font-mono text-xs font-extrabold text-slate-900">
                                  {isConfirmed ? b.driverLicense : maskPakistaniLicense(b.driverLicense)}
                                </span>
                              </div>
                              <span className="text-[10px] font-semibold text-slate-500">
                                {isConfirmed ? 'Verified Active' : 'Masked Pattern'}
                              </span>
                            </div>
                          </div>

                          {!isConfirmed && (
                            <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg leading-relaxed">
                              ℹ️ <strong>Privacy Protection:</strong> Driver ID and licence are on file. The complete unmasked numbers ({b.driverCnic.slice(0, 5)}-... & {b.driverLicense.slice(0, 4)}...) will be disclosed to you automatically once the driver reviews and confirms your booking request from their dashboard.
                            </p>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center justify-between gap-2 pt-3 flex-wrap">
                          <div className="flex items-center gap-2">
                            <a
                              href={`https://wa.me/${b.driverPhone.replace(/[^0-9]/g, '')}?text=Assalam-o-Alaikum%20${encodeURIComponent(b.driverName)},%20regarding%20booking%20ref%20${b.bookingRef}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3.5 py-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition whitespace-nowrap shrink-0"
                            >
                              <WhatsAppIcon className="w-3.5 h-3.5 fill-white shrink-0" />
                              <span>WhatsApp</span>
                            </a>
                            <a
                              href={`tel:${b.driverPhone}`}
                              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 rounded-lg text-xs font-bold transition"
                            >
                              Call
                            </a>
                          </div>

                          {!isConfirmed && (
                            <button
                              type="button"
                              onClick={() => {
                                confirmDriverBooking(b.id);
                                setDriverBookings(getDriverBookings());
                              }}
                              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                              title="Test confirmation action"
                            >
                              <span>Simulate Driver Confirmation</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: HOME SHIFTING QUOTES */}
          {activeTab === 'shifting' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <h3 className="font-extrabold text-base text-slate-900">Home & Office Shifting Requests</h3>
              <p className="text-xs text-slate-500">Commercial cargo trucks, moving tonnage, and Mazdoor helper quotes.</p>

              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <Truck className="w-10 h-10 text-slate-400 mx-auto mb-1" />
                <h4 className="font-bold text-sm text-slate-800">No Pending Shifting Inquiries</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Get instant quotes for Shehzore and Ravi pickups with Mazdoor labor helpers across Pakistan.
                </p>
                <Link
                  href="/movers"
                  className="inline-block mt-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold"
                >
                  Request Moving Quote
                </Link>
              </div>
            </div>
          )}

          {/* TAB 6: WISHLIST */}
          {activeTab === 'wishlist' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <h3 className="font-extrabold text-base text-slate-900">Saved Vehicles Wishlist</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {wishlist.map((item) => (
                  <div key={item.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <div className="aspect-[16/10] rounded-xl overflow-hidden bg-slate-200">
                      <img src={item.img} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{item.title}</h4>
                      <p className="text-xs text-slate-500">{item.city} · {item.seats} Seats · {item.transmission}</p>
                      <span className="text-sm font-black text-slate-900 block mt-1">PKR {formatPKR(item.dailyRate)} / day</span>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href="/"
                        className="flex-1 text-center py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-xs"
                      >
                        Book Now
                      </Link>
                      <button
                        onClick={() => setWishlist((prev) => prev.filter((w) => w.id !== item.id))}
                        className="px-3 py-2 bg-white text-rose-600 border border-slate-200 rounded-xl text-xs font-bold"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: LEADS HISTORY */}
          {activeTab === 'leads' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <h3 className="font-extrabold text-base text-slate-900">WhatsApp Inquiries Log</h3>
              <p className="text-xs text-slate-500">Record of all vehicles you contacted directly via WhatsApp.</p>

              <div className="space-y-3">
                {leadsHistory.map((l) => (
                  <div key={l.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{l.vehicleTitle}</h4>
                      <span className="text-[11px] text-slate-500">{l.city} · PKR {formatPKR(l.dailyRate)}/day</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Contacted
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: COMPLAINTS */}
          {activeTab === 'complaints' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Disputes & Complaints Filing</h3>
                <p className="text-xs text-slate-500">
                  If a lister or driver violates platform terms, charges unauthorized fees, or vehicle condition differs from photos.
                </p>
              </div>

              {complaintSuccess && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold">
                  {complaintSuccess}
                </div>
              )}

              <form onSubmit={handleSubmitComplaint} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Subject</label>
                  <input
                    type="text"
                    value={complaintSubject}
                    onChange={(e) => setComplaintSubject(e.target.value)}
                    placeholder="e.g. Vehicle AC was not working and provider refused refund"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Category</label>
                    <select
                      value={complaintCategory}
                      onChange={(e) => setComplaintCategory(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    >
                      <option value="VEHICLE_CONDITION">Vehicle Condition Issue</option>
                      <option value="OVERCHARGING">Overcharging / Token Dispute</option>
                      <option value="MISBEHAVIOR">Lister or Driver Misbehavior</option>
                      <option value="SAFETY_VIOLATION">Safety or Legal Violation</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Booking Reference # (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. BKG-8492"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Detailed Description</label>
                  <textarea
                    rows={4}
                    value={complaintDetails}
                    onChange={(e) => setComplaintDetails(e.target.value)}
                    placeholder="Provide exact incident details, timeline, and provider communication..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs transition cursor-pointer"
                >
                  Submit Dispute Ticket
                </button>
              </form>
            </div>
          )}

          {/* TAB 9: PROFILE & VERIFICATION */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Customer Identity & Legal Credentials</h3>
                <p className="text-xs text-slate-500">
                  Sensitive documents are encrypted. Only masked details are shown by default to safeguard your privacy.
                </p>
              </div>

              {/* Upload Driving License Box */}
              <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Scan className="w-4 h-4 text-amber-700" />
                    <span className="font-bold text-xs text-amber-950">Driving License Upload & OCR Verification</span>
                  </div>
                  {licenseUploadNotice && (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                      {licenseUploadNotice}
                    </span>
                  )}
                </div>

                {!licenseDocPreview ? (
                  <div className="space-y-2">
                    <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-amber-300 hover:border-amber-500 rounded-xl bg-white cursor-pointer transition text-center group">
                      <Upload className="w-6 h-6 text-amber-600 group-hover:scale-110 transition mb-1" />
                      <span className="font-bold text-xs text-amber-950">
                        Upload Driving License (Photo / Scan)
                      </span>
                      <span className="text-[10px] text-slate-500 mt-0.5">
                        Clear photo of your valid Pakistani Driving License (Punjab/Sindh/KP/Islamabad)
                      </span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleCustomerLicenseUpload(f);
                        }}
                      />
                    </label>
                  </div>
                ) : licenseScanning ? (
                  <div className="p-4 bg-white border border-amber-200 rounded-xl text-center space-y-2">
                    <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="font-bold text-xs text-amber-950">Scanning Driving License with OCR...</p>
                    <p className="text-[10px] text-slate-500">Extracting license number and expiration date</p>
                  </div>
                ) : (
                  <div className="p-3 bg-white border border-amber-200 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={licenseDocPreview}
                        alt="License preview"
                        className="w-16 h-11 object-cover rounded-lg border border-slate-200 shadow-2xs"
                      />
                      <div>
                        <span className="font-bold text-xs text-slate-900 block">{licenseFileName}</span>
                        <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Extracted: {customerLicense} · Valid until {customerLicenseExpiry}</span>
                        </span>
                      </div>
                    </div>
                    <label className="text-[11px] font-bold text-amber-800 hover:underline px-2.5 py-1 bg-amber-100 rounded-lg cursor-pointer">
                      <span>Re-upload</span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleCustomerLicenseUpload(f);
                        }}
                      />
                    </label>
                  </div>
                )}
                <p className="text-[10px] text-slate-500">
                  Note: Uploading your driving license satisfies self-drive rental requirements across all listers. You only need to provide your CNIC number without uploading a separate CNIC photo.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Encrypted NADRA CNIC & License Vault
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowFullCnic(!showFullCnic)}
                    className="text-xs font-bold text-emerald-700 hover:underline"
                  >
                    {showFullCnic ? '🔒 Hide Full Details' : '👁️ Reveal Unmasked Details'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-400 block font-semibold">NADRA CNIC Number</span>
                    <span className="font-mono font-bold text-slate-800 text-sm">
                      {showFullCnic ? customerCnic : maskCnic(customerCnic)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block font-semibold">Driving License Number</span>
                    <span className="font-mono font-bold text-slate-800 text-sm">
                      {showFullCnic ? customerLicense : maskLicense(customerLicense)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block font-semibold">License Expiry</span>
                    <span className="font-bold text-slate-800">{customerLicenseExpiry}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block font-semibold">Verification Status</span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                      ✓ Document Audited by Compliance
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 10: SECURITY */}
          {activeTab === 'security' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <h3 className="font-extrabold text-base text-slate-900">Security & Account Settings</h3>
              <p className="text-xs text-slate-500">Manage password, session access, and privacy controls.</p>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 block">Change Account Password</span>
                    <span className="text-[11px] text-slate-400">Last updated 3 months ago</span>
                  </div>
                  <button className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-700">
                    Update Password
                  </button>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 block">Active Device Sessions</span>
                    <span className="text-[11px] text-slate-400">Windows Chrome · Lahore, Pakistan</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Current Session
                  </span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MUTUAL CREDENTIALS VAULT: EXCISE SMART CARD & FLEET OWNER FBR NTN */}
      {selectedSmartCardModal && (() => {
        // Find authentic host record
        const allUsers = getAllRegisteredUsers();
        const modalPhoneClean = (selectedSmartCardModal.listerPhone || '').replace(/[^0-9]/g, '').slice(-10);
        const resolvedLister = allUsers.find(
          (u) =>
            (modalPhoneClean && u.phone && u.phone.replace(/[^0-9]/g, '').slice(-10) === modalPhoneClean) ||
            (selectedSmartCardModal.listerBusinessName &&
              u.businessName &&
              (u.businessName.toLowerCase().includes(selectedSmartCardModal.listerBusinessName.toLowerCase()) ||
                selectedSmartCardModal.listerBusinessName.toLowerCase().includes(u.businessName.toLowerCase())))
        );

        // Find custom vehicles from localStorage if available
        let customVehicles: any[] = [];
        if (typeof window !== 'undefined') {
          try {
            const raw = localStorage.getItem('safarpk_lister_vehicles');
            if (raw) customVehicles = JSON.parse(raw);
          } catch {}
        }

        const resolvedVehicle =
          customVehicles.find(
            (v) =>
              (selectedSmartCardModal.vehicleName && v.name && v.name.toLowerCase() === selectedSmartCardModal.vehicleName.toLowerCase()) ||
              (selectedSmartCardModal.vehicleId && v.id === selectedSmartCardModal.vehicleId)
          ) ||
          CARS_DATA.find((c) => c.name === selectedSmartCardModal.vehicleName);

        const dynamicSmartCardUrl =
          resolvedVehicle?.smartCardUrl ||
          resolvedLister?.carOwnerCardUrl ||
          selectedSmartCardModal.smartCardUrl ||
          null;

        const dynamicRegNumber =
          selectedSmartCardModal.assignedVehicleReg ||
          resolvedVehicle?.regNumber ||
          resolvedLister?.carOwnerCardRegNumber ||
          'Verified Registration';

        const dynamicNtnUrl =
          resolvedLister?.ntnUrl ||
          selectedSmartCardModal.ntnUrl ||
          null;

        const dynamicNtnNumber =
          resolvedLister?.ntnNumber ||
          selectedSmartCardModal.vehicleSmartCard?.taxpayerNtn ||
          null;

        const dynamicBusinessName =
          resolvedLister?.businessName ||
          selectedSmartCardModal.listerBusinessName ||
          'Registered Fleet Host';

        const dynamicPhone =
          resolvedLister?.phone ||
          selectedSmartCardModal.listerPhone ||
          'Direct Host Contact';

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto"
            onClick={() => setSelectedSmartCardModal(null)}
          >
            <div
              className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100 my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <FileText className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">
                      Vehicle Documents & Host Credentials
                    </h3>
                    <span className="text-[10px] text-emerald-700 font-bold block">
                      ✓ Authentic Verified Records · Ready for Inspection
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSmartCardModal(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              {/* Excise Registration Smart Card Section */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                    <Car className="w-4 h-4 text-emerald-600" />
                    <span>Excise & Taxation Vehicle Smart Card</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Govt Verified
                  </span>
                </div>

                {dynamicSmartCardUrl ? (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900">
                    <img
                      src={dynamicSmartCardUrl}
                      alt="Excise Vehicle Smart Card"
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3 justify-between">
                      <div>
                        <span className="text-[10px] text-emerald-300 font-bold uppercase block">Official Smart Card Scan</span>
                        <span className="text-white text-xs font-mono font-bold">{dynamicRegNumber}</span>
                      </div>
                      <a
                        href={dynamicSmartCardUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 bg-white/90 hover:bg-white text-slate-900 rounded-lg text-[11px] font-bold shadow transition flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>View Full Document</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-gradient-to-tr from-slate-900 to-slate-800 text-white rounded-2xl shadow-inner space-y-2.5 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-700 pb-1.5 text-[10px] font-mono">
                      <span className="text-emerald-400 font-bold">EXCISE & TAXATION DEPARTMENT</span>
                      <span className="text-slate-400">SMART CARD REGISTRATION</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase">Registration Mark</span>
                        <span className="text-base font-black tracking-widest text-white font-mono">
                          {dynamicRegNumber}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-slate-400 block uppercase">Excise Status</span>
                        <span className="text-[11px] font-bold text-emerald-400">Verified & Active</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-300 leading-relaxed border-t border-slate-700/60 pt-2 font-sans">
                      Physical Original Document: The original official excise smart card will be verified and physically inspected in person during vehicle handover.
                    </p>
                  </div>
                )}
              </div>

              {/* Fleet Host FBR NTN & Business Credentials */}
              <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-emerald-950 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span>Host FBR & Business Credentials</span>
                  </span>
                  <span className="text-[10px] font-bold bg-white text-emerald-900 px-2 py-0.5 rounded-full border border-emerald-300">
                    ATL Active Taxpayer
                  </span>
                </div>

                {dynamicNtnUrl && (
                  <div className="relative rounded-xl overflow-hidden border border-emerald-300 bg-white p-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-700" />
                      <span className="text-xs font-bold text-slate-800">FBR NTN Certificate Scan</span>
                    </div>
                    <a
                      href={dynamicNtnUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>View NTN Certificate</span>
                    </a>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Business / Host Name:</span>
                    <strong className="text-slate-900">{dynamicBusinessName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">FBR NTN Number:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {dynamicNtnNumber || 'Verified Active Taxpayer'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Direct Verified Contact:</span>
                    <span className="font-mono font-bold text-emerald-800">{dynamicPhone}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Verification Protocol:</span>
                    <span className="font-bold text-emerald-700">SafarPK Verified Host</span>
                  </div>
                </div>
              </div>

              {/* Legal Notice */}
              <p className="text-[10px] text-slate-500 leading-tight">
                * Protected under Pakistan Electronic Crimes Act (PECA 2016) & Electronic Transactions Ordinance (ETO 2002). This credential vault is shared solely under mutual booking consent for physical vehicle handover and road safety.
              </p>

              <button
                type="button"
                onClick={() => setSelectedSmartCardModal(null)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close Documents
              </button>
            </div>
          </div>
        );
      })()}

      {/* Global Mobile Bottom Navigation Bar */}
      <MobileNavBar />
    </div>
  );
}


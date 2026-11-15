'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AppHeader } from '@/components/AppHeader';
import { AppFooter } from '@/components/AppFooter';
import { MobileNavBar } from '@/components/MobileNavBar';
import { recordLead, recordClickEvent } from '@/data/activityTracker';
import { getActiveUser, setActiveUser } from '@/data/userAuth';
import { startOrOpenConversation, getWhatsAppTargetUrl } from '@/data/chatEngine';
import { getStoreSlugForOwner } from '@/data/storefrontEngine';
import { useCountry } from '@/app/context/CountryContext';
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
  Users,
  Fuel,
  Gauge,
  Briefcase,
  X,
} from 'lucide-react';

interface VehicleDetail {
  id: string;
  ref: string;
  title: string;
  category: string;
  year: number;
  city: string;
  area: string;
  dailyRate: number;
  dailyRateWithDriver: number;
  transmission: string;
  fuelType: string;
  seats: number;
  bags: string;
  hostName: string;
  hostPhone: string;
  hostWhatsapp: string;
  deposit: number;
  features: string[];
  description: string;
  images: string[];
}

const VEHICLE_CATALOG: Record<string, VehicleDetail> = {
  'l-1': {
    id: 'l-1',
    ref: 'LST-480853',
    title: 'Honda Civic Oriel Turbo 2024',
    category: 'Sedan',
    year: 2024,
    city: 'Islamabad',
    area: 'Centaurus Mall, F-8',
    dailyRate: 14000,
    dailyRateWithDriver: 16500,
    transmission: 'Automatic',
    fuelType: 'Petrol',
    seats: 5,
    bags: '2 large bags',
    hostName: 'Kashif Motors Islamabad',
    hostPhone: '+92 300 1234567',
    hostWhatsapp: '923001234567',
    deposit: 30000,
    features: [
      'Dual Zone Climate Control AC',
      'Sunroof & Cruise Control',
      'Front & Rear Dashcam',
      'Infotainment with Apple CarPlay',
      'Comprehensive Insurance Included',
      'First Aid & Puncture Repair Kit',
    ],
    description:
      'Well kept 2024 Civic Oriel Turbo, serviced exclusively at authorized dealership every 5,000 km. Comes with full fuel tank, pristine leather interior and child seat on advance request. Strict non-smoking policy inside the vehicle.',
    images: [
      'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  'l-2': {
    id: 'l-2',
    ref: 'LST-065123',
    title: 'Toyota Corolla Altis Grande 1.8 2024',
    category: 'Sedan',
    year: 2024,
    city: 'Lahore',
    area: 'Gulberg III, Main Boulevard',
    dailyRate: 11000,
    dailyRateWithDriver: 13500,
    transmission: 'Automatic',
    fuelType: 'Petrol',
    seats: 5,
    bags: '3 large bags',
    hostName: 'Lahore Premier Car Rentals',
    hostPhone: '+92 321 4455667',
    hostWhatsapp: '923214455667',
    deposit: 25000,
    features: [
      'Automatic Climate Control',
      'Paddle Shifters',
      'Rear Camera & Parking Sensors',
      'Alloy Rims & Brand New Tyres',
      'Motorway M-2 Tag Active',
    ],
    description:
      'Executive family sedan in immaculate condition. Clean exterior and interior, regularly sanitized. Ideal for city corporate use or Lahore-Islamabad motorway travels.',
    images: [
      'https://images.unsplash.com/photo-1623869675781-80aa31012a5a?auto=format&fit=crop&w=1200&q=80',
    ],
  },
};

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const listingId = (params?.id as string) || 'l-1';

  const [car, setCar] = useState<VehicleDetail>(
    VEHICLE_CATALOG[listingId] || VEHICLE_CATALOG['l-1']
  );

  const [withDriver, setWithDriver] = useState(false);
  const [hostPhoneRevealed, setHostPhoneRevealed] = useState(false);

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
  const { country } = useCountry();
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

  const formatPKR = (v: number) => `PKR ${v.toLocaleString('en-US')}`;

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
    const pickStr = formatDisplayDate(pickupDate);
    const retStr = formatDisplayDate(returnDate);
    const msg = `Assalam-o-Alaikum ${car.hostName}! I saw your "${car.title}" on SafarPK. I want to inquire about availability and rates for ${pickStr} to ${retStr} (${daysCount} days, ${withDriver ? 'with chauffeur' : 'self-drive'}).`;
    const cleanNum = car.hostPhone.replace(/\D/g, '');
    const url = getWhatsAppTargetUrl(cleanNum, msg);
    window.open(url, '_blank');
  };

  const handleSendWhatsAppRequest = () => {
    if (!customerName.trim()) {
      setValidationError('Please enter your full name');
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

    // Record lead event (24h unique deduplication)
    recordLead({
      listingId: car.id,
      listingTitle: car.title,
      listerPhone: car.hostPhone,
      type: 'BOOKING_REQUEST',
    });
    recordClickEvent(car.id, 'WHATSAPP');

    const bookingRef = `SF-${Math.floor(10000 + Math.random() * 90000)}`;

    const docLines: string[] = [];
    if (!withDriver) {
      if (cnicNumber.trim() && effectiveIdReq !== 'Off') {
        docLines.push(`• ${idDocTitle}: ${cnicNumber}`);
      }
      if (ocrLicenceNumber.trim() && effectiveLicenceReq !== 'Off') {
        docLines.push(`• ${licenceDocTitle}: ${ocrLicenceNumber}${licenceUploaded ? ' (Verified)' : ''}`);
      }
    }

    const pickFormatted = formatDisplayDate(pickupDate);
    const returnFormatted = formatDisplayDate(returnDate);

    const rawMessageText = `Assalam-o-Alaikum ${car.hostName},\n\nI want to book *${car.title}* via SafarPK (Ref: *${bookingRef}*).\n\n• Option: ${
      withDriver ? 'With Chauffeur' : 'Self-Drive'
    }\n• Dates: ${pickFormatted} to ${returnFormatted} (${daysCount} days)\n• Estimated Total: ${formatPKR(
      calculateTotal()
    )}\n• Customer: ${customerName} (${customerPhone})\n${
      docLines.length > 0 ? docLines.join('\n') + '\n' : ''
    }${customerNote ? `• Note: ${customerNote}\n` : ''}\nPlease confirm availability.`;

    const totalCostStr = formatPKR(calculateTotal());
    const durationStr = `${daysCount} ${daysCount === 1 ? 'day' : 'days'}`;
    const serviceModeStr = withDriver ? 'With Professional Chauffeur' : 'Self-Drive';

    // Sync with In-App Chat Inbox
    try {
      const activeU = getActiveUser() || {
        id: 'usr-customer-active',
        name: customerName.trim(),
        phone: customerPhone.trim(),
        city: car.city,
        countryCode: 'PK',
        role: 'CUSTOMER' as const,
        registeredAt: new Date().toISOString(),
        subscription: { status: 'UNSUBSCRIBED' as const, quota: 0, usedQuota: 0 },
        metrics: { viewCount: 0, leadsCount: 0, clickCount: 0, lastActive: new Date().toISOString() },
        activities: [],
      };

      startOrOpenConversation({
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

    // Persist booking to backend database via REST API
    if (typeof window !== 'undefined') {
      fetch('http://localhost:3001/api/v1/bookings', {
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
          totalAmount: calculateTotal(),
        }),
      }).catch(() => {});

      fetch('http://localhost:3001/api/v1/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'whatsapp_click',
          listingId: car.id,
          serviceType: 'CAR_RENTAL',
          customerId: getActiveUser()?.id,
          metadata: { bookingRef, durationDays: daysCount, withDriver },
        }),
      }).catch(() => {});
    }

    // Platform-aware WhatsApp URL (Web on desktop PC, App on mobile)
    const targetWhatsAppUrl = getWhatsAppTargetUrl(car.hostWhatsapp || car.hostPhone, rawMessageText);
    window.open(targetWhatsAppUrl, '_blank');

    router.push(
      `/request-sent?ref=${bookingRef}&name=${encodeURIComponent(
        car.hostName
      )}&car=${encodeURIComponent(car.title)}&rate=${encodeURIComponent(
        formatPKR(calculateTotal())
      )}&option=${withDriver ? 'With driver' : 'Self-drive'}`
    );
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
            <span className="absolute left-4 bottom-4 text-xs font-bold text-[#667085] bg-white/95 px-3 py-1 rounded-md shadow-xs">
              Exterior Photo
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
              </div>
              <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-[#101828] tracking-tight">
                {car.title}
              </h1>
              <p className="text-[#475467] text-sm sm:text-base flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#0B6B4F]" />
                <span>
                  {car.city} · {car.area} (pick-up at fleet office or delivery)
                </span>
              </p>
            </div>

            {/* Technical Specifications */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 border border-[#EEF0F2] rounded-2xl flex flex-col gap-1.5">
                <Users className="w-5 h-5 text-[#0B6B4F]" />
                <span className="text-xs text-[#667085]">Seats</span>
                <span className="font-heading font-bold text-sm text-[#101828]">
                  {car.seats} Passengers
                </span>
              </div>
              <div className="p-4 border border-[#EEF0F2] rounded-2xl flex flex-col gap-1.5">
                <Gauge className="w-5 h-5 text-[#0B6B4F]" />
                <span className="text-xs text-[#667085]">Transmission</span>
                <span className="font-heading font-bold text-sm text-[#101828]">
                  {car.transmission}
                </span>
              </div>
              <div className="p-4 border border-[#EEF0F2] rounded-2xl flex flex-col gap-1.5">
                <Fuel className="w-5 h-5 text-[#0B6B4F]" />
                <span className="text-xs text-[#667085]">Fuel</span>
                <span className="font-heading font-bold text-sm text-[#101828]">
                  {car.fuelType}
                </span>
              </div>
              <div className="p-4 border border-[#EEF0F2] rounded-2xl flex flex-col gap-1.5">
                <Briefcase className="w-5 h-5 text-[#0B6B4F]" />
                <span className="text-xs text-[#667085]">Luggage</span>
                <span className="font-heading font-bold text-sm text-[#101828]">
                  {car.bags}
                </span>
              </div>
            </div>

            {/* Host Identity Section - Links to Public Storefront */}
            <Link
              href={`/store/${getStoreSlugForOwner(car.hostName)}`}
              className="p-5 rounded-2xl bg-[#F7F8FA] hover:bg-slate-100/90 flex items-center gap-4 border border-[#EEF0F2] hover:border-slate-300 transition group cursor-pointer"
              title={`View ${car.hostName}'s Public Storefront`}
            >
              <div className="w-14 h-14 rounded-full bg-slate-900 text-white flex items-center justify-center font-heading font-extrabold text-xl shrink-0 group-hover:scale-105 transition">
                {car.hostName.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-heading font-extrabold text-base text-[#101828] group-hover:text-emerald-700 transition truncate">
                    Hosted by {car.hostName}
                  </h3>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100/70 text-emerald-800 text-[10px] font-bold">
                    View Store ➔
                  </span>
                </div>
                <p className="text-xs text-[#475467] truncate">
                  Direct independent fleet host · Review vehicle & documentation in person at handover
                </p>
              </div>
              <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-white text-slate-700 text-xs font-bold border border-slate-200 shadow-2xs group-hover:border-slate-300">
                Direct Host
              </span>
            </Link>

            {/* About this car */}
            <div className="pt-4 border-t border-[#EEF0F2] flex flex-col gap-3">
              <h2 className="font-heading font-bold text-xl text-[#101828]">
                About this car
              </h2>
              <p className="text-[#344054] text-sm sm:text-base leading-relaxed">
                {car.description}
              </p>
            </div>

            {/* Features */}
            <div className="pt-4 border-t border-[#EEF0F2] flex flex-col gap-3">
              <h2 className="font-heading font-bold text-xl text-[#101828]">
                Vehicle features & inclusions
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-[#344054]">
                {car.features.map((f) => (
                  <div key={f} className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#0B6B4F] shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Things to know */}
            <div className="pt-4 border-t border-[#EEF0F2] flex flex-col gap-4">
              <h2 className="font-heading font-bold text-xl text-[#101828]">
                Rental guidelines & policies
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm text-[#475467] leading-relaxed">
                <div>
                  <strong className="block text-[#101828] font-bold mb-1">
                    Identification
                  </strong>
                  Valid original CNIC/Passport and Driving Licence mandatory at pick-up.
                </div>
                <div>
                  <strong className="block text-[#101828] font-bold mb-1">
                    Fuel & Mileage
                  </strong>
                  Return at same fuel level. 200 km per day included, then Rs. 25/km.
                </div>
                <div>
                  <strong className="block text-[#101828] font-bold mb-1">
                    Direct Payment
                  </strong>
                  Pay 100% of rental fee to the owner directly upon vehicle delivery.
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Sleek, Minimalist Booking Card */}
          <aside className="sticky top-24 border border-slate-200/90 rounded-3xl p-5 sm:p-6 bg-white shadow-lg flex flex-col gap-3.5 transition-all">
            {/* Price & Status Row */}
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block">Daily Rate</span>
                <div className="flex items-baseline gap-1">
                  <span className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900">
                    {formatPKR(withDriver ? car.dailyRateWithDriver : car.dailyRate)}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">/ day</span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                Direct Host
              </span>
            </div>

            {/* Compact Dates Picker with Real Calendar Trigger & Past Dates Disabled */}
            <div className="p-2 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-2">
              <div
                onClick={() => {
                  try {
                    pickupInputRef.current?.showPicker();
                  } catch {
                    pickupInputRef.current?.focus();
                  }
                }}
                className="flex-1 flex flex-col px-3 py-2 bg-white rounded-xl border border-slate-200/80 hover:border-emerald-500 cursor-pointer shadow-2xs transition group"
                title="Click to select Pick-up Date from calendar"
              >
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[9px] font-black tracking-wider uppercase group-hover:text-emerald-700 transition">Pick-up</span>
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
                  className="w-full bg-transparent font-bold text-xs sm:text-sm text-slate-900 cursor-pointer outline-none mt-0.5"
                  aria-label="Pick-up Date"
                />
              </div>

              <div className="flex flex-col items-center justify-center shrink-0 px-1">
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-100/70 text-emerald-800 font-mono">
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
                className="flex-1 flex flex-col px-3 py-2 bg-white rounded-xl border border-slate-200/80 hover:border-emerald-500 cursor-pointer shadow-2xs transition group"
                title="Click to select Return Date from calendar"
              >
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[9px] font-black tracking-wider uppercase group-hover:text-emerald-700 transition">Return</span>
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
                  className="w-full bg-transparent font-bold text-xs sm:text-sm text-slate-900 cursor-pointer outline-none mt-0.5"
                  aria-label="Return Date"
                />
              </div>
            </div>

            {/* Self-Drive vs Chauffeur Selector */}
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
                <span>With driver</span>
                <span className="text-[10px] text-emerald-700 font-normal">(+2.5k)</span>
              </button>
            </div>

            {/* Minimalist Price & Deposit Summary */}
            <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Estimated Total ({daysCount} days):</span>
              <span className="font-heading font-extrabold text-sm text-slate-900">{formatPKR(calculateTotal())}</span>
            </div>

            {/* Primary Action Buttons (Instant Call & WhatsApp without login) */}
            <div className="flex flex-col gap-2 pt-1">
              {/* WhatsApp Instant 1-Click Chat */}
              <button
                type="button"
                onClick={handleInstantWhatsAppChat}
                className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-heading font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-sm hover:shadow active:scale-[0.99]"
              >
                <MessageSquare className="w-4 h-4 fill-white/20" />
                <span>Chat on WhatsApp (Direct)</span>
              </button>

              {/* Call Host Button with Purple Styling from Reference Image */}
              <button
                type="button"
                onClick={handleDirectHostCall}
                className="w-full h-10 rounded-xl border border-purple-200 bg-purple-50/70 hover:bg-purple-100 text-purple-900 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs active:scale-[0.99]"
                title={hostPhoneRevealed ? `Call host: ${car.hostPhone}` : 'Click to show phone number'}
              >
                <Phone className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span>{hostPhoneRevealed ? `Call Host: ${car.hostPhone}` : 'Show Phone Number'}</span>
              </button>

              {/* In-App Chat & Formal Voucher Options */}
              <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-bold flex items-center justify-center transition cursor-pointer"
                >
                  <span>Formal Voucher</span>
                </button>

              <button
                type="button"
                onClick={() => {
                  const bRef = `SF-${Math.floor(10000 + Math.random() * 90000)}`;
                  const totalCostStr = formatPKR(calculateTotal());
                  const durationStr = `${daysCount} ${daysCount === 1 ? 'day' : 'days'}`;
                  const serviceModeStr = withDriver ? 'With Professional Chauffeur' : 'Self-Drive';

                  const u = getActiveUser() || {
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

                  try {
                    localStorage.setItem(
                      'safarpk_saved_customer_info',
                      JSON.stringify({
                        name: customerName.trim() || u.name,
                        phone: customerPhone.trim() || u.phone,
                        cnic: cnicNumber,
                        licence: ocrLicenceNumber,
                        licenceExpiry: ocrExpiry,
                      })
                    );
                    if (getActiveUser()) {
                      const curU = getActiveUser()!;
                      curU.name = customerName.trim() || curU.name;
                      curU.phone = customerPhone.trim() || curU.phone;
                      setActiveUser(curU);
                    }
                  } catch (e) {}

                  const convId = startOrOpenConversation({
                    currentUser: u,
                    partnerId: 'usr-demo-lister',
                    partnerName: car.hostName,
                    partnerRole: 'LISTER',
                    partnerPhone: car.hostPhone,
                    about: `${car.title} · ${serviceModeStr}`,
                    bookingRef: bRef,
                    bookingMetadata: {
                      category: 'rent_a_car',
                      customerName: customerName.trim() || u.name,
                      customerPhone: customerPhone.trim() || u.phone,
                      customerCity: car.city,
                      providerName: car.hostName,
                      providerManager: `${car.hostName} Fleet Reservation`,
                      providerPhone: car.hostPhone,
                      itemName: car.title,
                      pickupDate: formatDisplayDate(pickupDate),
                      returnDate: formatDisplayDate(returnDate),
                      duration: durationStr,
                      totalEstimate: totalCostStr,
                      serviceMode: serviceModeStr,
                      bookingRef: bRef,
                    },
                  });
                  router.push(`/inbox?conv=${convId}`);
                }}
                className="h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-bold flex items-center justify-center gap-1 transition cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#0B6B4F]" />
                <span>In-App Inbox</span>
              </button>
            </div>
          </div>

            {/* Single Trust Badge Line */}
            <div className="flex items-center justify-center gap-1 text-[11px] text-slate-500 text-center pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Direct booking with host · Settle payment & inspect vehicle at handover</span>
            </div>
          </aside>

          {/* Quick Booking Modal (Clean, Non-Intrusive Drawer / Dialog) */}
          {step === 1 && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
              <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-heading font-extrabold text-base text-slate-900">Confirm Booking Details</h3>
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
                    <span className="text-xs font-bold text-slate-700">WhatsApp Phone Number *</span>
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
                    onClick={handleSendWhatsAppRequest}
                    className="w-full h-11 rounded-xl bg-[#0B6B4F] hover:bg-[#08513C] text-white font-heading font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Confirm & Send on WhatsApp</span>
                  </button>
                  <p className="text-[11px] text-slate-400 text-center">
                    Pay directly to host at pick-up · Direct host transaction
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Floating Sticky Booking Bar for Mobile (Instant Call & WhatsApp without login) */}
      <div className="lg:hidden fixed bottom-14 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2 flex items-center justify-between shadow-lg">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="font-heading font-extrabold text-sm text-slate-900">
              {formatPKR(withDriver ? car.dailyRateWithDriver : car.dailyRate)}
            </span>
            <span className="text-[10px] text-slate-500">/day</span>
          </div>
          <span className="text-[10px] font-bold text-[#0B6B4F] block">
            {daysCount}d · {formatPKR(calculateTotal())}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleDirectHostCall}
            className="h-9 px-2.5 rounded-xl border border-purple-200 bg-purple-50 text-purple-950 text-xs font-bold flex items-center gap-1 shadow-2xs active:scale-95 transition"
            title={hostPhoneRevealed ? `Call host directly: ${car.hostPhone}` : 'Click to show phone number'}
          >
            <Phone className="w-3.5 h-3.5 text-purple-600" />
            <span className="font-mono text-[11px] font-bold">
              {hostPhoneRevealed ? car.hostPhone : 'Show Number'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleInstantWhatsAppChat}
            className="h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-heading font-extrabold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition"
          >
            <MessageSquare className="w-3.5 h-3.5 fill-white/20" />
            <span>WhatsApp</span>
          </button>
        </div>
      </div>

      <AppFooter />
      <MobileNavBar />
    </div>
  );
}

'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AppHeader } from '@/components/AppHeader';
import { AppFooter } from '@/components/AppFooter';
import { MobileNavBar } from '@/components/MobileNavBar';
import {
  getStoreDataBySlug,
  StoreData,
  slugify,
} from '@/data/storefrontEngine';
import { recordClickEvent, recordLead } from '@/data/activityTracker';
import { getWhatsAppTargetUrl } from '@/data/chatEngine';
import { useCountry } from '@/app/context/CountryContext';
import { WhatsAppIcon } from '@/components/WhatsAppIcon';
import {
  MapPin,
  Phone,
  MessageSquare,
  Share2,
  Copy,
  Check,
  CheckCircle2,
  Calendar,
  Car,
  Truck,
  Bus,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Star,
  Users,
} from 'lucide-react';

export default function StorefrontPage() {
  const params = useParams();
  const router = useRouter();
  const slug = (params?.slug as string) || '';
  const { formatPrice } = useCountry();

  const store: StoreData | null = useMemo(() => {
    return getStoreDataBySlug(slug);
  }, [slug]);

  const [copiedLink, setCopiedLink] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [headerPhoneRevealed, setHeaderPhoneRevealed] = useState(false);
  const [revealedPhones, setRevealedPhones] = useState<Record<string, boolean>>({});

  const handleRevealAndCall = (targetId: string, phone: string, title?: string, category: string = 'STOREFRONT') => {
    recordClickEvent({
      clickType: 'CALL_CLICK',
      targetId,
      targetTitle: title || store?.name || 'Listing',
      targetCategory: category,
      targetOwnerName: store?.name || 'Host',
      city: store?.city || 'Pakistan',
    });
    recordLead({
      userId: targetId,
      customerName: 'Storefront Visitor',
      customerPhone: 'Direct Phone Dial',
      customerCity: store?.city || 'Pakistan',
      serviceType: category,
      notes: `Direct call to ${title || store?.name} (${phone})`,
    });

    const isAlreadyRevealed = !!revealedPhones[targetId];
    setRevealedPhones((prev) => ({ ...prev, [targetId]: true }));

    if (isAlreadyRevealed || (typeof window !== 'undefined' && window.innerWidth < 768)) {
      window.location.href = `tel:${phone.replace(/[^0-9+]/g, '')}`;
    }
  };

  if (!store) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans">
        <AppHeader />
        <main className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center mx-auto text-2xl font-bold">
            🏪
          </div>
          <h1 className="font-heading font-extrabold text-2xl text-slate-900">
            Storefront Not Found
          </h1>
          <p className="text-sm text-slate-600">
            The store link you followed does not exist or has been updated.
          </p>
          <Link
            href="/"
            className="inline-block px-5 py-2.5 bg-[#0B6B4F] text-white rounded-xl font-bold text-xs"
          >
            Explore Marketplace
          </Link>
        </main>
        <AppFooter />
        <MobileNavBar />
      </div>
    );
  }

  const currentStoreUrl = typeof window !== 'undefined' ? window.location.href : `https://safar.pk/store/${store.slug}`;

  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(currentStoreUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (e) {}
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Check out ${store.name} on SafarPK! View their complete active fleet & service listings here: ${currentStoreUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleDirectCall = () => {
    recordClickEvent({
      clickType: 'CALL_CLICK',
      targetId: store.id,
      targetTitle: store.name,
      targetCategory: 'STOREFRONT',
      targetOwnerName: store.name,
      city: store.city,
    });
    recordLead({
      userId: store.id,
      customerName: 'Storefront Visitor',
      customerPhone: 'Direct Phone Dial',
      customerCity: store.city,
      serviceType: 'Storefront',
      notes: `Direct call to store ${store.name}`,
    });
    const isAlreadyRevealed = headerPhoneRevealed;
    setHeaderPhoneRevealed(true);
    if (isAlreadyRevealed || (typeof window !== 'undefined' && window.innerWidth < 768)) {
      window.location.href = `tel:${store.phone.replace(/[^0-9+]/g, '')}`;
    }
  };

  const handleDirectWhatsApp = () => {
    recordClickEvent({
      clickType: 'WHATSAPP_CLICK',
      targetId: store.id,
      targetTitle: store.name,
      targetCategory: 'STOREFRONT',
      targetOwnerName: store.name,
      city: store.city,
    });
    recordLead({
      userId: store.id,
      customerName: 'Storefront Visitor',
      customerPhone: 'WhatsApp Inquiry',
      customerCity: store.city,
      serviceType: 'Storefront',
      notes: `Direct WhatsApp message from store ${store.name}`,
    });
    const cleanNum = store.whatsapp.replace(/\D/g, '');
    const msg = `Assalam-o-Alaikum ${store.name}! I visited your official Store on SafarPK. I want to inquire about your active listings and availability.`;
    const targetUrl = getWhatsAppTargetUrl(cleanNum, msg);
    window.open(targetUrl, '_blank');
  };

  const handleCarItemWhatsApp = (car: any) => {
    if (!store) return;
    recordClickEvent({
      clickType: 'WHATSAPP_CLICK',
      targetId: car.id,
      targetTitle: car.name,
      targetCategory: 'CAR_RENTAL',
      targetOwnerName: store.name,
      city: store.city,
    });
    recordLead({
      listingId: car.id,
      listingTitle: car.name,
      listerPhone: store.phone,
      customerCity: store.city,
      type: 'WHATSAPP',
      notes: `Car rental WhatsApp inquiry for ${car.name}`,
    });
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://safar.pk';
    const listingUrl = `${origin}/listing/${car.id}`;
    const dayRate = formatPrice(car.priceNum);
    const weekRate = formatPrice(Math.round(car.priceNum * 6.5));
    const monthRate = formatPrice(Math.round(car.priceNum * 24));
    const msg = `Hi, I would like to rent this car listed by ${store.name} on SafarPK: Car: ${car.name} (${car.specs}) Price: ${dayRate}/day or ${weekRate}/week or ${monthRate}/month Listing: ${listingUrl}`;
    const cleanNum = (store.whatsapp || store.phone).replace(/\D/g, '');
    const targetUrl = getWhatsAppTargetUrl(cleanNum, msg);
    window.open(targetUrl, '_blank');
  };

  const handleRideItemWhatsApp = (ride: any) => {
    if (!store) return;
    recordClickEvent({
      clickType: 'WHATSAPP_CLICK',
      targetId: ride.id,
      targetTitle: `${ride.fromCity} to ${ride.toCity}`,
      targetCategory: 'CITY_TO_CITY',
      targetOwnerName: store.name,
      city: ride.fromCity,
    });
    recordLead({
      listingId: ride.id,
      listingTitle: `${ride.fromCity} to ${ride.toCity}`,
      listerPhone: ride.phone || store.phone,
      customerCity: ride.fromCity,
      type: 'WHATSAPP',
      notes: `City to city route inquiry`,
    });
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://safar.pk';
    const routeUrl = `${origin}/city-to-city/${ride.id}`;
    const msg = `Hi, I would like to book a ride with ${store.name} on SafarPK: Route: ${ride.fromCity} to ${ride.toCity} Vehicle: ${ride.car} Rates: One-Way: ${formatPrice(ride.one)} | Return: ${formatPrice(ride.ret)} Route Details: ${routeUrl}`;
    const cleanNum = (ride.whatsapp || ride.phone || store.phone).replace(/\D/g, '');
    const targetUrl = getWhatsAppTargetUrl(cleanNum, msg);
    window.open(targetUrl, '_blank');
  };

  const handleShuttleItemWhatsApp = (shuttle: any) => {
    if (!store) return;
    recordClickEvent({
      clickType: 'WHATSAPP_CLICK',
      targetId: shuttle.id,
      targetTitle: `${shuttle.from} to ${shuttle.to}`,
      targetCategory: 'PICK_AND_DROP',
      targetOwnerName: store.name,
      city: store.city,
    });
    recordLead({
      listingId: shuttle.id,
      listingTitle: `${shuttle.from} to ${shuttle.to}`,
      listerPhone: shuttle.phone || store.phone,
      customerCity: store.city,
      type: 'WHATSAPP',
      notes: `Shuttle commuter route inquiry`,
    });
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://safar.pk';
    const shuttleUrl = `${origin}/shuttles/${shuttle.id}`;
    const msg = `Hi, I would like to reserve a monthly seat with ${store.name} on SafarPK: Route: ${shuttle.from} to ${shuttle.to} Vehicle: ${shuttle.van} Monthly Fare: ${shuttle.fare} Timing: ${shuttle.timing} Route Details: ${shuttleUrl}`;
    const cleanNum = (shuttle.whatsapp || shuttle.phone || store.phone).replace(/\D/g, '');
    const targetUrl = getWhatsAppTargetUrl(cleanNum, msg);
    window.open(targetUrl, '_blank');
  };

  const handleMoverItemWhatsApp = (mover: any) => {
    if (!store) return;
    recordClickEvent({
      clickType: 'WHATSAPP_CLICK',
      targetId: mover.id,
      targetTitle: mover.name,
      targetCategory: 'HOME_SHIFTING',
      targetOwnerName: store.name,
      city: store.city,
    });
    recordLead({
      listingId: mover.id,
      listingTitle: mover.name,
      listerPhone: mover.phone || store.phone,
      customerCity: store.city,
      type: 'WHATSAPP',
      notes: `Mover and cargo logistics inquiry`,
    });
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://safar.pk';
    const moverUrl = `${origin}/movers/${mover.id}`;
    const msg = `Hi, I would like to hire cargo shifting logistics with ${store.name} on SafarPK: Category: ${mover.category} Truck: ${mover.trucks} Rates: Base: ${mover.base} | Per KM: ${mover.km} | Helper: ${mover.helper} Details: ${moverUrl}`;
    const cleanNum = (mover.whatsapp || mover.phone || store.phone).replace(/\D/g, '');
    const targetUrl = getWhatsAppTargetUrl(cleanNum, msg);
    window.open(targetUrl, '_blank');
  };

  const cars = store.listings.cars;
  const rides = store.listings.rides;
  const shuttles = store.listings.shuttles;
  const movers = store.listings.movers;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans text-slate-800">
      <AppHeader />

      <main className="flex-1 pb-16">
        {/* Store Banner */}
        <div className="relative h-48 sm:h-64 bg-slate-900 overflow-hidden">
          <img
            src={store.bannerImage}
            alt={store.name}
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        </div>

        {/* Store Profile Card Header */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-16 sm:-mt-20 relative z-10">
          <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-xl border border-slate-200/90 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4 sm:gap-5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-emerald-800 text-white flex items-center justify-center font-heading font-black text-2xl sm:text-3xl shadow-md shrink-0 border-2 border-white">
                {store.logoText}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-heading font-extrabold text-xl sm:text-2xl text-slate-900">
                    {store.name}
                  </h1>
                  {store.primaryService === 'RENT_A_CAR' && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold flex items-center gap-1">
                      <Car className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Rent a Car Fleet</span>
                    </span>
                  )}
                  {store.primaryService === 'CITY_TO_CITY' && (
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-[11px] font-bold flex items-center gap-1">
                      <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
                      <span>City to City Operator</span>
                    </span>
                  )}
                  {store.primaryService === 'PICK_AND_DROP' && (
                    <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-[11px] font-bold flex items-center gap-1">
                      <Bus className="w-3.5 h-3.5 text-teal-600" />
                      <span>Pick & Drop Provider</span>
                    </span>
                  )}
                  {store.primaryService === 'HOME_SHIFTING' && (
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200 text-[11px] font-bold flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-purple-600" />
                      <span>Home Shifting Fleet</span>
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#0B6B4F]" />
                    <span>{store.city}, Pakistan</span>
                  </span>
                  <span>·</span>
                  <span>Member since {store.memberSince}</span>
                  <span>·</span>
                  <span className="font-bold text-slate-800">{store.totalListingsCount} Active Listings</span>
                </div>
              </div>
            </div>

            {/* Direct Contact Bar & Share */}
            <div className="flex flex-wrap items-center gap-2.5 self-stretch sm:self-auto shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDirectCall();
                }}
                className="flex-1 sm:flex-initial h-10 px-4 rounded-xl border border-purple-200 bg-purple-50/70 hover:bg-purple-100 text-purple-900 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs active:scale-95"
                title={headerPhoneRevealed ? `Call ${store.name} (${store.phone})` : 'Click to show phone number'}
              >
                <Phone className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span className="font-mono text-xs font-bold">
                  {headerPhoneRevealed ? store.phone : 'Show Phone Number'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleDirectWhatsApp}
                className="flex-1 sm:flex-initial h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm"
              >
                <MessageSquare className="w-3.5 h-3.5 fill-white/20" />
                <span>Direct WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => setShowShareModal(true)}
                className="h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer"
                title="Share Store Link"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Share</span>
              </button>
            </div>
          </div>

          {/* About / Store Description */}
          {store.about && (
            <div className="mt-4 p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-600 leading-relaxed shadow-2xs">
              <strong className="text-slate-900 block font-bold mb-1">About {store.name}</strong>
              <p>{store.about}</p>
            </div>
          )}

          {/* Strictly Isolated Service Header (One service per provider) */}
          <div className="mt-8 flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="font-heading font-extrabold text-lg sm:text-xl text-slate-900 flex items-center gap-2">
                {store.primaryService === 'RENT_A_CAR' && <Car className="w-5 h-5 text-emerald-600" />}
                {store.primaryService === 'CITY_TO_CITY' && <ArrowRight className="w-5 h-5 text-blue-600" />}
                {store.primaryService === 'PICK_AND_DROP' && <Bus className="w-5 h-5 text-teal-600" />}
                {store.primaryService === 'HOME_SHIFTING' && <Truck className="w-5 h-5 text-purple-600" />}
                <span>
                  {store.primaryService === 'RENT_A_CAR' && `Rental Vehicles Fleet (${cars.length})`}
                  {store.primaryService === 'CITY_TO_CITY' && `Intercity Routes (${rides.length})`}
                  {store.primaryService === 'PICK_AND_DROP' && `Commuter Shuttles (${shuttles.length})`}
                  {store.primaryService === 'HOME_SHIFTING' && `Moving & Cargo Services (${movers.length})`}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Direct fleet and service listings managed by {store.name}
              </p>
            </div>
            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              {store.totalListingsCount} Active {store.totalListingsCount === 1 ? 'Listing' : 'Listings'}
            </span>
          </div>

          {/* Listings Grid */}
          <div className="mt-6 space-y-10">
            {/* 1. CARS */}
            {store.primaryService === 'RENT_A_CAR' && cars.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h3 className="font-heading font-extrabold text-lg text-slate-900 flex items-center gap-2">
                    <Car className="w-4 h-4 text-emerald-600" />
                    <span>Rental Vehicles Fleet ({cars.length})</span>
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {cars.map((car) => (
                    <div
                      key={car.id}
                      className="bg-white rounded-3xl p-3 border border-slate-200/90 hover:shadow-lg transition flex flex-col justify-between group"
                    >
                      <div>
                        <Link
                          href={`/listing/${car.id}`}
                          className="relative block aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100"
                        >
                          <img
                            src={car.image}
                            alt={car.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                          <span className="absolute top-3 left-3 bg-white/95 px-2.5 py-1 rounded-full text-xs font-bold text-slate-900 shadow-xs">
                            {car.city}
                          </span>
                        </Link>

                        <div className="p-2 space-y-1">
                          <Link href={`/listing/${car.id}`} className="block">
                            <div className="flex justify-between items-baseline gap-2">
                              <h4 className="font-heading font-extrabold text-base text-slate-900 truncate">
                                {car.name}
                              </h4>
                              <span className="text-xs text-slate-500 whitespace-nowrap">
                                <strong className="text-sm font-extrabold text-slate-900">
                                  {formatPrice(car.priceNum)}
                                </strong>{' '}
                                /day
                              </span>
                            </div>
                            <p className="text-xs text-slate-500">{car.specs}</p>
                          </Link>
                        </div>
                      </div>

                      {/* Unified Single-Row Responsive CTA Action Bar */}
                      <div className="flex items-center gap-1.5 sm:gap-2 pt-2.5 px-1 border-t border-slate-100 mt-1" onClick={(e) => e.stopPropagation()}>
                        {/* 1. Phone Call CTA */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRevealAndCall(car.id, store.phone, car.name, 'Car Rental');
                          }}
                          className="h-9 px-2.5 sm:px-3 rounded-xl border border-purple-200/90 bg-purple-50/70 hover:bg-purple-100 text-purple-900 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs active:scale-95 shrink-0"
                          title={revealedPhones[car.id] ? `Call ${store.phone}` : 'Click to show phone number'}
                        >
                          <Phone className="w-3.5 h-3.5 text-purple-600 fill-purple-600/20 shrink-0" />
                          <span className="font-mono text-xs font-bold whitespace-nowrap">
                            {revealedPhones[car.id] ? store.phone : 'Call'}
                          </span>
                        </button>

                        {/* 2. WhatsApp Direct Inquiry CTA */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCarItemWhatsApp(car);
                          }}
                          className="h-9 px-2.5 sm:px-3 rounded-xl border border-emerald-300 bg-emerald-50/80 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs active:scale-95 shrink-0"
                          title="WhatsApp Host with Vehicle Details"
                          aria-label="Direct WhatsApp"
                        >
                          <WhatsAppIcon className="w-4 h-4 text-[#25D366] shrink-0" />
                          <span className="hidden sm:inline text-xs font-bold text-emerald-800">WhatsApp</span>
                        </button>

                        {/* 3. View Specs Pill */}
                        <Link
                          href={`/listing/${car.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 min-w-0 h-9 px-2 sm:px-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-800 flex items-center justify-between gap-1 transition shadow-2xs group/store cursor-pointer"
                          title={`View ${car.name} Specs & Reserve`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                            <span className="font-heading font-extrabold text-[11px] sm:text-xs text-slate-800 group-hover/store:text-emerald-700 truncate">
                              View Specs
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 group-hover/store:text-emerald-600 group-hover/store:translate-x-0.5 transition shrink-0">
                            ➔
                          </span>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. CITY TO CITY */}
            {store.primaryService === 'CITY_TO_CITY' && rides.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h3 className="font-heading font-extrabold text-lg text-slate-900 flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-blue-600" />
                    <span>City to City Intercity Routes ({rides.length})</span>
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {rides.map((ride) => (
                    <div
                      key={ride.id}
                      className="bg-white rounded-3xl p-5 border border-slate-200/90 hover:shadow-lg transition flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-blue-50 text-blue-800">
                          <span>{ride.fromCity} ➔ {ride.toCity}</span>
                        </span>
                        <div>
                          <h4 className="font-heading font-extrabold text-base text-slate-900">
                            {ride.car}
                          </h4>
                          <span className="text-xs text-slate-500">{ride.duration} · {ride.bag}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-2xl text-center text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold uppercase">One-Way</span>
                            <span className="font-black text-slate-900">{formatPrice(ride.one)}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold uppercase">Return</span>
                            <span className="font-black text-[#0B6B4F]">{formatPrice(ride.ret)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Unified Single-Row Responsive CTA Action Bar */}
                      <div className="flex items-center gap-1.5 sm:gap-2 pt-2.5 px-1 border-t border-slate-100 mt-1" onClick={(e) => e.stopPropagation()}>
                        {/* 1. Phone Call CTA */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRevealAndCall(ride.id, ride.phone, `${ride.fromCity} ➔ ${ride.toCity}`, 'CityToCity');
                          }}
                          className="h-9 px-2.5 sm:px-3 rounded-xl border border-purple-200/90 bg-purple-50/70 hover:bg-purple-100 text-purple-900 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs active:scale-95 shrink-0"
                          title={revealedPhones[ride.id] ? `Call ${ride.phone}` : 'Click to show phone number'}
                        >
                          <Phone className="w-3.5 h-3.5 text-purple-600 fill-purple-600/20 shrink-0" />
                          <span className="font-mono text-xs font-bold whitespace-nowrap">
                            {revealedPhones[ride.id] ? ride.phone : 'Call'}
                          </span>
                        </button>

                        {/* 2. WhatsApp Direct Inquiry CTA */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRideItemWhatsApp(ride);
                          }}
                          className="h-9 px-2.5 sm:px-3 rounded-xl border border-emerald-300 bg-emerald-50/80 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs active:scale-95 shrink-0"
                          title="WhatsApp Driver with Route Details"
                          aria-label="Direct WhatsApp"
                        >
                          <WhatsAppIcon className="w-4 h-4 text-[#25D366] shrink-0" />
                          <span className="hidden sm:inline text-xs font-bold text-emerald-800">WhatsApp</span>
                        </button>

                        {/* 3. View Route Details Pill */}
                        <Link
                          href={`/city-to-city/${ride.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 min-w-0 h-9 px-2 sm:px-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-800 flex items-center justify-between gap-1 transition shadow-2xs group/store cursor-pointer"
                          title="View Route & Timings"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0" />
                            <span className="font-heading font-extrabold text-[11px] sm:text-xs text-slate-800 group-hover/store:text-blue-700 truncate">
                              View Route
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 group-hover/store:text-blue-600 group-hover/store:translate-x-0.5 transition shrink-0">
                            ➔
                          </span>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. SHUTTLES */}
            {store.primaryService === 'PICK_AND_DROP' && shuttles.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h3 className="font-heading font-extrabold text-lg text-slate-900 flex items-center gap-2">
                    <Bus className="w-4 h-4 text-teal-600" />
                    <span>Commuter Pick & Drop Routes ({shuttles.length})</span>
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {shuttles.map((shuttle) => (
                    <div
                      key={shuttle.id}
                      className="bg-white rounded-3xl p-5 border border-slate-200/90 hover:shadow-lg transition flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800">
                            Monthly Commute
                          </span>
                          <span className="text-xs font-bold text-teal-700">
                            {shuttle.seats} seats available
                          </span>
                        </div>
                        <div>
                          <h4 className="font-heading font-extrabold text-base text-slate-900">
                            {shuttle.from} ➔ {shuttle.to}
                          </h4>
                          <span className="text-xs text-slate-500">{shuttle.van} · {shuttle.days}</span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-2xl flex items-center justify-between text-xs">
                          <span className="text-slate-500">Monthly Seat Rate:</span>
                          <span className="font-heading font-black text-slate-900">{shuttle.fare}</span>
                        </div>
                      </div>

                      {/* Unified Single-Row Responsive CTA Action Bar */}
                      <div className="flex items-center gap-1.5 sm:gap-2 pt-2.5 px-1 border-t border-slate-100 mt-1" onClick={(e) => e.stopPropagation()}>
                        {/* 1. Phone Call CTA */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRevealAndCall(shuttle.id, shuttle.phone, `${shuttle.from} ➔ ${shuttle.to}`, 'Shuttle');
                          }}
                          className="h-9 px-2.5 sm:px-3 rounded-xl border border-purple-200/90 bg-purple-50/70 hover:bg-purple-100 text-purple-900 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs active:scale-95 shrink-0"
                          title={revealedPhones[shuttle.id] ? `Call ${shuttle.phone}` : 'Click to show phone number'}
                        >
                          <Phone className="w-3.5 h-3.5 text-purple-600 fill-purple-600/20 shrink-0" />
                          <span className="font-mono text-xs font-bold whitespace-nowrap">
                            {revealedPhones[shuttle.id] ? shuttle.phone : 'Call'}
                          </span>
                        </button>

                        {/* 2. WhatsApp Direct Inquiry CTA */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShuttleItemWhatsApp(shuttle);
                          }}
                          className="h-9 px-2.5 sm:px-3 rounded-xl border border-emerald-300 bg-emerald-50/80 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs active:scale-95 shrink-0"
                          title="WhatsApp Operator with Route Details"
                          aria-label="Direct WhatsApp"
                        >
                          <WhatsAppIcon className="w-4 h-4 text-[#25D366] shrink-0" />
                          <span className="hidden sm:inline text-xs font-bold text-emerald-800">WhatsApp</span>
                        </button>

                        {/* 3. View Shuttle Route Details Pill */}
                        <Link
                          href={`/shuttles/${shuttle.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 min-w-0 h-9 px-2 sm:px-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-800 flex items-center justify-between gap-1 transition shadow-2xs group/store cursor-pointer"
                          title="View Route & Schedule"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse shrink-0" />
                            <span className="font-heading font-extrabold text-[11px] sm:text-xs text-slate-800 group-hover/store:text-teal-700 truncate">
                              View Route
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 group-hover/store:text-teal-600 group-hover/store:translate-x-0.5 transition shrink-0">
                            ➔
                          </span>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. MOVERS */}
            {store.primaryService === 'HOME_SHIFTING' && movers.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h3 className="font-heading font-extrabold text-lg text-slate-900 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-purple-600" />
                    <span>Home & Office Shifting Logistics ({movers.length})</span>
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {movers.map((mover) => (
                    <div
                      key={mover.id}
                      className="bg-white rounded-3xl p-5 border border-slate-200/90 hover:shadow-lg transition flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-800">
                          {mover.category}
                        </span>
                        <div>
                          <h4 className="font-heading font-extrabold text-base text-slate-900">
                            {mover.name}
                          </h4>
                          <span className="text-xs text-slate-500">{mover.trucks}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5 bg-slate-50 p-2.5 rounded-2xl text-center text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold">Base</span>
                            <span className="font-bold text-slate-900">{mover.base}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold">Per KM</span>
                            <span className="font-bold text-slate-900">{mover.km}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold">Labor</span>
                            <span className="font-bold text-[#0B6B4F]">{mover.helper}</span>
                          </div>
                        </div>
                      </div>

                      {/* Unified Single-Row Responsive CTA Action Bar */}
                      <div className="flex items-center gap-1.5 sm:gap-2 pt-2.5 px-1 border-t border-slate-100 mt-1" onClick={(e) => e.stopPropagation()}>
                        {/* 1. Phone Call CTA */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRevealAndCall(mover.id, mover.phone, mover.name, 'Mover');
                          }}
                          className="h-9 px-2.5 sm:px-3 rounded-xl border border-purple-200/90 bg-purple-50/70 hover:bg-purple-100 text-purple-900 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs active:scale-95 shrink-0"
                          title={revealedPhones[mover.id] ? `Call ${mover.phone}` : 'Click to show phone number'}
                        >
                          <Phone className="w-3.5 h-3.5 text-purple-600 fill-purple-600/20 shrink-0" />
                          <span className="font-mono text-xs font-bold whitespace-nowrap">
                            {revealedPhones[mover.id] ? mover.phone : 'Call'}
                          </span>
                        </button>

                        {/* 2. WhatsApp Direct Inquiry CTA */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoverItemWhatsApp(mover);
                          }}
                          className="h-9 px-2.5 sm:px-3 rounded-xl border border-emerald-300 bg-emerald-50/80 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs active:scale-95 shrink-0"
                          title="WhatsApp Logistics Operator"
                          aria-label="Direct WhatsApp"
                        >
                          <WhatsAppIcon className="w-4 h-4 text-[#25D366] shrink-0" />
                          <span className="hidden sm:inline text-xs font-bold text-emerald-800">WhatsApp</span>
                        </button>

                        {/* 3. View Moving Quote Pill */}
                        <Link
                          href={`/movers/${mover.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 min-w-0 h-9 px-2 sm:px-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-800 flex items-center justify-between gap-1 transition shadow-2xs group/store cursor-pointer"
                          title="Get Moving Quote"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse shrink-0" />
                            <span className="font-heading font-extrabold text-[11px] sm:text-xs text-slate-800 group-hover/store:text-purple-700 truncate">
                              Get Quote
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 group-hover/store:text-purple-600 group-hover/store:translate-x-0.5 transition shrink-0">
                            ➔
                          </span>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Share Storefront Modal */}
      {showShareModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowShareModal(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-heading font-extrabold text-base text-slate-900">
                Share Storefront Link
              </h3>
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Share this single link with customers to showcase all your active vehicles and advertised services on SafarPK.
            </p>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-2">
              <span className="font-mono text-xs text-slate-800 truncate select-all">
                {currentStoreUrl}
              </span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shrink-0 flex items-center gap-1 cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-heading font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition shadow-sm"
              >
                <MessageSquare className="w-4 h-4 fill-white/20" />
                <span>Share Directly on WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <AppFooter />
      <MobileNavBar />
    </div>
  );
}


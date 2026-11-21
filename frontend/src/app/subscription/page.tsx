'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppHeader } from '@/components/AppHeader';
import { AppFooter } from '@/components/AppFooter';
import { MobileNavBar } from '@/components/MobileNavBar';
import { PROMO_CODES, validatePromoCode, PromoCode } from '@/data/promoCodes';
import { getActiveUser, setActiveUser, RegisteredUser, UserRole, recordSubscriptionPayment, saveAllRegisteredUsers, getAllRegisteredUsers } from '@/data/userAuth';
import {
  ShieldCheck,
  Check,
  Upload,
  Lock,
  MapPin,
  Sparkles,
  CreditCard,
  Building2,
  Smartphone,
  AlertCircle,
  Clock,
  ArrowRight,
  Zap,
  CheckCircle2,
  ArrowLeft,
  UserCheck,
  HelpCircle,
  FileText,
  Settings,
} from 'lucide-react';

interface PlanDefinition {
  id: string;
  name: string;
  audience: 'fleet' | 'driver' | 'provider';
  quota: number;
  cars: string;
  features: string[];
  was: number;
  now: number;
  popular?: boolean;
}

const FLEET_PLANS: PlanDefinition[] = [
  {
    id: 'p-1',
    name: 'Starter Fleet Pass',
    audience: 'fleet',
    quota: 2,
    cars: 'Up to 2 vehicles live',
    features: [
      '2 Active Car Listings',
      'Direct WhatsApp & Call Inquiries',
      'Basic Performance Analytics',
      'Standard City Search Placement',
    ],
    was: 5000,
    now: 3500,
  },
  {
    id: 'p-2',
    name: 'Professional Fleet Hub',
    audience: 'fleet',
    quota: 15,
    cars: 'Up to 15 vehicles live',
    features: [
      '15 Active Car Listings',
      'Priority Search Ranking in City',
      'Verified Fleet Lister Badge',
      'Custom Showroom Page & Direct Calls',
      'Unlimited Direct WhatsApp Leads',
    ],
    was: 16000,
    now: 12000,
    popular: true,
  },
  {
    id: 'p-3',
    name: 'Enterprise Corporate Fleet',
    audience: 'fleet',
    quota: 50,
    cars: 'Up to 50 vehicles live + VIP Boost',
    features: [
      '50 Active Car Listings',
      'Top-of-Search VIP Promotion',
      'Dedicated Account Manager',
      'Intercity & Airport Fleet Promotion',
      'Multi-branch Showroom Locations',
    ],
    was: 42000,
    now: 30000,
  },
];

const DRIVER_PLANS: PlanDefinition[] = [
  {
    id: 'p-drv1',
    name: 'Independent Chauffeur Pass',
    audience: 'driver',
    quota: 1,
    cars: 'Listed as verified chauffeur',
    features: [
      '1 Verified Driver Profile',
      'Direct Passenger WhatsApp & Phone Inquiries',
      'Daily, Weekly & Monthly Hire Rates Display',
      'Direct Customer Cash Handover (0% Commission)',
    ],
    was: 3000,
    now: 2000,
  },
  {
    id: 'p-drv2',
    name: 'VIP Executive Chauffeur Pass',
    audience: 'driver',
    quota: 1,
    cars: 'Top city placement + VIP badge',
    features: [
      'Top-tier Chauffeur Directory Placement',
      'Golden VIP Chauffeur Verified Badge',
      'Airport & Corporate Ride Lead Priority',
      'Direct WhatsApp Call Link with Instant Notification',
      'Background Check & License OCR Display',
    ],
    was: 4500,
    now: 3000,
    popular: true,
  },
];

const PROVIDER_PLANS: PlanDefinition[] = [
  {
    id: 'p-prov1',
    name: 'Cargo & Shifting Mover Pass',
    audience: 'provider',
    quota: 5,
    cars: 'Up to 5 moving trucks & quotes',
    features: [
      'Up to 5 Moving Trucks Listed (Shehzore, Ravi, Mazda)',
      'Receive Shifting Quotation Requests Directly',
      'Base Fare, KM Fare & Helper Addon Setup',
      'Direct WhatsApp Booking Handover',
    ],
    was: 8000,
    now: 5500,
  },
  {
    id: 'p-prov2',
    name: 'Commuter Route Shuttle Pass',
    audience: 'provider',
    quota: 5,
    cars: 'Up to 5 commuter seat routes',
    features: [
      'Up to 5 Daily Pick & Drop Routes Listed',
      'Seat Reservation & Student/Staff Inquiries',
      'Gender-Specific Routing (Girls/Female attendants)',
      'Verified Operator Badge & Live Route Tracking',
    ],
    was: 7000,
    now: 4800,
    popular: true,
  },
  {
    id: 'p-prov3',
    name: 'Enterprise Transport Operator',
    audience: 'provider',
    quota: 25,
    cars: 'Unlimited trucks & commuter routes',
    features: [
      '25 Commercial Fleet & Route Units',
      'Combined Cargo + Commuter Route Management',
      'Driver Team Allocation & Roster Tools',
      'Top Category Placement Across Pakistan',
    ],
    was: 25000,
    now: 18000,
  },
];

export default function SubscriptionPage() {
  const [activeUser, setActiveUserState] = useState<RegisteredUser | null>(null);
  const [audience, setAudience] = useState<'fleet' | 'driver' | 'provider'>('fleet');
  const [selectedPlanIdx, setSelectedPlanIdx] = useState<number>(0);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<'manual' | 'raast' | 'card'>('manual');
  const [transactionRef, setTransactionRef] = useState('');
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [slipFileName, setSlipFileName] = useState<string | null>(null);
  const [detectedRef, setDetectedRef] = useState<string | null>(null);
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);

  // Promo Code
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [promoMessage, setPromoMessage] = useState('');
  const [promoError, setPromoError] = useState(false);

  // Form submission / Activation state
  const [isSuccess, setIsSuccess] = useState(false);
  const [successType, setSuccessType] = useState<'trial' | 'paid' | 'pending'>('trial');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    const u = getActiveUser();
    setActiveUserState(u);

    if (u) {
      if (u.role === 'DRIVER') {
        setAudience('driver');
        setSelectedPlanIdx(1); // VIP Executive
      } else if (u.role === 'PROVIDER') {
        setAudience('provider');
        setSelectedPlanIdx(1); // Route Shuttle or Cargo
      } else if (u.role === 'LISTER') {
        setAudience('fleet');
        setSelectedPlanIdx(1); // Professional
      }
    }
  }, []);

  const getPlansForAudience = () => {
    if (audience === 'driver') return DRIVER_PLANS;
    if (audience === 'provider') return PROVIDER_PLANS;
    return FLEET_PLANS;
  };

  const activePlans = getPlansForAudience();
  const currentPlan = activePlans[selectedPlanIdx] || activePlans[0];

  const formatPKR = (v: number) => `Rs. ${v.toLocaleString('en-US')}`;

  // Calculate pricing & savings
  const wasPrice = currentPlan.was;
  let nowPrice = currentPlan.now;
  let promoDiscount = 0;
  let extraDurationText = '';

  if (appliedPromo) {
    if (appliedPromo.discountType === 'PERCENTAGE') {
      promoDiscount = Math.round((nowPrice * (appliedPromo.discountValue || 0)) / 100);
    } else if (appliedPromo.discountType === 'FIXED_AMOUNT') {
      promoDiscount = appliedPromo.discountValue || 0;
    }

    if (appliedPromo.extraDurationDays) {
      extraDurationText = `+ ${appliedPromo.extraDurationDays} Days Free`;
    } else if (appliedPromo.extraDurationMonths) {
      extraDurationText = `+ ${appliedPromo.extraDurationMonths} Month Free`;
    }
  }

  const finalTotal = Math.max(0, nowPrice - promoDiscount);
  const totalSaved = wasPrice - finalTotal;

  const handleApplyPromo = (codeToApply?: string) => {
    const raw = (codeToApply || promoCodeInput).trim().toUpperCase();
    if (!raw) return;

    const res = validatePromoCode(raw, 'PK', audience === 'provider' ? 'fleet' : audience);
    if (res.valid && res.promo) {
      setAppliedPromo(res.promo);
      setPromoError(false);
      setPromoMessage(
        res.promo.extraDurationDays
          ? `✓ Code ${raw} applied! ${res.promo.discountValue}% off + ${res.promo.extraDurationDays} days free`
          : `✓ Code ${raw} applied! ${res.promo.discountValue}% discount active`
      );
    } else {
      setAppliedPromo(null);
      setPromoError(true);
      setPromoMessage(res.error || 'Invalid or expired promo code for your plan');
    }
  };

  // 1-Click Instant 7-Day Free Trial Activation
  const handleActivateTrial = (planToActivate?: PlanDefinition) => {
    const p = planToActivate || currentPlan;
    const u = getActiveUser();

    if (!u) {
      window.location.href = '/login?redirect=/subscription';
      return;
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);
    const renewsDateStr = expiryDate.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    u.subscription = {
      status: 'ACTIVE',
      planId: p.id,
      planName: `${p.name} (7-Day Free Trial)`,
      targetRole: audience === 'driver' ? 'DRIVER' : audience === 'provider' ? 'PROVIDER' : 'LISTER',
      wasPrice: p.was,
      nowPrice: 0,
      amountPaid: 0,
      currency: 'PKR',
      symbol: 'Rs',
      promoCodeApplied: '7_DAYS_TRIAL',
      paymentRef: 'TRIAL-ACTIVATION-FREE',
      requestedAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
      quota: p.quota,
      usedQuota: u.subscription?.usedQuota || 0,
      renewsOn: `${renewsDateStr} (Trial)`,
    };

    setActiveUser(u);
    setActiveUserState({ ...u });
    window.dispatchEvent(new Event('safarpk_auth_state_changed'));

    setSuccessType('trial');
    setIsSuccess(true);
  };

  // Full Subscription Activation with Payment Submission
  const handleSubmitPayment = () => {
    const u = getActiveUser();
    if (!u) {
      window.location.href = '/login?redirect=/subscription';
      return;
    }

    if (paymentMethod !== 'card' && !slipPreview && !transactionRef.trim()) {
      setValidationError('Please upload payment slip screenshot (required) or enter transaction reference ID');
      return;
    }

    setValidationError('');

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + (appliedPromo?.extraDurationDays ? 30 + appliedPromo.extraDurationDays : 30));
    const renewsDateStr = expiryDate.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const isCard = paymentMethod === 'card';
    const refToSave =
      transactionRef.trim().toUpperCase() ||
      detectedRef ||
      (isCard ? `CARD-${Date.now().toString().slice(-7)}` : `DEP-${Date.now().toString().slice(-7)}`);

    const modeLabel =
      paymentMethod === 'raast'
        ? 'Raast / Meezan Bank Transfer'
        : paymentMethod === 'manual'
        ? 'JazzCash / Easypaisa Direct'
        : 'Credit / Debit Card Online';

    // Record into financial ledger
    recordSubscriptionPayment({
      userId: u.id,
      userName: u.name,
      businessName: u.businessName,
      phone: u.phone || '+92 300 1234567',
      role: audience === 'driver' ? 'DRIVER' : audience === 'provider' ? 'PROVIDER' : 'LISTER',
      planId: currentPlan.id,
      planName: currentPlan.name,
      amountPaid: finalTotal,
      currency: 'PKR',
      symbol: 'Rs',
      paymentMode: modeLabel,
      paymentRef: refToSave,
      status: isCard ? 'CONFIRMED' : 'PENDING',
      recordedBy: isCard ? 'Online Gateway' : 'Vendor Self-Subscription',
      slipUrl: slipPreview || undefined,
      notes: isCard
        ? 'Online card payment confirmed.'
        : `Payment proof submitted via ${modeLabel}. Awaiting Super Admin or Agent verification.`,
    });

    // Update user account
    u.subscription = {
      status: isCard ? 'ACTIVE' : 'PENDING_APPROVAL',
      planId: currentPlan.id,
      planName: currentPlan.name,
      targetRole: audience === 'driver' ? 'DRIVER' : audience === 'provider' ? 'PROVIDER' : 'LISTER',
      wasPrice: wasPrice,
      nowPrice: finalTotal,
      amountPaid: finalTotal,
      currency: 'PKR',
      symbol: 'Rs',
      promoCodeApplied: appliedPromo?.code,
      paymentRef: refToSave,
      requestedAt: new Date().toISOString(),
      approvedAt: isCard ? new Date().toISOString() : undefined,
      quota: currentPlan.quota,
      usedQuota: u.subscription?.usedQuota || 0,
      renewsOn: renewsDateStr,
    };

    const all = getAllRegisteredUsers();
    saveAllRegisteredUsers(all.map((user) => (user.id === u.id ? u : user)));
    setActiveUser(u);
    setActiveUserState({ ...u });
    window.dispatchEvent(new Event('safarpk_auth_state_changed'));
    window.dispatchEvent(new Event('safarpk_ledger_updated'));

    setSuccessType(isCard ? 'paid' : 'pending');
    setIsSuccess(true);
  };

  const getDashboardHref = () => {
    if (activeUser?.role === 'DRIVER') return '/driver';
    if (activeUser?.role === 'PROVIDER') return '/provider';
    return '/lister';
  };

  const getRoleDisplayName = () => {
    if (activeUser?.role === 'DRIVER') return 'Chauffeur / Driver';
    if (activeUser?.role === 'PROVIDER') return 'Logistics & Shuttles Provider';
    if (activeUser?.role === 'LISTER') return 'Car Rental Fleet Lister';
    return 'Partner Member';
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] font-sans text-[#101828] flex flex-col">
      <AppHeader />

      <main className="flex-1 max-w-[1140px] w-full mx-auto px-4 sm:px-8 py-8 md:py-12 flex flex-col gap-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href={getDashboardHref()}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B6B4F] hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>

          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E4E7EC] text-xs font-bold text-[#344054] hover:bg-slate-50 shadow-2xs"
          >
            <Settings className="w-3.5 h-3.5 text-[#0B6B4F]" />
            <span>Manage Profile & Identity Docs</span>
          </Link>
        </div>

        {/* ACTIVE SUBSCRIPTION LIVE STATUS (If already active) */}
        {activeUser?.subscription && activeUser.subscription.status === 'ACTIVE' && (
          <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-900 via-[#0B6B4F] to-emerald-800 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
                <CheckCircle2 className="w-6 h-6 text-emerald-300" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-400 text-emerald-950 text-[10px] font-black uppercase tracking-wider">
                    ACTIVE SUBSCRIPTION
                  </span>
                  <span className="text-xs text-emerald-200">
                    Auto-renews: {activeUser.subscription.renewsOn || 'Active'}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black">
                  {activeUser.subscription.planName}
                </h2>
                <p className="text-xs text-emerald-100 max-w-xl">
                  Your account is fully authorized. You can publish up to{' '}
                  <strong className="text-white underline">{activeUser.subscription.quota} listings</strong> live on the SafarPK marketplace.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href={getDashboardHref()}
                className="px-5 py-3 rounded-xl bg-white text-[#0B6B4F] font-black text-xs hover:bg-emerald-50 transition shadow-md flex items-center gap-2"
              >
                <span>Go to My Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* CUSTOMER NOTICE (If logged-in user is a customer) */}
        {activeUser?.role === 'CUSTOMER' && (
          <div className="p-6 rounded-3xl bg-blue-50 border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-sm text-blue-950">
                  Customer Accounts are 100% Free Forever!
                </h3>
                <p className="text-xs text-blue-800 mt-0.5 leading-relaxed">
                  As a customer or commuter, you do not need to purchase any subscription. You can freely browse cars, contact drivers, book pick & drop routes, and request moving quotations.
                </p>
              </div>
            </div>
            <Link
              href="/register"
              className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition shrink-0"
            >
              Become a Lister / Driver
            </Link>
          </div>
        )}

        {/* HEADER SECTION (Individualized per user role) */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {activeUser ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#E9F3EE] text-[#0B6B4F] border border-[#0B6B4F]/20">
                    {getRoleDisplayName()} · {activeUser.name}
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-slate-100 text-slate-700">
                    SafarPK Partner Membership
                  </span>
                )}
              </div>

              <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#101828]">
                {audience === 'driver'
                  ? 'Chauffeur Membership & Verification Plans'
                  : audience === 'provider'
                  ? 'Cargo Movers & Commuter Shuttle Passes'
                  : 'Car Rental Fleet Lister Subscription Plans'}
              </h1>
            </div>

            {/* ONLY DISPLAY ROLE SELECTOR FOR GUEST USERS (When not logged in) */}
            {!activeUser && (
              <div className="flex items-center gap-1.5 p-1 bg-white border border-[#E4E7EC] rounded-xl text-xs font-bold shadow-2xs">
                <button
                  type="button"
                  onClick={() => {
                    setAudience('fleet');
                    setSelectedPlanIdx(0);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    audience === 'fleet' ? 'bg-[#0B6B4F] text-white' : 'text-[#475467]'
                  }`}
                >
                  Fleet Lister
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAudience('driver');
                    setSelectedPlanIdx(0);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    audience === 'driver' ? 'bg-[#0B6B4F] text-white' : 'text-[#475467]'
                  }`}
                >
                  Driver / Chauffeur
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAudience('provider');
                    setSelectedPlanIdx(0);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    audience === 'provider' ? 'bg-[#0B6B4F] text-white' : 'text-[#475467]'
                  }`}
                >
                  Cargo & Routes
                </button>
              </div>
            )}
          </div>

          <p className="text-sm text-[#475467]">
            Monthly subscription pass · 0% commission on bookings · Direct customer contact & WhatsApp leads
          </p>
        </div>

        {/* SUCCESS CONFIRMATION MODAL/SCREEN */}
        {isSuccess && (
          <div className={`p-8 rounded-3xl bg-white border-2 shadow-2xl flex flex-col items-center text-center gap-4 animate-in fade-in duration-300 ${
            successType === 'pending' ? 'border-amber-500' : 'border-[#0B6B4F]'
          }`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
              successType === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-[#E9F3EE] text-[#0B6B4F]'
            }`}>
              {successType === 'pending' ? (
                <Clock className="w-10 h-10 animate-spin" />
              ) : (
                <CheckCircle2 className="w-10 h-10" />
              )}
            </div>

            <div className="space-y-1">
              <span className={`text-xs font-extrabold uppercase tracking-widest ${
                successType === 'pending' ? 'text-amber-700' : 'text-[#0B6B4F]'
              }`}>
                {successType === 'trial'
                  ? '🎉 FREE TRIAL ACTIVATED'
                  : successType === 'pending'
                  ? '⏳ PAYMENT SUBMITTED FOR VERIFICATION'
                  : '✓ SUBSCRIPTION ACTIVATED'}
              </span>
              <h2 className="text-2xl font-black text-[#101828]">
                {successType === 'pending'
                  ? 'Payment Proof Received!'
                  : `Welcome to ${currentPlan.name}!`}
              </h2>
              <p className="text-xs sm:text-sm text-[#475467] max-w-md mx-auto">
                {successType === 'pending'
                  ? `Your payment slip/reference has been submitted to SafarPK accounts desk. Super Admin or your City Agent is verifying the bank credit. Your listing quota (${currentPlan.quota} vehicles) will unlock as soon as verified.`
                  : `Your subscription is now live. You can immediately publish up to ${currentPlan.quota} vehicles/routes and start receiving customer booking inquiries directly on WhatsApp and phone.`}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-4 w-full sm:w-auto">
              <Link
                href={getDashboardHref()}
                className="h-12 px-6 rounded-xl bg-[#0B6B4F] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 hover:bg-[#08513C] transition shadow-md"
              >
                <span>Enter Your Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <button
                type="button"
                onClick={() => setIsSuccess(false)}
                className="h-12 px-6 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-200 transition"
              >
                Change or View Other Plans
              </button>
            </div>
          </div>
        )}

        {/* PLAN CARDS GRID */}
        <div
          role="radiogroup"
          aria-label="Subscription plan"
          className="grid grid-cols-1 md:grid-cols-3 gap-5"
        >
          {activePlans.map((p, idx) => {
            const isSelected = selectedPlanIdx === idx;
            const savings = p.was - p.now;

            return (
              <div
                key={p.id}
                onClick={() => setSelectedPlanIdx(idx)}
                className={`p-6 rounded-[24px] bg-white text-left flex flex-col justify-between gap-5 transition cursor-pointer relative ${
                  isSelected
                    ? 'border-3 border-[#0B6B4F] shadow-xl ring-4 ring-[#0B6B4F]/10'
                    : 'border border-[#E4E7EC] hover:border-slate-300 shadow-xs'
                }`}
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between w-full">
                    <span className="font-heading font-extrabold text-base text-[#101828]">
                      {p.name}
                    </span>
                    <span
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? 'border-6 border-[#0B6B4F] bg-white'
                          : 'border-2 border-slate-300'
                      }`}
                    />
                  </div>

                  {p.popular && (
                    <span className="self-start px-2.5 py-0.5 rounded-full bg-[#F5B547] text-[#101828] text-[10px] font-extrabold tracking-wider">
                      ★ MOST POPULAR IN PAKISTAN
                    </span>
                  )}

                  <div className="flex flex-col">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm text-[#98A2B3] line-through font-semibold">
                        {formatPKR(p.was)}
                      </span>
                      <span className="font-heading font-black text-2xl sm:text-3xl text-[#101828]">
                        {formatPKR(p.now)}
                      </span>
                      <span className="text-xs text-[#667085] font-semibold">/month</span>
                    </div>
                    <span className="text-xs font-bold text-[#0B6B4F] mt-0.5">
                      Save {formatPKR(savings)} every month
                    </span>
                  </div>

                  <p className="text-xs font-bold text-[#344054] pt-2 border-t border-[#F0F2F4]">
                    {p.cars}
                  </p>

                  <ul className="flex flex-col gap-2 pt-1 text-xs text-[#475467]">
                    {p.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-[#0B6B4F] shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 1-Click Instant Trial Button per Plan */}
                <div className="flex flex-col gap-2 pt-3 border-t border-[#F0F2F4]">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPlanIdx(idx);
                      handleActivateTrial(p);
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#E9F3EE] hover:bg-[#d5eade] text-[#0B6B4F] font-black text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 fill-[#0B6B4F]" />
                    <span>Start 7-Day Free Trial</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* NOTICE: ACCOUNT & DOCUMENT MANAGEMENT LINK */}
        <div className="p-4 rounded-2xl bg-white border border-[#E4E7EC] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 text-[#0B6B4F]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#101828]">
                Need to upload CNIC, Driving License, Trade License or Showroom Address?
              </p>
              <p className="text-[11px] text-[#667085]">
                Manage all identity documents, showroom map location, and profile pictures directly in your Account Settings.
              </p>
            </div>
          </div>
          <Link
            href="/settings"
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#101828] text-xs font-bold transition shrink-0"
          >
            Go to Account Settings ➔
          </Link>
        </div>

        {/* PAYMENT & PROMO CODE SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
          {/* Left: Payment Method Details */}
          <section className="bg-white border border-[#EEF0F2] rounded-3xl p-6 sm:p-8 flex flex-col gap-6 shadow-xs">
            <div>
              <h2 className="font-heading font-bold text-xl text-[#101828]">
                Select Payment Method
              </h2>
              <p className="text-xs text-[#667085] mt-0.5">
                Instant activation via Mobile Wallet, Raast, Direct Bank Transfer or Card.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('manual')}
                className={`p-3 rounded-xl border text-center text-xs font-bold transition cursor-pointer ${
                  paymentMethod === 'manual'
                    ? 'border-[#0B6B4F] bg-[#E9F3EE] text-[#08513C]'
                    : 'border-[#E4E7EC] bg-white text-[#344054]'
                }`}
              >
                JazzCash / Easypaisa
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('raast')}
                className={`p-3 rounded-xl border text-center text-xs font-bold transition cursor-pointer ${
                  paymentMethod === 'raast'
                    ? 'border-[#0B6B4F] bg-[#E9F3EE] text-[#08513C]'
                    : 'border-[#E4E7EC] bg-white text-[#344054]'
                }`}
              >
                Bank Transfer / Raast
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-3 rounded-xl border text-center text-xs font-bold transition cursor-pointer ${
                  paymentMethod === 'card'
                    ? 'border-[#0B6B4F] bg-[#E9F3EE] text-[#08513C]'
                    : 'border-[#E4E7EC] bg-white text-[#344054]'
                }`}
              >
                Credit / Debit Card
              </button>
            </div>

            {paymentMethod === 'card' ? (
              <div className="p-4 rounded-2xl bg-[#F7F8FA] border border-[#EEF0F2] text-xs text-[#344054] leading-relaxed flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-[#0B6B4F] shrink-0" />
                <span>
                  Card processing via PayMob / Stripe with instant activation. Click confirm below to proceed to secure checkout.
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="p-4 rounded-2xl bg-[#F7F8FA] border border-[#EEF0F2] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[#667085] block font-semibold">Bank / Wallet:</span>
                    <strong className="text-sm font-mono text-[#101828]">
                      {paymentMethod === 'manual' ? 'JazzCash / Easypaisa' : 'Meezan Bank Ltd'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#667085] block font-semibold">Account / IBAN:</span>
                    <strong className="text-sm font-mono text-[#101828]">
                      {paymentMethod === 'manual' ? '0300-1234567' : 'PK82MEZN000102030405'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#667085] block font-semibold">Account Title:</span>
                    <strong className="text-sm text-[#101828]">SafarPK Technologies (Pvt) Ltd</strong>
                  </div>
                  <div>
                    <span className="text-[#667085] block font-semibold">Amount to Send:</span>
                    <strong className="text-sm font-mono text-[#0B6B4F]">
                      {formatPKR(finalTotal)}
                    </strong>
                  </div>
                </div>

                {/* Payment Slip Upload (Mandatory) */}
                <div className="flex flex-col gap-1.5 text-xs font-semibold text-[#344054]">
                  <span className="flex items-center justify-between">
                    <span>Upload Bank / Wallet Payment Slip <span className="text-rose-500">*</span></span>
                    <span className="text-[10px] font-normal text-slate-400">JPG, PNG (Max 5MB)</span>
                  </span>

                  <input
                    type="file"
                    id="sub-slip-upload"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setSlipFileName(file.name);
                      const reader = new FileReader();
                      reader.onload = () => {
                        const base64 = reader.result as string;
                        setSlipPreview(base64);
                        setIsAutoDetecting(true);
                        setTimeout(() => {
                          const randNum = Math.floor(1000000 + Math.random() * 9000000);
                          const detected = paymentMethod === 'raast' ? `RAAST-${randNum}` : `JC-${randNum}`;
                          setDetectedRef(detected);
                          setTransactionRef(detected);
                          setIsAutoDetecting(false);
                        }, 400);
                      };
                      reader.readAsDataURL(file);
                    }}
                    className="hidden"
                  />

                  {slipPreview ? (
                    <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={slipPreview}
                          alt="Slip"
                          className="w-10 h-10 object-cover rounded-lg border border-emerald-300 shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-emerald-950 block truncate">
                            {slipFileName || 'payment-slip.jpg'}
                          </span>
                          <span className="text-[10px] text-emerald-700">Slip attached ✓</span>
                        </div>
                      </div>
                      <label
                        htmlFor="sub-slip-upload"
                        className="px-2.5 py-1 text-[11px] font-bold bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition cursor-pointer"
                      >
                        Change
                      </label>
                    </div>
                  ) : (
                    <label
                      htmlFor="sub-slip-upload"
                      className="p-3.5 border-2 border-dashed border-[#D0D5DD] hover:border-[#0B6B4F] bg-[#F7F8FA] hover:bg-emerald-50/20 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition text-center"
                    >
                      <Upload className="w-4 h-4 text-[#0B6B4F]" />
                      <span className="text-xs font-bold text-[#101828]">
                        Tap to upload payment screenshot / transfer slip
                      </span>
                    </label>
                  )}
                </div>

                <label className="flex flex-col gap-1 text-xs font-semibold text-[#344054]">
                  <div className="flex items-center justify-between">
                    <span>Transaction Reference ID <span className="text-slate-400 font-normal">(Auto-filled from slip)</span></span>
                    {isAutoDetecting ? (
                      <span className="text-[10px] text-amber-600 font-bold animate-pulse">Detecting from slip...</span>
                    ) : detectedRef ? (
                      <span className="text-[10px] text-emerald-700 font-bold">✨ Auto-detected</span>
                    ) : null}
                  </div>
                  <input
                    type="text"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder="e.g. TRX-982144 or RAAST-882910"
                    className="h-11 px-3 border border-[#E4E7EC] rounded-xl font-mono text-xs text-[#101828] outline-none focus:border-[#0B6B4F]"
                  />
                  <span className="text-[10px] text-[#667085]">
                    Enter the SMS / Receipt transaction code provided by your bank or wallet.
                  </span>
                </label>

                {/* Verification Notice */}
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Admin Verification:</strong> Manual payments are verified by Super Admin or City Agent before listing quota goes live. Status will show <em>Pending Verification</em> in your billing history.
                  </span>
                </div>
              </div>
            )}
          </section>

          {/* Right: Order Summary & Checkout Card */}
          <aside className="bg-white border border-[#EEF0F2] rounded-3xl p-6 flex flex-col gap-5 shadow-xs relative lg:sticky lg:top-24">
            <h3 className="font-heading font-bold text-lg text-[#101828]">
              Order Summary
            </h3>

            {/* Promo Code Input */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-[#344054]">
                Promo / Voucher Code
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoCodeInput}
                  onChange={(e) => setPromoCodeInput(e.target.value)}
                  placeholder="e.g. LAUNCHPK"
                  className="flex-1 h-11 px-3 border border-[#D0D5DD] rounded-xl font-mono uppercase font-bold text-xs text-[#101828] outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleApplyPromo()}
                  className="h-11 px-4 rounded-xl bg-[#101828] text-white font-bold text-xs hover:bg-slate-800 transition cursor-pointer"
                >
                  Apply
                </button>
              </div>

              {promoMessage && (
                <div
                  className={`p-2 rounded-lg text-xs font-semibold ${
                    promoError ? 'bg-red-50 text-red-700' : 'bg-[#E9F3EE] text-[#08513C]'
                  }`}
                >
                  {promoMessage}
                </div>
              )}
            </div>

            {/* Order Cost Breakdown */}
            <div className="flex flex-col gap-2 pt-3 border-t border-[#EEF0F2] text-xs text-[#344054]">
              <div className="flex justify-between">
                <span>{currentPlan.name} (1 Month)</span>
                <span className="font-bold">{formatPKR(wasPrice)}</span>
              </div>

              <div className="flex justify-between text-[#8A4B00]">
                <span>Package Discount</span>
                <span>− {formatPKR(wasPrice - nowPrice)}</span>
              </div>

              {appliedPromo && promoDiscount > 0 && (
                <div className="flex justify-between text-[#0B6B4F] font-bold">
                  <span>Promo {appliedPromo.code} Discount</span>
                  <span>− {formatPKR(promoDiscount)}</span>
                </div>
              )}

              {extraDurationText && (
                <div className="flex justify-between text-[#8A4B00] font-bold">
                  <span>Extra Free Validity</span>
                  <span>{extraDurationText}</span>
                </div>
              )}

              <div className="flex justify-between items-baseline pt-3 border-t border-[#EEF0F2] text-sm">
                <span className="font-heading font-extrabold text-[#101828] text-base">
                  Total Due Today
                </span>
                <span className="font-heading font-extrabold text-[#101828] text-xl">
                  {formatPKR(finalTotal)}
                </span>
              </div>

              <div className="p-2 rounded-xl bg-[#FFF4E0] text-[#8A4B00] text-xs font-bold text-center">
                🎉 Total Savings: {formatPKR(totalSaved)}
              </div>
            </div>

            {validationError && (
              <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* ACTION BUTTONS */}
            <div className="flex flex-col gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleSubmitPayment}
                className="w-full h-12 px-6 rounded-xl bg-[#0B6B4F] text-white font-heading font-black text-sm flex items-center justify-center gap-2 hover:bg-[#08513C] transition cursor-pointer shadow-md active:scale-[0.99]"
              >
                <span>Activate Subscription Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => handleActivateTrial()}
                className="w-full h-11 px-4 rounded-xl bg-white border border-[#0B6B4F] text-[#0B6B4F] font-black text-xs flex items-center justify-center gap-1.5 hover:bg-[#E9F3EE] transition cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 fill-[#0B6B4F]" />
                <span>Or Start 7-Day Free Trial</span>
              </button>
            </div>
          </aside>
        </div>
      </main>

      <AppFooter />
      <MobileNavBar />
    </div>
  );
}

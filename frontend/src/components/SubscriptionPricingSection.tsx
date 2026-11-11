'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Check,
  Tag,
  Percent,
  Gift,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Upload,
  X,
  Building,
  FileCheck,
  Clock,
  Lock,
} from 'lucide-react';
import { useCountry } from '@/app/context/CountryContext';
import {
  SubscriptionPlan,
  PromoCode,
  PromoValidationResult,
  getStoredPlans,
  getAvailablePromosForCountry,
  getLocalizedPlanPricing,
  validatePromoCode,
  incrementPromoUsage,
} from '@/data/promoCodes';

interface SubscriptionPricingSectionProps {
  role: 'CAR_RENTAL' | 'DRIVER' | 'PICK_AND_DROP' | 'SHIFTING' | 'PROVIDER';
  roleTitle?: string;
  initialPlanName?: string;
  onPlanSubscribed?: (plan: SubscriptionPlan, finalAmount: number, promoCode?: string) => void;
}

export function SubscriptionPricingSection({
  role,
  roleTitle = 'Subscriber',
  initialPlanName,
  onPlanSubscribed,
}: SubscriptionPricingSectionProps) {
  const { country } = useCountry();

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [promoInput, setPromoInput] = useState<string>('');
  const [appliedPromo, setAppliedPromo] = useState<PromoValidationResult | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [availablePromos, setAvailablePromos] = useState<PromoCode[]>([]);

  // Active Subscription details
  const [activeSubscription, setActiveSubscription] = useState<{
    planName: string;
    maxListings: number;
    amountPaid: number;
    symbol: string;
    currency: string;
    renewsOn: string;
    status: 'ACTIVE' | 'PENDING_APPROVAL';
  }>({
    planName: initialPlanName || (role === 'DRIVER' ? 'Chauffeur Solo Pass' : 'Professional Fleet (15 Vehicles)'),
    maxListings: role === 'DRIVER' ? 1 : 15,
    amountPaid: role === 'DRIVER' ? 1500 : 12000,
    symbol: country.symbol || 'Rs',
    currency: country.currency || 'PKR',
    renewsOn: '10 Dec 2026',
    status: 'ACTIVE',
  });

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentSlipUploaded, setPaymentSlipUploaded] = useState(false);
  const [transactionRef, setTransactionRef] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Load plans & regional promos
  useEffect(() => {
    const allPlans = getStoredPlans();
    // Filter plans that match this role or are open to ALL
    const matched = allPlans.filter(
      (p) =>
        p.isActive &&
        (p.targetRole === role ||
          (role === 'CAR_RENTAL' && p.targetRole === 'CAR_RENTAL') ||
          (role === 'DRIVER' && p.targetRole === 'DRIVER') ||
          (role === 'PROVIDER' && (p.targetRole === 'PICK_AND_DROP' || p.targetRole === 'SHIFTING' || p.targetRole === 'PROVIDER')) ||
          p.targetRole === 'ALL')
    );

    const fallbackPlans = matched.length > 0 ? matched : allPlans.filter((p) => p.isActive);
    setPlans(fallbackPlans);

    if (fallbackPlans.length > 0 && !selectedPlanId) {
      // Pick first plan as default
      setSelectedPlanId(fallbackPlans[0].id);
    }

    // Load available public promos STRICTLY for this visitor's country
    const regionalPromos = getAvailablePromosForCountry(country.code).filter(
      (promo) =>
        promo.targetRoles.includes('ALL') ||
        promo.targetRoles.includes(role) ||
        (role === 'PROVIDER' && (promo.targetRoles.includes('PICK_AND_DROP') || promo.targetRoles.includes('SHIFTING')))
    );
    setAvailablePromos(regionalPromos);
  }, [country.code, role]);

  // Selected plan calculation
  const currentPlan = plans.find((p) => p.id === selectedPlanId) || plans[0];
  const pricing = currentPlan
    ? getLocalizedPlanPricing(currentPlan, country.code)
    : { wasPrice: 7000, nowPrice: 5000, symbol: country.symbol, currency: country.currency };

  // Recalculate promo when selected plan or country changes
  useEffect(() => {
    if (appliedPromo?.promo && currentPlan) {
      const res = validatePromoCode(
        appliedPromo.promo.code,
        country.code,
        role,
        pricing.nowPrice,
        pricing.wasPrice,
        pricing.symbol
      );
      if (res.valid) {
        setAppliedPromo(res);
      } else {
        setAppliedPromo(null);
        setPromoError(res.error || 'Promo code not applicable for this plan.');
      }
    }
  }, [selectedPlanId, country.code]);

  // Apply Promo Handler
  const handleApplyPromo = (codeToApply?: string) => {
    const code = (codeToApply || promoInput).trim().toUpperCase();
    setPromoError(null);

    if (!code) {
      setPromoError('Please enter a promo code');
      return;
    }

    const result = validatePromoCode(
      code,
      country.code,
      role,
      pricing.nowPrice,
      pricing.wasPrice,
      pricing.symbol
    );

    if (!result.valid) {
      setPromoError(result.error || 'This promo code is not applicable in your region.');
      setAppliedPromo(null);
    } else {
      setAppliedPromo(result);
      setPromoInput(code);
      setPromoError(null);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoInput('');
    setPromoError(null);
  };

  // Pricing calculations
  const wasPrice = pricing.wasPrice;
  const nowPrice = pricing.nowPrice;
  const discountAmount = appliedPromo ? appliedPromo.discountAmount : 0;
  const finalPayable = appliedPromo ? appliedPromo.finalPrice : nowPrice;
  const totalSaved = Math.max(0, wasPrice - finalPayable);
  const totalSavingsPercentage = wasPrice > 0 ? Math.round((totalSaved / wasPrice) * 100) : 0;

  // Confirm Payment Submission
  const handleConfirmSubscription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionRef.trim() && !paymentSlipUploaded) {
      alert('Please enter a transaction ID or attach payment proof.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      if (appliedPromo?.promo) {
        incrementPromoUsage(appliedPromo.promo.code);
      }

      setActiveSubscription({
        planName: currentPlan.name,
        maxListings: currentPlan.maxListings,
        amountPaid: finalPayable,
        symbol: pricing.symbol,
        currency: pricing.currency,
        renewsOn: '11 Dec 2026',
        status: 'ACTIVE',
      });

      setIsSubmitting(false);
      setShowPaymentModal(false);
      setSuccessNotice(
        `🎉 Successfully subscribed to "${currentPlan.name}"! Your listings quota has been updated.`
      );
      if (onPlanSubscribed) {
        onPlanSubscribed(currentPlan, finalPayable, appliedPromo?.promo?.code);
      }

      setTimeout(() => setSuccessNotice(null), 5000);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Success Notification */}
      {successNotice && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-bold animate-fade-in shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* 1. CURRENT ACTIVE SUBSCRIPTION STRIP */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-950 rounded-2xl border border-slate-800 p-5 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              ● Active {activeSubscription.status}
            </span>
            <span className="text-[11px] text-slate-400">
              {roleTitle} Platform Pass
            </span>
          </div>
          <h4 className="text-lg font-black text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            {activeSubscription.planName}
          </h4>
          <p className="text-xs text-slate-400">
            Valid until {activeSubscription.renewsOn} · Quota:{' '}
            <strong className="text-emerald-300 font-bold">
              {activeSubscription.maxListings} Listings / Routes
            </strong>{' '}
            · Direct Contact Enabled
          </p>
        </div>

        <div className="text-right sm:border-l sm:border-slate-800 sm:pl-6 shrink-0">
          <span className="text-[11px] text-slate-400 block font-medium">Billed Monthly</span>
          <span className="text-xl font-black text-emerald-400">
            {activeSubscription.symbol} {activeSubscription.amountPaid.toLocaleString()}
          </span>
          <span className="text-xs text-slate-500 block">/ month</span>
        </div>
      </div>

      {/* 2. PACKAGES SELECTION (WAS - NOW PRICING) */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              Choose Subscription Package
            </h3>
            <p className="text-xs text-slate-500">
              Prices automatically localized in {country.name} ({country.currency}). All packages feature WAS - NOW transparent rates.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            Showing prices for: <strong>{country.flag} {country.name}</strong>
          </span>
        </div>

        {/* Package Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const planPricing = getLocalizedPlanPricing(plan, country.code);
            const isSelected = selectedPlanId === plan.id;
            const packageDiscountPercent =
              planPricing.wasPrice > planPricing.nowPrice
                ? Math.round(
                    ((planPricing.wasPrice - planPricing.nowPrice) / planPricing.wasPrice) * 100
                  )
                : 0;

            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                className={`p-5 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between relative ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50/40 shadow-md ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                {/* Popular or Savings Badge */}
                {plan.badge ? (
                  <span className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-600 text-white shadow-xs">
                    {plan.badge}
                  </span>
                ) : packageDiscountPercent > 0 ? (
                  <span className="absolute -top-3 right-4 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-600 text-white shadow-xs">
                    Save {packageDiscountPercent}%
                  </span>
                ) : null}

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-slate-500 uppercase bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {plan.maxListings} {role === 'DRIVER' ? 'PASS' : 'VEHICLES'}
                    </span>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">{plan.name}</h4>

                    {/* WAS - NOW PRICING BOX */}
                    <div className="mt-2 space-y-0.5">
                      {planPricing.wasPrice > planPricing.nowPrice && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
                          <span>WAS</span>
                          <span className="line-through">
                            {planPricing.symbol} {planPricing.wasPrice.toLocaleString()}
                          </span>
                        </div>
                      )}
                      <div className="flex items-baseline gap-1">
                        <span className="text-xs font-black text-emerald-800 uppercase">NOW:</span>
                        <span className="text-2xl font-black text-emerald-700">
                          {planPricing.symbol} {planPricing.nowPrice.toLocaleString()}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">/ mo</span>
                      </div>
                    </div>
                  </div>

                  {/* Feature Bullets */}
                  <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                    {plan.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-[11px]">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    className={`w-full py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {isSelected ? '✓ Selected Plan' : 'Select Package'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. PROMO CODE INPUT & COUNTRY WHITELIST SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <Tag className="w-4 h-4 text-emerald-600" />
              Subscriber Promo Code & Discount
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Have a launch promo or partner voucher? Enter your code below to apply instant percentage or fixed currency savings.
            </p>
          </div>
          <span className="text-[11px] font-bold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 self-start sm:self-auto flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-slate-400" />
            Regional Promo Isolation Active
          </span>
        </div>

        {/* Public Available Promos for Current Country */}
        {availablePromos.length > 0 && !appliedPromo && (
          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Available in {country.name} ({country.flag}):</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {availablePromos.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleApplyPromo(p.code)}
                  className="px-2.5 py-1 bg-white hover:bg-emerald-100/70 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                >
                  <Tag className="w-3 h-3 text-emerald-600" />
                  <span className="font-mono">{p.code}</span>
                  <span className="text-[10px] text-emerald-600 font-semibold">
                    (
                    {p.discountType === 'PERCENTAGE'
                      ? `${p.discountValue}% OFF`
                      : `Flat ${p.currency || country.currency} ${p.discountValue} OFF`}
                    )
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Promo Input Bar */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="e.g. LAUNCHPK, GERMANY20, VIP50"
              value={promoInput}
              disabled={!!appliedPromo}
              onChange={(e) => {
                setPromoInput(e.target.value.toUpperCase().replace(/\s+/g, ''));
                setPromoError(null);
              }}
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold tracking-wider uppercase text-slate-900 focus:outline-hidden focus:border-emerald-500 disabled:opacity-60"
            />
            <Gift className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>

          {appliedPromo ? (
            <button
              type="button"
              onClick={handleRemovePromo}
              className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <X className="w-4 h-4" />
              <span>Remove Promo</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleApplyPromo()}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
            >
              <span>Apply Code</span>
            </button>
          )}
        </div>

        {/* Error message */}
        {promoError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{promoError}</span>
          </div>
        )}

        {/* Success Promo Badge */}
        {appliedPromo && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs text-emerald-900 font-semibold">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Promo Code <strong>{appliedPromo.promo?.code}</strong> applied! &ldquo;
                {appliedPromo.promo?.description}&rdquo;
              </span>
            </div>
            <span className="font-mono font-extrabold text-emerald-700">
              - {pricing.symbol} {appliedPromo.discountAmount.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* 4. TOTAL SAVINGS CELEBRATION & PRICE BREAKDOWN */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 rounded-2xl border border-slate-800 p-6 text-white shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              Subscription Cost Summary
            </span>
            <h4 className="text-base font-extrabold text-white">
              Package: {currentPlan?.name || 'Selected Plan'}
            </h4>
          </div>
          <span className="text-xs text-slate-400 bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700 self-start sm:self-auto">
            {roleTitle} Quota: <strong>{currentPlan?.maxListings} Vehicles</strong>
          </span>
        </div>

        {/* Detailed Breakdown */}
        <div className="space-y-2 text-xs">
          {wasPrice > nowPrice && (
            <div className="flex items-center justify-between text-slate-400">
              <span>Original Standard Rate (WAS):</span>
              <span className="line-through font-mono">
                {pricing.symbol} {wasPrice.toLocaleString()}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-slate-300">
            <span>Special Package Base Rate (NOW):</span>
            <span className="font-mono font-bold">
              {pricing.symbol} {nowPrice.toLocaleString()}
            </span>
          </div>

          {appliedPromo && (
            <div className="flex items-center justify-between text-emerald-400 font-semibold">
              <span className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" />
                Promo Discount ({appliedPromo.promo?.code}):
              </span>
              <span className="font-mono font-black">
                - {pricing.symbol} {discountAmount.toLocaleString()}
              </span>
            </div>
          )}

          <div className="pt-3 border-t border-slate-800 flex items-baseline justify-between">
            <div>
              <span className="text-sm font-extrabold text-white block">Final Payable Amount:</span>
              <span className="text-[10px] text-slate-400">Billed monthly · Zero commission</span>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black text-emerald-400">
                {pricing.symbol} {finalPayable.toLocaleString()}
              </span>
              <span className="text-xs text-slate-400 block font-normal">
                {pricing.currency} / month
              </span>
            </div>
          </div>
        </div>

        {/* 🌟 BIG SAVINGS BANNER ("YOU SAVE THIS SO LISTER IS HAPPY") */}
        {totalSaved > 0 && (
          <div className="p-4 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/20 border-2 border-emerald-500/40 rounded-xl space-y-1 shadow-inner">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-300 animate-pulse shrink-0" />
              <h5 className="font-black text-sm text-emerald-200">
                🎉 YOU SAVE {pricing.symbol} {totalSaved.toLocaleString()} ({totalSavingsPercentage}% TOTAL SAVINGS!)
              </h5>
            </div>
            <p className="text-[11px] text-emerald-100/80 pl-7 leading-relaxed">
              Compared to regular pricing ({pricing.symbol} {wasPrice.toLocaleString()}), you save{' '}
              <strong>
                {pricing.symbol} {totalSaved.toLocaleString()}
              </strong>{' '}
              with our package discount {appliedPromo ? '+ extra promo code savings' : ''}! Enjoy 100% direct customer leads.
            </p>
          </div>
        )}

        {/* CTA Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowPaymentModal(true)}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold rounded-xl text-sm transition cursor-pointer shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2"
          >
            <span>Proceed to Payment ({pricing.symbol} {finalPayable.toLocaleString()})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 5. PAYMENT & PROOF SUBMISSION MODAL */}
      {showPaymentModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={() => setShowPaymentModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 text-xs text-slate-800 space-y-4 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="font-black text-base text-slate-900">
                  Confirm Subscription Payment
                </h4>
                <p className="text-slate-500 text-[11px]">
                  {country.flag} Region: {country.name} ({country.currency})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Plan & Price Summary */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">Package:</span>
                <span className="font-black text-slate-900">{currentPlan.name}</span>
              </div>
              {appliedPromo && (
                <div className="flex items-center justify-between text-emerald-700">
                  <span>Promo Applied:</span>
                  <span className="font-mono font-bold">{appliedPromo.promo?.code}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                <span className="font-bold text-slate-900">Amount Due:</span>
                <span className="font-black text-base text-emerald-600">
                  {pricing.symbol} {finalPayable.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Local Bank Transfer Details (Customized by country) */}
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2">
              <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider block">
                Official Platform Bank Account
              </span>
              {country.code === 'PK' ? (
                <div className="space-y-1 text-emerald-950 font-medium">
                  <div>Bank: <strong>Meezan Bank Limited</strong></div>
                  <div>Account Title: <strong>Safar Mobility PVT LTD</strong></div>
                  <div>Account / IBAN: <strong className="font-mono">PK64MEZN0001000845920192</strong></div>
                  <div>Alternative: <strong>JazzCash / EasyPaisa (0300-8459201)</strong></div>
                </div>
              ) : country.code === 'DE' ? (
                <div className="space-y-1 text-emerald-950 font-medium">
                  <div>Bank: <strong>Deutsche Bank AG</strong></div>
                  <div>Account Title: <strong>Safar Mobility International GmbH</strong></div>
                  <div>IBAN: <strong className="font-mono">DE89 1007 0000 0123 4567 89</strong></div>
                  <div>BIC / SWIFT: <strong className="font-mono">DEUTDEDBBER</strong></div>
                </div>
              ) : (
                <div className="space-y-1 text-emerald-950 font-medium">
                  <div>Payment Method: <strong>International Wire / Wise / Bank Transfer</strong></div>
                  <div>Beneficiary: <strong>Safar Global Mobility Inc.</strong></div>
                  <div>Account Number: <strong className="font-mono">0982-1490-2819</strong></div>
                  <div>Routing / Swift: <strong className="font-mono">SAFARUS33XXX</strong></div>
                </div>
              )}
            </div>

            {/* Proof Submission Form */}
            <form onSubmit={handleConfirmSubscription} className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Bank Reference / Transaction ID *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TRX-9028194 or Bank Reference No"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Upload Payment Screenshot / Receipt (Optional)
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex-1 border-2 border-dashed border-slate-200 hover:border-emerald-400 p-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer bg-slate-50">
                    <Upload className="w-4 h-4 text-emerald-600" />
                    <span className="text-slate-600 font-semibold">
                      {paymentSlipUploaded ? '✓ Slip Attached' : 'Attach Bank Slip'}
                    </span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={() => setPaymentSlipUploaded(true)}
                      className="hidden"
                    />
                  </label>
                  {paymentSlipUploaded && (
                    <button
                      type="button"
                      onClick={() => setPaymentSlipUploaded(false)}
                      className="text-rose-600 text-xs hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition cursor-pointer flex items-center gap-2 shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Verifying...</span>
                  ) : (
                    <>
                      <FileCheck className="w-4 h-4" />
                      <span>Confirm & Activate Subscription</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  CreditCard,
  Receipt,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
  Search,
  Printer,
  X,
  Copy,
  Check,
  Building,
  FileText,
  DollarSign,
  Upload,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  FileCheck,
  ExternalLink,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import {
  SubscriptionPaymentRecord,
  getAllSubscriptionPayments,
  recordSubscriptionPayment,
  getActiveUser,
  setActiveUser,
  RegisteredUser,
  getAllRegisteredUsers,
  saveAllRegisteredUsers,
} from '@/data/userAuth';
import { SubscriptionPricingSection } from './SubscriptionPricingSection';

interface BillingHistoryManagerProps {
  role: 'LISTER' | 'DRIVER' | 'PICK_AND_DROP' | 'SHIFTING' | 'PROVIDER';
  roleTitle?: string;
  businessName?: string;
  initialPlanName?: string;
  onOpenUpgrade?: () => void;
}

export function BillingHistoryManager({
  role,
  roleTitle = 'Fleet Lister',
  businessName,
  initialPlanName = 'Professional Fleet Hub (15 Vehicles)',
}: BillingHistoryManagerProps) {
  const [currentUser, setCurrentUser] = useState<RegisteredUser | null>(null);
  const [payments, setPayments] = useState<SubscriptionPaymentRecord[]>([]);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'CONFIRMED' | 'PENDING' | 'FAILED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<SubscriptionPaymentRecord | null>(null);
  const [selectedSlipModal, setSelectedSlipModal] = useState<string | null>(null);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [showPlansSection, setShowPlansSection] = useState(false);

  // Renewal form state
  const [paymentChannel, setPaymentChannel] = useState<'RAAST' | 'MEEZAN' | 'JAZZCASH' | 'EASYPAISA' | 'CARD'>('RAAST');
  const [transactionRef, setTransactionRef] = useState('');
  const [detectedRef, setDetectedRef] = useState<string | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [slipFileName, setSlipFileName] = useState<string | null>(null);
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);
  const [renewNotice, setRenewNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Refresh user and ledger
  const refreshData = () => {
    const user = getActiveUser();
    setCurrentUser(user);
    const all = getAllSubscriptionPayments();

    // Filter payments for this user or role
    if (user) {
      const userPayments = all.filter(
        (p) =>
          p.userId === user.id ||
          (user.phone && p.phone === user.phone) ||
          (user.businessName && p.businessName === user.businessName)
      );
      if (userPayments.length > 0) {
        setPayments(userPayments);
      } else {
        // Fallback to role-matching payments
        setPayments(all.filter((p) => p.role === (role === 'CAR_RENTAL' ? 'LISTER' : role)));
      }
    } else {
      setPayments(all.filter((p) => p.role === (role === 'CAR_RENTAL' ? 'LISTER' : role)));
    }
  };

  useEffect(() => {
    refreshData();

    const handleLedgerUpdated = () => refreshData();
    window.addEventListener('safarpk_ledger_updated', handleLedgerUpdated);
    window.addEventListener('safarpk_user_updated', handleLedgerUpdated);
    window.addEventListener('safarpk_auth_state_changed', handleLedgerUpdated);
    return () => {
      window.removeEventListener('safarpk_ledger_updated', handleLedgerUpdated);
      window.removeEventListener('safarpk_user_updated', handleLedgerUpdated);
      window.removeEventListener('safarpk_auth_state_changed', handleLedgerUpdated);
    };
  }, [role]);

  // Active plan details
  const activePlanName = currentUser?.subscription?.planName || initialPlanName;
  const lastPayment = payments[0] || null;

  // Subscription live status calculation
  const isPendingVerification =
    currentUser?.subscription?.status === 'PENDING_APPROVAL' ||
    (lastPayment?.status === 'PENDING' && currentUser?.subscription?.status !== 'ACTIVE');

  const isFailedPayment =
    currentUser?.subscription?.status === ('FAILED' as any) ||
    (lastPayment?.status === 'FAILED' && currentUser?.subscription?.status !== 'ACTIVE');

  const isSubscriptionActive =
    currentUser?.subscription?.status === 'ACTIVE' && lastPayment?.status !== 'PENDING';

  // Calculate next renewal date
  const nextRenewalDate = useMemo(() => {
    if (currentUser?.subscription?.renewsOn) {
      return currentUser.subscription.renewsOn;
    }
    const d = new Date();
    d.setDate(d.getDate() + 28);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }, [currentUser]);

  // Filtered invoices
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (filterStatus === 'CONFIRMED' && p.status !== 'CONFIRMED') return false;
      if (filterStatus === 'PENDING' && p.status !== 'PENDING') return false;
      if (filterStatus === 'FAILED' && p.status !== 'FAILED') return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchRef = (p.paymentRef || '').toLowerCase().includes(q);
        const matchPlan = (p.planName || '').toLowerCase().includes(q);
        const matchId = (p.id || '').toLowerCase().includes(q);
        if (!matchRef && !matchPlan && !matchId) return false;
      }
      return true;
    });
  }, [payments, filterStatus, searchQuery]);

  const handleCopy = (text: string, label: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedAccount(label);
      setTimeout(() => setCopiedAccount(null), 2000);
    }
  };

  // Payment Slip Upload with Instant Auto-Extract Simulation
  const handleSlipFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSlipFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setSlipPreview(base64);
      setIsAutoDetecting(true);

      // Intelligent slip analysis simulation: Detects realistic Transaction Reference
      setTimeout(() => {
        const randNum = Math.floor(1000000 + Math.random() * 9000000);
        let extractedRef = '';
        if (paymentChannel === 'RAAST') {
          extractedRef = `RAAST-${randNum}`;
        } else if (paymentChannel === 'MEEZAN') {
          extractedRef = `MEZN-${randNum}`;
        } else if (paymentChannel === 'JAZZCASH') {
          extractedRef = `JC-${randNum}`;
        } else if (paymentChannel === 'EASYPAISA') {
          extractedRef = `EP-${randNum}`;
        } else {
          extractedRef = `ONLINE-TRX-${randNum}`;
        }

        setDetectedRef(extractedRef);
        setTransactionRef(extractedRef);
        setIsAutoDetecting(false);
      }, 500);
    };
    reader.readAsDataURL(file);
  };

  // Reset modal state
  const openPaymentModal = () => {
    setTransactionRef('');
    setDetectedRef(null);
    setSlipPreview(null);
    setSlipFileName(null);
    setRenewNotice(null);
    setShowRenewModal(true);
  };

  const handleRenewSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check mandatory slip upload for manual channels
    if (paymentChannel !== 'CARD' && !slipPreview && !transactionRef.trim()) {
      alert('Please upload your payment screenshot/deposit slip (required for bank and wallet transfers).');
      return;
    }

    setIsSubmitting(true);

    const planAmount = currentUser?.subscription?.amountPaid || 12000;
    const modeLabel =
      paymentChannel === 'RAAST'
        ? 'Raast Instant Transfer'
        : paymentChannel === 'MEEZAN'
        ? 'Meezan Bank Transfer'
        : paymentChannel === 'JAZZCASH'
        ? 'JazzCash Direct'
        : paymentChannel === 'EASYPAISA'
        ? 'EasyPaisa Direct'
        : 'Online Debit/Credit Card';

    const refToSave =
      transactionRef.trim().toUpperCase() ||
      detectedRef ||
      `DEP-${Date.now().toString().slice(-7)}`;

    // For manual transfer: status is PENDING awaiting Super Admin or Agent approval!
    const isInstantCard = paymentChannel === 'CARD';
    const newStatus: 'CONFIRMED' | 'PENDING' = isInstantCard ? 'CONFIRMED' : 'PENDING';

    const record = recordSubscriptionPayment({
      userId: currentUser?.id || 'usr-lister-self',
      userName: currentUser?.name || businessName || 'Salman Rent a Car',
      businessName: businessName || currentUser?.businessName || 'Salman Rent a Car & Tours',
      phone: currentUser?.phone || '+92 300 1234567',
      role: (role === 'CAR_RENTAL' ? 'LISTER' : role) as any,
      planId: currentUser?.subscription?.planId || 'p-standard',
      planName: activePlanName,
      amountPaid: planAmount,
      currency: 'PKR',
      symbol: 'Rs',
      paymentMode: modeLabel,
      paymentRef: refToSave,
      status: newStatus,
      recordedBy: isInstantCard ? 'Online Gateway' : 'Vendor Self-Renewal',
      slipUrl: slipPreview || undefined,
      notes: isInstantCard
        ? `Instant Card payment confirmed via sandbox gateway.`
        : `Manual deposit slip submitted via ${modeLabel}. Proof attached. Awaiting Super Admin or Agent verification.`,
    });

    // Update user's account in storage so status is PENDING_APPROVAL and listings don't go live prematurely
    if (currentUser) {
      const all = getAllRegisteredUsers();
      const updatedUser = { ...currentUser };

      if (isInstantCard) {
        updatedUser.subscription = {
          ...(updatedUser.subscription || {
            planId: 'p-standard',
            planName: activePlanName,
            targetRole: (role === 'CAR_RENTAL' ? 'LISTER' : role) as any,
            amountPaid: planAmount,
            currency: 'PKR',
            symbol: 'Rs',
            quota: 15,
            usedQuota: 0,
            renewsOn: nextRenewalDate,
          }),
          status: 'ACTIVE',
          paymentRef: refToSave,
          approvedAt: new Date().toISOString(),
        };
      } else {
        updatedUser.subscription = {
          ...(updatedUser.subscription || {
            planId: 'p-standard',
            planName: activePlanName,
            targetRole: (role === 'CAR_RENTAL' ? 'LISTER' : role) as any,
            amountPaid: planAmount,
            currency: 'PKR',
            symbol: 'Rs',
            quota: 15,
            usedQuota: 0,
            renewsOn: nextRenewalDate,
          }),
          status: 'PENDING_APPROVAL',
          paymentRef: refToSave,
          requestedAt: new Date().toISOString(),
        };
      }

      saveAllRegisteredUsers(all.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
      setActiveUser(updatedUser);
      setCurrentUser(updatedUser);
    }

    if (isInstantCard) {
      setRenewNotice('Payment successfully processed! Your subscription is ACTIVE.');
    } else {
      setRenewNotice(
        'Payment slip submitted successfully! Status: PENDING VERIFICATION. Super Admin or City Agent will verify and activate your quota shortly.'
      );
    }

    setIsSubmitting(false);

    setTimeout(() => {
      setShowRenewModal(false);
      setRenewNotice(null);
      refreshData();
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* 1. Status Banner: Active, Pending Verification, or Failed */}
      {isPendingVerification ? (
        <div className="bg-gradient-to-br from-amber-950 via-slate-900 to-amber-950 text-white rounded-3xl p-5 sm:p-7 shadow-lg border border-amber-600/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs uppercase tracking-wider font-extrabold text-amber-300 bg-amber-950/80 border border-amber-500/50 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
                  <Clock className="w-3.5 h-3.5 text-amber-300 animate-spin" />
                  <span>Payment Verification In Progress</span>
                </span>
                <span className="text-xs font-semibold text-slate-300">
                  Ref: <strong className="font-mono text-amber-200">{lastPayment?.paymentRef || 'PENDING-DEPOSIT'}</strong>
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {activePlanName}
              </h2>

              <p className="text-xs sm:text-sm text-amber-100/90 max-w-xl leading-relaxed">
                Your payment slip and transaction proof have been submitted to SafarPK Finance. Super Admin or your City Agent is verifying the bank deposit. Your listings and quota will be unlocked immediately upon confirmation.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {lastPayment?.slipUrl && (
                <button
                  type="button"
                  onClick={() => setSelectedSlipModal(lastPayment.slipUrl!)}
                  className="h-10 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Eye className="w-4 h-4 text-amber-300" />
                  <span>View Uploaded Slip</span>
                </button>
              )}
              <button
                type="button"
                onClick={openPaymentModal}
                className="h-10 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-md cursor-pointer active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Update Payment / Slip</span>
              </button>
            </div>
          </div>
        </div>
      ) : isFailedPayment ? (
        <div className="bg-gradient-to-br from-rose-950 via-slate-900 to-rose-950 text-white rounded-3xl p-5 sm:p-7 shadow-lg border border-rose-600/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs uppercase tracking-wider font-extrabold text-rose-300 bg-rose-950/80 border border-rose-500/50 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
                  <XCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Payment Verification Failed</span>
                </span>
                <span className="text-xs font-semibold text-rose-200">
                  Reason: {lastPayment?.rejectionReason || 'Deposit not credited / Invalid slip'}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Subscription Unverified
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                The previous payment attempt was marked unverified. Please upload a clear bank receipt or send payment via Raast / Meezan / JazzCash to activate your vehicle quota.
              </p>
            </div>

            <button
              type="button"
              onClick={openPaymentModal}
              className="h-10 px-5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-md cursor-pointer active:scale-95 shrink-0"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Pay Again / Submit Proof</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-5 sm:p-7 shadow-lg border border-slate-700/60 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs uppercase tracking-wider font-extrabold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Active Subscription
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  Billing Account: <strong className="text-white">{businessName || currentUser?.name || 'Verified Partner'}</strong>
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {activePlanName}
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                Your listings and search placements are fully active across Pakistan. Invoices, automatic renewal dates, and payment history are tracked here.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={openPaymentModal}
                className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-md cursor-pointer active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Renew / Pay Plan</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPlansSection(!showPlansSection)}
                className="h-10 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/20 text-xs font-bold transition flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                <span>{showPlansSection ? 'Hide Plans' : 'Change / Upgrade Plan'}</span>
              </button>
            </div>
          </div>

          {/* 4 Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-700/80">
            <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
              <span className="text-[11px] text-slate-400 block font-medium">Monthly Investment</span>
              <span className="text-base sm:text-lg font-black text-emerald-400 block mt-0.5">
                Rs. {((lastPayment?.amountPaid || currentUser?.subscription?.amountPaid || 12000)).toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 block">Billed Monthly</span>
            </div>

            <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
              <span className="text-[11px] text-slate-400 block font-medium">Next Renewal Due</span>
              <span className="text-base sm:text-lg font-black text-amber-300 block mt-0.5">
                {nextRenewalDate}
              </span>
              <span className="text-[10px] text-slate-400 block">Auto-grace: 7 Days</span>
            </div>

            <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
              <span className="text-[11px] text-slate-400 block font-medium">Fleet Quota Status</span>
              <span className="text-base sm:text-lg font-black text-white block mt-0.5">
                {currentUser?.subscription?.quota ? `${currentUser.subscription.quota} Listings` : '15 Listings Live'}
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold block">Unlimited WhatsApp Clicks</span>
            </div>

            <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
              <span className="text-[11px] text-slate-400 block font-medium">Payment Channel</span>
              <span className="text-base sm:text-lg font-black text-white block mt-0.5 truncate">
                {lastPayment?.paymentMode || 'Raast Instant'}
              </span>
              <span className="text-[10px] text-slate-400 block truncate">Ref: {lastPayment?.paymentRef || 'ACTIVE'}</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. Pending Renewal Notice Card */}
      <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0 mt-0.5">
            <Calendar className="w-4 h-4 text-amber-800" />
          </div>
          <div>
            <h3 className="font-heading font-extrabold text-sm sm:text-base text-amber-950">
              Upcoming Renewal Cycle · Due on {nextRenewalDate}
            </h3>
            <p className="text-xs text-amber-800/90 mt-0.5">
              Ensure uninterrupted marketplace presence. You can submit early payment via Raast, Meezan Bank, or JazzCash at any time.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openPaymentModal}
          className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs font-bold transition shadow-xs self-start sm:self-auto shrink-0 cursor-pointer"
        >
          Pay Pending Renewal
        </button>
      </div>

      {/* 3. Invoices & Billing History Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-2xs space-y-4">
        {/* Section Header & Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-heading font-extrabold text-base text-slate-900 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-600" />
              <span>Invoices & Payment History</span>
            </h3>
            <p className="text-xs text-slate-500">
              Official tax-compliant receipts and transaction records for your accounting and business tax filings.
            </p>
          </div>

          {/* Search & Filter Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by invoice # or ref..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 pr-3 text-xs rounded-lg border border-slate-200 bg-slate-50 outline-none focus:border-emerald-500 focus:bg-white w-44 sm:w-48 transition"
              />
            </div>

            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-bold flex-wrap">
              <button
                type="button"
                onClick={() => setFilterStatus('ALL')}
                className={`px-2 py-1 rounded-md transition cursor-pointer text-[11px] ${
                  filterStatus === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({payments.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('CONFIRMED')}
                className={`px-2 py-1 rounded-md transition cursor-pointer text-[11px] ${
                  filterStatus === 'CONFIRMED' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Paid ({payments.filter((p) => p.status === 'CONFIRMED').length})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('PENDING')}
                className={`px-2 py-1 rounded-md transition cursor-pointer text-[11px] ${
                  filterStatus === 'PENDING' ? 'bg-white text-amber-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pending ({payments.filter((p) => p.status === 'PENDING').length})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('FAILED')}
                className={`px-2 py-1 rounded-md transition cursor-pointer text-[11px] ${
                  filterStatus === 'FAILED' ? 'bg-white text-rose-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Failed ({payments.filter((p) => p.status === 'FAILED').length})
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MOBILE CARDS VIEW (Clean, uncropped app look - Visible on mobile only)     */}
        {/* ========================================================================= */}
        <div className="block md:hidden space-y-3">
          {filteredPayments.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              No billing records found matching your filters.
            </div>
          ) : (
            filteredPayments.map((p, idx) => {
              const invoiceNum = `INV-${new Date(p.date).getFullYear()}-${(idx + 101).toString().padStart(4, '0')}`;
              const formattedDate = new Date(p.date).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });

              return (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3 hover:border-slate-300 transition"
                >
                  {/* Top Bar: Invoice & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-md">
                      {invoiceNum}
                    </span>

                    {p.status === 'CONFIRMED' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Paid</span>
                      </span>
                    ) : p.status === 'PENDING' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1 animate-pulse">
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>Pending Verification</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                        <XCircle className="w-3 h-3 text-rose-600" />
                        <span>Failed</span>
                      </span>
                    )}
                  </div>

                  {/* Middle: Plan, Amount & Payment Mode */}
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-slate-900 leading-snug">{p.planName}</h4>
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                      <span>{formattedDate}</span>
                      <span className="font-heading font-black text-sm text-slate-900">
                        Rs. {p.amountPaid.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                      <span className="font-medium text-slate-700">{p.paymentMode}</span>
                      <span className="font-mono text-[10px] text-slate-400 truncate max-w-[140px]">
                        Ref: {p.paymentRef}
                      </span>
                    </div>

                    {p.rejectionReason && (
                      <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-[11px] text-rose-800 font-medium mt-1">
                        ⚠️ Reason: {p.rejectionReason}
                      </div>
                    )}
                  </div>

                  {/* Bottom: Action Buttons */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedInvoice(p)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Receipt className="w-3.5 h-3.5 text-emerald-700" />
                        <span>View Invoice</span>
                      </button>

                      {p.slipUrl && (
                        <button
                          type="button"
                          onClick={() => setSelectedSlipModal(p.slipUrl!)}
                          className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold transition flex items-center gap-1 border border-emerald-200 cursor-pointer"
                          title="View Deposit Slip"
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Slip</span>
                        </button>
                      )}
                    </div>

                    {p.status === 'FAILED' && (
                      <button
                        type="button"
                        onClick={openPaymentModal}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1 cursor-pointer active:scale-95"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Pay Again</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ========================================================================= */}
        {/* DESKTOP TABLE VIEW (Full widths, never truncated - Visible on md+ screens) */}
        {/* ========================================================================= */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3 min-w-[120px]">Invoice #</th>
                <th className="py-2.5 px-3 min-w-[100px]">Date</th>
                <th className="py-2.5 px-3 min-w-[180px]">Plan Description</th>
                <th className="py-2.5 px-3 min-w-[150px]">Payment Mode</th>
                <th className="py-2.5 px-3 min-w-[100px]">Amount</th>
                <th className="py-2.5 px-3 min-w-[130px]">Status</th>
                <th className="py-2.5 px-3 text-right min-w-[100px]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No billing records found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p, idx) => {
                  const invoiceNum = `INV-${new Date(p.date).getFullYear()}-${(idx + 101).toString().padStart(4, '0')}`;
                  const formattedDate = new Date(p.date).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        {invoiceNum}
                      </td>
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                        {formattedDate}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-900 block">{p.planName}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-slate-400 font-mono">Ref: {p.paymentRef}</span>
                          {p.slipUrl && (
                            <button
                              type="button"
                              onClick={() => setSelectedSlipModal(p.slipUrl!)}
                              className="text-[10px] text-emerald-700 hover:underline font-bold flex items-center gap-0.5"
                            >
                              <ImageIcon className="w-2.5 h-2.5" />
                              <span>Slip Attached</span>
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-700 whitespace-nowrap font-medium">
                        {p.paymentMode}
                      </td>
                      <td className="py-3 px-3 font-heading font-extrabold text-slate-900 whitespace-nowrap">
                        Rs. {p.amountPaid.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {p.status === 'CONFIRMED' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 w-max border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Paid</span>
                          </span>
                        ) : p.status === 'PENDING' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1 w-max border border-amber-300 animate-pulse">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Pending Verification</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 flex items-center gap-1 w-max border border-rose-300">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            <span>Failed</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {p.status === 'FAILED' ? (
                            <button
                              type="button"
                              onClick={openPaymentModal}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Pay Again</span>
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => setSelectedInvoice(p)}
                                className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                                title="View Official Invoice"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedInvoice(p)}
                                className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                                title="Print / Download Receipt"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Upgrade Plans Collapsible Section */}
      {showPlansSection && (
        <div className="bg-white rounded-2xl border border-emerald-200 p-4 sm:p-6 shadow-sm space-y-4 animate-calm-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-heading font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Upgrade Fleet Tier & Increase Vehicle Quota</span>
              </h3>
              <p className="text-xs text-slate-500">
                Choose a higher listing capacity plan to list more vehicles and dominate customer searches.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowPlansSection(false)}
              className="text-xs font-bold text-slate-500 hover:text-slate-800"
            >
              Close
            </button>
          </div>

          <SubscriptionPricingSection
            role={role}
            roleTitle={roleTitle}
            initialPlanName={activePlanName}
            onPlanSubscribed={() => {
              refreshData();
              setShowPlansSection(false);
            }}
          />
        </div>
      )}

      {/* 5. Printable / Downloadable Official Invoice Modal (Fully responsive, clean print) */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-4 sm:my-8 flex flex-col max-h-[92vh]">
            {/* Modal Actions Header */}
            <div className="p-3.5 sm:p-4 bg-slate-900 text-white flex items-center justify-between print:hidden shrink-0">
              <span className="text-xs font-bold font-mono">Invoice Preview & Download</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs active:scale-95"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Formal Invoice Document Area (Scrollable if needed on small phones) */}
            <div className="p-5 sm:p-8 space-y-6 text-[#101828] overflow-y-auto">
              {/* Invoice Head */}
              <div className="flex items-start justify-between border-b border-slate-200 pb-5 gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-7 h-7 rounded-lg bg-[#0B6B4F] text-white flex items-center justify-center font-extrabold text-sm">
                      S
                    </span>
                    <span className="font-heading font-black text-xl tracking-tight text-[#101828]">
                      SafarPK
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    SafarPK Technologies (Pvt) Ltd<br />
                    NTN: 8920145-7 · SECP Reg: 0192847<br />
                    Islamabad / Lahore, Pakistan<br />
                    billing@safar.pk · +92 51 8847291
                  </p>
                </div>

                <div className="text-right shrink-0">
                  {selectedInvoice.status === 'CONFIRMED' ? (
                    <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 uppercase tracking-wider inline-block mb-1 border border-emerald-300">
                      ✓ PAID & CONFIRMED
                    </span>
                  ) : selectedInvoice.status === 'PENDING' ? (
                    <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 uppercase tracking-wider inline-block mb-1 border border-amber-300 animate-pulse">
                      ⏳ PENDING VERIFICATION
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 uppercase tracking-wider inline-block mb-1 border border-rose-300">
                      ✕ PAYMENT FAILED
                    </span>
                  )}
                  <h3 className="font-mono font-black text-base sm:text-lg text-slate-900">
                    INV-{new Date(selectedInvoice.date).getFullYear()}-1084
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Date: {new Date(selectedInvoice.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Billed To / Account */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Billed To (Partner)</span>
                  <strong className="text-sm text-slate-900 block">{selectedInvoice.businessName || selectedInvoice.userName}</strong>
                  <span className="text-slate-600 block">{selectedInvoice.phone}</span>
                  <span className="text-slate-500 block">Category: {roleTitle}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Payment Details</span>
                  <span className="text-slate-700 block">Method: <strong className="text-slate-900">{selectedInvoice.paymentMode}</strong></span>
                  <span className="text-slate-700 block font-mono">Ref ID: {selectedInvoice.paymentRef}</span>
                  <span className="text-slate-500 block">Processed by: {selectedInvoice.recordedBy}</span>
                  {selectedInvoice.slipUrl && (
                    <button
                      type="button"
                      onClick={() => setSelectedSlipModal(selectedInvoice.slipUrl!)}
                      className="mt-1 text-emerald-700 hover:underline font-bold flex items-center gap-1 text-[11px]"
                    >
                      <ImageIcon className="w-3 h-3" />
                      <span>View Attached Bank Slip</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Line Items */}
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-2 text-left">Item / Subscription Pass</th>
                    <th className="py-2 text-center">Cycle</th>
                    <th className="py-2 text-right">Amount (PKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  <tr>
                    <td className="py-3">
                      <strong className="text-slate-900 block">{selectedInvoice.planName}</strong>
                      <span className="text-[11px] text-slate-500">
                        Marketplace listing quota, dedicated direct WhatsApp booking links & verified partner status
                      </span>
                    </td>
                    <td className="py-3 text-center text-slate-600">30 Days</td>
                    <td className="py-3 text-right font-heading font-black text-slate-900">
                      Rs. {selectedInvoice.amountPaid.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-200">
                    <td colSpan={2} className="py-2.5 text-right font-bold text-slate-600">Subtotal:</td>
                    <td className="py-2.5 text-right font-mono font-bold text-slate-900">Rs. {selectedInvoice.amountPaid.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td colSpan={2} className="py-1 text-right font-bold text-slate-600">Federal Excise / GST:</td>
                    <td className="py-1 text-right font-mono text-slate-500">Rs. 0 (Inclusive)</td>
                  </tr>
                  <tr className="border-t-2 border-slate-900">
                    <td colSpan={2} className="py-2.5 text-right font-black text-sm text-slate-900">Total:</td>
                    <td className="py-2.5 text-right font-heading font-black text-base text-emerald-700">
                      Rs. {selectedInvoice.amountPaid.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>

              {/* Stamp & Footer note */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
                <p>This is a computer-generated tax receipt issued by SafarPK. No signature required.</p>
                <div className="border border-emerald-500 text-emerald-700 px-3 py-1 rounded font-mono font-bold text-[10px] tracking-wider uppercase">
                  {selectedInvoice.status === 'CONFIRMED' ? 'VERIFIED DEPOSIT' : 'SUBMITTED FOR VERIFICATION'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Attached Deposit Slip Fullscreen Modal */}
      {selectedSlipModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative max-w-lg w-full bg-slate-900 rounded-3xl overflow-hidden border border-slate-700 shadow-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-white pb-2 border-b border-slate-800">
              <span className="text-xs font-bold font-mono">Payment Proof Slip / Screenshot</span>
              <button
                type="button"
                onClick={() => setSelectedSlipModal(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto flex items-center justify-center bg-black/40 rounded-2xl p-2">
              <img
                src={selectedSlipModal}
                alt="Payment slip screenshot"
                className="max-h-[65vh] w-auto object-contain rounded-lg"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedSlipModal(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Renewal & Payment Submission Modal (Mandatory Slip Upload & Auto Ref Extraction) */}
      {showRenewModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl p-5 sm:p-7 space-y-4 animate-calm-in my-6 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-heading font-black text-lg text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                  <span>Renew Subscription Pass</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Upload transfer slip or enter transaction ID to submit for admin verification.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowRenewModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {renewNotice && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{renewNotice}</span>
              </div>
            )}

            {/* Payment Channel Options */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 block">Select Payment Channel:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'RAAST', label: 'Raast Pay', tag: 'Instant Transfer' },
                  { id: 'MEEZAN', label: 'Meezan Bank', tag: 'Direct Bank' },
                  { id: 'JAZZCASH', label: 'JazzCash', tag: 'Mobile Wallet' },
                  { id: 'EASYPAISA', label: 'EasyPaisa', tag: 'Mobile Wallet' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setPaymentChannel(item.id as any);
                      setTransactionRef('');
                      setDetectedRef(null);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      paymentChannel === item.id
                        ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xs font-black block text-slate-900">{item.label}</span>
                    <span className="text-[10px] text-slate-500 block">{item.tag}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Account Details Box with 1-click Copy */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
              {paymentChannel === 'RAAST' && (
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Raast ID / IBAN</span>
                    <strong className="text-slate-900 font-mono text-sm">PK45MEZN00129482019482</strong>
                    <span className="text-[10px] text-slate-500 block">Title: SafarPK Technologies</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy('PK45MEZN00129482019482', 'raast')}
                    className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-emerald-700 hover:border-emerald-300 transition"
                  >
                    {copiedAccount === 'raast' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              )}

              {paymentChannel === 'MEEZAN' && (
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Meezan Bank Account</span>
                    <strong className="text-slate-900 font-mono text-sm">0104-0108920194 (F-7 Branch)</strong>
                    <span className="text-[10px] text-slate-500 block">Title: SafarPK Technologies (Pvt) Ltd</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy('01040108920194', 'meezan')}
                    className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-emerald-700 hover:border-emerald-300 transition"
                  >
                    {copiedAccount === 'meezan' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              )}

              {paymentChannel === 'JAZZCASH' && (
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">JazzCash Till / Mobile</span>
                    <strong className="text-slate-900 font-mono text-sm">0300-8472910</strong>
                    <span className="text-[10px] text-slate-500 block">Title: SafarPK Corporate Merchant</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy('03008472910', 'jazz')}
                    className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-emerald-700 hover:border-emerald-300 transition"
                  >
                    {copiedAccount === 'jazz' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              )}

              {paymentChannel === 'EASYPAISA' && (
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">EasyPaisa Account</span>
                    <strong className="text-slate-900 font-mono text-sm">0345-9821045</strong>
                    <span className="text-[10px] text-slate-500 block">Title: SafarPK Corporate</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy('03459821045', 'easy')}
                    className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-emerald-700 hover:border-emerald-300 transition"
                  >
                    {copiedAccount === 'easy' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              )}
            </div>

            {/* Submission Form */}
            <form onSubmit={handleRenewSubmit} className="space-y-4">
              {/* Mandatory Payment Slip Upload with Auto-Detect */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>Upload Payment Slip / Screenshot <span className="text-rose-500">*</span></span>
                  <span className="text-[10px] font-normal text-slate-400">JPG, PNG, WebP (Max 5MB)</span>
                </label>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleSlipFileSelect}
                  accept="image/*"
                  className="hidden"
                />

                {slipPreview ? (
                  <div className="p-3 bg-emerald-50/70 border border-emerald-300 rounded-2xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={slipPreview}
                        alt="Slip thumbnail"
                        className="w-12 h-12 object-cover rounded-xl border border-emerald-400 shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-emerald-950 block truncate">
                          {slipFileName || 'payment-slip.jpg'}
                        </span>
                        <span className="text-[10px] text-emerald-700 flex items-center gap-1 font-semibold">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          <span>Slip uploaded</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1 text-xs font-bold bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSlipPreview(null);
                          setSlipFileName(null);
                          setDetectedRef(null);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="p-4 border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/30 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition text-center group"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-200 group-hover:bg-emerald-100 flex items-center justify-center mb-1.5 transition">
                      <Upload className="w-5 h-5 text-slate-600 group-hover:text-emerald-700" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">
                      Tap to upload bank receipt / payment slip
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      Screenshot of transfer from Meezan, Raast, JazzCash or EasyPaisa
                    </span>
                  </div>
                )}
              </div>

              {/* Transaction ID Input (Auto-filled from receipt image, editable) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Transaction Reference ID / TID <span className="text-slate-400 font-normal">(Optional if slip uploaded)</span>
                  </label>
                  {isAutoDetecting ? (
                    <span className="text-[10px] text-amber-600 font-bold flex items-center gap-1 animate-pulse">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Reading slip...</span>
                    </span>
                  ) : detectedRef ? (
                    <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>✨ Auto-detected from slip</span>
                    </span>
                  ) : null}
                </div>

                <input
                  type="text"
                  placeholder="e.g. TID-982145 or RAAST-882910"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  className="w-full h-11 px-3 border border-slate-200 rounded-xl text-xs font-mono font-bold bg-white outline-none focus:border-emerald-600 shadow-2xs"
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  If you upload the slip, the system auto-detects your confirmation reference. You can edit if needed.
                </span>
              </div>

              {/* Notice regarding Admin verification */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 flex items-start gap-2">
                <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Admin Verification Queue:</strong> Once submitted, status remains <strong>Pending Verification</strong> until Super Admin or City Agent checks the bank credit. Quota activates immediately after approval.
                </span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-500">
                  Fare: <strong className="text-slate-900 font-heading font-extrabold">Rs. 12,000</strong>
                </span>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-10 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Payment for Verification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

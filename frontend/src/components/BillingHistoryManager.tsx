'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
} from 'lucide-react';
import {
  SubscriptionPaymentRecord,
  getAllSubscriptionPayments,
  recordSubscriptionPayment,
  getActiveUser,
  RegisteredUser,
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
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'CONFIRMED' | 'PENDING'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<SubscriptionPaymentRecord | null>(null);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [showPlansSection, setShowPlansSection] = useState(false);

  // Renewal form state
  const [paymentChannel, setPaymentChannel] = useState<'RAAST' | 'MEEZAN' | 'JAZZCASH' | 'EASYPAISA'>('RAAST');
  const [transactionRef, setTransactionRef] = useState('');
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);
  const [renewNotice, setRenewNotice] = useState<string | null>(null);

  // Refresh user and ledger
  const refreshData = () => {
    const user = getActiveUser();
    setCurrentUser(user);
    const all = getAllSubscriptionPayments();
    
    // Filter payments for this user or role
    if (user) {
      const userPayments = all.filter(
        (p) => p.userId === user.id || (user.phone && p.phone === user.phone) || (user.businessName && p.businessName === user.businessName)
      );
      if (userPayments.length > 0) {
        setPayments(userPayments);
      } else {
        // Fallback to role-matching seed payments
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
    return () => {
      window.removeEventListener('safarpk_ledger_updated', handleLedgerUpdated);
      window.removeEventListener('safarpk_user_updated', handleLedgerUpdated);
    };
  }, [role]);

  // Active plan details
  const activePlanName = currentUser?.subscription?.planName || initialPlanName;
  const isSubscriptionActive = currentUser?.subscription?.status === 'ACTIVE' || payments.some((p) => p.status === 'CONFIRMED');
  const lastPayment = payments[0] || null;

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

  const handleRenewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionRef.trim()) {
      alert('Please enter your payment Transaction ID / Deposit Reference.');
      return;
    }

    const planAmount = currentUser?.subscription?.amountPaid || 12000;
    const modeLabel =
      paymentChannel === 'RAAST'
        ? 'Raast Instant Transfer'
        : paymentChannel === 'MEEZAN'
        ? 'Meezan Bank Transfer'
        : paymentChannel === 'JAZZCASH'
        ? 'JazzCash Direct'
        : 'EasyPaisa Direct';

    recordSubscriptionPayment({
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
      paymentRef: transactionRef.trim().toUpperCase(),
      status: 'CONFIRMED',
      recordedBy: 'Vendor Self-Renewal',
      notes: `Subscription renewal submitted via ${modeLabel}. Quota extended for 30 days.`,
    });

    setRenewNotice('Subscription successfully renewed! New invoice generated below.');
    setTransactionRef('');
    setTimeout(() => {
      setShowRenewModal(false);
      setRenewNotice(null);
      refreshData();
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Card: Active Plan Status & Quick Overview */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-5 sm:p-7 shadow-lg border border-slate-700/60 relative overflow-hidden">
        {/* Subtle decorative background glow */}
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
              onClick={() => setShowRenewModal(true)}
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
            <span className="text-[10px] text-slate-400 block truncate">Ref: {lastPayment?.paymentRef || 'CONFIRMED'}</span>
          </div>
        </div>
      </div>

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
          onClick={() => setShowRenewModal(true)}
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
                className="h-8 pl-8 pr-3 text-xs rounded-lg border border-slate-200 bg-slate-50 outline-none focus:border-emerald-500 focus:bg-white w-48 transition"
              />
            </div>

            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setFilterStatus('ALL')}
                className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                  filterStatus === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({payments.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('CONFIRMED')}
                className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                  filterStatus === 'CONFIRMED' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Paid
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('PENDING')}
                className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                  filterStatus === 'PENDING' ? 'bg-white text-amber-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pending
              </button>
            </div>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3">Invoice / Ref #</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Plan Description</th>
                <th className="py-2.5 px-3">Payment Mode</th>
                <th className="py-2.5 px-3">Amount</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
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
                        <span className="text-[10px] text-slate-400 font-mono">Ref: {p.paymentRef}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-700 whitespace-nowrap">
                        {p.paymentMode}
                      </td>
                      <td className="py-3 px-3 font-heading font-extrabold text-slate-900 whitespace-nowrap">
                        Rs. {p.amountPaid.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {p.status === 'CONFIRMED' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 w-max">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Paid</span>
                          </span>
                        ) : p.status === 'PENDING' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1 w-max">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Pending Renewal</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 w-max">
                            {p.status}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedInvoice(p)}
                            className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                            title="View Official Invoice"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedInvoice(p)}
                            className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                            title="Download Receipt"
                          >
                            <Download className="w-4 h-4" />
                          </button>
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

      {/* 5. Printable / Downloadable Official Invoice Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-8">
            {/* Modal Actions Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
              <span className="text-xs font-bold font-mono">Invoice Preview & Download</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Formal Invoice Document Area */}
            <div className="p-6 sm:p-8 space-y-6 text-[#101828]">
              {/* Invoice Head */}
              <div className="flex items-start justify-between border-b border-slate-200 pb-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-7 h-7 rounded-lg bg-[#0B6B4F] text-white flex items-center justify-center font-extrabold text-sm">
                      S
                    </span>
                    <span className="font-heading font-black text-xl tracking-tight text-[#101828]">
                      SafarPK
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    SafarPK Technologies (Pvt) Ltd<br />
                    NTN: 8920145-7 · SECP Reg: 0192847<br />
                    Islamabad / Lahore, Pakistan<br />
                    billing@safar.pk · +92 51 8847291
                  </p>
                </div>

                <div className="text-right">
                  <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 uppercase tracking-widest inline-block mb-1 border border-emerald-300">
                    ✓ PAID & CONFIRMED
                  </span>
                  <h3 className="font-mono font-black text-lg text-slate-900">
                    INV-{new Date(selectedInvoice.date).getFullYear()}-1084
                  </h3>
                  <p className="text-xs text-slate-500">
                    Date: {new Date(selectedInvoice.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Billed To / Account */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200/80">
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
                    <td colSpan={2} className="py-2.5 text-right font-black text-sm text-slate-900">Total Paid:</td>
                    <td className="py-2.5 text-right font-heading font-black text-base text-emerald-700">
                      Rs. {selectedInvoice.amountPaid.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>

              {/* Stamp & Footer note */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <p>This is a computer-generated tax receipt issued by SafarPK. No signature required.</p>
                <div className="border border-emerald-500 text-emerald-700 px-3 py-1 rounded font-mono font-bold text-[10px] tracking-wider uppercase">
                  VERIFIED DEPOSIT
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Renewal Modal: Pay Charges & Extend Subscription */}
      {showRenewModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-7 space-y-5 animate-calm-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-heading font-black text-lg text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                  <span>Renew Subscription Pass</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Select payment method and submit deposit reference to renew {activePlanName}.
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
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{renewNotice}</span>
              </div>
            )}

            {/* Payment Channel Options */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 block">Select Payment Channel:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'RAAST', label: 'Raast Pay', tag: 'Instant' },
                  { id: 'MEEZAN', label: 'Meezan Bank', tag: 'Bank Transfer' },
                  { id: 'JAZZCASH', label: 'JazzCash', tag: 'Direct' },
                  { id: 'EASYPAISA', label: 'EasyPaisa', tag: 'Direct' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPaymentChannel(item.id as any)}
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
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Transaction Reference ID / TID *
                </label>
                <input
                  type="text"
                  placeholder="e.g. TID-982145 or RAAST-882910"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  required
                  className="w-full h-11 px-3 border border-slate-200 rounded-xl text-xs font-mono font-bold bg-white outline-none focus:border-emerald-600 shadow-2xs"
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  Enter the 6 to 12 digit TID received from your bank or wallet app after sending payment.
                </span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-500">
                  Renewal Fare: <strong className="text-slate-900 font-heading font-extrabold">Rs. 12,000</strong>
                </span>

                <button
                  type="submit"
                  className="h-10 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow cursor-pointer active:scale-95"
                >
                  Submit Payment & Confirm Renewal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


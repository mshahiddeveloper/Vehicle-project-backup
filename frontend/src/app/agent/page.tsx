'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  CreditCard,
  User,
  Car,
  Clock,
  ArrowRight,
  MessageCircle,
  Search,
  ExternalLink,
  PlusCircle,
  Upload,
  Receipt,
  Check,
  X,
  FileCheck,
} from 'lucide-react';
import { API_BASE, formatPKR, maskCnic, maskPhone } from '@/lib/api';

export default function AgentDashboardPage() {
  const [activeTab, setActiveTab] = useState<
    'listings' | 'payments' | 'lookup' | 'manual_lister' | 'drivers' | 'complaints' | 'permissions'
  >('listings');

  // Agent Profile (Created by Super Admin)
  const agentName = 'Agent Farhan (Lahore Desk)';
  const agentStaffId = 'AG-101';
  const agentRole = 'Senior Compliance & Verification Officer';

  // Caller & Dispute Search Desk State
  const [callerSearchQuery, setCallerSearchQuery] = useState('');
  const [callerCategory, setCallerCategory] = useState<'ALL' | 'CUSTOMER' | 'LISTER' | 'DRIVER' | 'SHUTTLE' | 'CARGO'>('ALL');
  const [selectedCallerModal, setSelectedCallerModal] = useState<any | null>(null);
  const [callerNotice, setCallerNotice] = useState<string | null>(null);

  const [callerDirectory, setCallerDirectory] = useState<any[]>([
    {
      id: 'usr-1',
      name: 'Hamza Tariq',
      phone: '+92 300 8472910',
      cnic: '35202-8172910-3',
      role: 'CUSTOMER',
      city: 'Lahore',
      license: 'LHR-DL-449102',
      recentBookingRef: 'BKG-8492',
      bookingStatus: 'CONFIRMED',
      assignedVehicle: 'Toyota Corolla Altis Grande 2024 (LEA-24-9988)',
      activeComplaint: 'A/C gas check requested for DHA Phase 5 trip',
      verificationStatus: 'VERIFIED',
    },
    {
      id: 'usr-2',
      name: 'Salman Tariq (Salman Rent a Car)',
      phone: '+92 300 1234567',
      cnic: '35201-1234567-1',
      role: 'LISTER',
      city: 'Lahore',
      businessName: 'Salman Rent a Car & Luxury Fleets',
      fbrNtn: '7819201-3 (ATL Active)',
      activeListingsCount: 3,
      subscriptionPlan: 'Professional Fleet (15 Vehicles)',
      recentBookingRef: 'BKG-8492',
      verificationStatus: 'VERIFIED',
    },
    {
      id: 'usr-3',
      name: 'Tariq Mahmood',
      phone: '+92 301 9821045',
      cnic: '35201-4412098-5',
      role: 'DRIVER',
      city: 'Lahore',
      license: 'LHR-DL-449102 (PSV / LTV Commercial)',
      dailyRate: 2500,
      tripsCompleted: 142,
      assignedVehicle: 'Toyota HiAce Grand Cabin (LEA-24-9988)',
      verificationStatus: 'VERIFIED',
    },
    {
      id: 'usr-4',
      name: 'Al-Makkah Commute Express',
      phone: '+92 321 4409124',
      cnic: '35202-5561029-7',
      role: 'SHUTTLE',
      city: 'Lahore',
      route: 'Johar Town ➔ Gulberg Main Blvd (14 Seats)',
      monthlyFare: 8500,
      activeVehicle: 'Toyota HiAce Grand Cabin (LEA-24-9988)',
      verificationStatus: 'VERIFIED',
    },
    {
      id: 'usr-5',
      name: 'Pak Movers & Shifting Logistics',
      phone: '+92 300 9988776',
      cnic: '35201-7788192-3',
      role: 'CARGO',
      city: 'Lahore',
      vehicle: 'Hyundai Shehzore D-100 Shifting Truck',
      capacityTons: 2.5,
      verificationStatus: 'VERIFIED',
    },
    {
      id: 'usr-6',
      name: 'Ayesha Malik',
      phone: '+92 321 9988771',
      cnic: '35201-8849201-4',
      role: 'CUSTOMER',
      city: 'Islamabad',
      recentBookingRef: 'BKG-4412',
      bookingStatus: 'CONFIRMED',
      assignedVehicle: 'Honda Civic Oriel Turbo 2024 (ISB-24-4412)',
      verificationStatus: 'VERIFIED',
    },
  ]);

  // Agent Granular Permissions (granted by Super Admin)
  const permissions = {
    canVerifyCnic: true,
    canVerifyLicense: true,
    canEditCustomer: true,
    canEditLister: true,
    canCreateListerManual: true,
    canApproveSubscription: true,
    canDeleteListings: false,
    canViewUnmaskedData: false,
  };

  // Pending Vehicle Listings Queue
  const [pendingListings, setPendingListings] = useState<any[]>([
    {
      id: 'lst-pend-1',
      listingRef: 'LST-992104',
      vehicleTitle: 'Toyota Corolla Altis Grande 2024',
      listerName: 'Salman Rent a Car & Tours',
      listerPhone: '+923001234567',
      city: 'Islamabad',
      regNumber: 'LEA-24-9988',
      chassisNumber: 'NZE141-9081245',
      engineNumber: '1NZ-FE-829104',
      ownerCnic: '35201-9876543-1',
      dailyRate: 8500,
      submittedAt: '2026-11-10T08:30:00Z',
      photosCount: 6,
      documentsStatus: 'ALL_ATTACHED',
      img: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 'lst-pend-2',
      listingRef: 'LST-551029',
      vehicleTitle: 'Hyundai Shehzore D-100 Shifting Pickup',
      listerName: 'Al-Makkah Transport Logistics',
      listerPhone: '+923214409124',
      city: 'Lahore',
      regNumber: 'LHR-SH-202',
      chassisNumber: 'HY-SH-4491024',
      engineNumber: 'D4BB-88910',
      ownerCnic: '35202-4410291-5',
      dailyRate: 4500,
      submittedAt: '2026-11-10T09:15:00Z',
      photosCount: 4,
      documentsStatus: 'ALL_ATTACHED',
      img: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=600&auto=format&fit=crop&q=80',
    },
  ]);

  // Pending Payments Queue
  const [pendingPayments, setPendingPayments] = useState<any[]>([
    {
      id: 'pay-1',
      referenceNumber: 'TX-MEEZAN-99210',
      listerName: 'Salman Rent a Car & Tours',
      phone: '+923001234567',
      planName: 'Professional Fleet (15 Vehicles)',
      amount: 12000,
      method: 'MEEZAN_BANK_TRANSFER',
      proofSlip: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&auto=format&fit=crop&q=80',
      submittedAt: '2026-11-10T07:45:00Z',
    },
  ]);

  // Rejection Notice Modal State
  const [rejectingItem, setRejectingItem] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Photos blurry or missing clear view of Excise Registration Smart Card.');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // =========================================================================
  // MANUAL LISTER REGISTRATION FORM (AGENT DESK)
  // =========================================================================
  const [manualListerForm, setManualListerForm] = useState({
    businessName: '',
    ownerName: '',
    ownerCnic: '',
    phone: '+92 300 ',
    city: 'Lahore',
    category: 'CAR_RENTAL',
    selectedPlan: 'PROFESSIONAL_FLEET', // Starter (3,500), Professional (12,000), Enterprise (30,000)
    officialTariff: 12000,
    collectedFee: 12000,
    paymentMethod: 'JAZZCASH_TILL',
    trnRef: '',
    paymentSlipUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&auto=format&fit=crop&q=80',
    paymentSlipName: 'jazzcash_receipt_stamp.jpg',
  });

  const handlePlanChange = (plan: string) => {
    let tariff = 12000;
    if (plan === 'STARTER') tariff = 3500;
    if (plan === 'PROFESSIONAL_FLEET') tariff = 12000;
    if (plan === 'ENTERPRISE_HUB') tariff = 30000;
    setManualListerForm((prev) => ({
      ...prev,
      selectedPlan: plan,
      officialTariff: tariff,
      collectedFee: tariff,
    }));
  };

  const handleManualListerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualListerForm.businessName || !manualListerForm.ownerCnic || !manualListerForm.trnRef) {
      alert('Please fill all required fields and enter the Payment Transaction Reference.');
      return;
    }

    // Stealth Audit Logging (Invisible to the agent)
    try {
      const isFeeDiscrepant = manualListerForm.collectedFee < manualListerForm.officialTariff;
      const stealthLog = {
        id: `stl-${Date.now()}`,
        timestamp: new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' }) + ' PKT',
        agentName,
        staffId: agentStaffId,
        branch: 'Lahore Desk',
        ipAddress: '192.168.1.18 (Terminal-LHR-01)',
        actionType: 'MANUAL_LISTER_CREATE',
        actionDesc: `Created Lister Profile: "${manualListerForm.businessName}" (${manualListerForm.city})`,
        targetEntity: `Lister: ${manualListerForm.businessName}`,
        officialTariff: manualListerForm.officialTariff,
        feeReported: manualListerForm.collectedFee,
        isSuspicious: isFeeDiscrepant,
        suspicionReason: isFeeDiscrepant
          ? `CRITICAL TARIFF DEFICIT (-PKR ${formatPKR(manualListerForm.officialTariff - manualListerForm.collectedFee)}): Agent reported PKR ${formatPKR(manualListerForm.collectedFee)} against mandatory PKR ${formatPKR(manualListerForm.officialTariff)} tariff. Verify possible unauthorized discount or offline side-arrangement.`
          : 'Tariff Reconciled (100% schedule match)',
        paymentMethod: manualListerForm.paymentMethod,
        trnRef: manualListerForm.trnRef,
        paymentProofUrl: manualListerForm.paymentSlipUrl,
      };

      if (typeof window !== 'undefined') {
        const existingLogs = JSON.parse(localStorage.getItem('safarpk_stealth_audit_logs') || '[]');
        localStorage.setItem('safarpk_stealth_audit_logs', JSON.stringify([stealthLog, ...existingLogs]));
      }
    } catch (err) {
      // silently proceed
    }

    setActionNotice(`✅ Lister Profile "${manualListerForm.businessName}" successfully registered! Payment proof TX-${manualListerForm.trnRef} archived.`);
    setManualListerForm({
      businessName: '',
      ownerName: '',
      ownerCnic: '',
      phone: '+92 300 ',
      city: 'Lahore',
      category: 'CAR_RENTAL',
      selectedPlan: 'PROFESSIONAL_FLEET',
      officialTariff: 12000,
      collectedFee: 12000,
      paymentMethod: 'JAZZCASH_TILL',
      trnRef: '',
      paymentSlipUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&auto=format&fit=crop&q=80',
      paymentSlipName: 'jazzcash_receipt_stamp.jpg',
    });
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleApproveListing = (id: string, ref: string) => {
    setPendingListings(pendingListings.filter((l) => l.id !== id));
    setActionNotice(`✅ Vehicle Listing ${ref} APPROVED & Published LIVE on SafarPK.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleRejectListing = () => {
    if (!rejectingItem) return;
    const phone = rejectingItem.listerPhone?.replace(/[^0-9]/g, '') || '923001234567';
    const waText = `As-salamu alaykum ${rejectingItem.listerName}! Regarding your vehicle listing (${rejectingItem.listingRef} - ${rejectingItem.vehicleTitle}) on SafarPK:\n\nOur compliance officer noted: "${rejectionReason}".\n\nPlease login to your Lister Dashboard (http://localhost:3000/lister) to re-upload clear documents.`;
    
    // Open WhatsApp rejection notice to lister
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(waText)}`, '_blank');

    setPendingListings(pendingListings.filter((l) => l.id !== rejectingItem.id));
    setActionNotice(`❌ Vehicle Listing ${rejectingItem.listingRef} rejected. Rejection notice sent to lister on WhatsApp.`);
    setRejectingItem(null);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleApprovePayment = (id: string, ref: string) => {
    setPendingPayments(pendingPayments.filter((p) => p.id !== id));
    setActionNotice(`✅ Subscription Payment ${ref} verified! Lister account quota updated.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
                S
              </div>
              <span className="font-extrabold text-xl text-white tracking-tight">SafarPK Staff Desk</span>
            </Link>
            <span className="hidden sm:inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-900/60 text-blue-200 border border-blue-700">
              Staff ID: {agentStaffId} · {agentRole}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs font-bold px-3 py-1.5 rounded-xl text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
            >
              Public Website
            </Link>
            <div className="flex items-center gap-2 pl-2 border-l border-slate-700 text-xs">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center">
                👮
              </div>
              <span className="font-bold text-slate-200">{agentName}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Nav */}
        <aside className="space-y-1">
          <nav className="bg-white rounded-2xl border border-slate-200 p-2 space-y-1 shadow-xs text-xs font-semibold">
            {[
              { id: 'listings', label: 'Listing Approvals Queue', icon: Car, badge: pendingListings.length },
              { id: 'payments', label: 'Payment Verifications', icon: CreditCard, badge: pendingPayments.length },
              { id: 'lookup', label: '🔍 Caller & Dispute Search Desk', icon: Search },
              { id: 'manual_lister', label: '➕ Register Walk-in Lister', icon: PlusCircle },
              { id: 'drivers', label: 'Driver License Audits', icon: User, badge: 3 },
              { id: 'complaints', label: 'Customer Complaints', icon: AlertCircle, badge: 1 },
              { id: 'permissions', label: 'My Permissions & Scope', icon: ShieldCheck },
            ].map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition cursor-pointer ${
                    active
                      ? 'bg-blue-600 text-white shadow-sm font-bold'
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
        </aside>

        {/* Canvas */}
        <main className="lg:col-span-3 space-y-6">
          {actionNotice && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 text-xs font-bold flex items-center justify-between">
              <span>{actionNotice}</span>
              <button onClick={() => setActionNotice(null)} className="text-emerald-700 hover:text-emerald-900">✕</button>
            </div>
          )}

          {/* TAB 1: LISTING APPROVALS */}
          {activeTab === 'listings' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Pending Vehicle Listings Queue ({pendingListings.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Verify Registration Book / Smart Card, Chassis number, Engine number, and Owner NADRA CNIC before approving.
                  </p>
                </div>
              </div>

              {pendingListings.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  ✓ All pending listings have been reviewed and audited.
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingListings.map((l) => (
                    <div key={l.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <img src={l.img} alt={l.vehicleTitle} className="w-24 h-16 object-cover rounded-xl border border-slate-200" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                {l.listingRef}
                              </span>
                              <h4 className="font-bold text-sm text-slate-900">{l.vehicleTitle}</h4>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              Lister: <strong>{l.listerName}</strong> ({l.listerPhone}) · City: {l.city}
                            </p>
                            <span className="text-xs font-black text-slate-900 mt-1 block">Daily Rent: PKR {formatPKR(l.dailyRate)}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApproveListing(l.id, l.listingRef)}
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve & Make LIVE</span>
                          </button>
                          <button
                            onClick={() => setRejectingItem(l)}
                            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject with Notice</span>
                          </button>
                        </div>
                      </div>

                      {/* Extracted OCR Verification Grid */}
                      <div className="p-3 bg-white rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 font-semibold block">Excise Reg #</span>
                          <span className="font-mono font-bold text-slate-800">{l.regNumber}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-semibold block">Chassis #</span>
                          <span className="font-mono font-bold text-slate-800">{l.chassisNumber}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-semibold block">Engine #</span>
                          <span className="font-mono font-bold text-slate-800">{l.engineNumber}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-semibold block">Owner CNIC</span>
                          <span className="font-mono font-bold text-slate-800">{maskCnic(l.ownerCnic)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PAYMENT VERIFICATIONS */}
          {activeTab === 'payments' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <h3 className="font-extrabold text-base text-slate-900">Subscription Payment Proofs ({pendingPayments.length})</h3>
              <p className="text-xs text-slate-500">Inspect Meezan Bank & Easypaisa transaction slips uploaded by listers.</p>

              <div className="space-y-3">
                {pendingPayments.map((p) => (
                  <div key={p.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {p.referenceNumber}
                        </span>
                        <h4 className="font-bold text-xs text-slate-900">{p.planName}</h4>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Lister: {p.listerName} ({p.phone}) · Amount: <strong>PKR {formatPKR(p.amount)}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={p.proofSlip}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 transition flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>View Slip</span>
                      </a>
                      <button
                        onClick={() => handleApprovePayment(p.id, p.referenceNumber)}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                      >
                        Verify & Activate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2B: CALLER & DISPUTE SEARCH DESK (FOR CALL-IN COMPLAINTS & INQUIRIES) */}
          {activeTab === 'lookup' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                    <Search className="w-5 h-5 text-blue-600" />
                    <span>Caller & Complaint Search Desk</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Live call center lookups. Search any caller by Name, Phone (+92), NADRA CNIC, or Booking ID to resolve complaints on-call.
                  </p>
                </div>
                <span className="text-xs font-bold bg-blue-50 text-blue-800 px-3 py-1 rounded-full border border-blue-200 self-start sm:self-auto">
                  Desk Active: {agentStaffId}
                </span>
              </div>

              {callerNotice && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between">
                  <span>{callerNotice}</span>
                  <button onClick={() => setCallerNotice(null)} className="text-emerald-700 font-bold">✕</button>
                </div>
              )}

              {/* Search Bar & Role Filter */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={callerSearchQuery}
                    onChange={(e) => setCallerSearchQuery(e.target.value)}
                    placeholder="Search caller by Name, WhatsApp number (+92 3xx), CNIC, or Booking ref (e.g. BKG-8492)..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-500 outline-none transition"
                  />
                  {callerSearchQuery && (
                    <button
                      onClick={() => setCallerSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Role Tabs */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  {[
                    { id: 'ALL', label: 'All Callers' },
                    { id: 'CUSTOMER', label: 'Customers' },
                    { id: 'LISTER', label: 'Fleet Owners (Listers)' },
                    { id: 'DRIVER', label: 'Drivers' },
                    { id: 'SHUTTLE', label: 'Pick & Drop Providers' },
                    { id: 'CARGO', label: 'Cargo Movers' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setCallerCategory(cat.id as any)}
                      className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                        callerCategory === cat.id
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Directory Search Results */}
              <div className="space-y-3">
                {callerDirectory
                  .filter((c) => {
                    const matchesCat = callerCategory === 'ALL' || c.role === callerCategory;
                    const q = callerSearchQuery.toLowerCase().trim();
                    const matchesQ =
                      !q ||
                      c.name.toLowerCase().includes(q) ||
                      c.phone.toLowerCase().includes(q) ||
                      c.cnic.toLowerCase().includes(q) ||
                      (c.recentBookingRef && c.recentBookingRef.toLowerCase().includes(q)) ||
                      (c.businessName && c.businessName.toLowerCase().includes(q)) ||
                      (c.city && c.city.toLowerCase().includes(q));
                    return matchesCat && matchesQ;
                  })
                  .map((caller) => (
                    <div
                      key={caller.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition space-y-3 text-xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/80">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            caller.role === 'CUSTOMER'
                              ? 'bg-purple-100 text-purple-800'
                              : caller.role === 'LISTER'
                              ? 'bg-blue-100 text-blue-800'
                              : caller.role === 'DRIVER'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {caller.role}
                          </span>
                          <strong className="text-sm font-black text-slate-900">{caller.name}</strong>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-600 font-semibold">{caller.city}</span>
                        </div>
                        <span className="font-mono font-bold text-xs text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                          {caller.phone}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-400 block text-[10px]">NADRA CNIC</span>
                          <span className="font-mono font-bold text-slate-800">{caller.cnic}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Associated Reference</span>
                          <span className="font-mono font-bold text-emerald-800">
                            {caller.recentBookingRef || caller.fbrNtn || `${caller.activeListingsCount || 0} Listings`}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">License / Tax Status</span>
                          <span className="font-bold text-slate-800">
                            {caller.license || caller.fbrNtn || caller.subscriptionPlan || 'Verified'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Compliance Clearance</span>
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                            ✓ {caller.verificationStatus}
                          </span>
                        </div>
                      </div>

                      {/* Active Caller Complaint Banner */}
                      {caller.activeComplaint && (
                        <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-xl text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                            <span><strong>Active Caller Inquiry:</strong> {caller.activeComplaint}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setCallerDirectory(
                                callerDirectory.map((c) =>
                                  c.id === caller.id ? { ...c, activeComplaint: null } : c
                                )
                              );
                              setCallerNotice(`✅ Issue marked resolved for ${caller.name} by ${agentName}.`);
                            }}
                            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[10px] shrink-0 cursor-pointer"
                          >
                            Mark Issue Resolved
                          </button>
                        </div>
                      )}

                      {/* Action Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/60">
                        <span className="text-[10px] text-slate-500">
                          Assigned: <strong>{caller.assignedVehicle || caller.vehicle || caller.route || 'General Profile'}</strong>
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedCallerModal(caller)}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5 text-blue-400" />
                            <span>Inspect Full Record</span>
                          </button>
                          <a
                            href={`https://wa.me/${caller.phone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(caller.name)},%20this%20is%20Agent%20Farhan%20from%20SafarPK%20Compliance%20Desk%20regarding%20your%20account.`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp Caller</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TAB 3: REGISTER WALK-IN / ASSISTED LISTER (WITH MANDATORY PAYMENT PROOF) */}
          {activeTab === 'manual_lister' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-base text-slate-900">
                  Register Walk-in / Assisted Lister Profile
                </h3>
                <p className="text-xs text-slate-500">
                  As an authorized SafarPK agent, you can register fleet owners directly. All cash/transfers must be reconciled with official tariffs and accompanied by proof of payment.
                </p>
              </div>

              <form onSubmit={handleManualListerSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Business / Agency Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Royal Punjab Car Rentals"
                      value={manualListerForm.businessName}
                      onChange={(e) => setManualListerForm({ ...manualListerForm, businessName: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Owner Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mian Tariq"
                      value={manualListerForm.ownerName}
                      onChange={(e) => setManualListerForm({ ...manualListerForm, ownerName: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Owner NADRA CNIC *</label>
                    <input
                      type="text"
                      required
                      placeholder="35202-*******-*"
                      value={manualListerForm.ownerCnic}
                      onChange={(e) => setManualListerForm({ ...manualListerForm, ownerCnic: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Contact Phone (+92) *</label>
                    <input
                      type="text"
                      required
                      value={manualListerForm.phone}
                      onChange={(e) => setManualListerForm({ ...manualListerForm, phone: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Operating City</label>
                    <input
                      type="text"
                      required
                      value={manualListerForm.city}
                      onChange={(e) => setManualListerForm({ ...manualListerForm, city: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
                    />
                  </div>
                </div>

                {/* Subscription Plan & Tariff */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <span className="font-black text-slate-800 block text-xs">Assigned Subscription Plan & Fee Schedule:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {[
                      { id: 'STARTER', name: 'Starter Fleet (1-2 Cars)', price: 3500 },
                      { id: 'PROFESSIONAL_FLEET', name: 'Professional Fleet (15 Cars)', price: 12000 },
                      { id: 'ENTERPRISE_HUB', name: 'Enterprise Hub (50 Cars)', price: 30000 },
                    ].map((plan) => (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => handlePlanChange(plan.id)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                          manualListerForm.selectedPlan === plan.id
                            ? 'bg-blue-50 border-blue-600 text-blue-900 ring-2 ring-blue-500/20'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <strong className="block text-xs">{plan.name}</strong>
                        <span className="text-xs font-bold text-emerald-700">PKR {formatPKR(plan.price)} / mo</span>
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Official Tariff</label>
                      <input
                        type="text"
                        disabled
                        value={`PKR ${formatPKR(manualListerForm.officialTariff)}`}
                        className="w-full p-2.5 bg-slate-200 border border-slate-300 rounded-xl font-bold text-slate-700"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Fee Collected by Agent (PKR) *</label>
                      <input
                        type="number"
                        required
                        value={manualListerForm.collectedFee}
                        onChange={(e) => setManualListerForm({ ...manualListerForm, collectedFee: Number(e.target.value) })}
                        className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-emerald-700"
                      />
                    </div>
                  </div>
                </div>

                {/* Mandatory Payment Proof Upload */}
                <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-amber-900 font-bold">
                    <Receipt className="w-4 h-4 text-amber-700" />
                    <span>Mandatory Proof of Payment Verification</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    SafarPK audit rules require attaching the bank slip, JazzCash screenshot, or cash receipt voucher for all manual onboardings.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Payment Method</label>
                      <select
                        value={manualListerForm.paymentMethod}
                        onChange={(e) => setManualListerForm({ ...manualListerForm, paymentMethod: e.target.value })}
                        className="w-full p-2.5 border border-slate-300 rounded-xl font-semibold bg-white"
                      >
                        <option value="JAZZCASH_TILL">JazzCash Till / Merchant QR</option>
                        <option value="EASYPAISA_MERCHANT">EasyPaisa Merchant</option>
                        <option value="MEEZAN_BANK_TRANSFER">Meezan Bank Raast / IBFT</option>
                        <option value="CASH_COUNTER_RECEIPT">Office Cash Counter Deposit</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Transaction Ref / Slip # *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. JC-8921849102-PK"
                        value={manualListerForm.trnRef}
                        onChange={(e) => setManualListerForm({ ...manualListerForm, trnRef: e.target.value })}
                        className="w-full p-2.5 border border-slate-300 rounded-xl font-mono"
                      />
                    </div>
                  </div>

                  {/* Payment Slip Upload Preview */}
                  <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <FileCheck className="w-5 h-5 text-emerald-600" />
                      <div>
                        <span className="font-bold text-slate-800 block text-xs">{manualListerForm.paymentSlipName}</span>
                        <span className="text-[10px] text-slate-400">Attached Payment Voucher Slip (Verified)</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => alert('Using verified electronic payment slip.')}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                    >
                      Change Slip
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Submit & Onboard Lister</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: DRIVER LICENSE AUDITS */}
          {activeTab === 'drivers' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <h3 className="font-extrabold text-base text-slate-900">Driver License Compliance Audits</h3>
              <p className="text-xs text-slate-500">Cross-reference provincial traffic police driving licenses and police character certificates.</p>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                <div>
                  <strong className="text-slate-900 block">Tariq Mahmood (LHR-DL-449102)</strong>
                  <span className="text-[11px] text-slate-500">LTV / HTV Commercial License · Expiry: 2028-11-20</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  ✓ Verified by Compliance
                </span>
              </div>
            </div>
          )}

          {/* TAB 5: COMPLAINTS */}
          {activeTab === 'complaints' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <h3 className="font-extrabold text-base text-slate-900">Customer Complaints & Dispute Log</h3>
              <p className="text-xs text-slate-500">Customer reports regarding vehicle mechanical failure or provider cancellations.</p>

              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs space-y-1">
                <div className="flex items-center justify-between font-bold text-amber-900">
                  <span>Booking Ref: BKG-8492</span>
                  <span className="text-[10px] bg-amber-200 px-2 py-0.5 rounded">Under Review</span>
                </div>
                <p className="text-slate-700 text-[11px]">Customer requested air conditioning gas check upon vehicle delivery in DHA Phase 5.</p>
              </div>
            </div>
          )}

          {/* TAB 6: PERMISSIONS */}
          {activeTab === 'permissions' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <h3 className="font-extrabold text-base text-slate-900">My Permissions & Operational Scope</h3>
              <p className="text-xs text-slate-500">Granted by SafarPK Super Admin Root Authority.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {Object.entries(permissions).map(([key, val]) => (
                  <div key={key} className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                    <span className="font-bold text-slate-700">{key}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      val ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {val ? 'GRANTED' : 'DENIED'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Rejection Modal */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-black text-base text-slate-900">
              Reject Listing: {rejectingItem.listingRef}
            </h3>
            <p className="text-xs text-slate-500">
              Select standard rejection reason. A direct WhatsApp message with this notice will open so the lister can rectify the issue immediately.
            </p>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Rejection Reason</label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-slate-50"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRejectingItem(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectListing}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Send WhatsApp Notice & Reject</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CALLER INSPECTION & DISPUTE RESOLUTION MODAL */}
      {selectedCallerModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={() => setSelectedCallerModal(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100 my-auto text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  🔍
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Call Center User & Dispute Record
                  </h3>
                  <span className="text-[10px] text-blue-700 font-bold">
                    Agent Investigation & Assistance Desk
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedCallerModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Profile Overview */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Subject Name</span>
                  <strong className="text-sm text-slate-900">{selectedCallerModal.name}</strong>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                  {selectedCallerModal.role}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div>
                  <span className="text-slate-400 block text-[10px]">Direct Phone:</span>
                  <span className="font-mono font-bold text-slate-900">{selectedCallerModal.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">NADRA CNIC:</span>
                  <span className="font-mono font-bold text-slate-900">{selectedCallerModal.cnic}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Operating City:</span>
                  <span className="font-bold text-slate-800">{selectedCallerModal.city}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Account Clearance:</span>
                  <span className="font-bold text-emerald-700">✓ {selectedCallerModal.verificationStatus}</span>
                </div>
              </div>
            </div>

            {/* Association & Booking Data */}
            <div className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-200 space-y-2">
              <span className="font-bold text-blue-950 block text-xs">Active Asset / Booking Details:</span>
              <div className="text-[11px] space-y-1 text-slate-700">
                <p>
                  <strong>Assigned Asset:</strong> {selectedCallerModal.assignedVehicle || selectedCallerModal.vehicle || selectedCallerModal.route || selectedCallerModal.businessName || 'General Account'}
                </p>
                {selectedCallerModal.recentBookingRef && (
                  <p>
                    <strong>Recent Booking:</strong> <span className="font-mono text-blue-800 font-bold">{selectedCallerModal.recentBookingRef}</span> ({selectedCallerModal.bookingStatus || 'CONFIRMED'})
                  </p>
                )}
                {selectedCallerModal.fbrNtn && (
                  <p>
                    <strong>FBR Tax Registration:</strong> <span className="font-mono text-slate-800 font-bold">{selectedCallerModal.fbrNtn}</span>
                  </p>
                )}
                {selectedCallerModal.license && (
                  <p>
                    <strong>Driving License:</strong> <span className="font-mono text-slate-800 font-bold">{selectedCallerModal.license}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Dispute / Inquiry Status */}
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 space-y-1.5">
              <span className="font-bold text-amber-950 block text-xs">Call Center Inquiry Log:</span>
              <p className="text-[11px] text-amber-900">
                {selectedCallerModal.activeComplaint || 'No active complaints logged. Caller inquiring about booking confirmation and document verification.'}
              </p>
            </div>

            {/* Agent Actions */}
            <div className="space-y-2 pt-1">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCallerDirectory(
                      callerDirectory.map((c) =>
                        c.id === selectedCallerModal.id ? { ...c, activeComplaint: null, verificationStatus: 'VERIFIED (Agent Cleared)' } : c
                      )
                    );
                    setCallerNotice(`✅ Issue resolved & cleared for ${selectedCallerModal.name} by ${agentName}.`);
                    setSelectedCallerModal(null);
                  }}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition cursor-pointer"
                >
                  ✓ Mark Dispute Resolved & Clear Caller
                </button>
                <a
                  href={`https://wa.me/${selectedCallerModal.phone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(selectedCallerModal.name)},%20this%20is%20Agent%20Farhan%20from%20SafarPK%20following%20up%20on%20your%20call.`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCallerModal(null)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

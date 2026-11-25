'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/AppHeader';
import { AppFooter } from '@/components/AppFooter';
import { MobileNavBar } from '@/components/MobileNavBar';
import {
  ShieldCheck,
  KeyRound,
  Copy,
  Check,
  ArrowRight,
  ExternalLink,
  Car,
  User,
  Bus,
  Truck,
  Building2,
  Sparkles,
  Lock,
  LogIn,
  CheckCircle2,
  RefreshCw,
  Search,
} from 'lucide-react';
import { setActiveUser } from '@/data/userAuth';

interface TestAccount {
  id: string;
  roleName: string;
  roleBadge: string;
  badgeColor: string;
  category: 'ADMIN' | 'LISTER' | 'DRIVER' | 'PROVIDER' | 'CUSTOMER';
  name: string;
  businessName?: string;
  city: string;
  phone: string;
  email: string;
  password: string;
  assignedInventory: string;
  targetDashboard: string;
  isStaff?: boolean;
}

const TEST_ACCOUNTS: TestAccount[] = [
  // 1. Super Admin
  {
    id: 'staff-superadmin',
    roleName: 'Super Admin (Platform Command)',
    roleBadge: 'SUPER_ADMIN',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    category: 'ADMIN',
    name: 'SafarPK Enterprise Super Admin',
    businessName: 'SafarPK Central Operations (Isolated platform_staff table)',
    city: 'Islamabad',
    phone: '+923000000001',
    email: 'superadmin@safarpk.com',
    password: 'SuperAdmin@SafarPK2026!',
    assignedInventory: 'Full platform oversight, KYC verification, listings pause/unpause, tamper-evident audit logs',
    targetDashboard: '/admin',
    isStaff: true,
  },
  // 2. Staff Agent
  {
    id: 'staff-agent',
    roleName: 'Verification & Compliance Agent',
    roleBadge: 'AGENT',
    badgeColor: 'bg-sky-500/20 text-sky-400 border border-sky-500/30',
    category: 'ADMIN',
    name: 'Kashif Verification Agent',
    businessName: 'SafarPK KYC & Onboarding Desk',
    city: 'Islamabad',
    phone: '+923000000002',
    email: 'agent@safarpk.com',
    password: 'Agent@SafarPK2026!',
    assignedInventory: 'Partner KYC review, license validation, and listing compliance',
    targetDashboard: '/admin',
    isStaff: true,
  },
  // 3. Karachi Lister
  {
    id: 'lister-karachi',
    roleName: 'Karachi Fleet Host',
    roleBadge: 'LISTER',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    category: 'LISTER',
    name: 'Ahmed Executive Motors',
    businessName: 'Ahmed Executive Motors Karachi',
    city: 'Karachi',
    phone: '+923214455667',
    email: 'ahmed.karachi@safarpk.com',
    password: 'Lister@Karachi2026!',
    assignedInventory: 'Suzuki Alto VXL AGS (PKR 3,500/day), Toyota Yaris ATIV X (PKR 5,500/day), Suzuki Cultus VXL',
    targetDashboard: '/lister',
  },
  // 4. Lahore Lister
  {
    id: 'lister-lahore',
    roleName: 'Lahore Fleet Host',
    roleBadge: 'LISTER',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    category: 'LISTER',
    name: 'Zubair Car Rentals',
    businessName: 'Zubair Luxury Fleet Lahore',
    city: 'Lahore',
    phone: '+923008472910',
    email: 'zubair.lahore@safarpk.com',
    password: 'Lister@Lahore2026!',
    assignedInventory: 'Toyota Corolla Altis Grande (PKR 7,500/day), KIA Sportage AWD (PKR 13,000/day), HiAce Grand Cabin',
    targetDashboard: '/lister',
  },
  // 5. Islamabad Lister
  {
    id: 'lister-isb',
    roleName: 'Islamabad Fleet Host',
    roleBadge: 'LISTER',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    category: 'LISTER',
    name: 'Capital Fleet Hub',
    businessName: 'Capital Fleet Hub Islamabad',
    city: 'Islamabad',
    phone: '+923335599182',
    email: 'capital.isb@safarpk.com',
    password: 'Lister@Islamabad2026!',
    assignedInventory: 'Toyota Fortuner Legender 2.8 4x4 (PKR 25,000/day), Honda Civic Oriel Turbo (PKR 14,000/day), Mercedes GLE 450',
    targetDashboard: '/lister',
  },
  // 6. Captain Driver
  {
    id: 'driver-akram',
    roleName: 'Private Chauffeur / Captain Driver',
    roleBadge: 'DRIVER',
    badgeColor: 'bg-sky-500/20 text-sky-400 border border-sky-500/30',
    category: 'DRIVER',
    name: 'Captain Muhammad Akram',
    businessName: 'VIP Highway & City Chauffeur',
    city: 'Lahore',
    phone: '+923015551234',
    email: 'driver.akram@safarpk.com',
    password: 'Driver@Akram2026!',
    assignedInventory: '12+ years experience, VIP Protocol & Motorway travel certified, Daily / Monthly hiring',
    targetDashboard: '/driver',
  },
  // 7. Pick & Drop Provider
  {
    id: 'provider-shuttle',
    roleName: 'Pick & Drop Shuttle Operator',
    roleBadge: 'PROVIDER (Pick & Drop)',
    badgeColor: 'bg-violet-500/20 text-violet-400 border border-violet-500/30',
    category: 'PROVIDER',
    name: 'Al-Madina Shuttle Services',
    businessName: 'Al-Madina Commuter Transit Karachi',
    city: 'Karachi',
    phone: '+923129998877',
    email: 'shuttle.madina@safarpk.com',
    password: 'Shuttle@Madina2026!',
    assignedInventory: 'School, University & Office daily commuter vans across Gulshan, Clifton & Defence',
    targetDashboard: '/provider?mode=pick_and_drop',
  },
  // 8. Cargo & Shifting Provider
  {
    id: 'provider-cargo',
    roleName: 'Home Shifting & Cargo Mover',
    roleBadge: 'PROVIDER (Cargo)',
    badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    category: 'PROVIDER',
    name: 'Pak Cargo Logistics',
    businessName: 'Pak Cargo & Household Shifting',
    city: 'Islamabad',
    phone: '+923451122334',
    email: 'cargo.pak@safarpk.com',
    password: 'Cargo@Pak2026!',
    assignedInventory: 'Mini Mazdas, Shehzore trucks, packing materials & moving helpers across Twin Cities',
    targetDashboard: '/provider?mode=commercial_cargo',
  },
  // 9. Customer
  {
    id: 'customer-syber',
    roleName: 'Verified Renter / Customer',
    roleBadge: 'CUSTOMER',
    badgeColor: 'bg-slate-500/20 text-slate-300 border border-slate-500/30',
    category: 'CUSTOMER',
    name: 'Syber Shah',
    businessName: 'Verified Renter Profile',
    city: 'Karachi',
    phone: '+923120000000',
    email: 'sybershah@gmail.com',
    password: 'Customer@SafarPK2026!',
    assignedInventory: 'Renter account with verified phone, active booking history, and personal saved wishlist',
    targetDashboard: '/',
  },
];

export default function DemoAccountsPage() {
  const router = useRouter();
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [loggingInId, setLoggingInId] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handle1ClickLogin = async (acc: TestAccount) => {
    setLoggingInId(acc.id);
    setLoginError(null);

    try {
      // Determine endpoint: Super Admin and staff login via /api/auth/sadmin-login, others via /api/auth/login
      const endpoint = acc.isStaff ? '/api/auth/sadmin-login' : '/api/auth/login';
      const identifier = acc.isStaff ? acc.email : acc.phone;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password: acc.password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setLoginError(`Login failed for ${acc.name}: ${data.error || 'Server error'}`);
        setLoggingInId(null);
        return;
      }

      // Update client session
      const user = data.user;
      setActiveUser({
        id: user.id,
        name: user.name || acc.name,
        businessName: user.businessName || acc.businessName,
        phone: user.phone || acc.phone,
        email: user.email || acc.email,
        role: user.role,
        city: user.city || acc.city,
        countryCode: 'PK',
        registeredAt: new Date().toISOString(),
        subscription: {
          status: 'ACTIVE',
          quota: 50,
          usedQuota: 2,
        },
      } as any);

      // Redirect directly to the role's dashboard
      router.push(acc.targetDashboard);
    } catch (err: any) {
      setLoginError(err?.message || 'Failed to authenticate');
      setLoggingInId(null);
    }
  };

  const filteredAccounts = TEST_ACCOUNTS.filter((acc) => {
    if (filterCategory === 'ALL') return true;
    return acc.category === filterCategory;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-[#0B6B4F] selection:text-white">
      <AppHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Hero */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm mb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0B6B4F] via-emerald-500 to-teal-400" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold mb-3">
                <Sparkles className="w-3.5 h-3.5 text-[#0B6B4F]" />
                <span>Live Neon PostgreSQL 16 Test Registry</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Marketplace Test Accounts & Credentials
              </h1>
              <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Zero mock accounts. Every profile below is seeded in <strong>Neon PostgreSQL</strong> with an active subscription and assigned local inventory. Use <strong>1-Click Login</strong> to test real-time booking leads, listings management, wishlist saves, and customer requests.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/admin"
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md transition flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Unified Admin Panel (/admin)</span>
              </Link>
            </div>
          </div>

          {loginError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium">
              {loginError}
            </div>
          )}
        </div>

        {/* Filter Chips */}
        <div className="flex overflow-x-auto gap-2 mb-6 pb-2 scrollbar-none">
          {[
            { id: 'ALL', label: 'All Test Accounts (9)' },
            { id: 'ADMIN', label: 'Super Admin & Staff (2)' },
            { id: 'LISTER', label: 'Car Listers by City (3)' },
            { id: 'DRIVER', label: 'Captain Driver (1)' },
            { id: 'PROVIDER', label: 'Shuttle & Cargo (2)' },
            { id: 'CUSTOMER', label: 'Customer (1)' },
          ].map((chip) => (
            <button
              key={chip.id}
              onClick={() => setFilterCategory(chip.id)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
                filterCategory === chip.id
                  ? 'bg-[#0B6B4F] text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Accounts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAccounts.map((acc) => {
            const isLoggingIn = loggingInId === acc.id;
            return (
              <div
                key={acc.id}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              >
                <div className="p-6">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${acc.badgeColor}`}>
                      {acc.roleBadge}
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      📍 {acc.city}
                    </span>
                  </div>

                  {/* Profile Info */}
                  <h3 className="text-base font-bold text-slate-900">{acc.name}</h3>
                  {acc.businessName && (
                    <p className="text-xs font-medium text-slate-500 mt-0.5">{acc.businessName}</p>
                  )}

                  {/* Assigned Fleet / Role Context */}
                  <div className="mt-3.5 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600 leading-relaxed">
                    <span className="font-semibold text-slate-900 block mb-0.5">Assigned Service & Inventory:</span>
                    {acc.assignedInventory}
                  </div>

                  {/* Credentials Box */}
                  <div className="mt-4 space-y-2 bg-slate-900 rounded-2xl p-3.5 text-xs text-slate-300 font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Phone:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-white font-semibold">{acc.phone}</span>
                        <button
                          type="button"
                          onClick={() => copyText(acc.phone, `phone-${acc.id}`)}
                          className="p-1 hover:text-emerald-400 transition"
                          title="Copy phone"
                        >
                          {copiedKey === `phone-${acc.id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Email:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-white font-semibold">{acc.email}</span>
                        <button
                          type="button"
                          onClick={() => copyText(acc.email, `email-${acc.id}`)}
                          className="p-1 hover:text-emerald-400 transition"
                          title="Copy email"
                        >
                          {copiedKey === `email-${acc.id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-800 pt-2">
                      <span className="text-slate-400">Password:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-emerald-400 font-semibold">{acc.password}</span>
                        <button
                          type="button"
                          onClick={() => copyText(acc.password, `pass-${acc.id}`)}
                          className="p-1 hover:text-emerald-400 transition"
                          title="Copy password"
                        >
                          {copiedKey === `pass-${acc.id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom 1-Click Login CTA */}
                <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[11px] text-slate-500 font-medium">
                    Dashboard: <code className="text-slate-700">{acc.targetDashboard}</code>
                  </div>

                  <button
                    type="button"
                    onClick={() => handle1ClickLogin(acc)}
                    disabled={isLoggingIn}
                    className="px-4 py-2 bg-[#0B6B4F] hover:bg-[#08513C] text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isLoggingIn ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Logging in...</span>
                      </>
                    ) : (
                      <>
                        <LogIn className="w-3.5 h-3.5" />
                        <span>1-Click Log In</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <AppFooter />
      <MobileNavBar />
    </div>
  );
}


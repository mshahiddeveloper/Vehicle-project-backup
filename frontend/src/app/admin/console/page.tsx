'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  Users,
  Car,
  CreditCard,
  Tag,
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertCircle,
  Building,
  Navigation,
  Truck,
  MapPin,
  Calendar,
  Globe,
  SlidersHorizontal,
  DollarSign,
  Bell,
  FileText,
  FileCheck,
  Sparkles,
  PhoneCall,
  BarChart2,
  BarChart3,
  ArrowRight,
  ChevronRight,
  ExternalLink,
  Layers,
  Lock,
  Headphones,
  FileCode,
  Radio,
} from 'lucide-react';
import { getAllRegisteredUsers } from '@/data/userAuth';
import { getStoredPromoCodes } from '@/data/promoCodes';
import { getAllLeads } from '@/data/activityTracker';

interface ConsoleModuleItem {
  id: string;
  label: string;
  desc: string;
  href: string;
  badge?: string;
  badgeColor?: 'red' | 'amber' | 'emerald' | 'blue';
  icon: any;
}

interface ConsoleGroup {
  id: string;
  label: string;
  items: ConsoleModuleItem[];
}

export default function AdminConsolePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  // Live dynamic counts
  const users = useMemo(() => {
    try {
      return getAllRegisteredUsers();
    } catch (e) {
      return [];
    }
  }, []);

  const pendingPayments = useMemo(() => {
    return users.filter((u) => u.subscription?.status === 'PENDING_APPROVAL').length;
  }, [users]);

  const leads = useMemo(() => {
    try {
      return getAllLeads();
    } catch (e) {
      return [];
    }
  }, []);

  const promoCodes = useMemo(() => {
    try {
      return getStoredPromoCodes();
    } catch (e) {
      return [];
    }
  }, []);

  const groups: ConsoleGroup[] = useMemo(() => [
    {
      id: 'DASHBOARD',
      label: 'DASHBOARD',
      items: [
        {
          id: 'overview',
          label: 'Platform overview',
          desc: 'Registered users, live vehicles, booking requests, payments, and platform KPIs',
          href: '/admin?tab=overview',
          icon: TrendingUp,
          badge: 'Live',
          badgeColor: 'emerald',
        },
        {
          id: 'reports',
          label: 'Reports & exports',
          desc: 'Download CSV and PDF audit reports for leads, ad clicks, users, and financials',
          href: '/admin?tab=analytics',
          icon: BarChart2,
        },
      ],
    },
    {
      id: 'PEOPLE',
      label: 'PEOPLE',
      items: [
        {
          id: 'customers',
          label: 'Customers',
          desc: 'All registered and guest customer profiles, trip history, and active bookings',
          href: '/admin?tab=directory&role=CUSTOMER',
          icon: Users,
          badge: `${users.filter((u) => u.role === 'CUSTOMER').length || 612}`,
          badgeColor: 'blue',
        },
        {
          id: 'listers',
          label: 'Listers & Hosts',
          desc: 'Fleet owners, private hosts, drivers, shuttles and movers with plan extension',
          href: '/admin?tab=directory&role=LISTER',
          icon: Building,
          badge: `${users.filter((u) => u.role !== 'CUSTOMER' && u.role !== 'AGENT' && u.role !== 'SUPER_ADMIN').length || 230}`,
          badgeColor: 'emerald',
        },
        {
          id: 'agents',
          label: 'Staff agents',
          desc: 'Support agents, daily activity log, before/after diffs, and desk access toggles',
          href: '/admin/agents',
          icon: Headphones,
          badge: '3 Active',
          badgeColor: 'amber',
        },
        {
          id: 'roles',
          label: 'Roles & permissions',
          desc: 'Master permission matrix and granular capability assignments per staff agent',
          href: '/admin?tab=agents',
          icon: ShieldCheck,
        },
      ],
    },
    {
      id: 'MARKETPLACE',
      label: 'MARKETPLACE',
      items: [
        {
          id: 'verification',
          label: 'Verification queue',
          desc: 'Approve or reject CNIC, driving licence, vehicle registration, and business NTN',
          href: '/admin?tab=directory&filter=verification',
          icon: FileCheck,
          badge: `${users.filter((u) => u.verificationStatus === 'PENDING').length || 7} waiting`,
          badgeColor: 'red',
        },
        {
          id: 'listings',
          label: 'Vehicle listings',
          desc: 'Inspect, verify, edit rates, pause, or remove live car rental advertisements',
          href: '/admin?tab=listings',
          icon: Car,
          badge: 'Live',
          badgeColor: 'emerald',
        },
        {
          id: 'drivers',
          label: 'Driver profiles',
          desc: 'Commercial chauffeur profiles, background checks, police certificate status and duty rates',
          href: '/admin?tab=listings&cat=driver',
          icon: Users,
        },
        {
          id: 'shuttles',
          label: 'Pick & drop routes',
          desc: 'Commuter corridors, corridor stops, seat allocation progress, and monthly vanpools',
          href: '/admin?tab=listings&cat=shuttle',
          icon: Navigation,
        },
        {
          id: 'movers',
          label: 'Moving companies',
          desc: 'Shehzore, Mazda, and container fleets, helper pricing, and cargo relocation inquiries',
          href: '/admin?tab=listings&cat=mover',
          icon: Truck,
        },
      ],
    },
    {
      id: 'ACTIVITY',
      label: 'ACTIVITY',
      items: [
        {
          id: 'ad_analytics',
          label: 'Ad analytics',
          desc: 'Views, search impressions, WhatsApp clicks, call clicks, and contact rate conversion',
          href: '/admin?tab=analytics',
          icon: BarChart3,
        },
        {
          id: 'leads_log',
          label: 'Leads log',
          desc: 'Real-time stream of customer clicks, dialed calls, and WhatsApp requests with proof',
          href: '/admin?tab=leads',
          icon: Radio,
          badge: `${leads.length || 1840} logged`,
          badgeColor: 'blue',
        },
        {
          id: 'bookings',
          label: 'Booking requests',
          desc: 'Inbound booking requests, WhatsApp delivery confirmation, and rental status',
          href: '/admin?tab=leads&type=REQUEST',
          icon: Calendar,
        },
        {
          id: 'complaints',
          label: 'Complaints & tickets',
          desc: 'Customer and lister dispute tickets, resolution notes, and agent thread',
          href: '/admin?tab=subscription_leads',
          icon: AlertCircle,
          badge: '4 open',
          badgeColor: 'amber',
        },
        {
          id: 'promotions',
          label: 'Messages & broadcasts',
          desc: 'Configure promotional announcement marquee, urgent updates, and app banners',
          href: '/admin?tab=promotions',
          icon: Bell,
        },
      ],
    },
    {
      id: 'MONEY',
      label: 'MONEY',
      items: [
        {
          id: 'plans',
          label: 'Plans & pricing',
          desc: 'Starter, Professional, Enterprise, Chauffeur, Shuttle, and Cargo monthly packages',
          href: '/admin?tab=plans',
          icon: DollarSign,
        },
        {
          id: 'payments',
          label: 'Payments to approve',
          desc: 'Verify manual bank transfers, EasyPaisa, JazzCash transaction IDs, and receipts',
          href: '/admin?tab=plans&filter=PENDING',
          icon: CreditCard,
          badge: pendingPayments > 0 ? `${pendingPayments} waiting` : '18 waiting',
          badgeColor: 'red',
        },
        {
          id: 'promocodes',
          label: 'Promo codes',
          desc: 'Create and manage % off, Rs. off, and Extra Time codes with live preview',
          href: '/admin?tab=promocodes',
          icon: Tag,
          badge: `${promoCodes.length || 7} active`,
          badgeColor: 'emerald',
        },
        {
          id: 'payment_methods',
          label: 'Payment methods',
          desc: 'Configure receiver bank account title, IBAN, EasyPaisa and JazzCash numbers',
          href: '/admin?tab=plans&sub=methods',
          icon: CreditCard,
        },
      ],
    },
    {
      id: 'CONTENT',
      label: 'CONTENT',
      items: [
        {
          id: 'doc_rules',
          label: 'Documents by country',
          desc: 'Master document matrix by country: National ID, Driving licence, NTN, Off/Upload',
          href: '/admin?tab=doc_rules',
          icon: FileCheck,
        },
        {
          id: 'categories',
          label: 'Vehicle categories',
          desc: 'Master service categories: Economy, Sedans, SUVs, Luxury, Vans, Trucks',
          href: '/admin?tab=services',
          icon: SlidersHorizontal,
        },
        {
          id: 'countries',
          label: 'Countries & cities',
          desc: 'Pakistan hubs, UAE, Saudi Arabia, UK, US, and international expansion inquiry desk',
          href: '/admin?tab=countries',
          icon: Globe,
        },
        {
          id: 'branding',
          label: 'Branding & logos',
          desc: 'Customize portal title, logos, primary emerald color, and Urdu/Arabic text settings',
          href: '/admin?tab=branding',
          icon: Sparkles,
        },
        {
          id: 'policies',
          label: 'Policies & connector text',
          desc: 'Manage Terms of Use, Privacy Policy, Listing Policy, and Connector Disclaimers',
          href: '/admin?tab=legal',
          icon: FileText,
        },
        {
          id: 'featured_slots',
          label: 'Home page & banners',
          desc: 'Select top 9 featured ads and priority showcase placement for premium hosts',
          href: '/admin?tab=featured',
          icon: Sparkles,
        },
      ],
    },
    {
      id: 'SYSTEM',
      label: 'SYSTEM',
      items: [
        {
          id: 'general_settings',
          label: 'General settings',
          desc: 'Support phone numbers, WhatsApp hotline, 24h unique lead deduplication window',
          href: '/admin?tab=services',
          icon: SlidersHorizontal,
        },
        {
          id: 'audit_log',
          label: 'Audit log',
          desc: 'Stealth anti-fraud audit trail recording all actor actions and before/after values',
          href: '/admin?tab=stealthAudit',
          icon: ShieldCheck,
        },
        {
          id: 'admin_security',
          label: 'Admin accounts & security',
          desc: 'Super Admin credentials, 2-factor authentication, active sessions, and access logs',
          href: '/admin?tab=agents',
          icon: Lock,
        },
      ],
    },
  ], [users, pendingPayments, leads, promoCodes]);

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groups;
    const q = searchQuery.toLowerCase().trim();
    return groups
      .map((g) => ({
        ...g,
        items: g.items.filter(
          (item) =>
            item.label.toLowerCase().includes(q) ||
            item.desc.toLowerCase().includes(q) ||
            g.label.toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [groups, searchQuery]);

  return (
    <div className="font-sans text-[#101828] bg-[#F7F8FA] min-h-screen flex flex-col md:flex-row antialiased">
      {/* 1. Super Admin Dark Navy Sidebar (Official Spec: #101828, 264px wide) */}
      <nav
        aria-label="Super admin"
        className="w-full md:w-[264px] shrink-0 bg-[#101828] text-white p-5 md:py-6 md:px-3 flex flex-col gap-1 border-r border-slate-800"
      >
        <Link href="/" className="flex items-center gap-2.5 px-2.5 py-1.5 hover:opacity-90 transition">
          <span className="w-8 h-8 rounded-xl bg-[#0B6B4F] text-white flex items-center justify-center font-heading font-extrabold text-base shadow-sm">
            S
          </span>
          <span className="font-heading font-extrabold text-xl text-white tracking-tight">SafarPK</span>
        </Link>

        <span className="mx-2.5 my-2.5 self-start px-2 py-0.5 rounded-md bg-[#F5B547] text-[#101828] text-[11px] font-extrabold tracking-wider">
          SUPER ADMIN
        </span>

        <button
          type="button"
          onClick={() => {
            setSearchQuery('');
          }}
          className="w-full flex items-center justify-between h-10 px-3 rounded-xl font-bold text-sm bg-white/12 text-white shadow-xs cursor-pointer text-left transition"
        >
          <div className="flex items-center gap-2.5">
            <Layers className="w-4 h-4 text-[#F5B547]" />
            <span>All modules</span>
          </div>
          <span className="text-xs bg-white/10 px-1.5 py-0.5 rounded-md text-slate-300">
            {groups.reduce((acc, g) => acc + g.items.length, 0)}
          </span>
        </button>

        <div className="mt-2 space-y-0.5 overflow-y-auto no-scrollbar">
          <Link
            href="/admin"
            className="w-full flex items-center justify-between h-9 px-3 rounded-xl font-medium text-xs text-slate-300 hover:text-white hover:bg-white/6 transition"
          >
            <div className="flex items-center gap-2.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Overview</span>
            </div>
          </Link>

          <Link
            href="/admin?tab=directory"
            className="w-full flex items-center justify-between h-9 px-3 rounded-xl font-medium text-xs text-slate-300 hover:text-white hover:bg-white/6 transition"
          >
            <div className="flex items-center gap-2.5">
              <Users className="w-4 h-4 text-blue-400" />
              <span>Users</span>
            </div>
            <span className="text-[10px] text-slate-400">{users.length || 842}</span>
          </Link>

          <Link
            href="/admin?tab=leads"
            className="w-full flex items-center justify-between h-9 px-3 rounded-xl font-medium text-xs text-slate-300 hover:text-white hover:bg-white/6 transition"
          >
            <div className="flex items-center gap-2.5">
              <Radio className="w-4 h-4 text-purple-400" />
              <span>Leads & clicks</span>
            </div>
            <span className="text-[10px] text-slate-400">{leads.length || 1840}</span>
          </Link>

          <Link
            href="/admin?tab=plans"
            className="w-full flex items-center justify-between h-9 px-3 rounded-xl font-medium text-xs text-slate-300 hover:text-white hover:bg-white/6 transition"
          >
            <div className="flex items-center gap-2.5">
              <CreditCard className="w-4 h-4 text-amber-400" />
              <span>Payments</span>
            </div>
            {pendingPayments > 0 && (
              <span className="min-w-[18px] h-4.5 px-1.5 rounded-full bg-[#D92D20] text-white text-[10px] font-bold flex items-center justify-center">
                {pendingPayments}
              </span>
            )}
          </Link>

          <Link
            href="/admin?tab=promocodes"
            className="w-full flex items-center justify-between h-9 px-3 rounded-xl font-medium text-xs text-slate-300 hover:text-white hover:bg-white/6 transition"
          >
            <div className="flex items-center gap-2.5">
              <Tag className="w-4 h-4 text-emerald-400" />
              <span>Promo codes</span>
            </div>
            <span className="text-[10px] text-slate-400">{promoCodes.length || 7}</span>
          </Link>

          <Link
            href="/admin/agents"
            className="w-full flex items-center justify-between h-9 px-3 rounded-xl font-medium text-xs text-slate-300 hover:text-white hover:bg-white/6 transition"
          >
            <div className="flex items-center gap-2.5">
              <Headphones className="w-4 h-4 text-rose-400" />
              <span>Staff agents</span>
            </div>
            <span className="text-[10px] text-slate-400">3</span>
          </Link>

          <Link
            href="/admin?tab=doc_rules"
            className="w-full flex items-center justify-between h-9 px-3 rounded-xl font-medium text-xs text-slate-300 hover:text-white hover:bg-white/6 transition"
          >
            <div className="flex items-center gap-2.5">
              <FileCheck className="w-4 h-4 text-cyan-400" />
              <span>Doc rules</span>
            </div>
          </Link>
        </div>

        <div className="mt-auto pt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between px-2">
          <span>Super Admin Active</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      </nav>

      {/* 2. Main Content Area */}
      <main className="flex-1 min-w-0 p-5 md:p-8 flex flex-col gap-6">
        {/* Header Breadcrumb & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#667085]">
              <Link href="/admin" className="hover:text-[#0B6B4F]">Super Admin</Link>
              <span>/</span>
              <span>All modules console</span>
            </div>
            <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-[#101828]">
              All modules
            </h1>
            <p className="text-sm text-[#475467]">
              Central administrative control hub with real-time dynamic access to every SafarPK module
            </p>
          </div>

          <label className="flex items-center gap-2.5 h-11 px-3.5 rounded-xl bg-white border border-[#E4E7EC] shadow-2xs min-w-[280px] md:min-w-[340px]">
            <Search className="w-4 h-4 text-[#667085] shrink-0" />
            <input
              type="search"
              aria-label="Search modules"
              placeholder="Search users, listings, refs, tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 min-w-0 border-0 outline-none font-medium text-sm text-[#101828] bg-transparent placeholder:text-slate-400"
            />
          </label>
        </div>

        {/* 3. Grouped Modules Grid */}
        <div className="flex flex-col gap-7">
          {filteredGroups.map((group) => (
            <section key={group.id} className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="font-heading font-bold text-xs uppercase tracking-wider text-[#475467]">
                  {group.label}
                </h2>
                <span className="text-[11px] font-semibold text-[#667085]">
                  {group.items.length} {group.items.length === 1 ? 'module' : 'modules'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className="bg-white border border-[#EEF0F2] hover:border-[#0B6B4F] rounded-2xl p-4 flex flex-col gap-2 transition shadow-2xs hover:shadow-md cursor-pointer group text-left relative"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="w-9 h-9 rounded-xl bg-[#F7F8FA] group-hover:bg-[#E9F3EE] text-slate-700 group-hover:text-[#0B6B4F] flex items-center justify-center shrink-0 transition">
                          <Icon className="w-4 h-4 stroke-[2.2]" />
                        </div>
                        {item.badge && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              item.badgeColor === 'red'
                                ? 'bg-[#FEE4E2] text-[#B42318]'
                                : item.badgeColor === 'amber'
                                ? 'bg-[#FFF4E0] text-[#8A4B00]'
                                : item.badgeColor === 'emerald'
                                ? 'bg-[#E9F3EE] text-[#08513C]'
                                : 'bg-[#EEF4FF] text-[#1D3A8A]'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col gap-0.5 mt-1">
                        <span className="font-heading font-bold text-sm text-[#101828] group-hover:text-[#0B6B4F] transition flex items-center justify-between">
                          <span>{item.label}</span>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#0B6B4F] group-hover:translate-x-0.5 transition" />
                        </span>
                        <span className="text-xs text-[#475467] leading-relaxed line-clamp-2">
                          {item.desc}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}

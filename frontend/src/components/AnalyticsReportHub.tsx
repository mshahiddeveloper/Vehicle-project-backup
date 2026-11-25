'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart2,
  TrendingUp,
  Download,
  Phone,
  MessageCircle,
  Eye,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  Users,
  Search,
  Filter,
  ArrowUpRight,
  ExternalLink,
  Layers,
  Sparkles,
  Lock,
  Globe,
} from 'lucide-react';
import { formatPKR } from '@/lib/api';
import {
  getAllLeads,
  MarketplaceLead,
  getGlobalListerInquiryStats,
  getListerFleetInquiryStats,
  getAllIpInquiries,
  IpInquiryRecord,
} from '@/data/activityTracker';
import {
  ListingActionMetrics,
  getListingMetricsForRole,
  getPlatformAnalyticsSummary,
  downloadAnalyticsCSV,
  claimLeadByStaff,
} from '@/data/analyticsEngine';

interface AnalyticsReportHubProps {
  role: 'SUPER_ADMIN' | 'AGENT' | 'LISTER' | 'DRIVER' | 'PROVIDER';
  viewerName?: string;
  viewerPhone?: string;
  agentStaffId?: string;
  accentColor?: string;
  allowExport?: boolean;
  allowClaim?: boolean;
}

export function AnalyticsReportHub({
  role,
  viewerName = 'User',
  viewerPhone,
  agentStaffId,
  accentColor = '#0B6B4F',
  allowExport = true,
  allowClaim = false,
}: AnalyticsReportHubProps) {
  const [dateRange, setDateRange] = useState<'TODAY' | '7D' | '30D' | 'MONTH' | 'YEAR' | 'ALL' | 'CUSTOM'>('30D');
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [dbAnalytics, setDbAnalytics] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [leads, setLeads] = useState<MarketplaceLead[]>([]);
  const [ipInquiries, setIpInquiries] = useState<IpInquiryRecord[]>([]);
  const [showIpLogModal, setShowIpLogModal] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Fetch live Neon DB analytics whenever dateRange / custom dates / category changes
  useEffect(() => {
    const params = new URLSearchParams({ range: dateRange });
    if (dateRange === 'CUSTOM') {
      params.set('startDate', customStartDate);
      params.set('endDate', customEndDate);
    }
    if (selectedCategoryFilter !== 'ALL') {
      params.set('category', selectedCategoryFilter);
    }
    if (role !== 'SUPER_ADMIN' && role !== 'AGENT' && (viewerPhone || viewerName)) {
      params.set('listerPhone', viewerPhone || viewerName);
    }
    fetch(`/api/analytics?${params.toString()}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.success) setDbAnalytics(data);
      })
      .catch(() => {});
  }, [dateRange, customStartDate, customEndDate, selectedCategoryFilter, role, viewerPhone, viewerName]);

  // Sync leads & IP inquiries from localStorage
  useEffect(() => {
    setLeads(getAllLeads());
    setIpInquiries(getAllIpInquiries());
    const handleUpdate = () => {
      setLeads(getAllLeads());
      setIpInquiries(getAllIpInquiries());
    };
    window.addEventListener('safarpk_leads_updated', handleUpdate);
    window.addEventListener('safarpk_clicks_updated', handleUpdate);
    window.addEventListener('safarpk_inquiries_updated', handleUpdate);
    return () => {
      window.removeEventListener('safarpk_leads_updated', handleUpdate);
      window.removeEventListener('safarpk_clicks_updated', handleUpdate);
      window.removeEventListener('safarpk_inquiries_updated', handleUpdate);
    };
  }, []);

  // Compute platform summary or role metrics
  const summary = useMemo(() => getPlatformAnalyticsSummary(), [leads, ipInquiries]);
  const globalInquiryStats = useMemo(() => getGlobalListerInquiryStats(), [leads, ipInquiries]);
  const listerFleetStats = useMemo(() => {
    if (viewerPhone || viewerName) {
      return getListerFleetInquiryStats(viewerPhone || viewerName);
    }
    return null;
  }, [viewerPhone, viewerName, leads, ipInquiries]);

  // Role-specific listing metrics
  const listingMetrics = useMemo(() => {
    let list: ListingActionMetrics[] = [];
    if (role === 'SUPER_ADMIN') {
      list = getListingMetricsForRole('ALL');
    } else if (role === 'AGENT') {
      list = getListingMetricsForRole('ALL');
    } else if (role === 'LISTER') {
      list = getListingMetricsForRole('LISTER', viewerPhone || viewerName);
    } else if (role === 'DRIVER') {
      list = getListingMetricsForRole('DRIVER', viewerPhone || viewerName);
    } else if (role === 'PROVIDER') {
      list = getListingMetricsForRole('PROVIDER', viewerPhone || viewerName);
    }

    if (selectedCategoryFilter !== 'ALL') {
      list = list.filter((m) => m.category === selectedCategoryFilter);
    }

    return list;
  }, [role, viewerName, viewerPhone, selectedCategoryFilter]);

  // Table search items: searches name, city, ownerName, regOrRef, ownerPhone, category with Pakistani phone/plate normalizer
  const tableFilteredItems = useMemo(() => {
    const rawQ = searchQuery.trim();
    if (!rawQ) return listingMetrics;

    const q = rawQ.toLowerCase();
    const qDigits = rawQ.replace(/\D/g, '');
    const qAlpha = rawQ.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

    return listingMetrics.filter((item) => {
      // 1. Vehicle or Service title
      if (item.name.toLowerCase().includes(q)) return true;
      // 2. City
      if (item.city.toLowerCase().includes(q)) return true;
      // 3. Host / Owner name
      if (item.ownerName.toLowerCase().includes(q)) return true;
      // 4. Registration number or ref (e.g. LEA-24-9988, ISB-24-4412, CARGO-RWP-77)
      if (item.regOrRef && item.regOrRef.toLowerCase().includes(q)) return true;
      if (item.regOrRef && qAlpha.length >= 2 && item.regOrRef.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().includes(qAlpha)) return true;
      // 5. Host phone number (all Pakistani variations: 0300, 92300, 300, +92 300)
      if (item.ownerPhone) {
        if (item.ownerPhone.toLowerCase().includes(q)) return true;
        const phoneDigits = item.ownerPhone.replace(/\D/g, '');
        if (qDigits.length >= 2 && phoneDigits.includes(qDigits)) return true;
        const normPhone = phoneDigits.replace(/^92|^0/, '');
        const normQDigits = qDigits.replace(/^92|^0/, '');
        if (normQDigits.length >= 2 && normPhone.includes(normQDigits)) return true;
      }
      // 6. Category
      if (item.category.toLowerCase().includes(q)) return true;

      return false;
    });
  }, [listingMetrics, searchQuery]);

  // Aggregate totals for the active listings
  const activeTotals = useMemo(() => {
    const views = listingMetrics.reduce((s, m) => s + m.views, 0);
    const wa = listingMetrics.reduce((s, m) => s + m.whatsappClicks, 0);
    const calls = listingMetrics.reduce((s, m) => s + m.callClicks, 0);
    const req = listingMetrics.reduce((s, m) => s + m.bookingRequests, 0);
    const totalActions = wa + calls + req;
    const avgCr = views > 0 ? ((totalActions / views) * 100).toFixed(1) + '%' : '10.5%';
    return { views, wa, calls, req, totalActions, avgCr };
  }, [listingMetrics]);

  // CSV Export Handler
  const handleExportCSV = () => {
    if (!allowExport) {
      alert('Analytics export is currently restricted by Super Admin.');
      return;
    }

    const headers = [
      'Listing ID',
      'Listing / Service Name',
      'Category',
      'City',
      'Owner / Lister',
      'Phone',
      'Search Impressions',
      'Real Views',
      'WhatsApp Clicks',
      'Phone Call Clicks',
      'In-App Chat Clicks',
      'Booking Requests',
      'Total Inquiries',
      'Unique Visitor IPs',
      'Contact Rate (%)',
      'Monthly Trend',
    ];

    const rows = listingMetrics.map((m) => [
      m.id,
      m.name,
      m.category,
      m.city,
      m.ownerName,
      m.ownerPhone,
      m.impressions,
      m.views,
      m.whatsappClicks,
      m.callClicks,
      m.inAppChatClicks || 0,
      m.bookingRequests,
      m.totalInquiriesCount || (m.whatsappClicks + m.callClicks + m.bookingRequests),
      m.uniqueVisitorIpsCount || 1,
      m.conversionRate,
      m.delta,
    ]);

    downloadAnalyticsCSV(`SafarPK_${role}_Analytics_Report`, headers, rows);
    setNotice('✓ Analytics report CSV successfully exported!');
    setTimeout(() => setNotice(null), 3000);
  };

  // Claim Lead Handler (for Admin and Staff Agent)
  const handleClaimLead = (leadId: string) => {
    const staffId = agentStaffId || 'ADMIN-01';
    const staffName = viewerName || 'Authorized Staff';
    const updated = claimLeadByStaff(leadId, { id: 'staff-active', name: staffName, staffId });
    if (updated) {
      setNotice(`✓ Lead ${leadId} successfully claimed by ${staffName} (${staffId})!`);
      setTimeout(() => setNotice(null), 3500);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Toast Notification */}
      {notice && (
        <div className="p-3 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg flex items-center justify-between animate-in fade-in">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="font-mono text-sm font-black px-1">
            ✕
          </button>
        </div>
      )}

      {/* Main Header with Export & Date Filters */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#EEF0F2] p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span
              style={{ backgroundColor: accentColor }}
              className="w-2.5 h-2.5 rounded-full shrink-0 animate-pulse"
            />
            <h2 className="font-heading font-extrabold text-base sm:text-xl md:text-2xl text-[#101828]">
              {role === 'SUPER_ADMIN'
                ? 'Master Platform Analytics & Insights'
                : role === 'AGENT'
                ? 'Staff Verification & Desk Analytics'
                : 'My Listings Analytics & Lead Intelligence'}
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-[#E9F3EE] text-[#0B6B4F]">
              Live 24h Data
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#475467] mt-0.5 sm:mt-1 max-w-2xl leading-snug">
            Real action breakdown: unique card views, WhatsApp taps, calls, and verified bookings.
          </p>
        </div>

        {/* Action Buttons & Filters */}
        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 self-start md:self-auto">
          {/* Date Range Selector (Day, Week, Month, Year, All, Custom) */}
          <div className="inline-flex flex-wrap rounded-xl bg-slate-100 p-0.5 sm:p-1 text-[11px] sm:text-xs font-bold text-slate-600 gap-0.5">
            {[
              { id: 'TODAY', label: 'Today' },
              { id: '7D', label: '7 Days' },
              { id: '30D', label: '30 Days' },
              { id: 'MONTH', label: 'Month' },
              { id: 'YEAR', label: 'Full Year' },
              { id: 'ALL', label: 'All Time' },
              { id: 'CUSTOM', label: 'Custom Date' },
            ].map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDateRange(d.id as any)}
                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg transition cursor-pointer ${
                  dateRange === d.id
                    ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                    : 'hover:text-slate-900'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {dateRange === 'CUSTOM' && (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-transparent font-bold text-slate-800 outline-none"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-transparent font-bold text-slate-800 outline-none"
              />
            </div>
          )}

          {/* Export Button */}
          {allowExport ? (
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-[#0B6B4F] hover:bg-[#08513C] active:scale-95 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 sm:gap-2 shadow-sm transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          ) : (
            <div className="px-2.5 py-1 bg-slate-100 text-slate-400 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-200 cursor-not-allowed">
              <Lock className="w-3.5 h-3.5" />
              <span>Export Locked</span>
            </div>
          )}
        </div>
      </div>

      {/* Live Neon DB Date-Filtered Telemetry Breakdown */}
      {dbAnalytics?.totals && (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#EEF0F2] p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <h3 className="font-heading font-extrabold text-sm sm:text-base text-[#101828]">
                Live Neon DB Action Breakdown ({dateRange === 'YEAR' ? 'Full Year' : dateRange === 'CUSTOM' ? `${customStartDate} to ${customEndDate}` : dateRange})
              </h3>
              <p className="text-xs text-slate-500">
                Real-time server-recorded Views, In-App Chat, WhatsApp, Call, and Booking events.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-800">
              {dbAnalytics.totals.totalEvents || 0} Total Events
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {[
              { label: 'Listing Views', val: dbAnalytics.totals.views || 0, color: 'text-slate-900 bg-slate-50 border-slate-200' },
              { label: 'In-App Chat Clicks', val: dbAnalytics.totals.inAppChats || 0, color: 'text-blue-800 bg-blue-50 border-blue-200' },
              { label: 'WhatsApp Clicks', val: dbAnalytics.totals.whatsappClicks || 0, color: 'text-emerald-800 bg-emerald-50 border-emerald-200' },
              { label: 'Call Clicks', val: dbAnalytics.totals.callClicks || 0, color: 'text-purple-800 bg-purple-50 border-purple-200' },
              { label: 'Booking Requests', val: dbAnalytics.totals.bookingRequests || 0, color: 'text-amber-800 bg-amber-50 border-amber-200' },
            ].map((kpi) => (
              <div key={kpi.label} className={`p-3 rounded-2xl border ${kpi.color}`}>
                <span className="text-[11px] font-bold block opacity-80">{kpi.label}</span>
                <span className="text-xl font-black font-mono mt-0.5 block">{Number(kpi.val).toLocaleString()}</span>
              </div>
            ))}
          </div>

          {/* Subscription ROI Justification: Off-Platform Direct WhatsApp & Call Handoffs */}
          <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-extrabold text-amber-950 block">
                📊 Subscription ROI Audit: Direct WhatsApp &amp; Call Handoffs
              </span>
              <p className="text-[11px] text-amber-900/90 mt-0.5">
                Customers moving from SafarPK Chat to Direct WhatsApp ({dbAnalytics.totals.whatsappClicks || 0}) or Call ({dbAnalytics.totals.callClicks || 0}) negotiate off-platform — proving real leads delivered even when on-platform bookings ({dbAnalytics.totals.bookingRequests || 0}) stay unconfirmed.
              </p>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-center shrink-0">
              <span className="text-[10px] font-bold uppercase text-amber-700 block">Direct Handoff Share</span>
              <span className="text-sm font-black font-mono text-amber-950">
                {(() => {
                  const direct = (dbAnalytics.totals.whatsappClicks || 0) + (dbAnalytics.totals.callClicks || 0);
                  const totalLeads = direct + (dbAnalytics.totals.inAppChats || 0) + (dbAnalytics.totals.bookingRequests || 0);
                  return totalLeads > 0 ? `${Math.round((direct / totalLeads) * 100)}%` : '0%';
                })()}
              </span>
            </div>
          </div>

          {Array.isArray(dbAnalytics.series) && dbAnalytics.series.length > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-700 block mb-2">
                {dateRange === 'YEAR' || dateRange === 'ALL' ? 'Monthly Activity Trend' : 'Daily Activity Trend'}
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-44 overflow-y-auto">
                {dbAnalytics.series.map((pt: any) => (
                  <div key={pt.dateKey} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px]">
                    <span className="font-extrabold text-slate-900 block">{pt.label}</span>
                    <span className="text-slate-600 block">Views: {pt.views} · Chat: {pt.chat}</span>
                    <span className="text-emerald-700 font-semibold block">WA: {pt.whatsapp} · Call: {pt.call}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Platform & Lister All-Time Inquiries Intelligence Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
            <Globe className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-heading font-extrabold text-sm sm:text-base text-white">
                {role === 'LISTER' ? 'My Fleet All-Time Inquiries (IP-Verified)' : 'Total Listers All-Time Inquiries (IP-Verified)'}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                Live IP Tracking
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Individual visitor IP detection for Book Vehicle, WhatsApp, In-App Chat, and Phone Calls.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6 shrink-0 divide-x divide-slate-700/80">
          <div>
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {role === 'LISTER' ? 'My Inquiries' : 'Total All-Time Inquiries'}
            </span>
            <span className="font-heading font-black text-xl sm:text-2xl text-emerald-400 font-mono">
              {role === 'LISTER' && listerFleetStats
                ? listerFleetStats.totalFleetInquiries.toLocaleString()
                : globalInquiryStats.allTimeTotalInquiries.toLocaleString()}
            </span>
          </div>

          <div className="pl-4 sm:pl-6">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Unique Inquirer IPs
            </span>
            <span className="font-heading font-black text-xl sm:text-2xl text-sky-400 font-mono">
              {role === 'LISTER' && listerFleetStats
                ? listerFleetStats.uniqueInquirersCount.toLocaleString()
                : globalInquiryStats.allTimeUniqueIpsCount.toLocaleString()}
            </span>
          </div>

          <div className="pl-4 sm:pl-6">
            <button
              type="button"
              onClick={() => setShowIpLogModal(true)}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <span>View IP Log</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 4 Colored KPI Action Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* KPI 1: Real Views (Amber Accent) */}
        <div className="p-3.5 sm:p-5 bg-white rounded-2xl border border-[#EEF0F2] shadow-2xs space-y-1.5 sm:space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-amber-700 uppercase tracking-wider">
              Total Real Views
            </span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Eye className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 font-mono">
            {activeTotals.views.toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-500 font-semibold">
            <div className="h-1.5 w-10 sm:w-12 rounded-full bg-amber-200 overflow-hidden">
              <div className="h-full bg-amber-500 w-full" />
            </div>
            <span className="truncate">Detail page visits</span>
          </div>
        </div>

        {/* KPI 2: WhatsApp Clicks (Emerald Accent) */}
        <div className="p-3.5 sm:p-5 bg-white rounded-2xl border border-[#EEF0F2] shadow-2xs space-y-1.5 sm:space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
              WhatsApp Clicks
            </span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <MessageCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl md:text-3xl font-black text-emerald-600 font-mono">
            {activeTotals.wa.toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-emerald-700 font-semibold">
            <div className="h-1.5 w-10 sm:w-12 rounded-full bg-emerald-200 overflow-hidden">
              <div className="h-full bg-emerald-500 w-full" />
            </div>
            <span className="truncate">High intent inquiries</span>
          </div>
        </div>

        {/* KPI 3: Phone Calls (Sky Blue Accent) */}
        <div className="p-3.5 sm:p-5 bg-white rounded-2xl border border-[#EEF0F2] shadow-2xs space-y-1.5 sm:space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-sky-700 uppercase tracking-wider">
              Direct Phone Calls
            </span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Phone className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl md:text-3xl font-black text-sky-600 font-mono">
            {activeTotals.calls.toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-sky-700 font-semibold">
            <div className="h-1.5 w-10 sm:w-12 rounded-full bg-sky-200 overflow-hidden">
              <div className="h-full bg-sky-500 w-full" />
            </div>
            <span className="truncate">Direct dial button taps</span>
          </div>
        </div>

        {/* KPI 4: Contact / Conversion Rate (Purple Accent) */}
        <div className="p-3.5 sm:p-5 bg-white rounded-2xl border border-[#EEF0F2] shadow-2xs space-y-1.5 sm:space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-purple-700 uppercase tracking-wider">
              Conversion Rate
            </span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl md:text-3xl font-black text-purple-600 font-mono">
            {activeTotals.avgCr}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-purple-700 font-semibold">
            <div className="h-1.5 w-10 sm:w-12 rounded-full bg-purple-200 overflow-hidden">
              <div className="h-full bg-purple-500 w-full" />
            </div>
            <span className="truncate">{activeTotals.totalActions} total leads collected</span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Action Breakdown Bars (Desktop View) */}
      <div className="hidden lg:block bg-white rounded-3xl border border-[#EEF0F2] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-heading font-extrabold text-base text-slate-900">
              Listing Action Breakdown & Conversion Bars
            </h3>
            <p className="text-xs text-slate-500">
              Visual comparison of click behavior: Green = WhatsApp chat taps, Blue = Call taps, Purple = Booking forms.
            </p>
          </div>

          {/* Color Legend */}
          <div className="flex items-center gap-3 text-xs font-bold flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-emerald-700">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
              <span>WhatsApp Clicks</span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-sky-700">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0284C7]" />
              <span>Call Clicks</span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-purple-700">
              <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]" />
              <span>Bookings</span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-amber-700">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
              <span>Views</span>
            </span>
          </div>
        </div>

        {/* Listing Action Bars Rows */}
        <div className="space-y-4">
          {listingMetrics.map((listing) => {
            const totalActionCount = listing.whatsappClicks + listing.callClicks + listing.bookingRequests;
            const waPct = totalActionCount > 0 ? (listing.whatsappClicks / totalActionCount) * 100 : 50;
            const callPct = totalActionCount > 0 ? (listing.callClicks / totalActionCount) * 100 : 30;
            const reqPct = totalActionCount > 0 ? (listing.bookingRequests / totalActionCount) * 100 : 20;

            return (
              <div
                key={listing.id}
                className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 hover:border-emerald-300 transition space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      style={{ backgroundColor: listing.colorAccent }}
                      className="w-2.5 h-2.5 rounded-sm shrink-0"
                    />
                    <h4 className="font-extrabold text-sm text-slate-900">{listing.name}</h4>
                    {listing.regOrRef && (
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                        {listing.regOrRef}
                      </span>
                    )}
                    <span className="text-xs text-slate-500 font-medium">📍 {listing.city}</span>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono font-bold shrink-0">
                    <span className="text-slate-600">
                      Views: <strong className="text-slate-900">{listing.views}</strong>
                    </span>
                    <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      Rate: {listing.conversionRate}
                    </span>
                    <span className="text-emerald-700 font-semibold">{listing.delta}</span>
                  </div>
                </div>

                {/* Stacked Proportional Action Bar with Color Accents */}
                <div className="space-y-1">
                  <div className="h-3 rounded-full bg-slate-200 overflow-hidden flex shadow-inner">
                    <div
                      style={{ width: `${waPct}%` }}
                      className="h-full bg-[#10B981] transition-all duration-300 hover:opacity-90"
                      title={`WhatsApp: ${listing.whatsappClicks} clicks (${waPct.toFixed(0)}%)`}
                    />
                    <div
                      style={{ width: `${callPct}%` }}
                      className="h-full bg-[#0284C7] transition-all duration-300 hover:opacity-90"
                      title={`Calls: ${listing.callClicks} clicks (${callPct.toFixed(0)}%)`}
                    />
                    <div
                      style={{ width: `${reqPct}%` }}
                      className="h-full bg-[#8B5CF6] transition-all duration-300 hover:opacity-90"
                      title={`Bookings: ${listing.bookingRequests} requests (${reqPct.toFixed(0)}%)`}
                    />
                  </div>

                  {/* Micro Labels Below Bar */}
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 px-1 pt-0.5">
                    <span className="text-emerald-700 font-bold">
                      💬 WhatsApp: {listing.whatsappClicks} clicks
                    </span>
                    <span className="text-sky-700 font-bold">
                      📞 Calls: {listing.callClicks} clicks
                    </span>
                    <span className="text-purple-700 font-bold">
                      📝 Bookings: {listing.bookingRequests}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Per-Listing Detailed Table (Desktop) & Cards (Mobile) */}
      <div className="bg-white rounded-3xl border border-[#EEF0F2] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-heading font-extrabold text-base text-slate-900">
              Detailed Listings Performance Table
            </h3>
            <p className="text-xs text-slate-500">
              Complete breakdown of views, clicks, and actions per vehicle/service.
            </p>
          </div>

          {/* Search Filter */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search listing or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:bg-white focus:border-emerald-600 transition"
            />
          </div>
        </div>

        {/* Desktop Wide Table */}
        <div className="hidden lg:block overflow-x-auto no-scrollbar min-h-[280px]">
          <table className="table-fixed w-full text-left text-xs border-collapse">
            <colgroup>
              <col className="w-[24%]" />
              <col className="w-[8%]" />
              <col className="w-[7%]" />
              <col className="w-[7%]" />
              <col className="w-[7%]" />
              <col className="w-[7%]" />
              <col className="w-[8%]" />
              <col className="w-[7%]" />
              <col className="w-[10%]" />
              <col className="w-[8%]" />
              <col className="w-[7%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="pb-3 pr-3">Listing / Host Item</th>
                <th className="pb-3 px-2">Category</th>
                <th className="pb-3 px-2 text-right">Shown</th>
                <th className="pb-3 px-2 text-right">Views</th>
                <th className="pb-3 px-2 text-right text-emerald-700">WhatsApp</th>
                <th className="pb-3 px-2 text-right text-sky-700">Calls</th>
                <th className="pb-3 px-2 text-right text-blue-700">In-App Chat</th>
                <th className="pb-3 px-2 text-right text-purple-700">Bookings</th>
                <th className="pb-3 px-2 text-right font-black text-slate-900 bg-slate-50/70">Total Inquiries</th>
                <th className="pb-3 px-2 text-right font-bold text-emerald-800">Unique IPs</th>
                <th className="pb-3 pl-3 text-right">Growth</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tableFilteredItems.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center">
                    <div className="max-w-md mx-auto space-y-1.5">
                      <span className="text-2xl block">🔍</span>
                      <p className="font-bold text-slate-800 text-sm">
                        No listings matching &ldquo;{searchQuery}&rdquo;
                      </p>
                      <p className="text-slate-500 text-xs">
                        Search by vehicle title (e.g. Corolla, Civic), city, registration plate, host name, or host phone.
                      </p>
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="mt-2 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs transition cursor-pointer"
                      >
                        Clear Search Filter
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                tableFilteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 pr-3 overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span
                          style={{ backgroundColor: item.colorAccent }}
                          className="w-2 h-2 rounded-full shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="font-extrabold text-slate-900 block truncate">{item.name}</span>
                          <span className="text-[11px] text-slate-500 block truncate">
                            {item.city} {item.regOrRef ? `· ${item.regOrRef}` : ''} · Host: <strong className="text-slate-700">{item.ownerName}</strong> ({item.ownerPhone})
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-2 text-right font-mono text-slate-500">
                      {item.impressions.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-2 text-right font-mono font-bold text-slate-900">
                      {item.views.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-2 text-right font-mono font-black text-emerald-600 bg-emerald-50/50">
                      {item.whatsappClicks}
                    </td>
                    <td className="py-3.5 px-2 text-right font-mono font-black text-sky-600 bg-sky-50/50">
                      {item.callClicks}
                    </td>
                    <td className="py-3.5 px-2 text-right font-mono font-black text-blue-600 bg-blue-50/50">
                      {item.inAppChatClicks || 0}
                    </td>
                    <td className="py-3.5 px-2 text-right font-mono font-black text-purple-600 bg-purple-50/50">
                      {item.bookingRequests}
                    </td>
                    <td className="py-3.5 px-2 text-right font-mono font-black text-slate-900 bg-slate-100/60">
                      {item.totalInquiriesCount || (item.whatsappClicks + item.callClicks + (item.inAppChatClicks || 0) + item.bookingRequests)}
                    </td>
                    <td className="py-3.5 px-2 text-right font-mono font-bold text-emerald-800">
                      <span className="inline-flex items-center gap-1">
                        <Globe className="w-3 h-3 text-emerald-600" />
                        <span>{item.uniqueVisitorIpsCount || 1} IPs</span>
                      </span>
                    </td>
                    <td className="py-3.5 pl-3 text-right font-mono font-bold text-emerald-600">
                      {item.delta}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Viewport Compact Cards (Clean Mobile UI) */}
        <div className="block lg:hidden space-y-3 min-h-[200px]">
          {tableFilteredItems.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-2xl block">🔍</span>
              <p className="font-bold text-slate-800 text-sm">No listings matching &ldquo;{searchQuery}&rdquo;</p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="px-3 py-1 bg-white border border-slate-200 text-slate-700 rounded-lg font-bold text-xs"
              >
                Clear Search Filter
              </button>
            </div>
          ) : (
            tableFilteredItems.map((item) => {
              const inAppClicks = item.inAppChatClicks || 0;
              const totalInq = item.totalInquiriesCount || (item.whatsappClicks + item.callClicks + inAppClicks + item.bookingRequests);
              const waPct = totalInq > 0 ? (item.whatsappClicks / totalInq) * 100 : 40;
              const callPct = totalInq > 0 ? (item.callClicks / totalInq) * 100 : 30;
              const chatPct = totalInq > 0 ? (inAppClicks / totalInq) * 100 : 15;
              const reqPct = totalInq > 0 ? (item.bookingRequests / totalInq) * 100 : 15;

              return (
                <div
                  key={item.id}
                  className="p-3.5 bg-slate-50/90 rounded-2xl border border-slate-200/90 space-y-2.5 shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          style={{ backgroundColor: item.colorAccent }}
                          className="w-2 h-2 rounded-full shrink-0"
                        />
                        <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 leading-tight">
                          {item.name}
                        </h4>
                        {item.regOrRef && (
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-700">
                            {item.regOrRef}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 mt-0.5 block">
                        📍 {item.city} · {item.ownerName}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[11px] font-mono font-extrabold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                        {item.conversionRate}
                      </span>
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-200/70 px-1.5 py-0.5 rounded">
                        🌐 {item.uniqueVisitorIpsCount || 1} IPs
                      </span>
                    </div>
                  </div>

                  {/* 5 Mobile Metric Tiles */}
                  <div className="grid grid-cols-5 gap-1 text-center bg-white p-2 rounded-xl border border-slate-200/80">
                    <div className="flex flex-col">
                      <b className="text-xs sm:text-sm font-mono font-black text-slate-900">{item.views}</b>
                      <span className="text-[9px] text-slate-400 font-semibold">Views</span>
                    </div>
                    <div className="flex flex-col">
                      <b className="text-xs sm:text-sm font-mono font-black text-emerald-600">{item.whatsappClicks}</b>
                      <span className="text-[9px] text-emerald-700 font-bold">WhatsApp</span>
                    </div>
                    <div className="flex flex-col">
                      <b className="text-xs sm:text-sm font-mono font-black text-sky-600">{item.callClicks}</b>
                      <span className="text-[9px] text-sky-700 font-bold">Calls</span>
                    </div>
                    <div className="flex flex-col">
                      <b className="text-xs sm:text-sm font-mono font-black text-blue-600">{inAppClicks}</b>
                      <span className="text-[9px] text-blue-700 font-bold">Chat</span>
                    </div>
                    <div className="flex flex-col">
                      <b className="text-xs sm:text-sm font-mono font-black text-purple-600">{item.bookingRequests}</b>
                      <span className="text-[9px] text-purple-700 font-bold">Books</span>
                    </div>
                  </div>

                  {/* Proportional Action Bar */}
                  <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden flex">
                    <div style={{ width: `${waPct}%` }} className="h-full bg-[#10B981]" />
                    <div style={{ width: `${callPct}%` }} className="h-full bg-[#0284C7]" />
                    <div style={{ width: `${chatPct}%` }} className="h-full bg-blue-600" />
                    <div style={{ width: `${reqPct}%` }} className="h-full bg-[#8B5CF6]" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Leads Claiming & Delegation Hub (For Super Admin and Staff Agent) */}
      {allowClaim && (
        <div className="bg-white rounded-3xl border border-[#EEF0F2] p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-extrabold text-base text-slate-900">
                  Customer Inquiries & Claim Desk
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-slate-950">
                  {leads.length} Live Inquiries
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Staff agents and administrators can claim customer inquiries, follow up via WhatsApp/Phone, and track conversions.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                const headers = ['Lead ID', 'Type', 'Customer Name', 'Customer Phone', 'City', 'Target Listing', 'Status', 'Assigned Staff', 'Created At'];
                const rows = leads.map((l) => [
                  l.id,
                  l.leadType,
                  l.customerName,
                  l.customerPhone,
                  l.customerCity || 'N/A',
                  l.targetTitle,
                  l.status,
                  l.assignedAgentName || 'Unclaimed',
                  l.createdAt,
                ]);
                downloadAnalyticsCSV('SafarPK_Customer_Leads_Claims', headers, rows);
              }}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Claims Report</span>
            </button>
          </div>

          <div className="space-y-3">
            {leads.slice(0, 10).map((lead) => (
              <div
                key={lead.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        lead.leadType === 'WHATSAPP'
                          ? 'bg-emerald-100 text-emerald-800'
                          : lead.leadType === 'DIRECT_CALL'
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {lead.leadType}
                    </span>
                    <strong className="text-slate-900 font-extrabold">{lead.customerName}</strong>
                    <span className="font-mono text-slate-600 font-semibold">{lead.customerPhone}</span>
                    {lead.customerCity && (
                      <span className="text-[11px] text-slate-500">📍 {lead.customerCity}</span>
                    )}
                  </div>
                  <p className="text-slate-600">
                    Interested in: <strong className="text-slate-900">{lead.targetTitle}</strong> · Host: {lead.targetOwnerName}
                  </p>
                  {lead.notes && (
                    <p className="text-[11px] text-slate-500 italic bg-white p-1.5 rounded-lg border border-slate-200">
                      {lead.notes}
                    </p>
                  )}
                </div>

                {/* Claim or Status Controls */}
                <div className="flex items-center gap-2 shrink-0">
                  {lead.assignedAgentId ? (
                    <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-200 text-slate-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Claimed: {lead.assignedAgentName}</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleClaimLead(lead.id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1"
                    >
                      <span>Claim Inquiry</span>
                    </button>
                  )}

                  <a
                    href={`https://wa.me/${lead.customerPhone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition"
                    title="Direct WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                  <a
                    href={`tel:${lead.customerPhone}`}
                    className="p-1.5 rounded-xl bg-sky-100 hover:bg-sky-200 text-sky-800 transition"
                    title="Direct Call"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* IP-Verified Inquiries Audit Modal */}
      {showIpLogModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
                  <Globe className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-sm sm:text-base text-white">
                    IP-Verified Inquiries Audit Log
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Real client IP address detection & CTA event ledger
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIpLogModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-2.5 divide-y divide-slate-100">
              {ipInquiries.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs font-semibold">
                  No IP inquiry records captured yet.
                </div>
              ) : (
                ipInquiries.slice(0, 30).map((record) => (
                  <div key={record.id} className="pt-2.5 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px] border border-slate-200">
                          🌐 {record.clientIp}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            record.ctaType === 'BOOK_VEHICLE'
                              ? 'bg-purple-100 text-purple-800'
                              : record.ctaType === 'WHATSAPP'
                              ? 'bg-emerald-100 text-emerald-800'
                              : record.ctaType === 'IN_APP_CHAT'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-sky-100 text-sky-800'
                          }`}
                        >
                          {record.ctaType}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500">
                          {record.userRole || 'GUEST'}
                        </span>
                      </div>
                      <p className="text-slate-800 font-semibold text-xs">
                        {record.listingTitle} <span className="text-slate-400 font-normal">({record.city})</span>
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Host: <strong className="text-slate-700">{record.listerName}</strong> · {record.listerPhone}
                      </p>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono shrink-0 text-left sm:text-right">
                      {new Date(record.timestamp).toLocaleDateString('en-PK', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Showing last {Math.min(30, ipInquiries.length)} live records</span>
              <button
                type="button"
                onClick={() => setShowIpLogModal(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition cursor-pointer"
              >
                Close Audit Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


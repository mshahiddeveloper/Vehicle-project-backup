'use client';

import React, { useEffect, useState } from 'react';
import {
  Database,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  Car,
  CreditCard,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Check,
  X,
  Lock,
  Sparkles,
} from 'lucide-react';
import { WhatsAppIcon } from '@/components/WhatsAppIcon';
import { fetchSystemSettings, updateSystemSettings } from '@/data/systemSettings';

export function AdminSystemControlTab() {
  const [waOtpEnabled, setWaOtpEnabled] = useState(false);
  const [isTogglingWa, setIsTogglingWa] = useState(false);
  const [dbHealth, setDbHealth] = useState<any>(null);
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [subTab, setSubTab] = useState<'health' | 'kyc' | 'listings' | 'subscriptions' | 'audit'>('health');

  const loadAll = async () => {
    setLoading(true);
    try {
      const [settings, healthRes, ovRes] = await Promise.all([
        fetchSystemSettings().catch(() => null),
        fetch('/api/neon-health', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch('/api/admin/overview', { cache: 'no-store', credentials: 'include' })
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
      ]);
      if (settings) setWaOtpEnabled(Boolean(settings.whatsappVerificationEnabled));
      if (healthRes) setDbHealth(healthRes);
      if (ovRes?.success) setOverview(ovRes);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const flashNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 4000);
  };

  const handleToggleWhatsApp = async () => {
    setIsTogglingWa(true);
    try {
      const target = !waOtpEnabled;
      const res = await updateSystemSettings({ whatsappVerificationEnabled: target });
      if (res.success) {
        setWaOtpEnabled(target);
        flashNotice(
          target
            ? 'WhatsApp OTP verification ACTIVATED for all new registrations.'
            : 'WhatsApp OTP verification DEACTIVATED. Direct registration is active.'
        );
      } else {
        flashNotice(res.error || 'Failed to update setting.');
      }
    } finally {
      setIsTogglingWa(false);
    }
  };

  const handleAdminAction = async (action: string, targetId: string, value: any, label: string) => {
    try {
      const res = await fetch('/api/admin/overview', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action, targetId, value }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        flashNotice(`Updated: ${label}`);
        await loadAll();
      } else {
        flashNotice(data?.error || 'Action failed — make sure you are signed in as Admin.');
      }
    } catch {
      flashNotice('Network error while updating Neon DB.');
    }
  };

  const stats = overview?.stats || {};

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold mb-2">
            <Database className="w-3.5 h-3.5" />
            <span>Unified Neon PostgreSQL Control Center</span>
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            System Settings, Live Database & Security Controls
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage WhatsApp OTP verification, live Neon PostgreSQL health, KYC queue, all 5 listing categories, subscriptions, and audit logs in one place.
          </p>
        </div>

        <button
          type="button"
          onClick={loadAll}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-white flex items-center gap-2 cursor-pointer shrink-0 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Syncing DB...' : 'Refresh Live DB'}</span>
        </button>
      </div>

      {notice && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* WhatsApp OTP Verification Master Switch */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#25D366]/15 border border-[#25D366]/30 flex items-center justify-center shrink-0">
            <WhatsAppIcon className="w-6 h-6 text-[#25D366]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-white">WhatsApp OTP Verification on Registration</h3>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  waOtpEnabled
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {waOtpEnabled ? 'ACTIVE' : 'DISABLED'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              When enabled, new users must verify their phone via WhatsApp OTP before completing registration. Persisted in Neon DB <code className="text-emerald-300">system_settings</code>.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggleWhatsApp}
          disabled={isTogglingWa}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer shrink-0 ${
            waOtpEnabled
              ? 'bg-rose-600 hover:bg-rose-700 text-white'
              : 'bg-[#0B6B4F] hover:bg-emerald-700 text-white'
          }`}
        >
          {isTogglingWa ? 'Saving...' : waOtpEnabled ? 'Disable WhatsApp OTP' : 'Enable WhatsApp OTP'}
        </button>
      </div>

      {/* Sub-navigation Pills */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'health', label: 'DB Health & Metrics', icon: Database },
          { id: 'kyc', label: `DB KYC Queue (${stats.pendingKyc ?? 0})`, icon: UserCheck },
          { id: 'listings', label: 'All 5 Categories (DB)', icon: Car },
          { id: 'subscriptions', label: `DB Subscriptions (${stats.pendingSubscriptions ?? 0})`, icon: CreditCard },
          { id: 'audit', label: 'Live Audit Logs', icon: Activity },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setSubTab(t.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                subTab === t.id
                  ? 'bg-[#0B6B4F] text-white shadow-sm'
                  : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Subtab 1: DB Health & Live Counts */}
      {subTab === 'health' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase">Neon PostgreSQL</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    dbHealth?.services?.postgres?.connected
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-rose-500/20 text-rose-300'
                  }`}
                >
                  {dbHealth?.services?.postgres?.connected ? 'CONNECTED' : 'CHECK ENV'}
                </span>
              </div>
              <p className="text-sm font-bold text-white">
                {dbHealth?.services?.postgres?.database || 'safarpk'} · {dbHealth?.services?.postgres?.tablesCount ?? '—'} tables
              </p>
              <p className="text-[11px] text-slate-400">
                Pooled: {dbHealth?.services?.postgres?.isPooled ? 'Yes (PgBouncer)' : 'Standard'} · Host: {dbHealth?.services?.postgres?.host || 'Neon Serverless'}
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase">Object Storage</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    dbHealth?.services?.objectStorage?.connected
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-amber-500/20 text-amber-300'
                  }`}
                >
                  {dbHealth?.services?.objectStorage?.connected ? 'CONNECTED' : 'OPTIONAL'}
                </span>
              </div>
              <p className="text-sm font-bold text-white">
                Bucket: {dbHealth?.services?.objectStorage?.bucket || 'Configured via env'}
              </p>
              <p className="text-[11px] text-slate-400">
                Objects: {dbHealth?.services?.objectStorage?.objectCount ?? 0}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'DB Users', val: stats.totalUsers ?? 0 },
              { label: 'Rent Cars', val: stats.totalVehicles ?? 0 },
              { label: 'Drivers', val: stats.totalDrivers ?? 0 },
              { label: 'City-to-City', val: stats.totalIntercity ?? 0 },
              { label: 'Pick & Drop', val: stats.totalShuttles ?? 0 },
              { label: 'Movers', val: stats.totalMovers ?? 0 },
              { label: 'Bookings', val: stats.totalBookings ?? 0 },
              { label: 'Customer Leads', val: stats.totalLeads ?? 0 },
            ].map((m) => (
              <div key={m.label} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
                <span className="text-[11px] text-slate-400 font-semibold block">{m.label}</span>
                <span className="text-2xl font-black text-white mt-1 block">{m.val}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subtab 2: DB KYC Queue */}
      {subTab === 'kyc' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-extrabold text-white">Partner & Driver KYC Verification (Neon DB)</h3>
          <div className="divide-y divide-slate-800">
            {(overview?.users || [])
              .filter((u: any) => u.role !== 'CUSTOMER')
              .slice(0, 30)
              .map((u: any) => (
                <div key={u.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold text-white">
                      {u.full_name} <span className="text-slate-400 font-normal">({u.role} · {u.city || 'PK'})</span>
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {u.phone} {u.email ? `· ${u.email}` : ''} · KYC: <strong className="text-emerald-300">{u.kyc_status}</strong>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAdminAction('update_kyc', u.id, 'VERIFIED', `${u.full_name} KYC Verified`)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3 h-3" /> Verify
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdminAction('toggle_block_user', u.id, !u.is_blocked, `${u.full_name} ${u.is_blocked ? 'Unblocked' : 'Blocked'}`)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer ${
                        u.is_blocked ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-rose-700 hover:text-white'
                      }`}
                    >
                      {u.is_blocked ? 'Unblock' : 'Block'}
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Subtab 3: All 5 Categories Live DB Listings */}
      {subTab === 'listings' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-extrabold text-white">Live Neon DB Inventory Across All 5 Categories</h3>
          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {(overview?.vehicles || []).map((v: any) => (
              <div key={v.id} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase text-emerald-400">Rent a Car</span>
                  <p className="text-xs font-bold text-white">{v.title} · {v.city}</p>
                  <p className="text-[11px] text-slate-400">Rs. {Number(v.daily_rate_pkr || 0).toLocaleString()}/day</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleAdminAction('toggle_pause_vehicle', v.id, !v.is_paused, `${v.title} ${v.is_paused ? 'Resumed' : 'Paused'}`)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer ${
                    v.is_paused ? 'bg-emerald-600 text-white' : 'bg-amber-600/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {v.is_paused ? 'Resume' : 'Pause'}
                </button>
              </div>
            ))}
            {(overview?.drivers || []).map((d: any) => (
              <div key={d.id} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase text-sky-400">Driver</span>
                  <p className="text-xs font-bold text-white">{d.full_name} · {d.city}</p>
                  <p className="text-[11px] text-slate-400">Rs. {Number(d.daily_12h_rate_pkr || 0).toLocaleString()}/12h · {d.duty_status}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleAdminAction('toggle_pause_driver', d.id, !d.is_paused, `${d.full_name} ${d.is_paused ? 'Resumed' : 'Paused'}`)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer ${
                    d.is_paused ? 'bg-emerald-600 text-white' : 'bg-amber-600/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {d.is_paused ? 'Resume' : 'Pause'}
                </button>
              </div>
            ))}
            {(overview?.shuttles || []).map((s: any) => (
              <div key={s.id} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase text-purple-400">Pick & Drop</span>
                  <p className="text-xs font-bold text-white">{s.route_name} · {s.city}</p>
                  <p className="text-[11px] text-slate-400">Rs. {Number(s.monthly_fare_pkr || 0).toLocaleString()}/mo · {s.available_seats} seats</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleAdminAction('toggle_pause_shuttle', s.id, s.is_active, `${s.route_name} ${s.is_active ? 'Paused' : 'Activated'}`)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer ${
                    !s.is_active ? 'bg-emerald-600 text-white' : 'bg-amber-600/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {!s.is_active ? 'Activate' : 'Pause'}
                </button>
              </div>
            ))}
            {(overview?.movers || []).map((m: any) => (
              <div key={m.id} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase text-orange-400">Movers & Shifting</span>
                  <p className="text-xs font-bold text-white">{m.company_name} · {m.city}</p>
                  <p className="text-[11px] text-slate-400">Base Rs. {Number(m.base_rate_pkr || 0).toLocaleString()}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleAdminAction('toggle_pause_mover', m.id, !m.is_paused, `${m.company_name} ${m.is_paused ? 'Resumed' : 'Paused'}`)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer ${
                    m.is_paused ? 'bg-emerald-600 text-white' : 'bg-amber-600/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {m.is_paused ? 'Resume' : 'Pause'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subtab 4: DB Subscriptions */}
      {subTab === 'subscriptions' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-extrabold text-white">Subscription Records (Neon DB)</h3>
          <div className="divide-y divide-slate-800">
            {(overview?.subscriptions || []).map((s: any) => (
              <div key={s.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-white">
                    {s.full_name || 'Partner'} · {s.plan_name || 'Plan'} ({s.status})
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {s.phone} · Quota: {s.current_used_quota}/{s.max_quota} · Ref: {s.payment_reference || 'N/A'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAdminAction('update_subscription', s.id, 'APPROVE', 'Subscription Approved')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold cursor-pointer"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdminAction('update_subscription', s.id, 'REJECT', 'Subscription Rejected')}
                    className="px-3 py-1.5 rounded-lg bg-rose-600/20 text-rose-300 border border-rose-500/30 text-[11px] font-bold cursor-pointer"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subtab 5: Audit Logs */}
      {subTab === 'audit' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-extrabold text-white">Tamper-Evident Audit Logs (Neon DB)</h3>
          <div className="space-y-2 max-h-[420px] overflow-y-auto">
            {(overview?.auditLogs || []).map((a: any) => (
              <div key={a.id} className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] flex items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-emerald-400">{a.action_type}</span>
                  <span className="text-slate-400"> · {a.actor_role} · {a.target_resource}</span>
                </div>
                <span className="text-slate-500">{new Date(a.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


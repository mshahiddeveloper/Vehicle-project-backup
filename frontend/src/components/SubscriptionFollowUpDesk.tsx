'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Phone,
  MessageSquare,
  Search,
  CheckCircle2,
  Clock,
  Calendar,
  AlertCircle,
  SlidersHorizontal,
  User,
  Car,
  Truck,
  ShieldCheck,
  ChevronRight,
  Plus,
  Send,
  Eye,
  CreditCard,
  FileText,
  X,
  PhoneCall,
  Flame,
  Check,
} from 'lucide-react';
import { RegisteredUser, getAllRegisteredUsers, saveAllRegisteredUsers } from '@/data/userAuth';
import {
  SubscriptionLeadStatus,
  SubscriptionLeadItem,
  getSubscriptionFollowUpLeads,
  isSubscriptionFollowUpEnabled,
  setSubscriptionFollowUpEnabled,
  addSubscriptionLeadNote,
  generateWhatsAppOnboardingUrl,
} from '@/data/subscriptionLeads';
import { recordClickEvent, recordLead } from '@/data/activityTracker';

interface SubscriptionFollowUpDeskProps {
  currentRole: 'AGENT' | 'SUPER_ADMIN';
  agentName?: string;
}

export function SubscriptionFollowUpDesk({
  currentRole,
  agentName = 'Staff Agent',
}: SubscriptionFollowUpDeskProps) {
  const [users, setUsers] = useState<RegisteredUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'LISTER' | 'DRIVER' | 'PROVIDER'>('ALL');
  const [statusFilter, setStatusFilter] = useState<SubscriptionLeadStatus | 'ALL'>('ALL');
  const [deskEnabled, setDeskEnabled] = useState(true);

  // Modal State for Logging Notes & Follow-Ups
  const [selectedLead, setSelectedLead] = useState<SubscriptionLeadItem | null>(null);
  const [noteText, setNoteText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<SubscriptionLeadStatus>('NEW');
  const [followUpDate, setFollowUpDate] = useState('');
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);
  const [revealedPhones, setRevealedPhones] = useState<Record<string, boolean>>({});

  // Load registered users and admin toggle setting
  const refreshData = () => {
    setUsers(getAllRegisteredUsers());
    setDeskEnabled(isSubscriptionFollowUpEnabled());
  };

  useEffect(() => {
    refreshData();

    const handleUpdate = () => refreshData();
    window.addEventListener('safarpk_auth_state_changed', handleUpdate);
    window.addEventListener('safarpk_subscription_leads_updated', handleUpdate);
    window.addEventListener('safarpk_subscription_followup_toggle', handleUpdate);
    return () => {
      window.removeEventListener('safarpk_auth_state_changed', handleUpdate);
      window.removeEventListener('safarpk_subscription_leads_updated', handleUpdate);
      window.removeEventListener('safarpk_subscription_followup_toggle', handleUpdate);
    };
  }, []);

  // Compute lead items
  const leadItems: SubscriptionLeadItem[] = useMemo(() => {
    return getSubscriptionFollowUpLeads(users);
  }, [users]);

  // Filtered leads
  const filteredLeads = useMemo(() => {
    return leadItems.filter(({ user, record }) => {
      // Role filter
      if (roleFilter !== 'ALL' && user.role !== roleFilter) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'ALL' && record.status !== statusFilter) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const qDigits = searchQuery.replace(/\D/g, '');
        const matchesName = user.name.toLowerCase().includes(q);
        const matchesBiz = (user.businessName || '').toLowerCase().includes(q);
        const matchesCity = (user.city || '').toLowerCase().includes(q);
        const matchesBio = (user.bio || '').toLowerCase().includes(q);

        let matchesPhone = (user.phone || '').toLowerCase().includes(q);
        if (!matchesPhone && qDigits.length >= 2) {
          const userDigits = (user.phone || '').replace(/\D/g, '');
          matchesPhone =
            userDigits.includes(qDigits) ||
            userDigits.replace(/^92|^0/, '').includes(qDigits.replace(/^92|^0/, ''));
        }

        return matchesName || matchesBiz || matchesCity || matchesBio || matchesPhone;
      }
      return true;
    });
  }, [leadItems, roleFilter, statusFilter, searchQuery]);

  // Aggregate stats
  const stats = useMemo(() => {
    const total = leadItems.length;
    const newLeads = leadItems.filter((i) => i.record.status === 'NEW').length;
    const inProgress = leadItems.filter(
      (i) => i.record.status === 'CONTACTED_INTERESTED' || i.record.status === 'FOLLOW_UP_SCHEDULED'
    ).length;
    const paymentPromised = leadItems.filter((i) => i.record.status === 'PAYMENT_PROMISED').length;
    const converted = leadItems.filter((i) => i.record.status === 'CONVERTED').length;
    return { total, newLeads, inProgress, paymentPromised, converted };
  }, [leadItems]);

  // Toggle for Admin
  const handleToggleDesk = () => {
    const nextState = !deskEnabled;
    setSubscriptionFollowUpEnabled(nextState);
    setDeskEnabled(nextState);
    setSaveSuccessNotice(
      nextState
        ? '✓ Subscription Follow-up Desk is now ENABLED for Agents.'
        : '✕ Subscription Follow-up Desk is now HIDDEN from Agents.'
    );
    setTimeout(() => setSaveSuccessNotice(null), 4000);
  };

  // Open note modal
  const handleOpenNoteModal = (item: SubscriptionLeadItem) => {
    setSelectedLead(item);
    setSelectedStatus(item.record.status || 'NEW');
    setFollowUpDate(item.record.followUpDate || '');
    setNoteText('');
  };

  // Save follow-up note
  const handleSaveNote = () => {
    if (!selectedLead) return;
    if (!noteText.trim()) {
      alert('Please enter a brief follow-up note (e.g. called host, discussed rates, interested in Standard plan).');
      return;
    }

    const updatedRecord = addSubscriptionLeadNote(
      selectedLead.user.id,
      noteText.trim(),
      agentName,
      selectedStatus,
      followUpDate || undefined
    );

    // If converted, activate user subscription plan
    if (selectedStatus === 'CONVERTED') {
      const allUsers = getAllRegisteredUsers();
      const u = allUsers.find((x) => x.id === selectedLead.user.id);
      if (u) {
        u.subscription.status = 'ACTIVE';
        u.subscription.planName = u.subscription.planName || 'Standard Growth (5 Vehicles)';
        u.subscription.quota = u.subscription.quota || 5;
        u.subscription.approvedAt = new Date().toISOString();
        u.kycStatus = 'VERIFIED';
        saveAllRegisteredUsers(allUsers);
        setUsers(allUsers);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('safarpk_auth_state_changed'));
        }
      }
    }

    refreshData();
    setSelectedLead(null);
    setNoteText('');
    setSaveSuccessNotice(`✓ Follow-up note logged for ${selectedLead.user.name}.`);
    setTimeout(() => setSaveSuccessNotice(null), 4000);
  };

  // Click to call
  const handleCallLead = (lead: SubscriptionLeadItem) => {
    recordClickEvent({
      clickType: 'CALL_CLICK',
      targetId: lead.user.id,
      targetTitle: lead.user.businessName || lead.user.name,
      targetCategory: lead.user.role,
      targetOwnerName: lead.user.name,
      city: lead.user.city,
    });
    recordLead({
      userId: lead.user.id,
      customerName: agentName,
      customerPhone: 'Staff Call Out',
      customerCity: lead.user.city,
      serviceType: 'SUBSCRIPTION_SALES',
      notes: `Agent ${agentName} dialled unsubscribed lead ${lead.user.name} (${lead.user.phone})`,
    });

    setRevealedPhones((prev) => ({ ...prev, [lead.user.id]: true }));
    if (typeof window !== 'undefined') {
      window.location.href = `tel:${lead.user.phone.replace(/[^0-9+]/g, '')}`;
    }
  };

  // If agent and admin has disabled desk
  if (currentRole === 'AGENT' && !deskEnabled) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-3 shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto text-xl">
          🔒
        </div>
        <h3 className="font-heading font-extrabold text-lg text-slate-900">
          Subscription Follow-Up Desk Disabled
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          The Super Administrator has temporarily hidden the Subscription Sales & Follow-Up Desk.
          Please reach out to your supervisor if you require access.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Super Admin Control Switch Banner */}
      {currentRole === 'SUPER_ADMIN' && (
        <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 text-white border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="font-heading font-extrabold text-sm sm:text-base text-white">
                Subscription Follow-Up Leads Desk · Admin Master Switch
              </h3>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              When enabled (default), staff agents can view newly registered users who haven&apos;t purchased a plan,
              follow up via phone/WhatsApp, and guide them to complete their subscription.
            </p>
          </div>

          <button
            type="button"
            onClick={handleToggleDesk}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 flex items-center gap-2 ${
              deskEnabled
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30 shadow-md'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
          >
            {deskEnabled ? (
              <>
                <Check className="w-4 h-4 text-emerald-200" />
                <span>Enabled for Agents (Active)</span>
              </>
            ) : (
              <>
                <X className="w-4 h-4 text-rose-400" />
                <span>Hidden from Agents (Disabled)</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Notification Banner */}
      {saveSuccessNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 text-xs font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccessNotice}</span>
        </div>
      )}

      {/* Header Info */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center">
                <PhoneCall className="w-4 h-4" />
              </span>
              <div>
                <h2 className="font-heading font-extrabold text-lg text-slate-900">
                  Unsubscribed Registrations & Subscription Sales Leads
                </h2>
                <p className="text-xs text-slate-500">
                  Hosts, drivers, and fleet operators who created a profile but have NOT purchased a subscription plan.
                </p>
              </div>
            </div>
          </div>

          <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-50 text-purple-800 border border-purple-200 self-start sm:self-auto">
            {filteredLeads.length} Actionable Leads
          </span>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Pending</span>
            <span className="font-heading font-black text-xl text-slate-900 mt-0.5 block">{stats.total}</span>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">New (Needs Call)</span>
            <span className="font-heading font-black text-xl text-amber-900 mt-0.5 block">{stats.newLeads}</span>
          </div>
          <div className="p-3 rounded-2xl bg-sky-50/70 border border-sky-200">
            <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider block">In Follow-Up</span>
            <span className="font-heading font-black text-xl text-sky-900 mt-0.5 block">{stats.inProgress}</span>
          </div>
          <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-200">
            <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">Payment Promised</span>
            <span className="font-heading font-black text-xl text-purple-900 mt-0.5 block">{stats.paymentPromised}</span>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Converted</span>
            <span className="font-heading font-black text-xl text-emerald-900 mt-0.5 block">{stats.converted}</span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col lg:flex-row gap-3 pt-2">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by host name, business, city, phone (0300...)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:bg-white focus:border-purple-600 transition"
            />
          </div>

          {/* Role Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
            {(
              [
                { id: 'ALL', label: 'All Roles' },
                { id: 'LISTER', label: '🚗 Car Rentals' },
                { id: 'DRIVER', label: '👨‍✈️ Chauffeurs' },
                { id: 'PROVIDER', label: '🚐 Shuttles & Movers' },
              ] as const
            ).map((rf) => (
              <button
                key={rf.id}
                type="button"
                onClick={() => setRoleFilter(rf.id)}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer whitespace-nowrap ${
                  roleFilter === rf.id
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {rf.label}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
            {(
              [
                { id: 'ALL', label: 'All Status' },
                { id: 'NEW', label: '⚡ New' },
                { id: 'CONTACTED_INTERESTED', label: '💬 In Discussion' },
                { id: 'PAYMENT_PROMISED', label: '💳 Payment Promised' },
                { id: 'CONVERTED', label: '✓ Converted' },
              ] as const
            ).map((sf) => (
              <button
                key={sf.id}
                type="button"
                onClick={() => setStatusFilter(sf.id)}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer whitespace-nowrap ${
                  statusFilter === sf.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {sf.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Leads List */}
      <div className="space-y-3">
        {filteredLeads.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-2">
            <span className="text-3xl block">🎉</span>
            <h4 className="font-bold text-slate-800 text-sm">No Unsubscribed Leads Matching Criteria</h4>
            <p className="text-slate-500 text-xs max-w-sm mx-auto">
              All registered users in this view have already purchased active subscription packages or no match found.
            </p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
              >
                Clear Search Query
              </button>
            )}
          </div>
        ) : (
          filteredLeads.map(({ user, record }) => {
            const statusConfig: Record<
              SubscriptionLeadStatus,
              { bg: string; text: string; border: string; label: string }
            > = {
              NEW: {
                bg: 'bg-amber-50',
                text: 'text-amber-800',
                border: 'border-amber-200',
                label: '⚡ New Registration (Pending Call)',
              },
              CONTACTED_INTERESTED: {
                bg: 'bg-sky-50',
                text: 'text-sky-800',
                border: 'border-sky-200',
                label: '💬 Contacted · Interested in Rates',
              },
              FOLLOW_UP_SCHEDULED: {
                bg: 'bg-blue-50',
                text: 'text-blue-800',
                border: 'border-blue-200',
                label: '📅 Follow-Up Scheduled',
              },
              PAYMENT_PROMISED: {
                bg: 'bg-purple-50',
                text: 'text-purple-800',
                border: 'border-purple-200',
                label: '💳 Payment Promised (Awaiting Slip)',
              },
              CONVERTED: {
                bg: 'bg-emerald-50',
                text: 'text-emerald-800',
                border: 'border-emerald-200',
                label: '✓ Subscription Converted & Activated',
              },
              NOT_INTERESTED: {
                bg: 'bg-slate-100',
                text: 'text-slate-600',
                border: 'border-slate-200',
                label: '✕ Not Interested / Future Consideration',
              },
            };

            const cfg = statusConfig[record.status] || statusConfig.NEW;
            const latestNote = record.notes && record.notes.length > 0 ? record.notes[0] : null;

            return (
              <div
                key={user.id}
                className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs hover:border-purple-300 transition space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-purple-100 text-purple-900 font-black text-sm flex items-center justify-center shrink-0">
                      {user.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-sm font-black text-slate-900">{user.name}</strong>
                        {user.businessName && (
                          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                            {user.businessName}
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                          {user.role === 'PROVIDER'
                            ? user.providerSubtype === 'PICK_AND_DROP'
                              ? 'SHUTTLE COMMUTE'
                              : 'HOME SHIFTING & CARGO'
                            : user.role}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span>📍 {user.city}, Pakistan</span>
                        <span>•</span>
                        <span>Registered: {new Date(user.registeredAt).toLocaleDateString()}</span>
                        {record.assignedAgentName && (
                          <>
                            <span>•</span>
                            <span className="text-purple-700 font-bold">Follow-up: {record.assignedAgentName}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Pill */}
                  <span
                    className={`self-start px-3 py-1 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.text} ${cfg.border}`}
                  >
                    {cfg.label}
                  </span>
                </div>

                {/* Bio / Profile Note */}
                {user.bio && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed">
                    <strong>Host Profile Intro:</strong> &ldquo;{user.bio}&rdquo;
                  </p>
                )}

                {/* Latest Agent Follow-Up Note Preview */}
                {latestNote && (
                  <div className="p-2.5 rounded-xl bg-purple-50/60 border border-purple-200 text-xs text-purple-950 flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <span className="font-bold text-[11px] text-purple-900 block">
                        Recent Call Note by {latestNote.agentName} ({new Date(latestNote.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}):
                      </span>
                      <p className="text-[11px] text-purple-900">&ldquo;{latestNote.note}&rdquo;</p>
                    </div>
                    {record.followUpDate && (
                      <span className="shrink-0 px-2 py-0.5 rounded bg-purple-200 text-purple-900 font-bold text-[10px]">
                        Next Call: {record.followUpDate}
                      </span>
                    )}
                  </div>
                )}

                {/* Direct Action Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    {/* Call Button */}
                    <button
                      type="button"
                      onClick={() => handleCallLead({ user, record })}
                      className="px-3 py-1.5 rounded-xl border border-purple-200 bg-purple-50/80 hover:bg-purple-100 text-purple-900 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                    >
                      <Phone className="w-3.5 h-3.5 text-purple-600" />
                      <span className="font-mono">
                        {revealedPhones[user.id] ? user.phone : 'Call Host'}
                      </span>
                    </button>

                    {/* WhatsApp Onboarding Link */}
                    <a
                      href={generateWhatsAppOnboardingUrl(user, agentName)}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-2xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5 fill-white/20" />
                      <span>WhatsApp Pitch</span>
                    </a>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Log Note / Update Status */}
                    <button
                      type="button"
                      onClick={() => handleOpenNoteModal({ user, record })}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-300" />
                      <span>Log Call & Note</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Log Call & Note Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-lg p-6 shadow-2xl space-y-4 animate-scale-in max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center text-xs font-bold">
                  📝
                </span>
                <h4 className="font-heading font-extrabold text-base text-slate-900">
                  Log Subscription Follow-Up
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLead(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Lead Brief */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <strong className="text-slate-900 font-bold">{selectedLead.user.name}</strong>
                <span className="font-mono text-slate-600 font-bold">{selectedLead.user.phone}</span>
              </div>
              <p className="text-slate-500 text-[11px]">
                {selectedLead.user.businessName || `${selectedLead.user.role} Account`} · {selectedLead.user.city}
              </p>
            </div>

            {/* Status Selector */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Lead Follow-Up Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as SubscriptionLeadStatus)}
                className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold outline-none focus:border-purple-600"
              >
                <option value="NEW">⚡ New Registration (Needs Call)</option>
                <option value="CONTACTED_INTERESTED">💬 Contacted · Interested in Rates & Benefits</option>
                <option value="FOLLOW_UP_SCHEDULED">📅 Follow-Up Scheduled</option>
                <option value="PAYMENT_PROMISED">💳 Payment Promised (Sending Bank / JazzCash Slip)</option>
                <option value="CONVERTED">✓ Converted & Ready for Immediate Activation</option>
                <option value="NOT_INTERESTED">✕ Not Interested at this time</option>
              </select>
            </div>

            {/* Follow Up Date */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Next Follow-Up Date (Optional)</label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold outline-none focus:border-purple-600"
              />
            </div>

            {/* Note Textarea */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                Call Conversation Summary & Client Notes
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Spoke with host. He has 4 cars in Faisalabad, wants to pay via JazzCash tomorrow. Sent bank details via WhatsApp..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold outline-none focus:border-purple-600 resize-none"
              />
            </div>

            {/* Prior History */}
            {selectedLead.record.notes && selectedLead.record.notes.length > 0 && (
              <div className="space-y-1 pt-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase block">Previous Notes Log:</span>
                <div className="max-h-28 overflow-y-auto space-y-1.5 no-scrollbar">
                  {selectedLead.record.notes.map((n) => (
                    <div key={n.id} className="p-2 rounded-lg bg-slate-100 text-[11px] space-y-0.5">
                      <div className="flex items-center justify-between text-slate-500 text-[10px]">
                        <strong>{n.agentName}</strong>
                        <span>{new Date(n.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-800">{n.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Save Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedLead(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNote}
                className="flex-1 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold text-xs transition cursor-pointer shadow-sm"
              >
                Save Log & Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


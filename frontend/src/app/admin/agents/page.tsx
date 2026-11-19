'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
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
  Plus,
  RefreshCw,
  XCircle,
  Clock,
  Phone,
  MessageCircle,
} from 'lucide-react';
import {
  getAgentPermissions,
  saveAgentPermissions,
  getAllAgentsPermissionsMap,
  saveAllAgentsPermissionsMap,
  DEFAULT_AGENT_PERMISSIONS,
  AgentPermissions,
} from '@/data/agentPermissions';
import { getAuditLogs, recordAuditAction } from '@/data/auditLog';

interface AgentProfile {
  id: string; // e.g. AG-101
  name: string;
  first: string;
  desk: string;
  initials: string;
  tint: string;
  online: boolean;
  actionsToday: number;
  callClicks: number;
  assignedUsers: number;
}

interface AgentLogItem {
  time: string;
  type: 'Call' | 'Contacted' | 'Updated' | 'Added' | 'Approved' | 'Deleted' | 'Signed in';
  text: string;
  user: string;
  before?: string;
  after?: string;
}

export default function AdminAgentsPage() {
  const [selectedAgentIdx, setSelectedAgentIdx] = useState(0);
  const [selectedDay, setSelectedDay] = useState<'today' | 'yesterday'>('today');
  const [selectedDate, setSelectedDate] = useState('2026-11-19');
  const [selectedActionType, setSelectedActionType] = useState<string>('All');
  const [saveToast, setSaveToast] = useState<string | null>(null);

  const agents: AgentProfile[] = [
    {
      id: 'AG-101',
      name: 'Kashif Raza',
      first: 'Kashif',
      desk: 'Lahore Desk',
      initials: 'KR',
      tint: '#DCEBE3',
      online: true,
      actionsToday: 14,
      callClicks: 8,
      assignedUsers: 28,
    },
    {
      id: 'AG-102',
      name: 'Bilal Ahmed',
      first: 'Bilal',
      desk: 'Islamabad HQ',
      initials: 'BA',
      tint: '#DDE6F3',
      online: true,
      actionsToday: 22,
      callClicks: 15,
      assignedUsers: 41,
    },
    {
      id: 'AG-103',
      name: 'Ayesha Khan',
      first: 'Ayesha',
      desk: 'Karachi Desk',
      initials: 'AK',
      tint: '#F3E6D3',
      online: false,
      actionsToday: 6,
      callClicks: 4,
      assignedUsers: 33,
    },
  ];

  const curAgent = agents[selectedAgentIdx];

  // Permissions state for the 3 agents loaded from localStorage
  const [permissionsMap, setPermissionsMap] = useState<Record<string, Record<string, boolean>>>(DEFAULT_AGENT_PERMISSIONS);

  useEffect(() => {
    setPermissionsMap(getAllAgentsPermissionsMap());
    const handleUpdate = () => setPermissionsMap(getAllAgentsPermissionsMap());
    window.addEventListener('safarpk_agent_permissions_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('safarpk_agent_permissions_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const curPerms = permissionsMap[curAgent.id] || {
    view: true,
    contact: true,
    approve: false,
    verify: false,
    edit: false,
    del: false,
    analytics: false,
    export: false,
    promo: false,
  };

  const handleTogglePerm = (key: string) => {
    setPermissionsMap((prev) => ({
      ...prev,
      [curAgent.id]: {
        ...prev[curAgent.id],
        [key]: !prev[curAgent.id]?.[key],
      },
    }));
  };

  const handleSavePerms = () => {
    try {
      saveAllAgentsPermissionsMap(permissionsMap);
      recordAuditAction({
        action: 'AGENT_PERMISSION_UPDATE',
        staffId: 'SUPER_ADMIN',
        staffName: 'Super Admin',
        targetType: 'StaffAgent',
        targetId: curAgent.id,
        details: `Updated permissions for ${curAgent.name} (${curAgent.id})`,
      });
    } catch (e) {}

    setSaveToast(`✓ Access permissions saved for ${curAgent.name}`);
    setTimeout(() => setSaveToast(null), 3500);
  };

  // Agent activity logs matching Desktop-AdminAgents.dc.html
  const ACTIVITY_LOGS: Record<string, Record<'today' | 'yesterday', AgentLogItem[]>> = {
    'AG-101': {
      today: [
        { time: '5:12 pm', type: 'Call', text: 'Clicked Call to Ahmed Raza', user: 'Ahmed Raza' },
        { time: '4:50 pm', type: 'Contacted', text: 'Sent WhatsApp to Kashif Motors about pending booking SF-24817', user: 'Kashif Motors' },
        { time: '3:31 pm', type: 'Updated', text: 'Changed ticket T-1038 status (driver overcharged)', user: 'Ahmed Raza', before: 'Open', after: 'In progress' },
        { time: '2:10 pm', type: 'Added', text: 'Added note: “Asked about Civic for 14–16 Nov. Will call back after 5 pm.”', user: 'Ahmed Raza' },
        { time: '1:05 pm', type: 'Approved', text: 'Approved listing Suzuki Swift GLX 2023 after checking registration, chassis, engine and owner ID', user: 'Shahid Rent a Car' },
        { time: '12:40 pm', type: 'Deleted', text: 'Deleted duplicate note on account', user: 'Hamza Ali' },
        { time: '11:22 am', type: 'Added', text: 'Added note: “Owner called about plan renewal. Explained bank transfer steps.”', user: 'Kashif Motors' },
        { time: '11:20 am', type: 'Call', text: 'Clicked Call to Kashif Motors', user: 'Kashif Motors' },
        { time: '10:55 am', type: 'Approved', text: 'Approved payment JC-77010293 · Independent Chauffeur Pass', user: 'Imran Khan' },
        { time: '9:02 am', type: 'Signed in', text: 'Signed in to support desk', user: '—' },
      ],
      yesterday: [
        { time: '6:40 pm', type: 'Updated', text: 'Changed driver availability note', user: 'Imran Khan', before: 'City only', after: 'City + outstation' },
        { time: '3:15 pm', type: 'Contacted', text: 'Sent WhatsApp to Nadia Hussain with driver options', user: 'Nadia Hussain' },
        { time: '9:05 am', type: 'Signed in', text: 'Signed in to support desk', user: '—' },
      ],
    },
    'AG-102': {
      today: [
        { time: '4:02 pm', type: 'Updated', text: 'Changed daily rate on Corolla Altis Grande', user: 'Zaidi Executive Rentals', before: 'Rs. 9,000', after: 'Rs. 9,500' },
        { time: '2:44 pm', type: 'Call', text: 'Clicked Call to Sara Malik', user: 'Sara Malik' },
        { time: '10:10 am', type: 'Approved', text: 'Approved payment EP-55018822 · Professional Fleet Hub', user: 'Kashif Motors' },
        { time: '9:00 am', type: 'Signed in', text: 'Signed in to support desk', user: '—' },
      ],
      yesterday: [
        { time: '9:01 am', type: 'Signed in', text: 'Signed in to support desk', user: '—' },
      ],
    },
    'AG-103': {
      today: [
        { time: '11:15 am', type: 'Contacted', text: 'Sent WhatsApp to Gulberg Commute about route availability', user: 'Gulberg Commute' },
        { time: '9:12 am', type: 'Signed in', text: 'Signed in to support desk', user: '—' },
      ],
      yesterday: [
        { time: '5:30 pm', type: 'Contacted', text: 'Sent WhatsApp to Gulberg Commute about expired plan', user: 'Gulberg Commute' },
        { time: '9:10 am', type: 'Signed in', text: 'Signed in to support desk', user: '—' },
      ],
    },
  };

  const currentLogs = useMemo(() => {
    const list = ACTIVITY_LOGS[curAgent.id]?.[selectedDay] || [];
    if (selectedActionType === 'All') return list;
    return list.filter((item) => item.type === selectedActionType);
  }, [curAgent.id, selectedDay, selectedActionType]);

  const permissionSwitches = [
    { key: 'view', label: 'View all users', sub: 'Can search and view any user account' },
    { key: 'contact', label: 'Call & WhatsApp', sub: 'Can tap Call and send WhatsApp to users' },
    { key: 'approve', label: 'Approve payments', sub: 'Can verify receipts and unlock plans' },
    { key: 'verify', label: 'Verify listings / documents', sub: 'Can verify CNIC, licence, and mark Verified' },
    { key: 'edit', label: 'Edit accounts & listings', sub: 'Can edit user info and listing details' },
    { key: 'del', label: 'Delete records', sub: 'Can delete or archive records' },
    { key: 'analytics', label: 'View analytics reports', sub: 'Can see lister leads, views, and download reports' },
    { key: 'export', label: 'Export data', sub: 'Can export customer, lead, and payment CSVs' },
    { key: 'promo', label: 'Manage promo codes', sub: 'Can create and edit platform discount codes' },
  ];

  return (
    <div className="font-sans text-[#101828] bg-[#F7F8FA] min-h-screen flex flex-col md:flex-row antialiased">
      {/* 1. Super Admin Dark Navy Sidebar */}
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
          </Link>

          <Link
            href="/admin?tab=leads"
            className="w-full flex items-center justify-between h-9 px-3 rounded-xl font-medium text-xs text-slate-300 hover:text-white hover:bg-white/6 transition"
          >
            <div className="flex items-center gap-2.5">
              <Radio className="w-4 h-4 text-purple-400" />
              <span>Leads & clicks</span>
            </div>
          </Link>

          <Link
            href="/admin?tab=plans"
            className="w-full flex items-center justify-between h-9 px-3 rounded-xl font-medium text-xs text-slate-300 hover:text-white hover:bg-white/6 transition"
          >
            <div className="flex items-center gap-2.5">
              <CreditCard className="w-4 h-4 text-amber-400" />
              <span>Payments</span>
            </div>
          </Link>

          <Link
            href="/admin?tab=promocodes"
            className="w-full flex items-center justify-between h-9 px-3 rounded-xl font-medium text-xs text-slate-300 hover:text-white hover:bg-white/6 transition"
          >
            <div className="flex items-center gap-2.5">
              <Tag className="w-4 h-4 text-emerald-400" />
              <span>Promo codes</span>
            </div>
          </Link>

          <Link
            href="/admin/agents"
            className="w-full flex items-center justify-between h-10 px-3 rounded-xl font-bold text-sm bg-white/12 text-white shadow-xs transition"
          >
            <div className="flex items-center gap-2.5">
              <Headphones className="w-4 h-4 text-rose-400" />
              <span>Staff agents</span>
            </div>
            <span className="text-[10px] bg-rose-500/30 text-rose-300 px-1.5 py-0.5 rounded-md font-bold">
              3
            </span>
          </Link>

          <Link
            href="/admin/console"
            className="w-full flex items-center justify-between h-9 px-3 rounded-xl font-medium text-xs text-slate-300 hover:text-white hover:bg-white/6 transition"
          >
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>All modules →</span>
            </div>
          </Link>
        </div>

        <div className="mt-auto pt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between px-2">
          <span>Super Admin Only</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      </nav>

      {/* 2. Main Content Area */}
      <main className="flex-1 min-w-0 p-5 md:p-8 flex flex-col gap-6">
        {/* Header Breadcrumb & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#667085]">
              <Link href="/admin" className="hover:text-[#0B6B4F]">Super Admin</Link>
              <span>/</span>
              <span>Staff agents</span>
            </div>
            <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-[#101828]">
              Staff agents
            </h1>
            <p className="text-sm text-[#475467]">
              Only Super Admin can see this page. Agents never see other agents or own access switches.
            </p>
          </div>

          <button
            type="button"
            onClick={() => alert('New agent onboarding modal: Enter agent name, email, phone, and desk location.')}
            className="h-11 px-5 rounded-xl bg-[#0B6B4F] hover:bg-[#08513C] active:scale-[0.99] text-white font-bold text-sm flex items-center gap-2 transition shadow-xs cursor-pointer self-start md:self-auto"
          >
            <Plus className="w-4 h-4 stroke-[2.4]" />
            <span>+ Add agent</span>
          </button>
        </div>

        {/* 3. Agent Selector Cards */}
        <div role="radiogroup" aria-label="Staff Agent" className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {agents.map((agent, idx) => {
            const isSelected = selectedAgentIdx === idx;
            return (
              <button
                key={agent.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setSelectedAgentIdx(idx)}
                className={`p-4 rounded-2xl border text-left transition flex flex-col gap-3 cursor-pointer shadow-2xs ${
                  isSelected
                    ? 'border-[#0B6B4F] bg-white ring-2 ring-[#0B6B4F]/15 shadow-sm'
                    : 'border-[#EEF0F2] bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2.5">
                    <span
                      style={{ backgroundColor: agent.tint }}
                      className="w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-sm text-[#101828]"
                    >
                      {agent.initials}
                    </span>
                    <div className="flex flex-col">
                      <span className="font-heading font-bold text-sm text-[#101828]">
                        {agent.name}
                      </span>
                      <span className="font-mono text-xs text-[#667085]">
                        {agent.id} · {agent.desk}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      agent.online
                        ? 'bg-[#E9F3EE] text-[#08513C]'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {agent.online ? 'Online' : 'Offline'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 w-full pt-2 border-t border-slate-100">
                  <div className="flex flex-col">
                    <span className="font-heading font-extrabold text-lg text-[#101828]">
                      {agent.actionsToday}
                    </span>
                    <span className="text-[10px] font-medium text-[#667085]">actions today</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-heading font-extrabold text-lg text-[#101828]">
                      {agent.callClicks}
                    </span>
                    <span className="text-[10px] font-medium text-[#667085]">call clicks</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-heading font-extrabold text-lg text-[#101828]">
                      {agent.assignedUsers}
                    </span>
                    <span className="text-[10px] font-medium text-[#667085]">assigned users</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* 4. Two-Column Activity Log & Permissions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Activity Log */}
          <section className="lg:col-span-7 bg-white border border-[#EEF0F2] rounded-2xl p-5 md:p-6 flex flex-col gap-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="font-heading font-bold text-lg text-[#101828]">
                {curAgent.name} · activity log
              </h2>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setSelectedDay('today')}
                  className={`h-8 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedDay === 'today'
                      ? 'bg-[#101828] text-white'
                      : 'bg-[#F2F4F7] text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDay('yesterday')}
                  className={`h-8 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedDay === 'yesterday'
                      ? 'bg-[#101828] text-white'
                      : 'bg-[#F2F4F7] text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Yesterday
                </button>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="h-8 px-2 rounded-lg border border-[#D0D5DD] text-xs font-medium text-slate-700 bg-white"
                />
              </div>
            </div>

            {/* Action Type Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 border-b border-slate-100">
              {['All', 'Call', 'Contacted', 'Updated', 'Added', 'Approved', 'Deleted', 'Signed in'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedActionType(type)}
                  className={`h-7 px-2.5 rounded-md text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                    selectedActionType === type
                      ? 'bg-[#E9F3EE] text-[#08513C] border border-[#0B6B4F]'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Activity Stream */}
            <div className="divide-y divide-slate-100">
              {currentLogs.length > 0 ? (
                currentLogs.map((log, idx) => (
                  <div key={idx} className="py-3 flex items-start gap-3 text-sm">
                    <span className="font-mono text-xs text-[#667085] w-16 shrink-0 pt-0.5">
                      {log.time}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold shrink-0 ${
                        log.type === 'Approved'
                          ? 'bg-[#E9F3EE] text-[#08513C]'
                          : log.type === 'Call'
                          ? 'bg-blue-50 text-blue-700'
                          : log.type === 'Contacted'
                          ? 'bg-purple-50 text-purple-700'
                          : log.type === 'Deleted'
                          ? 'bg-rose-50 text-rose-700'
                          : log.type === 'Updated'
                          ? 'bg-amber-50 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {log.type}
                    </span>
                    <div className="flex-1 flex flex-col gap-0.5">
                      <span className="text-[#101828] font-medium leading-relaxed">
                        {log.text}
                      </span>
                      {log.before && log.after && (
                        <span className="text-xs text-slate-500">
                          <span className="line-through text-rose-600">{log.before}</span> →{' '}
                          <span className="text-emerald-700 font-bold">{log.after}</span>
                        </span>
                      )}
                      {log.user !== '—' && (
                        <span className="text-xs text-[#667085]">
                          User: <span className="font-semibold text-slate-900">{log.user}</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-sm text-[#667085]">
                  Nothing of this type on this day.
                </div>
              )}
            </div>
          </section>

          {/* Right Column: Access Permissions Switches */}
          <section className="lg:col-span-5 bg-white border border-[#EEF0F2] rounded-2xl p-5 md:p-6 flex flex-col gap-4 shadow-2xs">
            <div>
              <h2 className="font-heading font-bold text-lg text-[#101828]">
                Access for {curAgent.first}
              </h2>
              <p className="text-xs text-[#475467]">
                What this agent can do on their desk. Changes take effect on next request.
              </p>
            </div>

            <div className="divide-y divide-slate-100">
              {permissionSwitches.map((item) => {
                const isOn = !!curPerms[item.key];
                return (
                  <div key={item.key} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-[#101828]">{item.label}</span>
                      <span className="text-xs text-[#667085]">{item.sub}</span>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={isOn}
                      onClick={() => handleTogglePerm(item.key)}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                        isOn ? 'bg-[#0B6B4F]' : 'bg-slate-200'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                          isOn ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>

            {saveToast && (
              <div className="p-2.5 rounded-xl bg-[#E9F3EE] text-[#08513C] text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#0B6B4F] shrink-0" />
                <span>{saveToast}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleSavePerms}
              className="h-11 rounded-xl bg-[#101828] hover:bg-slate-800 text-white font-bold text-sm transition cursor-pointer mt-1"
            >
              Save access permissions
            </button>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={() => alert(`Password reset link generated for ${curAgent.name}.`)}
                className="h-9 rounded-lg border border-[#D0D5DD] bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition cursor-pointer"
              >
                Reset password
              </button>
              <button
                type="button"
                onClick={() => alert(`Disabled agent status for ${curAgent.name}.`)}
                className="h-9 rounded-lg border border-[#FDA29B] bg-white hover:bg-rose-50 text-xs font-bold text-[#B42318] transition cursor-pointer"
              >
                Disable agent
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

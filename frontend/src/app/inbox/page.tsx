'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AppHeader } from '@/components/AppHeader';
import { AppFooter } from '@/components/AppFooter';
import { MobileNavBar } from '@/components/MobileNavBar';
import { getActiveUser, RegisteredUser, DEMO_USERS } from '@/data/userAuth';
import {
  getUserConversations,
  getConversationMessages,
  sendChatMessage,
  markConversationAsRead,
  clearConversationHistory,
  ChatConversation,
  ChatMessage,
  formatMessageTime,
  SEVEN_DAYS_MS,
  purgeExpiredMessages,
  getWhatsAppTargetUrl,
  generateCustomerFollowUpWhatsAppText,
  generateOwnerFollowUpWhatsAppText,
  BookingMetadata,
  isListerAutoReplyEnabled,
  setListerAutoReplyEnabled,
} from '@/data/chatEngine';
import {
  MessageSquare,
  Search,
  Phone,
  Send,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Trash2,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  X,
  User,
  Check,
  CheckCheck,
  Info,
  Car,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

function InboxContent() {
  const searchParams = useSearchParams();
  const convParam = searchParams.get('conv');

  const [activeUser, setActiveUser] = useState<RegisteredUser | null>(null);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileView, setMobileView] = useState<'LIST' | 'CHAT'>('LIST');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [purgedNotification, setPurgedNotification] = useState<number | null>(null);
  const [autoReplyState, setAutoReplyState] = useState<boolean>(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Initial Load & Auth Sync
  useEffect(() => {
    const syncInbox = () => {
      const user = getActiveUser();
      if (!user) {
        setActiveUser(null);
        setConversations([]);
        setMessages([]);
        return;
      }
      setActiveUser(user);
      setAutoReplyState(isListerAutoReplyEnabled(user.id));

      // Auto purge messages older than 7 days
      const purged = purgeExpiredMessages();
      if (purged > 0) {
        setPurgedNotification(purged);
        setTimeout(() => setPurgedNotification(null), 5000);
      }

      const convs = getUserConversations(user);
      setConversations(convs);

      if (convParam && convs.some((c) => c.id === convParam)) {
        setActiveConvId(convParam);
        setMobileView('CHAT');
      } else if (convs.length > 0) {
        setActiveConvId(convs[0].id);
      }
    };

    syncInbox();
    window.addEventListener('safarpk_auth_state_changed', syncInbox);
    return () => {
      window.removeEventListener('safarpk_auth_state_changed', syncInbox);
    };
  }, [convParam]);

  // Sync auto-reply toggle across tabs/windows
  useEffect(() => {
    const handleAutoReplyToggle = (e: any) => {
      if (e.detail && typeof e.detail.enabled === 'boolean') {
        setAutoReplyState(e.detail.enabled);
      }
    };
    window.addEventListener('safarpk_autoreply_toggle', handleAutoReplyToggle);
    return () => {
      window.removeEventListener('safarpk_autoreply_toggle', handleAutoReplyToggle);
    };
  }, []);

  // 2. Load Messages when Active Conversation changes
  useEffect(() => {
    if (!activeConvId || !activeUser) return;

    markConversationAsRead(activeConvId, activeUser.id);
    const msgs = getConversationMessages(activeConvId);
    setMessages(msgs);

    // Refresh conversation list unread badges
    setConversations(getUserConversations(activeUser));

    // Scroll to bottom
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [activeConvId, activeUser]);

  // 3. Listen for Live Incoming Messages (Real-Time Bidirectional Chat)
  useEffect(() => {
    const handleChatUpdate = (e: any) => {
      if (!activeUser) return;

      const detail = e.detail;
      const convs = getUserConversations(activeUser);
      setConversations(convs);

      if (detail && detail.conversationId === activeConvId) {
        if (detail.cleared) {
          setMessages([]);
        } else {
          setMessages(getConversationMessages(activeConvId));
          markConversationAsRead(activeConvId, activeUser.id);
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      }
    };

    window.addEventListener('safarpk_chat_updated', handleChatUpdate);
    window.addEventListener('storage', handleChatUpdate);

    return () => {
      window.removeEventListener('safarpk_chat_updated', handleChatUpdate);
      window.removeEventListener('storage', handleChatUpdate);
    };
  }, [activeConvId, activeUser]);

  // Current selected conversation
  const activeConv =
    conversations.find((c) => c.id === activeConvId) || conversations[0] || null;

  // Partner ID and Name in current active conversation
  const partnerId =
    activeConv && activeUser
      ? activeConv.participantIds.find((id) => id !== activeUser.id) || 'usr-demo-lister'
      : 'usr-demo-lister';

  const partnerName =
    activeConv && activeUser
      ? activeConv.participantNames[partnerId] || 'Partner'
      : 'Kashif Motors';

  const partnerRole =
    activeConv && activeUser
      ? activeConv.participantRoles[partnerId] || 'LISTER'
      : 'LISTER';

  const partnerPhone =
    activeConv && activeUser
      ? activeConv.participantPhones[partnerId] || '+92 300 1234567'
      : '+92 300 1234567';

  // Check if viewing user is a Customer vs Lister/Driver/Provider
  const isViewerCustomer = Boolean(
    activeUser &&
      (activeUser.role === 'CUSTOMER' ||
        String(activeUser.role).toUpperCase() === 'CUSTOMER')
  );

  const isListerOrProvider = Boolean(
    activeUser &&
      activeUser.role !== 'CUSTOMER' &&
      String(activeUser.role).toUpperCase() !== 'CUSTOMER'
  );

  // Active Booking Metadata
  const meta: BookingMetadata = activeConv?.bookingMetadata || {
    category:
      partnerRole === 'DRIVER'
        ? 'driver'
        : partnerRole === 'PROVIDER'
        ? 'mover'
        : 'rent_a_car',
    customerName: isViewerCustomer ? activeUser?.name || 'Customer' : partnerName,
    customerPhone: isViewerCustomer
      ? activeUser?.phone || '+92 300 0000000'
      : partnerPhone,
    customerCity: activeUser?.city || 'Lahore',
    providerName: isViewerCustomer
      ? partnerName
      : activeUser?.businessName || activeUser?.name || 'SafarPK Host',
    providerManager: isViewerCustomer
      ? partnerName
      : activeUser?.name || 'Fleet Manager',
    providerPhone: isViewerCustomer
      ? partnerPhone
      : activeUser?.phone || '+92 300 1234567',
    itemName: activeConv?.about || 'Vehicle / Service Booking Inquiry',
    pickupDate: activeConv?.dates?.split('–')[0]?.trim() || 'Scheduled Date',
    returnDate: activeConv?.dates?.split('–')[1]?.trim() || '',
    duration: activeConv?.dates?.split('·')[1]?.trim() || '',
    totalEstimate: '',
    serviceMode: '',
    bookingRef: activeConv?.bookingRef || 'SF-10001',
  };

  // Cross-contact target details:
  // If Customer viewing -> target is Host/Driver
  // If Owner/Driver viewing -> target is Customer
  const targetName = isViewerCustomer ? meta.providerName : meta.customerName;
  const targetPhone = isViewerCustomer ? meta.providerPhone : meta.customerPhone;
  const targetRole = isViewerCustomer ? partnerRole : 'CUSTOMER';

  // Context-aware WhatsApp follow-up link
  const followUpWhatsAppText = isViewerCustomer
    ? generateCustomerFollowUpWhatsAppText(meta)
    : generateOwnerFollowUpWhatsAppText(meta);

  const followUpWhatsAppUrl = getWhatsAppTargetUrl(targetPhone, followUpWhatsAppText);

  // Handle Send Message
  const handleSendMessage = () => {
    if (!inputText.trim() || !activeConv || !activeUser) return;

    sendChatMessage({
      conversationId: activeConv.id,
      senderUser: activeUser,
      receiverId: partnerId,
      receiverName: partnerName,
      text: inputText.trim(),
      ref: activeConv.bookingRef,
      itemDetails: activeConv.about,
    });

    setInputText('');
  };

  // Handle Clear / Delete Conversation
  const handleClearChat = () => {
    if (!activeConv) return;
    clearConversationHistory(activeConv.id);
    setMessages([]);
    setShowClearConfirm(false);
  };

  // Filter conversations by search query
  const filteredConversations = conversations.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const names = Object.values(c.participantNames).join(' ').toLowerCase();
    const about = (c.about || '').toLowerCase();
    const ref = (c.bookingRef || '').toLowerCase();
    return names.includes(q) || about.includes(q) || ref.includes(q);
  });

  if (!activeUser) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] font-sans text-[#101828] flex flex-col pb-20 md:pb-0">
        <AppHeader />
        <main className="flex-1 max-w-[560px] w-full mx-auto px-4 py-16 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-5 text-[#0B6B4F] shadow-xs">
            <MessageSquare className="w-8 h-8" />
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-[#101828] mb-2">
            Sign In to View Messages
          </h1>
          <p className="text-xs sm:text-sm text-[#667085] mb-6 max-w-sm leading-relaxed">
            Direct chat, booking updates, and partner messages are private to your account. Please log in or create an account to start or continue your conversations.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
            <Link
              href="/login?returnUrl=/inbox"
              className="flex-1 h-11 rounded-xl bg-[#0B6B4F] text-white font-bold text-xs sm:text-sm flex items-center justify-center hover:bg-[#08513C] shadow-xs transition"
            >
              Sign In
            </Link>
            <Link
              href="/register?returnUrl=/inbox"
              className="flex-1 h-11 rounded-xl bg-white border border-[#D0D5DD] text-[#344054] font-bold text-xs sm:text-sm flex items-center justify-center hover:bg-slate-50 transition"
            >
              Create Account
            </Link>
          </div>
        </main>
        <AppFooter />
        <MobileNavBar />
      </div>
    );
  }

  return (
    <div
      className={`bg-slate-50 font-sans text-[#101828] flex flex-col antialiased ${
        mobileView === 'CHAT' ? 'h-[100dvh] overflow-hidden' : 'min-h-screen'
      }`}
    >
      {/* 1. Global Navigation Header (Hidden in active mobile chat to give 100% app experience) */}
      <div className={mobileView === 'CHAT' ? 'hidden md:block' : 'block'}>
        <AppHeader />
      </div>

      {/* Purged Notification Toast if 7-day retention cleaned old messages */}
      {purgedNotification !== null && purgedNotification > 0 && (
        <div className="bg-emerald-700 text-white text-xs font-semibold py-2 px-4 text-center flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          <span>
            7-Day Retention: Cleaned {purgedNotification} expired message(s) to optimize storage.
          </span>
        </div>
      )}

      {/* Main Container */}
      <main
        className={`flex-1 max-w-[1280px] w-full mx-auto flex flex-col md:flex-row min-w-0 ${
          mobileView === 'CHAT'
            ? 'h-[100dvh] md:h-[calc(100vh-130px)] overflow-hidden'
            : 'min-h-[640px]'
        }`}
      >
        {/* ===================================================================== */}
        {/* 1. THREADS SIDEBAR (List of conversations)                             */}
        {/* ===================================================================== */}
        <aside
          className={`w-full md:w-80 lg:w-96 border-r border-slate-200 flex flex-col bg-white shrink-0 ${
            mobileView === 'CHAT' ? 'hidden md:flex' : 'flex flex-1'
          }`}
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-200 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h1 className="font-heading font-extrabold text-xl sm:text-2xl text-slate-900">
                Messages
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E9F3EE] text-[#0B6B4F]">
                {conversations.length} Active
              </span>
            </div>

            {/* Current Active Account Indicator */}
            {activeUser && (
              <div className="flex items-center justify-between text-xs py-1.5 px-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-600 truncate">
                  Logged in as <strong>{activeUser.name}</strong>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase">
                  {activeUser.role}
                </span>
              </div>
            )}

            {/* Search */}
            <div className="flex items-center gap-2 px-3 h-10 rounded-xl bg-slate-100 border border-slate-200/80">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, vehicle or ref..."
                className="bg-transparent text-xs sm:text-sm text-slate-900 outline-none w-full placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 no-scrollbar">
            {filteredConversations.length > 0 ? (
              filteredConversations.map((c) => {
                const selected = c.id === activeConvId;
                const pId = activeUser
                  ? c.participantIds.find((id) => id !== activeUser.id) || ''
                  : '';
                const pName = c.participantNames[pId] || 'Partner';
                const unreadCount = (activeUser && c.unreadCountFor?.[activeUser.id]) || 0;

                const initials = pName
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();

                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setActiveConvId(c.id);
                      setMobileView('CHAT');
                    }}
                    className={`w-full p-4 text-left flex items-start gap-3 transition cursor-pointer ${
                      selected
                        ? 'bg-emerald-50/70 border-l-4 border-l-[#0B6B4F]'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="relative w-12 h-12 rounded-full bg-[#E9F3EE] text-[#0B6B4F] flex items-center justify-center font-heading font-extrabold text-sm shrink-0">
                      {initials}
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-sm text-slate-900 truncate">
                          {pName}
                        </span>
                        <span className="text-[11px] text-slate-400 whitespace-nowrap">
                          {formatMessageTime(c.lastMessageTimestamp)}
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 font-medium truncate mt-0.5">
                        {c.about}
                      </p>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {c.lastMessageText}
                      </p>
                    </div>

                    {unreadCount > 0 && (
                      <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-[#0B6B4F] text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-xs">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
                <p>No conversations found</p>
              </div>
            )}
          </div>
        </aside>

        {/* ===================================================================== */}
        {/* 2. ACTIVE CHAT WORKSPACE (Native Mobile App Look & Full-Screen Feel)    */}
        {/* ===================================================================== */}
        <section
          className={`flex-1 flex flex-col bg-white min-w-0 relative ${
            mobileView === 'LIST' ? 'hidden md:flex' : 'flex h-[100dvh] md:h-full'
          }`}
        >
          {activeConv ? (
            <>
              {/* =============================================================== */}
              {/* 2A. NATIVE CHAT TOP APP BAR                                     */}
              {/* =============================================================== */}
              <div className="sticky top-0 z-30 bg-white border-b border-slate-200 px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2 shadow-2xs">
                {/* Left: Back Arrow (mobile) + Partner Avatar & Info */}
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => setMobileView('LIST')}
                    className="md:hidden p-2 -ml-1.5 rounded-full text-slate-700 hover:bg-slate-100 active:scale-95 transition"
                    aria-label="Back to conversations"
                  >
                    <ArrowLeft className="w-5 h-5 stroke-[2.4]" />
                  </button>

                  <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#0B6B4F] text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs">
                    {partnerName.slice(0, 2).toUpperCase()}
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                  </div>

                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 truncate">
                      <h2 className="font-heading font-extrabold text-sm sm:text-base text-slate-900 truncate">
                        {partnerName}
                      </h2>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 shrink-0 uppercase">
                        {partnerRole}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-semibold truncate">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                      <span>Online · Verified SafarPK Member</span>
                    </div>
                  </div>
                </div>

                {/* Right: Action Buttons (Call, WhatsApp, Details, Auto-Reply) */}
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  {/* Auto-Reply Switch: Strictly for Listers / Drivers / Providers ONLY (Hidden for Customers) */}
                  {isListerOrProvider && (
                    <button
                      type="button"
                      onClick={() => {
                        const next = !autoReplyState;
                        if (activeUser) {
                          setListerAutoReplyEnabled(activeUser.id, next);
                        }
                        setAutoReplyState(next);
                      }}
                      className={`h-9 px-2.5 sm:px-3 rounded-full sm:rounded-xl border text-[11px] sm:text-xs font-bold flex items-center gap-1 transition cursor-pointer shadow-2xs ${
                        autoReplyState
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                          : 'border-slate-300 bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                      title={
                        autoReplyState
                          ? 'Lister Auto-Reply is ON (Customer gets instant inquiry acknowledgement & phone/WhatsApp contact on first message)'
                          : 'Lister Auto-Reply is OFF (100% manual chatting)'
                      }
                    >
                      <Sparkles
                        className={`w-3.5 h-3.5 ${
                          autoReplyState ? 'text-emerald-600' : 'text-slate-400'
                        }`}
                      />
                      <span className="hidden sm:inline">Auto-Reply:</span>
                      <span className="font-extrabold">{autoReplyState ? 'ON' : 'OFF'}</span>
                    </button>
                  )}

                  {/* 1-Tap Direct Call */}
                  <a
                    href={`tel:${targetPhone}`}
                    className="h-9 px-2.5 sm:px-3.5 rounded-full sm:rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-2xs"
                    title={`Call ${targetName} (${targetPhone})`}
                  >
                    <Phone className="w-3.5 h-3.5 text-[#0B6B4F]" />
                    <span className="hidden sm:inline">Call</span>
                  </a>

                  {/* 1-Tap Direct WhatsApp with Pre-filled Message */}
                  <a
                    href={followUpWhatsAppUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="h-9 px-3 sm:px-4 rounded-full sm:rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-extrabold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-xs"
                    title={`Open WhatsApp with pre-filled message`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">WhatsApp</span>
                  </a>

                  {/* Details Toggle Button */}
                  <button
                    type="button"
                    onClick={() => setShowDetailsDrawer(!showDetailsDrawer)}
                    className={`h-9 px-2 sm:px-2.5 rounded-full sm:rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition ${
                      showDetailsDrawer
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                    title="Toggle Booking & Contact Details"
                  >
                    <Info className="w-4 h-4" />
                    <span className="hidden lg:inline">Details</span>
                  </button>

                  {/* Clear Chat Trash */}
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(true)}
                    className="w-8 h-8 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition cursor-pointer"
                    title="Clear Conversation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* =============================================================== */}
              {/* 2B. SLIM 1-LINE BOOKING CONTEXT STRIP                           */}
              {/* =============================================================== */}
              {activeConv.bookingRef && (
                <div className="bg-[#E9F3EE] border-b border-[#D4E8DC] px-3.5 sm:px-4 py-1.5 flex items-center justify-between gap-2 text-xs shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono font-black text-[10px] sm:text-xs px-2 py-0.5 rounded bg-white text-[#0B6B4F] border border-emerald-200 shrink-0">
                      {activeConv.bookingRef}
                    </span>
                    <span className="font-extrabold text-[#101828] truncate text-xs">
                      {meta.itemName}
                    </span>
                    {meta.totalEstimate && (
                      <span className="text-[#0B6B4F] font-bold shrink-0 hidden sm:inline">
                        · {meta.totalEstimate}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDetailsDrawer(!showDetailsDrawer)}
                    className="text-[#0B6B4F] font-bold text-xs flex items-center gap-1 hover:underline shrink-0"
                  >
                    <span>{showDetailsDrawer ? 'Hide Details' : 'View Details'}</span>
                    {showDetailsDrawer ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              )}

              {/* =============================================================== */}
              {/* 2C. SLIDING INQUIRY & CONTACT DETAILS DRAWER                    */}
              {/* =============================================================== */}
              {showDetailsDrawer && activeConv.bookingRef && (
                <div className="bg-white border-b border-slate-200 p-4 sm:p-5 shadow-lg animate-in slide-in-from-top-2 duration-200 shrink-0">
                  <div className="max-w-xl mx-auto flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          {activeConv.bookingRef}
                        </span>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Booking Details & Contact
                        </span>
                      </div>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {activeConv.bookingStatus || 'Confirmed'}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-heading font-extrabold text-sm sm:text-base text-slate-900">
                        {meta.itemName}
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {meta.pickupDate} {meta.returnDate ? `– ${meta.returnDate}` : ''}{' '}
                        {meta.duration ? `· ${meta.duration}` : ''}{' '}
                        {meta.serviceMode ? `· ${meta.serviceMode}` : ''}
                      </p>
                      {meta.totalEstimate && (
                        <p className="text-xs font-bold text-emerald-700 mt-1">
                          Estimate: {meta.totalEstimate}
                        </p>
                      )}
                    </div>

                    {/* Both Parties' Direct Contacts */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-2">
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            {isViewerCustomer
                              ? 'Provider / Fleet Manager'
                              : 'Customer / Booker'}
                          </span>
                          <span className="font-bold text-slate-900 text-sm">
                            {targetName}
                          </span>
                          <span className="text-slate-500 font-mono text-xs ml-2">
                            {targetPhone}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white border border-slate-200 text-slate-700 uppercase">
                          {targetRole}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <a
                          href={`tel:${targetPhone}`}
                          className="flex-1 h-9 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-900 flex items-center justify-center gap-1.5 transition shadow-2xs"
                        >
                          <Phone className="w-3.5 h-3.5 text-[#0B6B4F]" />
                          <span>Call {isViewerCustomer ? 'Host' : 'Customer'}</span>
                        </a>

                        <a
                          href={followUpWhatsAppUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 h-9 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-extrabold flex items-center justify-center gap-1.5 transition shadow-xs"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Direct WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Clear Confirmation Prompt */}
              {showClearConfirm && (
                <div className="p-3 bg-rose-50 border-b border-rose-200 flex items-center justify-between text-xs text-rose-900 animate-in fade-in shrink-0">
                  <span>Delete all messages in this conversation?</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleClearChat}
                      className="px-3 py-1 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-700 transition"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowClearConfirm(false)}
                      className="px-3 py-1 rounded-lg border border-slate-300 bg-white font-bold text-slate-700 hover:bg-slate-50 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* =============================================================== */}
              {/* 2D. CHAT MESSAGE STREAM                                         */}
              {/* =============================================================== */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-5 flex flex-col gap-3 bg-[#EFEAE2] sm:bg-[#F4F6F8]">
                {/* Date Header Pill */}
                <div className="flex justify-center my-1">
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-white/90 text-slate-600 shadow-2xs backdrop-blur-sm border border-slate-200/50">
                    Today
                  </span>
                </div>

                {messages.map((m) => {
                  const isMe = activeUser
                    ? m.senderId === activeUser.id
                    : m.senderRole === 'CUSTOMER';

                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-[70%] p-3 sm:p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-2xs ${
                          isMe
                            ? 'bg-[#0B6B4F] text-white rounded-br-xs'
                            : 'bg-white border border-slate-200/80 text-slate-900 rounded-bl-xs'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{m.text}</p>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 px-1 mt-1">
                        <span>{m.timeStr}</span>
                        {isMe && (
                          <CheckCheck
                            className={`w-3.5 h-3.5 ${
                              m.read ? 'text-emerald-500' : 'text-slate-400'
                            }`}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* =============================================================== */}
              {/* 2E. STICKY BOTTOM INPUT BAR                                     */}
              {/* =============================================================== */}
              <div className="p-2 sm:p-3 bg-white border-t border-slate-200 flex items-center gap-2 pb-safe shrink-0 shadow-lg">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={`Write a message to ${partnerName}...`}
                  className="flex-1 h-11 px-4 border border-slate-200 rounded-full font-sans text-xs sm:text-sm text-slate-900 outline-none focus:border-[#0B6B4F] focus:ring-1 focus:ring-[#0B6B4F] bg-slate-50 focus:bg-white transition"
                />
                <button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={!inputText.trim()}
                  className="w-11 h-11 rounded-full bg-[#0B6B4F] text-white flex items-center justify-center hover:bg-[#08513C] transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 shadow-md shrink-0"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 space-y-3">
              <MessageSquare className="w-12 h-12 text-slate-300" />
              <h3 className="font-bold text-base text-slate-700">No conversation selected</h3>
              <p className="text-xs max-w-sm text-slate-400">
                Choose a conversation from the left to read messages and chat directly with verified hosts, drivers, or clients.
              </p>
            </div>
          )}
        </section>
      </main>

      {/* Footer (Hidden in active chat mode) */}
      <div className={mobileView === 'CHAT' ? 'hidden' : 'hidden md:block'}>
        <AppFooter />
      </div>

      {/* Bottom Nav Bar (Hidden in active chat mode so input bar stays at bottom) */}
      <div className={mobileView === 'CHAT' ? 'hidden' : 'block'}>
        <MobileNavBar />
      </div>
    </div>
  );
}

export default function InboxPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center p-8">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <InboxContent />
    </React.Suspense>
  );
}

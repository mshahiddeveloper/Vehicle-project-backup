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
  isAutoReplyEnabled,
  setAutoReplyEnabled,
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
  const [purgedNotification, setPurgedNotification] = useState<number | null>(null);
  const [autoReplyState, setAutoReplyState] = useState<boolean>(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Initial Load & Auth Sync
  useEffect(() => {
    setAutoReplyState(isAutoReplyEnabled());

    let user = getActiveUser();
    if (!user) {
      // Default to customer demo session if guest visits messages
      user = DEMO_USERS.find((u) => u.role === 'CUSTOMER') || DEMO_USERS[0];
    }
    setActiveUser(user);

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
  const partnerId = activeConv && activeUser
    ? activeConv.participantIds.find((id) => id !== activeUser.id) || 'usr-demo-lister'
    : 'usr-demo-lister';

  const partnerName = activeConv && activeUser
    ? activeConv.participantNames[partnerId] || 'Partner'
    : 'Kashif Motors';

  const partnerRole = activeConv && activeUser
    ? activeConv.participantRoles[partnerId] || 'LISTER'
    : 'LISTER';

  const partnerPhone = activeConv && activeUser
    ? activeConv.participantPhones[partnerId] || '+92 300 1234567'
    : '+92 300 1234567';

  // Check if viewing user is a Customer
  const isViewerCustomer = Boolean(
    activeUser &&
      (activeUser.role === 'CUSTOMER' ||
        String(activeUser.role).toUpperCase() === 'CUSTOMER')
  );

  // Active Booking Metadata
  const meta: BookingMetadata = activeConv?.bookingMetadata || {
    category: (partnerRole === 'DRIVER'
      ? 'driver'
      : partnerRole === 'PROVIDER'
      ? 'mover'
      : 'rent_a_car'),
    customerName: isViewerCustomer
      ? activeUser?.name || 'Customer'
      : partnerName,
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
  // If Customer viewing -> target is Host/Provider
  // If Owner viewing -> target is Customer
  const targetName = isViewerCustomer ? meta.providerName : meta.customerName;
  const targetPhone = isViewerCustomer ? meta.providerPhone : meta.customerPhone;
  const targetRole = isViewerCustomer ? partnerRole : 'CUSTOMER';

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

  return (
    <div className="min-h-screen bg-white font-sans text-[#101828] flex flex-col">
      <AppHeader />

      {/* Purged Notification Toast if 7-day retention cleaned old messages */}
      {purgedNotification !== null && purgedNotification > 0 && (
        <div className="bg-emerald-700 text-white text-xs font-semibold py-2 px-4 text-center flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          <span>
            7-Day Retention: Cleaned {purgedNotification} expired message(s) to optimize performance.
          </span>
        </div>
      )}

      <main className="flex-1 max-w-[1240px] w-full mx-auto border-x border-[#EEF0F2] flex flex-col md:flex-row min-h-[680px]">
        {/* 1. Threads Sidebar (Hidden on mobile when chat is active) */}
        <aside
          className={`w-full md:w-80 lg:w-96 border-r border-[#EEF0F2] flex flex-col bg-white ${
            mobileView === 'CHAT' ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Header */}
          <div className="p-4 border-b border-[#EEF0F2] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h1 className="font-heading font-extrabold text-lg sm:text-2xl text-[#101828]">Messages</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E9F3EE] text-[#0B6B4F]">
                {conversations.length} Active
              </span>
            </div>

            {/* Current Active Account Indicator */}
            {activeUser && (
              <div className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-600 truncate">
                  Chatting as <strong>{activeUser.name}</strong>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  {activeUser.role}
                </span>
              </div>
            )}

            {/* Search */}
            <div className="flex items-center gap-2 px-3 h-10 rounded-xl bg-[#F2F4F7]">
              <Search className="w-4 h-4 text-[#667085]" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or reference..."
                className="bg-transparent text-xs sm:text-sm text-[#101828] outline-none w-full"
              />
            </div>
          </div>

          {/* 7-Day Auto Retention Callout */}
          <div className="p-3 bg-[#F4F7F5] border-b border-[#EEF0F2] flex items-center gap-2 text-[11px] text-[#475467]">
            <ShieldCheck className="w-4 h-4 text-[#0B6B4F] shrink-0" />
            <span>Messages auto-expire after 7 days to keep storage lightweight.</span>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#F0F2F4] no-scrollbar">
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
                      selected ? 'bg-[#F7F8FA] border-l-4 border-l-[#0B6B4F]' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-11 h-11 rounded-full bg-[#E9F3EE] text-[#0B6B4F] flex items-center justify-center font-heading font-extrabold text-sm shrink-0">
                      {initials}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-sm text-[#101828] truncate">{pName}</span>
                        <span className="text-[11px] text-[#667085] whitespace-nowrap">
                          {formatMessageTime(c.lastMessageTimestamp)}
                        </span>
                      </div>

                      <p className="text-xs text-[#475467] font-medium truncate">{c.about}</p>
                      <p className="text-xs text-[#667085] truncate mt-0.5">{c.lastMessageText}</p>
                    </div>

                    {unreadCount > 0 && (
                      <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-[#0B6B4F] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
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

        {/* 2. Conversation Active View */}
        <section
          className={`flex-1 flex flex-col bg-[#FAFBFC] min-w-0 ${
            mobileView === 'LIST' ? 'hidden md:flex' : 'flex'
          }`}
        >
          {activeConv ? (
            <>
              {/* Top Conversation Header */}
              <div className="p-4 bg-white border-b border-[#EEF0F2] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {/* Mobile Back Button */}
                  <button
                    type="button"
                    onClick={() => setMobileView('LIST')}
                    className="md:hidden p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <div className="w-10 h-10 rounded-full bg-[#E9F3EE] text-[#0B6B4F] flex items-center justify-center font-bold text-sm shrink-0">
                    {partnerName.slice(0, 2).toUpperCase()}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-heading font-bold text-base text-[#101828]">
                        {partnerName}
                      </h2>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {partnerRole}
                      </span>
                    </div>
                    <p className="text-xs text-[#475467] truncate max-w-xs sm:max-w-md">
                      {activeConv.about}
                    </p>
                  </div>
                </div>

                {/* Header Actions: Call & WhatsApp with Platform Redirection */}
                <div className="flex items-center gap-2">
                  {/* Auto-Reply Simulation Switch */}
                  <button
                    type="button"
                    onClick={() => {
                      const nextVal = !autoReplyState;
                      setAutoReplyEnabled(nextVal);
                      setAutoReplyState(nextVal);
                    }}
                    className={`h-9 px-2.5 sm:px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                      autoReplyState
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                        : 'border-slate-300 bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                    title={
                      autoReplyState
                        ? 'Smart Host Replies active (Click to turn OFF for pure manual 2-way chat)'
                        : 'Pure manual mode active (Click to turn ON dynamic host replies)'
                    }
                  >
                    <Sparkles
                      className={`w-3.5 h-3.5 ${autoReplyState ? 'text-emerald-600' : 'text-slate-400'}`}
                    />
                    <span className="hidden sm:inline">Auto-Reply:</span>
                    <span className="font-extrabold">{autoReplyState ? 'ON' : 'OFF'}</span>
                  </button>

                  <a
                    href={`tel:${targetPhone}`}
                    className="h-9 px-3 rounded-xl border border-[#D0D5DD] bg-white text-xs font-bold text-[#101828] flex items-center gap-1.5 hover:bg-slate-50 transition"
                    title={`Call ${targetName} (${targetPhone})`}
                  >
                    <Phone className="w-3.5 h-3.5 text-[#0B6B4F]" />
                    <span className="hidden sm:inline">Call {isViewerCustomer ? 'Host' : 'Customer'}</span>
                  </a>

                  <a
                    href={followUpWhatsAppUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="h-9 px-3 rounded-xl bg-[#0B6B4F] text-white text-xs font-bold flex items-center gap-1.5 hover:bg-[#08513C] transition shadow-xs"
                    title={`WhatsApp ${targetName} (Opens Web on desktop, App on mobile)`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">WhatsApp {isViewerCustomer ? 'Host' : 'Customer'}</span>
                  </a>

                  {/* Clear Chat Button */}
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(true)}
                    className="h-9 px-2.5 rounded-xl border border-slate-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    title="Clear Chat History"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Clear</span>
                  </button>
                </div>
              </div>

              {/* 7-Day Expiry Banner & Clear Confirm */}
              <div className="px-4 py-2 bg-[#F4F7F5] border-b border-[#EEF0F2] flex items-center justify-between text-xs text-[#475467]">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-[#0B6B4F]" />
                  <span>
                    7-Day Chat Policy: Messages are automatically deleted 7 days after delivery.
                  </span>
                </div>
                <span className="text-[11px] font-mono font-bold text-slate-500">TTL: 7 Days</span>
              </div>

              {showClearConfirm && (
                <div className="p-3 bg-rose-50 border-b border-rose-200 flex items-center justify-between text-xs text-rose-900 animate-in fade-in">
                  <span>Are you sure you want to delete all messages in this conversation?</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleClearChat}
                      className="px-3 py-1 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-700 transition"
                    >
                      Yes, Clear Now
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

              {/* Booking & Direct Cross-Contact Inquiry Card */}
              <div className="p-4 sm:p-6 flex-1 overflow-y-auto flex flex-col gap-4">
                {activeConv.bookingRef && (
                  <div className="max-w-xl mx-auto w-full p-4 sm:p-5 rounded-2xl bg-white border border-[#E4E7EC] shadow-xs flex flex-col gap-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-md font-mono text-xs font-extrabold bg-[#E9F3EE] text-[#08513C] border border-emerald-200">
                          {activeConv.bookingRef}
                        </span>
                        <span className="text-[11px] font-bold text-[#667085] tracking-wider uppercase">
                          Booking Inquiry Details
                        </span>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          activeConv.bookingStatus === 'Confirmed'
                            ? 'bg-[#E9F3EE] text-[#08513C]'
                            : 'bg-[#FFF4E0] text-[#8A4B00]'
                        }`}
                      >
                        {activeConv.bookingStatus || 'Confirmed'}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-sm sm:text-base text-[#101828]">
                        {meta.itemName}
                      </h4>
                      <p className="text-xs text-[#475467] mt-0.5">
                        {meta.pickupDate} {meta.returnDate ? `– ${meta.returnDate}` : ''} {meta.duration ? `· ${meta.duration}` : ''} {meta.serviceMode ? `· ${meta.serviceMode}` : ''}
                      </p>
                      {meta.totalEstimate && (
                        <p className="text-xs font-bold text-[#0B6B4F] mt-1">
                          Total Estimate: {meta.totalEstimate}
                        </p>
                      )}
                    </div>

                    {/* Both Parties Cross-Contact Info Panel */}
                    <div className="p-3.5 rounded-xl bg-[#F7F8FA] border border-[#EEF0F2] flex flex-col gap-2.5">
                      <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            {isViewerCustomer ? 'Vehicle Host / Fleet Manager' : 'Customer Booker'}
                          </span>
                          <span className="font-bold text-[#101828] text-sm">
                            {targetName}
                          </span>
                          <span className="text-slate-500 font-mono text-xs ml-2">
                            {targetPhone}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white border border-slate-200 text-slate-700">
                          {targetRole}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-1 flex-wrap">
                        <a
                          href={`tel:${targetPhone}`}
                          className="flex-1 min-w-[120px] h-9 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-[#101828] flex items-center justify-center gap-1.5 transition shadow-2xs"
                        >
                          <Phone className="w-3.5 h-3.5 text-[#0B6B4F]" />
                          <span>Call {isViewerCustomer ? 'Host' : 'Customer'}</span>
                        </a>

                        <a
                          href={followUpWhatsAppUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 min-w-[150px] h-9 rounded-xl bg-[#0B6B4F] hover:bg-[#08513C] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Direct WhatsApp</span>
                        </a>
                      </div>

                      <p className="text-[11px] text-slate-500 leading-tight">
                        ⚡ <strong>Direct Connect:</strong> If there is any delay or either party is not replying in chat, click Call or WhatsApp above to connect directly. All booking specifications are pre-formatted automatically (opens WhatsApp Web on PC, WhatsApp app on mobile).
                      </p>
                    </div>
                  </div>
                )}

                {/* Message Bubbles */}
                <div className="flex flex-col gap-3">
                  {messages.map((m) => {
                    const isMe = activeUser ? m.senderId === activeUser.id : m.senderRole === 'CUSTOMER';

                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-[75%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                            isMe
                              ? 'bg-[#101828] text-white rounded-br-xs shadow-xs'
                              : 'bg-white border border-[#EEF0F2] text-[#101828] rounded-bl-xs shadow-2xs'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{m.text}</p>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-[#667085] px-1 mt-1">
                          <span>{m.timeStr}</span>
                          {isMe && (
                            <CheckCheck
                              className={`w-3.5 h-3.5 ${m.read ? 'text-emerald-500' : 'text-slate-400'}`}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Message Input Box */}
              <div className="p-3 bg-white border-t border-[#EEF0F2] flex items-center gap-2">
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
                  className="flex-1 h-11 px-4 border border-[#E4E7EC] rounded-xl font-sans text-xs sm:text-sm text-[#101828] outline-none focus:border-[#0B6B4F]"
                />
                <button
                  type="button"
                  onClick={handleSendMessage}
                  className="h-11 px-5 rounded-xl bg-[#0B6B4F] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 hover:bg-[#08513C] transition cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Send</span>
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

      <AppFooter />
      <MobileNavBar />
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

'use client';

import { RegisteredUser, getActiveUser, DEMO_USERS } from './userAuth';
import { getApiBaseUrl } from '../lib/api';

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  receiverId: string;
  receiverName: string;
  text: string;
  timestamp: number; // Unix timestamp in ms
  timeStr: string;
  read: boolean;
  ref?: string;
  expiresAt: number; // 7 days from creation
  deleted?: boolean;
}

export type ServiceCategory = 'rent_a_car' | 'driver' | 'city_to_city' | 'shuttle' | 'mover';

export interface BookingMetadata {
  category: ServiceCategory;
  customerName: string;
  customerPhone: string;
  customerCity?: string;
  providerName: string; // company or driver or operator
  providerManager?: string; // manager fleet or driver name
  providerPhone: string;
  itemName: string;
  pickupDate?: string;
  returnDate?: string;
  duration?: string;
  totalEstimate?: string;
  serviceMode?: string; // With Chauffeur vs Self-Drive
  bookingRef: string;
}

export interface ChatConversation {
  id: string;
  participantIds: string[];
  participantNames: Record<string, string>;
  participantRoles: Record<string, string>;
  participantPhones: Record<string, string>;
  about: string;
  bookingRef?: string;
  bookingStatus?: 'Waiting for owner' | 'Confirmed' | 'Completed' | 'Pending';
  itemDetails?: string;
  dates?: string;
  bookingMetadata?: BookingMetadata;
  lastMessageText: string;
  lastMessageTimestamp: number;
  unreadCountFor: Record<string, number>;
  updatedAt: number;
}

// 7-Day Retention Limit in Milliseconds
export const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const STORAGE_KEY_MESSAGES = 'safarpk_chat_messages_v2';
const STORAGE_KEY_CONVERSATIONS = 'safarpk_chat_conversations_v2';

/**
 * Format timestamp nicely into 12-hour time or date
 */
export function formatMessageTime(ts: number): string {
  const date = new Date(ts);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }
}

/**
 * Detect if visitor is on a mobile device or desktop web browser
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Normalize phone number for international WhatsApp wa.me links
 * e.g. 03001234567 -> 923001234567, +92 300 1234567 -> 923001234567
 */
export function normalizeWhatsAppPhone(phone: string): string {
  let clean = (phone || '').replace(/\D/g, '');
  if (clean.startsWith('00')) {
    clean = clean.slice(2);
  }
  if (clean.startsWith('0') && clean.length === 11) {
    clean = '92' + clean.slice(1);
  }
  return clean;
}

/**
 * Generate platform-aware WhatsApp direct link:
 * - If on mobile -> redirects to native WhatsApp App (`api.whatsapp.com/send` or `wa.me`)
 * - If on desktop -> redirects directly to WhatsApp Web (`web.whatsapp.com/send`)
 */
export function getWhatsAppTargetUrl(phone: string, text: string): string {
  const cleanPhone = normalizeWhatsAppPhone(phone);
  const encodedText = encodeURIComponent(text);
  if (isMobileDevice()) {
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
  } else {
    return `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
  }
}

/**
 * Generate structured follow-up text for Customer to send to Owner
 * Includes full interested vehicle, dates, duration, total estimate, and booking ref.
 */
export function generateCustomerFollowUpWhatsAppText(meta: BookingMetadata): string {
  const provider = meta.providerManager || meta.providerName || 'Owner';
  const lines = [
    `Assalam-o-Alaikum ${provider}!`,
    `My name is ${meta.customerName} (${meta.customerPhone}).`,
    `I sent you a booking inquiry on SafarPK chat (Ref: ${meta.bookingRef}):`,
    `• Interested in: ${meta.itemName} ${meta.serviceMode ? `(${meta.serviceMode})` : ''}`,
  ];
  if (meta.customerCity) lines.push(`• City/Area: ${meta.customerCity}`);
  if (meta.pickupDate) {
    lines.push(`• Scheduled: ${meta.pickupDate} ${meta.returnDate ? `to ${meta.returnDate}` : ''} ${meta.duration ? `(${meta.duration})` : ''}`);
  }
  if (meta.totalEstimate) lines.push(`• Total Estimate: ${meta.totalEstimate}`);
  lines.push(`I sent a message on the SafarPK chat earlier. Following up directly here on WhatsApp. Are you available?`);
  return lines.join('\n');
}

/**
 * Generate structured follow-up text for Owner/Provider to send to Customer
 * Custom-tailored as per the contractor category:
 * - Rent a Car: Company name, fleet manager, vehicle details, date inquiry
 * - Driver: Driver name, verified chauffeur credentials, date & city inquiry
 * - Shuttle / Route: Route operator, monthly seat details
 * - Mover: Moving company, cargo truck & helpers inquiry
 */
export function generateOwnerFollowUpWhatsAppText(meta: BookingMetadata): string {
  const cat = meta.category || 'rent_a_car';
  const cust = meta.customerName || 'Valued Customer';
  const ref = meta.bookingRef || 'SafarPK';

  if (cat === 'rent_a_car') {
    const comp = meta.providerName || 'SafarPK Rent a Car';
    const mgr = meta.providerManager || 'Fleet Manager';
    return [
      `Assalam-o-Alaikum ${cust}!`,
      `This is ${mgr} from ${comp}.`,
      `Regarding your vehicle booking inquiry on SafarPK (Ref: ${ref}) for ${meta.itemName} ${meta.serviceMode ? `(${meta.serviceMode})` : ''} from ${meta.pickupDate || 'your dates'} ${meta.returnDate ? `to ${meta.returnDate}` : ''} ${meta.duration ? `(${meta.duration})` : ''} in ${meta.customerCity || 'your city'}.`,
      `Are you still looking for this vehicle or interested? We have this car ready for you and can confirm your reservation right away.`,
    ].join('\n');
  }

  if (cat === 'driver') {
    return [
      `Assalam-o-Alaikum ${cust}!`,
      `This is ${meta.providerName} (Professional Chauffeur on SafarPK).`,
      `Regarding your driver hiring inquiry (Ref: ${ref}) for ${meta.pickupDate || 'your scheduled date'} in ${meta.customerCity || 'your city'}.`,
      `Are you still looking for a professional driver or interested? I am available and ready for your duty.`,
    ].join('\n');
  }

  if (cat === 'shuttle') {
    return [
      `Assalam-o-Alaikum ${cust}!`,
      `This is ${meta.providerName} from ${meta.providerManager || 'Commuter Shuttle Services'}.`,
      `Regarding your reserved monthly seat request (Ref: ${ref}) for ${meta.itemName}.`,
      `Are you still looking for a seat on this route or interested? We have seats available and can reserve your pickup spot.`,
    ].join('\n');
  }

  if (cat === 'mover') {
    return [
      `Assalam-o-Alaikum ${cust}!`,
      `This is ${meta.providerName} (Cargo & Shifting Logistics).`,
      `Regarding your moving quote inquiry (Ref: ${ref}) for ${meta.itemName} on ${meta.pickupDate || 'your scheduled date'} in ${meta.customerCity || 'your city'}.`,
      `Are you still looking for moving trucks and helpers? We have our vehicles and labor team ready for your move.`,
    ].join('\n');
  }

  // city_to_city or general
  return [
    `Assalam-o-Alaikum ${cust}!`,
    `This is ${meta.providerName} from SafarPK.`,
    `Regarding your intercity ride booking (Ref: ${ref}) for ${meta.itemName} on ${meta.pickupDate || 'your date'}.`,
    `Are you still looking for this ride or interested? We can confirm your vehicle now.`,
  ].join('\n');
}

/**
 * Automatically purges any message older than 7 days from storage
 * so the database and browser storage remain lightweight.
 */
export function purgeExpiredMessages(): number {
  if (typeof window === 'undefined') return 0;

  try {
    const raw = localStorage.getItem(STORAGE_KEY_MESSAGES);
    if (!raw) return 0;

    const allMessages: ChatMessage[] = JSON.parse(raw);
    const now = Date.now();

    // Keep only messages less than 7 days old and not marked deleted
    const validMessages = allMessages.filter(
      (m) => now - m.timestamp <= SEVEN_DAYS_MS && !m.deleted
    );

    const purged = allMessages.length - validMessages.length;
    if (purged > 0) {
      localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(validMessages));
    }
    return purged;
  } catch (e) {
    return 0;
  }
}

/**
 * Retrieve all messages from storage (purging expired on read)
 */
export function getAllMessages(): ChatMessage[] {
  if (typeof window === 'undefined') return [];
  purgeExpiredMessages();

  try {
    const raw = localStorage.getItem(STORAGE_KEY_MESSAGES);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

/**
 * Save messages to storage
 */
function saveAllMessages(messages: ChatMessage[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages));
  } catch (e) { }
}

/**
 * Retrieve all conversations
 */
export function getAllConversations(): ChatConversation[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONVERSATIONS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

/**
 * Save conversations to storage
 */
function saveAllConversations(conversations: ChatConversation[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_CONVERSATIONS, JSON.stringify(conversations));
  } catch (e) { }
}

/**
 * Seed initial sample conversations tailored for the active user role
 */
export function seedDefaultConversationsForUser(user: RegisteredUser): ChatConversation[] {
  const now = Date.now();
  const twoHoursAgo = now - 2 * 60 * 60 * 1000;
  const oneDayAgo = now - 24 * 60 * 60 * 1000;

  let initialConvs: ChatConversation[] = [];
  let initialMsgs: ChatMessage[] = [];

  if (user.role === 'CUSTOMER') {
    // 1. Thread with Kashif Motors (Lister)
    const conv1Id = `conv-${user.id}-usr-demo-lister`;
    initialConvs.push({
      id: conv1Id,
      participantIds: [user.id, 'usr-demo-lister'],
      participantNames: {
        [user.id]: user.name,
        'usr-demo-lister': 'Kashif Motors (Host)',
      },
      participantRoles: {
        [user.id]: 'CUSTOMER',
        'usr-demo-lister': 'LISTER',
      },
      participantPhones: {
        [user.id]: user.phone,
        'usr-demo-lister': '+92 300 1234567',
      },
      about: 'Honda Civic Oriel Turbo 2024',
      bookingRef: 'SF-24817',
      bookingStatus: 'Confirmed',
      itemDetails: 'Honda Civic Oriel Turbo 2024 · Self-drive',
      dates: '14 Nov – 16 Nov · 2 days',
      bookingMetadata: {
        category: 'rent_a_car',
        customerName: user.name,
        customerPhone: user.phone,
        customerCity: user.city || 'Lahore',
        providerName: 'Kashif Motors',
        providerManager: 'Kashif Ali (Fleet Manager)',
        providerPhone: '+92 300 1234567',
        itemName: 'Honda Civic Oriel Turbo 2024',
        pickupDate: '14 Nov 2026',
        returnDate: '16 Nov 2026',
        duration: '2 days',
        totalEstimate: 'PKR 28,000',
        serviceMode: 'Self-Drive',
        bookingRef: 'SF-24817',
      },
      lastMessageText: 'Assalam-o-Alaikum! Yes, vehicle is clean, fueled and ready for pickup.',
      lastMessageTimestamp: twoHoursAgo,
      unreadCountFor: { [user.id]: 1 },
      updatedAt: twoHoursAgo,
    });

    initialMsgs.push(
      {
        id: `m-init-1`,
        conversationId: conv1Id,
        senderId: user.id,
        senderName: user.name,
        senderRole: 'CUSTOMER',
        receiverId: 'usr-demo-lister',
        receiverName: 'Kashif Motors (Host)',
        text: 'Assalam-o-Alaikum, I submitted booking request SF-24817 for the Honda Civic. Is it available for 14 Nov?',
        timestamp: twoHoursAgo - 10 * 60 * 1000,
        timeStr: formatMessageTime(twoHoursAgo - 10 * 60 * 1000),
        read: true,
        ref: 'SF-24817',
        expiresAt: twoHoursAgo + SEVEN_DAYS_MS,
      },
      {
        id: `m-init-2`,
        conversationId: conv1Id,
        senderId: 'usr-demo-lister',
        senderName: 'Kashif Motors (Host)',
        senderRole: 'LISTER',
        receiverId: user.id,
        receiverName: user.name,
        text: 'Assalam-o-Alaikum! Yes, vehicle is clean, fueled and ready for pickup. Please bring your original driving licence and CNIC.',
        timestamp: twoHoursAgo,
        timeStr: formatMessageTime(twoHoursAgo),
        read: false,
        ref: 'SF-24817',
        expiresAt: twoHoursAgo + SEVEN_DAYS_MS,
      }
    );

    // 2. Thread with Tariq Mahmood (Chauffeur)
    const conv2Id = `conv-${user.id}-usr-demo-driver`;
    initialConvs.push({
      id: conv2Id,
      participantIds: [user.id, 'usr-demo-driver'],
      participantNames: {
        [user.id]: user.name,
        'usr-demo-driver': 'Tariq Mahmood (Chauffeur)',
      },
      participantRoles: {
        [user.id]: 'CUSTOMER',
        'usr-demo-driver': 'DRIVER',
      },
      participantPhones: {
        [user.id]: user.phone,
        'usr-demo-driver': '+92 301 9821045',
      },
      about: 'Chauffeur hire · Outstation Duty',
      bookingRef: 'SF-19042',
      bookingStatus: 'Waiting for owner',
      itemDetails: 'Executive Chauffeur · Motorway Outstation',
      dates: '20 Nov · 1 day',
      bookingMetadata: {
        category: 'driver',
        customerName: user.name,
        customerPhone: user.phone,
        customerCity: user.city || 'Lahore',
        providerName: 'Tariq Mahmood',
        providerManager: 'Tariq Mahmood',
        providerPhone: '+92 301 9821045',
        itemName: 'Executive Chauffeur · Motorway Outstation',
        pickupDate: '20 Nov 2026',
        duration: '1 day',
        totalEstimate: 'PKR 3,500',
        serviceMode: 'Client Vehicle Outstation Duty',
        bookingRef: 'SF-19042',
      },
      lastMessageText: 'Available for duty. Will reach your location 15 minutes before departure.',
      lastMessageTimestamp: oneDayAgo,
      unreadCountFor: { [user.id]: 0 },
      updatedAt: oneDayAgo,
    });

    initialMsgs.push(
      {
        id: `m-init-3`,
        conversationId: conv2Id,
        senderId: user.id,
        senderName: user.name,
        senderRole: 'CUSTOMER',
        receiverId: 'usr-demo-driver',
        receiverName: 'Tariq Mahmood (Chauffeur)',
        text: 'Hi Tariq, can you drive our vehicle to Islamabad via M-2 Motorway on 20 Nov?',
        timestamp: oneDayAgo - 30 * 60 * 1000,
        timeStr: formatMessageTime(oneDayAgo - 30 * 60 * 1000),
        read: true,
        ref: 'SF-19042',
        expiresAt: oneDayAgo + SEVEN_DAYS_MS,
      },
      {
        id: `m-init-4`,
        conversationId: conv2Id,
        senderId: 'usr-demo-driver',
        senderName: 'Tariq Mahmood (Chauffeur)',
        senderRole: 'DRIVER',
        receiverId: user.id,
        receiverName: user.name,
        text: 'Available for duty. Will reach your location 15 minutes before departure.',
        timestamp: oneDayAgo,
        timeStr: formatMessageTime(oneDayAgo),
        read: true,
        ref: 'SF-19042',
        expiresAt: oneDayAgo + SEVEN_DAYS_MS,
      }
    );
  } else if (user.role === 'LISTER') {
    // Lister Inbox with Customers
    const conv1Id = `conv-usr-demo-customer-${user.id}`;
    initialConvs.push({
      id: conv1Id,
      participantIds: ['usr-demo-customer', user.id],
      participantNames: {
        'usr-demo-customer': 'Chaudhry Bilal (Customer)',
        [user.id]: user.businessName || user.name,
      },
      participantRoles: {
        'usr-demo-customer': 'CUSTOMER',
        [user.id]: 'LISTER',
      },
      participantPhones: {
        'usr-demo-customer': '+92 321 8891024',
        [user.id]: user.phone,
      },
      about: 'Toyota Fortuner Legender 2024',
      bookingRef: 'SF-28910',
      bookingStatus: 'Confirmed',
      itemDetails: 'Toyota Fortuner Legender · With Chauffeur',
      dates: '18 Nov – 20 Nov · 3 days',
      bookingMetadata: {
        category: 'rent_a_car',
        customerName: 'Chaudhry Bilal',
        customerPhone: '+92 321 8891024',
        customerCity: 'Lahore',
        providerName: user.businessName || user.name,
        providerManager: user.name,
        providerPhone: user.phone,
        itemName: 'Toyota Fortuner Legender 2024',
        pickupDate: '18 Nov 2026',
        returnDate: '20 Nov 2026',
        duration: '3 days',
        totalEstimate: 'PKR 75,000',
        serviceMode: 'With Chauffeur',
        bookingRef: 'SF-28910',
      },
      lastMessageText: 'Thank you for confirming! We look forward to the pickup.',
      lastMessageTimestamp: twoHoursAgo,
      unreadCountFor: { [user.id]: 1 },
      updatedAt: twoHoursAgo,
    });

    initialMsgs.push(
      {
        id: `m-init-5`,
        conversationId: conv1Id,
        senderId: 'usr-demo-customer',
        senderName: 'Chaudhry Bilal (Customer)',
        senderRole: 'CUSTOMER',
        receiverId: user.id,
        receiverName: user.businessName || user.name,
        text: 'Assalam-o-Alaikum, is the Fortuner Legender available with driver for wedding duty on 18 Nov?',
        timestamp: twoHoursAgo - 20 * 60 * 1000,
        timeStr: formatMessageTime(twoHoursAgo - 20 * 60 * 1000),
        read: true,
        ref: 'SF-28910',
        expiresAt: twoHoursAgo + SEVEN_DAYS_MS,
      },
      {
        id: `m-init-6`,
        conversationId: conv1Id,
        senderId: user.id,
        senderName: user.businessName || user.name,
        senderRole: 'LISTER',
        receiverId: 'usr-demo-customer',
        receiverName: 'Chaudhry Bilal (Customer)',
        text: 'Walaikum Assalam Bilal bhai, yes vehicle with our senior chauffeur is confirmed.',
        timestamp: twoHoursAgo - 5 * 60 * 1000,
        timeStr: formatMessageTime(twoHoursAgo - 5 * 60 * 1000),
        read: true,
        ref: 'SF-28910',
        expiresAt: twoHoursAgo + SEVEN_DAYS_MS,
      },
      {
        id: `m-init-7`,
        conversationId: conv1Id,
        senderId: 'usr-demo-customer',
        senderName: 'Chaudhry Bilal (Customer)',
        senderRole: 'CUSTOMER',
        receiverId: user.id,
        receiverName: user.businessName || user.name,
        text: 'Thank you for confirming! We look forward to the pickup.',
        timestamp: twoHoursAgo,
        timeStr: formatMessageTime(twoHoursAgo),
        read: false,
        ref: 'SF-28910',
        expiresAt: twoHoursAgo + SEVEN_DAYS_MS,
      }
    );
  } else if (user.role === 'DRIVER') {
    // Driver Inbox with Passengers
    const conv1Id = `conv-usr-demo-customer-${user.id}`;
    initialConvs.push({
      id: conv1Id,
      participantIds: ['usr-demo-customer', user.id],
      participantNames: {
        'usr-demo-customer': 'Dr. Usman Farooq (Client)',
        [user.id]: user.name,
      },
      participantRoles: {
        'usr-demo-customer': 'CUSTOMER',
        [user.id]: 'DRIVER',
      },
      participantPhones: {
        'usr-demo-customer': '+92 333 4910291',
        [user.id]: user.phone,
      },
      about: 'Chauffeur Hiring · Outstation Duty',
      bookingRef: 'DR-44019',
      bookingStatus: 'Confirmed',
      itemDetails: 'Client Honda Civic · Motorway Outstation',
      dates: '16 Nov · Full Day',
      bookingMetadata: {
        category: 'driver',
        customerName: 'Dr. Usman Farooq',
        customerPhone: '+92 333 4910291',
        customerCity: 'Lahore',
        providerName: user.name,
        providerManager: user.name,
        providerPhone: user.phone,
        itemName: 'Executive Chauffeur Duty · Motorway Outstation',
        pickupDate: '16 Nov 2026',
        duration: 'Full Day',
        totalEstimate: 'PKR 3,200',
        serviceMode: 'Client Honda Civic',
        bookingRef: 'DR-44019',
      },
      lastMessageText: 'Understood. I will wait at your residence in DHA Phase 5 at 7:30 AM.',
      lastMessageTimestamp: twoHoursAgo,
      unreadCountFor: { [user.id]: 0 },
      updatedAt: twoHoursAgo,
    });

    initialMsgs.push(
      {
        id: `m-init-8`,
        conversationId: conv1Id,
        senderId: 'usr-demo-customer',
        senderName: 'Dr. Usman Farooq (Client)',
        senderRole: 'CUSTOMER',
        receiverId: user.id,
        receiverName: user.name,
        text: 'Good afternoon, confirming our motorway departure early morning on 16 Nov.',
        timestamp: twoHoursAgo - 15 * 60 * 1000,
        timeStr: formatMessageTime(twoHoursAgo - 15 * 60 * 1000),
        read: true,
        ref: 'DR-44019',
        expiresAt: twoHoursAgo + SEVEN_DAYS_MS,
      },
      {
        id: `m-init-9`,
        conversationId: conv1Id,
        senderId: user.id,
        senderName: user.name,
        senderRole: 'DRIVER',
        receiverId: 'usr-demo-customer',
        receiverName: 'Dr. Usman Farooq (Client)',
        text: 'Understood. I will wait at your residence in DHA Phase 5 at 7:30 AM.',
        timestamp: twoHoursAgo,
        timeStr: formatMessageTime(twoHoursAgo),
        read: true,
        ref: 'DR-44019',
        expiresAt: twoHoursAgo + SEVEN_DAYS_MS,
      }
    );
  } else if (user.role === 'PROVIDER') {
    // Provider Inbox with Commuters / Shifting Clients
    const conv1Id = `conv-usr-demo-customer-${user.id}`;
    initialConvs.push({
      id: conv1Id,
      participantIds: ['usr-demo-customer', user.id],
      participantNames: {
        'usr-demo-customer': 'Saima Waqas (Shifting Inquirer)',
        [user.id]: user.businessName || user.name,
      },
      participantRoles: {
        'usr-demo-customer': 'CUSTOMER',
        [user.id]: 'PROVIDER',
      },
      participantPhones: {
        'usr-demo-customer': '+92 300 8192041',
        [user.id]: user.phone,
      },
      about: 'House Shifting Quotation · 2.5 Ton Truck',
      bookingRef: 'MV-91024',
      bookingStatus: 'Waiting for owner',
      itemDetails: '2.5 Ton Shehzore + 3 Helpers · Johar Town to DHA',
      dates: '22 Nov · Shifting Day',
      bookingMetadata: {
        category: 'mover',
        customerName: 'Saima Waqas',
        customerPhone: '+92 300 8192041',
        customerCity: 'Lahore',
        providerName: user.businessName || user.name,
        providerManager: user.name,
        providerPhone: user.phone,
        itemName: 'House Shifting · 2.5 Ton Shehzore + 3 Helpers',
        pickupDate: '22 Nov 2026',
        duration: 'Shifting Day',
        totalEstimate: 'PKR 14,500',
        serviceMode: 'Johar Town to DHA',
        bookingRef: 'MV-91024',
      },
      lastMessageText: 'Can you provide bubble wrap and cartoon packing for kitchen crockery?',
      lastMessageTimestamp: twoHoursAgo,
      unreadCountFor: { [user.id]: 1 },
      updatedAt: twoHoursAgo,
    });

    initialMsgs.push({
      id: `m-init-10`,
      conversationId: conv1Id,
      senderId: 'usr-demo-customer',
      senderName: 'Saima Waqas (Shifting Inquirer)',
      senderRole: 'CUSTOMER',
      receiverId: user.id,
      receiverName: user.businessName || user.name,
      text: 'Can you provide bubble wrap and cartoon packing for kitchen crockery?',
      timestamp: twoHoursAgo,
      timeStr: formatMessageTime(twoHoursAgo),
      read: false,
      ref: 'MV-91024',
      expiresAt: twoHoursAgo + SEVEN_DAYS_MS,
    });
  }

  // Merge and save
  const existingConvs = getAllConversations();
  const existingMsgs = getAllMessages();

  const convMap = new Map<string, ChatConversation>();
  existingConvs.forEach((c) => convMap.set(c.id, c));
  initialConvs.forEach((c) => {
    if (!convMap.has(c.id)) convMap.set(c.id, c);
  });

  const msgMap = new Map<string, ChatMessage>();
  existingMsgs.forEach((m) => msgMap.set(m.id, m));
  initialMsgs.forEach((m) => {
    if (!msgMap.has(m.id)) msgMap.set(m.id, m);
  });

  saveAllConversations(Array.from(convMap.values()));
  saveAllMessages(Array.from(msgMap.values()));

  return Array.from(convMap.values()).filter((c) => c.participantIds.includes(user.id));
}

/**
 * Get all conversations for a specific user ID
 */
export function getUserConversations(user: RegisteredUser): ChatConversation[] {
  purgeExpiredMessages();
  let convs = getAllConversations().filter((c) => c.participantIds.includes(user.id));

  if (convs.length === 0) {
    convs = seedDefaultConversationsForUser(user);
  }

  return convs.sort((a, b) => b.updatedAt - a.updatedAt);
}

/**
 * Get all active messages for a specific conversation
 */
export function getConversationMessages(conversationId: string): ChatMessage[] {
  purgeExpiredMessages();
  const all = getAllMessages();
  return all
    .filter((m) => m.conversationId === conversationId && !m.deleted)
    .sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Send a new chat message
 */
export function sendChatMessage({
  conversationId,
  senderUser,
  receiverId,
  receiverName,
  text,
  ref,
  itemDetails,
}: {
  conversationId: string;
  senderUser: RegisteredUser;
  receiverId: string;
  receiverName: string;
  text: string;
  ref?: string;
  itemDetails?: string;
}): ChatMessage {
  const now = Date.now();
  const timeStr = formatMessageTime(now);

  const newMsg: ChatMessage = {
    id: `msg-${now}-${Math.floor(Math.random() * 1000)}`,
    conversationId,
    senderId: senderUser.id,
    senderName: senderUser.name,
    senderRole: senderUser.role,
    receiverId,
    receiverName,
    text: text.trim(),
    timestamp: now,
    timeStr,
    read: false,
    ref,
    expiresAt: now + SEVEN_DAYS_MS,
  };

  // 1. Save Message
  const allMessages = getAllMessages();
  allMessages.push(newMsg);
  saveAllMessages(allMessages);

  // 2. Update Conversation Record
  const allConvs = getAllConversations();
  let conv = allConvs.find((c) => c.id === conversationId);

  if (conv) {
    conv.lastMessageText = text.trim();
    conv.lastMessageTimestamp = now;
    conv.updatedAt = now;
    conv.unreadCountFor[receiverId] = (conv.unreadCountFor[receiverId] || 0) + 1;
    if (ref) conv.bookingRef = ref;
    if (itemDetails) conv.about = itemDetails;
  } else {
    // Create new conversation
    conv = {
      id: conversationId,
      participantIds: [senderUser.id, receiverId],
      participantNames: {
        [senderUser.id]: senderUser.name,
        [receiverId]: receiverName,
      },
      participantRoles: {
        [senderUser.id]: senderUser.role,
        [receiverId]: 'LISTER',
      },
      participantPhones: {
        [senderUser.id]: senderUser.phone,
        [receiverId]: '+92 300 1234567',
      },
      about: itemDetails || 'Vehicle Rental Inquiries',
      bookingRef: ref || `SF-${Math.floor(10000 + Math.random() * 90000)}`,
      bookingStatus: 'Confirmed',
      lastMessageText: text.trim(),
      lastMessageTimestamp: now,
      unreadCountFor: { [receiverId]: 1 },
      updatedAt: now,
    };
    allConvs.push(conv);
  }

  saveAllConversations(allConvs);

  // Sync message with backend database
  if (typeof window !== 'undefined') {
    fetch(`${getApiBaseUrl()}/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderId: senderUser.id,
        senderName: senderUser.name,
        senderRole: senderUser.role,
        receiverId,
        receiverName,
        text,
      }),
    }).catch(() => {});

    window.dispatchEvent(
      new CustomEvent('safarpk_chat_updated', {
        detail: { message: newMsg, conversationId },
      })
    );
  }

  // 4. Smart Auto-Reply for Realistic Interaction if recipient is a host
  triggerSmartHostReply({
    conversationId,
    userMessage: text.trim(),
    senderUser,
    receiverId,
    receiverName,
    ref: conv.bookingRef,
  });

  return newMsg;
}

export const STORAGE_KEY_AUTO_REPLY = 'safarpk_chat_auto_reply_enabled';

/**
 * Check if automated simulated host responses are enabled (default: true).
 * When toggled OFF, chat runs in 100% manual real-time mode without any bot or canned replies.
 */
export function isAutoReplyEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const val = localStorage.getItem(STORAGE_KEY_AUTO_REPLY);
  return val !== 'false';
}

/**
 * Toggle automated simulated replies ON or OFF
 */
export function setAutoReplyEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_AUTO_REPLY, enabled ? 'true' : 'false');
  window.dispatchEvent(
    new CustomEvent('safarpk_autoreply_toggle', { detail: { enabled } })
  );
}

/**
 * Intelligent Multi-Turn Conversational Dialogue Engine:
 * Generates dynamic, context-linked, anti-repetitive host replies.
 * Analyzes conversation history, previous turns, explicit location/city mentions,
 * dates, testing requests, and avoids canned repetitive greetings.
 */
export function triggerSmartHostReply({
  conversationId,
  userMessage,
  senderUser,
  receiverId,
  receiverName,
  ref,
}: {
  conversationId: string;
  userMessage: string;
  senderUser: RegisteredUser;
  receiverId: string;
  receiverName: string;
  ref?: string;
}) {
  if (typeof window === 'undefined') return;

  // 1. Check if user turned off simulated auto-replies for 100% manual chatting
  if (!isAutoReplyEnabled()) return;

  // 2. Do not auto-reply if sender is not CUSTOMER (e.g. host or driver replying directly)
  if (senderUser.role !== 'CUSTOMER') return;
  if (senderUser.id === receiverId) return;

  // 3. Conversation History & Context
  const convMessages = getConversationMessages(conversationId);
  const hostMessages = convMessages.filter((m) => m.senderId === receiverId);
  const allConvs = getAllConversations();
  const conv = allConvs.find((c) => c.id === conversationId);

  const hostSentTexts = new Set(hostMessages.map((m) => m.text.trim()));
  const hasHostGreeted = hostMessages.some((m) =>
    /assalam|salam|welcome|thank you for contacting|hello|hi/i.test(m.text)
  );

  const lastHostMsg = hostMessages.length > 0 ? hostMessages[hostMessages.length - 1].text : '';
  const lastHostLow = lastHostMsg.toLowerCase();

  const hostAskedLocation =
    /location|pickup location|address|where|area|city|showroom|branch|hub/i.test(lastHostLow);
  const hostAskedTiming =
    /time|timing|schedule|when|hour|dates|departure|arrival/i.test(lastHostLow);

  const lowText = userMessage.toLowerCase().trim();
  const firstName = senderUser.name ? senderUser.name.split(' ')[0] : 'there';
  const roleName = conv?.participantRoles?.[receiverId] || 'LISTER';
  const isDriver = roleName === 'DRIVER';
  const isMover = roleName === 'PROVIDER' || conv?.bookingMetadata?.category === 'mover';

  let replyText = '';

  // INTENT 1: Live Chat Test / Connection Verification
  if (
    /^(okay |ok )?(test|testing|check|mic test|test msg|system test)$/i.test(lowText) ||
    lowText === 'test' ||
    lowText === 'okay test' ||
    lowText === 'ok test' ||
    lowText.includes('test test')
  ) {
    if (hostMessages.some((m) => m.text.includes('Loud and clear'))) {
      replyText =
        'Connection is 100% active and messages are syncing in real time! Feel free to ask about vehicle specs, doorstep delivery, or pickup timing.';
    } else {
      replyText =
        'Loud and clear! Our direct chat line is live, connected, and syncing in real time. Let us know your preferred pickup location or any questions about the booking.';
    }
  }

  // INTENT 2: City / Location / Area Mentions (Pakistani Cities & Neighborhoods)
  if (!replyText) {
    const cityMatches = [
      { key: 'karachi', name: 'Karachi', hubs: 'DHA, Clifton, Gulshan, and Jinnah International Airport' },
      { key: 'lahore', name: 'Lahore', hubs: 'Gulberg, DHA Phase 5, and Allama Iqbal International Airport' },
      { key: 'islamabad', name: 'Islamabad', hubs: 'Blue Area, F-sectors, and Islamabad International Airport' },
      { key: 'rawalpindi', name: 'Rawalpindi', hubs: 'Saddar, Bahria Town, and Peshawar Road' },
      { key: 'peshawar', name: 'Peshawar', hubs: 'University Road, Cantt, and Hayatabad' },
      { key: 'multan', name: 'Multan', hubs: 'Cantt, Bosan Road, and Multan Airport' },
      { key: 'faisalabad', name: 'Faisalabad', hubs: 'D-Ground, Canal Road, and Kohinoor City' },
      { key: 'sialkot', name: 'Sialkot', hubs: 'Cantt and Sialkot International Airport' },
      { key: 'gujranwala', name: 'Gujranwala', hubs: 'GT Road and Model Town' },
      { key: 'quetta', name: 'Quetta', hubs: 'Cantt and Zarghoon Road' },
      { key: 'abbottabad', name: 'Abbottabad', hubs: 'Supply Road and Mandian' },
      { key: 'murree', name: 'Murree', hubs: 'Mall Road and Expressway' },
    ];

    const matchedCity = cityMatches.find((c) => lowText.includes(c.key));

    if (matchedCity) {
      if (hostAskedLocation) {
        replyText = `Got it, ${matchedCity.name}! We can arrange convenient doorstep delivery to your exact address in ${matchedCity.name} (coverage includes ${matchedCity.hubs}) or you can collect it directly from our hub. What time works best for you?`;
      } else {
        replyText = `${matchedCity.name} noted! We have verified vehicles and drivers stationed locally across ${matchedCity.name}. Would you like doorstep delivery or showroom collection?`;
      }
    }
  }

  // INTENT 3: Specific Areas (Airport, DHA, Clifton, Bahria, Gulberg, etc.)
  if (!replyText) {
    const areaKeywords = [
      'airport',
      'dha',
      'clifton',
      'gulshan',
      'johar',
      'gulberg',
      'bahria',
      'cantt',
      'blue area',
      'saddar',
      'model town',
    ];
    const matchedArea = areaKeywords.find((a) => lowText.includes(a));
    if (matchedArea) {
      if (matchedArea === 'airport') {
        replyText =
          'Airport terminal pickup can be scheduled seamlessly! Our representative will meet you at the arrivals gate with keys and documents ready. Please share your flight timing.';
      } else {
        const areaUpper = matchedArea.toUpperCase();
        replyText = `Noted, ${areaUpper}! We have an active fleet presence nearby. We can deliver the vehicle right to your doorstep or hotel in ${areaUpper}. What time suits you?`;
      }
    }
  }

  // INTENT 4: Dates & Times (Morning, Evening, Tomorrow, 10 AM, etc.)
  if (!replyText) {
    const timeMatch = lowText.match(
      /\b(morning|afternoon|evening|night|today|tomorrow|tonight|weekend|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}\s*(am|pm)|\d{1,2}:\d{2})\b/i
    );
    if (timeMatch) {
      replyText = `Handover time (${timeMatch[0]}) noted! Our team will ensure the vehicle undergoes complete pre-trip wash, AC check, and fuel inspection 30 minutes before your departure.`;
    }
  }

  // INTENT 5: Greetings (Salam, Hi, Hello, AOA)
  if (!replyText) {
    const isGreeting =
      /^(hi|hello|hey|salam|assalam|aoa|slaam|assalam-o-alaikum)[!. ]*$/i.test(lowText) ||
      /\b(hi|hello|salam|aoa)\b/i.test(lowText);

    if (isGreeting) {
      if (hasHostGreeted) {
        // Anti-repetition: host already greeted in this conversation, respond naturally
        const followUps = [
          'Walaikum Assalam! Yes, I am right here. How can I assist you with your booking?',
          'Hello again! Yes, our team is active. Do you have any specific preferences or questions?',
          'Walaikum Assalam! We are on standby. Feel free to ask about vehicle specs, fuel rules, or schedule.',
          'Hello! Let me know if you would like us to reserve specific dates or if you need any adjustments.',
        ];
        replyText = followUps.find((g) => !hostSentTexts.has(g)) || followUps[0];
      } else {
        replyText = `Assalam-o-Alaikum ${firstName}! Thank you for contacting ${receiverName}. Your booking inquiry (${ref || 'SF-Booking'
          }) is noted. Let us know your preferred pickup location and timing.`;
      }
    }
  }

  // INTENT 6: Agreements / Affirmations (Ok, Done, Great, Theek hai, Shukriya)
  if (!replyText) {
    const isAck =
      /^(ok|okay|theek|theek hai|done|great|perfect|sure|deal|noted|bilkul|acha|accha|shukriya|thanks|thank you)[!. ]*$/i.test(
        lowText
      );
    if (isAck) {
      const ackReplies = [
        'Perfect! Everything is noted on our dispatch schedule. If you have any sudden changes or need urgent dispatch, feel free to tap Call or WhatsApp above anytime.',
        'Great! We will have everything prepared and inspected. Safe travels in advance!',
        'Excellent, looking forward to serving you! Our representative will be ready at handover.',
        'Thank you! Your inquiry is locked in. Let us know if anything else comes up.',
      ];
      replyText = ackReplies.find((a) => !hostSentTexts.has(a)) || ackReplies[0];
    }
  }

  // INTENT 7: Price / Rates / Discount / Payment
  if (!replyText) {
    if (
      lowText.includes('price') ||
      lowText.includes('rate') ||
      lowText.includes('rent') ||
      lowText.includes('discount') ||
      lowText.includes('pkr') ||
      lowText.includes('rs') ||
      lowText.includes('cost') ||
      lowText.includes('advance') ||
      lowText.includes('deposit') ||
      lowText.includes('pay')
    ) {
      replyText =
        'Our rates on SafarPK are 100% upfront with zero hidden fees. Payment is made directly upon vehicle inspection and key handover (Cash or Raast / bank transfer). No advance deposit needed!';
    }
  }

  // INTENT 8: Documents / Licence / CNIC
  if (!replyText) {
    if (
      lowText.includes('licence') ||
      lowText.includes('license') ||
      lowText.includes('cnic') ||
      lowText.includes('id card') ||
      lowText.includes('document') ||
      lowText.includes('papers')
    ) {
      replyText =
        'Please keep your original valid Driving Licence and original CNIC handy at the time of key handover. We perform a quick 1-minute digital verification and return your physical cards immediately.';
    }
  }

  // INTENT 9: Availability & Booking Confirmation
  if (!replyText) {
    if (
      lowText.includes('available') ||
      lowText.includes('confirm') ||
      lowText.includes('ready') ||
      lowText.includes('book')
    ) {
      replyText = `Yes! The vehicle is completely reserved and scheduled for your inquiry (${ref || 'Reference'
        }). Looking forward to meeting you at pickup!`;
    }
  }

  // INTENT 10: Chauffeur / Driver Specific
  if (!replyText) {
    if (lowText.includes('driver') || lowText.includes('chauffeur')) {
      if (isDriver) {
        replyText =
          'Assalam-o-Alaikum! I am your verified chauffeur. I have over 10+ years of motorway driving experience, uniform-clad, non-smoker, and maintain strict punctuality. Where shall I pick you up?';
      } else {
        replyText =
          'We offer both self-drive and experienced chauffeurs. Chauffeur services include professional route navigation and 12-hour duty per day.';
      }
    }
  }

  // INTENT 11: Mover / Cargo / Shifting
  if (!replyText && isMover) {
    if (
      lowText.includes('truck') ||
      lowText.includes('mover') ||
      lowText.includes('shifting') ||
      lowText.includes('cargo') ||
      lowText.includes('furniture')
    ) {
      replyText =
        'For shifting & cargo logistics, our team includes loading helpers and protective blankets. Please share the pickup floor and destination address so we allocate the optimal vehicle size.';
    }
  }

  // INTENT 12: Vehicle Condition / AC / Fuel / Cleanliness
  if (!replyText) {
    if (
      lowText.includes('condition') ||
      lowText.includes('ac') ||
      lowText.includes('chilled') ||
      lowText.includes('fuel') ||
      lowText.includes('clean') ||
      lowText.includes('petrol') ||
      lowText.includes('diesel')
    ) {
      replyText =
        'The vehicle is in prime condition: chill dual AC, clean spotless interior, serviced engine, and good tires. Fuel policy is return-as-received.';
    }
  }

  // INTENT 13: Luggage & Boot Space
  if (!replyText) {
    if (
      lowText.includes('luggage') ||
      lowText.includes('bag') ||
      lowText.includes('suitcase') ||
      lowText.includes('boot') ||
      lowText.includes('trunk')
    ) {
      replyText =
        'The trunk has spacious capacity for 3-4 large suitcases plus hand carry. If you require extra capacity, we can also provide a rooftop carrier upon request.';
    }
  }

  // INTENT 14: Dynamic Context-Echoing Fallback (Never repeat a static message!)
  if (!replyText) {
    const cleanSnippet =
      userMessage.trim().length > 35
        ? `"${userMessage.trim().slice(0, 35)}..."`
        : `"${userMessage.trim()}"`;

    const dynamicFallbacks = [
      `Understood regarding ${cleanSnippet}! We have recorded this note on your booking inquiry (${ref || 'SF-Booking'
      }). Let us know if you need anything else arranged.`,
      `Received: ${cleanSnippet}. Our fleet supervisor has updated your dispatch notes. Do you have any preference for the vehicle delivery spot or route?`,
      `Noted! We have updated your reservation preferences. We look forward to handing over the keys. Feel free to ask if you have any other questions.`,
      `Got it! Thank you for the update. All your requirements are logged in our system. Looking forward to serving you!`,
    ];

    replyText = dynamicFallbacks.find((fb) => !hostSentTexts.has(fb)) || dynamicFallbacks[0];
  }

  // Strict Anti-Repetition Guarantee: If candidate reply was already sent in this thread, vary it
  if (hostSentTexts.has(replyText)) {
    replyText = `Understood! We have updated your booking notes (${ref || 'SF-Booking'
      }). Our fleet coordinator is ready for your handover. Let us know if you have any other questions.`;
  }

  const delayMs = 1200 + Math.random() * 800;

  setTimeout(() => {
    // Re-verify auto-reply is still enabled at execution time
    if (!isAutoReplyEnabled()) return;

    const replyNow = Date.now();
    const replyMsg: ChatMessage = {
      id: `msg-reply-${replyNow}`,
      conversationId,
      senderId: receiverId,
      senderName: receiverName,
      senderRole: roleName,
      receiverId: senderUser.id,
      receiverName: senderUser.name,
      text: replyText,
      timestamp: replyNow,
      timeStr: formatMessageTime(replyNow),
      read: false,
      ref,
      expiresAt: replyNow + SEVEN_DAYS_MS,
    };

    const currentMessages = getAllMessages();
    currentMessages.push(replyMsg);
    saveAllMessages(currentMessages);

    const currentConvs = getAllConversations();
    const convRec = currentConvs.find((c) => c.id === conversationId);
    if (convRec) {
      convRec.lastMessageText = replyText;
      convRec.lastMessageTimestamp = replyNow;
      convRec.updatedAt = replyNow;
      convRec.unreadCountFor[senderUser.id] = (convRec.unreadCountFor[senderUser.id] || 0) + 1;
      saveAllConversations(currentConvs);
    }

    window.dispatchEvent(
      new CustomEvent('safarpk_chat_updated', {
        detail: { message: replyMsg, conversationId },
      })
    );
  }, delayMs);
}

/**
 * Mark a conversation's messages as read for a specific user
 */
export function markConversationAsRead(conversationId: string, userId: string) {
  if (typeof window === 'undefined') return;

  const allConvs = getAllConversations();
  const conv = allConvs.find((c) => c.id === conversationId);
  if (conv && conv.unreadCountFor) {
    conv.unreadCountFor[userId] = 0;
    saveAllConversations(allConvs);
  }

  const allMessages = getAllMessages();
  let updated = false;
  allMessages.forEach((m) => {
    if (m.conversationId === conversationId && m.receiverId === userId && !m.read) {
      m.read = true;
      updated = true;
    }
  });

  if (updated) {
    saveAllMessages(allMessages);
  }
}

/**
 * Clear/delete all messages from a conversation (Instant cleanup)
 */
export function clearConversationHistory(conversationId: string): boolean {
  if (typeof window === 'undefined') return false;

  const allMessages = getAllMessages();
  const remaining = allMessages.filter((m) => m.conversationId !== conversationId);
  saveAllMessages(remaining);

  const allConvs = getAllConversations();
  const conv = allConvs.find((c) => c.id === conversationId);
  if (conv) {
    conv.lastMessageText = 'Conversation cleared by user.';
    conv.unreadCountFor = {};
    saveAllConversations(allConvs);
  }

  window.dispatchEvent(
    new CustomEvent('safarpk_chat_updated', {
      detail: { conversationId, cleared: true },
    })
  );

  return true;
}

/**
 * Start or open a conversation with a vehicle host or service provider
 */
export function startOrOpenConversation({
  currentUser,
  partnerId,
  partnerName,
  partnerRole = 'LISTER',
  partnerPhone = '+92 300 1234567',
  about,
  bookingRef,
  bookingMetadata,
  initialGreeting,
}: {
  currentUser: RegisteredUser;
  partnerId: string;
  partnerName: string;
  partnerRole?: string;
  partnerPhone?: string;
  about: string;
  bookingRef?: string;
  bookingMetadata?: BookingMetadata;
  initialGreeting?: string;
}): string {
  const convId = `conv-${currentUser.id}-${partnerId}`;
  const allConvs = getAllConversations();
  let conv = allConvs.find((c) => c.id === convId);

  const now = Date.now();
  const refCode = bookingRef || bookingMetadata?.bookingRef || `SF-${Math.floor(10000 + Math.random() * 90000)}`;

  let finalGreeting = initialGreeting;
  if (!finalGreeting && bookingMetadata) {
    const lines = [
      `Assalam-o-Alaikum ${partnerName}!`,
      `My name is ${currentUser.name} (${currentUser.phone}).`,
      `I am interested in booking:`,
      `• Vehicle/Service: ${bookingMetadata.itemName} ${bookingMetadata.serviceMode ? `(${bookingMetadata.serviceMode})` : ''}`,
    ];
    if (bookingMetadata.customerCity) lines.push(`• City: ${bookingMetadata.customerCity}`);
    if (bookingMetadata.pickupDate) {
      lines.push(`• Dates: ${bookingMetadata.pickupDate} ${bookingMetadata.returnDate ? `to ${bookingMetadata.returnDate}` : ''} ${bookingMetadata.duration ? `(${bookingMetadata.duration})` : ''}`);
    }
    if (bookingMetadata.totalEstimate) lines.push(`• Total Estimate: ${bookingMetadata.totalEstimate}`);
    lines.push(`• Booking Ref: ${refCode}`);
    lines.push(`Is this available for these dates? Looking forward to your response.`);
    finalGreeting = lines.join('\n');
  } else if (!finalGreeting) {
    finalGreeting = `Assalam-o-Alaikum ${partnerName}! My name is ${currentUser.name}. I am interested in ${about}. Is it available?`;
  }

  if (!conv) {
    conv = {
      id: convId,
      participantIds: [currentUser.id, partnerId],
      participantNames: {
        [currentUser.id]: currentUser.name,
        [partnerId]: partnerName,
      },
      participantRoles: {
        [currentUser.id]: currentUser.role,
        [partnerId]: partnerRole,
      },
      participantPhones: {
        [currentUser.id]: currentUser.phone,
        [partnerId]: partnerPhone,
      },
      about,
      bookingRef: refCode,
      bookingStatus: 'Confirmed',
      bookingMetadata,
      lastMessageText: finalGreeting,
      lastMessageTimestamp: now,
      unreadCountFor: { [partnerId]: 1 },
      updatedAt: now,
    };
    allConvs.unshift(conv);
    saveAllConversations(allConvs);
  } else {
    // Update existing conversation with fresh inquiry metadata
    conv.about = about;
    conv.bookingRef = refCode;
    if (bookingMetadata) conv.bookingMetadata = bookingMetadata;
    conv.participantPhones[currentUser.id] = currentUser.phone;
    conv.participantPhones[partnerId] = partnerPhone;
    conv.lastMessageText = finalGreeting;
    conv.lastMessageTimestamp = now;
    conv.updatedAt = now;
    conv.unreadCountFor[partnerId] = (conv.unreadCountFor[partnerId] || 0) + 1;
    saveAllConversations(allConvs);
  }

  // Create message in thread
  const msg: ChatMessage = {
    id: `msg-${now}-${Math.floor(Math.random() * 1000)}`,
    conversationId: convId,
    senderId: currentUser.id,
    senderName: currentUser.name,
    senderRole: currentUser.role,
    receiverId: partnerId,
    receiverName: partnerName,
    text: finalGreeting,
    timestamp: now,
    timeStr: formatMessageTime(now),
    read: false,
    ref: refCode,
    expiresAt: now + SEVEN_DAYS_MS,
  };
  const msgs = getAllMessages();
  msgs.push(msg);
  saveAllMessages(msgs);

  // Sync conversation & initial message with backend database
  if (typeof window !== 'undefined') {
    fetch(`${getApiBaseUrl()}/chat/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingRef: refCode,
        customerPhone: currentUser.phone,
        customerName: currentUser.name,
        listerPhone: partnerPhone,
        listerName: partnerName,
        initialMessage: finalGreeting,
        about,
      }),
    }).catch(() => {});
  }

  // Trigger simulated host reply
  triggerSmartHostReply({
    conversationId: convId,
    userMessage: finalGreeting,
    senderUser: currentUser,
    receiverId: partnerId,
    receiverName: partnerName,
    ref: refCode,
  });

  return convId;
}

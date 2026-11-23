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
  const cat = meta.category || 'rent_a_car';

  if (cat === 'driver') {
    return [
      `Assalam-o-Alaikum ${provider}!`,
      `My name is ${meta.customerName} (${meta.customerPhone}).`,
      `I am contacting you from SafarPK regarding your chauffeur service (Ref: ${meta.bookingRef}):`,
      `• Service: ${meta.itemName}`,
      meta.pickupDate ? `• Scheduled: ${meta.pickupDate} ${meta.duration ? `(${meta.duration})` : ''}` : '',
      meta.customerCity ? `• City: ${meta.customerCity}` : '',
      meta.totalEstimate ? `• Estimated Rate: ${meta.totalEstimate}` : '',
      `I sent a message on SafarPK chat earlier. Following up directly here on WhatsApp. Are you available for this duty?`,
    ].filter(Boolean).join('\n');
  }

  if (cat === 'shuttle') {
    return [
      `Assalam-o-Alaikum ${provider}!`,
      `My name is ${meta.customerName} (${meta.customerPhone}).`,
      `I am inquiring from SafarPK regarding a commuter seat (Ref: ${meta.bookingRef}):`,
      `• Route: ${meta.itemName}`,
      meta.customerCity ? `• City: ${meta.customerCity}` : '',
      `Could you please confirm seat availability and pickup timing?`,
    ].filter(Boolean).join('\n');
  }

  if (cat === 'mover') {
    return [
      `Assalam-o-Alaikum ${provider}!`,
      `My name is ${meta.customerName} (${meta.customerPhone}).`,
      `I am contacting you from SafarPK regarding cargo & house shifting (Ref: ${meta.bookingRef}):`,
      `• Vehicle/Service: ${meta.itemName}`,
      meta.pickupDate ? `• Moving Date: ${meta.pickupDate}` : '',
      meta.customerCity ? `• City: ${meta.customerCity}` : '',
      `Please confirm truck availability and estimate. Thanks!`,
    ].filter(Boolean).join('\n');
  }

  // rent_a_car or general
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

  // Only seed sample demo conversations for designated pre-packaged demo user accounts
  if (convs.length === 0 && user.id && user.id.startsWith('usr-demo-')) {
    convs = seedDefaultConversationsForUser(user);
  }

  return convs.sort((a, b) => b.updatedAt - a.updatedAt);
}

/**
 * Get total unread message count for a user.
 * Returns 0 if user is null/logged out.
 */
export function getUserUnreadMessageCount(user: RegisteredUser | null): number {
  if (!user) return 0;
  try {
    const convs = getUserConversations(user);
    return convs.reduce((sum, c) => sum + (c.unreadCountFor?.[user.id] || 0), 0);
  } catch (e) {
    return 0;
  }
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
 * Strictly for Listers/Drivers/Providers. When toggled OFF, chat runs in 100% manual real-time mode.
 */
export function isListerAutoReplyEnabled(listerId?: string): boolean {
  if (typeof window === 'undefined') return true;
  if (listerId) {
    const specificVal = localStorage.getItem(`safarpk_lister_autoreply_${listerId}`);
    if (specificVal !== null) return specificVal !== 'false';
  }
  const globalVal = localStorage.getItem(STORAGE_KEY_AUTO_REPLY);
  return globalVal !== 'false';
}

export function isAutoReplyEnabled(listerId?: string): boolean {
  return isListerAutoReplyEnabled(listerId);
}

/**
 * Toggle automated simulated replies ON or OFF for a lister
 */
export function setListerAutoReplyEnabled(listerId: string, enabled: boolean): void {
  if (typeof window === 'undefined') return;
  if (listerId) {
    localStorage.setItem(`safarpk_lister_autoreply_${listerId}`, enabled ? 'true' : 'false');
  }
  localStorage.setItem(STORAGE_KEY_AUTO_REPLY, enabled ? 'true' : 'false');
  window.dispatchEvent(
    new CustomEvent('safarpk_autoreply_toggle', { detail: { listerId, enabled } })
  );
}

export function setAutoReplyEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_AUTO_REPLY, enabled ? 'true' : 'false');
  window.dispatchEvent(
    new CustomEvent('safarpk_autoreply_toggle', { detail: { enabled } })
  );
}

/**
 * Intelligent Host / Lister Auto-Reply Engine:
 * Strictly for Listers / Providers / Drivers responding to Customer inquiries.
 * - If Lister turned OFF auto-reply: No response is sent (100% manual).
 * - On Customer's 1st message: Sends polite greeting acknowledging the listing and provides direct phone & WhatsApp contact.
 * - On subsequent Customer messages: Sends polite short busy message advising direct call/WhatsApp.
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

  // 1. Check if recipient (Lister / Driver / Provider) has turned OFF auto-reply
  if (!isListerAutoReplyEnabled(receiverId)) return;

  // 2. Do not auto-reply if sender is not CUSTOMER (only customers get auto-replies from listers)
  if (senderUser.role !== 'CUSTOMER') return;
  if (senderUser.id === receiverId) return;

  // 3. Conversation History & Context
  const convMessages = getConversationMessages(conversationId);
  const customerMsgs = convMessages.filter((m) => m.senderId === senderUser.id);
  const allConvs = getAllConversations();
  const conv = allConvs.find((c) => c.id === conversationId);

  const roleName = conv?.participantRoles?.[receiverId] || 'LISTER';
  const firstName = senderUser.name ? senderUser.name.split(' ')[0] : 'there';
  const listingName = conv?.bookingMetadata?.itemName || conv?.about || 'this listing';
  const hostPhone = conv?.bookingMetadata?.providerPhone || conv?.participantPhones?.[receiverId] || '+92 300 1234567';

  let replyText = '';

  // Turn 1: First message from customer
  if (customerMsgs.length <= 1) {
    replyText = `Hello ${firstName}! Thank you for your inquiry regarding ${listingName}. We have received your message. If you do not get an immediate response here, you can also reach us directly at our Phone and WhatsApp: ${hostPhone} for urgent booking confirmation. Thanks!`;
  } else {
    // Turn 2+: Customer messages again when lister is busy / not online
    replyText = `Sorry, we are busy at the moment. Please call or WhatsApp us directly at ${hostPhone} for urgent booking.`;
  }

  const delayMs = 1200 + Math.random() * 600;

  setTimeout(() => {
    // Re-verify auto-reply is still enabled at execution time
    if (!isListerAutoReplyEnabled(receiverId)) return;

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

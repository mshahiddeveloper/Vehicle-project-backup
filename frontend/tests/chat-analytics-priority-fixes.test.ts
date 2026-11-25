import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '..');
const readSrc = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

describe('Cross-Device Chat, Chat-First Booking Priority & Date-Range Analytics', () => {
  it('provides Neon DB chat and analytics API routes', () => {
    const chatApi = readSrc('src/app/api/chat/route.ts');
    expect(chatApi).toContain('chat_conversations');
    expect(chatApi).toContain('chat_messages');
    expect(chatApi).toContain('no-store');

    const analyticsApi = readSrc('src/app/api/analytics/route.ts');
    expect(analyticsApi).toContain('analytics_events');
    expect(analyticsApi).toContain('TODAY');
    expect(analyticsApi).toContain('YEAR');
    expect(analyticsApi).toContain('CUSTOM');

    const trackClickApi = readSrc('src/app/api/track-click/route.ts');
    expect(trackClickApi).toContain('INSERT INTO analytics_events');
    expect(trackClickApi).toContain('IN_APP_CHAT');
    expect(trackClickApi).toContain('VIEW');
  });

  it('syncs chatEngine and Inbox with /api/chat for cross-device messaging', () => {
    const engine = readSrc('src/data/chatEngine.ts');
    expect(engine).toContain("fetch('/api/chat'");
    expect(engine).toContain('syncConversationsFromServer');
    expect(engine).toContain('syncMessagesFromServer');

    const inbox = readSrc('src/app/inbox/page.tsx');
    expect(inbox).toContain('syncConversationsFromServer');
    expect(inbox).toContain('syncMessagesFromServer');
    expect(inbox).toContain('/api/auth/me');
  });

  it('places Book & Chat in App as Priority #1 before WhatsApp & Call across all 5 vertical detail pages', () => {
    const pages = [
      'src/app/listing/[id]/page.tsx',
      'src/app/city-to-city/[id]/page.tsx',
      'src/app/driver/[slug]/page.tsx',
      'src/app/shuttles/[id]/page.tsx',
      'src/app/movers/[id]/page.tsx',
    ];
    for (const p of pages) {
      const src = readSrc(p);
      const chatIdx = src.indexOf('onClick={handleDirectChat}');
      const waIdx = src.indexOf('onClick={handleWhatsApp}') !== -1
        ? src.indexOf('onClick={handleWhatsApp}')
        : src.indexOf('onClick={handleInstantWhatsAppChat}');
      expect(chatIdx).toBeGreaterThan(-1);
      expect(waIdx).toBeGreaterThan(-1);
      expect(chatIdx).toBeLessThan(waIdx);
    }
  });

  it('supports Today, 7D, 30D, Month, Full Year, All Time, and Custom Date in AnalyticsReportHub', () => {
    const hub = readSrc('src/components/AnalyticsReportHub.tsx');
    expect(hub).toContain("id: 'TODAY'");
    expect(hub).toContain("id: 'YEAR'");
    expect(hub).toContain("id: 'CUSTOM'");
    expect(hub).toContain('/api/analytics?');
    expect(hub).toContain('In-App Chat Clicks');
  });
});


import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async trackEvent(dto: {
    eventType: string;
    listingId?: string;
    listerId?: string;
    customerId?: string;
    visitorId?: string;
    countryCode?: string;
    serviceType?: string;
    deviceType?: string;
    metadata?: any;
  }) {
    const {
      eventType,
      listingId,
      listerId,
      customerId,
      visitorId,
      countryCode,
      serviceType,
      deviceType,
      metadata,
    } = dto;

    let effectiveListerId = listerId;
    if (listingId && !effectiveListerId) {
      const listing = await this.prisma.vehicleListing.findUnique({
        where: { id: listingId },
        select: { listerId: true },
      });
      if (listing) effectiveListerId = listing.listerId;
    }

    const event = await this.prisma.analyticsEvent.create({
      data: {
        eventType,
        listingId,
        listerId: effectiveListerId,
        customerId,
        visitorId,
        countryCode: countryCode || 'PK',
        serviceType: serviceType || 'CAR_RENTAL',
        deviceType: deviceType || 'WEB',
        metadata: metadata ? (typeof metadata === 'string' ? metadata : JSON.stringify(metadata)) : null,
      },
    });

    // Update listing counters atomically
    if (listingId) {
      if (eventType === 'listing_view') {
        await this.prisma.vehicleListing.update({
          where: { id: listingId },
          data: { viewCount: { increment: 1 } },
        });
      } else if (eventType === 'whatsapp_click' || eventType === 'phone_click') {
        await this.prisma.vehicleListing.update({
          where: { id: listingId },
          data: { inquiryCount: { increment: 1 } },
        });
      } else if (eventType === 'booking_request_submitted') {
        await this.prisma.vehicleListing.update({
          where: { id: listingId },
          data: { bookingCount: { increment: 1 } },
        });
      }
    }

    return { success: true, eventId: event.id };
  }

  async getListerStats(listerId: string, days = 30) {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    const events = await this.prisma.analyticsEvent.findMany({
      where: {
        listerId,
        createdAt: { gte: sinceDate },
      },
    });

    const totalViews = events.filter((e) => e.eventType.includes('view')).length;
    const whatsappClicks = events.filter((e) => e.eventType === 'whatsapp_click').length;
    const phoneClicks = events.filter((e) => e.eventType === 'phone_click').length;
    const bookings = events.filter((e) => e.eventType === 'booking_request_submitted').length;

    const totalLeads = whatsappClicks + phoneClicks + bookings;
    const conversionRate = totalViews > 0 ? ((totalLeads / totalViews) * 100).toFixed(1) : '0.0';

    return {
      periodDays: days,
      metrics: {
        views: totalViews,
        whatsappClicks,
        phoneClicks,
        bookings,
        totalLeads,
        conversionRate: `${conversionRate}%`,
      },
      eventsCount: events.length,
    };
  }

  async getListingStats(listingId: string) {
    const events = await this.prisma.analyticsEvent.findMany({
      where: { listingId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const views = events.filter((e) => e.eventType === 'listing_view').length;
    const whatsappClicks = events.filter((e) => e.eventType === 'whatsapp_click').length;
    const phoneClicks = events.filter((e) => e.eventType === 'phone_click').length;
    const bookings = events.filter((e) => e.eventType === 'booking_request_submitted').length;

    return {
      listingId,
      views,
      whatsappClicks,
      phoneClicks,
      bookings,
      recentEvents: events.slice(0, 10),
    };
  }
}


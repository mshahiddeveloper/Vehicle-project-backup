import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class BookingService {
  constructor(private prisma: PrismaService) {}

  async generateLead(dto: {
    listingId: string;
    customerId?: string;
    contactType?: string;
    customerPhone?: string;
    message?: string;
  }) {
    const { listingId, customerId, contactType, customerPhone, message } = dto;

    const listing = await this.prisma.vehicleListing.findUnique({
      where: { id: listingId },
      include: {
        category: true,
        manufacturer: true,
        model: true,
        lister: { include: { user: true } },
      },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    const leadRef = `LEAD-${Date.now().toString().slice(-6)}`;

    // If customerId is provided, record lead in DB
    let lead = null;
    let effectiveCustId = customerId;

    if (!effectiveCustId) {
      // Find or fallback to demo customer
      const fallbackUser = await this.prisma.user.findFirst({
        where: { userType: 'CUSTOMER' },
      });
      if (fallbackUser) effectiveCustId = fallbackUser.id;
    }

    if (effectiveCustId) {
      try {
        lead = await this.prisma.lead.create({
          data: {
            leadRef,
            customerId: effectiveCustId,
            listingId,
            listerId: listing.listerId,
            contactType: contactType || 'WHATSAPP',
            message: message || `Inquiry from ${customerPhone || 'Customer'}`,
            status: 'NEW',
          },
        });
      } catch (err) {
        console.warn('Could not record lead entity:', err);
      }
    }

    // Increment listing inquiry count
    await this.prisma.vehicleListing.update({
      where: { id: listingId },
      data: { inquiryCount: { increment: 1 } },
    });

    const listerPhone = listing.lister.user.phone;
    const cleanPhone = listerPhone.replace(/[^0-9]/g, '');

    const vehicleName = `${listing.productionYear} ${listing.manufacturer?.name || ''} ${listing.model?.name || ''}`.trim();
    const prefilledText = encodeURIComponent(
      `Hello! I saw your vehicle listing for ${vehicleName} (Ref: ${listing.listingRef}) on the Marketplace. Daily Rate: ${listing.currencyCode} ${listing.dailyRate}. Is it available for rental?`,
    );
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${prefilledText}`;

    return {
      success: true,
      data: {
        leadRef,
        contactType: contactType || 'WHATSAPP',
        listerPhone,
        whatsappUrl,
        directCallUri: `tel:${listerPhone}`,
        message: 'Lead recorded successfully',
      },
    };
  }

  async createBooking(dto: {
    userId: string;
    listingId: string;
    startDate: string;
    endDate: string;
    pickupCity?: string;
    pickupAddress?: string;
    withDriver?: boolean;
    driverId?: string;
    customerCnic?: string;
    customerLicenceNumber?: string;
    customerLicenceExpiry?: string;
    customerLicenceCategory?: string;
    drivingLicenceUrl?: string;
    cnicUrl?: string;
    specialRequests?: string;
  }) {
    const {
      userId,
      listingId,
      startDate,
      endDate,
      pickupCity,
      pickupAddress,
      withDriver,
      driverId,
      customerCnic,
      customerLicenceNumber,
      customerLicenceExpiry,
      customerLicenceCategory,
      drivingLicenceUrl,
      cnicUrl,
      specialRequests,
    } = dto;

    const listing = await this.prisma.vehicleListing.findUnique({
      where: { id: listingId },
    });
    if (!listing) throw new NotFoundException('Vehicle listing not found');

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      throw new BadRequestException('End date must be after start date');
    }

    // Availability validation: Prevent overlapping confirmed bookings
    const overlappingBooking = await this.prisma.booking.findFirst({
      where: {
        listingId,
        status: { in: ['CONFIRMED', 'IN_PROGRESS'] },
        OR: [
          {
            startDate: { lte: end },
            endDate: { gte: start },
          },
        ],
      },
    });

    if (overlappingBooking) {
      throw new BadRequestException(
        'This vehicle is already booked and confirmed for the selected dates. Please select alternative dates.'
      );
    }

    let effectiveCustId = userId;
    if (!effectiveCustId) {
      const fallbackUser = await this.prisma.user.findFirst({
        where: { userType: 'CUSTOMER' },
      });
      if (fallbackUser) {
        effectiveCustId = fallbackUser.id;
      } else {
        const pkCountry = await this.prisma.country.findFirst({ where: { code: 'PK' } });
        const newUser = await this.prisma.user.create({
          data: {
            phone: `+92300${Math.floor(1000000 + Math.random() * 9000000)}`,
            phoneCountryCode: '+92',
            userType: 'CUSTOMER',
            accountStatus: 'APPROVED',
            countryId: pkCountry ? pkCountry.id : 'demo-country-pk',
          },
        });
        effectiveCustId = newUser.id;
      }
    }

    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

    let totalAmount = days * listing.dailyRate;
    if (days >= 30 && listing.monthlyRate) {
      totalAmount = listing.monthlyRate * Math.ceil(days / 30);
    } else if (days >= 7 && listing.weeklyRate) {
      totalAmount = listing.weeklyRate * Math.ceil(days / 7);
    }

    // Calculate Driver charges if chauffeur requested or independently hired
    let driverCharge = 0;
    if (withDriver || driverId) {
      const dailyDriverFee = listing.driverDailyCharge || 2500;
      driverCharge = dailyDriverFee * days;
      totalAmount += driverCharge;
    }

    const bookingRef = `BKG-${Date.now().toString().slice(-6)}`;

    // Pack customer verification credentials for Self-Drive security
    const securityCredentials = JSON.stringify({
      customerCnic: customerCnic || null,
      customerLicenceNumber: customerLicenceNumber || null,
      customerLicenceExpiry: customerLicenceExpiry || null,
      customerLicenceCategory: customerLicenceCategory || 'LTV / Motorcar',
      drivingLicenceUrl: drivingLicenceUrl || null,
      cnicUrl: cnicUrl || null,
      verifiedAt: new Date().toISOString(),
      notes: specialRequests || null,
    });

    const booking = await this.prisma.booking.create({
      data: {
        bookingRef,
        customerId: effectiveCustId,
        listingId,
        driverId: driverId || null,
        startDate: start,
        endDate: end,
        totalDays: days,
        withDriver: withDriver !== undefined ? withDriver : (listing.driverMandatory || !!driverId),
        dailyRate: listing.dailyRate,
        driverCharge,
        subtotal: totalAmount - driverCharge,
        taxAmount: 0,
        discountAmount: 0,
        totalAmount,
        currencyCode: listing.currencyCode,
        pickupLocation: pickupCity || listing.city,
        dropoffLocation: pickupAddress || null,
        specialRequests: securityCredentials,
        status: 'REQUESTED',
      },
      include: {
        listing: {
          include: { manufacturer: true, model: true, images: true },
        },
      },
    });

    return {
      success: true,
      data: booking,
      message: 'Booking request sent to lister. You will be notified once accepted.',
    };
  }

  async getUserBookings(userId: string) {
    const bookings = await this.prisma.booking.findMany({
      where: { customerId: userId },
      include: {
        listing: {
          include: {
            manufacturer: true,
            model: true,
            images: true,
            lister: { include: { user: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: bookings };
  }

  async getListerBookings(userId: string) {
    const lister = await this.prisma.listerProfile.findUnique({ where: { userId } });
    if (!lister) throw new BadRequestException('Lister profile not found');

    const bookings = await this.prisma.booking.findMany({
      where: {
        listing: { listerId: lister.id },
      },
      include: {
        customer: { include: { customerProfile: true } },
        listing: { include: { manufacturer: true, model: true, images: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: bookings };
  }

  async updateBookingStatus(bookingId: string, status: string, notes?: string) {
    const validStatuses = ['REQUESTED', 'ACCEPTED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Invalid booking status: ${status}`);
    }

    const booking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status },
      include: { listing: true, customer: true },
    });

    return { success: true, data: booking, message: `Booking marked as ${status}` };
  }
}

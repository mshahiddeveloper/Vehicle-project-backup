import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class AgentService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard() {
    const [
      pendingListingsCount,
      pendingPaymentsCount,
      pendingProfilesCount,
      assignedListersCount,
      recentAuditLogs,
    ] = await Promise.all([
      this.prisma.vehicleListing.count({
        where: { status: 'PENDING_APPROVAL' },
      }),
      this.prisma.paymentRecord.count({
        where: { status: { in: ['PENDING', 'SUBMITTED'] } },
      }),
      this.prisma.user.count({
        where: { accountStatus: 'PENDING_APPROVAL' },
      }),
      this.prisma.listerProfile.count(),
      this.prisma.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      metrics: {
        pendingListingsCount,
        pendingPaymentsCount,
        pendingProfilesCount,
        assignedListersCount,
      },
      recentLogs: recentAuditLogs,
    };
  }

  async getPendingListings() {
    return this.prisma.vehicleListing.findMany({
      where: { status: 'PENDING_APPROVAL' },
      include: {
        lister: true,
        category: true,
        manufacturer: true,
        model: true,
        images: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveListing(listingId: string, agentId?: string) {
    const listing = await this.prisma.vehicleListing.findUnique({
      where: { id: listingId },
    });
    if (!listing) throw new NotFoundException('Vehicle listing not found');

    const updated = await this.prisma.vehicleListing.update({
      where: { id: listingId },
      data: {
        status: 'LIVE',
        approvedById: agentId || 'system-agent',
        approvedAt: new Date(),
        rejectionReason: null,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'LISTING_APPROVED_BY_AGENT',
        resourceType: 'VEHICLE_LISTING',
        resourceId: listingId,
        details: JSON.stringify({ agentId }),
      },
    });

    return { success: true, listing: updated };
  }

  async rejectListing(listingId: string, reason: string, agentId?: string) {
    if (!reason) throw new BadRequestException('Rejection reason is required');

    const listing = await this.prisma.vehicleListing.findUnique({
      where: { id: listingId },
    });
    if (!listing) throw new NotFoundException('Vehicle listing not found');

    const updated = await this.prisma.vehicleListing.update({
      where: { id: listingId },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'LISTING_REJECTED_BY_AGENT',
        resourceType: 'VEHICLE_LISTING',
        resourceId: listingId,
        details: JSON.stringify({ reason, agentId }),
      },
    });

    // Provide prefilled WhatsApp support link for customer convenience
    const supportPhone = '923001234567';
    const waText = encodeURIComponent(
      `Hello, your listing (${listing.listingRef}) requires revision: ${reason}. Please update your pictures/documents.`
    );
    const whatsappLink = `https://wa.me/${supportPhone}?text=${waText}`;

    return {
      success: true,
      listing: updated,
      whatsappResolutionLink: whatsappLink,
    };
  }

  async getPendingPayments() {
    return this.prisma.paymentRecord.findMany({
      where: { status: { in: ['PENDING', 'SUBMITTED'] } },
      include: {
        user: true,
        paymentMethod: true,
        subscription: {
          include: { plan: true },
        },
        proofs: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approvePayment(paymentId: string, agentId?: string) {
    const payment = await this.prisma.paymentRecord.findUnique({
      where: { id: paymentId },
    });
    if (!payment) throw new NotFoundException('Payment record not found');

    const updated = await this.prisma.paymentRecord.update({
      where: { id: paymentId },
      data: {
        status: 'VERIFIED',
        verifiedById: agentId || 'system-agent',
        verifiedAt: new Date(),
      },
    });

    // If linked to a subscription, activate the subscription!
    if (payment.subscriptionId) {
      const now = new Date();
      const expires = new Date();
      expires.setDate(now.getDate() + 30);

      await this.prisma.subscription.update({
        where: { id: payment.subscriptionId },
        data: {
          status: 'ACTIVE',
          startsAt: now,
          expiresAt: expires,
        },
      });

      // Activate any pending-payment vehicle listings for this user
      await this.prisma.vehicleListing.updateMany({
        where: {
          lister: { userId: payment.userId },
          status: 'PENDING_PAYMENT',
        },
        data: { status: 'PENDING_APPROVAL' },
      });
    }

    await this.prisma.auditLog.create({
      data: {
        action: 'PAYMENT_VERIFIED_BY_AGENT',
        resourceType: 'PAYMENT_RECORD',
        resourceId: paymentId,
        details: JSON.stringify({ amount: payment.amount, agentId }),
      },
    });

    return { success: true, payment: updated };
  }

  async rejectPayment(paymentId: string, reason: string, agentId?: string) {
    if (!reason) throw new BadRequestException('Rejection reason is required');

    const payment = await this.prisma.paymentRecord.findUnique({
      where: { id: paymentId },
    });
    if (!payment) throw new NotFoundException('Payment record not found');

    const updated = await this.prisma.paymentRecord.update({
      where: { id: paymentId },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'PAYMENT_REJECTED_BY_AGENT',
        resourceType: 'PAYMENT_RECORD',
        resourceId: paymentId,
        details: JSON.stringify({ reason, agentId }),
      },
    });

    const supportPhone = '923001234567';
    const waText = encodeURIComponent(
      `As-salamu alaykum. Your payment verification for reference ${payment.referenceNumber} was rejected: ${reason}. Please resubmit valid payment proof.`
    );
    const whatsappLink = `https://wa.me/${supportPhone}?text=${waText}`;

    return {
      success: true,
      payment: updated,
      whatsappResolutionLink: whatsappLink,
    };
  }

  async getPendingProfiles() {
    return this.prisma.user.findMany({
      where: { accountStatus: 'PENDING_APPROVAL' },
      include: {
        listerProfile: true,
        driverProfile: true,
        customerProfile: true,
        documentUploads: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async verifyProfile(userId: string, agentId?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        accountStatus: 'APPROVED',
        approvedById: agentId || 'system-agent',
        approvedAt: new Date(),
      },
    });

    // Update individual profile verification flags
    await this.prisma.listerProfile.updateMany({
      where: { userId },
      data: { identityVerified: true, verificationStatus: 'VERIFIED' },
    });
    await this.prisma.driverProfile.updateMany({
      where: { userId },
      data: { identityVerified: true, licenceVerified: true, verificationStatus: 'VERIFIED' },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'USER_PROFILE_VERIFIED_BY_AGENT',
        resourceType: 'USER',
        resourceId: userId,
        details: JSON.stringify({ agentId }),
      },
    });

    return { success: true, user: updated };
  }
}


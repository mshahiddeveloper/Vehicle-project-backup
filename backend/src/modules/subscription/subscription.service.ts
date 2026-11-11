import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class SubscriptionService {
  constructor(private prisma: PrismaService) {}

  async getPlans(countryCode?: string, targetType?: string) {
    const where: any = { isActive: true };
    if (countryCode) {
      const country = await this.prisma.country.findUnique({
        where: { code: countryCode.toUpperCase() },
      });
      if (country) {
        where.countryId = country.id;
      }
    }
    if (targetType) {
      where.targetType = targetType;
    }

    const plans = await this.prisma.subscriptionPlan.findMany({
      where,
      orderBy: { displayOrder: 'asc' },
    });

    return {
      success: true,
      data: plans.map((p) => {
        let parsedFeatures = [];
        try {
          parsedFeatures = p.features ? JSON.parse(p.features) : [];
        } catch {}
        return { ...p, parsedFeatures };
      }),
    };
  }

  async selectPlan(userId: string, planId: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });
    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const subscription = await this.prisma.subscription.create({
      data: {
        userId,
        planId,
        countryId: plan.countryId,
        status: 'AWAITING_PAYMENT',
      },
      include: {
        plan: true,
      },
    });

    return {
      success: true,
      data: subscription,
      message: 'Plan selected. Please proceed to payment proof submission.',
    };
  }

  async getUserSubscription(userId: string) {
    const subscriptions = await this.prisma.subscription.findMany({
      where: { userId },
      include: {
        plan: true,
        paymentRecords: {
          include: { proofs: true, paymentMethod: true },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const activeSub = subscriptions.find((s) => s.status === 'ACTIVE');

    let currentListingsCount = 0;
    const lister = await this.prisma.listerProfile.findUnique({ where: { userId } });
    if (lister) {
      currentListingsCount = await this.prisma.vehicleListing.count({
        where: { listerId: lister.id, status: { in: ['LIVE', 'PENDING_APPROVAL'] } },
      });
    }

    return {
      success: true,
      data: {
        activeSubscription: activeSub || null,
        allSubscriptions: subscriptions,
        usage: {
          currentListingsCount,
          maxAllowedListings: activeSub?.plan?.maxListings ?? 0,
          canAddMore: activeSub ? (activeSub.plan.maxListings ? currentListingsCount < activeSub.plan.maxListings : true) : false,
        },
      },
    };
  }
}

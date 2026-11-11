import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class PaymentService {
  constructor(private prisma: PrismaService) {}

  async getMethods(countryCode: string) {
    const country = await this.prisma.country.findUnique({
      where: { code: countryCode.toUpperCase() },
      include: {
        paymentMethods: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    if (!country) {
      throw new NotFoundException(`Country code '${countryCode}' not found`);
    }

    return { success: true, data: country.paymentMethods };
  }

  async submitProof(dto: {
    userId: string;
    planId?: string;
    subscriptionId?: string;
    paymentMethodId: string;
    transactionRef: string;
    proofUrl?: string;
    amount?: number;
  }) {
    const { userId, planId, paymentMethodId, transactionRef, proofUrl } = dto;

    let subId = dto.subscriptionId;
    let finalAmount = dto.amount;
    let currency = 'PKR';

    // If subscriptionId not provided, create/find pending subscription
    if (!subId && planId) {
      const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id: planId } });
      if (!plan) throw new NotFoundException('Subscription plan not found');

      finalAmount = plan.price;
      currency = plan.currencyCode;

      const sub = await this.prisma.subscription.create({
        data: {
          userId,
          planId,
          countryId: plan.countryId,
          status: 'AWAITING_PAYMENT',
        },
      });
      subId = sub.id;
    } else if (subId) {
      const sub = await this.prisma.subscription.findUnique({
        where: { id: subId },
        include: { plan: true },
      });
      if (sub && sub.plan) {
        finalAmount = sub.plan.price;
        currency = sub.plan.currencyCode;
      }
    }

    const referenceNumber = `PAY-${Date.now().toString().slice(-6)}`;

    const payment = await this.prisma.paymentRecord.create({
      data: {
        referenceNumber,
        userId,
        subscriptionId: subId || null,
        paymentMethodId,
        paymentType: 'SUBSCRIPTION',
        amount: finalAmount || 2500,
        currencyCode: currency,
        finalAmount: finalAmount || 2500,
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
    });

    await this.prisma.paymentProof.create({
      data: {
        paymentRecordId: payment.id,
        fileUrl: proofUrl || 'https://placehold.co/600x400/png?text=Bank+Transfer+Receipt',
        fileType: 'image/jpeg',
        fileSize: 102400,
        transactionReference: transactionRef || `TXN-${Date.now()}`,
      },
    });

    return {
      success: true,
      data: {
        referenceNumber,
        paymentId: payment.id,
        status: 'SUBMITTED',
        message: 'Payment proof submitted successfully! Awaiting Super Admin / Verification Agent review.',
      },
    };
  }

  async getUserPayments(userId: string) {
    const payments = await this.prisma.paymentRecord.findMany({
      where: { userId },
      include: {
        paymentMethod: true,
        proofs: true,
        subscription: { include: { plan: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: payments };
  }
}

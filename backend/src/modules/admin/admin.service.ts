import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async togglePlatformMode(mode: 'PAKISTAN_ONLY' | 'INTERNATIONAL') {
    await this.prisma.platformSettings.upsert({
      where: { key: 'PLATFORM_OPERATION_MODE' },
      update: { value: JSON.stringify({ mode }) },
      create: { key: 'PLATFORM_OPERATION_MODE', value: JSON.stringify({ mode }) },
    });

    await this.logAudit({
      action: 'PLATFORM_MODE_CHANGE',
      resourceType: 'PLATFORM_SETTINGS',
      resourceId: 'PLATFORM_OPERATION_MODE',
      newState: { mode },
    });

    return { success: true, mode };
  }

  async toggleDriverPortal(enabled: boolean) {
    await this.prisma.platformSettings.upsert({
      where: { key: 'DRIVER_PORTAL_ENABLED' },
      update: { value: JSON.stringify({ enabled }) },
      create: { key: 'DRIVER_PORTAL_ENABLED', value: JSON.stringify({ enabled }) },
    });

    await this.logAudit({
      action: 'DRIVER_PORTAL_TOGGLE',
      resourceType: 'PLATFORM_SETTINGS',
      resourceId: 'DRIVER_PORTAL_ENABLED',
      newState: { enabled },
    });

    return { success: true, driverPortalEnabled: enabled };
  }

  async updateCountryStatus(code: string, status: string) {
    const validStatuses = ['DRAFT', 'CONFIGURED', 'PENDING_REVIEW', 'APPROVED', 'ACTIVE', 'SUSPENDED', 'DISABLED'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Invalid country status: ${status}`);
    }

    const country = await this.prisma.country.update({
      where: { code: code.toUpperCase() },
      data: {
        status,
        activatedAt: status === 'ACTIVE' ? new Date() : undefined,
      },
    });

    await this.logAudit({
      action: 'COUNTRY_STATUS_CHANGE',
      resourceType: 'COUNTRY',
      resourceId: country.id,
      newState: { status },
    });

    return { success: true, data: country };
  }

  async getPendingPayments() {
    const payments = await this.prisma.paymentRecord.findMany({
      where: { status: 'SUBMITTED' },
      include: {
        user: true,
        subscription: { include: { plan: true } },
        paymentMethod: true,
        proofs: true,
      },
      orderBy: { submittedAt: 'desc' },
    });
    return { success: true, data: payments };
  }

  async actionPayment(id: string, action: 'APPROVE' | 'REJECT', rejectionReason?: string, agentId?: string) {
    const payment = await this.prisma.paymentRecord.findUnique({
      where: { id },
      include: { user: true, subscription: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment record not found');
    }

    if (action === 'APPROVE') {
      // 1. Mark payment verified
      await this.prisma.paymentRecord.update({
        where: { id },
        data: { status: 'VERIFIED', verifiedAt: new Date(), verifiedById: agentId || null },
      });

      // 2. Activate subscription
      if (payment.subscriptionId) {
        await this.prisma.subscription.update({
          where: { id: payment.subscriptionId },
          data: {
            status: 'ACTIVE',
            startsAt: new Date(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          },
        });
      }

      // 3. Activate user account
      await this.prisma.user.update({
        where: { id: payment.userId },
        data: { accountStatus: 'APPROVED' },
      });

      // 4. Activate any draft listings waiting for payment
      const lister = await this.prisma.listerProfile.findUnique({ where: { userId: payment.userId } });
      if (lister) {
        await this.prisma.vehicleListing.updateMany({
          where: { listerId: lister.id, status: 'PENDING_PAYMENT' },
          data: { status: 'LIVE' },
        });
      }

      await this.logAudit({
        action: 'PAYMENT_APPROVE',
        resourceType: 'PAYMENT',
        resourceId: payment.id,
        userId: agentId,
      });

      return {
        success: true,
        message: 'Payment verified, subscription activated, and pending listings moved to LIVE successfully!',
      };
    } else {
      // REJECT Payment
      const reason = rejectionReason || 'Payment receipt unclear or transaction ID not found on bank statement.';
      await this.prisma.paymentRecord.update({
        where: { id },
        data: {
          status: 'REJECTED',
          rejectionReason: reason,
          verifiedById: agentId || null,
        },
      });

      const userPhone = payment.user.phone;
      const cleanPhone = userPhone.replace(/[^0-9]/g, '');
      const text = encodeURIComponent(
        `Assalam-o-Alaikum, your payment proof (Ref: ${payment.referenceNumber}) for Vehicle Rental Marketplace could not be approved. Reason: ${reason}. Please visit your account to re-upload clear proof.`,
      );
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${text}`;

      await this.logAudit({
        action: 'PAYMENT_REJECT',
        resourceType: 'PAYMENT',
        resourceId: payment.id,
        userId: agentId,
        newState: { rejectionReason: reason },
      });

      return {
        success: true,
        message: 'Payment rejected',
        rejectionReason: reason,
        whatsappLink: whatsappUrl,
      };
    }
  }

  async getPendingListings() {
    const listings = await this.prisma.vehicleListing.findMany({
      where: { status: 'PENDING_APPROVAL' },
      include: {
        category: true,
        manufacturer: true,
        model: true,
        images: true,
        lister: { include: { user: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: listings };
  }

  async actionListing(id: string, action: 'APPROVE' | 'REJECT', rejectionReason?: string, agentId?: string) {
    const listing = await this.prisma.vehicleListing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException('Listing not found');

    const updated = await this.prisma.vehicleListing.update({
      where: { id },
      data: {
        status: action === 'APPROVE' ? 'LIVE' : 'REJECTED',
        rejectionReason: action === 'REJECT' ? rejectionReason : null,
      },
    });

    await this.logAudit({
      action: action === 'APPROVE' ? 'LISTING_APPROVE' : 'LISTING_REJECT',
      resourceType: 'LISTING',
      resourceId: id,
      userId: agentId,
    });

    return { success: true, data: updated, message: `Listing is now ${updated.status}` };
  }

  async getPendingUsers() {
    const users = await this.prisma.user.findMany({
      where: { accountStatus: 'PENDING_APPROVAL' },
      include: {
        customerProfile: true,
        listerProfile: true,
        driverProfile: true,
        documents: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: users };
  }

  async actionUser(userId: string, action: 'APPROVE' | 'REJECT', agentId?: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        accountStatus: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
      },
    });

    await this.logAudit({
      action: action === 'APPROVE' ? 'USER_APPROVE' : 'USER_REJECT',
      resourceType: 'USER',
      resourceId: userId,
      userId: agentId,
    });

    return { success: true, data: user, message: `User account is now ${user.accountStatus}` };
  }

  async getAuditLogs(limit: number = 50) {
    const logs = await this.prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: logs };
  }

  async getModuleSwitches() {
    const keys = [
      'FEATURE_CAR_RENTALS_ENABLED',
      'FEATURE_PICK_AND_DROP_ENABLED',
      'FEATURE_CITY_TO_CITY_ENABLED',
      'FEATURE_GOODS_TRANSPORT_ENABLED',
    ];
    const settings = await this.prisma.platformSettings.findMany({
      where: { key: { in: keys } },
    });

    const modules: Record<string, boolean> = {
      FEATURE_CAR_RENTALS_ENABLED: true,
      FEATURE_PICK_AND_DROP_ENABLED: true,
      FEATURE_CITY_TO_CITY_ENABLED: true,
      FEATURE_GOODS_TRANSPORT_ENABLED: true,
    };

    settings.forEach((s) => {
      try {
        const val = JSON.parse(s.value);
        modules[s.key] = val.enabled !== false;
      } catch {}
    });

    return { success: true, modules };
  }

  async toggleModule(moduleKey: string, enabled: boolean) {
    await this.prisma.platformSettings.upsert({
      where: { key: moduleKey },
      update: { value: JSON.stringify({ enabled }) },
      create: { key: moduleKey, value: JSON.stringify({ enabled }) },
    });

    await this.logAudit({
      action: 'MODULE_TOGGLE',
      resourceType: 'PLATFORM_SETTINGS',
      resourceId: moduleKey,
      newState: { enabled },
    });

    return { success: true, moduleKey, enabled };
  }

  async getFullAdminOverview() {
    const [
      allListings,
      allUsers,
      bookings,
      leads,
      plans,
      complaints,
      termsSetting,
      privacySetting,
      popupSetting,
    ] = await Promise.all([
      this.prisma.vehicleListing.findMany({
        include: {
          manufacturer: true,
          model: true,
          images: { take: 1 },
          lister: { include: { user: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.findMany({
        include: {
          customerProfile: true,
          listerProfile: true,
          driverProfile: true,
          agentProfile: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.booking.findMany({
        include: {
          customer: true,
          listing: {
            include: {
              manufacturer: true,
              model: true,
              lister: { include: { user: true } },
            },
          },
          driver: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.lead.findMany({
        include: {
          customer: true,
          listing: {
            include: {
              manufacturer: true,
              model: true,
            },
          },
          lister: { include: { user: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.subscriptionPlan.findMany({
        orderBy: { displayOrder: 'asc' },
      }),
      this.prisma.complaint.findMany({
        include: { user: true, messages: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.platformSettings.findUnique({ where: { key: 'LEGAL_TERMS_CONTENT' } }),
      this.prisma.platformSettings.findUnique({ where: { key: 'LEGAL_PRIVACY_CONTENT' } }),
      this.prisma.platformSettings.findUnique({ where: { key: 'PROMOTIONAL_POPUP_CONFIG' } }),
    ]);

    const connections = [
      ...bookings.map((b) => ({
        id: b.id,
        type: 'BOOKING_REQUEST',
        reference: b.bookingRef,
        customerPhone: b.customer?.phone || 'Customer',
        listerPhone: b.listing?.lister?.user?.phone || 'Lister',
        vehicle: `${b.listing?.manufacturer?.name || ''} ${b.listing?.model?.name || ''} (${b.listing?.productionYear || ''})`,
        serviceType: b.listing?.serviceType || 'CAR_RENTAL',
        status: b.status,
        amount: b.totalAmount,
        currencyCode: b.currencyCode,
        createdAt: b.createdAt,
      })),
      ...leads.map((l) => ({
        id: l.id,
        type: 'WHATSAPP_LEAD',
        reference: l.leadRef,
        customerPhone: l.customer?.phone || 'Customer',
        listerPhone: l.lister?.user?.phone || 'Lister',
        vehicle: `${l.listing?.manufacturer?.name || ''} ${l.listing?.model?.name || ''}`,
        serviceType: l.listing?.serviceType || 'CAR_RENTAL',
        status: l.status,
        amount: 0,
        currencyCode: 'PKR',
        createdAt: l.createdAt,
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const defaultTerms = `1. SAFARPK IS A TECHNOLOGY PLATFORM ONLY: SafarPK operates solely as an online directory and communication medium connecting independent vehicle owners, drivers, and transporters with potential customers. SafarPK is NOT a transportation company, rental agency, insurer, or payment escrow.
2. ZERO LIABILITY DISCLAIMER: SafarPK takes NO responsibility whatsoever for payments, cash exchanges, advance tokens, vehicle mechanical condition, vehicle damage, traffic violations, accidents, theft, personal injury, physical safety, or customer/lister disputes.
3. MANDATORY PHYSICAL VERIFICATION: Customers MUST inspect the vehicle in person, check original registration cards, Smart Cards, Token Tax receipts, and driving credentials before handing over any money or security deposit.
4. REFUND & RETURN POLICIES: Any security deposit, refund, or cancellation fee is strictly a private civil matter agreed upon directly between the customer and the service partner. SafarPK cannot intervene, refund, or compensate.
5. INDEMNITY: By submitting a booking request or listing a vehicle, you agree to hold SafarPK, its directors, developers, and operators completely harmless from any claims, losses, or legal liabilities.`;

    const defaultPrivacy = `1. INFORMATION COLLECTION: SafarPK collects phone numbers, names, operating city, and identity document scans (CNIC, Driving License, Registration Books) solely for partner verification and preventing fraudulent activities.
2. PRIVACY OF SENSITIVE VEHICLE DATA: Engine numbers, chassis numbers, and private identity documents are kept private and are never published publicly on the marketplace.
3. DATA PROTECTION: We do not sell or monetize personal data with third-party advertising brokers. Contact details are shared only when an inquiry is initiated between a customer and a partner.`;

    let terms = defaultTerms;
    if (termsSetting?.value) {
      try {
        const parsed = JSON.parse(termsSetting.value);
        if (parsed.content) terms = parsed.content;
      } catch {}
    }

    let privacy = defaultPrivacy;
    if (privacySetting?.value) {
      try {
        const parsed = JSON.parse(privacySetting.value);
        if (parsed.content) privacy = parsed.content;
      } catch {}
    }

    let popup = {
      enabled: true,
      title: '🎉 Welcome to SafarPK Marketplace',
      badge: 'Pakistan Official Launch',
      message: 'Direct connections with local car hosts, daily pick & drop shuttles, intercity rides, and home shifting cargo across Pakistan.',
      linkText: 'Explore Fleet',
      linkUrl: '#',
    };
    if (popupSetting?.value) {
      try {
        popup = JSON.parse(popupSetting.value);
      } catch {}
    }

    return {
      success: true,
      allListings,
      allUsers,
      connections,
      plans,
      complaints: complaints || [],
      terms,
      privacy,
      promotionalPopup: popup,
    };
  }

  async toggleListingStatus(id: string, status: string) {
    const listing = await this.prisma.vehicleListing.update({
      where: { id },
      data: { status },
    });
    await this.logAudit({
      action: 'ADMIN_TOGGLE_LISTING_STATUS',
      resourceType: 'VEHICLE_LISTING',
      resourceId: id,
      newState: { status },
    });
    return { success: true, listing };
  }

  async getAgents() {
    return this.prisma.agentProfile.findMany({
      include: {
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createAgent(dto: {
    name: string;
    phone: string;
    email?: string;
    permissions: string[];
    department?: string;
    employeeId?: string;
  }) {
    const pk = await this.prisma.country.findFirst({ where: { code: 'PK' } });
    const user = await this.prisma.user.create({
      data: {
        phone: dto.phone,
        phoneCountryCode: '+92',
        email: dto.email || null,
        userType: 'AGENT',
        accountStatus: 'APPROVED',
        countryId: pk ? pk.id : 'demo-country-pk',
      },
    });

    const nameParts = dto.name.split(' ');
    const agent = await this.prisma.agentProfile.create({
      data: {
        userId: user.id,
        firstName: nameParts[0] || 'Agent',
        lastName: nameParts.slice(1).join(' ') || 'Staff',
        employeeId: dto.employeeId || `AGY-PK-${Math.floor(100 + Math.random() * 900)}`,
        department: JSON.stringify(dto.permissions || ['customer.view', 'listing.view']),
      },
    });

    await this.logAudit({
      action: 'ADMIN_CREATE_AGENT',
      resourceType: 'AGENT_PROFILE',
      resourceId: agent.id,
      newState: dto,
    });

    return { success: true, agent, user };
  }

  async updateAgentPermissions(agentId: string, permissions: string[]) {
    const updated = await this.prisma.agentProfile.update({
      where: { id: agentId },
      data: { department: JSON.stringify(permissions) },
    });
    await this.logAudit({
      action: 'ADMIN_UPDATE_AGENT_PERMISSIONS',
      resourceType: 'AGENT_PROFILE',
      resourceId: agentId,
      newState: { permissionsCount: permissions.length },
    });
    return { success: true, agent: updated };
  }

  async setAgentStatus(agentId: string, isActive: boolean) {
    const agent = await this.prisma.agentProfile.update({
      where: { id: agentId },
      data: { isActive },
      include: { user: true },
    });

    await this.prisma.user.update({
      where: { id: agent.userId },
      data: { accountStatus: isActive ? 'APPROVED' : 'BLOCKED' },
    });

    await this.logAudit({
      action: isActive ? 'ADMIN_ACTIVATE_AGENT' : 'ADMIN_SUSPEND_AGENT',
      resourceType: 'AGENT_PROFILE',
      resourceId: agentId,
      newState: { isActive },
    });

    return { success: true, agent };
  }

  async resetAgentPassword(agentId: string, tempSecret?: string) {
    const agent = await this.prisma.agentProfile.findUnique({
      where: { id: agentId },
      include: { user: true },
    });
    if (!agent) throw new NotFoundException('Agent not found');

    const generatedKey = tempSecret || `SafarAgent-${Math.floor(100000 + Math.random() * 900000)}`;

    await this.prisma.user.update({
      where: { id: agent.userId },
      data: { passwordHash: generatedKey },
    });

    await this.logAudit({
      action: 'ADMIN_RESET_AGENT_CREDENTIALS',
      resourceType: 'AGENT_PROFILE',
      resourceId: agentId,
    });

    return {
      success: true,
      message: 'Agent credentials reset successfully. Share this temporary key securely with the agent.',
      tempKey: generatedKey,
    };
  }

  async getAgentActivity(agentId: string, startDate?: string, endDate?: string) {
    const agent = await this.prisma.agentProfile.findUnique({
      where: { id: agentId },
    });
    if (!agent) throw new NotFoundException('Agent not found');

    const whereClause: any = {
      userId: agent.userId,
    };

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = new Date(startDate);
      if (endDate) whereClause.createdAt.lte = new Date(endDate);
    }

    const logs = await this.prisma.auditLog.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return {
      agentId,
      agentName: `${agent.firstName} ${agent.lastName}`,
      totalActions: logs.length,
      logs,
    };
  }

  async adjustListerQuota(listerId: string, newQuota: number) {
    const lister = await this.prisma.listerProfile.update({
      where: { id: listerId },
      data: {
        operatingHours: JSON.stringify({ customListingQuota: newQuota }),
      },
    });
    await this.logAudit({
      action: 'ADMIN_ADJUST_LISTER_QUOTA',
      resourceType: 'LISTER_PROFILE',
      resourceId: listerId,
      newState: { customListingQuota: newQuota },
    });
    return { success: true, lister };
  }

  async saveSubscriptionPlan(dto: {
    id?: string;
    name: string;
    price: number;
    maxListings?: number;
    isActive?: boolean;
    targetType?: string;
  }) {
    if (dto.id) {
      const updated = await this.prisma.subscriptionPlan.update({
        where: { id: dto.id },
        data: {
          name: dto.name,
          price: Number(dto.price),
          maxListings: dto.maxListings !== undefined ? Number(dto.maxListings) : null,
          isActive: dto.isActive !== undefined ? dto.isActive : true,
        },
      });
      return { success: true, plan: updated };
    } else {
      const pk = await this.prisma.country.findFirst({ where: { code: 'PK' } });
      const created = await this.prisma.subscriptionPlan.create({
        data: {
          countryId: pk!.id,
          targetType: dto.targetType || 'LISTER',
          name: dto.name,
          price: Number(dto.price),
          currencyCode: 'PKR',
          maxListings: dto.maxListings ? Number(dto.maxListings) : 10,
          isActive: dto.isActive !== undefined ? dto.isActive : true,
        },
      });
      return { success: true, plan: created };
    }
  }

  async saveLegalContent(type: 'TERMS' | 'PRIVACY', content: string) {
    const key = type === 'TERMS' ? 'LEGAL_TERMS_CONTENT' : 'LEGAL_PRIVACY_CONTENT';
    await this.prisma.platformSettings.upsert({
      where: { key },
      update: { value: JSON.stringify({ content }) },
      create: { key, value: JSON.stringify({ content }) },
    });
    await this.logAudit({
      action: `ADMIN_UPDATE_LEGAL_${type}`,
      resourceType: 'PLATFORM_SETTINGS',
      resourceId: key,
    });
    return { success: true, type, content };
  }

  async savePromotionalPopup(popup: any) {
    await this.prisma.platformSettings.upsert({
      where: { key: 'PROMOTIONAL_POPUP_CONFIG' },
      update: { value: JSON.stringify(popup) },
      create: { key: 'PROMOTIONAL_POPUP_CONFIG', value: JSON.stringify(popup) },
    });
    await this.logAudit({
      action: 'ADMIN_UPDATE_PROMOTIONAL_POPUP',
      resourceType: 'PLATFORM_SETTINGS',
      resourceId: 'PROMOTIONAL_POPUP_CONFIG',
      newState: popup,
    });
    return { success: true, popup };
  }

  private async logAudit(params: {
    action: string;
    resourceType: string;
    resourceId: string;
    userId?: string;
    newState?: Record<string, any>;
  }) {
    try {
      await this.prisma.auditLog.create({
        data: {
          action: params.action,
          resourceType: params.resourceType,
          resourceId: params.resourceId,
          userId: params.userId || null,
          details: params.newState ? JSON.stringify(params.newState) : null,
        },
      });
    } catch {}
  }
}

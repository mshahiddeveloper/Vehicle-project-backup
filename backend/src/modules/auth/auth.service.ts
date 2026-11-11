import { Injectable, BadRequestException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service.js';
import bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: {
    phone: string;
    phoneCountryCode?: string;
    email?: string;
    password?: string;
    userType: string;
    countryCode?: string;
    profileData?: Record<string, any>;
  }) {
    const { phone, phoneCountryCode, email, password, userType, countryCode, profileData } = dto;

    // 1. Verify country is active
    const targetCode = (countryCode || 'PK').toUpperCase();
    const country = await this.prisma.country.findUnique({
      where: { code: targetCode },
    });

    if (!country) {
      throw new BadRequestException(`Country code '${targetCode}' not supported.`);
    }

    if (country.status !== 'ACTIVE') {
      throw new BadRequestException(
        `Country ${country.name} (${targetCode}) is currently ${country.status}. Registrations are not active yet.`,
      );
    }

    // 2. Check existing user
    let user = await this.prisma.user.findUnique({ where: { phone } });
    if (user) {
      throw new BadRequestException(`An account with phone number ${phone} already exists.`);
    }

    const passwordHash = password ? await bcrypt.hash(password, 10) : await bcrypt.hash('secret123', 10);

    const isCustomer = userType === 'CUSTOMER';

    // 3. Create User
    user = await this.prisma.user.create({
      data: {
        phone,
        phoneCountryCode: phoneCountryCode || country.phoneCode || '+92',
        email: email || null,
        passwordHash,
        userType: userType || 'CUSTOMER',
        countryId: country.id,
        accountStatus: isCustomer ? 'APPROVED' : 'PENDING_APPROVAL',
        phoneVerified: true,
      },
    });

    // 4. Create Persona Profile
    if (userType === 'CUSTOMER') {
      await this.prisma.customerProfile.create({
        data: {
          userId: user.id,
          firstName: profileData?.firstName || 'Customer',
          lastName: profileData?.lastName || 'User',
          idNumber: profileData?.idNumber || null,
          city: profileData?.city || 'Lahore',
        },
      });
    } else if (userType === 'INDIVIDUAL_LISTER' || userType === 'BUSINESS_LISTER') {
      await this.prisma.listerProfile.create({
        data: {
          userId: user.id,
          listerType: userType,
          firstName: profileData?.firstName || 'Lister',
          lastName: profileData?.lastName || 'Owner',
          displayName: profileData?.displayName || profileData?.businessName || `${profileData?.firstName || 'Owner'} Fleet`,
          businessName: profileData?.businessName || null,
          taxNumber: profileData?.taxNumber || null,
          city: profileData?.city || 'Lahore',
        },
      });
    } else if (userType === 'DRIVER') {
      await this.prisma.driverProfile.create({
        data: {
          userId: user.id,
          firstName: profileData?.firstName || 'Driver',
          lastName: profileData?.lastName || 'Captain',
          licenceNumber: profileData?.licenceNumber || 'DL-PENDING',
          city: profileData?.city || 'Lahore',
        },
      });
    }

    // 5. Generate Access Token
    const payload = { sub: user.id, phone: user.phone, userType: user.userType, countryId: user.countryId };
    const accessToken = this.jwtService.sign(payload);

    return {
      success: true,
      data: {
        user: {
          id: user.id,
          phone: user.phone,
          userType: user.userType,
          accountStatus: user.accountStatus,
          countryId: user.countryId,
        },
        accessToken,
      },
    };
  }

  async login(dto: { phone?: string; email?: string; password?: string }) {
    const { phone, email, password } = dto;
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          phone ? { phone } : undefined,
          email ? { email } : undefined,
        ].filter(Boolean) as any,
      },
      include: {
        customerProfile: true,
        listerProfile: true,
        driverProfile: true,
        agentProfile: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    if (password && user.passwordHash) {
      const match = await bcrypt.compare(password, user.passwordHash);
      if (!match) {
        throw new UnauthorizedException('Invalid credentials.');
      }
    }

    const payload = { sub: user.id, phone: user.phone, userType: user.userType, countryId: user.countryId };
    const accessToken = this.jwtService.sign(payload);

    return {
      success: true,
      data: {
        user: {
          id: user.id,
          phone: user.phone,
          email: user.email,
          userType: user.userType,
          accountStatus: user.accountStatus,
          countryId: user.countryId,
          profile: user.customerProfile || user.listerProfile || user.driverProfile || user.agentProfile,
        },
        accessToken,
      },
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        country: true,
        customerProfile: true,
        listerProfile: true,
        driverProfile: true,
        agentProfile: true,
        subscriptions: {
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return { success: true, data: user };
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class CountryService {
  constructor(private prisma: PrismaService) {}

  async getPlatformConfig() {
    const settings = await this.prisma.platformSettings.findMany();
    const configMap: Record<string, any> = {};
    settings.forEach((s) => {
      try {
        configMap[s.key] = JSON.parse(s.value);
      } catch {
        configMap[s.key] = s.value;
      }
    });

    const activeCountries = await this.prisma.country.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { displayOrder: 'asc' },
    });

    return {
      success: true,
      data: {
        operationMode: configMap['PLATFORM_OPERATION_MODE']?.mode || 'PAKISTAN_ONLY',
        driverPortalEnabled: configMap['DRIVER_PORTAL_ENABLED']?.enabled ?? true,
        maxCountries: configMap['MAX_ACTIVE_COUNTRIES']?.limit || 10,
        activeCountries,
      },
    };
  }

  async getCountries(all: boolean = false) {
    const countries = await this.prisma.country.findMany({
      where: all ? {} : { status: 'ACTIVE' },
      orderBy: { displayOrder: 'asc' },
    });
    return { success: true, data: countries };
  }

  async getCountryByCode(code: string) {
    const country = await this.prisma.country.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        phoneCountryCodes: true,
        documentRequirements: true,
        formFields: true,
        paymentMethods: { where: { isActive: true } },
        subscriptionPlans: { where: { isActive: true } },
      },
    });

    if (!country) {
      throw new NotFoundException(`Country with code '${code}' not found.`);
    }

    return { success: true, data: country };
  }

  async getCountryRequirements(code: string, userType?: string) {
    const country = await this.prisma.country.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        documentRequirements: userType ? { where: { userType } } : true,
        formFields: userType ? { where: { userType } } : true,
        paymentMethods: { where: { isActive: true } },
        subscriptionPlans: userType
          ? { where: { isActive: true, targetType: userType === 'DRIVER' ? 'DRIVER' : 'LISTER' } }
          : { where: { isActive: true } },
      },
    });

    if (!country) {
      throw new NotFoundException(`Country with code '${code}' not found.`);
    }

    let parsedRegistrationConfig = null;
    let parsedIdentityRequirements = null;
    let parsedBusinessRequirements = null;
    let parsedVehicleRequirements = null;
    let parsedDriverRequirements = null;

    try {
      if (country.registrationConfig) parsedRegistrationConfig = JSON.parse(country.registrationConfig);
      if (country.identityRequirements) parsedIdentityRequirements = JSON.parse(country.identityRequirements);
      if (country.businessRequirements) parsedBusinessRequirements = JSON.parse(country.businessRequirements);
      if (country.vehicleRequirements) parsedVehicleRequirements = JSON.parse(country.vehicleRequirements);
      if (country.driverRequirements) parsedDriverRequirements = JSON.parse(country.driverRequirements);
    } catch {}

    return {
      success: true,
      data: {
        ...country,
        parsedRegistrationConfig,
        parsedIdentityRequirements,
        parsedBusinessRequirements,
        parsedVehicleRequirements,
        parsedDriverRequirements,
      },
    };
  }
}


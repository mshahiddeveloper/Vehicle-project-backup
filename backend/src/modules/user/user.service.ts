import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getDrivers(city?: string) {
    // Check master toggle
    const toggleSetting = await this.prisma.platformSettings.findUnique({
      where: { key: 'DRIVER_PORTAL_ENABLED' },
    });
    if (toggleSetting) {
      try {
        const val = JSON.parse(toggleSetting.value);
        if (val.enabled === false) {
          return {
            success: true,
            data: [],
            driverPortalEnabled: false,
            message: 'Driver Portal is currently disabled by Platform Administration.',
          };
        }
      } catch {}
    }

    const where: any = {
      availabilityStatus: 'AVAILABLE',
      user: { accountStatus: 'APPROVED' },
    };
    if (city) where.city = { contains: city };

    const drivers = await this.prisma.driverProfile.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            phoneCountryCode: true,
            accountStatus: true,
            country: true,
          },
        },
      },
      orderBy: { ratingAverage: 'desc' },
    });

    return {
      success: true,
      driverPortalEnabled: true,
      data: drivers,
    };
  }

  async getDriverById(id: string) {
    const driver = await this.prisma.driverProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            phoneCountryCode: true,
            accountStatus: true,
            createdAt: true,
          },
        },
      },
    });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    return { success: true, data: driver };
  }

  async toggleDriverAvailability(userId: string, isAvailable: boolean) {
    const driver = await this.prisma.driverProfile.findUnique({ where: { userId } });
    if (!driver) throw new NotFoundException('Driver profile not found');

    const updated = await this.prisma.driverProfile.update({
      where: { id: driver.id },
      data: { availabilityStatus: isAvailable ? 'AVAILABLE' : 'OFFLINE' },
    });

    return { success: true, data: updated };
  }

  async toggleSavedVehicle(userId: string, listingId: string) {
    const existing = await this.prisma.savedVehicle.findUnique({
      where: {
        customerId_listingId: {
          customerId: userId,
          listingId,
        },
      },
    });

    if (existing) {
      await this.prisma.savedVehicle.delete({
        where: { id: existing.id },
      });
      return { success: true, isSaved: false, message: 'Removed from saved vehicles' };
    } else {
      await this.prisma.savedVehicle.create({
        data: {
          customerId: userId,
          listingId,
        },
      });
      return { success: true, isSaved: true, message: 'Added to saved vehicles' };
    }
  }

  async getSavedVehicles(userId: string) {
    const saved = await this.prisma.savedVehicle.findMany({
      where: { customerId: userId },
      include: {
        listing: {
          include: {
            category: true,
            manufacturer: true,
            model: true,
            images: true,
            lister: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: saved.map((s) => s.listing),
    };
  }

  async getCustomerBookings(userId: string) {
    const bookings = await this.prisma.booking.findMany({
      where: { customerId: userId },
      include: {
        listing: {
          include: {
            manufacturer: true,
            model: true,
            images: true,
          },
        },
        driver: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, data: bookings };
  }

  async getCustomerLeads(userId: string) {
    const leads = await this.prisma.lead.findMany({
      where: { customerId: userId },
      include: {
        listing: {
          include: {
            manufacturer: true,
            model: true,
            images: true,
          },
        },
        lister: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, data: leads };
  }
}

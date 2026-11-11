import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class VehicleCatalogueService {
  constructor(private prisma: PrismaService) {}

  async getCategories() {
    const categories = await this.prisma.vehicleCategory.findMany({
      where: { isActive: true },
      include: {
        manufacturers: {
          include: { models: true },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });
    return { success: true, data: categories };
  }

  async getManufacturers(categoryId?: string) {
    const where: any = { isActive: true };
    if (categoryId) where.categoryId = categoryId;
    const manufacturers = await this.prisma.vehicleManufacturer.findMany({
      where,
      include: { models: true },
      orderBy: { name: 'asc' },
    });
    return { success: true, data: manufacturers };
  }

  async getModels(manufacturerId?: string) {
    const where: any = { isActive: true };
    if (manufacturerId) where.manufacturerId = manufacturerId;
    const models = await this.prisma.vehicleModel.findMany({
      where,
      orderBy: { name: 'asc' },
    });
    return { success: true, data: models };
  }

  async createCategory(data: { name: string; slug: string; icon?: string; displayOrder?: number }) {
    const cat = await this.prisma.vehicleCategory.create({ data });
    return { success: true, data: cat };
  }

  async createManufacturer(data: { name: string; categoryId: string; slug?: string; countryOfOrigin?: string }) {
    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const mfg = await this.prisma.vehicleManufacturer.create({
      data: {
        name: data.name,
        slug,
        categoryId: data.categoryId,
        countryOfOrigin: data.countryOfOrigin || 'International',
      },
    });
    return { success: true, data: mfg };
  }

  async createModel(data: {
    name: string;
    manufacturerId: string;
    slug?: string;
    bodyType?: string;
    yearStart?: number;
    yearEnd?: number;
  }) {
    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const model = await this.prisma.vehicleModel.create({
      data: {
        name: data.name,
        slug,
        manufacturerId: data.manufacturerId,
        bodyType: data.bodyType || 'SEDAN',
        yearStart: data.yearStart ? Number(data.yearStart) : 2020,
        yearEnd: data.yearEnd ? Number(data.yearEnd) : null,
      },
    });
    return { success: true, data: model };
  }
}

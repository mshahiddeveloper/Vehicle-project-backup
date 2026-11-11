import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class ListingService {
  constructor(private prisma: PrismaService) {}

  async searchListings(query: {
    category?: string;
    manufacturer?: string;
    city?: string;
    fuelType?: string;
    transmission?: string;
    driverAvailable?: string;
    minPrice?: string;
    maxPrice?: string;
    search?: string;
    page?: string;
    limit?: string;
    serviceType?: string;
    originCity?: string;
    destinationCity?: string;
  }) {
    const { category, manufacturer, city, fuelType, transmission, driverAvailable, minPrice, maxPrice, search, serviceType, originCity, destinationCity } = query;

    const where: any = { status: 'LIVE' };

    if (serviceType) {
      where.serviceType = serviceType;
    }
    if (originCity) {
      where.originCity = { contains: originCity };
    }
    if (destinationCity) {
      where.destinationCity = { contains: destinationCity };
    }

    if (city) {
      where.city = { contains: city };
    }
    if (category) {
      where.categoryId = category;
    }
    if (manufacturer) {
      where.manufacturerId = manufacturer;
    }
    if (fuelType) {
      where.fuelType = fuelType;
    }
    if (transmission) {
      where.transmission = transmission;
    }
    if (driverAvailable !== undefined && driverAvailable !== '') {
      where.driverAvailable = driverAvailable === 'true';
    }
    if (minPrice || maxPrice) {
      where.dailyRate = {};
      if (minPrice) where.dailyRate.gte = Number(minPrice);
      if (maxPrice) where.dailyRate.lte = Number(maxPrice);
    }
    if (search) {
      where.OR = [
        { description: { contains: search } },
        { city: { contains: search } },
        { colour: { contains: search } },
      ];
    }

    const take = Number(query.limit) || 20;
    const skip = ((Number(query.page) || 1) - 1) * take;

    const [total, listings] = await Promise.all([
      this.prisma.vehicleListing.count({ where }),
      this.prisma.vehicleListing.findMany({
        where,
        include: {
          category: true,
          manufacturer: true,
          model: true,
          images: { orderBy: { displayOrder: 'asc' } },
          lister: {
            include: { user: true },
          },
        },
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
        skip,
        take,
      }),
    ]);

    return {
      success: true,
      data: listings,
      meta: {
        total,
        page: Number(query.page) || 1,
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  async getListingById(id: string) {
    const listing = await this.prisma.vehicleListing.findUnique({
      where: { id },
      include: {
        category: true,
        manufacturer: true,
        model: true,
        images: { orderBy: { displayOrder: 'asc' } },
        lister: {
          include: {
            user: true,
          },
        },
        bookings: {
          take: 5,
          where: { status: 'COMPLETED' },
          include: { reviews: true },
        },
      },
    });

    if (!listing) {
      throw new NotFoundException('Vehicle listing not found');
    }

    // Increment views
    await this.prisma.vehicleListing.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return { success: true, data: listing };
  }

  async createDraft(dto: {
    userId: string;
    categoryId: string;
    manufacturerId: string;
    modelId: string;
    productionYear: number;
    colour: string;
    registrationNumber: string;
    dailyRate: number;
    weeklyRate?: number;
    monthlyRate?: number;
    city: string;
    transmission?: string;
    fuelType?: string;
    driverAvailable?: boolean;
    driverMandatory?: boolean;
    description?: string;
    imageUrls?: string[];
    serviceType?: string;
    originCity?: string;
    destinationCity?: string;
    routeDetails?: string;
    morningPickupTime?: string;
    eveningDropTime?: string;
    pricePerSeat?: number;
    availableSeats?: number;
    monthlyRatePerSeat?: number;
    movingCapacityTons?: number;
    helpersAvailable?: boolean;
    helperRate?: number;
    serviceConfig?: string;
  }) {
    const lister = await this.prisma.listerProfile.findUnique({
      where: { userId: dto.userId },
    });
    if (!lister) {
      throw new BadRequestException('User does not have a lister profile');
    }

    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    const listingRef = `LST-${Date.now().toString().slice(-6)}`;

    const listing = await this.prisma.vehicleListing.create({
      data: {
        listingRef,
        listerId: lister.id,
        countryId: user!.countryId,
        categoryId: dto.categoryId,
        manufacturerId: dto.manufacturerId,
        modelId: dto.modelId,
        productionYear: Number(dto.productionYear) || 2023,
        colour: dto.colour || 'White',
        registrationNumber: dto.registrationNumber || 'PENDING',
        dailyRate: Number(dto.dailyRate) || 5000,
        weeklyRate: dto.weeklyRate ? Number(dto.weeklyRate) : null,
        monthlyRate: dto.monthlyRate ? Number(dto.monthlyRate) : null,
        city: dto.city || 'Lahore',
        transmission: dto.transmission || 'AUTOMATIC',
        fuelType: dto.fuelType || 'PETROL',
        driverAvailable: dto.driverAvailable !== undefined ? dto.driverAvailable : true,
        driverMandatory: dto.driverMandatory !== undefined ? dto.driverMandatory : false,
        currencyCode: 'PKR',
        description: dto.description || 'Verified vehicle listing on Marketplace',
        status: 'PENDING_PAYMENT',
        serviceType: dto.serviceType || 'CAR_RENTAL',
        originCity: dto.originCity || null,
        destinationCity: dto.destinationCity || null,
        routeDetails: dto.routeDetails || null,
        morningPickupTime: dto.morningPickupTime || null,
        eveningDropTime: dto.eveningDropTime || null,
        pricePerSeat: dto.pricePerSeat ? Number(dto.pricePerSeat) : null,
        availableSeats: dto.availableSeats ? Number(dto.availableSeats) : null,
        monthlyRatePerSeat: dto.monthlyRatePerSeat ? Number(dto.monthlyRatePerSeat) : null,
        movingCapacityTons: dto.movingCapacityTons ? Number(dto.movingCapacityTons) : null,
        helpersAvailable: dto.helpersAvailable !== undefined ? dto.helpersAvailable : false,
        helperRate: dto.helperRate ? Number(dto.helperRate) : null,
        serviceConfig: dto.serviceConfig || null,
      },
    });

    if (dto.imageUrls && dto.imageUrls.length > 0) {
      for (let i = 0; i < dto.imageUrls.length; i++) {
        await this.prisma.listingImage.create({
          data: {
            listingId: listing.id,
            originalUrl: dto.imageUrls[i],
            isPrimary: i === 0,
            displayOrder: i,
          },
        });
      }
    } else {
      // Demo placeholder
      await this.prisma.listingImage.create({
        data: {
          listingId: listing.id,
          originalUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
          isPrimary: true,
          displayOrder: 0,
        },
      });
    }

    return {
      success: true,
      data: listing,
      message: 'Vehicle draft created. Please ensure your subscription is active to submit for approval.',
    };
  }

  async submitListing(listingId: string, userId: string) {
    const listing = await this.prisma.vehicleListing.findUnique({
      where: { id: listingId },
      include: { lister: true },
    });
    if (!listing) throw new NotFoundException('Listing not found');

    // Verify ownership
    if (listing.lister.userId !== userId) {
      throw new BadRequestException('Not authorized to modify this listing');
    }

    // Check active subscription
    const activeSub = await this.prisma.subscription.findFirst({
      where: { userId, status: 'ACTIVE' },
      include: { plan: true },
    });

    if (!activeSub) {
      return {
        success: false,
        requiresSubscription: true,
        message: 'An active subscription is required to submit and publish vehicle listings.',
      };
    }

    // Check quota
    if (activeSub.plan.maxListings) {
      const liveCount = await this.prisma.vehicleListing.count({
        where: { listerId: listing.listerId, status: { in: ['LIVE', 'PENDING_APPROVAL'] } },
      });
      if (liveCount >= activeSub.plan.maxListings) {
        throw new BadRequestException(
          `Your subscription plan (${activeSub.plan.name}) allows up to ${activeSub.plan.maxListings} listings. Limit reached.`,
        );
      }
    }

    const updated = await this.prisma.vehicleListing.update({
      where: { id: listingId },
      data: { status: 'PENDING_APPROVAL' },
    });

    return {
      success: true,
      data: updated,
      message: 'Listing submitted for Super Admin / Agent verification.',
    };
  }

  async getListerListings(userId: string) {
    const lister = await this.prisma.listerProfile.findUnique({
      where: { userId },
    });
    if (!lister) throw new BadRequestException('Lister profile not found');

    const listings = await this.prisma.vehicleListing.findMany({
      where: { listerId: lister.id },
      include: {
        category: true,
        manufacturer: true,
        model: true,
        images: true,
        bookings: { take: 5, orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, data: listings };
  }

  async createPublicListing(body: any) {
    let effectiveUserId = body.userId;
    let listerProfile = null;

    if (effectiveUserId) {
      listerProfile = await this.prisma.listerProfile.findUnique({
        where: { userId: effectiveUserId },
      });
    }

    const phone = body.listerPhone || '+923001234567';

    if (!listerProfile) {
      let user = await this.prisma.user.findFirst({
        where: { phone },
        include: { listerProfile: true },
      });

      if (!user) {
        const pkCountry = await this.prisma.country.findFirst({ where: { code: 'PK' } });
        user = await this.prisma.user.create({
          data: {
            phone,
            phoneCountryCode: '+92',
            userType: 'INDIVIDUAL_LISTER',
            accountStatus: 'APPROVED',
            countryId: pkCountry ? pkCountry.id : 'demo-country-pk',
          },
          include: { listerProfile: true },
        });
      }

      effectiveUserId = user.id;

      if (!user.listerProfile) {
        listerProfile = await this.prisma.listerProfile.create({
          data: {
            userId: user.id,
            firstName: body.listerName?.split(' ')[0] || 'Muhammad',
            lastName: body.listerName?.split(' ').slice(1).join(' ') || 'Partner',
            businessName: body.businessName || `${body.listerName || 'Partner'} Fleet`,
            taxNumber: body.businessTaxNumber || body.taxNumber || null,
            businessAddress: body.businessAddress || body.address || null,
            city: body.city || 'Lahore',
            listerType: body.listerProfileType === 'BUSINESS' ? 'BUSINESS_LISTER' : 'INDIVIDUAL_LISTER',
            identityVerified: true,
            verificationStatus: 'VERIFIED',
          },
        });
      } else {
        listerProfile = user.listerProfile;
      }
    }

    // Resolve category, manufacturer, model
    let category = await this.prisma.vehicleCategory.findFirst({
      where: { name: { contains: body.category || 'Car' } },
    });
    if (!category) category = await this.prisma.vehicleCategory.findFirst();

    let manufacturer = await this.prisma.vehicleManufacturer.findFirst({
      where: { name: { contains: body.manufacturer || 'Toyota' } },
    });
    if (!manufacturer) manufacturer = await this.prisma.vehicleManufacturer.findFirst();

    let model = await this.prisma.vehicleModel.findFirst({
      where: { name: { contains: body.model || 'Corolla' } },
    });
    if (!model) model = await this.prisma.vehicleModel.findFirst();

    const pkCountry = await this.prisma.country.findFirst({ where: { code: 'PK' } });
    const listingRef = `LST-${Date.now().toString().slice(-6)}`;

    // Build enriched additionalSpecs JSON for the new fields requested
    const additionalSpecs = JSON.stringify({
      googleMapsUrl: body.googleMapsUrl || null,
      websiteUrl: body.websiteUrl || null,
      serviceTags: body.serviceTags || ['With Driver', 'Self-Drive'],
      fleetSize: body.fleetSize || '3-5 Cars',
      aboutBusiness: body.aboutBusiness || null,
      ownerCnic: body.ownerCnic || body.cnicNumber || null,
      ownerNameOnCard: body.ownerNameOnCard || body.listerName || null,
      authorityType: body.authorityType || 'REGISTERED_OWNER',
      authorityDocumentUrl: body.authorityDocumentUrl || null,
      smartCardUrl: body.smartCardUrl || null,
      cnicFrontUrl: body.cnicFrontUrl || null,
      cnicBackUrl: body.cnicBackUrl || null,
      secondaryPhone: body.secondaryPhone || null,
      seats: Number(body.seats) || 5,
      hasAc: body.hasAc !== undefined ? !!body.hasAc : true,
      driverOption: body.driverOption || (body.driverMandatory ? 'WITH_DRIVER' : body.driverAvailable ? 'BOTH' : 'WITHOUT_DRIVER'),
    });

    const isDraft = body.isDraft || body.status === 'DRAFT';
    const driverMandatory = body.driverOption === 'WITH_DRIVER' ? true : (body.driverOption === 'WITHOUT_DRIVER' ? false : !!body.driverMandatory);
    const driverAvailable = body.driverOption === 'WITHOUT_DRIVER' ? false : (body.driverAvailable !== undefined ? !!body.driverAvailable : true);

    const listing = await this.prisma.vehicleListing.create({
      data: {
        listingRef,
        listerId: listerProfile.id,
        countryId: pkCountry ? pkCountry.id : 'demo-country-pk',
        categoryId: category ? category.id : 'cat-cars',
        manufacturerId: manufacturer ? manufacturer.id : 'mfg-toyota',
        modelId: model ? model.id : 'mdl-corolla',
        productionYear: Number(body.productionYear) || 2024,
        colour: body.colour || 'White',
        registrationNumber: body.registrationNumber || `LEB-${Math.floor(1000 + Math.random() * 9000)}`,
        engineNumber: body.engineNumber || `1NZ-${Math.floor(100000 + Math.random() * 900000)}`,
        chassisNumber: body.chassisNumber || `NZE-${Math.floor(1000000 + Math.random() * 9000000)}`,
        city: body.city || 'Lahore',
        area: body.area || 'DHA Phase 5',
        latitude: body.latitude ? Number(body.latitude) : 31.5204,
        longitude: body.longitude ? Number(body.longitude) : 74.3587,
        dailyRate: Number(body.dailyRate) || 8500,
        dailyRateWithDriver: body.dailyRateWithDriver ? Number(body.dailyRateWithDriver) : null,
        weeklyRate: body.weeklyRate ? Number(body.weeklyRate) : null,
        monthlyRate: body.monthlyRate ? Number(body.monthlyRate) : null,
        driverMandatory,
        driverAvailable,
        transmission: body.transmission || 'AUTOMATIC',
        fuelType: body.fuelType || 'PETROL',
        description: body.description || body.aboutBusiness || null,
        serviceType: body.serviceType || 'CAR_RENTAL',
        originCity: body.originCity || null,
        destinationCity: body.destinationCity || null,
        routeDetails: body.routeDetails || null,
        morningPickupTime: body.morningPickupTime || null,
        eveningDropTime: body.eveningDropTime || null,
        pricePerSeat: body.pricePerSeat ? Number(body.pricePerSeat) : null,
        availableSeats: body.seats ? Number(body.seats) : (body.availableSeats ? Number(body.availableSeats) : 5),
        monthlyRatePerSeat: body.monthlyRatePerSeat ? Number(body.monthlyRatePerSeat) : null,
        movingCapacityTons: body.movingCapacityTons ? Number(body.movingCapacityTons) : null,
        helpersAvailable: !!body.helpersAvailable,
        helperRate: body.helperRate ? Number(body.helperRate) : null,
        currencyCode: 'PKR',
        status: isDraft ? 'DRAFT' : 'LIVE',
        additionalSpecs,
      },
    });

    // Save images
    const rawImages = body.images || body.imageUrls || (body.imageUrl ? [body.imageUrl] : []);
    if (rawImages.length > 0) {
      for (let i = 0; i < rawImages.length; i++) {
        const url = typeof rawImages[i] === 'string' ? rawImages[i] : (rawImages[i].url || rawImages[i].originalUrl);
        if (url) {
          await this.prisma.listingImage.create({
            data: {
              listingId: listing.id,
              originalUrl: url,
              isPrimary: i === 0,
              displayOrder: i,
            },
          });
        }
      }
    } else {
      await this.prisma.listingImage.create({
        data: {
          listingId: listing.id,
          originalUrl: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1200&q=80',
          isPrimary: true,
          displayOrder: 0,
        },
      });
    }

    return {
      success: true,
      data: listing,
      listingRef,
      message: 'Vehicle listing registered and published successfully.',
    };
  }
}

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding SQLite database with complete initial marketplace data...');

  // 1. Platform Settings - Initial Pakistan Only Mode
  await prisma.platformSettings.upsert({
    where: { key: 'PLATFORM_OPERATION_MODE' },
    update: {},
    create: {
      key: 'PLATFORM_OPERATION_MODE',
      value: JSON.stringify({ mode: 'PAKISTAN_ONLY' }), // 'PAKISTAN_ONLY' or 'INTERNATIONAL'
      description: 'Platform country mode: PAKISTAN_ONLY or INTERNATIONAL',
    },
  });

  await prisma.platformSettings.upsert({
    where: { key: 'DRIVER_PORTAL_ENABLED' },
    update: {},
    create: {
      key: 'DRIVER_PORTAL_ENABLED',
      value: JSON.stringify({ enabled: true }),
      description: 'Global master toggle for Driver Portal and subscriptions',
    },
  });

  await prisma.platformSettings.upsert({
    where: { key: 'MAX_ACTIVE_COUNTRIES' },
    update: {},
    create: {
      key: 'MAX_ACTIVE_COUNTRIES',
      value: JSON.stringify({ limit: 10 }),
      description: 'Maximum number of simultaneously active countries',
    },
  });

  // 2. Launch Country: Pakistan (Default, Active, Locked)
  const pakistan = await prisma.country.upsert({
    where: { code: 'PK' },
    update: {},
    create: {
      code: 'PK',
      name: 'Pakistan',
      nativeName: 'پاکستان',
      phoneCode: '+92',
      currencyCode: 'PKR',
      currencySymbol: 'Rs',
      flagEmoji: '🇵🇰',
      status: 'ACTIVE',
      displayOrder: 1,
      isDefault: true,
      registrationConfig: JSON.stringify({
        customerIdentity: 'CNIC',
        individualListerIdentity: 'CNIC',
        businessListerIdentity: 'CNIC + NTN + Business Certificate',
        driverIdentity: 'CNIC + Driving Licence',
        vehicleDocuments: 'Registration Card / Book',
      }),
      identityRequirements: JSON.stringify({
        customer: { idType: 'CNIC', regex: '^[0-9]{5}-[0-9]{7}-[0-9]{1}$', mask: 'XXXXX-XXXXXXX-X' },
        lister: { idType: 'CNIC', regex: '^[0-9]{5}-[0-9]{7}-[0-9]{1}$', mask: 'XXXXX-XXXXXXX-X' },
        driver: { idType: 'CNIC', regex: '^[0-9]{5}-[0-9]{7}-[0-9]{1}$', mask: 'XXXXX-XXXXXXX-X' },
      }),
      businessRequirements: JSON.stringify({
        taxIdentifierLabel: 'NTN (National Tax Number)',
        requiresRegistrationCertificate: true,
        requiresRepresentativeAuth: true,
      }),
      vehicleRequirements: JSON.stringify({
        documents: ['REGISTRATION_CARD', 'REGISTRATION_BOOK', 'TOKEN_TAX'],
      }),
      driverRequirements: JSON.stringify({
        documents: ['DRIVING_LICENCE', 'CNIC'],
      }),
      activatedAt: new Date(),
    },
  });

  // Future Country in DRAFT mode: UAE
  await prisma.country.upsert({
    where: { code: 'AE' },
    update: {},
    create: {
      code: 'AE',
      name: 'United Arab Emirates',
      nativeName: 'الإمارات العربية المتحدة',
      phoneCode: '+971',
      currencyCode: 'AED',
      currencySymbol: 'AED',
      flagEmoji: '🇦🇪',
      status: 'DRAFT', // Pending Super Admin approval
      displayOrder: 2,
      isDefault: false,
      registrationConfig: JSON.stringify({
        customerIdentity: 'Emirates ID',
        individualListerIdentity: 'Emirates ID',
        businessListerIdentity: 'Trade Licence + TRN',
        driverIdentity: 'Emirates ID + RTA Licence',
        vehicleDocuments: 'Mulkiya (Registration Card)',
      }),
      identityRequirements: JSON.stringify({
        customer: { idType: 'Emirates ID', regex: '^784-[0-9]{4}-[0-9]{7}-[0-9]{1}$' },
      }),
    },
  });

  // Phone code mapping
  await prisma.phoneCountryCode.upsert({
    where: { phoneCode: '+92' },
    update: {},
    create: {
      phoneCode: '+92',
      countryId: pakistan.id,
      isPrimary: true,
    },
  });

  // 3. Document Requirements for Pakistan
  const docReqs = [
    { userType: 'CUSTOMER', docType: 'CNIC', label: 'CNIC (Front & Back)', mandatory: true, hasExpiry: true },
    { userType: 'INDIVIDUAL_LISTER', docType: 'CNIC', label: 'CNIC (Front & Back)', mandatory: true, hasExpiry: true },
    { userType: 'BUSINESS_LISTER', docType: 'CNIC', label: 'Owner / Authorized Rep CNIC', mandatory: true, hasExpiry: true },
    { userType: 'BUSINESS_LISTER', docType: 'NTN', label: 'NTN Certificate', mandatory: true, hasExpiry: false },
    { userType: 'BUSINESS_LISTER', docType: 'BUSINESS_REG', label: 'Company Registration / Incorporation', mandatory: true, hasExpiry: false },
    { userType: 'DRIVER', docType: 'CNIC', label: 'CNIC (Front & Back)', mandatory: true, hasExpiry: true },
    { userType: 'DRIVER', docType: 'DRIVING_LICENCE', label: 'Valid Driving Licence', mandatory: true, hasExpiry: true },
  ];

  for (const doc of docReqs) {
    const existing = await prisma.countryDocumentRequirement.findFirst({
      where: { countryId: pakistan.id, userType: doc.userType, documentType: doc.docType },
    });
    if (!existing) {
      await prisma.countryDocumentRequirement.create({
        data: {
          countryId: pakistan.id,
          userType: doc.userType,
          documentType: doc.docType,
          documentLabel: doc.label,
          isMandatory: doc.mandatory,
          hasExpiry: doc.hasExpiry,
        },
      });
    }
  }

  // 4. Subscription Plans for Pakistan (Listers & Drivers separate)
  const listerPlan1 = await prisma.subscriptionPlan.create({
    data: {
      countryId: pakistan.id,
      targetType: 'LISTER',
      name: 'Standard Individual Membership',
      description: 'Ideal for private car owners listing up to 3 personal vehicles',
      billingCycle: 'MONTHLY',
      price: 2500,
      currencyCode: 'PKR',
      maxListings: 3,
      maxFeaturedListings: 0,
      features: JSON.stringify(['Up to 3 active vehicle listings', 'Direct WhatsApp & Phone leads', 'Standard support']),
      displayOrder: 1,
    },
  });

  await prisma.subscriptionPlan.create({
    data: {
      countryId: pakistan.id,
      targetType: 'LISTER',
      name: 'Fleet Agency Pro',
      description: 'Built for Rent A Car agencies & commercial fleets',
      billingCycle: 'MONTHLY',
      price: 10000,
      currencyCode: 'PKR',
      maxListings: 25,
      maxFeaturedListings: 5,
      features: JSON.stringify(['Up to 25 vehicle listings', '5 Featured listing boosts', 'Priority customer leads', 'Dedicated agent support', 'Analytics dashboard']),
      displayOrder: 2,
    },
  });

  const driverPlan = await prisma.subscriptionPlan.create({
    data: {
      countryId: pakistan.id,
      targetType: 'DRIVER',
      name: 'Verified Driver Monthly Pass',
      description: 'Monthly certification and verified directory listing for professional drivers',
      billingCycle: 'MONTHLY',
      price: 1500,
      currencyCode: 'PKR',
      maxListings: null,
      maxFeaturedListings: 0,
      features: JSON.stringify(['Verified Driver badge on profile', 'Included in rental vehicle with-driver bookings', 'Direct WhatsApp client contacts']),
      displayOrder: 1,
    },
  });

  // 5. Configured Payment Methods (Meezan Bank + Easypaisa/QR)
  const bankPayment = await prisma.paymentMethod.create({
    data: {
      countryId: pakistan.id,
      methodType: 'BANK_TRANSFER',
      name: 'Direct Bank Transfer (Meezan Bank)',
      currencyCode: 'PKR',
      bankName: 'Meezan Bank Limited',
      accountHolderName: 'Global Vehicle Rental Marketplace Pvt Ltd',
      accountNumber: '0102030405060708',
      iban: 'PK12MEZN0001020304050607',
      branchInfo: 'Gulberg III Main Branch, Lahore',
      paymentInstructions: 'Transfer the exact subscription amount to the account details above via your mobile banking app or ATM. Upload clear screenshot of the receipt and input your Transaction ID.',
      requireTransactionRef: true,
      requirePaymentProof: true,
      maxFileSizeMb: 5,
      isActive: true,
      displayOrder: 1,
    },
  });

  await prisma.paymentMethod.create({
    data: {
      countryId: pakistan.id,
      methodType: 'QR_PAYMENT',
      name: 'Raast / Instant QR Payment',
      currencyCode: 'PKR',
      bankName: 'Raast Instant Payment',
      accountHolderName: 'Marketplace Subscriptions Raast ID',
      accountNumber: '03001234567',
      paymentInstructions: 'Scan the Raast QR code using any 1Link / Raast supported bank application. Submit payment confirmation screenshot.',
      qrImageUrl: '/images/demo-raast-qr.png',
      requireTransactionRef: true,
      requirePaymentProof: true,
      isActive: true,
      displayOrder: 2,
    },
  });

  // 6. Seed Vehicle Categories
  const categoriesData = [
    { name: 'Cars', slug: 'cars', displayOrder: 1, iconUrl: '🚗' },
    { name: 'Motorcycles', slug: 'motorcycles', displayOrder: 2, iconUrl: '🏍️' },
    { name: 'Scooters', slug: 'scooters', displayOrder: 3, iconUrl: '🛵' },
    { name: 'Vans & Hiace', slug: 'vans', displayOrder: 4, iconUrl: '🚐' },
    { name: 'Buses & Coasters', slug: 'buses', displayOrder: 5, iconUrl: '🚌' },
    { name: 'Pickup Trucks (4x4)', slug: 'pickup-trucks', displayOrder: 6, iconUrl: '🛻' },
    { name: 'Commercial Trucks', slug: 'commercial-trucks', displayOrder: 7, iconUrl: '🚚' },
    { name: 'Heavy Trucks & Trailers', slug: 'heavy-trucks', displayOrder: 8, iconUrl: '🚛' },
    { name: 'Construction Machinery', slug: 'construction-vehicles', displayOrder: 9, iconUrl: '🚜' },
    { name: 'Special-Purpose & Ambulances', slug: 'special-purpose', displayOrder: 10, iconUrl: '🚑' },
  ];

  for (const c of categoriesData) {
    await prisma.vehicleCategory.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    });
  }

  // 7. Seed Sample Manufacturers & Models
  const carsCat = await prisma.vehicleCategory.findUnique({ where: { slug: 'cars' } });
  if (carsCat) {
    const toyota = await prisma.vehicleManufacturer.create({
      data: { name: 'Toyota', slug: 'toyota', categoryId: carsCat.id, displayOrder: 1 },
    });
    const honda = await prisma.vehicleManufacturer.create({
      data: { name: 'Honda', slug: 'honda', categoryId: carsCat.id, displayOrder: 2 },
    });
    const suzuki = await prisma.vehicleManufacturer.create({
      data: { name: 'Suzuki', slug: 'suzuki', categoryId: carsCat.id, displayOrder: 3 },
    });

    const corolla = await prisma.vehicleModel.create({
      data: { name: 'Corolla Altis Grande', slug: 'corolla-altis-grande', manufacturerId: toyota.id },
    });
    const yaris = await prisma.vehicleModel.create({
      data: { name: 'Yaris ATIV X', slug: 'yaris-ativ-x', manufacturerId: toyota.id },
    });
    const civic = await prisma.vehicleModel.create({
      data: { name: 'Civic Oriel Turbo', slug: 'civic-oriel-turbo', manufacturerId: honda.id },
    });
    const alto = await prisma.vehicleModel.create({
      data: { name: 'Alto VXL', slug: 'alto-vxl', manufacturerId: suzuki.id },
    });

    // 8. Demo Lister Account with Approved Subscription & Vehicles
    const demoListerUser = await prisma.user.create({
      data: {
        phone: '+923001234567',
        phoneCountryCode: '+92',
        email: 'lister@marketplace.com',
        userType: 'INDIVIDUAL_LISTER',
        accountStatus: 'APPROVED',
        phoneVerified: true,
        emailVerified: true,
        countryId: pakistan.id,
      },
    });

    const listerProfile = await prisma.listerProfile.create({
      data: {
        userId: demoListerUser.id,
        listerType: 'INDIVIDUAL_LISTER',
        firstName: 'Kamran',
        lastName: 'Ahmed',
        displayName: 'Kamran Luxury Car Rentals',
        address: 'Main Boulevard, Gulberg III',
        city: 'Lahore',
        state: 'Punjab',
        identityVerified: true,
        verificationStatus: 'VERIFIED',
        totalListings: 2,
        activeListings: 2,
        ratingAverage: 4.9,
        ratingCount: 38,
      },
    });

    // Active subscription for demo lister
    await prisma.subscription.create({
      data: {
        userId: demoListerUser.id,
        planId: listerPlan1.id,
        countryId: pakistan.id,
        status: 'ACTIVE',
        startsAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    // Vehicle 1: Toyota Corolla Altis
    const listing1 = await prisma.vehicleListing.create({
      data: {
        listingRef: 'LST-PK-001',
        listerId: listerProfile.id,
        countryId: pakistan.id,
        categoryId: carsCat.id,
        manufacturerId: toyota.id,
        modelId: corolla.id,
        productionYear: 2024,
        colour: 'Super White',
        registrationNumber: 'LEA-24-9988',
        transmission: 'AUTOMATIC',
        fuelType: 'PETROL',
        city: 'Lahore',
        area: 'Gulberg / DHA',
        isInsured: true,
        driverAvailable: true,
        driverMandatory: false,
        dailyRate: 7500,
        dailyRateWithDriver: 9500,
        driverDailyCharge: 2000,
        currencyCode: 'PKR',
        status: 'LIVE',
        description: 'Brand new 2024 Toyota Corolla Altis Grande. Fully insured, mint condition with clean interior. Available for self-drive or with professional driver in Lahore & outstations.',
        rentalConditions: 'Original CNIC & Security Deposit required for self-drive. Fuel not included. 200 km/day limit.',
      },
    });

    await prisma.listingImage.create({
      data: {
        listingId: listing1.id,
        originalUrl: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1200&q=80',
        displayOrder: 1,
        isPrimary: true,
        altText: 'Toyota Corolla Altis Grande White',
      },
    });

    // Vehicle 2: Honda Civic Oriel
    const listing2 = await prisma.vehicleListing.create({
      data: {
        listingRef: 'LST-PK-002',
        listerId: listerProfile.id,
        countryId: pakistan.id,
        categoryId: carsCat.id,
        manufacturerId: honda.id,
        modelId: civic.id,
        productionYear: 2023,
        colour: 'Crystal Black Pearl',
        registrationNumber: 'ICT-23-4512',
        transmission: 'AUTOMATIC',
        fuelType: 'PETROL',
        city: 'Islamabad',
        area: 'F-7 / Blue Area',
        isInsured: true,
        driverAvailable: true,
        driverMandatory: true,
        dailyRate: 14000,
        dailyRateWithDriver: 16000,
        driverDailyCharge: 2000,
        currencyCode: 'PKR',
        status: 'LIVE',
        description: 'Executive VIP Honda Civic Oriel Turbo. Available strictly with trained, licensed professional chauffeur for business delegations, weddings & VIP transport.',
        rentalConditions: 'Strictly with chauffeur. AC included. Overtime Rs. 300/hour.',
      },
    });

    await prisma.listingImage.create({
      data: {
        listingId: listing2.id,
        originalUrl: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=1200&q=80',
        displayOrder: 1,
        isPrimary: true,
        altText: 'Honda Civic Black VIP',
      },
    });

    // 9. Demo Driver Account
    const demoDriverUser = await prisma.user.create({
      data: {
        phone: '+923119876543',
        phoneCountryCode: '+92',
        email: 'driver@marketplace.com',
        userType: 'DRIVER',
        accountStatus: 'APPROVED',
        phoneVerified: true,
        countryId: pakistan.id,
      },
    });

    await prisma.driverProfile.create({
      data: {
        userId: demoDriverUser.id,
        firstName: 'Tariq',
        lastName: 'Mahmood',
        displayName: 'Tariq Mahmood (Executive Driver)',
        licenceNumber: 'LHR-DL-982110',
        licenceClass: 'LTV / HTV Commercial',
        city: 'Lahore',
        identityVerified: true,
        licenceVerified: true,
        ratingAverage: 4.95,
        ratingCount: 52,
        totalTrips: 180,
        availabilityStatus: 'AVAILABLE',
        verificationStatus: 'VERIFIED',
      },
    });

    // Driver Active Subscription
    await prisma.subscription.create({
      data: {
        userId: demoDriverUser.id,
        planId: driverPlan.id,
        countryId: pakistan.id,
        status: 'ACTIVE',
        startsAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    // 10. Demo Super Admin User
    await prisma.user.create({
      data: {
        phone: '+923000000001',
        phoneCountryCode: '+92',
        email: 'superadmin@marketplace.com',
        userType: 'SUPER_ADMIN',
        accountStatus: 'APPROVED',
        phoneVerified: true,
        emailVerified: true,
        countryId: pakistan.id,
      },
    });
  }

  console.log('Seeding finished successfully! SQLite dev.db is fully populated.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


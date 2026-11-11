import { PrismaClient, CountryStatus, UserType, BillingCycle, TargetType, PaymentMethodType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial marketplace data...');

  // 1. Platform Settings - Default to PAKISTAN_ONLY mode
  const platformMode = await prisma.platformSettings.upsert({
    where: { key: 'PLATFORM_OPERATION_MODE' },
    update: {},
    create: {
      key: 'PLATFORM_OPERATION_MODE',
      value: { mode: 'PAKISTAN_ONLY' }, // 'PAKISTAN_ONLY' or 'INTERNATIONAL'
      description: 'Platform country operation mode: PAKISTAN_ONLY or INTERNATIONAL',
    },
  });

  const driverFeature = await prisma.platformSettings.upsert({
    where: { key: 'DRIVER_PORTAL_ENABLED' },
    update: {},
    create: {
      key: 'DRIVER_PORTAL_ENABLED',
      value: { enabled: true },
      description: 'Global master toggle for Driver Portal and subscriptions',
    },
  });

  const maxCountries = await prisma.platformSettings.upsert({
    where: { key: 'MAX_ACTIVE_COUNTRIES' },
    update: {},
    create: {
      key: 'MAX_ACTIVE_COUNTRIES',
      value: { limit: 10 },
      description: 'Maximum number of simultaneously active countries',
    },
  });

  console.log('Platform settings seeded:', { platformMode: platformMode.key, driverFeature: driverFeature.key, maxCountries: maxCountries.key });

  // 2. Initial Launch Country: Pakistan (Active, Default, Locked)
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
      status: CountryStatus.ACTIVE,
      displayOrder: 1,
      isDefault: true,
      registrationConfig: {
        customerIdentity: 'CNIC',
        individualListerIdentity: 'CNIC',
        businessListerIdentity: 'CNIC + NTN + Business Certificate',
        driverIdentity: 'CNIC + Driving Licence',
        vehicleDocuments: 'Registration Card / Book',
      },
      identityRequirements: {
        customer: { idType: 'CNIC', regex: '^[0-9]{5}-[0-9]{7}-[0-9]{1}$', mask: 'XXXXX-XXXXXXX-X' },
        lister: { idType: 'CNIC', regex: '^[0-9]{5}-[0-9]{7}-[0-9]{1}$', mask: 'XXXXX-XXXXXXX-X' },
        driver: { idType: 'CNIC', regex: '^[0-9]{5}-[0-9]{7}-[0-9]{1}$', mask: 'XXXXX-XXXXXXX-X' },
      },
      businessRequirements: {
        taxIdentifierLabel: 'NTN (National Tax Number)',
        requiresRegistrationCertificate: true,
        requiresRepresentativeAuth: true,
      },
      vehicleRequirements: {
        documents: ['REGISTRATION_CARD', 'REGISTRATION_BOOK', 'TOKEN_TAX'],
      },
      driverRequirements: {
        documents: ['DRIVING_LICENCE', 'CNIC'],
      },
      activatedAt: new Date(),
    },
  });

  // Phone prefix mapping
  await prisma.phoneCountryCode.upsert({
    where: { phoneCode: '+92' },
    update: {},
    create: {
      phoneCode: '+92',
      countryId: pakistan.id,
      isPrimary: true,
    },
  });

  console.log('Pakistan seeded as default active country:', pakistan.name);

  // 3. Document Requirements for Pakistan
  const docReqs = [
    { userType: UserType.CUSTOMER, docType: 'CNIC', label: 'CNIC (Front & Back)', mandatory: true, hasExpiry: true },
    { userType: UserType.INDIVIDUAL_LISTER, docType: 'CNIC', label: 'CNIC (Front & Back)', mandatory: true, hasExpiry: true },
    { userType: UserType.BUSINESS_LISTER, docType: 'CNIC', label: 'Owner / Rep CNIC', mandatory: true, hasExpiry: true },
    { userType: UserType.BUSINESS_LISTER, docType: 'NTN', label: 'NTN Certificate', mandatory: true, hasExpiry: false },
    { userType: UserType.BUSINESS_LISTER, docType: 'BUSINESS_REG', label: 'Company Registration / Incorporation', mandatory: true, hasExpiry: false },
    { userType: UserType.DRIVER, docType: 'CNIC', label: 'CNIC (Front & Back)', mandatory: true, hasExpiry: true },
    { userType: UserType.DRIVER, docType: 'DRIVING_LICENCE', label: 'Valid Driving Licence', mandatory: true, hasExpiry: true },
  ];

  for (const doc of docReqs) {
    await prisma.countryDocumentRequirement.upsert({
      where: {
        countryId_userType_documentType: {
          countryId: pakistan.id,
          userType: doc.userType,
          documentType: doc.docType,
        },
      },
      update: {},
      create: {
        countryId: pakistan.id,
        userType: doc.userType,
        documentType: doc.docType,
        documentLabel: doc.label,
        isMandatory: doc.mandatory,
        hasExpiry: doc.hasExpiry,
      },
    });
  }

  // 4. Subscription Plans for Pakistan (Listers & Drivers separate)
  const plans = [
    {
      countryId: pakistan.id,
      targetType: TargetType.LISTER,
      name: 'Standard Lister Plan',
      description: 'Starter plan for individual vehicle owners',
      billingCycle: BillingCycle.MONTHLY,
      price: 2500.00,
      currencyCode: 'PKR',
      maxListings: 3,
      maxFeaturedListings: 0,
      features: { prioritySupport: false, whatsappLeads: true, callLeads: true },
    },
    {
      countryId: pakistan.id,
      targetType: TargetType.LISTER,
      name: 'Business Pro Fleet',
      description: 'Professional tier for rental agencies and fleet owners',
      billingCycle: BillingCycle.MONTHLY,
      price: 10000.00,
      currencyCode: 'PKR',
      maxListings: 25,
      maxFeaturedListings: 5,
      features: { prioritySupport: true, whatsappLeads: true, callLeads: true, analytics: true },
    },
    {
      countryId: pakistan.id,
      targetType: TargetType.DRIVER,
      name: 'Verified Driver Membership',
      description: 'Monthly access pass for certified freelance/rental drivers',
      billingCycle: BillingCycle.MONTHLY,
      price: 1500.00,
      currencyCode: 'PKR',
      maxListings: null,
      maxFeaturedListings: 0,
      features: { profileVerificationBadge: true, directCustomerConnect: true },
    },
  ];

  for (const p of plans) {
    const existing = await prisma.subscriptionPlan.findFirst({
      where: { countryId: p.countryId, name: p.name },
    });
    if (!existing) {
      await prisma.subscriptionPlan.create({ data: p });
    }
  }

  // 5. Initial Payment Method for Pakistan (Manual Bank Transfer & QR)
  const existingPayMethod = await prisma.paymentMethod.findFirst({
    where: { countryId: pakistan.id, name: 'Direct Bank Transfer' },
  });

  if (!existingPayMethod) {
    await prisma.paymentMethod.create({
      data: {
        countryId: pakistan.id,
        methodType: PaymentMethodType.BANK_TRANSFER,
        name: 'Direct Bank Transfer',
        currencyCode: 'PKR',
        bankName: 'Meezan Bank Limited',
        accountHolderName: 'Vehicle Rental Marketplace Pvt Ltd',
        accountNumber: '01020304050607',
        iban: 'PK12MEZN0001020304050607',
        branchInfo: 'Gulberg Branch, Lahore',
        paymentInstructions: 'Please transfer subscription fee to the bank details above. Upload screenshot receipt and enter reference transaction ID.',
        requireTransactionRef: true,
        requirePaymentProof: true,
        isActive: true,
        displayOrder: 1,
      },
    });
  }

  // 6. Base Vehicle Categories
  const categories = [
    { name: 'Cars', slug: 'cars', displayOrder: 1 },
    { name: 'Motorcycles', slug: 'motorcycles', displayOrder: 2 },
    { name: 'Scooters', slug: 'scooters', displayOrder: 3 },
    { name: 'Vans', slug: 'vans', displayOrder: 4 },
    { name: 'Buses', slug: 'buses', displayOrder: 5 },
    { name: 'Pickup Trucks', slug: 'pickup-trucks', displayOrder: 6 },
    { name: 'Commercial Trucks', slug: 'commercial-trucks', displayOrder: 7 },
    { name: 'Heavy Trucks', slug: 'heavy-trucks', displayOrder: 8 },
    { name: 'Trailers', slug: 'trailers', displayOrder: 9 },
    { name: 'Construction Vehicles', slug: 'construction-vehicles', displayOrder: 10 },
    { name: 'Agricultural Vehicles', slug: 'agricultural-vehicles', displayOrder: 11 },
    { name: 'Special-Purpose Vehicles', slug: 'special-purpose-vehicles', displayOrder: 12 },
  ];

  for (const cat of categories) {
    await prisma.vehicleCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  // 7. Seed Sample Manufacturers & Models for Cars
  const carsCategory = await prisma.vehicleCategory.findUnique({ where: { slug: 'cars' } });
  if (carsCategory) {
    const toyota = await prisma.vehicleManufacturer.upsert({
      where: { name_categoryId: { name: 'Toyota', categoryId: carsCategory.id } },
      update: {},
      create: { name: 'Toyota', slug: 'toyota', categoryId: carsCategory.id },
    });

    const honda = await prisma.vehicleManufacturer.upsert({
      where: { name_categoryId: { name: 'Honda', categoryId: carsCategory.id } },
      update: {},
      create: { name: 'Honda', slug: 'honda', categoryId: carsCategory.id },
    });

    const suzuki = await prisma.vehicleManufacturer.upsert({
      where: { name_categoryId: { name: 'Suzuki', categoryId: carsCategory.id } },
      update: {},
      create: { name: 'Suzuki', slug: 'suzuki', categoryId: carsCategory.id },
    });

    // Models
    await prisma.vehicleModel.upsert({
      where: { manufacturerId_name: { manufacturerId: toyota.id, name: 'Corolla' } },
      update: {},
      create: { name: 'Corolla', slug: 'corolla', manufacturerId: toyota.id },
    });
    await prisma.vehicleModel.upsert({
      where: { manufacturerId_name: { manufacturerId: honda.id, name: 'Civic' } },
      update: {},
      create: { name: 'Civic', slug: 'civic', manufacturerId: honda.id },
    });
    await prisma.vehicleModel.upsert({
      where: { manufacturerId_name: { manufacturerId: suzuki.id, name: 'Alto' } },
      update: {},
      create: { name: 'Alto', slug: 'alto', manufacturerId: suzuki.id },
    });
  }

  // 8. Core System Roles
  const roles = [
    { name: 'SUPER_ADMIN', displayName: 'Super Administrator', description: 'Full access to the entire platform' },
    { name: 'AGENT', displayName: 'Customer & Lister Support Agent', description: 'Assigned permissions for approvals and verification' },
    { name: 'INDIVIDUAL_LISTER', displayName: 'Individual Lister', description: 'Private vehicle owner' },
    { name: 'BUSINESS_LISTER', displayName: 'Business / Fleet Lister', description: 'Commercial rental agency or fleet operator' },
    { name: 'DRIVER', displayName: 'Professional Driver', description: 'Subscription-based freelance or fleet driver' },
    { name: 'CUSTOMER', displayName: 'Rental Customer', description: 'End-user vehicle renter' },
  ];

  for (const r of roles) {
    await prisma.role.upsert({
      where: { name: r.name },
      update: {},
      create: r,
    });
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding multi-service marketplace modules...');

  // 1. Feature Master Toggles in PlatformSettings
  const featureSettings = [
    { key: 'FEATURE_CAR_RENTALS_ENABLED', value: JSON.stringify({ enabled: true }), description: 'Master toggle for Standard Car Rentals' },
    { key: 'FEATURE_PICK_AND_DROP_ENABLED', value: JSON.stringify({ enabled: true }), description: 'Master toggle for Daily & Monthly Pick & Drop Service' },
    { key: 'FEATURE_CITY_TO_CITY_ENABLED', value: JSON.stringify({ enabled: true }), description: 'Master toggle for Intercity City-to-City Sharing & Private Rides' },
    { key: 'FEATURE_GOODS_TRANSPORT_ENABLED', value: JSON.stringify({ enabled: true }), description: 'Master toggle for Home Shifting & Cargo Transport' },
  ];

  for (const s of featureSettings) {
    await prisma.platformSettings.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }

  // 2. Fetch PK Country
  const pk = await prisma.country.findUnique({ where: { code: 'PK' } });
  if (!pk) {
    console.error('Pakistan country record not found. Run base seed first.');
    return;
  }

  // 3. Ensure Categories Exist
  const vansCategory = await prisma.vehicleCategory.upsert({
    where: { slug: 'vans' },
    update: {},
    create: {
      name: 'Vans & Commuter',
      slug: 'vans',
      description: 'HiAce, Bolan, Coasters for daily commuting and group travel',
    },
  });

  const trucksCategory = await prisma.vehicleCategory.upsert({
    where: { slug: 'trucks' },
    update: {},
    create: {
      name: 'Cargo & Shifting Trucks',
      slug: 'trucks',
      description: 'Shahzore, Suzuki Ravi, Mazda Titan for Home Shifting and Freight',
    },
  });

  const carsCategory = await prisma.vehicleCategory.upsert({
    where: { slug: 'cars' },
    update: {},
    create: {
      name: 'Cars & Sedans',
      slug: 'cars',
      description: 'Sedans, hatchbacks, and private cars',
    },
  });

  // Ensure Manufacturers
  const hyundai = await prisma.vehicleManufacturer.upsert({
    where: { id: 'mfg-hyundai' },
    update: {},
    create: {
      id: 'mfg-hyundai',
      name: 'Hyundai',
      slug: 'hyundai',
      categoryId: trucksCategory.id,
    },
  });

  const toyota = await prisma.vehicleManufacturer.upsert({
    where: { id: 'mfg-toyota-van' },
    update: {},
    create: {
      id: 'mfg-toyota-van',
      name: 'Toyota Commercial',
      slug: 'toyota-commercial',
      categoryId: vansCategory.id,
    },
  });

  const suzuki = await prisma.vehicleManufacturer.upsert({
    where: { id: 'mfg-suzuki-commercial' },
    update: {},
    create: {
      id: 'mfg-suzuki-commercial',
      name: 'Suzuki Commercial',
      slug: 'suzuki-commercial',
      categoryId: trucksCategory.id,
    },
  });

  // Models
  const shahzoreModel = await prisma.vehicleModel.upsert({
    where: { id: 'mdl-shahzore' },
    update: {},
    create: {
      id: 'mdl-shahzore',
      name: 'Sheore D-100',
      slug: 'shehzore',
      manufacturerId: hyundai.id,
    },
  });

  const hiaceModel = await prisma.vehicleModel.upsert({
    where: { id: 'mdl-hiace' },
    update: {},
    create: {
      id: 'mdl-hiace',
      name: 'HiAce Grand Cabin',
      slug: 'hiace-grand-cabin',
      manufacturerId: toyota.id,
    },
  });

  const raviModel = await prisma.vehicleModel.upsert({
    where: { id: 'mdl-ravi' },
    update: {},
    create: {
      id: 'mdl-ravi',
      name: 'Ravi Euro II Pickup',
      slug: 'ravi-pickup',
      manufacturerId: suzuki.id,
    },
  });

  // Existing Lister Profile
  let lister = await prisma.listerProfile.findFirst();
  if (!lister) {
    const user = await prisma.user.create({
      data: {
        phone: '+923009988776',
        phoneCountryCode: '+92',
        accountStatus: 'APPROVED',
        countryId: pk.id,
        userType: 'INDIVIDUAL_LISTER',
      },
    });
    lister = await prisma.listerProfile.create({
      data: {
        userId: user.id,
        firstName: 'Malik',
        lastName: 'Zahid',
        city: 'Lahore',
        verificationStatus: 'VERIFIED',
      },
    });
  }

  // 4. Seed Pick & Drop Listings
  await prisma.vehicleListing.upsert({
    where: { listingRef: 'PND-2026-001' },
    update: {},
    create: {
      listingRef: 'PND-2026-001',
      listerId: lister.id,
      countryId: pk.id,
      categoryId: vansCategory.id,
      manufacturerId: toyota.id,
      modelId: hiaceModel.id,
      serviceType: 'PICK_AND_DROP',
      productionYear: 2023,
      colour: 'Pearl White',
      registrationNumber: 'LEA-23-4411',
      city: 'Lahore',
      area: 'Johar Town to Gulberg / Mall Road',
      dailyRate: 650,
      monthlyRate: 11000,
      monthlyRatePerSeat: 11000,
      pricePerSeat: 650,
      availableSeats: 14,
      morningPickupTime: '07:30 AM',
      eveningDropTime: '05:30 PM',
      routeDetails: 'Johar Town G-Block → Shaukat Khanum → Canal Road → FC College → Gulberg Main Boulevard',
      currencyCode: 'PKR',
      status: 'LIVE',
      description: 'Executive Daily & Monthly Pick and Drop for Office Staff & University Students. Dual AC, High-Roof comfortable push-back seats, verified professional driver.',
      images: {
        create: [
          {
            originalUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80',
            isPrimary: true,
            displayOrder: 0,
          },
          {
            originalUrl: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=1200&q=80',
            isPrimary: false,
            displayOrder: 1,
          },
        ],
      },
    },
  });

  await prisma.vehicleListing.upsert({
    where: { listingRef: 'PND-2026-002' },
    update: {},
    create: {
      listingRef: 'PND-2026-002',
      listerId: lister.id,
      countryId: pk.id,
      categoryId: vansCategory.id,
      manufacturerId: toyota.id,
      modelId: hiaceModel.id,
      serviceType: 'PICK_AND_DROP',
      productionYear: 2022,
      colour: 'Silver Metallic',
      registrationNumber: 'RI-22-9011',
      city: 'Islamabad',
      area: 'Rawalpindi Saddar to Blue Area Islamabad',
      dailyRate: 500,
      monthlyRate: 9500,
      monthlyRatePerSeat: 9500,
      pricePerSeat: 500,
      availableSeats: 10,
      morningPickupTime: '08:00 AM',
      eveningDropTime: '05:00 PM',
      routeDetails: 'Rawalpindi Saddar → Murree Road → Faizabad → Zero Point → Blue Area → Pak Secretariat',
      currencyCode: 'PKR',
      status: 'LIVE',
      description: 'Reliable office staff pickup service. Female seats reserved in front cabin. Clean interior, punctuality guaranteed.',
      images: {
        create: [
          {
            originalUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80',
            isPrimary: true,
            displayOrder: 0,
          },
        ],
      },
    },
  });

  // 5. Seed City to City Listings
  await prisma.vehicleListing.upsert({
    where: { listingRef: 'CTC-2026-001' },
    update: {},
    create: {
      listingRef: 'CTC-2026-001',
      listerId: lister.id,
      countryId: pk.id,
      categoryId: carsCategory.id,
      manufacturerId: toyota.id,
      modelId: hiaceModel.id,
      serviceType: 'CITY_TO_CITY',
      productionYear: 2024,
      colour: 'Phantom Black',
      registrationNumber: 'LEA-24-7711',
      city: 'Lahore',
      originCity: 'Lahore',
      destinationCity: 'Islamabad',
      routeDetails: 'Via M-2 Motorway (Bhera Rest Stop 15 mins). Departure: Thokar Niaz Baig Lahore → Faizabad / Centaurus Islamabad',
      pricePerSeat: 2800,
      availableSeats: 4,
      dailyRate: 14000, // Full car private booking
      currencyCode: 'PKR',
      morningPickupTime: '09:00 AM Daily',
      status: 'LIVE',
      description: 'Daily Executive Intercity Ride. Choose between single seat sharing (PKR 2,800/seat) or entire private car with driver (PKR 14,000). Chilled AC, Motorway toll included.',
      images: {
        create: [
          {
            originalUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80',
            isPrimary: true,
            displayOrder: 0,
          },
          {
            originalUrl: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1200&q=80',
            isPrimary: false,
            displayOrder: 1,
          },
        ],
      },
    },
  });

  await prisma.vehicleListing.upsert({
    where: { listingRef: 'CTC-2026-002' },
    update: {},
    create: {
      listingRef: 'CTC-2026-002',
      listerId: lister.id,
      countryId: pk.id,
      categoryId: carsCategory.id,
      manufacturerId: toyota.id,
      modelId: hiaceModel.id,
      serviceType: 'CITY_TO_CITY',
      productionYear: 2023,
      colour: 'White',
      registrationNumber: 'ISB-23-3399',
      city: 'Islamabad',
      originCity: 'Islamabad',
      destinationCity: 'Peshawar',
      routeDetails: 'Via M-1 Motorway. Departure: I-8 Islamabad → Ring Road / Karkhano Market Peshawar',
      pricePerSeat: 1800,
      availableSeats: 4,
      dailyRate: 9500, // Full car private booking
      currencyCode: 'PKR',
      morningPickupTime: '03:00 PM Daily',
      status: 'LIVE',
      description: 'Afternoon Islamabad to Peshawar Ride. Smooth Motorway cruise, luggage space for 1 suitcase per passenger.',
      images: {
        create: [
          {
            originalUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
            isPrimary: true,
            displayOrder: 0,
          },
        ],
      },
    },
  });

  // 6. Seed Home Shifting & Cargo Listings
  await prisma.vehicleListing.upsert({
    where: { listingRef: 'SHF-2026-001' },
    update: {},
    create: {
      listingRef: 'SHF-2026-001',
      listerId: lister.id,
      countryId: pk.id,
      categoryId: trucksCategory.id,
      manufacturerId: hyundai.id,
      modelId: shahzoreModel.id,
      serviceType: 'GOODS_TRANSPORT',
      productionYear: 2023,
      colour: 'White',
      registrationNumber: 'LHR-SH-9922',
      city: 'Lahore',
      area: 'All Lahore & Punjab Intercity Moving',
      dailyRate: 4500, // Base trip charge
      movingCapacityTons: 2.5,
      helpersAvailable: true,
      helperRate: 1500, // Per helper for loading/unloading
      currencyCode: 'PKR',
      status: 'LIVE',
      description: 'Hyundai Shehzore for 1-BHK / 2-BHK Complete Home Shifting & Commercial Goods Transport. Professional packing ropes and tarpaulin covers. 2 strong helpers available on request.',
      images: {
        create: [
          {
            originalUrl: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1200&q=80',
            isPrimary: true,
            displayOrder: 0,
          },
          {
            originalUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80',
            isPrimary: false,
            displayOrder: 1,
          },
        ],
      },
    },
  });

  await prisma.vehicleListing.upsert({
    where: { listingRef: 'SHF-2026-002' },
    update: {},
    create: {
      listingRef: 'SHF-2026-002',
      listerId: lister.id,
      countryId: pk.id,
      categoryId: trucksCategory.id,
      manufacturerId: suzuki.id,
      modelId: raviModel.id,
      serviceType: 'GOODS_TRANSPORT',
      productionYear: 2022,
      colour: 'White',
      registrationNumber: 'KHI-RV-4100',
      city: 'Karachi',
      area: 'Gulshan, Clifton, DHA, Nazimabad Karachi',
      dailyRate: 2800, // Mini shifting
      movingCapacityTons: 1.0,
      helpersAvailable: true,
      helperRate: 1200,
      currencyCode: 'PKR',
      status: 'LIVE',
      description: 'Suzuki Ravi Mini Pickup for single room moving, sofa set, refrigerator, washing machine, and carton transfer across Karachi city. Affordable & fast dispatch.',
      images: {
        create: [
          {
            originalUrl: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=1200&q=80',
            isPrimary: true,
            displayOrder: 0,
          },
        ],
      },
    },
  });

  console.log('✅ Multi-service modules successfully seeded with live realistic data!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


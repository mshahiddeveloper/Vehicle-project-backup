const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== DATABASE AUDIT REPORT ===');
  const counts = {
    platformSettings: await prisma.platformSettings.count(),
    countries: await prisma.country.count(),
    documentRequirements: await prisma.countryDocumentRequirement.count(),
    users: await prisma.user.count(),
    customerProfiles: await prisma.customerProfile.count(),
    listerProfiles: await prisma.listerProfile.count(),
    driverProfiles: await prisma.driverProfile.count(),
    agentProfiles: await prisma.agentProfile.count(),
    subscriptionPlans: await prisma.subscriptionPlan.count(),
    subscriptions: await prisma.subscription.count(),
    paymentMethods: await prisma.paymentMethod.count(),
    paymentRecords: await prisma.paymentRecord.count(),
    paymentProofs: await prisma.paymentProof.count(),
    vehicleCategories: await prisma.vehicleCategory.count(),
    vehicleManufacturers: await prisma.vehicleManufacturer.count(),
    vehicleModels: await prisma.vehicleModel.count(),
    vehicleListings: await prisma.vehicleListing.count(),
    listingImages: await prisma.listingImage.count(),
    bookings: await prisma.booking.count(),
    leads: await prisma.lead.count(),
    documentUploads: await prisma.documentUpload.count(),
    reviews: await prisma.review.count(),
    complaints: await prisma.complaint.count(),
    auditLogs: await prisma.auditLog.count(),
    savedVehicles: await prisma.savedVehicle.count()
  };
  console.table(counts);

  console.log('\n--- Sample Listings by Service Type ---');
  const listings = await prisma.vehicleListing.findMany({
    select: {
      id: true,
      listingRef: true,
      serviceType: true,
      status: true,
      dailyRate: true,
      monthlyRatePerSeat: true,
      pricePerSeat: true,
      city: true,
      originCity: true,
      destinationCity: true,
      manufacturer: { select: { name: true } },
      model: { select: { name: true } }
    }
  });
  console.table(listings.map(l => ({
    ref: l.listingRef,
    service: l.serviceType,
    vehicle: `${l.manufacturer?.name} ${l.model?.name}`,
    status: l.status,
    city: l.city || `${l.originCity} -> ${l.destinationCity}`,
    rate: l.dailyRate || l.monthlyRatePerSeat || l.pricePerSeat
  })));

  console.log('\n--- Users by Role ---');
  const users = await prisma.user.findMany({
    select: { id: true, phone: true, fullName: true, role: true, status: true }
  });
  console.table(users);
}

main().catch(console.error).finally(() => prisma.$disconnect());


import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Global Vehicle Rental Marketplace API', timestamp: new Date() });
});

// 2. Global platform config & country settings
app.get('/api/v1/platform/config', async (req, res) => {
  try {
    const settings = await prisma.platformSettings.findMany();
    const configMap: Record<string, any> = {};
    settings.forEach(s => {
      try {
        configMap[s.key] = JSON.parse(s.value);
      } catch {
        configMap[s.key] = s.value;
      }
    });

    const activeCountries = await prisma.country.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { displayOrder: 'asc' },
    });

    res.json({
      success: true,
      data: {
        operationMode: configMap['PLATFORM_OPERATION_MODE']?.mode || 'PAKISTAN_ONLY',
        driverPortalEnabled: configMap['DRIVER_PORTAL_ENABLED']?.enabled ?? true,
        maxCountries: configMap['MAX_ACTIVE_COUNTRIES']?.limit || 10,
        activeCountries,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Country list with filtering
app.get('/api/v1/countries', async (req, res) => {
  try {
    const { all } = req.query;
    const countries = await prisma.country.findMany({
      where: all === 'true' ? {} : { status: 'ACTIVE' },
      orderBy: { displayOrder: 'asc' },
    });
    res.json({ success: true, data: countries });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Country specific form requirements
app.get('/api/v1/countries/:code/requirements', async (req, res) => {
  try {
    const { code } = req.params;
    const { userType } = req.query;

    const country = await prisma.country.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        documentRequirements: userType ? { where: { userType: String(userType) } } : true,
        paymentMethods: { where: { isActive: true } },
        subscriptionPlans: { where: { isActive: true } },
      },
    });

    if (!country) {
      return res.status(404).json({ success: false, error: 'Country not found' });
    }

    res.json({ success: true, data: country });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Vehicle Catalogue (Categories, Manufacturers, Models)
app.get('/api/v1/catalogue/categories', async (req, res) => {
  try {
    const categories = await prisma.vehicleCategory.findMany({
      where: { isActive: true },
      include: {
        manufacturers: {
          include: { models: true },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });
    res.json({ success: true, data: categories });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. Vehicle Listings (Customer Search & Filter)
app.get('/api/v1/listings', async (req, res) => {
  try {
    const { category, city, fuelType, transmission, minPrice, maxPrice, search } = req.query;

    const where: any = { status: 'LIVE' };
    if (city) where.city = { contains: String(city) };
    if (fuelType) where.fuelType = String(fuelType);
    if (transmission) where.transmission = String(transmission);
    if (minPrice || maxPrice) {
      where.dailyRate = {};
      if (minPrice) where.dailyRate.gte = Number(minPrice);
      if (maxPrice) where.dailyRate.lte = Number(maxPrice);
    }

    const listings = await prisma.vehicleListing.findMany({
      where,
      include: {
        category: true,
        manufacturer: true,
        model: true,
        images: { orderBy: { displayOrder: 'asc' } },
        lister: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: listings });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Single listing details
app.get('/api/v1/listings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const listing = await prisma.vehicleListing.findUnique({
      where: { id },
      include: {
        category: true,
        manufacturer: true,
        model: true,
        images: true,
        lister: true,
      },
    });
    if (!listing) return res.status(404).json({ success: false, error: 'Listing not found' });
    res.json({ success: true, data: listing });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6. Lead Generation (WhatsApp / Phone tracking)
app.post('/api/v1/leads', async (req, res) => {
  try {
    const { listingId, contactType, customerPhone, message } = req.body;
    const listing = await prisma.vehicleListing.findUnique({
      where: { id: listingId },
      include: { lister: { include: { user: true } } },
    });

    if (!listing) return res.status(404).json({ success: false, error: 'Listing not found' });

    // Generate reference
    const leadRef = `LEAD-${Date.now().toString().slice(-6)}`;

    // Increment inquiry count
    await prisma.vehicleListing.update({
      where: { id: listingId },
      data: { inquiryCount: { increment: 1 } },
    });

    const listerPhone = listing.lister.user.phone;
    const prefilledText = encodeURIComponent(
      `Hello! I saw your vehicle listing for ${listing.productionYear} ${listing.colour} (Ref: ${listing.listingRef}) on the Marketplace. Daily Rate: ${listing.currencyCode} ${listing.dailyRate}. Is it currently available for rental?`
    );
    const whatsappUrl = `https://wa.me/${listerPhone.replace(/[^0-9]/g, '')}?text=${prefilledText}`;

    res.json({
      success: true,
      data: {
        leadRef,
        listerPhone,
        whatsappUrl,
        message: 'Lead recorded successfully',
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 7. Onboarding & Registration (Lister, Driver, Customer)
app.post('/api/v1/auth/register', async (req, res) => {
  try {
    const { phone, phoneCountryCode, email, userType, countryCode, profileData } = req.body;

    // Verify country is active
    const country = await prisma.country.findUnique({
      where: { code: (countryCode || 'PK').toUpperCase() },
    });

    if (!country || country.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        error: `Country ${countryCode || 'PK'} is not active for new registrations.`,
      });
    }

    // Check existing phone
    let user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          phone,
          phoneCountryCode: phoneCountryCode || '+92',
          email: email || null,
          userType: userType || 'CUSTOMER',
          countryId: country.id,
          accountStatus: userType === 'CUSTOMER' ? 'APPROVED' : 'PENDING_APPROVAL',
          phoneVerified: true,
        },
      });
    }

    // Create respective profile if not present
    if (userType === 'INDIVIDUAL_LISTER' || userType === 'BUSINESS_LISTER') {
      const existing = await prisma.listerProfile.findUnique({ where: { userId: user.id } });
      if (!existing) {
        await prisma.listerProfile.create({
          data: {
            userId: user.id,
            listerType: userType,
            firstName: profileData?.firstName || 'New',
            lastName: profileData?.lastName || 'Lister',
            displayName: profileData?.businessName || `${profileData?.firstName || 'New'} Fleet`,
            businessName: profileData?.businessName || null,
            taxNumber: profileData?.taxNumber || null,
            city: profileData?.city || 'Lahore',
          },
        });
      }
    } else if (userType === 'DRIVER') {
      const existing = await prisma.driverProfile.findUnique({ where: { userId: user.id } });
      if (!existing) {
        await prisma.driverProfile.create({
          data: {
            userId: user.id,
            firstName: profileData?.firstName || 'New',
            lastName: profileData?.lastName || 'Driver',
            licenceNumber: profileData?.licenceNumber || 'DL-PENDING',
            city: profileData?.city || 'Lahore',
          },
        });
      }
    }

    res.json({ success: true, data: { user } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 8. Lister Vehicle Draft Submission (Step before subscription)
app.post('/api/v1/listings/draft', async (req, res) => {
  try {
    const { userId, vehicleData } = req.body;
    const lister = await prisma.listerProfile.findUnique({ where: { userId } });
    if (!lister) return res.status(404).json({ success: false, error: 'Lister profile not found' });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const listingRef = `LST-DRAFT-${Date.now().toString().slice(-6)}`;

    // Save as DRAFT / PENDING_PAYMENT (Recoverable - user data preserved)
    const listing = await prisma.vehicleListing.create({
      data: {
        listingRef,
        listerId: lister.id,
        countryId: user!.countryId,
        categoryId: vehicleData.categoryId,
        manufacturerId: vehicleData.manufacturerId,
        modelId: vehicleData.modelId,
        productionYear: Number(vehicleData.productionYear) || 2023,
        colour: vehicleData.colour || 'White',
        registrationNumber: vehicleData.registrationNumber || 'PENDING',
        dailyRate: Number(vehicleData.dailyRate) || 5000,
        currencyCode: 'PKR',
        city: vehicleData.city || 'Lahore',
        description: vehicleData.description || 'Listing awaiting subscription payment verification',
        status: 'PENDING_PAYMENT',
      },
    });

    if (vehicleData.imageUrl) {
      await prisma.listingImage.create({
        data: {
          listingId: listing.id,
          originalUrl: vehicleData.imageUrl,
          isPrimary: true,
        },
      });
    }

    res.json({ success: true, data: listing });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 9. Payment Submission (Manual Bank Proof / QR)
app.post('/api/v1/payments/submit-proof', async (req, res) => {
  try {
    const { userId, planId, paymentMethodId, transactionRef, proofUrl } = req.body;
    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan) return res.status(404).json({ success: false, error: 'Plan not found' });

    const refNumber = `PAY-${Date.now().toString().slice(-6)}`;

    // Create subscription in AWAITING_PAYMENT status
    const subscription = await prisma.subscription.create({
      data: {
        userId,
        planId,
        countryId: plan.countryId,
        status: 'AWAITING_PAYMENT',
      },
    });

    // Create payment record
    const payment = await prisma.paymentRecord.create({
      data: {
        referenceNumber: refNumber,
        userId,
        subscriptionId: subscription.id,
        paymentMethodId,
        paymentType: 'SUBSCRIPTION',
        amount: plan.price,
        currencyCode: plan.currencyCode,
        finalAmount: plan.price,
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
    });

    // Add proof
    await prisma.paymentProof.create({
      data: {
        paymentRecordId: payment.id,
        fileUrl: proofUrl || 'https://placehold.co/600x400/png?text=Payment+Receipt',
        fileType: 'image/jpeg',
        fileSize: 102400,
        transactionReference: transactionRef || 'TXN-UNKNOWN',
      },
    });

    res.json({
      success: true,
      data: {
        referenceNumber: refNumber,
        status: 'SUBMITTED',
        message: 'Payment proof submitted for Super Admin verification',
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 10. Super Admin / Agent APIs: Payment Verification
app.get('/api/v1/admin/pending-payments', async (req, res) => {
  try {
    const payments = await prisma.paymentRecord.findMany({
      where: { status: 'SUBMITTED' },
      include: {
        user: true,
        subscription: { include: { plan: true } },
        paymentMethod: true,
        proofs: true,
      },
      orderBy: { submittedAt: 'desc' },
    });
    res.json({ success: true, data: payments });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/v1/admin/payments/:id/action', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, rejectionReason } = req.body; // 'APPROVE' or 'REJECT'

    const payment = await prisma.paymentRecord.findUnique({
      where: { id },
      include: { user: true, subscription: true },
    });

    if (!payment) return res.status(404).json({ success: false, error: 'Payment not found' });

    if (action === 'APPROVE') {
      // 1. Update Payment
      await prisma.paymentRecord.update({
        where: { id },
        data: { status: 'VERIFIED', verifiedAt: new Date() },
      });

      // 2. Activate Subscription
      if (payment.subscriptionId) {
        await prisma.subscription.update({
          where: { id: payment.subscriptionId },
          data: {
            status: 'ACTIVE',
            startsAt: new Date(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });
      }

      // 3. Activate associated user account & published listings
      await prisma.user.update({
        where: { id: payment.userId },
        data: { accountStatus: 'APPROVED' },
      });

      // Update any draft listings to LIVE
      const lister = await prisma.listerProfile.findUnique({ where: { userId: payment.userId } });
      if (lister) {
        await prisma.vehicleListing.updateMany({
          where: { listerId: lister.id, status: 'PENDING_PAYMENT' },
          data: { status: 'LIVE' },
        });
      }

      res.json({ success: true, message: 'Payment verified and subscription activated successfully!' });
    } else {
      // REJECT Payment
      await prisma.paymentRecord.update({
        where: { id },
        data: {
          status: 'REJECTED',
          rejectionReason: rejectionReason || 'Payment proof unclear or transaction reference did not match bank statement.',
        },
      });

      const userPhone = payment.user.phone;
      const text = encodeURIComponent(
        `Hello ${payment.user.phone}, your payment reference ${payment.referenceNumber} for Vehicle Rental Marketplace was not approved. Reason: ${rejectionReason || 'Receipt invalid'}. Please upload correct proof.`
      );
      const whatsappUrl = `https://wa.me/${userPhone.replace(/[^0-9]/g, '')}?text=${text}`;

      res.json({
        success: true,
        message: 'Payment rejected',
        whatsappLink: whatsappUrl,
      });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 11. Super Admin: Country Mode Toggle (Pakistan Only <-> International)
app.post('/api/v1/admin/platform/toggle-mode', async (req, res) => {
  try {
    const { mode } = req.body; // 'PAKISTAN_ONLY' or 'INTERNATIONAL'
    await prisma.platformSettings.upsert({
      where: { key: 'PLATFORM_OPERATION_MODE' },
      update: { value: JSON.stringify({ mode }) },
      create: { key: 'PLATFORM_OPERATION_MODE', value: JSON.stringify({ mode }) },
    });
    res.json({ success: true, mode });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Super Admin: Country Approval
app.post('/api/v1/admin/countries/:code/status', async (req, res) => {
  try {
    const { code } = req.params;
    const { status } = req.body; // 'ACTIVE', 'SUSPENDED', 'DRAFT'
    const country = await prisma.country.update({
      where: { code: code.toUpperCase() },
      data: { status },
    });
    res.json({ success: true, data: country });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`[Marketplace API] Server running on http://localhost:${PORT}`);
});


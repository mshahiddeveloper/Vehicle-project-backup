/**
 * SafarPK Enterprise Idempotent Database Seeder
 * Populates:
 * 1. Default Document Verification Rules (Super Admin dynamic toggles)
 * 2. Subscription Packages & Listing Quotas
 * 3. Initial SUPER_ADMIN Account
 * 4. Sample Pakistani Listings across all 5 verticals (Lahore, Karachi, Islamabad)
 */

import { neon } from '@neondatabase/serverless';
import crypto from 'crypto';

const VAULT_SALT = 'safarpk_sec_v2_9f83b1c8e2d4a7f05b19e6c384d2a1f7';

function hashPassword(plainPassword, salt = 'seed_salt_2026') {
  const iterations = 100000;
  const derived = crypto.pbkdf2Sync(plainPassword, salt + VAULT_SALT, iterations, 32, 'sha256');
  return `pbkdf2_sha256$${iterations}$${salt}$${derived.toString('hex')}`;
}

async function seedData() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('DATABASE_URL not set');
  const sql = neon(dbUrl);

  console.log('🌱 Seeding SafarPK Enterprise Database on Neon PostgreSQL 16...');

  // 1. Seed Super Admin Account
  console.log('1. Seeding SUPER_ADMIN account (admin@safarpk.com)...');
  const adminPwdHash = hashPassword('admin123456');
  const adminRows = await sql`
    INSERT INTO users (
      phone,
      phone_verified,
      phone_locked,
      email,
      email_verified,
      password_hash,
      full_name,
      business_name,
      role,
      city,
      country_code,
      kyc_status
    ) VALUES (
      '+923000000000',
      TRUE,
      TRUE,
      'admin@safarpk.com',
      TRUE,
      ${adminPwdHash},
      'SafarPK Super Admin',
      'SafarPK Enterprise Headquarters',
      'SUPER_ADMIN',
      'Islamabad',
      'PK',
      'VERIFIED'
    )
    ON CONFLICT (phone) DO UPDATE SET
      role = 'SUPER_ADMIN',
      password_hash = ${adminPwdHash},
      kyc_status = 'VERIFIED'
    RETURNING id;
  `;
  const adminId = adminRows[0].id;
  console.log('   Admin ID:', adminId);

  // 2. Seed Document Verification Rules
  console.log('2. Seeding Document Verification Rules...');
  const rules = [
    // CUSTOMER
    { role: 'CUSTOMER', subtype: null, doc: 'CNIC', mandatory: false, hidden: false },
    // LISTER
    { role: 'LISTER', subtype: null, doc: 'CNIC', mandatory: true, hidden: false },
    { role: 'LISTER', subtype: null, doc: 'CAR_OWNER_CARD', mandatory: true, hidden: false },
    { role: 'LISTER', subtype: null, doc: 'FBR_NTN', mandatory: false, hidden: false },
    // DRIVER
    { role: 'DRIVER', subtype: null, doc: 'CNIC', mandatory: true, hidden: false },
    { role: 'DRIVER', subtype: null, doc: 'DRIVING_LICENSE', mandatory: true, hidden: false },
    // PROVIDER (PICK_AND_DROP)
    { role: 'PROVIDER', subtype: 'PICK_AND_DROP', doc: 'CNIC', mandatory: true, hidden: false },
    { role: 'PROVIDER', subtype: 'PICK_AND_DROP', doc: 'DRIVING_LICENSE', mandatory: true, hidden: false },
    { role: 'PROVIDER', subtype: 'PICK_AND_DROP', doc: 'CAR_OWNER_CARD', mandatory: true, hidden: false },
    // PROVIDER (COMMERCIAL_CARGO)
    { role: 'PROVIDER', subtype: 'COMMERCIAL_CARGO', doc: 'CNIC', mandatory: true, hidden: false },
    { role: 'PROVIDER', subtype: 'COMMERCIAL_CARGO', doc: 'DRIVING_LICENSE', mandatory: true, hidden: false },
    { role: 'PROVIDER', subtype: 'COMMERCIAL_CARGO', doc: 'FBR_NTN', mandatory: true, hidden: false },
  ];

  for (const r of rules) {
    await sql`
      INSERT INTO document_verification_rules (
        role,
        provider_subtype,
        document_type,
        is_mandatory,
        is_hidden,
        updated_by
      ) VALUES (
        ${r.role}::user_role_enum,
        ${r.subtype ? r.subtype : null}::provider_subtype_enum,
        ${r.doc},
        ${r.mandatory},
        ${r.hidden},
        ${adminId}
      )
      ON CONFLICT (role, provider_subtype, document_type) 
      DO UPDATE SET
        is_mandatory = EXCLUDED.is_mandatory,
        is_hidden = EXCLUDED.is_hidden,
        updated_at = NOW();
    `;
  }
  console.log('   Document rules seeded successfully.');

  // 3. Seed Subscription Plans
  console.log('3. Seeding Subscription Plans...');
  const plans = [
    {
      name: 'Starter Host (Free Trial)',
      role: 'LISTER',
      cycle: 'MONTHLY',
      price: 0,
      quota: 1,
      features: ['1 Vehicle Live Listing', 'Direct Customer Connection', 'Pay at Pickup Model', 'Zero Commission'],
    },
    {
      name: 'Pro Fleet Partner',
      role: 'LISTER',
      cycle: 'MONTHLY',
      price: 4999,
      quota: 5,
      features: ['5 Vehicle Listings', 'Priority Search Placement', 'Direct Customer WhatsApp', 'Monthly Fleet Analytics'],
    },
    {
      name: 'Enterprise Fleet Showroom',
      role: 'LISTER',
      cycle: 'MONTHLY',
      price: 14999,
      quota: 25,
      features: ['25 Vehicle Listings', 'Top Homepage Showcase', 'Custom Storefront Page', 'Dedicated Support Manager'],
    },
  ];

  for (const p of plans) {
    await sql`
      INSERT INTO subscription_plans (
        plan_name,
        target_role,
        billing_cycle,
        price_pkr,
        max_listings_quota,
        features,
        is_active
      ) VALUES (
        ${p.name},
        ${p.role}::user_role_enum,
        ${p.cycle},
        ${p.price},
        ${p.quota},
        ${p.features},
        TRUE
      )
      ON CONFLICT DO NOTHING;
    `;
  }
  console.log('   Subscription plans seeded successfully.');

  // 4. Seed Lister User & Vehicle Fleet Inventory
  console.log('4. Seeding Sample Lister and Vehicle Listings...');
  const listerPwd = hashPassword('lister123');
  const listerRows = await sql`
    INSERT INTO users (
      phone,
      phone_verified,
      phone_locked,
      email,
      password_hash,
      full_name,
      business_name,
      role,
      city,
      country_code,
      kyc_status
    ) VALUES (
      '+923111111111',
      TRUE,
      TRUE,
      'lahore.rentals@safarpk.com',
      ${listerPwd},
      'Malik Tariq Motors',
      'Malik Premium Fleet Lahore',
      'LISTER',
      'Lahore',
      'PK',
      'VERIFIED'
    )
    ON CONFLICT (phone) DO UPDATE SET full_name = EXCLUDED.full_name
    RETURNING id;
  `;
  const listerId = listerRows[0].id;

  const vehicles = [
    {
      title: 'Toyota Corolla Altis 1.6 Special Edition',
      brand: 'Toyota',
      model: 'Corolla Altis',
      year: 2023,
      cat: 'Sedans',
      reg: 'LEA-23-4819',
      city: 'Lahore',
      rate: 6500,
      withDriver: false,
      trans: 'Automatic',
      fuel: 'Petrol',
      gallery: ['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1200&q=80'],
    },
    {
      title: 'Honda Civic RS Turbo 1.5 Oriel',
      brand: 'Honda',
      model: 'Civic RS',
      year: 2024,
      cat: 'Sedans',
      reg: 'KHI-24-9102',
      city: 'Karachi',
      rate: 12000,
      withDriver: false,
      trans: 'Automatic',
      fuel: 'Petrol',
      gallery: ['https://images.unsplash.com/photo-1606016159991-d20508a825b7?auto=format&fit=crop&w=1200&q=80'],
    },
    {
      title: 'Toyota Fortuner Sigma 4 2.8 Diesel 4x4',
      brand: 'Toyota',
      model: 'Fortuner',
      year: 2023,
      cat: 'SUVs & 4x4',
      reg: 'ISB-23-5501',
      city: 'Islamabad',
      rate: 22000,
      withDriver: true,
      trans: 'Automatic',
      fuel: 'Diesel',
      gallery: ['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80'],
    },
  ];

  for (const v of vehicles) {
    await sql`
      INSERT INTO vehicle_listings (
        owner_id,
        title,
        brand,
        model,
        model_year,
        category,
        registration_number,
        city,
        daily_rate_pkr,
        with_driver,
        transmission,
        fuel_type,
        is_paused,
        image_gallery
      ) VALUES (
        ${listerId},
        ${v.title},
        ${v.brand},
        ${v.model},
        ${v.year},
        ${v.cat},
        ${v.reg},
        ${v.city},
        ${v.rate},
        ${v.withDriver},
        ${v.trans},
        ${v.fuel},
        FALSE,
        ${v.gallery}
      )
      ON CONFLICT DO NOTHING;
    `;
  }
  console.log('   Vehicle listings seeded.');

  // 5. Seed Chauffeur Profiles
  console.log('5. Seeding Chauffeur / Driver Profiles...');
  const driverPwd = hashPassword('driver123');
  const driverRows = await sql`
    INSERT INTO users (
      phone,
      phone_verified,
      phone_locked,
      email,
      password_hash,
      full_name,
      role,
      city,
      country_code,
      kyc_status
    ) VALUES (
      '+923222222222',
      TRUE,
      TRUE,
      'captain.imran@safarpk.com',
      ${driverPwd},
      'Captain Imran Khan',
      'DRIVER',
      'Lahore',
      'PK',
      'VERIFIED'
    )
    ON CONFLICT (phone) DO UPDATE SET full_name = EXCLUDED.full_name
    RETURNING id;
  `;
  const driverId = driverRows[0].id;

  await sql`
    INSERT INTO chauffeur_profiles (
      user_id,
      city,
      experience_years,
      languages,
      hourly_rate_pkr,
      daily_12h_rate_pkr,
      outstation_daily_rate_pkr,
      duty_status,
      verified_chauffeur
    ) VALUES (
      ${driverId},
      'Lahore',
      8,
      ARRAY['Urdu', 'English', 'Punjabi'],
      500,
      3500,
      4500,
      'AVAILABLE',
      TRUE
    )
    ON CONFLICT (user_id) DO UPDATE SET
      city = EXCLUDED.city,
      experience_years = EXCLUDED.experience_years;
  `;
  console.log('   Chauffeur profiles seeded.');

  // 6. Seed Shuttle Routes (Pick & Drop & City to City)
  console.log('6. Seeding Shuttle Routes...');
  const providerPwd = hashPassword('provider123');
  const providerRows = await sql`
    INSERT INTO users (
      phone,
      phone_verified,
      phone_locked,
      email,
      password_hash,
      full_name,
      business_name,
      role,
      provider_subtype,
      city,
      country_code,
      kyc_status
    ) VALUES (
      '+923333333333',
      TRUE,
      TRUE,
      'commuters.pk@safarpk.com',
      ${providerPwd},
      'Karachi Commuter Transit',
      'Karachi Daily Express Fleet',
      'PROVIDER',
      'PICK_AND_DROP',
      'Karachi',
      'PK',
      'VERIFIED'
    )
    ON CONFLICT (phone) DO UPDATE SET full_name = EXCLUDED.full_name
    RETURNING id;
  `;
  const providerId = providerRows[0].id;

  await sql`
    INSERT INTO shuttle_routes (
      provider_id,
      city,
      route_name,
      vehicle_model,
      total_seats,
      available_seats,
      pickup_stops,
      dropoff_stops,
      morning_departure_time,
      evening_return_time,
      monthly_fare_pkr,
      is_active
    ) VALUES (
      ${providerId},
      'Karachi',
      'Malir Cantt to Clifton Corporate Route',
      'Toyota Hiace Grand Cabin 2022',
      14,
      4,
      ARRAY['Malir Cantt Gate 2', 'Model Colony', 'Drigh Road', 'Karsaz'],
      ARRAY['FTC Shahrah-e-Faisal', 'Metropole', 'Do Talwar', 'Clifton Block 4'],
      '07:30:00'::time,
      '17:30:00'::time,
      12000,
      TRUE
    )
    ON CONFLICT DO NOTHING;
  `;
  console.log('   Shuttle routes seeded.');

  // 7. Seed Intercity Trips (Vertical 3 - City to City)
  console.log('7. Seeding Intercity Scheduled Trips (Motorway corridors)...');
  const intercityRoutes = [
    {
      origin: 'Lahore',
      dest: 'Islamabad',
      via: 'M-2 Motorway',
      dep: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days from now
      veh: 'Toyota Grand Cabin Executive 2024',
      total: 10,
      avail: 6,
      fare: 3500,
    },
    {
      origin: 'Karachi',
      dest: 'Hyderabad',
      via: 'M-9 Motorway',
      dep: new Date(Date.now() + 86400000 * 1).toISOString(), // Tomorrow
      veh: 'Toyota Hiace AC Commuter',
      total: 14,
      avail: 8,
      fare: 1500,
    },
    {
      origin: 'Rawalpindi',
      dest: 'Peshawar',
      via: 'M-1 Motorway',
      dep: new Date(Date.now() + 86400000 * 3).toISOString(), // 3 days from now
      veh: 'Toyota Coaster Saloon',
      total: 20,
      avail: 12,
      fare: 2000,
    },
  ];

  for (const ir of intercityRoutes) {
    await sql`
      INSERT INTO intercity_trips (
        provider_id,
        origin_city,
        destination_city,
        route_via,
        departure_time,
        vehicle_type,
        total_seats,
        available_seats,
        per_seat_fare_pkr,
        status,
        created_at
      ) VALUES (
        ${providerId},
        ${ir.origin},
        ${ir.dest},
        ${ir.via},
        ${ir.dep}::timestamptz,
        ${ir.veh},
        ${ir.total},
        ${ir.avail},
        ${ir.fare},
        'SCHEDULED',
        NOW()
      )
      ON CONFLICT DO NOTHING;
    `;
  }
  console.log('   Intercity trips seeded.');

  // 8. Seed Sample Customer, Wishlist, Booking & Review
  console.log('8. Seeding Sample Customer, Wishlist & Review...');
  const customerPwd = hashPassword('customer123');
  const customerRows = await sql`
    INSERT INTO users (
      phone,
      phone_verified,
      phone_locked,
      email,
      password_hash,
      full_name,
      role,
      city,
      country_code,
      kyc_status
    ) VALUES (
      '+923444444444',
      TRUE,
      TRUE,
      'syber.shah@safarpk.com',
      ${customerPwd},
      'Syber Shah',
      'CUSTOMER',
      'Karachi',
      'PK',
      'VERIFIED'
    )
    ON CONFLICT (phone) DO UPDATE SET full_name = EXCLUDED.full_name
    RETURNING id;
  `;
  const customerId = customerRows[0].id;

  // Fetch a vehicle listing ID
  const vehicleRows = await sql`SELECT id FROM vehicle_listings LIMIT 1;`;
  if (vehicleRows.length > 0) {
    const vehicleId = vehicleRows[0].id;
    // Seed wishlist
    await sql`
      INSERT INTO wishlists (user_id, vehicle_id)
      VALUES (${customerId}, ${vehicleId})
      ON CONFLICT (user_id, vehicle_id) DO NOTHING;
    `;
    console.log('   Wishlist seeded.');

    // Seed completed booking for review
    const bookingRef = 'SAFAR-REV-SEED-01';
    const bookingRows = await sql`
      INSERT INTO bookings (
        booking_reference,
        customer_id,
        lister_id,
        service_type,
        vehicle_id,
        start_date,
        end_date,
        pickup_location,
        total_amount_pkr,
        payment_status,
        booking_status
      ) VALUES (
        ${bookingRef},
        ${customerId},
        ${listerId},
        'RENT_A_CAR',
        ${vehicleId},
        CURRENT_DATE - INTERVAL '5 days',
        CURRENT_DATE - INTERVAL '3 days',
        'Lahore Airport',
        13000,
        'PAID',
        'COMPLETED'
      )
      ON CONFLICT (booking_reference) DO UPDATE SET booking_status = 'COMPLETED'
      RETURNING id;
    `;

    const bookingId = bookingRows[0].id;

    // Seed verified 5-star review
    await sql`
      INSERT INTO reviews (
        booking_id,
        customer_id,
        target_user_id,
        rating,
        comment
      ) VALUES (
        ${bookingId},
        ${customerId},
        ${listerId},
        5,
        'Flawless rental experience! Clean car, on-time handover at Lahore airport and zero hidden charges.'
      )
      ON CONFLICT (booking_id) DO NOTHING;
    `;
    console.log('   Verified review seeded.');
  }

  // 9. Seed Notifications
  console.log('9. Seeding Notifications...');
  await sql`
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      link_url
    ) VALUES (
      ${adminId},
      'SYSTEM_ALERT',
      'SafarPK Enterprise System Live',
      'All 5 verticals, Row-Level Security, and cryptographic audit chains are fully active on Neon PostgreSQL 16.',
      '/admin'
    ), (
      ${customerId},
      'KYC_APPROVED',
      'Account Verified',
      'Welcome to SafarPK! Your phone and identity verification are complete. Enjoy seamless direct bookings.',
      '/customer'
    );
  `;
  console.log('   Notifications seeded.');

  console.log('🎉 SafarPK Enterprise Database successfully seeded across all 5 verticals!');
}

seedData()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seeding error:', err);
    process.exit(1);
  });


import { neon } from '@neondatabase/serverless';
import crypto from 'crypto';

const VAULT_SALT = 'safarpk_sec_v2_9f83b1c8e2d4a7f05b19e6c384d2a1f7';

function hashPassword(plainPassword) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.pbkdf2Sync(plainPassword, salt + VAULT_SALT, 100000, 32, 'sha256');
  return `pbkdf2_sha256$100000$${salt}$${derived.toString('hex')}`;
}

const sql = neon(process.env.DATABASE_URL);

async function main() {
  console.log('--- 1. Creating platform_staff table in Neon ---');
  await sql`
    CREATE TABLE IF NOT EXISTS platform_staff (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username TEXT UNIQUE NOT NULL,
      email CITEXT UNIQUE NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('SUPER_ADMIN', 'AGENT')),
      full_name TEXT NOT NULL,
      permissions JSONB NOT NULL DEFAULT '{"all": true}',
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      last_login_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  console.log('platform_staff table created successfully.');

  console.log('--- 2. Seeding Super Admin and Agent in platform_staff ---');
  const adminPasswordHash = hashPassword('SuperAdmin@SafarPK2026!');
  const agentPasswordHash = hashPassword('Agent@SafarPK2026!');

  await sql`
    INSERT INTO platform_staff (username, email, phone, password_hash, role, full_name, permissions)
    VALUES 
      ('superadmin', 'superadmin@safarpk.com', '+923000000001', ${adminPasswordHash}, 'SUPER_ADMIN', 'SafarPK Enterprise Super Admin', '{"all": true, "super_admin": true}'),
      ('agent01', 'agent@safarpk.com', '+923000000002', ${agentPasswordHash}, 'AGENT', 'Kashif Verification Agent', '{"all": false, "kyc_approve": true, "listings_view": true}')
    ON CONFLICT (username) DO UPDATE 
    SET 
      password_hash = EXCLUDED.password_hash,
      email = EXCLUDED.email,
      phone = EXCLUDED.phone,
      full_name = EXCLUDED.full_name,
      updated_at = NOW();
  `;
  console.log('Super Admin & Agent seeded in platform_staff.');

  console.log('--- 3. Seeding Realistic Partner & Customer Accounts in users table ---');
  const listerKarachiHash = hashPassword('Lister@Karachi2026!');
  const listerLahoreHash = hashPassword('Lister@Lahore2026!');
  const listerIsbHash = hashPassword('Lister@Islamabad2026!');
  const driverHash = hashPassword('Driver@Akram2026!');
  const shuttleHash = hashPassword('Shuttle@Madina2026!');
  const cargoHash = hashPassword('Cargo@Pak2026!');
  const customerHash = hashPassword('Customer@SafarPK2026!');

  const testAccounts = [
    {
      phone: '+923214455667',
      email: 'ahmed.karachi@safarpk.com',
      password_hash: listerKarachiHash,
      full_name: 'Ahmed Executive Motors',
      business_name: 'Ahmed Executive Motors Karachi',
      role: 'LISTER',
      provider_subtype: null,
      city: 'Karachi',
    },
    {
      phone: '+923008472910',
      email: 'zubair.lahore@safarpk.com',
      password_hash: listerLahoreHash,
      full_name: 'Zubair Car Rentals',
      business_name: 'Zubair Luxury Fleet Lahore',
      role: 'LISTER',
      provider_subtype: null,
      city: 'Lahore',
    },
    {
      phone: '+923335599182',
      email: 'capital.isb@safarpk.com',
      password_hash: listerIsbHash,
      full_name: 'Capital Fleet Hub',
      business_name: 'Capital Fleet Hub Islamabad',
      role: 'LISTER',
      provider_subtype: null,
      city: 'Islamabad',
    },
    {
      phone: '+923015551234',
      email: 'driver.akram@safarpk.com',
      password_hash: driverHash,
      full_name: 'Captain Muhammad Akram',
      business_name: null,
      role: 'DRIVER',
      provider_subtype: null,
      city: 'Lahore',
    },
    {
      phone: '+923129998877',
      email: 'shuttle.madina@safarpk.com',
      password_hash: shuttleHash,
      full_name: 'Al-Madina Shuttle Services',
      business_name: 'Al-Madina Commuter Transit',
      role: 'PROVIDER',
      provider_subtype: 'PICK_AND_DROP',
      city: 'Karachi',
    },
    {
      phone: '+923451122334',
      email: 'cargo.pak@safarpk.com',
      password_hash: cargoHash,
      full_name: 'Pak Cargo Logistics',
      business_name: 'Pak Cargo & Household Shifting',
      role: 'PROVIDER',
      provider_subtype: 'COMMERCIAL_CARGO',
      city: 'Islamabad',
    },
    {
      phone: '+923120000000',
      email: 'sybershah@gmail.com',
      password_hash: customerHash,
      full_name: 'Syber Shah',
      business_name: null,
      role: 'CUSTOMER',
      provider_subtype: null,
      city: 'Karachi',
    },
  ];

  const createdUserIds = {};

  for (const acc of testAccounts) {
    const res = await sql`
      INSERT INTO users (
        phone, 
        phone_verified, 
        email, 
        email_verified, 
        password_hash, 
        full_name, 
        business_name, 
        role, 
        provider_subtype, 
        city, 
        country_code, 
        kyc_status, 
        is_blocked
      )
      VALUES (
        ${acc.phone},
        TRUE,
        ${acc.email},
        TRUE,
        ${acc.password_hash},
        ${acc.full_name},
        ${acc.business_name},
        ${acc.role}::user_role_enum,
        ${acc.provider_subtype ? sql`${acc.provider_subtype}::provider_subtype_enum` : null},
        ${acc.city},
        'PK',
        'VERIFIED'::kyc_status_enum,
        FALSE
      )
      ON CONFLICT (phone) DO UPDATE 
      SET 
        email = EXCLUDED.email,
        password_hash = EXCLUDED.password_hash,
        full_name = EXCLUDED.full_name,
        business_name = EXCLUDED.business_name,
        role = EXCLUDED.role,
        provider_subtype = EXCLUDED.provider_subtype,
        city = EXCLUDED.city,
        kyc_status = 'VERIFIED'::kyc_status_enum,
        updated_at = NOW()
      RETURNING id, phone, role, city;
    `;
    createdUserIds[acc.email] = res[0].id;
    console.log(`User ${acc.email} synced: ID ${res[0].id}`);
  }

  console.log('--- 4. Ensuring Active Subscription Plans & User Subscriptions ---');
  const plans = await sql`SELECT id, plan_name FROM subscription_plans LIMIT 1;`;
  let planId = plans.length > 0 ? plans[0].id : null;
  if (!planId) {
    const newPlan = await sql`
      INSERT INTO subscription_plans (plan_name, target_role, price_pkr, billing_cycle, max_listings_quota, is_active)
      VALUES ('Professional Fleet Hub', 'LISTER'::user_role_enum, 10000, 'MONTHLY', 50, TRUE)
      RETURNING id;
    `;
    planId = newPlan[0].id;
  }

  // Activate subscriptions for listers and providers
  for (const [email, userId] of Object.entries(createdUserIds)) {
    if (email.includes('lister') || email.includes('shuttle') || email.includes('cargo') || email.includes('driver')) {
      const existingSub = await sql`SELECT id FROM user_subscriptions WHERE user_id = ${userId} LIMIT 1;`;
      if (existingSub.length === 0) {
        await sql`
          INSERT INTO user_subscriptions (
            user_id,
            plan_id,
            status,
            max_quota,
            current_used_quota,
            started_at,
            expires_at
          )
          VALUES (
            ${userId},
            ${planId},
            'ACTIVE'::subscription_status_enum,
            50,
            2,
            NOW(),
            NOW() + INTERVAL '365 days'
          );
        `;
      } else {
        await sql`
          UPDATE user_subscriptions 
          SET 
            status = 'ACTIVE'::subscription_status_enum,
            max_quota = 50,
            expires_at = NOW() + INTERVAL '365 days'
          WHERE user_id = ${userId};
        `;
      }
      console.log(`Active subscription provisioned for user ${email}`);
    }
  }

  console.log('--- 5. Seeding Real Listings in vehicle_listings linked to Owners ---');
  const karachiListerId = createdUserIds['ahmed.karachi@safarpk.com'];
  const lahoreListerId = createdUserIds['zubair.lahore@safarpk.com'];
  const isbListerId = createdUserIds['capital.isb@safarpk.com'];

  const realListings = [
    // Karachi Listings (Ahmed Executive Motors)
    {
      owner_id: karachiListerId,
      title: 'Suzuki Alto VXL AGS 2024',
      brand: 'Suzuki',
      model: 'Alto',
      model_year: 2024,
      category: 'Economy',
      registration_number: 'KHI-ALT-2024',
      city: 'Karachi',
      pickup_address: 'Clifton Block 4, Karachi',
      daily_rate_pkr: 3500,
      with_driver: false,
      transmission: 'Automatic (AGS)',
      fuel_type: 'Petrol',
      image_gallery: ['https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&auto=format&fit=crop&q=80'],
    },
    {
      owner_id: karachiListerId,
      title: 'Toyota Yaris ATIV X 1.5 2024',
      brand: 'Toyota',
      model: 'Yaris',
      model_year: 2024,
      category: 'Sedans',
      registration_number: 'KHI-YAR-8891',
      city: 'Karachi',
      pickup_address: 'Shahrah-e-Faisal, Karachi',
      daily_rate_pkr: 5500,
      with_driver: false,
      transmission: 'Automatic',
      fuel_type: 'Petrol',
      image_gallery: ['https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800&auto=format&fit=crop&q=80'],
    },
    {
      owner_id: karachiListerId,
      title: 'Suzuki Cultus VXL 2024',
      brand: 'Suzuki',
      model: 'Cultus',
      model_year: 2024,
      category: 'Economy',
      registration_number: 'KHI-CUL-4421',
      city: 'Karachi',
      pickup_address: 'DHA Phase 5, Karachi',
      daily_rate_pkr: 4200,
      with_driver: false,
      transmission: 'Manual',
      fuel_type: 'Petrol',
      image_gallery: ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80'],
    },

    // Lahore Listings (Zubair Car Rentals)
    {
      owner_id: lahoreListerId,
      title: 'Toyota Corolla Altis Grande 1.8 2024',
      brand: 'Toyota',
      model: 'Corolla',
      model_year: 2024,
      category: 'Sedans',
      registration_number: 'LEA-ALT-2024',
      city: 'Lahore',
      pickup_address: 'Main Boulevard, Gulberg III, Lahore',
      daily_rate_pkr: 7500,
      with_driver: false,
      transmission: 'Automatic',
      fuel_type: 'Petrol',
      image_gallery: ['https://images.unsplash.com/photo-1623869675781-80aa31012a5a?w=800&auto=format&fit=crop&q=80'],
    },
    {
      owner_id: lahoreListerId,
      title: 'KIA Sportage AWD 2023',
      brand: 'KIA',
      model: 'Sportage',
      model_year: 2023,
      category: 'SUVs & 4x4',
      registration_number: 'LHR-SPT-9012',
      city: 'Lahore',
      pickup_address: 'DHA Phase 3, Sector Y, Lahore',
      daily_rate_pkr: 13000,
      with_driver: false,
      transmission: 'Automatic',
      fuel_type: 'Petrol',
      image_gallery: ['https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&auto=format&fit=crop&q=80'],
    },
    {
      owner_id: lahoreListerId,
      title: 'Toyota HiAce Grand Cabin 2023',
      brand: 'Toyota',
      model: 'HiAce',
      model_year: 2023,
      category: 'Vans & Buses',
      registration_number: 'LHR-HIA-5501',
      city: 'Lahore',
      pickup_address: 'Thokar Niaz Baig / Canal Road, Lahore',
      daily_rate_pkr: 16000,
      with_driver: true,
      transmission: 'Automatic',
      fuel_type: 'Diesel',
      image_gallery: ['https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=80'],
    },

    // Islamabad Listings (Capital Fleet Hub)
    {
      owner_id: isbListerId,
      title: 'Toyota Fortuner Legender 2.8 4x4 2024',
      brand: 'Toyota',
      model: 'Fortuner',
      model_year: 2024,
      category: 'SUVs & 4x4',
      registration_number: 'ICT-LEG-2024',
      city: 'Islamabad',
      pickup_address: 'F-7 Markaz, Jinnah Super, Islamabad',
      daily_rate_pkr: 25000,
      with_driver: false,
      transmission: 'Automatic',
      fuel_type: 'Diesel',
      image_gallery: ['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&auto=format&fit=crop&q=80'],
    },
    {
      owner_id: isbListerId,
      title: 'Honda Civic Oriel Turbo 2024',
      brand: 'Honda',
      model: 'Civic',
      model_year: 2024,
      category: 'Sedans',
      registration_number: 'ICT-CIV-4808',
      city: 'Islamabad',
      pickup_address: 'Centaurus Mall, F-8, Islamabad',
      daily_rate_pkr: 14000,
      with_driver: false,
      transmission: 'Automatic',
      fuel_type: 'Petrol',
      image_gallery: ['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&auto=format&fit=crop&q=80'],
    },
    {
      owner_id: isbListerId,
      title: 'Mercedes-Benz GLE 450 2023',
      brand: 'Mercedes-Benz',
      model: 'GLE',
      model_year: 2023,
      category: 'Luxury',
      registration_number: 'ICT-GLE-007',
      city: 'Islamabad',
      pickup_address: 'Blue Area, Islamabad',
      daily_rate_pkr: 45000,
      with_driver: true,
      transmission: 'Automatic',
      fuel_type: 'Petrol',
      image_gallery: ['https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&auto=format&fit=crop&q=80'],
    },
  ];

  for (const v of realListings) {
    const existing = await sql`
      SELECT id FROM vehicle_listings 
      WHERE owner_id = ${v.owner_id} AND title = ${v.title}
      LIMIT 1;
    `;
    if (existing.length === 0) {
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
          pickup_address,
          daily_rate_pkr,
          with_driver,
          transmission,
          fuel_type,
          is_paused,
          image_gallery
        )
        VALUES (
          ${v.owner_id},
          ${v.title},
          ${v.brand},
          ${v.model},
          ${v.model_year},
          ${v.category},
          ${v.registration_number},
          ${v.city},
          ${v.pickup_address},
          ${v.daily_rate_pkr},
          ${v.with_driver},
          ${v.transmission},
          ${v.fuel_type},
          FALSE,
          ${v.image_gallery}
        );
      `;
      console.log(`Listing seeded: ${v.title} in ${v.city}`);
    } else {
      console.log(`Listing exists: ${v.title}`);
    }
  }

  console.log('✅ Real accounts, platform_staff, and inventory successfully deployed to Neon!');
}

main().catch(console.error);

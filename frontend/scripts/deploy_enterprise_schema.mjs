import { neon } from '@neondatabase/serverless';

async function deploySchema() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL is not defined in environment');
  }

  const sql = neon(dbUrl);

  console.log('Connecting to Neon PostgreSQL 16...');

  // 1. Extensions
  console.log('Enabling extensions (uuid-ossp, pgcrypto, citext)...');
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`;
  await sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`;
  await sql`CREATE EXTENSION IF NOT EXISTS "citext";`;

  // 2. Enums
  console.log('Creating Enums...');
  await sql`
    DO $$ BEGIN
      CREATE TYPE user_role_enum AS ENUM ('CUSTOMER', 'LISTER', 'DRIVER', 'PROVIDER', 'AGENT', 'SUPER_ADMIN');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `;

  await sql`
    DO $$ BEGIN
      CREATE TYPE provider_subtype_enum AS ENUM ('PICK_AND_DROP', 'COMMERCIAL_CARGO', 'CITY_TO_CITY');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `;

  await sql`
    DO $$ BEGIN
      CREATE TYPE kyc_status_enum AS ENUM ('UNVERIFIED', 'PENDING_APPROVAL', 'VERIFIED', 'REJECTED');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `;

  await sql`
    DO $$ BEGIN
      CREATE TYPE booking_status_enum AS ENUM ('PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'DISPUTED');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `;

  await sql`
    DO $$ BEGIN
      CREATE TYPE subscription_status_enum AS ENUM ('UNSUBSCRIBED', 'PENDING_APPROVAL', 'ACTIVE', 'PAUSED', 'EXPIRED', 'REJECTED');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `;

  // 3. Core Tables
  console.log('Creating Table: users...');
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      phone VARCHAR(20) NOT NULL UNIQUE,
      phone_verified BOOLEAN DEFAULT FALSE,
      phone_locked BOOLEAN DEFAULT FALSE,
      email CITEXT UNIQUE,
      email_verified BOOLEAN DEFAULT FALSE,
      password_hash VARCHAR(255) NOT NULL,
      full_name VARCHAR(100) NOT NULL,
      business_name VARCHAR(150),
      role user_role_enum NOT NULL DEFAULT 'CUSTOMER',
      provider_subtype provider_subtype_enum,
      city VARCHAR(50) NOT NULL DEFAULT 'Lahore',
      country_code VARCHAR(5) NOT NULL DEFAULT 'PK',
      kyc_status kyc_status_enum NOT NULL DEFAULT 'UNVERIFIED',
      is_blocked BOOLEAN DEFAULT FALSE,
      encrypted_cnic BYTEA,
      encrypted_license BYTEA,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_users_role_city ON users(role, city);`;

  console.log('Creating Table: document_verification_rules...');
  await sql`
    CREATE TABLE IF NOT EXISTS document_verification_rules (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      role user_role_enum NOT NULL,
      provider_subtype provider_subtype_enum,
      document_type VARCHAR(50) NOT NULL,
      is_mandatory BOOLEAN NOT NULL DEFAULT FALSE,
      is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
      updated_by UUID REFERENCES users(id),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT unq_role_doc_type UNIQUE (role, provider_subtype, document_type)
    );
  `;

  console.log('Creating Table: user_documents...');
  await sql`
    CREATE TABLE IF NOT EXISTS user_documents (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      document_type VARCHAR(50) NOT NULL,
      document_file_url TEXT NOT NULL,
      document_number VARCHAR(100),
      extracted_metadata JSONB,
      verification_status kyc_status_enum NOT NULL DEFAULT 'PENDING_APPROVAL',
      verified_by UUID REFERENCES users(id),
      verified_at TIMESTAMPTZ,
      rejection_reason TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_user_docs_lookup ON user_documents(user_id, document_type);`;

  console.log('Creating Table: subscription_plans...');
  await sql`
    CREATE TABLE IF NOT EXISTS subscription_plans (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      plan_name VARCHAR(100) NOT NULL,
      target_role user_role_enum NOT NULL,
      billing_cycle VARCHAR(20) NOT NULL DEFAULT 'MONTHLY',
      price_pkr NUMERIC(12, 2) NOT NULL DEFAULT 0,
      max_listings_quota INT NOT NULL DEFAULT 1,
      features TEXT[] DEFAULT ARRAY[]::TEXT[],
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  console.log('Creating Table: user_subscriptions...');
  await sql`
    CREATE TABLE IF NOT EXISTS user_subscriptions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      plan_id UUID NOT NULL REFERENCES subscription_plans(id),
      status subscription_status_enum NOT NULL DEFAULT 'PENDING_APPROVAL',
      max_quota INT NOT NULL DEFAULT 1,
      current_used_quota INT NOT NULL DEFAULT 0,
      started_at TIMESTAMPTZ,
      expires_at TIMESTAMPTZ,
      payment_reference VARCHAR(100),
      payment_slip_url TEXT,
      approved_by UUID REFERENCES users(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_user_subs_status ON user_subscriptions(user_id, status);`;

  console.log('Creating Table: vehicle_listings...');
  await sql`
    CREATE TABLE IF NOT EXISTS vehicle_listings (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(150) NOT NULL,
      brand VARCHAR(50) NOT NULL,
      model VARCHAR(50) NOT NULL,
      model_year INT NOT NULL,
      category VARCHAR(50) NOT NULL,
      registration_number VARCHAR(50) NOT NULL,
      smart_card_doc_url TEXT,
      city VARCHAR(50) NOT NULL,
      pickup_address TEXT,
      daily_rate_pkr NUMERIC(10, 2) NOT NULL,
      with_driver BOOLEAN NOT NULL DEFAULT FALSE,
      transmission VARCHAR(20) NOT NULL DEFAULT 'Automatic',
      fuel_type VARCHAR(20) NOT NULL DEFAULT 'Petrol',
      is_paused BOOLEAN NOT NULL DEFAULT FALSE,
      pause_reason VARCHAR(100),
      image_gallery TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_vehicle_search ON vehicle_listings(city, category, is_paused);`;

  console.log('Creating Table: chauffeur_profiles...');
  await sql`
    CREATE TABLE IF NOT EXISTS chauffeur_profiles (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      city VARCHAR(50) NOT NULL,
      experience_years INT NOT NULL DEFAULT 5,
      languages TEXT[] DEFAULT ARRAY['Urdu', 'English']::TEXT[],
      hourly_rate_pkr NUMERIC(10, 2) NOT NULL DEFAULT 500,
      daily_12h_rate_pkr NUMERIC(10, 2) NOT NULL DEFAULT 3500,
      outstation_daily_rate_pkr NUMERIC(10, 2) NOT NULL DEFAULT 4500,
      duty_status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
      verified_chauffeur BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  console.log('Creating Table: shuttle_routes...');
  await sql`
    CREATE TABLE IF NOT EXISTS shuttle_routes (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      provider_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      city VARCHAR(50) NOT NULL,
      route_name VARCHAR(150) NOT NULL,
      vehicle_model VARCHAR(100) NOT NULL,
      total_seats INT NOT NULL DEFAULT 14,
      available_seats INT NOT NULL DEFAULT 5,
      pickup_stops TEXT[] NOT NULL,
      dropoff_stops TEXT[] NOT NULL,
      morning_departure_time TIME NOT NULL,
      evening_return_time TIME NOT NULL,
      monthly_fare_pkr NUMERIC(10, 2) NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  console.log('Creating Table: moving_quotes...');
  await sql`
    CREATE TABLE IF NOT EXISTS moving_quotes (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      customer_id UUID REFERENCES users(id),
      provider_id UUID REFERENCES users(id),
      city VARCHAR(50) NOT NULL,
      service_type VARCHAR(50) NOT NULL,
      pickup_address TEXT NOT NULL,
      dropoff_address TEXT NOT NULL,
      estimated_distance_km NUMERIC(6, 2) NOT NULL,
      truck_type VARCHAR(50) NOT NULL,
      helpers_count INT NOT NULL DEFAULT 2,
      floor_number INT NOT NULL DEFAULT 0,
      has_elevator BOOLEAN NOT NULL DEFAULT FALSE,
      quoted_price_pkr NUMERIC(12, 2) NOT NULL,
      customer_phone VARCHAR(20) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  console.log('Creating Table: bookings...');
  await sql`
    CREATE TABLE IF NOT EXISTS bookings (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      booking_reference VARCHAR(30) NOT NULL UNIQUE,
      customer_id UUID NOT NULL REFERENCES users(id),
      lister_id UUID REFERENCES users(id),
      driver_id UUID REFERENCES users(id),
      service_type VARCHAR(30) NOT NULL,
      vehicle_id UUID REFERENCES vehicle_listings(id),
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      pickup_location TEXT NOT NULL,
      dropoff_location TEXT,
      total_amount_pkr NUMERIC(12, 2) NOT NULL,
      payment_status VARCHAR(30) NOT NULL DEFAULT 'PAY_ON_PICKUP',
      booking_status booking_status_enum NOT NULL DEFAULT 'PENDING',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(customer_id, booking_status);`;

  console.log('Creating Table: audit_logs (Tamper-evident Merkle Chained)...');
  await sql`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id BIGSERIAL PRIMARY KEY,
      actor_id UUID REFERENCES users(id),
      actor_role VARCHAR(50) NOT NULL,
      action_type VARCHAR(100) NOT NULL,
      target_resource VARCHAR(100) NOT NULL,
      resource_id VARCHAR(100),
      ip_address INET,
      user_agent TEXT,
      state_delta JSONB,
      previous_hash VARCHAR(64) NOT NULL,
      current_hash VARCHAR(64) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  // Strict immutability constraint: Revoke update and delete on audit_logs
  await sql`REVOKE UPDATE, DELETE ON audit_logs FROM PUBLIC;`;

  // Engine-level trigger guaranteeing zero mutation/deletion even for table owners
  await sql`
    CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()
    RETURNS TRIGGER AS $$
    BEGIN
      RAISE EXCEPTION 'audit_logs entries are immutable and cannot be updated or deleted (OWASP ASVS Level 2+ / NIST SP 800-63B)';
    END;
    $$ LANGUAGE plpgsql;
  `;
  await sql`DROP TRIGGER IF EXISTS trg_prevent_audit_log_mutation ON audit_logs;`;
  await sql`
    CREATE TRIGGER trg_prevent_audit_log_mutation
    BEFORE UPDATE OR DELETE ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_log_mutation();
  `;

  // =========================================================================
  // Additional Essential Tables for 5 Verticals, CTAs & Serverless Reliability
  // =========================================================================

  // 1. Intercity Trips (Vertical 3 - City to City)
  console.log('Creating Table: intercity_trips...');
  await sql`
    CREATE TABLE IF NOT EXISTS intercity_trips (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      provider_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      origin_city VARCHAR(50) NOT NULL,
      destination_city VARCHAR(50) NOT NULL,
      route_via VARCHAR(100) NOT NULL,
      departure_time TIMESTAMPTZ NOT NULL,
      vehicle_type VARCHAR(50) NOT NULL,
      total_seats INT NOT NULL DEFAULT 4,
      available_seats INT NOT NULL DEFAULT 4,
      per_seat_fare_pkr NUMERIC(10, 2) NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_intercity_search ON intercity_trips(origin_city, destination_city, status, departure_time);`;

  // 2. Wishlists (CTA Matrix - Wishlist Heart Icon)
  console.log('Creating Table: wishlists...');
  await sql`
    CREATE TABLE IF NOT EXISTS wishlists (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      vehicle_id UUID NOT NULL REFERENCES vehicle_listings(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT unq_user_vehicle_wishlist UNIQUE (user_id, vehicle_id)
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_wishlists_user ON wishlists(user_id);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_wishlists_vehicle ON wishlists(vehicle_id);`;

  // 3. Reviews (Post-Booking Verified Ratings)
  console.log('Creating Table: reviews...');
  await sql`
    CREATE TABLE IF NOT EXISTS reviews (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
      customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      target_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_reviews_target ON reviews(target_user_id, rating);`;

  // 4. OTP Verifications (Serverless Vercel Fluid Compute Persistence)
  console.log('Creating Table: otp_verifications...');
  await sql`
    CREATE TABLE IF NOT EXISTS otp_verifications (
      phone VARCHAR(20) PRIMARY KEY,
      otp_hash VARCHAR(255) NOT NULL,
      attempt_count INT NOT NULL DEFAULT 0,
      cooldown_until TIMESTAMPTZ NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  // 5. Notifications (Real-time Booking, KYC & Subscription Alerts)
  console.log('Creating Table: notifications...');
  await sql`
    CREATE TABLE IF NOT EXISTS notifications (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      title VARCHAR(150) NOT NULL,
      message TEXT NOT NULL,
      link_url TEXT,
      is_read BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC);`;

  // 4. Row Level Security Policies
  console.log('Configuring Row Level Security (RLS) with Neon Session Context...');
  await sql`ALTER TABLE users ENABLE ROW LEVEL SECURITY;`;
  await sql`ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;`;
  await sql`ALTER TABLE vehicle_listings ENABLE ROW LEVEL SECURITY;`;
  await sql`ALTER TABLE user_documents ENABLE ROW LEVEL SECURITY;`;
  await sql`ALTER TABLE intercity_trips ENABLE ROW LEVEL SECURITY;`;
  await sql`ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;`;
  await sql`ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;`;
  await sql`ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;`;

  // Drop existing policies if any to allow idempotent re-runs
  await sql`DROP POLICY IF EXISTS customer_profile_isolation ON users;`;
  await sql`DROP POLICY IF EXISTS bookings_multi_tenant_isolation ON bookings;`;
  await sql`DROP POLICY IF EXISTS vehicle_public_and_owner_isolation ON vehicle_listings;`;
  await sql`DROP POLICY IF EXISTS vehicle_owner_mutation_isolation ON vehicle_listings;`;
  await sql`DROP POLICY IF EXISTS user_documents_isolation ON user_documents;`;
  await sql`DROP POLICY IF EXISTS wishlists_user_isolation ON wishlists;`;
  await sql`DROP POLICY IF EXISTS reviews_public_read ON reviews;`;
  await sql`DROP POLICY IF EXISTS reviews_customer_insert ON reviews;`;
  await sql`DROP POLICY IF EXISTS notifications_user_isolation ON notifications;`;
  await sql`DROP POLICY IF EXISTS intercity_trips_public_read ON intercity_trips;`;
  await sql`DROP POLICY IF EXISTS intercity_trips_provider_mutation ON intercity_trips;`;

  // Wishlists RLS
  await sql`
    CREATE POLICY wishlists_user_isolation ON wishlists
      FOR ALL
      USING (
        user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
        OR current_setting('app.current_user_role', true) IN ('SUPER_ADMIN', 'INTERNAL_SYSTEM')
      );
  `;

  // Reviews RLS
  await sql`
    CREATE POLICY reviews_public_read ON reviews
      FOR SELECT
      USING (true);
  `;
  await sql`
    CREATE POLICY reviews_customer_insert ON reviews
      FOR INSERT
      WITH CHECK (
        customer_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
        OR current_setting('app.current_user_role', true) IN ('SUPER_ADMIN', 'INTERNAL_SYSTEM')
      );
  `;

  // Notifications RLS
  await sql`
    CREATE POLICY notifications_user_isolation ON notifications
      FOR ALL
      USING (
        user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
        OR current_setting('app.current_user_role', true) IN ('SUPER_ADMIN', 'INTERNAL_SYSTEM')
      );
  `;

  // Intercity Trips RLS
  await sql`
    CREATE POLICY intercity_trips_public_read ON intercity_trips
      FOR SELECT
      USING (
        status != 'CANCELLED'
        OR provider_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
        OR current_setting('app.current_user_role', true) IN ('SUPER_ADMIN', 'INTERNAL_SYSTEM')
      );
  `;
  await sql`
    CREATE POLICY intercity_trips_provider_mutation ON intercity_trips
      FOR ALL
      USING (
        provider_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
        OR current_setting('app.current_user_role', true) IN ('SUPER_ADMIN', 'INTERNAL_SYSTEM')
      );
  `;

  // 1. Users table RLS
  await sql`
    CREATE POLICY customer_profile_isolation ON users
      FOR ALL
      USING (
        id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
        OR current_setting('app.current_user_role', true) IN ('SUPER_ADMIN', 'INTERNAL_SYSTEM')
      );
  `;

  // 2. Bookings table RLS
  await sql`
    CREATE POLICY bookings_multi_tenant_isolation ON bookings
      FOR ALL
      USING (
        customer_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
        OR lister_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
        OR driver_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
        OR current_setting('app.current_user_role', true) IN ('SUPER_ADMIN', 'AGENT', 'INTERNAL_SYSTEM')
      );
  `;

  // 3. Vehicle Listings table RLS
  await sql`
    CREATE POLICY vehicle_public_and_owner_isolation ON vehicle_listings
      FOR SELECT
      USING (
        (is_paused = FALSE)
        OR (owner_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid)
        OR current_setting('app.current_user_role', true) IN ('SUPER_ADMIN', 'AGENT', 'INTERNAL_SYSTEM')
      );
  `;

  await sql`
    CREATE POLICY vehicle_owner_mutation_isolation ON vehicle_listings
      FOR ALL
      USING (
        owner_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
        OR current_setting('app.current_user_role', true) IN ('SUPER_ADMIN', 'INTERNAL_SYSTEM')
      );
  `;

  // 4. User Documents table RLS
  await sql`
    CREATE POLICY user_documents_isolation ON user_documents
      FOR ALL
      USING (
        user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
        OR current_setting('app.current_user_role', true) IN ('SUPER_ADMIN', 'AGENT', 'INTERNAL_SYSTEM')
      );
  `;

  console.log('✅ Enterprise Schema & Neon RLS successfully deployed!');
}

deploySchema()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Schema deployment error:', err);
    process.exit(1);
  });

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function run() {
  const users = await sql`SELECT id, phone, email, full_name, business_name, role, city FROM users;`;
  console.log('Current users count:', users.length);
  console.log('Current users:', users);

  const listings = await sql`SELECT id, owner_id, title, city, daily_rate_pkr, is_paused FROM vehicle_listings;`;
  console.log('Current listings count:', listings.length);
  console.log('Current listings:', listings);
}

run().catch(console.error);

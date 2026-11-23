import { neon } from '@neondatabase/serverless';

async function check() {
  const sql = neon(process.env.DATABASE_URL);
  const users = await sql`SELECT id, phone, email, "userType", "passwordHash", metadata, "createdAt" FROM "User"`;
  console.log('Current DB Users Count:', users.length);
  console.log('Users in Neon DB:', JSON.stringify(users, null, 2));
}

check().catch(console.error);


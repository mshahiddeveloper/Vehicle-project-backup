import { neon } from '@neondatabase/serverless';

async function check() {
  const sql = neon(process.env.DATABASE_URL);
  const countries = await sql`SELECT id, code, name, status FROM "Country"`;
  console.log('Countries in Neon DB:', countries);

  const users = await sql`
    SELECT u.id, u.phone, u.email, u."userType", u."passwordHash", u.metadata, u."createdAt",
           cp."firstName" as cp_first, cp."lastName" as cp_last
    FROM "User" u
    LEFT JOIN "CustomerProfile" cp ON cp."userId" = u.id
    ORDER BY u."createdAt" DESC
  `;
  console.log('Current DB Users Count:', users.length);
  console.log('Latest 5 Users in Neon DB:', JSON.stringify(users.slice(0, 5), null, 2));
}

check().catch(console.error);

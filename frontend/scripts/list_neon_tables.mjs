import { neon } from '@neondatabase/serverless';

async function listAll() {
  const sql = neon(process.env.DATABASE_URL);
  const tables = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `;
  console.log('Total Tables in Neon:', tables.length);
  console.log(tables.map(t => t.table_name));
}

listAll().catch(console.error);


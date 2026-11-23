import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function run() {
  const userCols = await sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'users' 
    ORDER BY ordinal_position;
  `;
  console.log('users columns:', userCols.map(c => `${c.column_name} (${c.data_type})`));

  const vehCols = await sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'vehicle_listings' 
    ORDER BY ordinal_position;
  `;
  console.log('vehicle_listings columns:', vehCols.map(c => `${c.column_name} (${c.data_type})`));
}

run().catch(console.error);

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function run() {
  const pCols = await sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'subscription_plans' 
    ORDER BY ordinal_position;
  `;
  console.log('subscription_plans columns:', pCols.map(c => `${c.column_name} (${c.data_type})`));

  const uCols = await sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'user_subscriptions' 
    ORDER BY ordinal_position;
  `;
  console.log('user_subscriptions columns:', uCols.map(c => `${c.column_name} (${c.data_type})`));
}

run().catch(console.error);

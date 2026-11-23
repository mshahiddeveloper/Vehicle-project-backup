import { neon, neonConfig } from '@neondatabase/serverless';
import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

neonConfig.disableWarningInBrowsers = true;

// 1. Neon PostgreSQL Live Query Test
async function testPostgres() {
  console.log('=== 1. Testing Neon Lakebase Postgres (Live Query) ===');
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('DATABASE_URL not set');

  const sql = neon(dbUrl);
  const versionRes = await sql`SELECT version() as pg_version, current_database() as db_name, current_user as db_user`;
  console.log('Postgres Version:', versionRes[0].pg_version);
  console.log('Connected Database:', versionRes[0].db_name);
  console.log('Connected User:', versionRes[0].db_user);

  const tablesRes = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name 
    LIMIT 10
  `;
  console.log('Pushed Prisma Tables in Neon (sample):', tablesRes.map(t => t.table_name));

  const countRes = await sql`SELECT count(*)::int as count FROM information_schema.tables WHERE table_schema = 'public'`;
  console.log('Total Pushed Schema Tables:', countRes[0].count);
}

// 2. Neon Object Storage Live S3 Upload & Presigned URL Test
async function testObjectStorage() {
  console.log('\n=== 2. Testing Neon Object Storage (Live S3 Bucket) ===');
  const s3 = new S3Client({
    endpoint: process.env.AWS_ENDPOINT_URL_S3,
    region: process.env.AWS_REGION || 'ap-southeast-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    forcePathStyle: true,
  });

  const bucket = process.env.NEON_OBJECT_STORAGE_BUCKET || 'assets';
  const testKey = `verification/neon_ping_${Date.now()}.txt`;
  const content = `SafarPK Neon Object Storage Verification at ${new Date().toISOString()}`;

  console.log(`Uploading test object to bucket "${bucket}" with key "${testKey}"...`);
  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: testKey,
    Body: Buffer.from(content),
    ContentType: 'text/plain',
  }));
  console.log('Upload successful!');

  // Presigned URL
  const presigned = await getSignedUrl(s3, new GetObjectCommand({
    Bucket: bucket,
    Key: testKey,
  }), { expiresIn: 300 });
  console.log('Presigned Download URL:', presigned);

  // List objects
  const listRes = await s3.send(new ListObjectsV2Command({
    Bucket: bucket,
    MaxKeys: 5,
  }));
  console.log('Objects in bucket (count):', listRes.KeyCount);
  console.log('Object Keys in bucket:', listRes.Contents?.map(c => c.Key));
}

async function run() {
  try {
    await testPostgres();
    await testObjectStorage();
    console.log('\n>>> ALL NEON SERVICES VERIFIED END-TO-END! <<<');
    process.exit(0);
  } catch (err) {
    console.error('Neon test failed:', err);
    process.exit(1);
  }
}

run();

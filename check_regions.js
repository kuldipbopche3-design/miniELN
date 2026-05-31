const { Client } = require('pg');

const regions = [
  'ap-south-1',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-northeast-1',
  'ap-northeast-2',
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'eu-central-1',
  'ca-central-1',
  'sa-east-1'
];

async function tryRegion(region) {
  const host = `aws-0-${region}.pooler.supabase.com`;
  const connectionString = `postgresql://postgres.mbepkdmrownxkmpzkcqn:Kuldeep%40Wab%26Youtuber%232027@${host}:6543/postgres`;
  const client = new Client({
    connectionString,
    connectionTimeoutMillis: 3000,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log(`\n🎉 SUCCESS: Connected to region ${region}!`);
    await client.end();
    return true;
  } catch (err) {
    if (err.message.includes('tenant/user') && err.message.includes('not found')) {
      // Expected mismatch error
      process.stdout.write(`.`);
    } else {
      console.log(`\nRegion ${region} failed with unique error:`, err.message);
    }
    return false;
  }
}

async function run() {
  console.log('Testing regions...');
  for (const region of regions) {
    const success = await tryRegion(region);
    if (success) {
      break;
    }
  }
  console.log('\nDone.');
}

run();

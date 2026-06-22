import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '/root/dokan/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Service key length:', serviceKey?.length ?? 0);

const migration = fs.readFileSync('/root/dokan/supabase/migrations/006_performance.sql', 'utf8');

async function main() {
  // Try the Management API
  const mgmtResp = await fetch('https://api.supabase.com/v1/projects/ljgkmciasakdmfwuvckv/database/query', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceKey}`
    },
    body: JSON.stringify({ query: migration })
  });
  
  console.log('Mgmt API status:', mgmtResp.status);
  const text = await mgmtResp.text();
  console.log('Response:', text.substring(0, 800));
}

main().catch(console.error);
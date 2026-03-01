/**
 * Creates the first admin user ianktoo@gmail.com in Supabase Auth and public.profiles.
 * Run once: node supabase/scripts/seed-admin.mjs
 * Requires: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local or env.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', '..');
for (const name of ['.env.local', '.env']) {
  const envPath = join(root, name);
  if (existsSync(envPath)) {
    readFileSync(envPath, 'utf8').split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const idx = trimmed.indexOf('=');
        if (idx > 0) {
          const k = trimmed.slice(0, idx).trim();
          let v = trimmed.slice(idx + 1).trim();
          if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
            v = v.slice(1, -1);
          process.env[k] = v;
        }
      }
    });
    break;
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Set in .env.local or env.');
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const ADMIN_EMAIL = 'ianktoo@gmail.com';

async function main() {
  const { data: existing } = await supabase.auth.admin.listUsers();
  const found = existing?.users?.find((u) => u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase());
  let userId;
  if (found) {
    userId = found.id;
    console.log('Admin user already exists:', ADMIN_EMAIL, userId);
  } else {
    const { data: { user }, error } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      email_confirm: true,
    });
    if (error) {
      console.error('Failed to create auth user:', error.message);
      process.exit(1);
    }
    userId = user.id;
    console.log('Created auth user:', ADMIN_EMAIL, userId);
  }

  const { error: profileError } = await supabase.from('profiles').upsert(
    { id: userId, role: 'admin', display_name: 'Admin', access_status: 'customer' },
    { onConflict: 'id' }
  );
  if (profileError) {
    console.error('Failed to upsert profile:', profileError.message);
    process.exit(1);
  }
  console.log('Admin profile set. ianktoo@gmail.com can sign in with OTP and access /admin.');
}

main();

import { createClient } from '@supabase/supabase-js';

let client = null;

export function getSupabase(url, key) {
  if (!url || !key) return null;
  if (client?.supabaseUrl === url) return client;
  client = createClient(url, key);
  return client;
}

export function getUserId() {
  let id = localStorage.getItem('autoledger-user-id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('autoledger-user-id', id);
  }
  return id;
}

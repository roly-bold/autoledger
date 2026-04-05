import { createClient } from '@supabase/supabase-js';

let client = null;
let cachedUrl = null;

export function getSupabase(url, key) {
  if (!url || !key) return null;
  if (client && cachedUrl === url) return client;
  cachedUrl = url;
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

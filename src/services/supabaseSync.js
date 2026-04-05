import { getSupabase, getUserId } from './supabaseClient';

function getClient(settings) {
  return getSupabase(settings.supabaseUrl, settings.supabaseKey);
}

export async function pullAll(settings) {
  const sb = getClient(settings);
  if (!sb) return null;
  const userId = getUserId();

  const [txRes, catRes, budRes, setRes] = await Promise.all([
    sb.from('transactions').select('*').eq('user_id', userId),
    sb.from('categories').select('*').eq('user_id', userId),
    sb.from('budgets').select('*').eq('user_id', userId),
    sb.from('user_settings').select('*').eq('user_id', userId).single(),
  ]);

  return {
    transactions: txRes.data || [],
    categories: catRes.data || [],
    budgets: budRes.data || [],
    settings: setRes.data?.data || null,
  };
}

async function pushEntities(table, items, settings) {
  const sb = getClient(settings);
  if (!sb) return;
  const userId = getUserId();
  const rows = items.map((item) => ({ id: item.id, user_id: userId, data: item }));
  const { error } = await sb.from(table).upsert(rows, { onConflict: 'id' });
  if (error) console.warn(`sync ${table} error:`, error.message);
}

async function deleteEntity(table, id, settings) {
  const sb = getClient(settings);
  if (!sb) return;
  await sb.from(table).delete().eq('id', id);
}

export const pushTransactions = (items, settings) => pushEntities('transactions', items, settings);
export const pushCategories = (items, settings) => pushEntities('categories', items, settings);
export const pushBudgets = (items, settings) => pushEntities('budgets', items, settings);

export const deleteTransaction = (id, settings) => deleteEntity('transactions', id, settings);
export const deleteCategory = (id, settings) => deleteEntity('categories', id, settings);
export const deleteBudget = (id, settings) => deleteEntity('budgets', id, settings);

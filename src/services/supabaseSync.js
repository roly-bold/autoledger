import { getSupabase, getUserId } from './supabaseClient';

function getClient(settings) {
  return getSupabase(settings.supabaseUrl, settings.supabaseKey);
}

function uid() {
  return getUserId();
}

export async function pullAll(settings) {
  const sb = getClient(settings);
  if (!sb) return null;
  const userId = uid();

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

export async function pushTransactions(transactions, settings) {
  const sb = getClient(settings);
  if (!sb) return;
  const userId = uid();

  const rows = transactions.map((t) => ({
    id: t.id,
    user_id: userId,
    data: t,
  }));

  const { error } = await sb.from('transactions').upsert(rows, { onConflict: 'id' });
  if (error) console.warn('sync transactions error:', error.message);
}

export async function pushCategories(categories, settings) {
  const sb = getClient(settings);
  if (!sb) return;
  const userId = uid();

  const rows = categories.map((c) => ({
    id: c.id,
    user_id: userId,
    data: c,
  }));

  const { error } = await sb.from('categories').upsert(rows, { onConflict: 'id' });
  if (error) console.warn('sync categories error:', error.message);
}

export async function pushBudgets(budgets, settings) {
  const sb = getClient(settings);
  if (!sb) return;
  const userId = uid();

  const rows = budgets.map((b) => ({
    id: b.id,
    user_id: userId,
    data: b,
  }));

  const { error } = await sb.from('budgets').upsert(rows, { onConflict: 'id' });
  if (error) console.warn('sync budgets error:', error.message);
}

export async function pushSettings(settingsData, settings) {
  const sb = getClient(settings);
  if (!sb) return;
  const userId = uid();

  const { error } = await sb.from('user_settings').upsert({
    user_id: userId,
    data: { ...settingsData, supabaseKey: '' },
  }, { onConflict: 'user_id' });
  if (error) console.warn('sync settings error:', error.message);
}

export async function deleteTransaction(id, settings) {
  const sb = getClient(settings);
  if (!sb) return;
  await sb.from('transactions').delete().eq('id', id);
}

export async function deleteCategory(id, settings) {
  const sb = getClient(settings);
  if (!sb) return;
  await sb.from('categories').delete().eq('id', id);
}

export async function deleteBudget(id, settings) {
  const sb = getClient(settings);
  if (!sb) return;
  await sb.from('budgets').delete().eq('id', id);
}

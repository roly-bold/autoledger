import { STORAGE_KEYS, DEFAULT_SETTINGS } from '../utils/constants';
import { ALL_PRESET_CATEGORIES } from '../data/presetCategories';

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

export function loadTransactions() {
  return readJSON(STORAGE_KEYS.TRANSACTIONS, []);
}

export function saveTransactions(transactions) {
  writeJSON(STORAGE_KEYS.TRANSACTIONS, transactions);
}

export function loadCategories() {
  const saved = readJSON(STORAGE_KEYS.CATEGORIES, null);
  if (saved) return saved;
  writeJSON(STORAGE_KEYS.CATEGORIES, ALL_PRESET_CATEGORIES);
  return ALL_PRESET_CATEGORIES;
}

export function saveCategories(categories) {
  writeJSON(STORAGE_KEYS.CATEGORIES, categories);
}

export function loadBudgets() {
  return readJSON(STORAGE_KEYS.BUDGETS, []);
}

export function saveBudgets(budgets) {
  writeJSON(STORAGE_KEYS.BUDGETS, budgets);
}

export function loadSettings() {
  return readJSON(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
}

export function saveSettings(settings) {
  writeJSON(STORAGE_KEYS.SETTINGS, settings);
}

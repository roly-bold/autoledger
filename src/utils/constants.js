export const STORAGE_KEYS = {
  TRANSACTIONS: 'autoledger-transactions',
  CATEGORIES: 'autoledger-categories',
  BUDGETS: 'autoledger-budgets',
  SETTINGS: 'autoledger-settings',
};

export const DEFAULT_SETTINGS = {
  aiApiKey: '',
  aiApiEndpoint: 'https://api.openai.com/v1/chat/completions',
  aiModel: 'gpt-3.5-turbo',
  defaultTransactionType: 'expense',
  supabaseUrl: '',
  supabaseKey: '',
};

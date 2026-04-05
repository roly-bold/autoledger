let _sortOrder = 0;
const nextOrder = () => _sortOrder++;

export const PRESET_EXPENSE_CATEGORIES = [
  { id: 'cat-food', name: '餐饮', icon: '🍜', color: '#FF6B6B', type: 'expense', isPreset: true, sortOrder: nextOrder() },
  { id: 'cat-transport', name: '交通', icon: '🚌', color: '#4ECDC4', type: 'expense', isPreset: true, sortOrder: nextOrder() },
  { id: 'cat-shopping', name: '购物', icon: '🛍️', color: '#45B7D1', type: 'expense', isPreset: true, sortOrder: nextOrder() },
  { id: 'cat-entertainment', name: '娱乐', icon: '🎬', color: '#96CEB4', type: 'expense', isPreset: true, sortOrder: nextOrder() },
  { id: 'cat-housing', name: '居住', icon: '🏠', color: '#FECA57', type: 'expense', isPreset: true, sortOrder: nextOrder() },
  { id: 'cat-medical', name: '医疗', icon: '💊', color: '#DDA0DD', type: 'expense', isPreset: true, sortOrder: nextOrder() },
  { id: 'cat-education', name: '教育', icon: '📚', color: '#87CEEB', type: 'expense', isPreset: true, sortOrder: nextOrder() },
  { id: 'cat-telecom', name: '通讯', icon: '📱', color: '#98D8C8', type: 'expense', isPreset: true, sortOrder: nextOrder() },
  { id: 'cat-clothing', name: '服饰', icon: '👔', color: '#F7DC6F', type: 'expense', isPreset: true, sortOrder: nextOrder() },
  { id: 'cat-daily', name: '日用', icon: '🧴', color: '#BB8FCE', type: 'expense', isPreset: true, sortOrder: nextOrder() },
  { id: 'cat-social', name: '社交', icon: '🎉', color: '#F1948A', type: 'expense', isPreset: true, sortOrder: nextOrder() },
  { id: 'cat-travel', name: '旅行', icon: '✈️', color: '#82E0AA', type: 'expense', isPreset: true, sortOrder: nextOrder() },
  { id: 'cat-pet', name: '宠物', icon: '🐱', color: '#F0B27A', type: 'expense', isPreset: true, sortOrder: nextOrder() },
  { id: 'cat-other-expense', name: '其他', icon: '📌', color: '#AEB6BF', type: 'expense', isPreset: true, sortOrder: nextOrder() },
];

export const PRESET_INCOME_CATEGORIES = [
  { id: 'cat-salary', name: '工资', icon: '💰', color: '#2ECC71', type: 'income', isPreset: true, sortOrder: nextOrder() },
  { id: 'cat-freelance', name: '兼职', icon: '💼', color: '#3498DB', type: 'income', isPreset: true, sortOrder: nextOrder() },
  { id: 'cat-investment', name: '投资', icon: '📈', color: '#E74C3C', type: 'income', isPreset: true, sortOrder: nextOrder() },
  { id: 'cat-redpacket', name: '红包', icon: '🧧', color: '#E67E22', type: 'income', isPreset: true, sortOrder: nextOrder() },
  { id: 'cat-other-income', name: '其他收入', icon: '💎', color: '#1ABC9C', type: 'income', isPreset: true, sortOrder: nextOrder() },
];

export const ALL_PRESET_CATEGORIES = [
  ...PRESET_EXPENSE_CATEGORIES,
  ...PRESET_INCOME_CATEGORIES,
];

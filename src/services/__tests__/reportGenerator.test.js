import { describe, it, expect } from 'vitest';
import {
  getMonthTransactions,
  getMonthSummary,
  getCategoryBreakdown,
  getDailyTrend,
  getBudgetComparison,
  getMoMComparison,
  detectAnomalies,
} from '../reportGenerator';

const CATEGORIES = [
  { id: 'cat-food', name: '餐饮', icon: '🍜', color: '#FF6B6B', type: 'expense' },
  { id: 'cat-transport', name: '交通', icon: '🚌', color: '#4ECDC4', type: 'expense' },
  { id: 'cat-salary', name: '工资', icon: '💰', color: '#2ECC71', type: 'income' },
];

function tx(overrides) {
  return {
    id: Math.random().toString(36).slice(2),
    amount: 100,
    note: '',
    type: 'expense',
    date: '2026-04-10',
    categoryId: 'cat-food',
    isConfirmed: true,
    ...overrides,
  };
}

describe('getMonthTransactions', () => {
  it('filters by year and month', () => {
    const data = [
      tx({ date: '2026-04-05' }),
      tx({ date: '2026-03-28' }),
      tx({ date: '2026-04-20' }),
    ];
    expect(getMonthTransactions(data, 2026, 4)).toHaveLength(2);
  });

  it('excludes unconfirmed', () => {
    const data = [
      tx({ date: '2026-04-05' }),
      tx({ date: '2026-04-06', isConfirmed: false }),
    ];
    expect(getMonthTransactions(data, 2026, 4)).toHaveLength(1);
  });

  it('returns empty for no matches', () => {
    expect(getMonthTransactions([tx({ date: '2025-01-01' })], 2026, 4)).toHaveLength(0);
  });
});

describe('getMonthSummary', () => {
  it('sums income and expense', () => {
    const data = [
      tx({ amount: 50, type: 'expense' }),
      tx({ amount: 30, type: 'expense' }),
      tx({ amount: 200, type: 'income' }),
    ];
    const s = getMonthSummary(data);
    expect(s.expense).toBe(80);
    expect(s.income).toBe(200);
    expect(s.balance).toBe(120);
    expect(s.count).toBe(3);
  });

  it('handles empty array', () => {
    const s = getMonthSummary([]);
    expect(s).toEqual({ income: 0, expense: 0, balance: 0, count: 0 });
  });

  it('rounds to 2 decimal places', () => {
    const data = [
      tx({ amount: 10.111, type: 'expense' }),
      tx({ amount: 10.119, type: 'expense' }),
    ];
    const s = getMonthSummary(data);
    expect(s.expense).toBe(20.23);
  });
});

describe('getCategoryBreakdown', () => {
  it('groups expense by category', () => {
    const data = [
      tx({ amount: 50, categoryId: 'cat-food' }),
      tx({ amount: 30, categoryId: 'cat-food' }),
      tx({ amount: 20, categoryId: 'cat-transport' }),
    ];
    const bd = getCategoryBreakdown(data, CATEGORIES);
    expect(bd).toHaveLength(2);
    expect(bd[0].categoryId).toBe('cat-food');
    expect(bd[0].amount).toBe(80);
    expect(bd[1].amount).toBe(20);
  });

  it('excludes income transactions', () => {
    const data = [
      tx({ amount: 100, type: 'income', categoryId: 'cat-salary' }),
      tx({ amount: 50, type: 'expense', categoryId: 'cat-food' }),
    ];
    const bd = getCategoryBreakdown(data, CATEGORIES);
    expect(bd).toHaveLength(1);
    expect(bd[0].categoryId).toBe('cat-food');
  });

  it('handles uncategorized transactions', () => {
    const data = [tx({ amount: 25, categoryId: null })];
    const bd = getCategoryBreakdown(data, CATEGORIES);
    expect(bd[0].name).toBe('未分类');
  });

  it('sorted descending by amount', () => {
    const data = [
      tx({ amount: 10, categoryId: 'cat-food' }),
      tx({ amount: 50, categoryId: 'cat-transport' }),
    ];
    const bd = getCategoryBreakdown(data, CATEGORIES);
    expect(bd[0].categoryId).toBe('cat-transport');
  });
});

describe('getDailyTrend', () => {
  it('returns correct number of days', () => {
    const trend = getDailyTrend([], 2026, 4);
    expect(trend).toHaveLength(30);
  });

  it('returns 31 days for January', () => {
    expect(getDailyTrend([], 2026, 1)).toHaveLength(31);
  });

  it('aggregates amounts by day', () => {
    const data = [
      tx({ amount: 40, date: '2026-04-05', type: 'expense' }),
      tx({ amount: 60, date: '2026-04-05', type: 'expense' }),
      tx({ amount: 200, date: '2026-04-05', type: 'income' }),
    ];
    const trend = getDailyTrend(data, 2026, 4);
    const day5 = trend[4];
    expect(day5.expense).toBe(100);
    expect(day5.income).toBe(200);
  });

  it('days without transactions are zero', () => {
    const trend = getDailyTrend([tx({ date: '2026-04-01' })], 2026, 4);
    expect(trend[1].expense).toBe(0);
    expect(trend[1].income).toBe(0);
  });
});

describe('getBudgetComparison', () => {
  it('calculates spent vs limit', () => {
    const budgets = [{ id: 'b1', year: 2026, month: 4, monthlyLimit: 500, categoryId: 'cat-food' }];
    const data = [
      tx({ amount: 120, categoryId: 'cat-food' }),
      tx({ amount: 80, categoryId: 'cat-food' }),
    ];
    const result = getBudgetComparison(budgets, data, CATEGORIES, 2026, 4);
    expect(result).toHaveLength(1);
    expect(result[0].spent).toBe(200);
    expect(result[0].limit).toBe(500);
    expect(result[0].percent).toBe(40);
  });

  it('returns empty when no budgets for month', () => {
    const budgets = [{ id: 'b1', year: 2026, month: 3, monthlyLimit: 500, categoryId: 'cat-food' }];
    expect(getBudgetComparison(budgets, [], CATEGORIES, 2026, 4)).toHaveLength(0);
  });

  it('handles over-budget percentage', () => {
    const budgets = [{ id: 'b1', year: 2026, month: 4, monthlyLimit: 100, categoryId: 'cat-food' }];
    const data = [tx({ amount: 150, categoryId: 'cat-food' })];
    const result = getBudgetComparison(budgets, data, CATEGORIES, 2026, 4);
    expect(result[0].percent).toBe(150);
  });
});

describe('getMoMComparison', () => {
  it('calculates change percentages', () => {
    const marchTx = [
      tx({ date: '2026-03-10', amount: 200, type: 'expense' }),
      tx({ date: '2026-03-15', amount: 100, type: 'income' }),
    ];
    const aprilTx = [
      tx({ date: '2026-04-10', amount: 300, type: 'expense' }),
      tx({ date: '2026-04-15', amount: 200, type: 'income' }),
    ];
    const allTx = [...marchTx, ...aprilTx];
    const currentMonth = getMonthTransactions(allTx, 2026, 4);
    const result = getMoMComparison(currentMonth, allTx, CATEGORIES, 2026, 4);
    expect(result.expenseChange).toBe(50);
    expect(result.incomeChange).toBe(100);
  });

  it('returns 0 when no previous data', () => {
    const data = [tx({ date: '2026-04-10', amount: 100 })];
    const currentMonth = getMonthTransactions(data, 2026, 4);
    const result = getMoMComparison(currentMonth, data, CATEGORIES, 2026, 4);
    expect(result.expenseChange).toBe(0);
    expect(result.incomeChange).toBe(0);
  });

  it('handles January correctly (wraps to December)', () => {
    const decTx = [tx({ date: '2025-12-10', amount: 100 })];
    const janTx = [tx({ date: '2026-01-10', amount: 150 })];
    const allTx = [...decTx, ...janTx];
    const currentMonth = getMonthTransactions(allTx, 2026, 1);
    const result = getMoMComparison(currentMonth, allTx, CATEGORIES, 2026, 1);
    expect(result.expenseChange).toBe(50);
  });
});

describe('detectAnomalies', () => {
  it('detects 50%+ increase vs 3-month average', () => {
    const prev = [
      tx({ date: '2026-01-10', amount: 100, categoryId: 'cat-food' }),
      tx({ date: '2026-02-10', amount: 100, categoryId: 'cat-food' }),
      tx({ date: '2026-03-10', amount: 100, categoryId: 'cat-food' }),
    ];
    const current = [tx({ date: '2026-04-10', amount: 200, categoryId: 'cat-food' })];
    const allTx = [...prev, ...current];
    const monthTx = getMonthTransactions(allTx, 2026, 4);
    const anomalies = detectAnomalies(monthTx, allTx, CATEGORIES, 2026, 4);
    expect(anomalies).toHaveLength(1);
    expect(anomalies[0].categoryId).toBe('cat-food');
    expect(anomalies[0].changePercent).toBe(100);
  });

  it('no anomaly when increase below 50%', () => {
    const prev = [
      tx({ date: '2026-01-10', amount: 100, categoryId: 'cat-food' }),
      tx({ date: '2026-02-10', amount: 100, categoryId: 'cat-food' }),
      tx({ date: '2026-03-10', amount: 100, categoryId: 'cat-food' }),
    ];
    const current = [tx({ date: '2026-04-10', amount: 120, categoryId: 'cat-food' })];
    const allTx = [...prev, ...current];
    const monthTx = getMonthTransactions(allTx, 2026, 4);
    const anomalies = detectAnomalies(monthTx, allTx, CATEGORIES, 2026, 4);
    expect(anomalies).toHaveLength(0);
  });

  it('no anomaly when no previous data', () => {
    const current = [tx({ date: '2026-04-10', amount: 500, categoryId: 'cat-food' })];
    const anomalies = detectAnomalies(current, current, CATEGORIES, 2026, 4);
    expect(anomalies).toHaveLength(0);
  });
});

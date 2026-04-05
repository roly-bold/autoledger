export function getMonthTransactions(transactions, year, month) {
  return transactions.filter((t) => {
    if (!t.isConfirmed) return false;
    const d = new Date(t.date);
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  });
}

export function getCategoryBreakdown(transactions, categories) {
  const map = {};
  for (const t of transactions) {
    if (t.type !== 'expense') continue;
    const key = t.categoryId || 'uncategorized';
    if (!map[key]) map[key] = 0;
    map[key] += t.amount;
  }

  return Object.entries(map)
    .map(([categoryId, amount]) => {
      const cat = categories.find((c) => c.id === categoryId);
      return {
        categoryId,
        name: cat?.name || '未分类',
        icon: cat?.icon || '📌',
        color: cat?.color || '#AEB6BF',
        amount: Math.round(amount * 100) / 100,
      };
    })
    .sort((a, b) => b.amount - a.amount);
}

export function getDailyTrend(transactions, year, month) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const daily = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    label: `${month}/${i + 1}`,
    expense: 0,
    income: 0,
  }));

  for (const t of transactions) {
    const d = new Date(t.date);
    const idx = d.getDate() - 1;
    if (idx >= 0 && idx < daily.length) {
      if (t.type === 'expense') daily[idx].expense += t.amount;
      else daily[idx].income += t.amount;
    }
  }

  return daily.map((d) => ({
    ...d,
    expense: Math.round(d.expense * 100) / 100,
    income: Math.round(d.income * 100) / 100,
  }));
}

export function getMonthSummary(transactions) {
  let income = 0;
  let expense = 0;
  for (const t of transactions) {
    if (t.type === 'income') income += t.amount;
    else expense += t.amount;
  }
  return {
    income: Math.round(income * 100) / 100,
    expense: Math.round(expense * 100) / 100,
    balance: Math.round((income - expense) * 100) / 100,
    count: transactions.length,
  };
}

export function getBudgetComparison(budgets, transactions, categories, year, month) {
  const monthBudgets = budgets.filter((b) => b.year === year && b.month === month);
  return monthBudgets.map((b) => {
    const cat = categories.find((c) => c.id === b.categoryId);
    const spent = transactions
      .filter((t) => t.type === 'expense' && t.categoryId === b.categoryId)
      .reduce((sum, t) => sum + t.amount, 0);
    return {
      id: b.id,
      categoryId: b.categoryId,
      name: cat?.name || '总预算',
      icon: cat?.icon || '💰',
      limit: b.monthlyLimit,
      spent: Math.round(spent * 100) / 100,
      percent: b.monthlyLimit > 0 ? Math.round((spent / b.monthlyLimit) * 100) : 0,
    };
  });
}

export function getMoMComparison(transactions, allTransactions, categories, year, month) {
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prevTransactions = getMonthTransactions(allTransactions, prevYear, prevMonth);

  const current = getMonthSummary(transactions);
  const previous = getMonthSummary(prevTransactions);

  const expenseChange = previous.expense > 0
    ? Math.round(((current.expense - previous.expense) / previous.expense) * 100)
    : 0;
  const incomeChange = previous.income > 0
    ? Math.round(((current.income - previous.income) / previous.income) * 100)
    : 0;

  return { current, previous, expenseChange, incomeChange };
}

export function detectAnomalies(transactions, allTransactions, categories, year, month) {
  const anomalies = [];
  const breakdown = getCategoryBreakdown(transactions, categories);

  for (const item of breakdown) {
    let prevTotal = 0;
    let prevCount = 0;
    for (let i = 1; i <= 3; i++) {
      const pm = month - i <= 0 ? month - i + 12 : month - i;
      const py = month - i <= 0 ? year - 1 : year;
      const pt = getMonthTransactions(allTransactions, py, pm);
      const pAmount = pt
        .filter((t) => t.type === 'expense' && t.categoryId === item.categoryId)
        .reduce((s, t) => s + t.amount, 0);
      if (pAmount > 0) {
        prevTotal += pAmount;
        prevCount++;
      }
    }

    if (prevCount === 0) continue;
    const avg = prevTotal / prevCount;
    const change = ((item.amount - avg) / avg) * 100;
    if (change >= 50) {
      anomalies.push({
        ...item,
        avgPrevious: Math.round(avg * 100) / 100,
        changePercent: Math.round(change),
      });
    }
  }

  return anomalies;
}

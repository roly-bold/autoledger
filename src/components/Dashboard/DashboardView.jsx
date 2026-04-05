import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { getMonthTransactions, getMonthSummary, getBudgetComparison } from '../../services/reportGenerator';
import { formatMoney } from '../../utils/formatters';

export default function DashboardView({ onNavigate }) {
  const { state, dispatch, ActionTypes } = useApp();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const today = now.toISOString().slice(0, 10);

  const monthTx = getMonthTransactions(state.transactions, year, month);
  const summary = getMonthSummary(monthTx);
  const budgets = getBudgetComparison(state.budgets, monthTx, state.categories, year, month);
  const pending = state.transactions.filter((t) => !t.isConfirmed);

  const todayTx = monthTx.filter((t) => t.date === today);
  const todaySummary = getMonthSummary(todayTx);

  const recentTx = state.transactions
    .filter((t) => t.isConfirmed)
    .slice(0, 8);

  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const handleDelete = (id) => {
    dispatch({ type: ActionTypes.DELETE_TRANSACTION, payload: id });
    setConfirmDeleteId(null);
  };

  const getCategoryInfo = (id) => state.categories.find((c) => c.id === id);

  return (
    <div className="page-view">
      <h2 className="page-title">AutoLedger</h2>
      <p className="page-subtitle">{year}年{month}月</p>

      {pending.length > 0 && (
        <button className="pending-banner" onClick={() => onNavigate('pending')}>
          <span className="pending-dot" />
          {pending.length} 条待确认记录
        </button>
      )}

      <div className="summary-cards">
        <div className="summary-card">
          <span className="summary-label">今日支出</span>
          <span className="summary-value expense">¥{formatMoney(todaySummary.expense)}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">今日收入</span>
          <span className="summary-value income">¥{formatMoney(todaySummary.income)}</span>
        </div>
      </div>

      <div className="summary-cards triple">
        <div className="summary-card">
          <span className="summary-label">本月支出</span>
          <span className="summary-value expense">¥{formatMoney(summary.expense)}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">本月收入</span>
          <span className="summary-value income">¥{formatMoney(summary.income)}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">结余</span>
          <span className={`summary-value ${summary.balance >= 0 ? 'income' : 'expense'}`}>
            ¥{formatMoney(summary.balance)}
          </span>
        </div>
      </div>

      {budgets.length > 0 && (
        <div className="section-block">
          <h3 className="section-label">预算进度</h3>
          {budgets.map((b) => (
            <div key={b.id} className="budget-bar-wrap">
              <div className="budget-bar-head">
                <span>{b.icon} {b.name}</span>
                <span>¥{formatMoney(b.spent)} / ¥{formatMoney(b.limit)}</span>
              </div>
              <div className="budget-bar">
                <div
                  className={`budget-bar-fill ${b.percent > 100 ? 'over' : b.percent > 80 ? 'warn' : ''}`}
                  style={{ width: `${Math.min(b.percent, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="section-block">
        <h3 className="section-label">最近记录</h3>
        {recentTx.length === 0 ? (
          <div className="empty-state">
            <p>还没有记录</p>
            <button className="btn btn-primary" onClick={() => onNavigate('add')}>记一笔</button>
          </div>
        ) : (
          <div className="tx-list">
            {recentTx.map((tx) => {
              const cat = getCategoryInfo(tx.categoryId);
              return (
                <div key={tx.id} className="tx-item" onClick={() => setConfirmDeleteId(confirmDeleteId === tx.id ? null : tx.id)}>
                  <span className="tx-icon">{cat?.icon || '📌'}</span>
                  <div className="tx-info">
                    <span className="tx-note">{tx.note || cat?.name || '未分类'}</span>
                    <span className="tx-date">{tx.date}</span>
                  </div>
                  <span className={`tx-amount ${tx.type}`}>
                    {tx.type === 'income' ? '+' : '-'}¥{formatMoney(tx.amount)}
                  </span>
                  {confirmDeleteId === tx.id && (
                    <div className="parsed-actions" onClick={(e) => e.stopPropagation()}>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(tx.id)}>删除</button>
                      <button className="btn btn-sm btn-secondary" onClick={() => setConfirmDeleteId(null)}>取消</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { useApp } from '../../context/AppContext';
import {
  getMonthTransactions,
  getMonthSummary,
  getCategoryBreakdown,
  getDailyTrend,
  getBudgetComparison,
  getMoMComparison,
  detectAnomalies,
} from '../../services/reportGenerator';
import { exportReportAsPDF } from '../../services/pdfExporter';

function formatMoney(n) {
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function MonthlyReportView() {
  const { state } = useApp();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const monthTx = getMonthTransactions(state.transactions, year, month);
  const summary = getMonthSummary(monthTx);
  const breakdown = getCategoryBreakdown(monthTx, state.categories);
  const trend = getDailyTrend(monthTx, year, month);
  const budgets = getBudgetComparison(state.budgets, monthTx, state.categories, year, month);
  const mom = getMoMComparison(monthTx, state.transactions, state.categories, year, month);
  const anomalies = detectAnomalies(monthTx, state.transactions, state.categories, year, month);

  const prevMonth = () => {
    if (month === 1) { setYear(year - 1); setMonth(12); }
    else setMonth(month - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(year + 1); setMonth(1); }
    else setMonth(month + 1);
  };

  const handleExportPDF = () => {
    exportReportAsPDF({ year, month, summary, breakdown, budgets, anomalies, mom });
  };

  return (
    <div className="page-view report-view">
      <div className="report-header">
        <h2 className="page-title">月度报告</h2>
        <button className="btn btn-sm btn-secondary" onClick={handleExportPDF}>导出 PDF</button>
      </div>

      <div className="month-nav">
        <button className="btn btn-sm btn-secondary" onClick={prevMonth}>&lt;</button>
        <span className="month-label">{year}年{month}月</span>
        <button className="btn btn-sm btn-secondary" onClick={nextMonth}>&gt;</button>
      </div>

      {monthTx.length === 0 && (
        <div className="empty-state">
          <p>{year}年{month}月暂无已确认的记录</p>
        </div>
      )}

      {monthTx.length > 0 && <>
      <div className="summary-cards triple">
        <div className="summary-card">
          <span className="summary-label">总支出</span>
          <span className="summary-value expense">¥{formatMoney(summary.expense)}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">总收入</span>
          <span className="summary-value income">¥{formatMoney(summary.income)}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">结余</span>
          <span className={`summary-value ${summary.balance >= 0 ? 'income' : 'expense'}`}>
            ¥{formatMoney(summary.balance)}
          </span>
        </div>
      </div>

      {anomalies.length > 0 && (
        <div className="section-block anomaly-block">
          <h3 className="section-label">异常提醒</h3>
          {anomalies.map((a) => (
            <div key={a.categoryId} className="anomaly-item">
              <span>{a.icon} {a.name}</span>
              <span className="anomaly-detail">
                本月 ¥{formatMoney(a.amount)} vs 前3月均值 ¥{formatMoney(a.avgPrevious)}
                <strong className="anomaly-percent">+{a.changePercent}%</strong>
              </span>
            </div>
          ))}
        </div>
      )}

      {breakdown.length > 0 && (
        <div className="section-block">
          <h3 className="section-label">支出分类</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={breakdown}
                  dataKey="amount"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={50}
                  paddingAngle={2}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {breakdown.map((entry) => (
                    <Cell key={entry.categoryId} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => `¥${formatMoney(val)}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="breakdown-list">
            {breakdown.map((item) => (
              <div key={item.categoryId} className="breakdown-item">
                <span className="breakdown-icon" style={{ background: item.color }}>{item.icon}</span>
                <span className="breakdown-name">{item.name}</span>
                <span className="breakdown-amount">¥{formatMoney(item.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="section-block">
        <h3 className="section-label">每日趋势</h3>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(val) => `¥${formatMoney(val)}`} />
              <Legend />
              <Line type="monotone" dataKey="expense" stroke="#FF6B6B" name="支出" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="income" stroke="#2ECC71" name="收入" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {budgets.length > 0 && (
        <div className="section-block">
          <h3 className="section-label">预算对比</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={budgets}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(val) => `¥${formatMoney(val)}`} />
                <Legend />
                <Bar dataKey="limit" fill="#87CEEB" name="预算" />
                <Bar dataKey="spent" fill="#FF6B6B" name="实际" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="section-block">
        <h3 className="section-label">环比分析</h3>
        <div className="mom-cards">
          <div className="mom-card">
            <span className="mom-label">支出变化</span>
            <span className={`mom-value ${mom.expenseChange > 0 ? 'expense' : 'income'}`}>
              {mom.expenseChange > 0 ? '+' : ''}{mom.expenseChange}%
            </span>
            <span className="mom-detail">
              上月 ¥{formatMoney(mom.previous.expense)}
            </span>
          </div>
          <div className="mom-card">
            <span className="mom-label">收入变化</span>
            <span className={`mom-value ${mom.incomeChange >= 0 ? 'income' : 'expense'}`}>
              {mom.incomeChange > 0 ? '+' : ''}{mom.incomeChange}%
            </span>
            <span className="mom-detail">
              上月 ¥{formatMoney(mom.previous.income)}
            </span>
          </div>
        </div>
      </div>
      </>}
    </div>
  );
}

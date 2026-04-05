import { formatMoney } from '../utils/formatters';

function buildCategoryRows(breakdown) {
  return breakdown.map((item) =>
    `<tr>
      <td>${item.icon} ${item.name}</td>
      <td style="text-align:right">¥${formatMoney(item.amount)}</td>
    </tr>`
  ).join('');
}

function buildBudgetRows(budgets) {
  return budgets.map((b) => {
    const status = b.percent > 100 ? '超支' : b.percent > 80 ? '警告' : '正常';
    const color = b.percent > 100 ? '#ef4444' : b.percent > 80 ? '#f59e0b' : '#10b981';
    return `<tr>
      <td>${b.icon} ${b.name}</td>
      <td style="text-align:right">¥${formatMoney(b.spent)}</td>
      <td style="text-align:right">¥${formatMoney(b.limit)}</td>
      <td style="text-align:right;color:${color}">${b.percent}% ${status}</td>
    </tr>`;
  }).join('');
}

function buildAnomalyRows(anomalies) {
  return anomalies.map((a) =>
    `<tr>
      <td>${a.icon} ${a.name}</td>
      <td style="text-align:right">¥${formatMoney(a.amount)}</td>
      <td style="text-align:right">¥${formatMoney(a.avgPrevious)}</td>
      <td style="text-align:right;color:#ef4444">+${a.changePercent}%</td>
    </tr>`
  ).join('');
}

export function exportReportAsPDF({ year, month, summary, breakdown, budgets, anomalies, mom }) {
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>AutoLedger 月度报告 - ${year}年${month}月</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
    color: #1a1d26;
    padding: 40px;
    line-height: 1.6;
    max-width: 800px;
    margin: 0 auto;
  }
  h1 { font-size: 24px; margin-bottom: 4px; }
  .subtitle { color: #6b7280; margin-bottom: 24px; font-size: 14px; }
  h2 {
    font-size: 16px;
    color: #6b7280;
    border-bottom: 2px solid #e5e7eb;
    padding-bottom: 6px;
    margin: 28px 0 14px;
  }
  .summary-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 8px;
  }
  .summary-box {
    padding: 16px;
    border-radius: 8px;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
  }
  .summary-box .label { font-size: 12px; color: #6b7280; }
  .summary-box .value { font-size: 22px; font-weight: 700; }
  .expense { color: #ef4444; }
  .income { color: #10b981; }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
  }
  th, td {
    padding: 10px 12px;
    border-bottom: 1px solid #e5e7eb;
    text-align: left;
  }
  th { font-weight: 600; color: #6b7280; font-size: 12px; text-transform: uppercase; }
  .mom-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .mom-box {
    padding: 16px;
    border-radius: 8px;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    text-align: center;
  }
  .mom-box .label { font-size: 12px; color: #6b7280; }
  .mom-box .change { font-size: 28px; font-weight: 700; }
  .mom-box .detail { font-size: 12px; color: #6b7280; }
  .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #9ca3af; }
  @media print {
    body { padding: 20px; }
    .summary-box, .mom-box { break-inside: avoid; }
  }
</style>
</head>
<body>
  <h1>AutoLedger 月度报告</h1>
  <p class="subtitle">${year}年${month}月 · 生成于 ${new Date().toLocaleDateString('zh-CN')}</p>

  <h2>收支概览</h2>
  <div class="summary-grid">
    <div class="summary-box">
      <div class="label">总支出</div>
      <div class="value expense">¥${formatMoney(summary.expense)}</div>
    </div>
    <div class="summary-box">
      <div class="label">总收入</div>
      <div class="value income">¥${formatMoney(summary.income)}</div>
    </div>
    <div class="summary-box">
      <div class="label">结余</div>
      <div class="value ${summary.balance >= 0 ? 'income' : 'expense'}">¥${formatMoney(summary.balance)}</div>
    </div>
  </div>

  ${anomalies.length > 0 ? `
  <h2>异常提醒</h2>
  <table>
    <thead><tr><th>分类</th><th style="text-align:right">本月</th><th style="text-align:right">前3月均值</th><th style="text-align:right">变化</th></tr></thead>
    <tbody>${buildAnomalyRows(anomalies)}</tbody>
  </table>
  ` : ''}

  ${breakdown.length > 0 ? `
  <h2>支出分类明细</h2>
  <table>
    <thead><tr><th>分类</th><th style="text-align:right">金额</th></tr></thead>
    <tbody>${buildCategoryRows(breakdown)}</tbody>
    <tfoot><tr><th>合计</th><th style="text-align:right">¥${formatMoney(summary.expense)}</th></tr></tfoot>
  </table>
  ` : ''}

  ${budgets.length > 0 ? `
  <h2>预算执行</h2>
  <table>
    <thead><tr><th>分类</th><th style="text-align:right">实际</th><th style="text-align:right">预算</th><th style="text-align:right">进度</th></tr></thead>
    <tbody>${buildBudgetRows(budgets)}</tbody>
  </table>
  ` : ''}

  <h2>环比分析</h2>
  <div class="mom-grid">
    <div class="mom-box">
      <div class="label">支出变化</div>
      <div class="change ${mom.expenseChange > 0 ? 'expense' : 'income'}">${mom.expenseChange > 0 ? '+' : ''}${mom.expenseChange}%</div>
      <div class="detail">上月 ¥${formatMoney(mom.previous.expense)}</div>
    </div>
    <div class="mom-box">
      <div class="label">收入变化</div>
      <div class="change ${mom.incomeChange >= 0 ? 'income' : 'expense'}">${mom.incomeChange > 0 ? '+' : ''}${mom.incomeChange}%</div>
      <div class="detail">上月 ¥${formatMoney(mom.previous.income)}</div>
    </div>
  </div>

  <div class="footer">AutoLedger · 个人记账助手</div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (win) {
    win.onload = () => {
      win.print();
      URL.revokeObjectURL(url);
    };
  } else {
    URL.revokeObjectURL(url);
  }
}

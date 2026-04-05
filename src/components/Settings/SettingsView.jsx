import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { getUserId } from '../../services/supabaseClient';
import { formatMoney } from '../../utils/formatters';

export default function SettingsView() {
  const { state, dispatch, ActionTypes, syncStatus } = useApp();
  const [saved, setSaved] = useState(false);
  const now = new Date();
  const [budgetMonth, setBudgetMonth] = useState(now.getMonth() + 1);
  const [budgetYear, setBudgetYear] = useState(now.getFullYear());
  const [budgetLimit, setBudgetLimit] = useState('');
  const [budgetCategoryId, setBudgetCategoryId] = useState('');

  const [localSettings, setLocalSettings] = useState({
    aiApiKey: state.settings.aiApiKey,
    aiApiEndpoint: state.settings.aiApiEndpoint,
    aiModel: state.settings.aiModel,
    supabaseUrl: state.settings.supabaseUrl,
    supabaseKey: state.settings.supabaseKey,
  });

  const handleLocalChange = (key, value) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSettingsBlur = (key) => {
    if (localSettings[key] !== state.settings[key]) {
      dispatch({ type: ActionTypes.UPDATE_SETTINGS, payload: { [key]: localSettings[key] } });
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }
  };

  const handleAddBudget = (e) => {
    e.preventDefault();
    const limit = parseFloat(budgetLimit);
    if (!limit || limit <= 0) return;
    dispatch({
      type: ActionTypes.SET_BUDGET,
      payload: {
        month: budgetMonth,
        year: budgetYear,
        monthlyLimit: limit,
        categoryId: budgetCategoryId || null,
      },
    });
    setBudgetLimit('');
    setBudgetCategoryId('');
  };

  const handleDeleteBudget = (id) => {
    dispatch({ type: ActionTypes.DELETE_BUDGET, payload: id });
  };

  const expenseCategories = state.categories.filter((c) => c.type === 'expense');
  const currentBudgets = state.budgets.filter((b) => b.year === budgetYear && b.month === budgetMonth);

  const handleExportData = () => {
    const data = {
      transactions: state.transactions,
      categories: state.categories,
      budgets: state.budgets,
      settings: { ...state.settings, aiApiKey: '' },
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `autoledger-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target.result);
        if (data.transactions && data.transactions.length > 0) {
          const existingIds = new Set(state.transactions.map((t) => t.id));
          const newTx = data.transactions.filter((t) => !existingIds.has(t.id));
          if (newTx.length > 0) {
            dispatch({ type: ActionTypes.BATCH_ADD_TRANSACTIONS, payload: newTx });
          }
        }
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
      } catch { /* ignore */ }
    };
    reader.readAsText(file);
  };

  return (
    <div className="page-view">
      <h2 className="page-title">设置</h2>

      <div className="section-block">
        <h3 className="section-label">AI 分类配置</h3>
        <label className="form-field">
          <span>API Key</span>
          <input
            type="password"
            placeholder="sk-..."
            value={localSettings.aiApiKey}
            onChange={(e) => handleLocalChange('aiApiKey', e.target.value)}
            onBlur={() => handleSettingsBlur('aiApiKey')}
          />
        </label>
        <label className="form-field">
          <span>API 地址</span>
          <input
            type="url"
            value={localSettings.aiApiEndpoint}
            onChange={(e) => handleLocalChange('aiApiEndpoint', e.target.value)}
            onBlur={() => handleSettingsBlur('aiApiEndpoint')}
          />
        </label>
        <label className="form-field">
          <span>模型</span>
          <input
            type="text"
            value={localSettings.aiModel}
            onChange={(e) => handleLocalChange('aiModel', e.target.value)}
            onBlur={() => handleSettingsBlur('aiModel')}
          />
        </label>
      </div>

      <div className="section-block">
        <h3 className="section-label">数据同步 (Supabase)</h3>
        <label className="form-field">
          <span>Project URL</span>
          <input
            type="url"
            placeholder="https://xxx.supabase.co"
            value={localSettings.supabaseUrl}
            onChange={(e) => handleLocalChange('supabaseUrl', e.target.value)}
            onBlur={() => handleSettingsBlur('supabaseUrl')}
          />
        </label>
        <label className="form-field">
          <span>Anon Key</span>
          <input
            type="password"
            placeholder="eyJ..."
            value={localSettings.supabaseKey}
            onChange={(e) => handleLocalChange('supabaseKey', e.target.value)}
            onBlur={() => handleSettingsBlur('supabaseKey')}
          />
        </label>
        <div className="sync-status-row">
          <span className="settings-hint">设备 ID: {getUserId().slice(0, 8)}...</span>
          <span className={`sync-badge ${state.settings.supabaseUrl ? 'on' : 'off'}`}>
            {!state.settings.supabaseUrl ? '未配置' : syncStatus === 'syncing' ? '同步中...' : syncStatus === 'error' ? '同步失败' : '已连接'}
          </span>
        </div>
        <p className="settings-hint">配置后数据自动同步到云端，多设备共享。同一设备 ID 的数据互通。</p>
      </div>

      <div className="section-block">
        <h3 className="section-label">预算管理</h3>
        <div className="budget-month-nav">
          <span>{budgetYear}年{budgetMonth}月</span>
        </div>
        <form className="budget-form" onSubmit={handleAddBudget}>
          <select value={budgetCategoryId} onChange={(e) => setBudgetCategoryId(e.target.value)}>
            <option value="">总预算</option>
            {expenseCategories.map((c) => (
              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
            ))}
          </select>
          <input
            type="number"
            step="0.01"
            min="1"
            placeholder="预算金额"
            value={budgetLimit}
            onChange={(e) => setBudgetLimit(e.target.value)}
          />
          <button className="btn btn-primary" type="submit">设置</button>
        </form>
        {currentBudgets.length > 0 && (
          <div className="budget-list">
            {currentBudgets.map((b) => {
              const cat = state.categories.find((c) => c.id === b.categoryId);
              return (
                <div key={b.id} className="budget-list-item">
                  <span>{cat ? `${cat.icon} ${cat.name}` : '💰 总预算'}</span>
                  <span>¥{formatMoney(b.monthlyLimit)}</span>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDeleteBudget(b.id)}>删除</button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="section-block">
        <h3 className="section-label">数据管理</h3>
        <div className="settings-actions">
          <button className="btn btn-secondary" onClick={handleExportData}>导出数据备份</button>
          <label className="btn btn-secondary file-import-btn">
            导入数据
            <input type="file" accept=".json" onChange={handleImportData} hidden />
          </label>
        </div>
        <p className="settings-hint">数据存储在浏览器本地，清除浏览器数据会丢失记录。建议定期导出备份。</p>
      </div>

      {saved && <div className="toast toast-success">已保存</div>}
    </div>
  );
}

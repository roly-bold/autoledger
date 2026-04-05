import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { classifyTransaction } from '../../services/aiClassification';
import CategoryPickerView from './CategoryPickerView';

export default function AddTransactionView({ onNavigate }) {
  const { state, dispatch, ActionTypes } = useApp();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [type, setType] = useState(state.settings.defaultTransactionType || 'expense');
  const [categoryId, setCategoryId] = useState(null);
  const [tags, setTags] = useState('');
  const [isClassifying, setIsClassifying] = useState(false);
  const [saved, setSaved] = useState(false);
  const categoryIdRef = useRef(null);

  const handleCategorySelect = (id) => {
    setCategoryId(id);
    categoryIdRef.current = id;
  };

  const handleNoteBlur = async () => {
    if (!note.trim() || categoryIdRef.current || !state.settings.aiApiKey) return;
    setIsClassifying(true);
    try {
      const result = await classifyTransaction(
        note,
        state.categories.filter((c) => c.type === type),
        state.settings
      );
      if (result.categoryId && !categoryIdRef.current) {
        setCategoryId(result.categoryId);
        categoryIdRef.current = result.categoryId;
      }
    } finally {
      setIsClassifying(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) return;

    dispatch({
      type: ActionTypes.ADD_TRANSACTION,
      payload: {
        amount: parsedAmount,
        note: note.trim(),
        date,
        type,
        categoryId,
        tags: tags.split(/[,，、]/).map((t) => t.trim()).filter(Boolean),
        source: 'manual',
        isConfirmed: true,
        sourceHash: null,
      },
    });

    setAmount('');
    setNote('');
    setDate(new Date().toISOString().slice(0, 10));
    setCategoryId(null);
    setTags('');
    setSaved(true);
    setTimeout(() => { setSaved(false); onNavigate?.('dashboard'); }, 1000);
  };

  return (
    <div className="page-view">
      <h2 className="page-title">记一笔</h2>

      <div className="type-toggle" role="group" aria-label="交易类型">
        <button
          className={`toggle-btn ${type === 'expense' ? 'is-active expense' : ''}`}
          onClick={() => { setType('expense'); setCategoryId(null); }}
        >
          支出
        </button>
        <button
          className={`toggle-btn ${type === 'income' ? 'is-active income' : ''}`}
          onClick={() => { setType('income'); setCategoryId(null); }}
        >
          收入
        </button>
      </div>

      <form className="add-form" onSubmit={handleSubmit}>
        <div className="amount-input-wrap">
          <span className="currency-sign">¥</span>
          <input
            className="amount-input"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            autoFocus
          />
        </div>

        <label className="form-field">
          <span>备注</span>
          <input
            type="text"
            placeholder="例如：星巴克拿铁"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={handleNoteBlur}
          />
          {isClassifying && <span className="field-hint">AI 分类中...</span>}
        </label>

        <label className="form-field">
          <span>日期</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>

        <div className="form-field">
          <span>分类 {isClassifying && '(AI 识别中...)'}</span>
          <CategoryPickerView
            categories={state.categories}
            selectedId={categoryId}
            transactionType={type}
            onSelect={setCategoryId}
          />
        </div>

        <label className="form-field">
          <span>标签</span>
          <input
            type="text"
            placeholder="用逗号分隔，例如：午餐、工作日"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </label>

        <button className="btn btn-primary btn-block" type="submit">
          保存
        </button>
      </form>

      {saved && <div className="toast toast-success">已保存</div>}
    </div>
  );
}

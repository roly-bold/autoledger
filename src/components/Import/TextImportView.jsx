import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { parseMultipleTexts } from '../../services/textParsing';
import { readClipboard, looksLikeTransaction } from '../../services/clipboardMonitor';
import CategoryPickerView from '../AddTransaction/CategoryPickerView';

function formatMoney(n) {
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function TextImportView() {
  const { state, dispatch, ActionTypes } = useApp();
  const [text, setText] = useState('');
  const [parsed, setParsed] = useState([]);
  const [editingIdx, setEditingIdx] = useState(null);
  const [clipboardHint, setClipboardHint] = useState(false);

  const pending = state.transactions.filter((t) => !t.isConfirmed);

  useEffect(() => {
    const checkClipboard = async () => {
      const content = await readClipboard();
      if (content && looksLikeTransaction(content) && content !== text) {
        setClipboardHint(true);
      }
    };
    checkClipboard();
    const onFocus = () => checkClipboard();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [text]);

  const handlePasteFromClipboard = async () => {
    const content = await readClipboard();
    if (content) {
      setText(content);
      setClipboardHint(false);
    }
  };

  const handleParse = () => {
    const results = parseMultipleTexts(text);
    const deduped = results.filter((r) => {
      if (!r.sourceHash) return true;
      return !state.transactions.some((t) => t.sourceHash === r.sourceHash);
    });
    setParsed(deduped);
  };

  const handleImport = (item) => {
    dispatch({ type: ActionTypes.ADD_TRANSACTION, payload: item });
    setParsed((prev) => prev.filter((p) => p !== item));
  };

  const handleImportAll = () => {
    for (const item of parsed) {
      dispatch({ type: ActionTypes.ADD_TRANSACTION, payload: item });
    }
    setParsed([]);
    setText('');
  };

  const handleConfirm = (id) => {
    dispatch({ type: ActionTypes.CONFIRM_TRANSACTION, payload: id });
  };

  const handleDelete = (id) => {
    dispatch({ type: ActionTypes.DELETE_TRANSACTION, payload: id });
  };

  const getCategoryInfo = (id) => state.categories.find((c) => c.id === id);

  return (
    <div className="page-view">
      <h2 className="page-title">文本导入</h2>
      <p className="page-hint">粘贴银行短信、支付通知或交易记录文本，自动解析金额和商家信息</p>

      {clipboardHint && (
        <button className="clipboard-hint-banner" onClick={handlePasteFromClipboard}>
          检测到剪贴板中可能包含交易信息，点击粘贴
        </button>
      )}

      <div className="import-area">
        <div className="import-actions-row">
          <button className="btn btn-secondary" onClick={handlePasteFromClipboard}>从剪贴板粘贴</button>
        </div>
        <textarea
          className="import-textarea"
          rows="5"
          placeholder={"粘贴交易文本，例如：\n您在星巴克消费38.00元\n支付宝转账收入500元\n工商银行消费短信：您的账户于03月15日消费人民币128.50元"}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="btn btn-primary btn-block" onClick={handleParse} disabled={!text.trim()}>
          解析文本
        </button>
      </div>

      {parsed.length > 0 && (
        <div className="section-block">
          <div className="section-header">
            <h3 className="section-label">解析结果 ({parsed.length}条)</h3>
            <button className="btn btn-sm btn-primary" onClick={handleImportAll}>全部导入</button>
          </div>
          <div className="tx-list">
            {parsed.map((item, idx) => (
              <div key={item.sourceHash || idx} className="tx-item parsed-item">
                <div className="tx-info">
                  <span className="tx-note">{item.note}</span>
                  <span className="tx-date">{item.date} · {item.type === 'income' ? '收入' : '支出'}</span>
                  {editingIdx === idx && (
                    <CategoryPickerView
                      categories={state.categories}
                      selectedId={item.categoryId}
                      transactionType={item.type}
                      onSelect={(id) => {
                        const updated = [...parsed];
                        updated[idx] = { ...item, categoryId: id };
                        setParsed(updated);
                      }}
                    />
                  )}
                </div>
                <span className={`tx-amount ${item.type}`}>
                  {item.type === 'income' ? '+' : '-'}¥{formatMoney(item.amount)}
                </span>
                <div className="parsed-actions">
                  <button className="btn btn-sm btn-primary" onClick={() => handleImport(item)}>导入</button>
                  <button className="btn btn-sm btn-secondary" onClick={() => setEditingIdx(editingIdx === idx ? null : idx)}>分类</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {pending.length > 0 && (
        <div className="section-block">
          <h3 className="section-label">待确认 ({pending.length}条)</h3>
          <div className="tx-list">
            {pending.map((tx) => {
              const cat = getCategoryInfo(tx.categoryId);
              return (
                <div key={tx.id} className="tx-item pending-item">
                  <span className="tx-icon">{cat?.icon || '📌'}</span>
                  <div className="tx-info">
                    <span className="tx-note">{tx.note || '未命名'}</span>
                    <span className="tx-date">{tx.date}</span>
                  </div>
                  <span className={`tx-amount ${tx.type}`}>
                    {tx.type === 'income' ? '+' : '-'}¥{formatMoney(tx.amount)}
                  </span>
                  <div className="parsed-actions">
                    <button className="btn btn-sm btn-primary" onClick={() => handleConfirm(tx.id)}>确认</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(tx.id)}>删除</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

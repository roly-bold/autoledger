import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import CategoryPickerView from '../AddTransaction/CategoryPickerView';
import { formatMoney } from '../../utils/formatters';

export default function PendingListView() {
  const { state, dispatch, ActionTypes } = useApp();
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const pending = state.transactions.filter((t) => !t.isConfirmed);

  const getCategoryInfo = (id) => state.categories.find((c) => c.id === id);

  const startEdit = (tx) => {
    setEditingId(tx.id);
    setEditForm({ amount: tx.amount, note: tx.note, type: tx.type, categoryId: tx.categoryId, date: tx.date });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = (id) => {
    dispatch({
      type: ActionTypes.UPDATE_TRANSACTION,
      payload: { id, ...editForm, amount: parseFloat(editForm.amount) || 0 },
    });
    setEditingId(null);
    setEditForm({});
  };

  const handleConfirm = (id) => {
    dispatch({ type: ActionTypes.CONFIRM_TRANSACTION, payload: id });
  };

  const handleConfirmAll = () => {
    dispatch({ type: ActionTypes.BATCH_CONFIRM_TRANSACTIONS, payload: pending.map((tx) => tx.id) });
  };

  const handleDelete = (id) => {
    dispatch({ type: ActionTypes.DELETE_TRANSACTION, payload: id });
    if (editingId === id) cancelEdit();
  };

  if (pending.length === 0) {
    return (
      <div className="page-view">
        <h2 className="page-title">待确认</h2>
        <div className="empty-state">
          <p>没有待确认的记录</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-view">
      <div className="section-header">
        <h2 className="page-title">待确认 ({pending.length})</h2>
        <button className="btn btn-sm btn-primary" onClick={handleConfirmAll}>全部确认</button>
      </div>

      <div className="tx-list">
        {pending.map((tx) => {
          const cat = getCategoryInfo(tx.categoryId);
          const isEditing = editingId === tx.id;

          if (isEditing) {
            return (
              <div key={tx.id} className="tx-item pending-item editing">
                <div className="edit-form">
                  <div className="edit-row">
                    <div className="type-toggle compact">
                      <button
                        className={`toggle-btn ${editForm.type === 'expense' ? 'is-active expense' : ''}`}
                        onClick={() => setEditForm({ ...editForm, type: 'expense' })}
                      >支出</button>
                      <button
                        className={`toggle-btn ${editForm.type === 'income' ? 'is-active income' : ''}`}
                        onClick={() => setEditForm({ ...editForm, type: 'income' })}
                      >收入</button>
                    </div>
                  </div>
                  <div className="edit-row">
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.amount}
                      onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                      className="edit-amount"
                    />
                  </div>
                  <div className="edit-row">
                    <input
                      type="text"
                      value={editForm.note}
                      onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
                      placeholder="备注"
                      className="edit-note"
                    />
                  </div>
                  <div className="edit-row">
                    <input
                      type="date"
                      value={editForm.date}
                      onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                    />
                  </div>
                  <CategoryPickerView
                    categories={state.categories}
                    selectedId={editForm.categoryId}
                    transactionType={editForm.type}
                    onSelect={(id) => setEditForm({ ...editForm, categoryId: id })}
                  />
                  <div className="parsed-actions">
                    <button className="btn btn-sm btn-primary" onClick={() => saveEdit(tx.id)}>保存</button>
                    <button className="btn btn-sm btn-secondary" onClick={cancelEdit}>取消</button>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div key={tx.id} className="tx-item pending-item">
              <span className="tx-icon">{cat?.icon || '📌'}</span>
              <div className="tx-info">
                <span className="tx-note">{tx.note || '未命名'}</span>
                <span className="tx-date">{tx.date} · {tx.type === 'income' ? '收入' : '支出'}</span>
              </div>
              <span className={`tx-amount ${tx.type}`}>
                {tx.type === 'income' ? '+' : '-'}¥{formatMoney(tx.amount)}
              </span>
              <div className="parsed-actions">
                <button className="btn btn-sm btn-primary" onClick={() => handleConfirm(tx.id)}>确认</button>
                <button className="btn btn-sm btn-secondary" onClick={() => startEdit(tx)}>编辑</button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(tx.id)}>删除</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

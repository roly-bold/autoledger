import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

const ICON_OPTIONS = ['🍜','🚌','🛍️','🎬','🏠','💊','📚','📱','👔','🧴','🎉','✈️','🐱','📌','💰','💼','📈','🧧','💎','🎵','🏋️','🎮','☕','🍺','🎂','📦','🔧','🎓'];
const COLOR_OPTIONS = ['#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#FECA57','#DDA0DD','#87CEEB','#98D8C8','#F7DC6F','#BB8FCE','#F1948A','#82E0AA','#F0B27A','#AEB6BF','#2ECC71','#3498DB','#E74C3C','#E67E22','#1ABC9C'];

export default function CategoryListView() {
  const { state, dispatch, ActionTypes } = useApp();
  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', icon: '📌', color: '#AEB6BF', type: 'expense' });
  const [viewType, setViewType] = useState('expense');

  const filtered = state.categories.filter((c) => c.type === viewType);

  const openAdd = () => {
    setEditingId(null);
    setForm({ name: '', icon: '📌', color: '#AEB6BF', type: viewType });
    setShowEditor(true);
  };

  const openEdit = (cat) => {
    if (cat.isPreset) return;
    setEditingId(cat.id);
    setForm({ name: cat.name, icon: cat.icon, color: cat.color, type: cat.type });
    setShowEditor(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editingId) {
      dispatch({ type: ActionTypes.UPDATE_CATEGORY, payload: { id: editingId, ...form } });
    } else {
      dispatch({ type: ActionTypes.ADD_CATEGORY, payload: form });
    }
    setShowEditor(false);
  };

  const handleDelete = (id) => {
    dispatch({ type: ActionTypes.DELETE_CATEGORY, payload: id });
    setShowEditor(false);
  };

  return (
    <div className="page-view">
      <h2 className="page-title">分类管理</h2>

      <div className="type-toggle" role="group" aria-label="分类类型">
        <button className={`toggle-btn ${viewType === 'expense' ? 'is-active expense' : ''}`}
          onClick={() => setViewType('expense')}>支出分类</button>
        <button className={`toggle-btn ${viewType === 'income' ? 'is-active income' : ''}`}
          onClick={() => setViewType('income')}>收入分类</button>
      </div>

      <div className="category-list">
        {filtered.map((cat) => (
          <button key={cat.id} className="category-list-item" onClick={() => openEdit(cat)}>
            <span className="cat-icon-badge" style={{ background: cat.color }}>{cat.icon}</span>
            <span className="cat-name">{cat.name}</span>
            {cat.isPreset && <span className="cat-preset-tag">预设</span>}
            {!cat.isPreset && <span className="cat-edit-hint">编辑</span>}
          </button>
        ))}
        <button className="category-list-item add-item" onClick={openAdd}>
          <span className="cat-icon-badge add-badge">+</span>
          <span className="cat-name">添加分类</span>
        </button>
      </div>

      {showEditor && (
        <div className="modal-overlay" onClick={() => setShowEditor(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editingId ? '编辑分类' : '新增分类'}</h3>

            <label className="form-field">
              <span>名称</span>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="分类名称" />
            </label>

            <div className="form-field">
              <span>图标</span>
              <div className="icon-grid">
                {ICON_OPTIONS.map((icon) => (
                  <button key={icon} className={`icon-option ${form.icon === icon ? 'is-selected' : ''}`}
                    onClick={() => setForm({ ...form, icon })}>{icon}</button>
                ))}
              </div>
            </div>

            <div className="form-field">
              <span>颜色</span>
              <div className="color-grid">
                {COLOR_OPTIONS.map((color) => (
                  <button key={color} className={`color-option ${form.color === color ? 'is-selected' : ''}`}
                    style={{ background: color }} onClick={() => setForm({ ...form, color })} />
                ))}
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-primary" onClick={handleSave}>保存</button>
              {editingId && (
                <button className="btn btn-danger" onClick={() => handleDelete(editingId)}>删除</button>
              )}
              <button className="btn btn-secondary" onClick={() => setShowEditor(false)}>取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React from 'react';

export default function CategoryPickerView({ categories, selectedId, transactionType, onSelect }) {
  const filtered = categories.filter((c) => c.type === transactionType);

  return (
    <div className="category-picker">
      <div className="category-grid">
        {filtered.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className={`category-chip ${selectedId === cat.id ? 'is-selected' : ''}`}
            style={{ '--cat-color': cat.color }}
            onClick={() => onSelect(cat.id)}
          >
            <span className="category-chip-icon">{cat.icon}</span>
            <span className="category-chip-name">{cat.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

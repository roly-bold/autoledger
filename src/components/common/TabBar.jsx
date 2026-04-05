import React from 'react';

const tabs = [
  { id: 'dashboard', label: '首页', icon: '📊' },
  { id: 'add', label: '记账', icon: '✏️' },
  { id: 'import', label: '导入', icon: '📋' },
  { id: 'categories', label: '分类', icon: '🏷️' },
  { id: 'reports', label: '报告', icon: '📈' },
  { id: 'settings', label: '设置', icon: '⚙️' },
];

export default function TabBar({ activeTab, onTabChange }) {
  return (
    <nav className="tab-bar" role="tablist" aria-label="主导航">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          aria-label={tab.label}
          className={`tab-item ${activeTab === tab.id ? 'is-active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          <span className="tab-icon" aria-hidden="true">{tab.icon}</span>
          <span className="tab-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}

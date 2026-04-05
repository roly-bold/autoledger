import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import TabBar from './components/common/TabBar';
import DashboardView from './components/Dashboard/DashboardView';
import AddTransactionView from './components/AddTransaction/AddTransactionView';
import TextImportView from './components/Import/TextImportView';
import CategoryListView from './components/Categories/CategoryListView';
import MonthlyReportView from './components/Reports/MonthlyReportView';
import PendingListView from './components/Pending/PendingListView';
import SettingsView from './components/Settings/SettingsView';

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderView = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardView onNavigate={setActiveTab} />;
      case 'add': return <AddTransactionView onNavigate={setActiveTab} />;
      case 'import': return <TextImportView />;
      case 'pending': return <PendingListView />;
      case 'categories': return <CategoryListView />;
      case 'reports': return <MonthlyReportView />;
      case 'settings': return <SettingsView />;
      default: return <DashboardView onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="app-shell">
      <div className="app-content">
        {renderView()}
      </div>
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

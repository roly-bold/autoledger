import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react';
import { nanoid } from 'nanoid';
import {
  loadTransactions, saveTransactions,
  loadCategories, saveCategories,
  loadBudgets, saveBudgets,
  loadSettings, saveSettings,
} from '../services/storage';
import {
  pullAll,
  pushTransactions, pushCategories, pushBudgets,
  deleteTransaction as remoteDeleteTx,
  deleteCategory as remoteDeleteCat,
  deleteBudget as remoteDeleteBud,
} from '../services/supabaseSync';

const AppContext = createContext(null);

const ActionTypes = {
  ADD_TRANSACTION: 'ADD_TRANSACTION',
  UPDATE_TRANSACTION: 'UPDATE_TRANSACTION',
  DELETE_TRANSACTION: 'DELETE_TRANSACTION',
  CONFIRM_TRANSACTION: 'CONFIRM_TRANSACTION',
  ADD_CATEGORY: 'ADD_CATEGORY',
  UPDATE_CATEGORY: 'UPDATE_CATEGORY',
  DELETE_CATEGORY: 'DELETE_CATEGORY',
  SET_BUDGET: 'SET_BUDGET',
  DELETE_BUDGET: 'DELETE_BUDGET',
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  MERGE_REMOTE: 'MERGE_REMOTE',
};

function appReducer(state, action) {
  switch (action.type) {
    case ActionTypes.ADD_TRANSACTION:
      return {
        ...state,
        transactions: [
          { id: nanoid(), createdAt: new Date().toISOString(), ...action.payload },
          ...state.transactions,
        ],
      };

    case ActionTypes.UPDATE_TRANSACTION:
      return {
        ...state,
        transactions: state.transactions.map((t) =>
          t.id === action.payload.id ? { ...t, ...action.payload } : t
        ),
      };

    case ActionTypes.DELETE_TRANSACTION:
      return {
        ...state,
        transactions: state.transactions.filter((t) => t.id !== action.payload),
        _deletedTx: action.payload,
      };

    case ActionTypes.CONFIRM_TRANSACTION:
      return {
        ...state,
        transactions: state.transactions.map((t) =>
          t.id === action.payload ? { ...t, isConfirmed: true } : t
        ),
      };

    case ActionTypes.ADD_CATEGORY:
      return {
        ...state,
        categories: [
          ...state.categories,
          { id: nanoid(), isPreset: false, sortOrder: state.categories.length, ...action.payload },
        ],
      };

    case ActionTypes.UPDATE_CATEGORY:
      return {
        ...state,
        categories: state.categories.map((c) =>
          c.id === action.payload.id ? { ...c, ...action.payload } : c
        ),
      };

    case ActionTypes.DELETE_CATEGORY:
      return {
        ...state,
        categories: state.categories.filter((c) => c.id !== action.payload),
        transactions: state.transactions.map((t) =>
          t.categoryId === action.payload ? { ...t, categoryId: null } : t
        ),
        _deletedCat: action.payload,
      };

    case ActionTypes.SET_BUDGET: {
      const existing = state.budgets.findIndex(
        (b) => b.month === action.payload.month && b.year === action.payload.year && b.categoryId === action.payload.categoryId
      );
      if (existing >= 0) {
        const updated = [...state.budgets];
        updated[existing] = { ...updated[existing], ...action.payload };
        return { ...state, budgets: updated };
      }
      return {
        ...state,
        budgets: [...state.budgets, { id: nanoid(), ...action.payload }],
      };
    }

    case ActionTypes.DELETE_BUDGET:
      return {
        ...state,
        budgets: state.budgets.filter((b) => b.id !== action.payload),
        _deletedBud: action.payload,
      };

    case ActionTypes.UPDATE_SETTINGS:
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      };

    case ActionTypes.MERGE_REMOTE:
      return { ...state, ...action.payload };

    default:
      return state;
  }
}

function initState() {
  return {
    transactions: loadTransactions(),
    categories: loadCategories(),
    budgets: loadBudgets(),
    settings: loadSettings(),
  };
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, null, initState);
  const [syncStatus, setSyncStatus] = React.useState('idle');
  const skipSync = useRef(false);
  const initialPullDone = useRef(false);

  const syncEnabled = state.settings.supabaseUrl && state.settings.supabaseKey;

  useEffect(() => {
    if (!syncEnabled || initialPullDone.current) return;
    initialPullDone.current = true;
    setSyncStatus('syncing');
    skipSync.current = true;
    pullAll(state.settings).then((remote) => {
      if (!remote) { setSyncStatus('idle'); skipSync.current = false; return; }
      const merged = {};
      if (remote.transactions.length > 0) {
        const localIds = new Set(state.transactions.map((t) => t.id));
        merged.transactions = [...state.transactions];
        for (const row of remote.transactions) {
          if (!localIds.has(row.id)) merged.transactions.push(row.data);
        }
      }
      if (remote.categories.length > 0) {
        const localIds = new Set(state.categories.map((c) => c.id));
        merged.categories = [...state.categories];
        for (const row of remote.categories) {
          if (!localIds.has(row.id)) merged.categories.push(row.data);
        }
      }
      if (remote.budgets.length > 0) {
        const localIds = new Set(state.budgets.map((b) => b.id));
        merged.budgets = [...state.budgets];
        for (const row of remote.budgets) {
          if (!localIds.has(row.id)) merged.budgets.push(row.data);
        }
      }
      if (Object.keys(merged).length > 0) {
        dispatch({ type: ActionTypes.MERGE_REMOTE, payload: merged });
      }
      setSyncStatus('idle');
      setTimeout(() => { skipSync.current = false; }, 500);
    }).catch(() => { setSyncStatus('error'); skipSync.current = false; });
  }, [syncEnabled]);

  useEffect(() => {
    saveTransactions(state.transactions);
    if (skipSync.current) { skipSync.current = false; return; }
    if (!syncEnabled) return;
    pushTransactions(state.transactions, state.settings);
    if (state._deletedTx) remoteDeleteTx(state._deletedTx, state.settings);
  }, [state.transactions]);

  useEffect(() => {
    saveCategories(state.categories);
    if (!syncEnabled || skipSync.current) return;
    pushCategories(state.categories, state.settings);
    if (state._deletedCat) remoteDeleteCat(state._deletedCat, state.settings);
  }, [state.categories]);

  useEffect(() => {
    saveBudgets(state.budgets);
    if (!syncEnabled || skipSync.current) return;
    pushBudgets(state.budgets, state.settings);
    if (state._deletedBud) remoteDeleteBud(state._deletedBud, state.settings);
  }, [state.budgets]);

  useEffect(() => { saveSettings(state.settings); }, [state.settings]);

  return (
    <AppContext.Provider value={{ state, dispatch, ActionTypes, syncStatus }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

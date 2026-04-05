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
  BATCH_ADD_TRANSACTIONS: 'BATCH_ADD_TRANSACTIONS',
  UPDATE_TRANSACTION: 'UPDATE_TRANSACTION',
  DELETE_TRANSACTION: 'DELETE_TRANSACTION',
  CONFIRM_TRANSACTION: 'CONFIRM_TRANSACTION',
  BATCH_CONFIRM_TRANSACTIONS: 'BATCH_CONFIRM_TRANSACTIONS',
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

    case ActionTypes.BATCH_ADD_TRANSACTIONS:
      return {
        ...state,
        transactions: [
          ...action.payload.map((t) => ({ id: nanoid(), createdAt: new Date().toISOString(), ...t })),
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
      };

    case ActionTypes.CONFIRM_TRANSACTION:
      return {
        ...state,
        transactions: state.transactions.map((t) =>
          t.id === action.payload ? { ...t, isConfirmed: true } : t
        ),
      };

    case ActionTypes.BATCH_CONFIRM_TRANSACTIONS:
      return {
        ...state,
        transactions: state.transactions.map((t) => {
          const ids = new Set(action.payload);
          return ids.has(t.id) ? { ...t, isConfirmed: true } : t;
        }),
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

function mergeRemoteItems(local, remote) {
  if (remote.length === 0) return null;
  const localIds = new Set(local.map((item) => item.id));
  const merged = [...local];
  for (const row of remote) {
    if (!localIds.has(row.id)) merged.push(row.data);
  }
  return merged.length > local.length ? merged : null;
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, null, initState);
  const [syncStatus, setSyncStatus] = React.useState('idle');
  const skipSync = useRef(false);
  const initialPullDone = useRef(false);
  const deletedTxRef = useRef(null);
  const deletedCatRef = useRef(null);
  const deletedBudRef = useRef(null);

  const wrappedDispatch = useCallback((action) => {
    if (action.type === ActionTypes.DELETE_TRANSACTION) deletedTxRef.current = action.payload;
    if (action.type === ActionTypes.DELETE_CATEGORY) deletedCatRef.current = action.payload;
    if (action.type === ActionTypes.DELETE_BUDGET) deletedBudRef.current = action.payload;
    dispatch(action);
  }, []);

  const syncEnabled = state.settings.supabaseUrl && state.settings.supabaseKey;

  useEffect(() => {
    if (!syncEnabled || initialPullDone.current) return;
    initialPullDone.current = true;
    setSyncStatus('syncing');
    skipSync.current = true;
    pullAll(state.settings).then((remote) => {
      if (!remote) { setSyncStatus('idle'); skipSync.current = false; return; }
      const merged = {};
      const txMerged = mergeRemoteItems(state.transactions, remote.transactions);
      if (txMerged) merged.transactions = txMerged;
      const catMerged = mergeRemoteItems(state.categories, remote.categories);
      if (catMerged) merged.categories = catMerged;
      const budMerged = mergeRemoteItems(state.budgets, remote.budgets);
      if (budMerged) merged.budgets = budMerged;
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
    if (deletedTxRef.current) {
      remoteDeleteTx(deletedTxRef.current, state.settings);
      deletedTxRef.current = null;
    }
  }, [state.transactions]);

  useEffect(() => {
    saveCategories(state.categories);
    if (!syncEnabled || skipSync.current) return;
    pushCategories(state.categories, state.settings);
    if (deletedCatRef.current) {
      remoteDeleteCat(deletedCatRef.current, state.settings);
      deletedCatRef.current = null;
    }
  }, [state.categories]);

  useEffect(() => {
    saveBudgets(state.budgets);
    if (!syncEnabled || skipSync.current) return;
    pushBudgets(state.budgets, state.settings);
    if (deletedBudRef.current) {
      remoteDeleteBud(deletedBudRef.current, state.settings);
      deletedBudRef.current = null;
    }
  }, [state.budgets]);

  useEffect(() => { saveSettings(state.settings); }, [state.settings]);

  return (
    <AppContext.Provider value={{ state, dispatch: wrappedDispatch, ActionTypes, syncStatus }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

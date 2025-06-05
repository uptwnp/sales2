import { useState, useEffect } from 'react';

interface PersistentState {
  filters: any[];
  currentPage: number;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  searchQuery?: string;
}

export function usePersistentState(sectionKey: string) {
  // Initialize state from localStorage or defaults
  const [state, setState] = useState<PersistentState>(() => {
    const savedState = localStorage.getItem(`${sectionKey}_state`);
    return savedState ? JSON.parse(savedState) : {
      filters: [],
      currentPage: 1,
      sortField: 'created_at',
      sortDirection: 'desc',
      searchQuery: ''
    };
  });

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(`${sectionKey}_state`, JSON.stringify(state));
  }, [state, sectionKey]);

  const updateState = (updates: Partial<PersistentState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const resetState = () => {
    const defaultState = {
      filters: [],
      currentPage: 1,
      sortField: 'created_at',
      sortDirection: 'desc',
      searchQuery: ''
    };
    setState(defaultState);
    localStorage.removeItem(`${sectionKey}_state`);
  };

  return {
    state,
    updateState,
    resetState
  };
}
import { create } from 'zustand';
import { 
  QuickBaseApp, 
  QuickBaseTable, 
  QuickBaseRecord,
  QuickBaseField 
} from '@/types/quickbase';

interface QuickBaseState {
  currentApp: QuickBaseApp | null;
  currentTable: QuickBaseTable | null;
  apps: QuickBaseApp[];
  tables: QuickBaseTable[];
  records: QuickBaseRecord[];
  fields: QuickBaseField[];
  loading: {
    apps: boolean;
    tables: boolean;
    records: boolean;
    fields: boolean;
  };
  error: string | null;
  
  setCurrentApp: (app: QuickBaseApp | null) => void;
  setCurrentTable: (table: QuickBaseTable | null) => void;
  setApps: (apps: QuickBaseApp[]) => void;
  setTables: (tables: QuickBaseTable[]) => void;
  setRecords: (records: QuickBaseRecord[]) => void;
  setFields: (fields: QuickBaseField[]) => void;
  setLoading: (key: keyof QuickBaseState['loading'], value: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  currentApp: null,
  currentTable: null,
  apps: [],
  tables: [],
  records: [],
  fields: [],
  loading: {
    apps: false,
    tables: false,
    records: false,
    fields: false,
  },
  error: null,
};

export const useQuickBaseStore = create<QuickBaseState>((set) => ({
  ...initialState,
  
  setCurrentApp: (app) => set({ currentApp: app, currentTable: null }),
  setCurrentTable: (table) => set({ currentTable: table }),
  setApps: (apps) => set({ apps }),
  setTables: (tables) => set({ tables }),
  setRecords: (records) => set({ records }),
  setFields: (fields) => set({ fields }),
  setLoading: (key, value) => 
    set((state) => ({ 
      loading: { ...state.loading, [key]: value } 
    })),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}));
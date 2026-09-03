import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type Crumb = {
  label: string;
  to?: string;
};

export type AdminHeaderState = {
  title: string;
  subtitle?: string;
  breadcrumbs?: Crumb[];
  actions?: ReactNode;
};

type AdminHeaderContextValue = {
  header: AdminHeaderState;
  setHeader: (
    next:
      | AdminHeaderState
      | ((prev: AdminHeaderState) => AdminHeaderState),
  ) => void;
  clearHeader: () => void;
};

const defaultHeader: AdminHeaderState = {
  title: 'Admin',
  subtitle: '',
  breadcrumbs: [],
  actions: null,
};

const AdminHeaderContext = createContext<AdminHeaderContextValue | undefined>(
  undefined,
);

export function AdminHeaderProvider({ children }: { children: ReactNode }) {
  const [header, setHeaderState] = useState<AdminHeaderState>(defaultHeader);

  const setHeader = useCallback(
    (
      next:
        | AdminHeaderState
        | ((prev: AdminHeaderState) => AdminHeaderState),
    ) => {
      setHeaderState(next);
    },
    [],
  );

  const clearHeader = useCallback(() => {
    setHeaderState(defaultHeader);
  }, []);

  const value = useMemo(
    () => ({
      header,
      setHeader,
      clearHeader,
    }),
    [header, setHeader, clearHeader],
  );

  return (
    <AdminHeaderContext.Provider value={value}>{children}</AdminHeaderContext.Provider>
  );
}

export function useAdminHeader() {
  const context = useContext(AdminHeaderContext);
  if (!context) {
    throw new Error('useAdminHeader must be used within AdminHeaderProvider');
  }
  return context;
}

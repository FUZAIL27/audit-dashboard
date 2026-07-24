import { create } from 'zustand';
import { Severity, LogStatus } from '@/constants/enums';

interface FiltersState {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  search: string;
  severity: Severity[];
  status: LogStatus[];
  region: string[];
  resourceType: string[];
  dateFrom?: string;
  dateTo?: string;

  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  setSearch: (search: string) => void;
  toggleSeverity: (value: Severity) => void;
  toggleStatus: (value: LogStatus) => void;
  toggleRegion: (value: string) => void;
  toggleResourceType: (value: string) => void;
  setDateRange: (dateFrom?: string, dateTo?: string) => void;
  resetFilters: () => void;
}

const DEFAULTS = {
  page: 1,
  limit: 25,
  sortBy: 'timestamp',
  sortOrder: 'desc' as const,
  search: '',
  severity: [] as Severity[],
  status: [] as LogStatus[],
  region: [] as string[],
  resourceType: [] as string[],
  dateFrom: undefined,
  dateTo: undefined,
};

function toggleValue<T>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

export const useFiltersStore = create<FiltersState>((set) => ({
  ...DEFAULTS,

  setPage: (page) => set({ page }),
  setLimit: (limit) => set({ limit, page: 1 }),
  setSort: (sortBy, sortOrder) => set({ sortBy, sortOrder, page: 1 }),
  setSearch: (search) => set({ search, page: 1 }),
  toggleSeverity: (value) =>
    set((s) => ({ severity: toggleValue(s.severity, value), page: 1 })),
  toggleStatus: (value) => set((s) => ({ status: toggleValue(s.status, value), page: 1 })),
  toggleRegion: (value) => set((s) => ({ region: toggleValue(s.region, value), page: 1 })),
  toggleResourceType: (value) =>
    set((s) => ({ resourceType: toggleValue(s.resourceType, value), page: 1 })),
  setDateRange: (dateFrom, dateTo) => set({ dateFrom, dateTo, page: 1 }),
  resetFilters: () => set({ ...DEFAULTS }),
}));

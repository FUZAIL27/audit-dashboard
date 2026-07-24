import { describe, it, expect, beforeEach } from 'vitest';
import { useFiltersStore } from './filters.store';
import { Severity } from '@/constants/enums';

describe('useFiltersStore', () => {
  beforeEach(() => {
    useFiltersStore.getState().resetFilters();
  });

  it('toggles a severity filter on and off, resetting to page 1', () => {
    useFiltersStore.getState().setPage(3);
    useFiltersStore.getState().toggleSeverity(Severity.CRITICAL);

    expect(useFiltersStore.getState().severity).toContain(Severity.CRITICAL);
    expect(useFiltersStore.getState().page).toBe(1);

    useFiltersStore.getState().toggleSeverity(Severity.CRITICAL);
    expect(useFiltersStore.getState().severity).not.toContain(Severity.CRITICAL);
  });

  it('resets all filters to defaults', () => {
    useFiltersStore.getState().setSearch('alice');
    useFiltersStore.getState().toggleSeverity(Severity.HIGH);
    useFiltersStore.getState().resetFilters();

    const state = useFiltersStore.getState();
    expect(state.search).toBe('');
    expect(state.severity).toHaveLength(0);
    expect(state.page).toBe(1);
  });
});

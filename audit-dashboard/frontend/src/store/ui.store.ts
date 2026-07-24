import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  mobileSidebarOpen: boolean;
  openMobileSidebar: () => void;
  closeMobileSidebar: () => void;
  toggleMobileSidebar: () => void;

  drawerLogId: string | null;
  openDrawer: (id: string) => void;
  closeDrawer: () => void;

  columnVisibility: Record<string, boolean>;
  setColumnVisibility: (visibility: Record<string, boolean>) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      mobileSidebarOpen: false,
      openMobileSidebar: () => set({ mobileSidebarOpen: true }),
      closeMobileSidebar: () => set({ mobileSidebarOpen: false }),
      toggleMobileSidebar: () => set((s) => ({ mobileSidebarOpen: !s.mobileSidebarOpen })),

      drawerLogId: null,
      openDrawer: (id) => set({ drawerLogId: id }),
      closeDrawer: () => set({ drawerLogId: null }),

      columnVisibility: {},
      setColumnVisibility: (columnVisibility) => set({ columnVisibility }),
    }),
    {
      name: 'audit-dashboard-ui',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        columnVisibility: state.columnVisibility,
      }),
    }
  )
);

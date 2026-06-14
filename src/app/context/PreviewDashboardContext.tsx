import { createContext, useContext, type ReactNode } from "react";
import type { AdminUserPreviewData } from "../../lib/admin-preview";

const PreviewDashboardContext = createContext<AdminUserPreviewData | null>(null);

export function PreviewDashboardProvider({
  value,
  children,
}: {
  value: AdminUserPreviewData | null;
  children: ReactNode;
}) {
  return (
    <PreviewDashboardContext.Provider value={value}>
      {children}
    </PreviewDashboardContext.Provider>
  );
}

export function usePreviewDashboard() {
  return useContext(PreviewDashboardContext);
}

import { useState } from "react";
import { getAdminKey } from "../../../lib/admin";
import { AdminDevGate } from "./AdminDevGate";
import { AdminDashboard } from "./AdminDashboard";

export function AdminPage() {
  const [hasAccess, setHasAccess] = useState(() => !!getAdminKey());

  if (!hasAccess) {
    return <AdminDevGate onAccessGranted={() => setHasAccess(true)} />;
  }

  return <AdminDashboard onLogout={() => setHasAccess(false)} />;
}

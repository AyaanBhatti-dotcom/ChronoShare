import { useEffect, useState } from "react";
import { clearAdminKey } from "../../../lib/admin";
import { AdminDevGate } from "./AdminDevGate";
import { AdminDashboard } from "./AdminDashboard";

export function AdminPage() {
  const [adminKey, setAdminKey] = useState<string | null>(null);

  useEffect(() => {
    clearAdminKey();

    return () => {
      clearAdminKey();
      setAdminKey(null);
    };
  }, []);

  if (!adminKey) {
    return <AdminDevGate onAccessGranted={setAdminKey} />;
  }

  return <AdminDashboard adminKey={adminKey} onLogout={() => setAdminKey(null)} />;
}

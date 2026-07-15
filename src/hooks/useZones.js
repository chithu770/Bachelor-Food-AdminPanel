import { useEffect, useMemo, useState } from "react";
import { createZone, deleteZone, listenToZones, updateZone } from "../services/zoneService";
import { getFirebaseErrorMessage } from "../utils/helpers";

export function useZones() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = listenToZones(
      (items) => {
        setZones(items);
        setLoading(false);
      },
      (err) => {
        const msg =
          err?.code === "permission-denied"
            ? "Permission denied. Check Firestore rules."
            : getFirebaseErrorMessage(err);
        setError(msg);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  const stats = useMemo(
    () => ({ count: zones.length }),
    [zones]
  );

  return { zones, loading, error, stats, createZone, updateZone, deleteZone };
}

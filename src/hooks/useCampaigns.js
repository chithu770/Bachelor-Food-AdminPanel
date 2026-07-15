import { useEffect, useMemo, useState } from "react";
import { createCampaign, deleteCampaign, listenToCampaigns, updateCampaign } from "../services/campaignService";
import { getFirebaseErrorMessage } from "../utils/helpers";

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = listenToCampaigns(
      (items) => {
        setCampaigns(items);
        setLoading(false);
      },
      (err) => {
        const msg = err?.code === "permission-denied" 
          ? "Permission denied. Check Firestore rules." 
          : getFirebaseErrorMessage(err);
        setError(msg);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  const stats = useMemo(
    () => ({
      count: campaigns.length,
      activeCount: campaigns.filter(c => c.active).length
    }),
    [campaigns]
  );

  return { campaigns, loading, error, stats, createCampaign, updateCampaign, deleteCampaign };
}
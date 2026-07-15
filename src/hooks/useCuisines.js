import { useEffect, useMemo, useState } from "react";
import { deleteCuisine, listenToCuisines, createCuisine, updateCuisine } from "../services/cuisineService";
import { getFirebaseErrorMessage } from "../utils/helpers";

export function useCuisines() {
  const [cuisines, setCuisines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = listenToCuisines(
      (items) => {
        setCuisines(items);
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
    () => ({ count: cuisines.length }),
    [cuisines]
  );

  return { cuisines, loading, error, stats, createCuisine, updateCuisine, deleteCuisine };
}

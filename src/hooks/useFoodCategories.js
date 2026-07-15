import { useEffect, useMemo, useState } from "react";
import { deleteFoodCategory, listenToFoodCategories, createFoodCategory, updateFoodCategory } from "../services/foodCategoryService";
import { getFirebaseErrorMessage } from "../utils/helpers";

export function useFoodCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = listenToFoodCategories(
      (items) => {
        setCategories(items);
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
    () => ({ count: categories.length }),
    [categories]
  );

  return { categories, loading, error, stats, createFoodCategory, updateFoodCategory, deleteFoodCategory };
}
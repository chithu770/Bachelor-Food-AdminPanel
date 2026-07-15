import { useEffect, useMemo, useState } from "react";
import { createCoupon, deleteCoupon, listenToCoupons, updateCoupon } from "../services/couponService";
import { getFirebaseErrorMessage } from "../utils/helpers";

export function useCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = listenToCoupons(
      (items) => {
        setCoupons(items);
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
      count: coupons.length,
      activeCount: coupons.filter(c => c.active).length
    }),
    [coupons]
  );

  return { coupons, loading, error, stats, createCoupon, updateCoupon, deleteCoupon };
}
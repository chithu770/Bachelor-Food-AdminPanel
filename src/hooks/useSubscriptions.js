import { useEffect, useMemo, useState } from "react";
import { createSubscription, deleteSubscription, listenToSubscriptions, updateSubscription } from "../services/subscriptionService";
import { getFirebaseErrorMessage } from "../utils/helpers";

function normalizeSubscription(item, type) {
  if (!item) return null;
  return {
    ...item,
    planName: item.planTitle || item.planName || "Unnamed Plan",
    pricePerMeal: item.price !== undefined ? item.price : (item.pricePerMeal || 0),
    frequency: item.planType || item.frequency || (type === "weekly" ? "Weekly" : "Monthly"),
    nextDeliveryDate: item.endDate || item.nextDeliveryDate || "",
    customerName: item.customerName || "Anonymous",
    customerPhone: item.customerPhone || "—",
    _collection: item._collection || type
  };
}

export function useSubscriptions(type = "weekly") {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    const unsubscribe = listenToSubscriptions(
      type,
      (items) => {
        const normalized = items.map((item) => normalizeSubscription(item, type));
        const sorted = normalized.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
          const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
          return dateB - dateA;
        });
        setSubscriptions(sorted);
        setLoading(false);
      },
      (err) => {
        const msg = err?.code === "permission-denied"
          ? "Permission denied. Check Firestore rules allow read access."
          : getFirebaseErrorMessage(err);
        setError(msg);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [type]);

  const stats = useMemo(() => {
    const active   = subscriptions.filter((s) => s.status === "active").length;
    const paused   = subscriptions.filter((s) => s.status === "paused").length;
    const cancelled = subscriptions.filter((s) => s.status === "cancelled").length;
    const potentialRevenue = subscriptions
      .filter((s) => s.status === "active")
      .reduce((sum, s) => sum + Number(s.pricePerMeal || 0), 0);
    return {
      total: subscriptions.length,
      active,
      paused,
      cancelled,
      potentialRevenue
    };
  }, [subscriptions]);

  return { 
    subscriptions, 
    loading, 
    error, 
    stats, 
    createSubscription: (data) => {
      const targetType = type === "all" ? (data.frequency === "monthly" ? "monthly" : "weekly") : type;
      const payload = {
        ...data,
        planTitle: data.planName || data.planTitle || "",
        price: data.pricePerMeal !== undefined ? Number(data.pricePerMeal) : Number(data.price || 0),
        planType: data.frequency || (targetType === "weekly" ? "Weekly" : "Monthly"),
        endDate: data.nextDeliveryDate || data.endDate || "",
      };
      return createSubscription(targetType, payload);
    },
    updateSubscription: (id, data) => {
      const existing = subscriptions.find(s => s.id === id);
      const targetType = type === "all" ? (existing?._collection || (data.frequency === "monthly" ? "monthly" : "weekly")) : type;
      const payload = {
        ...data,
        planTitle: data.planName || data.planTitle || "",
        price: data.pricePerMeal !== undefined ? Number(data.pricePerMeal) : Number(data.price || 0),
        planType: data.frequency || (targetType === "weekly" ? "Weekly" : "Monthly"),
        endDate: data.nextDeliveryDate || data.endDate || "",
      };
      return updateSubscription(targetType, id, payload);
    }, 
    deleteSubscription: (id) => {
      const existing = subscriptions.find(s => s.id === id);
      const targetType = type === "all" ? (existing?._collection || "weekly") : type;
      return deleteSubscription(targetType, id);
    }
  };
}

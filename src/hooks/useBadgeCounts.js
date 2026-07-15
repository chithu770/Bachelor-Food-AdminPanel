import { useState } from "react";

const FALLBACK_COUNTS = {
  offlinePaymentPending: 0,
  subscriptionOrders: 0,
  dispatchSearching: 0,
  dispatchOngoing: 0,
  refundRequests: 0,
  restaurantPending: 0,
  deliverymanPending: 0,
  contactMessages: 0,
};

export function useBadgeCounts() {
  const [counts] = useState({ ...FALLBACK_COUNTS });
  return { counts, loading: false, error: null, refetch: () => {} };
}
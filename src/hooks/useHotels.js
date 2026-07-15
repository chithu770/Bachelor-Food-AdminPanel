import { useEffect, useMemo, useState } from "react";
import { createHotel, deleteHotel, listenToHotels, updateHotel } from "../services/hotelService";
import { getFirebaseErrorMessage } from "../utils/helpers";

export function useHotels() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = listenToHotels(
      (items) => {
        setHotels(items);
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
  }, []);

  const stats = useMemo(
    () => ({
      count: hotels.length,
      averageRating: hotels.length ? hotels.reduce((sum, hotel) => sum + Number(hotel.rating || 0), 0) / hotels.length : 0
    }),
    [hotels]
  );

  return { hotels, loading, error, stats, createHotel, updateHotel, deleteHotel };
}

import { useEffect, useMemo, useState } from "react";
import { createHotel, deleteHotel, listenToHotels, updateHotel, approveRestaurantRequest } from "../services/hotelService";
import { getFirebaseErrorMessage } from "../utils/helpers";

export function useHotels(isPending = false) {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = listenToHotels(isPending,
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
  }, [isPending]);

  const stats = useMemo(
    () => ({
      count: hotels.length,
      averageRating: hotels.length ? hotels.reduce((sum, hotel) => sum + Number(hotel.rating || 0), 0) / hotels.length : 0
    }),
    [hotels]
  );

  const wrappedCreateHotel = (hotel) => createHotel(isPending, hotel);
  const wrappedUpdateHotel = (id, hotel) => updateHotel(isPending, id, hotel);
  const wrappedDeleteHotel = (id) => deleteHotel(isPending, id);

  return { hotels, loading, error, stats, createHotel: wrappedCreateHotel, updateHotel: wrappedUpdateHotel, deleteHotel: wrappedDeleteHotel, approveRestaurantRequest };
}

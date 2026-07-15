import { useEffect, useState } from "react";
import {
  createShift as createService,
  deleteShift as deleteService,
  listenToShifts,
  updateShift as updateService
} from "../services/shiftService";

export function useShifts() {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = listenToShifts(
      (data) => {
        setShifts(data);
        setLoading(false);
      },
      (err) => {
        setError(err.message || "Failed to load shifts");
        setLoading(false);
      }
    );
    return () => unsubscribe && unsubscribe();
  }, []);

  async function createShift(data) {
    return createService(data);
  }

  async function updateShift(id, data) {
    return updateService(id, data);
  }

  async function deleteShift(id) {
    return deleteService(id);
  }

  return { shifts, loading, error, createShift, updateShift, deleteShift };
}

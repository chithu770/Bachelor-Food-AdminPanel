import { useEffect, useState } from "react";
import {
  createVehicle as createService,
  deleteVehicle as deleteService,
  listenToVehicles,
  updateVehicle as updateService
} from "../services/vehicleService";

export function useVehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = listenToVehicles(
      (data) => {
        setVehicles(data);
        setLoading(false);
      },
      (err) => {
        setError(err.message || "Failed to load vehicles");
        setLoading(false);
      }
    );
    return () => unsubscribe && unsubscribe();
  }, []);

  async function createVehicle(data) {
    return createService(data);
  }

  async function updateVehicle(id, data) {
    return updateService(id, data);
  }

  async function deleteVehicle(id) {
    return deleteService(id);
  }

  return { vehicles, loading, error, createVehicle, updateVehicle, deleteVehicle };
}

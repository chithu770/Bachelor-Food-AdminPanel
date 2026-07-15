import { useEffect, useState } from "react";
import {
  createAddon as createService,
  deleteAddon as deleteService,
  listenToAddons,
  updateAddon as updateService
} from "../services/addonService";

export function useAddons() {
  const [addons, setAddons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = listenToAddons(
      (data) => {
        setAddons(data);
        setLoading(false);
      },
      (err) => {
        setError(err.message || "Failed to load addons");
        setLoading(false);
      }
    );
    return () => unsubscribe && unsubscribe();
  }, []);

  async function createAddon(data) {
    return createService(data);
  }

  async function updateAddon(id, data) {
    return updateService(id, data);
  }

  async function deleteAddon(id) {
    return deleteService(id);
  }

  return { addons, loading, error, createAddon, updateAddon, deleteAddon };
}

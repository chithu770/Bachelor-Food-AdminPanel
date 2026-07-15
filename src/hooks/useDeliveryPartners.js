import { useEffect, useMemo, useState } from "react";
import {
  createDeliveryPartner as createService,
  deleteDeliveryPartner as deleteService,
  listenToDeliveryPartners,
  updateDeliveryPartner as updateService
} from "../services/deliveryService";

export function useDeliveryPartners() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = listenToDeliveryPartners(
      (data) => {
        setPartners(data);
        setLoading(false);
      },
      (err) => {
        setError(err.message || "Failed to load delivery partners");
        setLoading(false);
      }
    );
    return () => unsubscribe && unsubscribe();
  }, []);

  const stats = useMemo(() => {
    return {
      count: partners.length,
      activeCount: partners.filter((p) => p.status === "active").length,
      pendingCount: partners.filter((p) => p.status === "pending").length
    };
  }, [partners]);

  async function createPartner(data) {
    return createService(data);
  }

  async function updatePartner(id, data) {
    return updateService(id, data);
  }

  async function deletePartner(id) {
    return deleteService(id);
  }

  return { partners, loading, error, stats, createPartner, updatePartner, deletePartner };
}

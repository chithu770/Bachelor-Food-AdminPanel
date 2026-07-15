import { useEffect, useState } from "react";
import { getSettings, updateSettings } from "../services/settingsService";

export function useSettings(type) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await getSettings(type);
        setSettings(data);
        if (type === "business") {
          localStorage.setItem("businessSettings", JSON.stringify(data));
        }
      } catch (err) {
        setError("Failed to load settings.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [type]);

  async function saveSettings(data) {
    await updateSettings(type, data);
    setSettings(prev => {
      const updated = { ...prev, ...data };
      if (type === "business") {
        localStorage.setItem("businessSettings", JSON.stringify(updated));
      }
      return updated;
    });
  }

  return { settings, loading, error, saveSettings };
}

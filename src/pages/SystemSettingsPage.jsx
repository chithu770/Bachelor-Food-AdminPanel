import { Server, Save } from "lucide-react";
import { useState, useEffect } from "react";
import Toast from "../components/common/Toast";
import { useSettings } from "../hooks/useSettings";

export default function SystemSettingsPage() {
  const { settings, loading, error, saveSettings } = useSettings("system");
  const [formData, setFormData] = useState({});
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await saveSettings(formData);
      setToast({ type: "success", message: "System settings saved successfully." });
    } catch (err) {
      setToast({ type: "error", message: "Failed to save settings." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="grid min-h-[400px] place-items-center text-slate-600">
        <div className="flex items-center gap-3">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-ember" />
          <span className="text-sm font-medium">Loading settings</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="page-header">
        <p className="eyebrow">Platform Configuration</p>
        <h1 className="page-title">System Settings</h1>
      </div>

      {error ? <div className="alert">{error}</div> : null}

      <form onSubmit={handleSubmit} className="panel space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Server className="w-5 h-5 text-ember" />
          <h2 className="text-lg font-bold text-slate-950">Technical Configuration</h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <label className="field-label">
            App Name
            <input
              className="input"
              value={formData.appName || ""}
              onChange={(e) => setFormData({ ...formData, appName: e.target.value })}
              placeholder="Bachelor Foods Admin"
            />
          </label>
          <label className="field-label">
            App Version
            <input
              className="input"
              value={formData.appVersion || "1.0.0"}
              onChange={(e) => setFormData({ ...formData, appVersion: e.target.value })}
            />
          </label>
          <label className="field-label">
            Default Delivery Radius (km)
            <input
              type="number"
              className="input"
              value={formData.deliveryRadius || 10}
              onChange={(e) => setFormData({ ...formData, deliveryRadius: Number(e.target.value) })}
            />
          </label>
          <label className="field-label flex flex-row items-center gap-3 mt-8">
            <input
              type="checkbox"
              className="w-4 h-4 text-ember rounded focus:ring-ember"
              checked={formData.allowRegistration || false}
              onChange={(e) => setFormData({ ...formData, allowRegistration: e.target.checked })}
            />
            <span className="text-sm font-medium text-slate-900">Allow Open Registration</span>
          </label>
        </div>

        <div className="pt-4 flex justify-end">
          <button type="submit" className="btn-primary flex items-center gap-2" disabled={saving}>
            {saving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" /> : <Save className="w-4 h-4" />}
            Save Settings
          </button>
        </div>
      </form>

      <Toast message={toast?.message} onClose={() => setToast(null)} type={toast?.type} />
    </div>
  );
}

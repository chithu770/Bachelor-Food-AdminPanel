import { Settings, Save } from "lucide-react";
import { useState, useEffect } from "react";
import Toast from "../components/common/Toast";
import { useSettings } from "../hooks/useSettings";

export default function BusinessSettingsPage() {
  const { settings, loading, error, saveSettings } = useSettings("business");
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
      setToast({ type: "success", message: "Business settings saved successfully." });
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
        <h1 className="page-title">Business Settings</h1>
      </div>

      {error ? <div className="alert">{error}</div> : null}

      <form onSubmit={handleSubmit} className="panel space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-ember" />
          <h2 className="text-lg font-bold text-slate-950">General Information</h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <label className="field-label">
            Company Name
            <input
              className="input"
              value={formData.companyName || ""}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              placeholder="Bachelor Foods"
            />
          </label>
          <label className="field-label">
            Contact Email
            <input
              type="email"
              className="input"
              value={formData.contactEmail || ""}
              onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              placeholder="support@bachelorfoods.com"
            />
          </label>
          <label className="field-label">
            Support Phone
            <input
              className="input"
              value={formData.supportPhone || ""}
              onChange={(e) => setFormData({ ...formData, supportPhone: e.target.value })}
              placeholder="+1 234 567 8900"
            />
          </label>
          <label className="field-label">
            Company Address
            <input
              className="input"
              value={formData.address || ""}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="123 Food Street, City"
            />
          </label>
        </div>

        <hr className="border-slate-200" />

        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-bold text-slate-950">Operational Settings</h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <label className="field-label">
            Currency Symbol
            <select
              className="input"
              value={formData.currencySymbol || "Rs."}
              onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
            >
              <option value="Rs.">Rs. (Rupees)</option>
              <option value="₹">₹ (INR)</option>
              <option value="$">$ (USD)</option>
              <option value="€">€ (EUR)</option>
              <option value="£">£ (GBP)</option>
            </select>
          </label>
          <label className="field-label">
            Timezone
            <select
              className="input"
              value={formData.timezone || "UTC"}
              onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
              <option value="Europe/London">London</option>
              <option value="Asia/Kolkata">India (IST)</option>
            </select>
          </label>
          <label className="field-label flex flex-row items-center gap-3">
            <input
              type="checkbox"
              className="w-4 h-4 text-ember rounded focus:ring-ember"
              checked={formData.maintenanceMode || false}
              onChange={(e) => setFormData({ ...formData, maintenanceMode: e.target.checked })}
            />
            <span className="text-sm font-medium text-slate-900">Enable Maintenance Mode</span>
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

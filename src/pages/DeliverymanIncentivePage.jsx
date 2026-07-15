import { HandCoins, Plus, Trash2, ToggleLeft, ToggleRight, History } from "lucide-react";
import { useEffect, useState } from "react";
import Toast from "../components/common/Toast";
import ConfirmDialog from "../components/common/ConfirmDialog";
import {
  listenToIncentiveRules,
  createIncentiveRule,
  updateIncentiveRule,
  deleteIncentiveRule,
  listenToIncentiveHistory,
} from "../services/financeService";
import { formatCurrency, getFirebaseErrorMessage } from "../utils/helpers";

const defaultForm = { title: "", minOrders: "", bonusAmount: "", period: "daily", active: true };

function RulesTab({ rules, loading, onToggle, onDelete, onAdd }) {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  async function handleCreate(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createIncentiveRule({ title: form.title, minOrders: Number(form.minOrders), bonusAmount: Number(form.bonusAmount), period: form.period, active: form.active });
      setToast({ type: "success", message: "Rule created." });
      setForm(defaultForm);
      setShowCreate(false);
    } catch (err) {
      setToast({ type: "error", message: getFirebaseErrorMessage(err) });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button className="btn-primary" onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" /> Add Rule</button>
      </div>
      {showCreate && (
        <div className="panel border-ember/30 border">
          <h3 className="font-semibold text-slate-900 mb-4">New Incentive Rule</h3>
          <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-2">
            <label className="field-label md:col-span-2">Title <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Daily Champion" required /></label>
            <label className="field-label">Min Orders Per Period <input className="input" type="number" min="1" value={form.minOrders} onChange={(e) => setForm({ ...form, minOrders: e.target.value })} placeholder="10" required /></label>
            <label className="field-label">Bonus Amount (₹) <input className="input" type="number" min="0" value={form.bonusAmount} onChange={(e) => setForm({ ...form, bonusAmount: e.target.value })} placeholder="50" required /></label>
            <label className="field-label">Period
              <select className="input" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </label>
            <label className="flex items-center gap-3 text-sm font-semibold text-slate-700 self-end">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="h-4 w-4 accent-ember" /> Active
            </label>
            <div className="flex justify-end gap-3 md:col-span-2">
              <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? "Saving…" : "Create Rule"}</button>
            </div>
          </form>
        </div>
      )}
      {loading ? (
        <div className="grid min-h-[200px] place-items-center"><span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-ember" /></div>
      ) : !rules.length ? (
        <div className="empty-state">No incentive rules configured. Create your first rule above.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rules.map((rule) => (
            <div key={rule.id} className={`rounded-md border p-4 ${rule.active ? "border-slate-200" : "border-slate-100 opacity-70"}`}>
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-slate-900">{rule.title}</h4>
                  <p className="text-xs text-slate-500 mt-1 capitalize">{rule.period} · Min {rule.minOrders} orders</p>
                </div>
                <button onClick={() => onToggle(rule)}>
                  {rule.active ? <ToggleRight className="h-6 w-6 text-green-500" /> : <ToggleLeft className="h-6 w-6 text-slate-400" />}
                </button>
              </div>
              <p className="mt-3 text-2xl font-bold text-ember">{formatCurrency(rule.bonusAmount)}</p>
              <p className="text-xs text-slate-400">Bonus per {rule.period}</p>
              <div className="mt-3 flex justify-end border-t border-slate-100 pt-3">
                <button onClick={() => onDelete(rule)} className="p-1.5 rounded text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      {toast && <div className={`fixed bottom-4 right-4 z-50 rounded-md px-4 py-3 text-sm font-semibold shadow-lg ${toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>{toast.message}</div>}
    </div>
  );
}

function HistoryTab({ history, loading }) {
  return loading ? (
    <div className="grid min-h-[200px] place-items-center"><span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-ember" /></div>
  ) : !history.length ? (
    <div className="empty-state">No incentive history available.</div>
  ) : (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-slate-600">
        <thead className="border-b border-slate-200 bg-slate-50 text-slate-900">
          <tr>
            <th className="p-3 font-semibold">Sl</th>
            <th className="p-3 font-semibold">Delivery Man</th>
            <th className="p-3 font-semibold">Rule</th>
            <th className="p-3 font-semibold">Orders Completed</th>
            <th className="p-3 font-semibold">Bonus Earned</th>
            <th className="p-3 font-semibold">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {history.map((h, i) => (
            <tr key={h.id} className="hover:bg-slate-50/50">
              <td className="p-3 text-slate-500">{i + 1}</td>
              <td className="p-3 font-medium text-slate-900">{h.deliverymanName || "—"}</td>
              <td className="p-3">{h.ruleName || "—"}</td>
              <td className="p-3">{h.ordersCompleted || 0}</td>
              <td className="p-3 font-bold text-green-600">{formatCurrency(h.bonusAmount)}</td>
              <td className="p-3 text-slate-500">{h.createdAt?.toDate ? h.createdAt.toDate().toLocaleDateString() : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function DeliverymanIncentivePage() {
  const [activeTab, setActiveTab] = useState("rules");
  const [rules, setRules] = useState([]);
  const [history, setHistory] = useState([]);
  const [rulesLoading, setRulesLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [deletingRule, setDeletingRule] = useState(null);

  useEffect(() => {
    const u1 = listenToIncentiveRules((d) => { setRules(d); setRulesLoading(false); }, (e) => { console.error(e); setRulesLoading(false); });
    const u2 = listenToIncentiveHistory((d) => { setHistory(d); setHistoryLoading(false); }, (e) => { console.error(e); setHistoryLoading(false); });
    return () => { u1 && u1(); u2 && u2(); };
  }, []);

  async function handleToggle(rule) {
    try {
      await updateIncentiveRule(rule.id, { active: !rule.active });
      setToast({ type: "success", message: `Rule ${!rule.active ? "activated" : "deactivated"}.` });
    } catch (err) {
      setToast({ type: "error", message: getFirebaseErrorMessage(err) });
    }
  }

  async function handleDelete() {
    try {
      await deleteIncentiveRule(deletingRule.id);
      setToast({ type: "success", message: "Rule deleted." });
      setDeletingRule(null);
    } catch (err) {
      setToast({ type: "error", message: getFirebaseErrorMessage(err) });
    }
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <p className="eyebrow">Delivery Man Management</p>
        <h1 className="page-title">Incentives</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="metric"><HandCoins className="h-5 w-5 text-ember" /><span>Active Rules</span><strong>{rules.filter((r) => r.active).length}</strong></div>
        <div className="metric"><span>Total Rules</span><strong>{rules.length}</strong></div>
        <div className="metric"><History className="h-5 w-5 text-blue-500" /><span>History Records</span><strong>{history.length}</strong></div>
      </div>

      <div className="flex gap-1 border-b border-slate-200">
        {[{ key: "rules", label: "Incentive Rules" }, { key: "history", label: "Incentive History" }].map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${activeTab === tab.key ? "border-ember text-ember" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="panel">
        {activeTab === "rules" ? (
          <RulesTab rules={rules} loading={rulesLoading} onToggle={handleToggle} onDelete={(r) => setDeletingRule(r)} />
        ) : (
          <HistoryTab history={history} loading={historyLoading} />
        )}
      </div>

      <ConfirmDialog confirmLabel="Delete Rule" message={`Delete "${deletingRule?.title}" incentive rule?`} onCancel={() => setDeletingRule(null)} onConfirm={handleDelete} open={Boolean(deletingRule)} title="Delete Rule" />
      <Toast message={toast?.message} onClose={() => setToast(null)} type={toast?.type} />
    </div>
  );
}

import { Wallet, Plus, Trash2, ArrowUpCircle, ArrowDownCircle, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ConfirmDialog from "../components/common/ConfirmDialog";
import Toast from "../components/common/Toast";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { formatCurrency, getFirebaseErrorMessage } from "../utils/helpers";
import { listenToWalletTransactions, createWalletTransaction, deleteWalletTransaction } from "../services/walletService";

function formatDateTime(val) {
  if (!val) return "—";
  const d = val instanceof Date ? val : val.toDate ? val.toDate() : new Date(val);
  return isNaN(d.getTime()) ? String(val) : d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const TX_TYPES = [
  { value: "credit", label: "Credit (add funds)" },
  { value: "debit", label: "Debit (deduct funds)" },
  { value: "cashback", label: "Cashback reward" },
  { value: "refund", label: "Refund" },
  { value: "bonus", label: "Bonus credit" },
];

const defaultValues = {
  customerName: "",
  customerPhone: "",
  customerId: "",
  type: "credit",
  amount: "",
  description: "",
  referenceId: "",
};

export default function WalletPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [values, setValues] = useState(defaultValues);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [deleting, setDeleting] = useState(null);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    setLoading(true);
    const unsub = listenToWalletTransactions(
      (items) => { setTransactions(items); setLoading(false); setError(""); },
      (err) => { setError(getFirebaseErrorMessage(err)); setLoading(false); }
    );
    return unsub;
  }, []);

  function set(field, val) {
    setValues((v) => ({ ...v, [field]: val }));
    setFormErrors((e) => ({ ...e, [field]: "" }));
  }

  function validate() {
    const errs = {};
    if (!values.customerName.trim()) errs.customerName = "Customer name is required.";
    if (!values.amount || Number(values.amount) <= 0) errs.amount = "A valid amount is required.";
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    setFormErrors(errs);
    if (Object.keys(errs).length) return;
    setSubmitting(true);
    try {
      await createWalletTransaction({ ...values, amount: Number(values.amount) });
      setToast({ type: "success", message: "Wallet transaction recorded" });
      setValues(defaultValues);
    } catch (err) {
      setToast({ type: "error", message: getFirebaseErrorMessage(err) });
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = useMemo(() => {
    const kw = query.toLowerCase();
    return transactions.filter((t) => {
      const matchType = typeFilter === "all" || t.type === typeFilter;
      const matchQuery = [t.customerName, t.customerPhone, t.description, t.referenceId]
        .filter(Boolean).join(" ").toLowerCase().includes(kw);
      return matchType && matchQuery;
    });
  }, [transactions, query, typeFilter]);

  const stats = useMemo(() => {
    const credits = transactions.filter((t) => ["credit", "cashback", "refund", "bonus"].includes(t.type));
    const debits = transactions.filter((t) => t.type === "debit");
    return {
      total: transactions.length,
      totalCredits: credits.reduce((s, t) => s + Number(t.amount || 0), 0),
      totalDebits: debits.reduce((s, t) => s + Number(t.amount || 0), 0),
    };
  }, [transactions]);

  async function confirmDelete() {
    try {
      await deleteWalletTransaction(deleting.id);
      setToast({ type: "success", message: "Transaction deleted" });
      setDeleting(null);
    } catch (err) {
      setToast({ type: "error", message: getFirebaseErrorMessage(err) });
    }
  }

  const typeMeta = {
    credit:   { cls: "bg-leaf/10 text-leaf",       icon: ArrowUpCircle },
    cashback: { cls: "bg-emerald-100 text-emerald-700", icon: ArrowUpCircle },
    refund:   { cls: "bg-blue-100 text-blue-700",   icon: ArrowUpCircle },
    bonus:    { cls: "bg-violet-100 text-violet-700", icon: ArrowUpCircle },
    debit:    { cls: "bg-rose-100 text-rose-700",   icon: ArrowDownCircle },
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <p className="eyebrow">Finance</p>
          <h1 className="page-title">Wallet &amp; Credits</h1>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="metric">
          <Wallet className="h-5 w-5 text-ember" />
          <span>Total transactions</span>
          <strong>{stats.total}</strong>
        </div>
        <div className="metric">
          <ArrowUpCircle className="h-5 w-5 text-leaf" />
          <span>Total credits</span>
          <strong className="text-leaf">{formatCurrency(stats.totalCredits)}</strong>
        </div>
        <div className="metric">
          <ArrowDownCircle className="h-5 w-5 text-rose-500" />
          <span>Total debits</span>
          <strong className="text-rose-600">{formatCurrency(stats.totalDebits)}</strong>
        </div>
      </div>

      {error ? <div className="alert">{error}</div> : null}

      {/* Add Transaction */}
      <form className="panel space-y-4" onSubmit={handleSubmit}>
        <div>
          <h2 className="text-lg font-bold text-slate-950">Add wallet transaction</h2>
          <p className="mt-1 text-sm text-slate-500">Manually add credits, cashback, or debit from a customer wallet.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="field-label">
            Customer name
            <input className="input" onChange={(e) => set("customerName", e.target.value)} placeholder="Full name" value={values.customerName} />
            {formErrors.customerName ? <span className="field-error">{formErrors.customerName}</span> : null}
          </label>
          <label className="field-label">
            Customer phone
            <input className="input" onChange={(e) => set("customerPhone", e.target.value)} placeholder="+91 98765 43210" value={values.customerPhone} />
          </label>
          <label className="field-label">
            Customer ID (optional)
            <input className="input" onChange={(e) => set("customerId", e.target.value)} placeholder="Firebase user ID" value={values.customerId} />
          </label>
          <label className="field-label">
            Transaction type
            <select className="input" onChange={(e) => set("type", e.target.value)} value={values.type}>
              {TX_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </label>
          <label className="field-label">
            Amount (₹)
            <input className="input" min="0" onChange={(e) => set("amount", e.target.value)} placeholder="0" step="0.01" type="number" value={values.amount} />
            {formErrors.amount ? <span className="field-error">{formErrors.amount}</span> : null}
          </label>
          <label className="field-label">
            Reference ID
            <input className="input" onChange={(e) => set("referenceId", e.target.value)} placeholder="Order ID, coupon code, etc." value={values.referenceId} />
          </label>
          <label className="field-label md:col-span-2">
            Description
            <input className="input" onChange={(e) => set("description", e.target.value)} placeholder="e.g. Cashback for order #1234" value={values.description} />
          </label>
        </div>
        <div className="flex justify-end">
          <button className="btn-primary" disabled={submitting} type="submit">
            <Plus className="h-4 w-4" />
            {submitting ? "Recording…" : "Record transaction"}
          </button>
        </div>
      </form>

      {/* Transaction History */}
      <div className="panel">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {["all", "credit", "debit", "cashback", "refund", "bonus"].map((t) => (
              <button
                key={t}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition-colors ${typeFilter === t ? "bg-ember text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                onClick={() => setTypeFilter(t)}
                type="button"
              >
                {t}
              </button>
            ))}
          </div>
          <input className="input sm:max-w-xs" onChange={(e) => setQuery(e.target.value)} placeholder="Search transactions…" value={query} />
        </div>

        {loading ? (
          <LoadingSpinner label="Loading transactions" />
        ) : filtered.length === 0 ? (
          <div className="empty-state">No wallet transactions yet.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((tx) => {
              const meta = typeMeta[tx.type] || typeMeta.credit;
              const TxIcon = meta.icon;
              const isCredit = tx.type !== "debit";
              return (
                <div className="flex items-center gap-4 py-4" key={tx.id}>
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${meta.cls}`}>
                    <TxIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-950">{tx.customerName}</p>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${meta.cls}`}>{tx.type}</span>
                    </div>
                    <p className="text-sm text-slate-500">{tx.description || "—"}</p>
                    <p className="text-xs text-slate-400">{tx.customerPhone} · {formatDateTime(tx.createdAt)}</p>
                  </div>
                  <p className={`shrink-0 text-sm font-bold ${isCredit ? "text-leaf" : "text-rose-600"}`}>
                    {isCredit ? "+" : "-"}{formatCurrency(tx.amount)}
                  </p>
                  <button className="icon-danger shrink-0" onClick={() => setDeleting(tx)} type="button">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        confirmLabel="Delete transaction"
        message="Delete this wallet transaction permanently? This cannot be undone."
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
        open={Boolean(deleting)}
        title="Delete transaction"
      />
      <Toast message={toast?.message} onClose={() => setToast(null)} type={toast?.type} />
    </div>
  );
}

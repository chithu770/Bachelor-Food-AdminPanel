import { RefreshCcw, Search, CheckCircle, XCircle } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import Toast from "../components/common/Toast";
import ConfirmDialog from "../components/common/ConfirmDialog";
import { listenToOrders, updateOrder } from "../services/orderService";
import { formatCurrency, getFirebaseErrorMessage } from "../utils/helpers";

export default function RefundsPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState(null);
  const [processingOrder, setProcessingOrder] = useState(null);
  const [actionType, setActionType] = useState(null);

  useEffect(() => {
    const unsub = listenToOrders(
      (data) => {
        setOrders(data);
        setLoading(false);
      },
      (err) => {
        setToast({ type: "error", message: getFirebaseErrorMessage(err) });
        setLoading(false);
      }
    );
    return () => unsub && unsub();
  }, []);

  // Filter orders related to refunds
  const refundOrders = useMemo(() => {
    const keyword = query.toLowerCase();
    return orders.filter((o) => {
      const isRefundState = ["refund_requested", "refunded", "refund_rejected"].includes(o.status);
      if (!isRefundState) return false;
      const name = (o.customerName || o.customer?.name || "").toLowerCase();
      return o.id.toLowerCase().includes(keyword) || name.includes(keyword);
    });
  }, [orders, query]);

  async function handleProcessRefund() {
    if (!processingOrder || !actionType) return;
    try {
      const newStatus = actionType === "approve" ? "refunded" : "refund_rejected";
      await updateOrder(processingOrder.id, {
        status: newStatus,
        refundProcessedAt: new Date().toISOString()
      });
      setToast({ type: "success", message: `Refund request ${actionType === "approve" ? "approved" : "rejected"}.` });
      setProcessingOrder(null);
      setActionType(null);
    } catch (err) {
      setToast({ type: "error", message: getFirebaseErrorMessage(err) });
    }
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <p className="eyebrow">Financial Operations</p>
        <h1 className="page-title">Refunds & Returns</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="metric"><RefreshCcw className="h-5 w-5 text-ember" /><span>Pending Requests</span><strong>{refundOrders.filter(o => o.status === "refund_requested").length}</strong></div>
        <div className="metric"><span>Refunded</span><strong>{refundOrders.filter(o => o.status === "refunded").length}</strong></div>
        <div className="metric"><span>Rejected</span><strong>{refundOrders.filter(o => o.status === "refund_rejected").length}</strong></div>
      </div>

      <div className="panel">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold text-slate-950">Refund Requests Directory</h2>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input 
              className="input pl-9 sm:max-w-xs text-sm" 
              placeholder="Search by order ID or customer..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="grid min-h-[240px] place-items-center text-slate-600">
             <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-ember" />
          </div>
        ) : !refundOrders.length ? (
          <div className="empty-state">No refund requests found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-900">
                <tr>
                  <th className="p-3 font-semibold">Order ID</th>
                  <th className="p-3 font-semibold">Customer</th>
                  <th className="p-3 font-semibold">Amount</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {refundOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-medium text-slate-900">#{order.id.slice(0,8)}</td>
                    <td className="p-3">{order.customerName || order.customer?.name || "Guest"}</td>
                    <td className="p-3 font-medium text-ember">{formatCurrency(order.total)}</td>
                    <td className="p-3">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold uppercase ${
                        order.status === "refund_requested" ? "bg-amber-100 text-amber-800" :
                        order.status === "refunded" ? "bg-leaf/20 text-leaf-800" :
                        "bg-red-100 text-red-800"
                      }`}>
                        {order.status.replaceAll("_", " ")}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {order.status === "refund_requested" && (
                        <div className="flex justify-end gap-2">
                          <button 
                            className="p-1.5 text-leaf-600 bg-leaf/10 hover:bg-leaf/20 rounded-md transition-colors"
                            title="Approve Refund"
                            onClick={() => { setProcessingOrder(order); setActionType("approve"); }}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <button 
                            className="p-1.5 text-red-600 bg-red-100 hover:bg-red-200 rounded-md transition-colors"
                            title="Reject Refund"
                            onClick={() => { setProcessingOrder(order); setActionType("reject"); }}
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        confirmLabel={actionType === "approve" ? "Approve Refund" : "Reject Refund"}
        message={`Are you sure you want to ${actionType} the refund for order #${processingOrder?.id?.slice(0,8)}?`}
        onCancel={() => { setProcessingOrder(null); setActionType(null); }}
        onConfirm={handleProcessRefund}
        open={Boolean(processingOrder)}
        title={actionType === "approve" ? "Confirm Approval" : "Confirm Rejection"}
      />

      <Toast message={toast?.message} onClose={() => setToast(null)} type={toast?.type} />
    </div>
  );
}

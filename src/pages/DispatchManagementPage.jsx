import { Truck, Search, UserCheck } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import Toast from "../components/common/Toast";
import { listenToOrders, updateOrder } from "../services/orderService";
import { listenToDeliveryPartners } from "../services/deliveryService";
import { formatCurrency, getFirebaseErrorMessage } from "../utils/helpers";

export default function DispatchManagementPage() {
  const [orders, setOrders] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState(null);
  const [assigningOrder, setAssigningOrder] = useState(null);

  useEffect(() => {
    let orderUnsub = listenToOrders(
      (data) => {
        setOrders(data);
        setLoading(false);
      },
      (err) => {
        setToast({ type: "error", message: getFirebaseErrorMessage(err) });
        setLoading(false);
      }
    );
    let partnerUnsub = listenToDeliveryPartners(
      (data) => setPartners(data.filter(p => p.status === "active")),
      (err) => console.error(err)
    );
    return () => {
      orderUnsub && orderUnsub();
      partnerUnsub && partnerUnsub();
    };
  }, []);

  // Filter orders that are preparing or confirmed and need dispatching
  const dispatchableOrders = useMemo(() => {
    const keyword = query.toLowerCase();
    return orders.filter((o) => {
      const oStatus = typeof o.status === "number" ? (o.statusLabel || "").toLowerCase() : (o.status || "");
      if (oStatus === "delivered" || oStatus === "cancelled" || o.status === 4 || o.status === 5) return false;
      const name = (o.customerName || o.customer?.name || "").toLowerCase();
      const match = o.id.toLowerCase().includes(keyword) || name.includes(keyword);
      return match;
    });
  }, [orders, query]);

  async function handleAssign(partnerId) {
    if (!assigningOrder) return;
    try {
      const partner = partners.find(p => p.id === partnerId);
      await updateOrder(assigningOrder.id, {
        deliveryPartnerId: partnerId,
        assignedPartnerId: partnerId,
        deliveryPartnerName: partner?.displayName || partner?.name || "Assigned",
        status: "out_for_delivery",
        statusLabel: "Out for Delivery"
      });
      setToast({ type: "success", message: "Order assigned to delivery partner." });
      setAssigningOrder(null);
    } catch (err) {
      setToast({ type: "error", message: getFirebaseErrorMessage(err) });
    }
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <p className="eyebrow">Fleet Operations</p>
        <h1 className="page-title">Dispatch Scheduling</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="metric"><Truck className="h-5 w-5 text-ember" /><span>Active Orders</span><strong>{dispatchableOrders.length}</strong></div>
        <div className="metric"><span>Available Partners</span><strong>{partners.length}</strong></div>
      </div>

      <div className="panel">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold text-slate-950">Pending Dispatches</h2>
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
        ) : !dispatchableOrders.length ? (
          <div className="empty-state">No active orders require dispatching at the moment.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-900">
                <tr>
                  <th className="p-3 font-semibold">Order ID</th>
                  <th className="p-3 font-semibold">Customer</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold">Amount</th>
                  <th className="p-3 font-semibold">Driver Assigned</th>
                  <th className="p-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {dispatchableOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-medium text-slate-900">#{order.id.slice(0,8)}</td>
                    <td className="p-3">{order.customerName || order.customer?.name || "Guest"}</td>
                    <td className="p-3">
                      <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 uppercase">
                        {order.status}
                      </span>
                    </td>
                    <td className="p-3 font-medium">{formatCurrency(order.total)}</td>
                    <td className="p-3">
                      {(order.deliveryPartnerId || order.assignedPartnerId) ? (
                        <span className="flex items-center gap-2 text-leaf-700 font-medium">
                          <UserCheck className="h-4 w-4" /> 
                          {partners.find(p => p.id === (order.deliveryPartnerId || order.assignedPartnerId))?.displayName || 
                           partners.find(p => p.id === (order.deliveryPartnerId || order.assignedPartnerId))?.name || 
                           "Assigned"}
                        </span>
                      ) : (
                        <span className="text-amber-600 font-medium">Unassigned</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <button 
                        className="btn-secondary text-xs px-3 py-1.5"
                        onClick={() => setAssigningOrder(order)}
                      >
                        {order.deliveryPartnerId || order.assignedPartnerId ? "Reassign" : "Assign Driver"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {assigningOrder ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 px-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-md bg-white p-6 shadow-soft my-8">
            <div className="mb-4 border-b border-slate-100 pb-4">
              <h3 className="text-lg font-semibold text-slate-950">Assign Delivery Partner</h3>
              <p className="mt-1 text-sm text-slate-500">Order #{assigningOrder.id.slice(0,8)} • {assigningOrder.customerName || assigningOrder.customer?.name || "Guest"}</p>
            </div>
            
            <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2">
              {partners.length === 0 ? (
                <div className="text-sm text-slate-500 italic py-4 text-center">No active delivery partners available.</div>
              ) : (
                partners.map(partner => (
                  <div key={partner.id} className="flex items-center justify-between p-3 border border-slate-200 rounded hover:border-ember cursor-pointer" onClick={() => handleAssign(partner.id)}>
                    <div>
                      <div className="font-semibold text-slate-900 text-sm">{partner.displayName || partner.name || "Unknown Driver"}</div>
                      <div className="text-xs text-slate-500">{partner.phone || "No phone"}</div>
                    </div>
                    <button className="text-xs bg-slate-100 px-3 py-1 rounded text-slate-700 font-medium hover:bg-ember hover:text-white transition-colors">
                      Select
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button className="btn-secondary w-full sm:w-auto" onClick={() => setAssigningOrder(null)} type="button">
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <Toast message={toast?.message} onClose={() => setToast(null)} type={toast?.type} />
    </div>
  );
}

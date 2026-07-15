import { ChevronDown, ChevronUp, FileText, MapPin, ShoppingBag, Truck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { formatCurrency } from "../utils/helpers";
import { listenToOrders } from "../services/orderService";
import { useAuth } from "../hooks/useAuth";

export default function MyOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const unsubscribe = listenToOrders(
      (items) => {
        const myOrders = items.filter((order) => 
          order.customerId === user.uid || order.customer_id === user.uid
        );
        setOrders(myOrders);
        setLoading(false);
      },
      (err) => {
        console.error("My orders error:", err);
        setError("Failed to load orders. Please try again.");
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user?.uid]);

  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
    return {
      count: orders.length,
      pending: orders.filter((o) => ["pending", "confirmed", "preparing"].includes(o.status)).length,
      delivered: orders.filter((o) => o.status === "delivered").length,
      revenue: totalRevenue
    };
  }, [orders]);

  if (loading) return <LoadingSpinner label="Loading your orders" />;

  if (!user) {
    return (
      <div className="panel empty-state">
        <p className="text-lg font-semibold text-slate-800">Please log in</p>
        <p className="mt-1 text-sm text-slate-500">Sign in to view your orders.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <p className="eyebrow">Your orders</p>
          <h1 className="page-title">My Orders</h1>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="metric">
          <ShoppingBag className="h-5 w-5 text-ember" />
          <span>Total orders</span>
          <strong>{stats.count}</strong>
        </div>
        <div className="metric">
          <span>Pending</span>
          <strong>{stats.pending}</strong>
        </div>
        <div className="metric">
          <span>Delivered</span>
          <strong>{stats.delivered}</strong>
        </div>
        <div className="metric">
          <span>Total spent</span>
          <strong>{formatCurrency(stats.revenue)}</strong>
        </div>
      </div>

      {error ? <div className="alert">{error}</div> : null}

      {orders.length === 0 ? (
        <div className="empty-state">
          <p className="text-lg font-semibold text-slate-800">No orders yet</p>
          <p className="mt-1 text-sm text-slate-500">Your order history will appear here once you place orders.</p>
        </div>
      ) : (
        <OrderList orders={orders} />
      )}
    </div>
  );
}

function OrderCard({ order }) {
  const [expanded, setExpanded] = useState(false);
  const displayAddress = order.address || order.deliveryAddress || "";
  const status = String(order.status || "pending");
  const statusColors = {
    pending: "bg-amber-50 text-amber-700",
    confirmed: "bg-blue-50 text-blue-700",
    preparing: "bg-indigo-50 text-indigo-700",
    out_for_delivery: "bg-purple-50 text-purple-700",
    delivered: "bg-green-50 text-green-700",
    cancelled: "bg-red-50 text-red-700"
  };

  return (
    <article className="card overflow-hidden p-0">
      <button
        className="flex w-full items-start justify-between gap-3 p-4 text-left hover:bg-slate-50"
        onClick={() => setExpanded(!expanded)}
        type="button"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-ember/10 text-xs font-bold text-ember shrink-0">
              {(order.customerName || "?").charAt(0).toUpperCase()}
            </div>
            <span className="truncate text-base font-bold text-slate-950">
              {order.customerName || "Unknown customer"}
            </span>
          </div>
          <div className="mt-1.5 flex items-start gap-1.5 rounded-md bg-amber-50/60 px-2.5 py-2">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ember" />
            <p className="truncate text-sm font-medium text-slate-800">
              {displayAddress || <span className="italic text-slate-400">No delivery address</span>}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusColors[status] || statusColors.pending}`}>
            {status.replaceAll("_", " ")}
          </span>
          {expanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 px-4 pb-4 pt-3 space-y-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">Items</p>
            <div className="rounded-md bg-slate-50 overflow-hidden">
              <div className="grid grid-cols-12 gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500 bg-slate-100/60">
                <span className="col-span-1">Qty</span>
                <span className="col-span-7">Item</span>
                <span className="col-span-4 text-right">Line total</span>
              </div>
              {order.items?.map((item, i) => (
                <div
                  key={i}
                  className="grid grid-cols-12 gap-2 px-3 py-1.5 text-sm text-slate-700 border-t border-slate-100 last:border-b-0"
                >
                  <span className="col-span-1">{item.quantity}</span>
                  <span className="col-span-7 truncate">{item.name || "—"}</span>
                  <span className="col-span-4 text-right font-medium">{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <DetailBox label="Subtotal" value={formatCurrency(order.subtotal)} />
            <DetailBox label="Delivery" value={formatCurrency(order.deliveryCharge)} />
            <DetailBox label="Total" value={<span className="text-base font-bold text-slate-950">{formatCurrency(order.total)}</span>} />
          </div>

          {order.notes && (
            <div className="flex flex-wrap items-start gap-2 rounded-md bg-slate-50 px-3 py-2">
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-ember" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Notes</p>
                <p className="mt-0.5 text-sm text-slate-700 break-words">{order.notes}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function OrderList({ orders }) {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {orders.map((order) => (
        <OrderCard order={order} key={order.id} />
      ))}
    </div>
  );
}

function DetailBox({ label, value }) {
  return (
    <div className="rounded-md bg-slate-50 p-2.5">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}
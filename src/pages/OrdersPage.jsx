import { Edit3, MapPin, Mail, Phone, CreditCard, FileText, Plus, Search, ShoppingBag, Trash2, ChevronDown, ChevronUp, Truck } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate, useSearchParams } from "react-router-dom";
import ConfirmDialog from "../components/common/ConfirmDialog";
import LoadingSpinner from "../components/common/LoadingSpinner";
import Toast from "../components/common/Toast";
import { formatCurrency, getFirebaseErrorMessage } from "../utils/helpers";
import { ROUTES } from "../routes";
import { fetchAllUsers } from "../services/userService";
import { fetchAllDeliveryPartners } from "../services/deliveryService";
import { createOrder, deleteOrder, listenToOrders, updateOrder } from "../services/orderService";

const initialValues = {
  customerId: "",
  customerName: "",
  customerPhone: "",
  customerEmail: "",
  deliveryAddress: "",
  deliveryPartnerId: "",
  deliveryPartnerName: "",
  items: [{ name: "", quantity: 1, price: 0 }],
  subtotal: 0,
  deliveryCharge: 0,
  total: 0,
  status: "pending",
  paymentMethod: "cash",
  paymentStatus: "pending",
  orderType: "delivery",
  isScheduled: false,
  notes: ""
};

const ORDER_STATUSES = ["pending", "accepted", "confirmed", "processing", "handover", "picked_up", "delivered", "canceled", "failed", "refunded"];

function OrderForm({ editingOrder, onCancel, onSubmit }) {
  const [values, setValues] = useState(initialValues);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [deliveryPartners, setDeliveryPartners] = useState([]);

  useEffect(() => {
    fetchAllDeliveryPartners().then(setDeliveryPartners).catch(console.error);
  }, []);

  useEffect(() => {
    if (editingOrder) {
      setValues({
        ...initialValues,
        customerId:    editingOrder.customerId    || editingOrder.customer_id  || "",
        customerName:  editingOrder.customerName  || editingOrder.userName      || "",
        customerPhone: editingOrder.customerPhone || editingOrder.phoneNumber   || editingOrder.phone || "",
        customerEmail: editingOrder.customerEmail || editingOrder.email          || "",
        // Firestore stores delivery address as `address`; form key is `deliveryAddress`
        deliveryAddress: editingOrder.address || editingOrder.deliveryAddress || "",
        deliveryPartnerId: editingOrder.deliveryPartnerId || "",
        deliveryPartnerName: editingOrder.deliveryPartnerName || "",
        items: (editingOrder.items || []).filter(Boolean).length
          ? (editingOrder.items || []).filter(Boolean)
          : [{ name: "", quantity: 1, price: 0 }],
        subtotal:      editingOrder.subtotal     ?? 0,
        deliveryCharge:editingOrder.deliveryCharge ?? 0,
        total:         editingOrder.total         ?? 0,
        status:        editingOrder.status        || "pending",
        paymentMethod: editingOrder.paymentMethod || "cash",
        paymentStatus: editingOrder.paymentStatus || "pending",
        orderType:     editingOrder.orderType     || "delivery",
        isScheduled:   editingOrder.isScheduled === true || editingOrder.scheduled === true || String(editingOrder.isScheduled) === "true" || String(editingOrder.scheduled) === "true",
        notes:         editingOrder.notes         || ""
      });
    } else {
      setValues(initialValues);
    }
  }, [editingOrder]);

  function addItem() {
    setValues((v) => ({
      ...v,
      items: [...v.items, { name: "", quantity: 1, price: 0 }]
    }));
  }

  function updateItem(index, field, value) {
    setValues((v) => {
      const items = [...v.items];
      items[index] = { ...items[index], [field]: value };
      const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.price)), 0);
      const deliveryCharge = Number(v.deliveryCharge) || 0;
      return { ...v, items, subtotal, total: subtotal + deliveryCharge };
    });
  }

  function removeItem(index) {
    setValues((v) => {
      const items = v.items.length <= 1 ? [{ name: "", quantity: 1, price: 0 }] : v.items.filter((_, i) => i !== index);
      const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.price)), 0);
      const deliveryCharge = Number(v.deliveryCharge) || 0;
      return { ...v, items, subtotal, total: subtotal + deliveryCharge };
    });
  }

  function validate(values) {
    const errs = {};
    if (!String(values.customerName || "").trim()) errs.customerName = "Customer name is required.";
    if (!String(values.customerPhone || "").trim()) errs.customerPhone = "Phone number is required.";
    return errs;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const errs = validate(values);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const { customerId, deliveryAddress, ...rest } = values;
    const payload = {
      ...rest,
      customerId:  customerId || "",
      address:     deliveryAddress || ""   // Firestore field name is `address`
    };

    setSubmitting(true);
    try {
      await onSubmit(payload);
      setValues(initialValues);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="panel space-y-4" onSubmit={handleSubmit}>
      <div>
        <h2 className="text-lg font-bold text-slate-950">{editingOrder ? "Edit order" : "Add order"}</h2>
        <p className="mt-1 text-sm text-slate-500">Create or update customer orders.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {/* ── Customer name (always present) ───────────────────────────────── */}
        <label className="field-label">
          Customer name
          <input
            className="input"
            onChange={(e) => setValues({ ...values, customerName: e.target.value })}
            placeholder="Enter customer name"
            value={values.customerName}
          />
          {errors.customerName ? <span className="field-error">{errors.customerName}</span> : null}
        </label>

        {/* ── Customer phone lookup ───────────────────────────────────────── */}
        <CustomerPhoneLookup
          onSelect={({ customerId, customerName, customerPhone, customerEmail, address }) => {
            setValues(v => ({
              ...v,
              customerId,
              customerName:   customerName   || v.customerName,
              customerPhone:  customerPhone  || v.customerPhone,
              customerEmail:  customerEmail  || v.customerEmail,
              deliveryAddress: address       || v.deliveryAddress,
            }));
            setErrors(e => ({ ...e, customerId: "", customerName: "", customerPhone: "" }));
          }}
        />

        <label className="field-label">
          Phone
          <input
            className="input"
            onChange={(e) => setValues({ ...values, customerPhone: e.target.value })}
            placeholder="+91 98765 43210"
            value={values.customerPhone}
          />
          {errors.customerPhone ? <span className="field-error">{errors.customerPhone}</span> : null}
        </label>
        <label className="field-label">
          Email
          <input className="input" type="email" onChange={(e) => setValues({ ...values, customerEmail: e.target.value })} value={values.customerEmail} />
        </label>
        <label className="field-label md:col-span-2">
          Delivery address
          <input className="input" onChange={(e) => setValues({ ...values, deliveryAddress: e.target.value })} value={values.deliveryAddress} />
        </label>
      </div>
      <div>
        <label className="field-label mb-2">Items</label>
        {values.items.map((item, index) => (
          <div className="mb-2 grid grid-cols-12 gap-2" key={index}>
            <input className="input col-span-5" onChange={(e) => updateItem(index, "name", e.target.value)} placeholder="Item name" value={item.name} />
            <input className="input col-span-2" min="1" onChange={(e) => updateItem(index, "quantity", Number(e.target.value))} type="number" value={item.quantity} />
            <input className="input col-span-3" min="0" onChange={(e) => updateItem(index, "price", Number(e.target.value))} step="0.01" type="number" value={item.price} />
            {values.items.length > 1 ? (
              <button className="icon-danger" onClick={() => removeItem(index)} type="button">
                <Trash2 className="h-4 w-4" />
              </button>
            ) : <div />}
          </div>
        ))}
        <button className="btn-secondary mt-2" onClick={addItem} type="button">
          <Plus className="h-4 w-4" />
          Add item
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="field-label">
          Status
          <select className="input" onChange={(e) => setValues({ ...values, status: e.target.value })} value={values.status}>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>{s.replaceAll("_", " ")}</option>
            ))}
          </select>
        </label>
        <label className="field-label">
          Payment method
          <select className="input" onChange={(e) => setValues({ ...values, paymentMethod: e.target.value })} value={values.paymentMethod}>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="upi">UPI</option>
          </select>
        </label>
        <label className="field-label">
          Payment status
          <select className="input" onChange={(e) => setValues({ ...values, paymentStatus: e.target.value })} value={values.paymentStatus}>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </label>
        <label className="field-label">
          Order type
          <select className="input" onChange={(e) => setValues({ ...values, orderType: e.target.value })} value={values.orderType}>
            <option value="delivery">Delivery</option>
            <option value="takeaway">Takeaway</option>
            <option value="dine_in">Dine In</option>
          </select>
        </label>
        <label className="field-label">
          Scheduled
          <select className="input" onChange={(e) => setValues({ ...values, isScheduled: e.target.value === "true" })} value={String(values.isScheduled)}>
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
        </label>
        <label className="field-label">
          Delivery partner
          <select 
            className="input" 
            onChange={(e) => {
              const partner = deliveryPartners.find(p => p.id === e.target.value);
              setValues({ 
                ...values, 
                deliveryPartnerId: e.target.value,
                deliveryPartnerName: partner ? (partner.displayName || partner.name || "Unknown") : ""
              });
            }} 
            value={values.deliveryPartnerId}
          >
            <option value="">Unassigned</option>
            {deliveryPartners.map(p => (
              <option key={p.id} value={p.id}>{p.displayName || p.name || p.email || p.id}</option>
            ))}
          </select>
        </label>
      </div>
      <label className="field-label">
        Notes
        <textarea className="input min-h-24 resize-y" onChange={(e) => setValues({ ...values, notes: e.target.value })} value={values.notes} />
      </label>
      <div className="flex flex-wrap justify-end gap-3">
        {editingOrder ? (
          <button className="btn-secondary" onClick={onCancel} type="button">
            Cancel
          </button>
        ) : null}
        <button className="btn-primary" disabled={submitting} type="submit">
          {submitting ? "Saving..." : editingOrder ? "Update order" : "Add order"}
        </button>
      </div>
    </form>
  );
}

function OrderCard({ order, onDelete, onEdit }) {
  const [expanded, setExpanded] = useState(false);
  /* ── Resolve delivery address: Firestore `address` wins over legacy `deliveryAddress` ── */
  const displayAddress = order.address || order.deliveryAddress || "";
  const status = String(order.status || "pending");
  const statusColors = {
    pending: "bg-amber-50 text-amber-700",
    accepted: "bg-teal-50 text-teal-700",
    confirmed: "bg-blue-50 text-blue-700",
    processing: "bg-indigo-50 text-indigo-700",
    preparing: "bg-indigo-50 text-indigo-700",
    handover: "bg-indigo-50 text-indigo-700",
    picked_up: "bg-purple-50 text-purple-700",
    out_for_delivery: "bg-purple-50 text-purple-700",
    delivered: "bg-green-50 text-green-700",
    canceled: "bg-red-50 text-red-700",
    cancelled: "bg-red-50 text-red-700",
    failed: "bg-rose-50 text-rose-700",
    refunded: "bg-purple-50 text-purple-700",
  };

  /* ── payment-status badge colours ── */
  const payColors = {
    pending: "bg-amber-50 text-amber-700",
    paid:    "bg-leaf/10 text-leaf",
    failed:  "bg-rose/10 text-rose"
  };

  return (
    <article className="card overflow-hidden p-0">
      {/* ══════════════════════════════════════════════════════════ */}
      {/*  COLLAPSED – always visible                               */}
      {/* ══════════════════════════════════════════════════════════ */}

      {/* Row 1 – customer name / email / phone + status */}
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
            {order.customerId ? (
              <NavLink
                className="truncate text-base font-bold text-slate-950 hover:text-ember hover:underline"
                to={ROUTES.customerProfile.replace(":customerId", order.customerId)}
                onClick={(e) => e.stopPropagation()}
              >
                {order.customerName || "Unknown customer"}
              </NavLink>
            ) : (
              <span className="truncate text-base font-bold text-slate-950">
                {order.customerName || "Unknown customer"}
              </span>
            )}
          </div>
          <div className="mt-0.5 ml-10 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            {order.customerPhone ? <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{order.customerPhone}</span> : null}
            {order.customerEmail ? <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{order.customerEmail}</span> : null}
          </div>
          {/* ── Delivery address — ALWAYS visible ── */}
          <div className="mt-1.5 ml-10 flex items-start gap-1.5 rounded-md bg-amber-50/60 px-2.5 py-2">
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
          {order.paymentStatus ? (
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${payColors[order.paymentStatus] || "bg-slate-100 text-slate-600"}`}>
              {order.paymentStatus}
            </span>
          ) : null}
          {expanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </div>
      </button>

      {/* ══════════════════════════════════════════════════════════ */}
      {/*  EXPANDED – all 13 fields                                */}
      {/* ══════════════════════════════════════════════════════════ */}

      {expanded && (
        <div className="border-t border-slate-100 px-4 pb-4 pt-3 space-y-3">
          {/* Row 2 – payment method (address is always visible above) */}
          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex items-start gap-2 rounded-md bg-slate-50 p-2.5">
              <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-ember" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Payment method</p>
                <p className="text-sm font-medium text-slate-800 capitalize">{order.paymentMethod || "—"}</p>
              </div>
            </div>
          </div>

          {/* Row 3 – items table */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">Items</p>
            <div className="rounded-md bg-slate-50 overflow-hidden">
              {/* header */}
              <div className="grid grid-cols-12 gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500 bg-slate-100/60">
                <span className="col-span-1">Qty</span>
                <span className="col-span-7">Item</span>
                <span className="col-span-4 text-right">Line total</span>
              </div>
              {/* rows */}
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

          {/* Row 4 – financial breakdown */}
          <div className="grid gap-3 md:grid-cols-4">
            <DetailBox label="Subtotal"   value={formatCurrency(order.subtotal)} />
            <DetailBox label="Delivery"   value={formatCurrency(order.deliveryCharge)} />
            <DetailBox label="Total"      value={<span className="text-base font-bold text-slate-950">{formatCurrency(order.total)}</span>} />
            <DetailBox label="Order ID"   value={<span className="font-mono text-xs">{order.id?.slice(0, 8)}…{order.id?.slice(-6)}</span>} />
          </div>

          {/* Row 5 – payment status + delivery partner + notes */}
          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-start gap-2 rounded-md bg-slate-50 px-3 py-2">
                <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-ember" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Payment status</p>
                  <p className="mt-0.5">
                    {order.paymentStatus ? (
                      <span className={`badge text-xs ${payColors[order.paymentStatus] || "bg-slate-100 text-slate-600"}`}>
                        {String(order.paymentStatus).charAt(0).toUpperCase() + String(order.paymentStatus).slice(1)}
                      </span>
                    ) : <span className="text-sm text-slate-400">—</span>}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap items-start gap-2 rounded-md bg-slate-50 px-3 py-2">
                <Truck className="mt-0.5 h-4 w-4 shrink-0 text-ember" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Delivery Partner</p>
                  <p className="mt-0.5 text-sm font-medium text-slate-800">
                    {order.deliveryPartnerName ? order.deliveryPartnerName : (order.deliveryPartnerId ? "Assigned" : "Unassigned")}
                  </p>
                </div>
              </div>
            </div>

            {order.notes ? (
              <div className="flex flex-wrap items-start gap-2 rounded-md bg-slate-50 px-3 py-2">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-ember" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Notes</p>
                  <p className="mt-0.5 text-sm text-slate-700 break-words">{order.notes}</p>
                </div>
              </div>
            ) : null}
          </div>

          {/* ── Actions ── */}
          <div className="flex justify-end gap-2 pt-1">
            <button className="btn-secondary py-1.5 text-xs" onClick={() => onEdit(order)} type="button">
              <Edit3 className="h-3.5 w-3.5" /> Edit
            </button>
            <button className="btn-danger py-1.5 text-xs" onClick={() => onDelete(order)} type="button">
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
        </div>
      )}
    </article>
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

function OrderList({ orders, loading, onDelete, onEdit }) {
  if (loading) return <LoadingSpinner label="Loading orders" />;
  if (!orders.length) return <div className="empty-state">No orders yet. Add your first order to get started.</div>;

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {orders.map((order) => (
        <OrderCard order={order} key={order.id} onDelete={onDelete} onEdit={onEdit} />
      ))}
    </div>
  );
}

export default function OrdersPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingOrder, setEditingOrder] = useState(null);
  const [deletingOrder, setDeletingOrder] = useState(null);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState(null);

  const statusFilter = searchParams.get("status") || "all";

  useEffect(() => {
    const unsubscribe = listenToOrders(
      (items) => {
        setOrders(items);
        setLoading(false);
      },
      (err) => {
        setError(getFirebaseErrorMessage(err));
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  const filteredOrders = useMemo(() => {
    const keyword = query.toLowerCase();
    return orders.filter((order) => {
      let matchStatus = false;
      const oStatus = String(order.status || "pending").toLowerCase();
      
      if (statusFilter === "all") matchStatus = true;
      else if (statusFilter === "pending") matchStatus = oStatus === "pending";
      else if (statusFilter === "accepted") matchStatus = oStatus === "accepted";
      else if (statusFilter === "processing") matchStatus = ["confirmed", "processing", "handover", "preparing"].includes(oStatus);
      else if (statusFilter === "food_on_the_way") matchStatus = oStatus === "picked_up" || oStatus === "out_for_delivery";
      else if (statusFilter === "delivered") matchStatus = oStatus === "delivered";
      else if (statusFilter === "canceled") matchStatus = oStatus === "canceled" || oStatus === "cancelled";
      else if (statusFilter === "scheduled") matchStatus = order.isScheduled === true || order.scheduled === true || String(order.isScheduled) === "true" || String(order.scheduled) === "true";
      else if (statusFilter === "failed") matchStatus = oStatus === "failed" || String(order.paymentStatus || "").toLowerCase() === "failed";
      else if (statusFilter === "refunded") matchStatus = oStatus === "refunded" || String(order.paymentStatus || "").toLowerCase() === "refunded";
      else if (statusFilter === "dine_in") matchStatus = String(order.orderType || "").toLowerCase() === "dine_in" || String(order.orderType || "").toLowerCase() === "dine-in";
      else matchStatus = oStatus === statusFilter;

      if (!matchStatus) return false;
      
      const searchStr = [
        order.customerName || "",
        order.customerPhone || "",
        order.customerEmail || "",
        order.address || order.deliveryAddress || ""
      ].join(" ").toLowerCase();
      
      return searchStr.includes(keyword);
    });
  }, [orders, query, statusFilter]);

  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
    return {
      count: orders.length,
      pending: orders.filter((o) => {
        const s = String(o.status || "pending").toLowerCase();
        return ["pending", "accepted", "confirmed", "processing", "handover", "preparing"].includes(s);
      }).length,
      delivered: orders.filter((o) => String(o.status || "").toLowerCase() === "delivered").length,
      revenue: totalRevenue
    };
  }, [orders]);

  async function saveOrder(values) {
    try {
      if (editingOrder) {
        await updateOrder(editingOrder.id, values);
        setToast({ type: "success", message: "Order updated" });
      } else {
        await createOrder(values);
        setToast({ type: "success", message: "Order added" });
      }
      setEditingOrder(null);
    } catch (err) {
      setToast({ type: "error", message: getFirebaseErrorMessage(err) });
    }
  }

  async function confirmDelete() {
    try {
      await deleteOrder(deletingOrder.id);
      setToast({ type: "success", message: "Order deleted" });
      setDeletingOrder(null);
    } catch (err) {
      setToast({ type: "error", message: getFirebaseErrorMessage(err) });
    }
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <p className="eyebrow">Order management</p>
          <h1 className="page-title">Orders</h1>
        </div>
        <a className="btn-primary" href="#order-form">
          <Plus className="h-4 w-4" />
          Add order
        </a>
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
          <span>Total revenue</span>
          <strong>{formatCurrency(stats.revenue)}</strong>
        </div>
      </div>

      {error ? <div className="alert">{error}</div> : null}
      <div id="order-form">
        <OrderForm editingOrder={editingOrder} onCancel={() => setEditingOrder(null)} onSubmit={saveOrder} />
      </div>

      <div className="panel">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold text-slate-950">Order list</h2>
          <input className="input sm:max-w-xs" onChange={(e) => setQuery(e.target.value)} placeholder="Search orders" value={query} />
        </div>

        <div className="mb-5 flex flex-wrap gap-2 border-b border-slate-100 pb-3">
          {[
            { id: "all", label: "All" },
            { id: "scheduled", label: "Scheduled" },
            { id: "pending", label: "Pending" },
            { id: "confirmed", label: "Accepted" },
            { id: "preparing", label: "Processing" },
            { id: "out_for_delivery", label: "Food On The Way" },
            { id: "delivered", label: "Delivered" },
            { id: "cancelled", label: "Canceled" },
            { id: "failed", label: "Payment Failed" },
            { id: "refunded", label: "Refunded" },
            { id: "dine_in", label: "Dine In" },
          ].map((status) => (
            <button
              key={status.id}
              onClick={() => {
                if (status.id === 'all') {
                  setSearchParams({});
                } else {
                  setSearchParams({ status: status.id });
                }
              }}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all duration-300 hover:-translate-y-0.5 ${
                statusFilter === status.id ? "bg-ember text-white shadow-soft" : "bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50 hover:shadow-sm"
              }`}
            >
              {status.label}
            </button>
          ))}
        </div>

        <OrderList loading={loading} onDelete={setDeletingOrder} onEdit={setEditingOrder} orders={filteredOrders} />
      </div>

      <ConfirmDialog
        confirmLabel="Delete order"
        message={`Delete order #${deletingOrder?.id?.slice(-6) || "this order"}?`}
        onCancel={() => setDeletingOrder(null)}
        onConfirm={confirmDelete}
        open={Boolean(deletingOrder)}
        title="Delete order"
      />
      <Toast message={toast?.message} onClose={() => setToast(null)} type={toast?.type} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   Customer-phone lookup sub-component inside OrderForm
   Tries `fetchAllUsers` (live cursor from Firestore) to find a registered
   customer by phone and auto-fills the remaining fields.
══════════════════════════════════════════════════════════════════════════════ */

function CustomerPhoneLookup({ onSelect }) {
  const [query, setQuery] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSearch(e) {
    e?.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) { setCandidates([]); setOpen(false); return; }

    setSearching(true);
    setErrorMsg("");
    try {
      const users = await fetchAllUsers();
      const filtered = users.filter((u) =>
        (u.displayName || "").toLowerCase().includes(trimmed.toLowerCase()) ||
        (u.email         || "").toLowerCase().includes(trimmed.toLowerCase()) ||
        (u.phone         || u.phoneNumber || "").replace(/\D/g, "").includes(trimmed.replace(/\D/g, ""))
      ).slice(0, 5);
      if (!filtered.length) setErrorMsg("No customer found matching that name / phone.");
      setCandidates(filtered);
      setOpen(Boolean(filtered.length));
    } catch (err) {
      setErrorMsg(getFirebaseErrorMessage(err));
      setCandidates([]);
      setOpen(false);
    } finally {
      setSearching(false);
    }
  }

  function pick(user) {
    onSelect({
      customerId:   user.id,
      customerName: user.displayName || "",
      customerPhone: user.phone || user.phoneNumber || "",
      customerEmail: user.email     || "",
      address:      user.address || user.deliveryAddress || "",
    });
    setQuery("");
    setCandidates([]);
    setOpen(false);
  }

  return (
    <div className="field-label relative">
      <span className="flex items-center justify-between">
        <span>Customer phone / name lookup</span>
        <button
          className="flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          onClick={handleSearch}
          type="button"
        >
          <Search className="h-3 w-3" />
          {searching ? "Searching…" : "Find customer"}
        </button>
      </span>
      <input
        className="input mt-1"
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
        onFocus={() => candidates.length && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 180)}
        placeholder="Type name or phone, then press Find…"
        value={query}
      />
      <span className="field-error">{errorMsg}</span>
      {open && (
        <div className="absolute z-40 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-soft overflow-hidden">
          {candidates.map((u) => (
            <button
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-slate-50"
              key={u.id}
              onClick={() => pick(u)}
              type="button"
            >
              <div className="grid h-7 w-7 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">
                {(u.displayName || "U").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-950">{u.displayName || "Unnamed"}</p>
                <p className="truncate text-xs text-slate-500">{u.phone || u.phoneNumber || u.email || "—"}</p>
              </div>
              <span className={`badge text-xs ${
                u.role === "admin" ? "c-rose border border-rose/20" : "c-leaf border border-leaf/20"
              }`}>{u.role || "user"}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

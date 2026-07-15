import { formatCurrency } from "../../utils/helpers";

export default function CartSummary({ totals }) {
  return (
    <aside className="panel h-fit">
      <h2 className="text-lg font-bold text-slate-950">Order summary</h2>
      <div className="mt-5 space-y-3 text-sm">
        <div className="flex justify-between text-slate-600"><span>Items</span><span>{totals.itemCount}</span></div>
        <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{formatCurrency(totals.subtotal)}</span></div>
        <div className="flex justify-between text-slate-600"><span>Delivery</span><span>{formatCurrency(totals.delivery)}</span></div>
        <div className="border-t border-slate-200 pt-3">
          <div className="flex justify-between text-lg font-black text-slate-950"><span>Total</span><span>{formatCurrency(totals.total)}</span></div>
        </div>
      </div>
      <button className="btn-primary mt-6 w-full" disabled={!totals.itemCount} type="button">
        Mark as prepared
      </button>
    </aside>
  );
}

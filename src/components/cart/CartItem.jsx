import { Minus, Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "../../utils/helpers";

export default function CartItem({ item, onRemove, onUpdate, isAdmin }) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-200 py-4 last:border-0 sm:flex-row sm:items-center">
      <img alt={item.name} className="h-24 w-full rounded-md object-cover sm:w-28" src={item.imageUrl} />
      <div className="flex-1">
        <h3 className="font-bold text-slate-950">{item.name}</h3>
        <p className="text-sm text-slate-500">{item.hotelName}</p>
        {isAdmin && item.userId && (
          <p className="text-xs text-slate-400 mt-1">User ID: {item.userId}</p>
        )}
        <p className="mt-2 font-semibold text-slate-900">{formatCurrency(item.price)}</p>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center rounded-md border border-slate-200">
          <button className="grid h-9 w-9 place-items-center hover:bg-slate-50" onClick={() => onUpdate(item.id, item.quantity - 1, item.userId)} type="button">
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-10 text-center text-sm font-bold">{item.quantity}</span>
          <button className="grid h-9 w-9 place-items-center hover:bg-slate-50" onClick={() => onUpdate(item.id, item.quantity + 1, item.userId)} type="button">
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <button className="icon-danger" onClick={() => onRemove(item.id, item.userId)} title="Remove item" type="button">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

import { Edit3, ShoppingCart, Star, Trash2 } from "lucide-react";
import { formatCurrency } from "../../utils/helpers";

export default function ProductCard({ product, onAddToCart, onDelete, onEdit }) {
  return (
    <article className="card overflow-hidden">
      <img alt={product.name} className="h-44 w-full object-cover" src={product.imageUrl} />
      <div className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ember">{product.category}</p>
            <h3 className="mt-1 text-lg font-bold text-slate-950">{product.name}</h3>
            <p className="text-sm text-slate-500">{product.hotelName}</p>
          </div>
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
            <Star className="mr-1 inline h-3.5 w-3.5 fill-current" />
            {Number(product.rating || 0).toFixed(1)}
          </span>
        </div>
        <p className="line-clamp-2 min-h-10 text-sm leading-5 text-slate-600">{product.description || "Freshly prepared and ready for daily bachelor meals."}</p>
        <div className="flex items-center justify-between">
          <p className="text-xl font-black text-slate-950">{formatCurrency(product.price)}</p>
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${product.available ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"}`}>
            {product.available ? "Available" : "Paused"}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button className="icon-action" onClick={() => onAddToCart(product)} title="Add to cart" type="button">
            <ShoppingCart className="h-4 w-4" />
          </button>
          <button className="icon-action" onClick={() => onEdit(product)} title="Edit product" type="button">
            <Edit3 className="h-4 w-4" />
          </button>
          <button className="icon-danger" onClick={() => onDelete(product)} title="Delete product" type="button">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}

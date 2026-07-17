import { CheckCircle, Edit3, MapPin, Phone, Star, Trash2 } from "lucide-react";

export default function HotelCard({ hotel, onDelete, onEdit, isPendingPage, onAccept }) {
  return (
    <article className="card overflow-hidden">
      <img alt={hotel.name} className="h-44 w-full object-cover" src={hotel.imageUrl} />
      <div className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ember">{hotel.type}</p>
            <h3 className="mt-1 text-lg font-bold text-slate-950">{hotel.name}</h3>
          </div>
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
            <Star className="mr-1 inline h-3.5 w-3.5 fill-current" />
            {Number(hotel.rating || 0).toFixed(1)}
          </span>
        </div>
        <p className="line-clamp-2 min-h-10 text-sm leading-5 text-slate-600">{hotel.description || "Reliable food partner for daily meals and quick service."}</p>
        <div className="space-y-2 text-sm text-slate-600">
          <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-slate-400" />{hotel.location}</p>
          <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-slate-400" />{hotel.phone}</p>
        </div>
        <div className="flex items-center justify-between">
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${hotel.status === 'pending' || !hotel.status ? "bg-amber-50 text-amber-700" : hotel.open ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"}`}>
            {hotel.status === 'pending' || !hotel.status ? "Pending" : hotel.open ? "Open" : "Closed"}
          </span>
          <div className="flex gap-2">
            {isPendingPage && (
              <button className="icon-action text-emerald-600 hover:text-emerald-700" onClick={() => onAccept(hotel)} title="Accept request" type="button">
                <CheckCircle className="h-4 w-4" />
              </button>
            )}
            <button className="icon-action" onClick={() => onEdit(hotel)} title="Edit hotel" type="button"><Edit3 className="h-4 w-4" /></button>
            <button className="icon-danger" onClick={() => onDelete(hotel)} title={isPendingPage ? "Reject request" : "Delete hotel"} type="button"><Trash2 className="h-4 w-4" /></button>
          </div>
        </div>
      </div>
    </article>
  );
}

import { Building2, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import DeleteHotelModal from "./DeleteHotelModal";
import HotelForm from "./HotelForm";
import HotelList from "./HotelList";
import Toast from "../common/Toast";
import { useHotels } from "../../hooks/useHotels";
import { getFirebaseErrorMessage } from "../../utils/helpers";

export default function HotelsPage() {
  const location = useLocation();
  const isPendingPage = location.pathname.includes("/pending");

  const { hotels, loading, error, stats, createHotel, updateHotel, deleteHotel, approveRestaurantRequest } = useHotels(isPendingPage);
  const [editingHotel, setEditingHotel] = useState(null);
  const [deletingHotel, setDeletingHotel] = useState(null);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState(null);

  const filteredHotels = useMemo(() => {
    const keyword = query.toLowerCase();
    return hotels
      .filter((h) => {
        const status = h.status || (isPendingPage ? "pending" : "active");
        if (isPendingPage) return status === "pending";
        return status !== "pending";
      })
      .filter((hotel) => [hotel.name, hotel.location, hotel.type].join(" ").toLowerCase().includes(keyword));
  }, [hotels, query, isPendingPage]);

  async function acceptHotel(hotel) {
    try {
      await approveRestaurantRequest(hotel.id, hotel);
      setToast({ type: "success", message: "Restaurant join request accepted" });
    } catch (err) {
      setToast({ type: "error", message: getFirebaseErrorMessage(err) });
    }
  }

  async function saveHotel(values) {
    try {
      if (editingHotel) {
        await updateHotel(editingHotel.id, values);
        setToast({ type: "success", message: "Hotel updated" });
      } else {
        await createHotel(values);
        setToast({ type: "success", message: "Hotel added" });
      }
      setEditingHotel(null);
    } catch (err) {
      setToast({ type: "error", message: getFirebaseErrorMessage(err) });
    }
  }

  async function confirmDelete() {
    try {
      await deleteHotel(deletingHotel.id);
      setToast({ type: "success", message: "Hotel deleted" });
      setDeletingHotel(null);
    } catch (err) {
      setToast({ type: "error", message: getFirebaseErrorMessage(err) });
    }
  }

  const displayStats = useMemo(() => ({
    count: filteredHotels.length,
    averageRating: filteredHotels.length ? filteredHotels.reduce((sum, hotel) => sum + Number(hotel.rating || 0), 0) / filteredHotels.length : 0,
    openNow: filteredHotels.filter((h) => h.open).length
  }), [filteredHotels]);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <p className="eyebrow">Partner network</p>
          <h1 className="page-title">{isPendingPage ? "New Join Requests" : "Restaurants"}</h1>
        </div>
        <a className="btn-primary" href="#hotel-form" onClick={() => setEditingHotel({ status: "pending" })}>
          <Plus className="h-4 w-4" />
          Add {isPendingPage ? "pending request" : "restaurant"}
        </a>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="metric"><Building2 className="h-5 w-5 text-ember" /><span>{isPendingPage ? "Total requests" : "Total hotels"}</span><strong>{displayStats.count}</strong></div>
        <div className="metric"><span>Average rating</span><strong>{displayStats.averageRating.toFixed(1)}</strong></div>
        <div className="metric"><span>Open now</span><strong>{displayStats.openNow}</strong></div>
      </div>

      {error ? <div className="alert">{error}</div> : null}
      <div id="hotel-form">
        <HotelForm editingHotel={editingHotel} onCancel={() => setEditingHotel(null)} onSubmit={saveHotel} />
      </div>

      <div className="panel">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold text-slate-950">{isPendingPage ? "Pending Requests" : "Partner list"}</h2>
          <input className="input sm:max-w-xs" onChange={(event) => setQuery(event.target.value)} placeholder="Search restaurants" value={query} />
        </div>
        <HotelList hotels={filteredHotels} loading={loading} onDelete={setDeletingHotel} onEdit={setEditingHotel} isPendingPage={isPendingPage} onAccept={acceptHotel} />
      </div>

      <DeleteHotelModal hotel={deletingHotel} onCancel={() => setDeletingHotel(null)} onConfirm={confirmDelete} />
      <Toast message={toast?.message} onClose={() => setToast(null)} type={toast?.type} />
    </div>
  );
}

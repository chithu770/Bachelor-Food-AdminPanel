import LoadingSpinner from "../common/LoadingSpinner";
import HotelCard from "./HotelCard";

export default function HotelList({ hotels, loading, onDelete, onEdit, isPendingPage, onAccept }) {
  if (loading) return <LoadingSpinner label="Loading hotels" />;
  if (!hotels.length) return <div className="empty-state">No hotels yet. Add your first partner to start the network.</div>;

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {hotels.map((hotel) => (
        <HotelCard hotel={hotel} key={hotel.id} onDelete={onDelete} onEdit={onEdit} isPendingPage={isPendingPage} onAccept={onAccept} />
      ))}
    </div>
  );
}

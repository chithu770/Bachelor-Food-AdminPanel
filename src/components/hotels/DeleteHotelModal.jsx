import ConfirmDialog from "../common/ConfirmDialog";

export default function DeleteHotelModal({ hotel, onCancel, onConfirm }) {
  return (
    <ConfirmDialog
      confirmLabel="Delete hotel"
      message={`Delete ${hotel?.name || "this hotel"} and remove it from partners?`}
      onCancel={onCancel}
      onConfirm={onConfirm}
      open={Boolean(hotel)}
      title="Delete hotel"
    />
  );
}

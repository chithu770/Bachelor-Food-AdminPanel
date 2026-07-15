import ConfirmDialog from "../common/ConfirmDialog";

export default function DeleteProductModal({ product, onCancel, onConfirm }) {
  return (
    <ConfirmDialog
      confirmLabel="Delete product"
      message={`Delete ${product?.name || "this product"} from the menu? This cannot be undone.`}
      onCancel={onCancel}
      onConfirm={onConfirm}
      open={Boolean(product)}
      title="Delete product"
    />
  );
}

import ProductCard from "./ProductCard";
import LoadingSpinner from "../common/LoadingSpinner";

export default function ProductList({ loading, onAddToCart, onDelete, onEdit, products }) {
  if (loading) return <LoadingSpinner label="Loading products" />;
  if (!products.length) return <div className="empty-state">No products yet. Add your first meal to start building the menu.</div>;

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} onAddToCart={onAddToCart} onDelete={onDelete} onEdit={onEdit} product={product} />
      ))}
    </div>
  );
}

import { Package, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import DeleteProductModal from "./DeleteProductModal";
import ProductForm from "./ProductForm";
import ProductList from "./ProductList";
import Toast from "../common/Toast";
import { useCart } from "../../hooks/useCart";
import { useProducts } from "../../hooks/useProducts";
import { fetchAllProducts } from "../../services/productService";
import { formatCurrency, getFirebaseErrorMessage } from "../../utils/helpers";

export default function ProductsPage() {
  const { products, loading, error, stats, createProduct, updateProduct, deleteProduct } = useProducts();
  const { addToCart } = useCart();
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState(null);
  const [displayProducts, setDisplayProducts] = useState([]);

  useEffect(() => {
    if (products && products.length > 0) {
      setDisplayProducts(products);
    } else if (!loading && !error) {
      fetchAllProducts().then(setDisplayProducts).catch(() => setDisplayProducts([]));
    } else {
      setDisplayProducts(products);
    }
  }, [products, loading, error]);

  const filteredProducts = useMemo(() => {
    const keyword = query.toLowerCase();
    return displayProducts.filter((product) => [product.name, product.hotelName, product.category].join(" ").toLowerCase().includes(keyword));
  }, [displayProducts, query]);

  async function saveProduct(values) {
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, values);
        setToast({ type: "success", message: "Product updated" });
      } else {
        await createProduct(values);
        setToast({ type: "success", message: "Product added" });
      }
      setEditingProduct(null);
    } catch (err) {
      setToast({ type: "error", message: getFirebaseErrorMessage(err) });
    }
  }

  async function confirmDelete() {
    try {
      await deleteProduct(deletingProduct.id);
      setToast({ type: "success", message: "Product deleted" });
      setDeletingProduct(null);
    } catch (err) {
      setToast({ type: "error", message: getFirebaseErrorMessage(err) });
    }
  }

  async function handleAddToCart(product) {
    await addToCart(product, 1);
    setToast({ type: "success", message: `${product.name} added to cart` });
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <p className="eyebrow">Menu control</p>
          <h1 className="page-title">Products</h1>
        </div>
        <a className="btn-primary" href="#product-form">
          <Plus className="h-4 w-4" />
          Add product
        </a>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="metric"><Package className="h-5 w-5 text-ember" /><span>Total products</span><strong>{displayProducts.length}</strong></div>
        <div className="metric"><span>Average price</span><strong>{formatCurrency(stats.averagePrice)}</strong></div>
        <div className="metric"><span>Active products</span><strong>{displayProducts.filter((item) => item.available).length}</strong></div>
      </div>

      {error ? <div className="alert">{error}</div> : null}
      <div id="product-form">
        <ProductForm editingProduct={editingProduct} onCancel={() => setEditingProduct(null)} onSubmit={saveProduct} />
      </div>

      <div className="panel">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold text-slate-950">Live menu</h2>
          <input className="input sm:max-w-xs" onChange={(event) => setQuery(event.target.value)} placeholder="Search products" value={query} />
        </div>
        <ProductList loading={loading} onAddToCart={handleAddToCart} onDelete={setDeletingProduct} onEdit={setEditingProduct} products={filteredProducts} />
      </div>

      <DeleteProductModal onCancel={() => setDeletingProduct(null)} onConfirm={confirmDelete} product={deletingProduct} />
      <Toast message={toast?.message} onClose={() => setToast(null)} type={toast?.type} />
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { createProduct, deleteProduct, listenToProducts, updateProduct } from "../services/productService";
import { getFirebaseErrorMessage } from "../utils/helpers";

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = listenToProducts(
      (items) => {
        setProducts(items);
        setLoading(false);
      },
      (err) => {
        const msg = err?.code === "permission-denied" 
          ? "Permission denied. Check Firestore rules." 
          : getFirebaseErrorMessage(err);
        setError(msg);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  const stats = useMemo(
    () => ({
      count: products.length,
      averagePrice: products.length ? products.reduce((sum, product) => sum + Number(product.price || 0), 0) / products.length : 0
    }),
    [products]
  );

  return { products, loading, error, stats, createProduct, updateProduct, deleteProduct };
}

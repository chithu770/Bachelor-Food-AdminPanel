import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { addCartItem, listenToAllCarts, listenToCart, removeCartItem, updateCartItem } from "../services/cartService";
import { getFirebaseErrorMessage } from "../utils/helpers";
import { useAuthContext } from "./AuthContext";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user, isAdmin } = useAuthContext();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      setItems([]);
      return undefined;
    }

    setLoading(true);
    setError("");
    
    let unsubscribe;
    if (isAdmin) {
      unsubscribe = listenToAllCarts(
        (cartItems) => {
          setItems(cartItems);
          setLoading(false);
        },
        (err) => {
          setError(getFirebaseErrorMessage(err));
          setLoading(false);
        }
      );
    } else {
      unsubscribe = listenToCart(
        user.uid,
        (cartItems) => {
          setItems(cartItems);
          setLoading(false);
        },
        (err) => {
          setError(getFirebaseErrorMessage(err));
          setLoading(false);
        }
      );
    }
    return unsubscribe;
  }, [user, isAdmin]);

  const totals = useMemo(() => {
    const itemCount = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const subtotal = items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
    const delivery = subtotal > 0 ? 29 : 0;
    return { itemCount, subtotal, delivery, total: subtotal + delivery };
  }, [items]);

  const adminTotals = useMemo(() => {
    const userGroups = items.reduce((acc, item) => {
      const uid = item.userId || "unknown";
      if (!acc[uid]) acc[uid] = { items: [], total: 0 };
      acc[uid].items.push(item);
      acc[uid].total += Number(item.price || 0) * Number(item.quantity || 0);
      return acc;
    }, {});
    return {
      totalUsers: Object.keys(userGroups).length,
      userCarts: userGroups,
      totalItems: totals.itemCount,
      totalValue: totals.subtotal
    };
  }, [items, totals]);

  const value = useMemo(
    () => ({
      items,
      loading,
      error,
      totals,
      adminTotals,
      isAdmin,
      addToCart: (product, quantity) => addCartItem(user.uid, product, quantity),
      updateQuantity: (productId, quantity, userId) => updateCartItem(userId || user.uid, productId, quantity),
      removeFromCart: (productId, userId) => removeCartItem(userId || user.uid, productId)
    }),
    [items, loading, error, totals, adminTotals, user, isAdmin]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCartContext() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCartContext must be used inside CartProvider");
  return context;
}

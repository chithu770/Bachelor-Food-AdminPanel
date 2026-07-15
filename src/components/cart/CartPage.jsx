import CartItem from "./CartItem";
import CartSummary from "./CartSummary";
import LoadingSpinner from "../common/LoadingSpinner";
import Toast from "../common/Toast";
import { useCart } from "../../hooks/useCart";
import { useState } from "react";

export default function CartPage() {
  const { error, items, loading, removeFromCart, totals, updateQuantity, isAdmin, adminTotals } = useCart();
  const [toast, setToast] = useState(null);

  async function handleUpdate(productId, quantity, userId) {
    if (quantity < 1) return removeFromCart(productId, userId);
    await updateQuantity(productId, quantity, userId);
  }

  async function handleRemove(productId, userId) {
    await removeFromCart(productId, userId);
    setToast({ type: "success", message: "Item removed" });
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <p className="eyebrow">Order staging</p>
          <h1 className="page-title">Cart {isAdmin && "(Admin View)"}</h1>
        </div>
      </div>

      {error ? <div className="alert">{error}</div> : null}
      
      {loading ? (
        <LoadingSpinner label="Loading cart" />
      ) : isAdmin ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="metric"><span>Total Users</span><strong>{adminTotals.totalUsers}</strong></div>
            <div className="metric"><span>Total Items</span><strong>{adminTotals.totalItems}</strong></div>
            <div className="metric"><span>Total Value</span><strong>₹{adminTotals.totalValue}</strong></div>
          </div>
          
          {Object.entries(adminTotals.userCarts).map(([userId, cart]) => (
            <div className="panel" key={userId}>
              <h2 className="text-lg font-bold text-slate-950 mb-3">User: {userId}</h2>
              <div className="space-y-2">
                {cart.items.map((item) => (
                  <CartItem 
                    key={item.id} 
                    item={item} 
                    onRemove={(productId) => handleRemove(productId, item.userId)} 
                    onUpdate={(productId, quantity) => handleUpdate(productId, quantity, item.userId)} 
                    isAdmin={isAdmin}
                  />
                ))}
              </div>
            </div>
          ))}
          
          {items.length === 0 && <div className="empty-state">No cart items found.</div>}
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
          <section className="panel">
            <h2 className="text-lg font-bold text-slate-950">Selected items</h2>
            {items.length ? (
              <div className="mt-2">
                {items.map((item) => (
                  <CartItem item={item} key={item.id} onRemove={handleRemove} onUpdate={handleUpdate} />
                ))}
              </div>
            ) : (
              <div className="empty-state mt-5">Your cart is empty. Add products from the menu.</div>
            )}
          </section>
          <CartSummary totals={totals} />
        </div>
      )}
      <Toast message={toast?.message} onClose={() => setToast(null)} type={toast?.type} />
    </div>
  );
}

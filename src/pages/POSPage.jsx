import { ShoppingCart, Plus, Minus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import Toast from "../components/common/Toast";
import { useProducts } from "../hooks/useProducts";
import { createOrder } from "../services/orderService";
import { formatCurrency, getFirebaseErrorMessage } from "../utils/helpers";

export default function POSPage() {
  const { products, loading, error } = useProducts();
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [toast, setToast] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredProducts = useMemo(() => {
    const keyword = query.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(keyword) || p.hotelName?.toLowerCase().includes(keyword));
  }, [products, query]);

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  function addToCart(product) {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  }

  function removeFromCart(productId) {
    setCart((prev) => prev.map((item) => item.id === productId ? { ...item, quantity: item.quantity - 1 } : item).filter(item => item.quantity > 0));
  }

  async function handleCheckout() {
    if (cart.length === 0) return setToast({ type: "error", message: "Cart is empty" });
    if (!customerName || !customerPhone) return setToast({ type: "error", message: "Customer details are required" });

    setIsSubmitting(true);
    try {
      // Use the same flat schema as OrdersPage so all pages can read POS orders
      const cartItems = cart.map(({ id, name, price, quantity }) => ({ id, name, price, quantity }));
      const subtotal = cartTotal;
      await createOrder({
        customerName,
        customerPhone,
        customerId: "",
        customerEmail: "",
        address: "",
        items: cartItems,
        subtotal,
        deliveryCharge: 0,
        total: subtotal,
        status: "confirmed",
        paymentMethod,
        paymentStatus: "pending",
        orderType: "pos",
        notes: ""
      });
      setToast({ type: "success", message: "Order placed successfully!" });
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
    } catch (err) {
      setToast({ type: "error", message: getFirebaseErrorMessage(err) });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <p className="eyebrow">Manual Order Entry</p>
        <h1 className="page-title">Point of Sale (POS)</h1>
      </div>

      {error && <div className="alert">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Left: Products Catalog */}
        <div className="lg:col-span-2 panel flex flex-col h-full overflow-hidden">
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
            <input 
              className="input pl-10 w-full" 
              placeholder="Search products by name or restaurant..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="flex-1 overflow-y-auto pr-2">
            {loading ? (
               <div className="flex justify-center items-center h-40">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-ember" />
               </div>
            ) : filteredProducts.length === 0 ? (
               <div className="empty-state">No products found.</div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredProducts.map(product => (
                  <div key={product.id} className="border border-slate-200 rounded-md p-3 hover:border-ember transition-colors cursor-pointer flex flex-col" onClick={() => addToCart(product)}>
                     <img src={product.imageUrl || ""} alt={product.name} className="h-24 w-full object-cover rounded-md mb-2 bg-slate-100" onError={e => { e.target.style.display = 'none'; }} />
                     <h3 className="font-semibold text-slate-900 truncate">{product.name}</h3>
                     <p className="text-xs text-slate-500 truncate mb-2">{product.hotelName}</p>
                     <div className="mt-auto font-bold text-ember">{formatCurrency(product.price)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Cart Panel */}
        <div className="panel flex flex-col h-full">
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-200">
            <ShoppingCart className="h-5 w-5 text-slate-700" />
            <h2 className="text-lg font-bold text-slate-900">Current Order</h2>
          </div>

          <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2">
            {cart.length === 0 ? (
              <div className="text-center text-slate-500 py-10">Cart is empty. Select products to add.</div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 truncate">{item.name}</p>
                    <p className="text-xs text-slate-500">{formatCurrency(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600" onClick={() => removeFromCart(item.id)}>
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                    <button className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600" onClick={() => addToCart(item)}>
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-auto border-t border-slate-200 pt-4 space-y-4">
            <div className="space-y-3">
               <input className="input w-full text-sm" placeholder="Customer Name" value={customerName} onChange={e => setCustomerName(e.target.value)} />
               <input className="input w-full text-sm" placeholder="Phone Number" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
               <select className="input w-full text-sm" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                 <option value="cash">Cash</option>
                 <option value="card">Card</option>
                 <option value="upi">UPI</option>
                 <option value="online">Online</option>
               </select>
            </div>
            
            <div className="flex justify-between items-center text-lg font-bold text-slate-900">
              <span>Total</span>
              <span>{formatCurrency(cartTotal)}</span>
            </div>
            <button 
              className="btn-primary w-full py-3 text-base flex justify-center items-center" 
              onClick={handleCheckout} 
              disabled={isSubmitting || cart.length === 0}
            >
              {isSubmitting ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" /> : "Place Order"}
            </button>
          </div>
        </div>
      </div>

      <Toast message={toast?.message} onClose={() => setToast(null)} type={toast?.type} />
    </div>
  );
}

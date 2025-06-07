"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function CustomerPageInner() {
  const searchParams = useSearchParams();
  const restaurantId = searchParams.get("restaurant");
  const table = searchParams.get("table");

  const [menu, setMenu] = useState(null);
  const [cart, setCart] = useState([]);
  const [reorderCart, setReorderCart] = useState([]);
  const [orderId, setOrderId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      if (restaurantId) {
        const menuRes = await fetch(`/api/menu?restaurantId=${restaurantId}`);
        const menuData = await menuRes.json();
        setMenu(menuData.menu);

        const orderRes = await fetch(`/api/order/open?restaurantId=${restaurantId}&table=${table}`);
        if (orderRes.ok) {
          const orderData = await orderRes.json();
          if (orderData?.order && orderData.order.status !== "paid") {
            setOrderId(orderData.order.id);
            setCart(orderData.order.items || []);
          }
        }
      }
      setLoading(false);
    }
    fetchData();
  }, [restaurantId, table]);

  const addToCart = (item) => {
    if (orderId) {
      addToReorderCart(item);
      return;
    }

    setCart((prevCart) => {
      const existing = prevCart.find((i) => i.name === item.name);
      if (existing) {
        return prevCart.map((i) =>
          i.name === item.name ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prevCart, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (item) => {
    setCart((prevCart) =>
      prevCart
        .map((i) =>
          i.name === item.name ? { ...i, quantity: i.quantity - 1 } : i
        )
        .filter((i) => i.quantity > 0)
    );
  };

  const addToReorderCart = (item) => {
    setReorderCart((prev) => {
      const found = prev.find((i) => i.name === item.name);
      if (found) {
        return prev.map((i) =>
          i.name === item.name ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromReorderCart = (item) => {
    setReorderCart((prev) =>
      prev
        .map((i) =>
          i.name === item.name ? { ...i, quantity: i.quantity - 1 } : i
        )
        .filter((i) => i.quantity > 0)
    );
  };

  const placeOrder = async () => {
    const combinedItems = [...cart];

    reorderCart.forEach((reorderItem) => {
      const index = combinedItems.findIndex((i) => i.name === reorderItem.name);
      if (index !== -1) {
        combinedItems[index].quantity += reorderItem.quantity;
      } else {
        combinedItems.push(reorderItem);
      }
    });

    const payload = {
      restaurantId,
      table,
      items: combinedItems,
    };

    const url = orderId ? `/api/order/${orderId}` : "/api/order";
    const method = orderId ? "PUT" : "POST";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setCart(combinedItems);
    setReorderCart([]);
    alert("Order placed!");
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const reorderTotal = reorderCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = cartTotal + reorderTotal;

  if (!restaurantId || !table) {
    return (
      <div className="max-w-lg mx-auto py-10 text-center text-red-600 font-semibold">
        Invalid QR code.
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold mb-6 text-center">Menu</h2>
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></span>
          <span className="ml-3 text-lg">Loading menu...</span>
        </div>
      ) : menu ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {menu.items.map((item, idx) => (
              <div className="bg-white rounded-xl shadow-md hover:shadow-xl overflow-hidden flex flex-col" key={idx}>
                {item.photo && (
                  <img src={item.photo} alt={item.name} className="w-full h-44 object-cover" />
                )}
                <div className="p-4 flex-1 flex flex-col">
                  <h5 className="text-xl font-semibold mb-1">{item.name}</h5>
                  <p className="text-gray-600 text-sm mb-2 flex-1">{item.description}</p>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      item.veg === "veg" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {item.veg === "veg" ? "Veg" : "Non-Veg"}
                    </span>
                    <span className="px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800 font-semibold">
                      {item.spice}
                    </span>
                  </div>
                  <div className="text-lg font-bold mb-3">₹{item.price}</div>
                  <div className="flex gap-2 mt-auto">
                    <button
                      className={`flex-1 ${orderId ? "bg-gray-300 text-gray-600 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white"} font-semibold py-2 rounded transition`}
                      onClick={() => !orderId && addToCart(item)}
                      disabled={!!orderId}
                    >
                      Add to Cart
                    </button>
                    <button
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 rounded transition"
                      onClick={() => addToReorderCart(item)}
                    >
                      Reorder
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Cart Section */}
          <hr className="my-8" />
          <h4 className="text-2xl font-bold mb-4">Your Order</h4>
          {cart.length === 0 ? (
            <div className="text-gray-500 mb-6">No items in cart.</div>
          ) : (
            <ul className="mb-6 space-y-3">
              {cart.map((item, idx) => (
                <li key={idx} className="flex items-center justify-between bg-gray-50 rounded px-4 py-2 shadow-sm">
                  <span className="font-medium">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <button className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-lg font-bold" onClick={() => removeFromCart(item)}>−</button>
                    <span className="font-semibold text-blue-700">{item.quantity}</span>
                    <button className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-lg font-bold" onClick={() => addToCart(item)}>+</button>
                  </div>
                  <span className="text-gray-700 font-semibold">₹{item.price * item.quantity}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Reorder Section */}
          {reorderCart.length > 0 && (
            <>
              <h4 className="text-2xl font-bold mb-4">Reorder Items</h4>
              <ul className="mb-6 space-y-3">
                {reorderCart.map((item, idx) => (
                  <li key={idx} className="flex items-center justify-between bg-purple-50 rounded px-4 py-2 shadow-sm">
                    <span className="font-medium">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <button className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-lg font-bold" onClick={() => removeFromReorderCart(item)}>−</button>
                      <span className="font-semibold text-purple-700">{item.quantity}</span>
                      <button className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-lg font-bold" onClick={() => addToReorderCart(item)}>+</button>
                    </div>
                    <span className="text-gray-700 font-semibold">₹{item.price * item.quantity}</span>
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* Combined Total and Order Button */}
          <div className="flex justify-end items-center mb-6">
            <span className="text-xl font-bold mr-2">Total:</span>
            <span className="text-2xl text-green-700 font-bold">₹{total}</span>
          </div>

          <button
            className={`w-full py-3 rounded font-bold text-white transition ${
              cart.length + reorderCart.length === 0
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
            disabled={cart.length + reorderCart.length === 0}
            onClick={placeOrder}
          >
            {orderId ? "Update Order" : "Place Order"}
          </button>
        </>
      ) : (
        <div className="text-red-600 font-semibold">Menu not found.</div>
      )}
    </div>
  );
}

export default function CustomerPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-40">Loading...</div>}>
      <CustomerPageInner />
    </Suspense>
  );
}

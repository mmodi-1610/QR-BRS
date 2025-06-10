"use client";
import { useEffect, useState } from "react";
import { Printer, CheckCircle, PlusCircle, X } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";
import io from "socket.io-client";

let socket;

function getUserIdFromToken() {
  const token = Cookies.get("token");
  if (!token) return null;
  try {
    const decoded = jwtDecode(token);
    return decoded.userId;
  } catch {
    return null;
  }
}

export default function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [menu, setMenu] = useState([]);
  const [selectedTable, setSelectedTable] = useState("");
  const [selectedItems, setSelectedItems] = useState({});
  const [showOrderForm, setShowOrderForm] = useState(false);
  const restaurantId = getUserIdFromToken();

  useEffect(() => {
    const fetchData = async () => {
      const [orderRes, menuRes] = await Promise.all([fetch("/api/order"), fetch("/api/menu")]);
      const orderData = await orderRes.json();
      const menuData = await menuRes.json();
      setOrders(orderData.orders || []);
      setMenu(menuData.menu?.items || []);
    };
    fetchData();
  }, []);

useEffect(() => {
  const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000";
  const socket = io(SOCKET_URL, { transports: ["websocket"] });

  socket.on("order:new", (order) => {
    setOrders((prev) => [order, ...prev]);
  });

  return () => {
    socket.disconnect();
  };
}, []);

  const unpaidOrdersByTable = orders
    .filter((o) => o.status !== "paid")
    .reduce((acc, o) => {
      acc[o.table] = acc[o.table] || [];
      acc[o.table].push(o);
      return acc;
    }, {});

  const handlePlaceOrder = async (table, items) => {
    if (!table || !items?.length) return alert("Select table and items");

    await fetch("/api/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restaurantId, table, items }),
    });

    setSelectedTable("");
    setSelectedItems({});
    setShowOrderForm(false);
    const res = await fetch("/api/order");
    const data = await res.json();
    setOrders(data.orders || []);
  };

  const handleMarkAsPaid = async (table, unpaidOrders) => {
    const ids = unpaidOrders.map((o) => o._id);
    await fetch("/api/order", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, status: "paid" }),
    });
    setOrders((prev) => prev.map((o) => (ids.includes(o._id) ? { ...o, status: "paid" } : o)));
  };

  const handlePrint = (table, unpaidOrders) => {
    const allItems = unpaidOrders.flatMap((o) => o.items);
    const combinedItems = Object.values(
      allItems.reduce((acc, i) => {
        acc[i.name] = acc[i.name]
          ? { ...acc[i.name], quantity: acc[i.name].quantity + i.quantity }
          : { ...i };
        return acc;
      }, {})
    );
    const total = combinedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
      <head><title>Bill - Table ${table}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; }
        th { background-color: #f9fafb; }
        .total { font-weight: bold; }
      </style></head>
      <body>
        <h2>Bill - Table ${table}</h2>
        <table>
          <thead>
            <tr><th>Item</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr>
          </thead>
          <tbody>
            ${combinedItems
              .map(
                (i) => `
              <tr>
                <td>${i.name}</td>
                <td>${i.quantity}</td>
                <td>₹${i.price}</td>
                <td>₹${i.price * i.quantity}</td>
              </tr>`
              )
              .join("")}
            <tr>
              <td colspan="3" class="total">Total</td>
              <td class="total">₹${total}</td>
            </tr>
          </tbody>
        </table>
        <p>Status: Unpaid</p>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // --- Modal for placing order ---
  const renderOrderForm = () => {
    const currentItem = selectedItems._currentItem || "";
    const currentQty = selectedItems._currentQty || 1;
    const list = selectedItems.list || [];

    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={() => setShowOrderForm(false)}
      >
        <div
          className="bg-white rounded-lg shadow-lg max-w-3xl w-full p-6 relative"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <button
            aria-label="Close modal"
            onClick={() => setShowOrderForm(false)}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 transition"
          >
            <X size={24} />
          </button>

          <h2 id="modal-title" className="text-2xl font-semibold mb-6 text-gray-900">
            Place New Order
          </h2>

          {/* Table Input */}
          <label className="block mb-2 font-medium text-gray-700">Table Name/Number</label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-6"
            placeholder="E.g. T1 or 12"
            value={selectedTable}
            onChange={(e) => setSelectedTable(e.target.value)}
          />

          {/* Item Selector */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <select
              className="flex-grow min-w-[180px] border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={currentItem}
              onChange={(e) =>
                setSelectedItems((prev) => ({
                  ...prev,
                  _currentItem: e.target.value,
                  _currentQty: 1,
                }))
              }
            >
              <option value="">Select Item...</option>
              {menu.map((item, idx) => (
                <option key={idx} value={item.name}>
                  {item.name} (₹{item.price})
                </option>
              ))}
            </select>

            <div className="flex items-center space-x-3">
              <button
                disabled={!currentItem}
                onClick={() =>
                  setSelectedItems((prev) => ({
                    ...prev,
                    _currentQty: Math.max(1, currentQty - 1),
                  }))
                }
                className="disabled:opacity-50 disabled:cursor-not-allowed bg-gray-200 hover:bg-gray-300 text-gray-700 rounded px-3 py-1 transition"
              >
                −
              </button>
              <span className="font-semibold text-lg min-w-[20px] text-center">{currentQty}</span>
              <button
                disabled={!currentItem}
                onClick={() =>
                  setSelectedItems((prev) => ({
                    ...prev,
                    _currentQty: currentQty + 1,
                  }))
                }
                className="disabled:opacity-50 disabled:cursor-not-allowed bg-gray-200 hover:bg-gray-300 text-gray-700 rounded px-3 py-1 transition"
              >
                +
              </button>
            </div>

            <button
              disabled={!currentItem}
              onClick={() => {
                const menuItem = menu.find((i) => i.name === currentItem);
                if (!menuItem) return;
                const filtered = list.filter((i) => i.name !== currentItem);
                setSelectedItems({
                  list: [...filtered, { name: currentItem, price: menuItem.price, quantity: currentQty }],
                  _currentItem: "",
                  _currentQty: 1,
                });
              }}
              className="disabled:opacity-50 disabled:cursor-not-allowed bg-indigo-600 hover:bg-indigo-700 text-white rounded px-4 py-2 font-semibold transition"
            >
              Add
            </button>
          </div>

          {/* Order Preview */}
          {list.length > 0 ? (
            <div className="overflow-x-auto max-h-64 border border-gray-200 rounded-md shadow-inner">
              <table className="min-w-full text-left text-sm text-gray-700">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 font-semibold">Item</th>
                    <th className="px-4 py-2 font-semibold">Qty</th>
                    <th className="px-4 py-2 font-semibold">Price</th>
                    <th className="px-4 py-2 font-semibold">Subtotal</th>
                    <th className="px-4 py-2 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((item, idx) => (
                    <tr
                      key={idx}
                      className="border-t border-gray-200 even:bg-gray-50 hover:bg-indigo-50 transition"
                    >
                      <td className="px-4 py-2">{item.name}</td>
                      <td className="px-4 py-2">{item.quantity}</td>
                      <td className="px-4 py-2">₹{item.price}</td>
                      <td className="px-4 py-2">₹{item.price * item.quantity}</td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() =>
                            setSelectedItems((prev) => ({
                              ...prev,
                              list: prev.list.filter((i) => i.name !== item.name),
                            }))
                          }
                          className="text-red-600 hover:text-red-800 font-semibold"
                          aria-label={`Remove ${item.name}`}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 italic">No items added yet.</p>
          )}

          {/* Buttons */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setShowOrderForm(false)}
              className="px-5 py-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button
              disabled={!selectedTable || list.length === 0}
              onClick={() => handlePlaceOrder(selectedTable, list)}
              className="disabled:opacity-50 disabled:cursor-not-allowed px-5 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition"
            >
              Confirm Order
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-grow p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
          <button
            onClick={() => {
              setShowOrderForm(true);
              setSelectedTable("");
              setSelectedItems({});
            }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded shadow transition"
          >
            <PlusCircle size={20} />
            New Order
          </button>
        </div>

        {Object.keys(unpaidOrdersByTable).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <svg
              className="w-24 h-24 mb-4 text-gray-300"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 10h4l3 8 4-16 3 8h4"
              ></path>
            </svg>
            <p className="text-xl font-semibold">No unpaid orders.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(unpaidOrdersByTable).map(([table, tableOrders]) => (
              <div
                key={table}
                className="bg-white rounded-lg shadow-md border border-gray-200 flex flex-col"
              >
                <div className="bg-indigo-600 text-white rounded-t-lg px-5 py-3 flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Table {table}</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedTable(table);
                        setSelectedItems({});
                        setShowOrderForm(true);
                      }}
                      className="bg-indigo-500 hover:bg-indigo-700 px-3 py-1 rounded text-sm flex items-center gap-1 transition"
                      aria-label={`Add order to table ${table}`}
                    >
                      <PlusCircle size={16} />
                      Add
                    </button>
                    <button
                      onClick={() => handleMarkAsPaid(table, tableOrders)}
                      className="bg-white text-indigo-700 hover:bg-indigo-100 px-3 py-1 rounded text-sm flex items-center gap-1 border border-indigo-700 transition"
                      aria-label={`Mark orders for table ${table} as paid`}
                    >
                      <CheckCircle size={16} />
                      Paid
                    </button>
                  </div>
                </div>
                <div className="p-4 flex-grow overflow-auto">
                  {tableOrders.map((order) => (
                    <div
                      key={order._id}
                      className="mb-4 border-b border-gray-200 pb-3 last:mb-0 last:border-none"
                    >
                      <div className="flex justify-between items-center mb-1 text-xs text-gray-500">
                        <span>Order ID: {order._id}</span>
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                            order.status === "paid"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {order.status.toUpperCase()}
                        </span>
                      </div>
                      <ul className="text-sm text-gray-700 space-y-0.5">
                        {order.items.map((item, i) => (
                          <li key={i} className="flex justify-between">
                            <span>
                              {item.name} × {item.quantity}
                            </span>
                            <span>₹{item.price * item.quantity}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-3 border-t border-gray-200 flex justify-between items-center">
                  <strong className="text-lg">
                    ₹
                    {tableOrders
                      .flatMap((o) => o.items)
                      .reduce((sum, i) => sum + i.price * i.quantity, 0)}
                  </strong>
                  <button
                    onClick={() => handlePrint(table, tableOrders)}
                    className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-semibold transition"
                    aria-label={`Print bill for table ${table}`}
                  >
                    <Printer size={18} />
                    Print Bill
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showOrderForm && renderOrderForm()}
      </main>
    </div>
  );
}

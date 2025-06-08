"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar"; // Tailwind + Framer Motion sidebar

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [sortOrder, setSortOrder] = useState("latest");

  useEffect(() => {
    fetch("/api/order")
      .then((res) => res.json())
      .then((data) => {
        if (data.orders) {
          setOrders(data.orders.filter((order) => order.status === "paid"));
        }
      });
  }, []);

  const sortedOrders = [...orders].sort((a, b) => {
    if (sortOrder === "latest") {
      return new Date(b.createdAt) - new Date(a.createdAt);
    } else {
      return new Date(a.createdAt) - new Date(b.createdAt);
    }
  });

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar with dynamic width, no fixed width here */}
      <aside className="flex-shrink-0 bg-white border-r border-gray-200 shadow-sm">
        <Sidebar />
      </aside>

      {/* Main Content fills remaining space */}
      <main className="flex-1 p-8 overflow-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h1 className="text-3xl font-extrabold text-gray-900">Order History</h1>
          <div className="flex items-center space-x-3">
            <label
              htmlFor="sortOrder"
              className="text-gray-700 font-semibold cursor-pointer select-none"
            >
              Sort by:
            </label>
            <select
              id="sortOrder"
              className="border border-gray-300 rounded-md px-4 py-2 text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="latest">Latest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {/* No Orders Message */}
        {sortedOrders.length === 0 ? (
          <div className="flex justify-center items-center py-20">
            <p className="text-lg text-gray-500">No paid orders yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {sortedOrders.map((order) => (
              <article
                key={order._id}
                className="bg-white rounded-lg shadow-md flex flex-col h-full border border-gray-200 hover:shadow-lg transition-shadow"
              >
                {/* Header */}
                <header className="bg-green-600 text-white rounded-t-lg px-5 py-3">
                  <h2 className="text-xl font-semibold">Table: {order.table}</h2>
                </header>

                {/* Body */}
                <section className="flex-grow px-5 py-4 flex flex-col">
                  <p className="text-sm font-semibold text-gray-700 mb-2 break-words">
                    <span className="text-gray-500 font-normal">Order ID:</span>{" "}
                    {order._id}
                  </p>

                  <span className="inline-block bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold w-max mb-3">
                    Paid
                  </span>

                  <time
                    className="text-xs text-gray-500 mb-4"
                    dateTime={order.createdAt}
                  >
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleString()
                      : ""}
                  </time>

                  {/* Items Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm text-gray-700">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border px-3 py-2 text-left">Item</th>
                          <th className="border px-3 py-2 text-center">Qty</th>
                          <th className="border px-3 py-2 text-right">Price</th>
                          <th className="border px-3 py-2 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items.map((item, idx) => (
                          <tr
                            key={idx}
                            className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                          >
                            <td className="border px-3 py-2">{item.name}</td>
                            <td className="border px-3 py-2 text-center">
                              {item.quantity}
                            </td>
                            <td className="border px-3 py-2 text-right">
                              ₹{item.price}
                            </td>
                            <td className="border px-3 py-2 text-right">
                              ₹{item.price * item.quantity}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Footer */}
                <footer className="px-5 py-4 border-t border-gray-200 text-right text-lg font-bold text-gray-900">
                  Total: ₹
                  {order.items.reduce(
                    (sum, item) => sum + item.price * item.quantity,
                    0
                  )}
                </footer>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

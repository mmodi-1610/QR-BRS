"use client";
import { useEffect, useState } from "react";
import SidebarKitchen from "@/components/SidebarKitchen";

export default function ServedHistory() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetch("/api/order")
      .then(res => res.json())
      .then(data => {
        if (data.orders) {
          setOrders(data.orders.filter(order => order.status === "served"));
        }
      });
  }, []);

  return (
    <div className="container py-4">
      <SidebarKitchen />
      <h1 className="mb-4 fw-bold">Served Orders History</h1>
      <div className="row">
        {orders.length === 0 ? (
          <div className="col-12 text-center text-muted py-5">
            <h4>No served orders yet.</h4>
          </div>
        ) : (
          orders.map(order => (
            <div className="col-md-6 col-lg-4 mb-4" key={order._id}>
              <div className="card shadow border-0 h-100">
                <div className="card-header bg-secondary text-white">
                  <h5 className="mb-0">Table: {order.table}</h5>
                </div>
                <div className="card-body">
                  <div className="mb-2">
                    <span className="fw-semibold">Order ID: {order._id}</span>
                  </div>
                  <div className="mb-2">
                    <span className="badge bg-secondary">Served</span>
                  </div>
                  <div className="mb-2 text-muted small">
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleString()
                      : ""}
                  </div>
                  <table className="table table-sm mb-2">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item, idx) => (
                        <tr key={idx}>
                          <td>{item.name}</td>
                          <td>{item.quantity}</td>
                          <td>₹{item.price}</td>
                          <td>₹{item.price * item.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="fw-bold">
                    Total: ₹
                    {order.items.reduce(
                      (sum, item) => sum + item.price * item.quantity,
                      0
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
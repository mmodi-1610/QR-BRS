"use client";
import { useEffect, useState } from "react";
import { Printer, CheckCircle, PlusCircle } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";

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
  const [selectedItems, setSelectedItems] = useState([]);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const restaurantId=getUserIdFromToken();

  // Fetch orders and menu on mount
  useEffect(() => {
    fetch("/api/order")
      .then(res => res.json())
      .then(data => setOrders(data.orders || []));
    fetch("/api/menu")
      .then(res => res.json())
      .then(data => setMenu(data.menu?.items || []));
  }, []);

  // Place order handler
  const handlePlaceOrder = async (table, items) => {
  if (!table || !items || items.length === 0) {
    alert("Please select a table and at least one item.");
    return;
  }
  await fetch("/api/order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      restaurantId: restaurantId, // backend will use token
      table,
      items,
    }),
  });
  setSelectedTable("");
  setSelectedItems({});
  setShowOrderForm(false);
  // Refresh orders
  fetch("/api/order")
    .then(res => res.json())
    .then(data => setOrders(data.orders || []));
};

  // Add/remove item for new order
  const handleItemChange = (item, delta) => {
    setSelectedItems(prev => {
      const existing = prev.find(i => i.name === item.name);
      if (existing) {
        const updated = prev.map(i =>
          i.name === item.name
            ? { ...i, quantity: Math.max(1, i.quantity + delta) }
            : i
        );
        return updated.filter(i => i.quantity > 0);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  // Print bill for all unpaid orders of a table
  const handlePrint = (table, unpaidOrders) => {
    const allItems = unpaidOrders.flatMap(order => order.items);
    const combinedItems = Object.values(
      allItems.reduce((acc, item) => {
        if (!acc[item.name]) {
          acc[item.name] = { ...item };
        } else {
          acc[item.name].quantity += item.quantity;
        }
        return acc;
      }, {})
    );
    const total = combinedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Bill - Table ${table}</title>
          <style>
            body { font-family: Arial; padding: 20px; }
            h2 { margin-bottom: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background: #f8f8f8; }
            .total { font-weight: bold; }
          </style>
        </head>
        <body>
          <h2>Bill - Table ${table}</h2>
          <table>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Subtotal</th>
            </tr>
            ${combinedItems
              .map(
                (item) => `
              <tr>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>₹${item.price}</td>
                <td>₹${item.price * item.quantity}</td>
              </tr>
            `
              )
              .join("")}
            <tr>
              <td colspan="3" class="total">Total</td>
              <td class="total">₹${total}</td>
            </tr>
          </table>
          <p>Status: Unpaid</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Mark all unpaid orders for a table as paid
  const handleMarkAsPaid = async (table, unpaidOrders) => {
    const ids = unpaidOrders.map(order => order._id);
    await fetch("/api/order", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, status: "paid" }),
    });
    setOrders(orders =>
      orders.map(order =>
        ids.includes(order._id) ? { ...order, status: "paid" } : order
      )
    );
  };

  // Group unpaid orders by table
  const unpaidOrdersByTable = orders
    .filter(order => order.status !== "paid")
    .reduce((acc, order) => {
      acc[order.table] = acc[order.table] || [];
      acc[order.table].push(order);
      return acc;
    }, {});

  // --- UI ---
  return (
    <div className="container py-4">
      <Sidebar />
      <h1 className="mb-4 fw-bold">Order Management</h1>

      {/* General Place Order Button */}
      <div className="mb-4">
        <button
          className="btn btn-primary"
          onClick={() => {
            setShowOrderForm(true);
            setSelectedTable("");
            setSelectedItems([]);
          }}
        >
          <PlusCircle className="me-2" /> Place Order
        </button>
      </div>

      {showOrderForm && (
  <div className="modal fade show d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,0.3)" }}>
    <div className="modal-dialog">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">Place New Order</h5>
          <button type="button" className="btn-close" onClick={() => setShowOrderForm(false)}></button>
        </div>
        <div className="modal-body">
          <div className="mb-3">
            <label className="form-label">Table</label>
            <input
              type="text"
              className="form-control"
              value={selectedTable}
              onChange={e => setSelectedTable(e.target.value)}
              placeholder="Enter table number/name"
            />
          </div>
          {/* Improved item selection */}
          <div className="mb-3">
            <label className="form-label">Select Item</label>
            <div className="d-flex align-items-center">
              <select
                className="form-select me-2"
                style={{ maxWidth: 200 }}
                value={selectedItems._currentItem || ""}
                onChange={e => {
                  const itemName = e.target.value;
                  setSelectedItems(prev => ({
                    ...prev,
                    _currentItem: itemName,
                    _currentQty: 1,
                  }));
                }}
              >
                <option value="">Choose item...</option>
                {menu.map((item, idx) => (
                  <option key={idx} value={item.name}>
                    {item.name} (₹{item.price})
                  </option>
                ))}
              </select>
              <button
                className="btn btn-outline-secondary"
                type="button"
                onClick={() =>
                  setSelectedItems(prev => ({
                    ...prev,
                    _currentQty: Math.max(1, (prev._currentQty || 1) - 1),
                  }))
                }
                disabled={!selectedItems._currentItem}
              >-</button>
              <span className="mx-2" style={{ minWidth: 24, textAlign: "center" }}>
                {selectedItems._currentQty || 1}
              </span>
              <button
                className="btn btn-outline-secondary"
                type="button"
                onClick={() =>
                  setSelectedItems(prev => ({
                    ...prev,
                    _currentQty: (prev._currentQty || 1) + 1,
                  }))
                }
                disabled={!selectedItems._currentItem}
              >+</button>
              <button
                className="btn btn-success ms-3"
                type="button"
                disabled={!selectedItems._currentItem}
                onClick={() => {
                  const itemName = selectedItems._currentItem;
                  const qty = selectedItems._currentQty || 1;
                  const menuItem = menu.find(i => i.name === itemName);
                  if (!menuItem) return;
                  // Add or update item in order
                  setSelectedItems(prev => {
                    const filtered = (prev.list || []).filter(i => i.name !== itemName);
                    return {
                      ...prev,
                      list: [
                        ...filtered,
                        { name: itemName, price: menuItem.price, quantity: qty },
                      ],
                      _currentItem: "",
                      _currentQty: 1,
                    };
                  });
                }}
              >
                Add
              </button>
            </div>
          </div>
          {/* Show current order items */}
          <div>
            <label className="form-label">Order Items</label>
            {(selectedItems.list && selectedItems.list.length > 0) ? (
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Subtotal</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {selectedItems.list.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.name}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-secondary me-1"
                          onClick={() => {
                            setSelectedItems(prev => {
                              const updated = prev.list.map(i =>
                                i.name === item.name
                                  ? { ...i, quantity: Math.max(1, i.quantity - 1) }
                                  : i
                              );
                              return { ...prev, list: updated };
                            });
                          }}
                        >-</button>
                        {item.quantity}
                        <button
                          className="btn btn-sm btn-outline-secondary ms-1"
                          onClick={() => {
                            setSelectedItems(prev => {
                              const updated = prev.list.map(i =>
                                i.name === item.name
                                  ? { ...i, quantity: i.quantity + 1 }
                                  : i
                              );
                              return { ...prev, list: updated };
                            });
                          }}
                        >+</button>
                      </td>
                      <td>₹{item.price}</td>
                      <td>₹{item.price * item.quantity}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => {
                            setSelectedItems(prev => ({
                              ...prev,
                              list: prev.list.filter(i => i.name !== item.name),
                            }));
                          }}
                        >Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-muted">No items added yet.</div>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setShowOrderForm(false)}>Cancel</button>
          <button
            className="btn btn-success"
            onClick={() => {
              // Place order with selectedItems.list
              handlePlaceOrder(selectedTable, selectedItems.list || []);
            }}
            disabled={!selectedTable || !(selectedItems.list && selectedItems.list.length > 0)}
          >
            Place Order
          </button>
        </div>
      </div>
    </div>
  </div>
)}

      <div className="row">
        {Object.keys(unpaidOrdersByTable).length === 0 ? (
          <div className="col-12 text-center text-muted py-5">
            <h4>No orders yet.</h4>
          </div>
        ) : (
          Object.entries(unpaidOrdersByTable).map(([table, tableOrders]) => (
            <div className="col-md-6 col-lg-4 mb-4" key={table}>
              <div className="card shadow border-0 h-100">
                <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Table: {table}</h5>
                  {/* Place Order for this table */}
                  <button
                    className="btn btn-outline-primary btn-sm me-2"
                    onClick={() => {
                      setShowOrderForm(true);
                      setSelectedTable(table);
                      setSelectedItems([]);
                    }}
                  >
                    <PlusCircle size={16} className="me-1" />
                    Place Order
                  </button>
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => handleMarkAsPaid(table, tableOrders)}
                    title="Mark all as Paid"
                  >
                    <CheckCircle size={18} className="me-1" />
                    Mark as Paid
                  </button>
                </div>
                <div className="card-body">
                  {tableOrders.map((order) => (
                    <div key={order._id} className="mb-4 border-bottom pb-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="fw-semibold">Order ID: {order._id}</span>
                        <span className="badge bg-info text-dark">{order.status}</span>
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
                    </div>
                  ))}
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="fw-bold">
                      Total: ₹
                      {
                        tableOrders
                          .flatMap(order => order.items)
                          .reduce((sum, item) => sum + item.price * item.quantity, 0)
                      }
                    </span>
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => handlePrint(table, tableOrders)}
                    >
                      <Printer size={16} className="me-1" />
                      Print Bill
                    </button>
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
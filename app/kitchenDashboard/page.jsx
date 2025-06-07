"use client";
import { useEffect, useState } from "react";
import SidebarKitchen from "@/components/SidebarKitchen";

export default function KitchenDashboard() {
  const [orders, setOrders] = useState([]);
  const [menu, setMenu] = useState([]);
  const [filterType, setFilterType] = useState("table");
  const [selectedTable, setSelectedTable] = useState("");

  useEffect(() => {
    fetch("/api/order")
      .then(res => res.json())
      .then(data => {
        // Only orders that are pending or served (but not paid)
        setOrders((data.orders || []).filter(o => o.status === "pending" || o.status === "served"));
      });
    fetch("/api/menu")
      .then(res => res.json())
      .then(data => {
        setMenu(data.menu?.items || []);
      });
  }, []);

  // Build a map: item name -> category
  const nameToCategory = {};
  menu.forEach(item => {
    nameToCategory[item.name] = item.category || "Other";
  });

  // Group relevant orders by table
  const ordersByTable = orders.reduce((acc, order) => {
    acc[order.table] = acc[order.table] || [];
    acc[order.table].push(order);
    return acc;
  }, {});

  // Main and Add-On logic as per your definition
  const mainOrders = [];
  const addOnOrders = [];
  Object.entries(ordersByTable).forEach(([table, tableOrders]) => {
    // Only consider tables that have at least one pending order
    const pendingOrders = tableOrders.filter(o => o.status === "pending" || o.status==="served");
    if (pendingOrders.length > 0) {
      // Main order: oldest pending order
      const mainOrder = pendingOrders.reduce((oldest, curr) =>
        new Date(curr.createdAt) < new Date(oldest.createdAt) ? curr : oldest
      );
      mainOrders.push(mainOrder);

      // Add-ons: all other orders (pending or served, but not paid), except the main order
      tableOrders
        .filter(
          o =>
            (o.status === "pending") &&
            o._id !== mainOrder._id
        )
        .forEach(o => addOnOrders.push(o));
    }
  });

  function getCategoryWiseItems(orderList) {
    const itemMap = {};
    orderList.forEach(order => {
      order.items.forEach(item => {
        const cat = nameToCategory[item.name] || "Other";
        if (!itemMap[cat]) itemMap[cat] = {};
        if (!itemMap[cat][item.name]) itemMap[cat][item.name] = 0;
        itemMap[cat][item.name] += item.quantity;
      });
    });
    return Object.entries(itemMap).map(([cat, items]) => ({
      category: cat,
      items: Object.entries(items).map(([name, qty]) => ({ name, qty })),
    }));
  }

  const markAsServed = async (orderId) => {
    await fetch("/api/order", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [orderId], status: "served" }),
    });
    setOrders(orders => orders.map(o =>
      o._id === orderId ? { ...o, status: "served" } : o
    ));
  };

  const filteredMainOrders = filterType === "table" && selectedTable
    ? mainOrders.filter(o => o.table === selectedTable)
    : mainOrders;
  const filteredAddOnOrders = filterType === "table" && selectedTable
    ? addOnOrders.filter(o => o.table === selectedTable)
    : addOnOrders;

  const allTables = Object.keys(ordersByTable);

  return (
    <div className="container py-4">
      <SidebarKitchen />
      <h1 className="mb-4 fw-bold">KITCHEN DASHBOARD</h1>
      <div className="mb-3 d-flex align-items-center gap-3">
        <label className="fw-semibold">Filter:</label>
        <select
          className="form-select w-auto"
          value={filterType}
          onChange={e => {
            setFilterType(e.target.value);
            setSelectedTable("");
          }}
        >
          <option value="table">Table Wise</option>
          <option value="quantity">Net Quantity (Category Wise)</option>
        </select>
        {filterType === "table" && (
          <select
            className="form-select w-auto"
            value={selectedTable}
            onChange={e => setSelectedTable(e.target.value)}
          >
            <option value="">All Tables</option>
            {allTables.map(table => (
              <option key={table} value={table}>{table}</option>
            ))}
          </select>
        )}
      </div>

      <div className="row">
        {/* Main Orders Section */}
        <div className="col-md-6 border-end">
          <h3 className="mb-3">Main Orders</h3>
          {filterType === "quantity" ? (
            getCategoryWiseItems(mainOrders.filter(o => o.status === "pending")).map(cat => (
              <div key={cat.category} className="mb-3">
                <h5>{cat.category}</h5>
                <ul>
                  {cat.items.map(item => (
                    <li key={item.name}>
                      {item.name}: <b>{item.qty}</b>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          ) : (
            filteredMainOrders.filter(order => order.status === "pending").length === 0 ? (
              <div className="text-muted">No main orders.</div>
            ) : (
              filteredMainOrders
                .filter(order => order.status === "pending")
                .map(order => (
                  <div key={order._id} className="card mb-3">
                    <div className="card-header d-flex justify-content-between align-items-center">
                      <span>Table: <b>{order.table}</b> | Order ID: {order._id}</span>
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => markAsServed(order._id)}
                      >
                        Mark as Served
                      </button>
                    </div>
                    <div className="card-body">
                      <ul className="mb-0">
                        {order.items.map((item, idx) => (
                          <li key={idx}>
                            {item.name} ({item.quantity}){" "}
                            {nameToCategory[item.name] ? (
                              <span className="text-muted small">[{nameToCategory[item.name]}]</span>
                            ) : ""}
                          </li>
                        ))}
                      </ul>
                      <div className="text-muted small mt-2">
                        Placed at: {order.createdAt ? new Date(order.createdAt).toLocaleString() : ""}
                      </div>
                    </div>
                  </div>
                ))
            )
          )}
        </div>

        {/* Add-On Orders Section */}
        <div className="col-md-6">
          <h3 className="mb-3">Add-On Orders</h3>
          {filterType === "quantity" ? (
            getCategoryWiseItems(addOnOrders.filter(o => o.status === "pending")).map(cat => (
              <div key={cat.category} className="mb-3">
                <h5>{cat.category}</h5>
                <ul>
                  {cat.items.map(item => (
                    <li key={item.name}>
                      {item.name}: <b>{item.qty}</b>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          ) : (
            filteredAddOnOrders.filter(order => order.status === "pending").length === 0 ? (
              <div className="text-muted">No add-on orders.</div>
            ) : (
              filteredAddOnOrders
                .filter(order => order.status === "pending")
                .map(order => (
                  <div key={order._id} className="card mb-3">
                    <div className="card-header d-flex justify-content-between align-items-center">
                      <span>Table: <b>{order.table}</b> | Order ID: {order._id}</span>
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => markAsServed(order._id)}
                      >
                        Mark as Served
                      </button>
                    </div>
                    <div className="card-body">
                      <ul className="mb-0">
                        {order.items.map((item, idx) => (
                          <li key={idx}>
                            {item.name} ({item.quantity}){" "}
                            {nameToCategory[item.name] ? (
                              <span className="text-muted small">[{nameToCategory[item.name]}]</span>
                            ) : ""}
                          </li>
                        ))}
                      </ul>
                      <div className="text-muted small mt-2">
                        Placed at: {order.createdAt ? new Date(order.createdAt).toLocaleString() : ""}
                      </div>
                    </div>
                  </div>
                ))
            )
          )}
        </div>
      </div>
    </div>
  );
}
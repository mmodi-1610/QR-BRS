"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Line, Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Title
);

function getDateString(date) {
  return date.toISOString().split("T")[0];
}
function getHourString(date) {
  return date.getHours() + ":00";
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [menu, setMenu] = useState([]);
  const [stats, setStats] = useState({
    todaySales: 0,
    weekSales: 0,
    monthSales: 0,
    numOrders: 0,
    avgOrderValue: 0,
    topItem: null,
    leastItems: [],
    activeTables: 0,
    peakHour: null,
    salesByDay: [],
    salesByHour: [],
    catMap: {},
    orderVolume: [],
    avgPrepTime: 0,
    avgOrderSize: 0,
    topCombos: [],
    itemAnalytics: [],
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/order").then(res => res.json()),
      fetch("/api/menu").then(res => res.json()),
    ]).then(([orderData, menuData]) => {
      const paidOrders = (orderData.orders || []).filter(o => o.status === "paid");
      const menuItems = menuData.menu?.items || [];
      setOrders(paidOrders);
      setMenu(menuItems);

      // --- KPIs ---
      const now = new Date();
      const todayStr = getDateString(now);
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      const weekStr = getDateString(weekStart);
      const monthStr = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");

      let todaySales = 0, weekSales = 0, monthSales = 0, numOrders = paidOrders.length;
      let totalValue = 0, totalItems = 0, tableSet = new Set(), prepTimes = [], orderSizes = [];
      let itemMap = {}, comboMap = {}, dayMap = {}, hourMap = {}, catMap = {};

      paidOrders.forEach(order => {
        const orderDate = new Date(order.createdAt);
        const orderDay = getDateString(orderDate);
        const orderHour = getHourString(orderDate);
        const orderMonth = orderDate.getFullYear() + "-" + String(orderDate.getMonth() + 1).padStart(2, "0");
        const orderValue = order.items.reduce((s, i) => s + i.price * i.quantity, 0);

        // Sales by day/hour
        dayMap[orderDay] = (dayMap[orderDay] || 0) + orderValue;
        hourMap[orderHour] = (hourMap[orderHour] || 0) + orderValue;

        // Sales by category (optional)
        order.items.forEach(i => {
          const cat = menuItems.find(m => m.name === i.name)?.category || "Other";
          catMap[cat] = (catMap[cat] || 0) + i.price * i.quantity;
        });

        // KPIs
        if (orderDay === todayStr) todaySales += orderValue;
        if (orderDay >= weekStr) weekSales += orderValue;
        if (orderMonth === monthStr) monthSales += orderValue;
        totalValue += orderValue;
        tableSet.add(order.table);
        orderSizes.push(order.items.reduce((s, i) => s + i.quantity, 0));

        // Items sold
        order.items.forEach(i => {
          itemMap[i.name] = (itemMap[i.name] || 0) + i.quantity;
          totalItems += i.quantity;
        });

        // Combos (sorted item names as key)
        const comboKey = order.items.map(i => i.name).sort().join("+");
        if (comboKey) comboMap[comboKey] = (comboMap[comboKey] || 0) + 1;

        // Prep time (if available)
        if (order.preparationTime) prepTimes.push(order.preparationTime);
      });

      // Top/least items
      const sortedItems = Object.entries(itemMap).sort((a, b) => b[1] - a[1]);
      const topItem = sortedItems[0] ? { name: sortedItems[0][0], qty: sortedItems[0][1] } : null;
      const leastItems = sortedItems.slice(-3).map(([name, qty]) => ({ name, qty }));

      // Peak hour
      const peakHour = Object.entries(hourMap).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

      // Top combos
      const topCombos = Object.entries(comboMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([combo, count]) => ({ combo, count }));

      // Item/category analytics
      const itemAnalytics = sortedItems.map(([name, qty]) => ({
        name,
        qty,
        category: menuItems.find(m => m.name === name)?.category || "Other",
      }));

      setStats({
        todaySales,
        weekSales,
        monthSales,
        numOrders,
        avgOrderValue: numOrders ? Math.round(totalValue / numOrders) : 0,
        topItem,
        leastItems,
        activeTables: tableSet.size,
        peakHour,
        salesByDay: Object.entries(dayMap).map(([d, v]) => ({ day: d, value: v })),
        salesByHour: Object.entries(hourMap).map(([h, v]) => ({ hour: h, value: v })),
        catMap,
        orderVolume: Object.entries(dayMap).map(([d, v]) => ({ day: d, value: v })),
        avgPrepTime: prepTimes.length ? Math.round(prepTimes.reduce((a, b) => a + b, 0) / prepTimes.length) : 0,
        avgOrderSize: orderSizes.length ? Math.round(orderSizes.reduce((a, b) => a + b, 0) / orderSizes.length) : 0,
        topCombos,
        itemAnalytics,
      });
    });
  }, []);

  // Chart Data
  const lineData = {
    labels: stats.salesByDay.map(d => d.day),
    datasets: [
      {
        label: "Sales by Day",
        data: stats.salesByDay.map(d => d.value),
        fill: false,
        borderColor: "#007bff",
        backgroundColor: "#007bff",
        tension: 0.3,
      },
    ],
  };

  const barData = {
    labels: stats.salesByHour.map(h => h.hour),
    datasets: [
      {
        label: "Sales by Hour",
        data: stats.salesByHour.map(h => h.value),
        backgroundColor: "#28a745",
      },
    ],
  };

  const pieData = {
    labels: Object.keys(stats.catMap),
    datasets: [
      {
        label: "Category Revenue",
        data: Object.values(stats.catMap),
        backgroundColor: [
          "#007bff",
          "#28a745",
          "#ffc107",
          "#dc3545",
          "#6f42c1",
          "#fd7e14",
        ],
      },
    ],
  };

  return (
    <div className="d-flex" style={{ minHeight: "100vh" }}>
      <Sidebar />
      <main className="flex-grow-1 p-4 bg-light">
        <h1 className="mb-4">ADMIN DASHBOARD</h1>
        {/* Summary KPIs */}
        <div className="row mb-4">
          <div className="col-md-3 mb-3">
            <div className="card text-white bg-success h-100">
              <div className="card-body">
                <h6 className="card-title">Total Sales Today</h6>
                <h3 className="card-text">₹{stats.todaySales}</h3>
                <div className="small">This Week: ₹{stats.weekSales} | This Month: ₹{stats.monthSales}</div>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card text-white bg-primary h-100">
              <div className="card-body">
                <h6 className="card-title">Orders Placed</h6>
                <h3 className="card-text">{stats.numOrders}</h3>
                <div className="small">Avg. Order Value: ₹{stats.avgOrderValue}</div>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card text-white bg-info h-100">
              <div className="card-body">
                <h6 className="card-title">Top-Selling Item</h6>
                <h3 className="card-text">{stats.topItem ? `${stats.topItem.name} (${stats.topItem.qty})` : "N/A"}</h3>
                <div className="small">Least: {stats.leastItems.map(i => i.name).join(", ") || "N/A"}</div>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card text-white bg-warning h-100">
              <div className="card-body">
                <h6 className="card-title">Active Tables</h6>
                <h3 className="card-text">{stats.activeTables}</h3>
                <div className="small">Peak Hour: {stats.peakHour || "N/A"}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Breakdown & Order Metrics */}
        <div className="row mb-4">
          <div className="col-md-6 mb-3">
            <div className="card h-100">
              <div className="card-body">
                <h6 className="card-title">Sales by Day</h6>
                <Line data={lineData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
              </div>
            </div>
          </div>
          <div className="col-md-6 mb-3">
            <div className="card h-100">
              <div className="card-body">
                <h6 className="card-title">Sales by Hour</h6>
                <Bar data={barData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
              </div>
            </div>
          </div>
        </div>
        <div className="row mb-4">
          <div className="col-md-6 mb-3">
            <div className="card h-100">
              <div className="card-body" style={{height:'500px', width:'500px'}}>
                <h6 className="card-title">Category-wise Revenue</h6>
                <Pie data={pieData} options={{ responsive: true, maintainAspectRatio:false}} />
              </div>
            </div>
          </div>
          <div className="col-md-6 mb-3">
            <div className="card h-100">
              <div className="card-body">
                <h6 className="card-title">Top Combos</h6>
                <ul className="mb-0 ps-3">
                  {stats.topCombos.length === 0 ? (
                    <li className="text-muted">No data</li>
                  ) : (
                    stats.topCombos.map((combo, idx) => (
                      <li key={idx}>
                        {combo.combo} <span className="fw-bold">({combo.count})</span>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Metrics */}
        <div className="row mb-4">
          <div className="col-md-4 mb-3">
            <div className="card h-100">
              <div className="card-body">
                <h6 className="card-title">Average Preparation Time</h6>
                <h3 className="card-text">{stats.avgPrepTime} min</h3>
                <div className="small">Avg. Order Size: {stats.avgOrderSize}</div>
              </div>
            </div>
          </div>
          <div className="col-md-4 mb-3">
            <div className="card h-100">
              <div className="card-body">
                <h6 className="card-title">Top-Selling Items</h6>
                <ul className="mb-0 ps-3">
                  {stats.itemAnalytics.slice(0, 3).map((item, idx) => (
                    <li key={idx}>{item.name} ({item.qty})</li>
                  ))}
                </ul>
                <h6 className="card-title mt-3">Least-Selling Items</h6>
                <ul className="mb-0 ps-3">
                  {stats.itemAnalytics.slice(-3).map((item, idx) => (
                    <li key={idx}>{item.name} ({item.qty})</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <div className="col-md-4 mb-3">
            <div className="card h-100">
              <div className="card-body">
                <h6 className="card-title">Item-wise Analytics</h6>
                <div style={{ maxHeight: 120, overflowY: "auto" }}>
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Category</th>
                        <th>Sold</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.itemAnalytics.map((item, idx) => (
                        <tr key={idx}>
                          <td>{item.name}</td>
                          <td>{item.category}</td>
                          <td>{item.qty}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="card mb-3">
          <div className="card-body">
            <h5 className="card-title">Welcome, Admin!</h5>
            <p className="card-text">
              Use the sidebar to navigate between different admin features.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
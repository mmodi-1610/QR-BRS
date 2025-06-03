import Sidebar from "@/components/Sidebar";

export default function AdminDashboard() {
  return (
    <div className="d-flex" style={{ minHeight: "100vh" }}>
      <Sidebar />
      <main className="flex-grow-1 p-4 bg-light">
        <h1 className="mb-4">ADMIN DASHBOARD</h1>
        <div className="card mb-3">
          <div className="card-body">
            <h5 className="card-title">Welcome, Admin!</h5>
            <p className="card-text">
              Use the sidebar to navigate between different admin features.
            </p>
          </div>
        </div>
        {/* Add more admin widgets or stats here */}
      </main>
    </div>
  );
}
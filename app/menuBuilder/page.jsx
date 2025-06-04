"use client";
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";

const initialCategories = [
  { name: "Starters" },
  { name: "Main" },
  { name: "Dessert" },
  { name: "Drinks" },
];

async function uploadToCloudinary(file, folderName) {
  const data = new FormData();
  data.append("file", file);
  data.append("upload_preset", "restaurant_menus");
  data.append("folder", folderName);

  const res = await fetch(
    "https://api.cloudinary.com/v1_1/do4hjohpl/image/upload",
    {
      method: "POST",
      body: data,
    }
  );
  const json = await res.json();
  return json.secure_url;
}

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

export default function MenuBuilder() {
  const [categories, setCategories] = useState(initialCategories);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    name: "",
    category: "",
    veg: "veg",
    spice: "mild",
    price: "",
    description: "",
    photo: null,
    photoPreview: null,
  });

  const [editingIndex, setEditingIndex] = useState(null);
  const [newCategory, setNewCategory] = useState("");

  // Fetch menu on mount
  useEffect(() => {
    async function fetchMenu() {
      try {
        const res = await fetch("/api/menu");
        const data = await res.json();
        if (data.success && data.menu) {
          setCategories(
            data.menu.categories.length > 0
              ? data.menu.categories
              : initialCategories
          );
          setItems(data.menu.items || []);
        }
      } catch (err) {
        // Optionally handle error
      }
    }
    fetchMenu();
  }, []);

  // Category handlers
  const handleAddCategory = () => {
    if (newCategory && !categories.find((c) => c.name === newCategory)) {
      setCategories([...categories, { name: newCategory }]);
      setNewCategory("");
    }
  };
  const handleDeleteCategory = (name) => {
    setCategories(categories.filter((c) => c.name !== name));
    setItems(items.filter((item) => item.category !== name));
  };

  // Item handlers
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "photo" && files && files[0]) {
      const file = files[0];
      setForm((prev) => ({
        ...prev,
        photo: file,
        photoPreview: URL.createObjectURL(file),
      }));
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleAddOrEditItem = async (e) => {
    e.preventDefault();
    if (!form.name || !form.category || !form.price) return;

    const userId = getUserIdFromToken() || "default_restaurant";

    let imageUrl = form.photoPreview;
    if (form.photo && form.photo instanceof File) {
      imageUrl = await uploadToCloudinary(
        form.photo,
        `restaurant_menus/${userId}`
      );
    }
    const itemData = {
      ...form,
      photo: imageUrl,
    };

    if (editingIndex !== null) {
      const updated = [...items];
      updated[editingIndex] = itemData;
      setItems(updated);
      setEditingIndex(null);
    } else {
      setItems([...items, itemData]);
    }
    setForm({
      name: "",
      category: "",
      veg: "veg",
      spice: "mild",
      price: "",
      description: "",
      photo: null,
      photoPreview: null,
    });
  };

  const handleEditItem = (idx) => {
    setForm(items[idx]);
    setEditingIndex(idx);
  };
  const handleDeleteItem = (idx) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleSaveMenu = async () => {
    try {
      const res = await fetch("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, categories }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Menu saved!");
      } else {
        alert("Failed to save menu: " + data.message);
      }
    } catch (err) {
      alert("Error saving menu.");
    }
  };

  return (
    <div className="d-flex" style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <Sidebar />
      <main className="flex-grow-1 p-4">
        <div className="container-fluid">
          <h1 className="mb-4 fw-bold text-primary">Menu Builder</h1>

          {/* Category Management */}
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-white border-bottom-0">
              <h5 className="mb-0 fw-semibold">Categories</h5>
            </div>
            <div className="card-body">
              <div className="d-flex mb-3">
                <input
                  type="text"
                  className="form-control me-2"
                  placeholder="Add new category"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                />
                <button className="btn btn-success" onClick={handleAddCategory}>
                  <i className="bi bi-plus-circle me-1"></i>Add
                </button>
              </div>
              <ul className="list-group list-group-flush">
                {categories.map((cat, idx) => (
                  <li
                    key={cat.name}
                    className="list-group-item d-flex justify-content-between align-items-center"
                  >
                    <span className="fw-medium">{cat.name}</span>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDeleteCategory(cat.name)}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Food Item Form */}
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-white border-bottom-0">
              <h5 className="mb-0 fw-semibold">
                {editingIndex !== null ? "Edit Item" : "Add Item"}
              </h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleAddOrEditItem} className="row g-3 align-items-end">
                <div className="col-md-3">
                  <label className="form-label fw-medium">Food Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    placeholder="Food Name"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-medium">Category</label>
                  <select
                    className="form-select"
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.name} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2">
                  <label className="form-label fw-medium">Type</label>
                  <select
                    className="form-select"
                    name="veg"
                    value={form.veg}
                    onChange={handleChange}
                  >
                    <option value="veg">Veg</option>
                    <option value="nonveg">Non-Veg</option>
                  </select>
                </div>
                <div className="col-md-2">
                  <label className="form-label fw-medium">Spice Level</label>
                  <select
                    className="form-select"
                    name="spice"
                    value={form.spice}
                    onChange={handleChange}
                  >
                    <option value="mild">Mild</option>
                    <option value="medium">Medium</option>
                    <option value="spicy">Spicy</option>
                  </select>
                </div>
                <div className="col-md-2">
                  <label className="form-label fw-medium">Price (₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    name="price"
                    placeholder="Price"
                    value={form.price}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-medium">Description</label>
                  <textarea
                    className="form-control"
                    name="description"
                    placeholder="Description"
                    value={form.description || ""}
                    onChange={handleChange}
                    rows={2}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-medium">Photo</label>
                  <input
                    type="file"
                    className="form-control"
                    name="photo"
                    accept="image/*"
                    onChange={handleChange}
                  />
                  {form.photoPreview && (
                    <img
                      src={form.photoPreview}
                      alt="Preview"
                      style={{
                        width: 70,
                        height: 70,
                        objectFit: "cover",
                        marginTop: 8,
                        borderRadius: 8,
                        border: "1px solid #dee2e6",
                      }}
                    />
                  )}
                </div>
                <div className="col-12">
                  <button className="btn btn-primary" type="submit">
                    <i className={`bi ${editingIndex !== null ? "bi-pencil-square" : "bi-plus-circle"} me-1`}></i>
                    {editingIndex !== null ? "Update Item" : "Add Item"}
                  </button>
                  {editingIndex !== null && (
                    <button
                      className="btn btn-secondary ms-2"
                      type="button"
                      onClick={() => {
                        setForm({
                          name: "",
                          category: "",
                          veg: "veg",
                          spice: "mild",
                          price: "",
                          description: "",
                          photo: null,
                          photoPreview: null,
                        });
                        setEditingIndex(null);
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          <div className="d-flex justify-content-end mb-3">
            <button className="btn btn-success px-4 py-2 fw-semibold shadow-sm" onClick={handleSaveMenu}>
              <i className="bi bi-save me-2"></i>Save Menu
            </button>
          </div>

          {/* Menu Items List */}
          <div className="card shadow-sm">
            <div className="card-header bg-white border-bottom-0">
              <h5 className="mb-0 fw-semibold">Menu Items</h5>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Veg/Non-Veg</th>
                      <th>Spice Level</th>
                      <th>Price</th>
                      <th>Description</th>
                      <th>Photo</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="fw-medium">{item.name}</td>
                        <td>{item.category}</td>
                        <td>
                          <span className={`badge ${item.veg === "veg" ? "bg-success" : "bg-danger"}`}>
                            {item.veg === "veg" ? "Veg" : "Non-Veg"}
                          </span>
                        </td>
                        <td>
                          <span className={`badge 
                            ${item.spice === "mild" ? "bg-secondary" : item.spice === "medium" ? "bg-warning text-dark" : "bg-danger"}`}>
                            {item.spice.charAt(0).toUpperCase() + item.spice.slice(1)}
                          </span>
                        </td>
                        <td>₹{item.price}</td>
                        <td style={{ maxWidth: 180, whiteSpace: "pre-line" }}>{item.description}</td>
                        <td>
                          {item.photo && (
                            <img
                              src={item.photo}
                              alt="Item"
                              style={{
                                width: 50,
                                height: 50,
                                objectFit: "cover",
                                borderRadius: 6,
                                border: "1px solid #dee2e6",
                              }}
                            />
                          )}
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-primary me-2"
                            onClick={() => handleEditItem(idx)}
                          >
                            <i className="bi bi-pencil-square"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeleteItem(idx)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {items.length === 0 && (
                      <tr>
                        <td colSpan={8} className="text-center text-muted py-4">
                          No items added yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

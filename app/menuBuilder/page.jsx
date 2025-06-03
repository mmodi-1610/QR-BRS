"use client";
import { useState,useEffect } from "react";
import Sidebar from "@/components/Sidebar";
const initialCategories = [
  { name: "Starters" },
  { name: "Main" },
  { name: "Dessert" },
  { name: "Drinks" },
];

export default function MenuBuilder() {
  const [categories, setCategories] = useState(initialCategories);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    name: "",
    category: "",
    veg: "veg",
    spice: "mild",
    price: "",
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
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleAddOrEditItem = (e) => {
    e.preventDefault();
    if (!form.name || !form.category || !form.price) return;
    if (editingIndex !== null) {
      const updated = [...items];
      updated[editingIndex] = { ...form };
      setItems(updated);
      setEditingIndex(null);
    } else {
      setItems([...items, { ...form }]);
    }
    setForm({ name: "", category: "", veg: "veg", spice: "mild", price: "" });
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
    <div className="container py-4">
      <Sidebar />
      <h1 className="mb-4">MENU BUILDER</h1>

      {/* Category Management */}
      <div className="mb-4">
        <h4>Categories</h4>
        <div className="d-flex mb-2">
          <input
            type="text"
            className="form-control me-2"
            placeholder="Add new category"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          />
          <button className="btn btn-primary" onClick={handleAddCategory}>
            Add Category
          </button>
        </div>
        <ul className="list-group">
          {categories.map((cat, idx) => (
            <li
              key={cat.name}
              className="list-group-item d-flex justify-content-between align-items-center"
            >
              {cat.name}
              <button
                className="btn btn-sm btn-danger"
                onClick={() => handleDeleteCategory(cat.name)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Food Item Form */}
      <div className="mb-4">
        <h4>{editingIndex !== null ? "Edit Item" : "Add Item"}</h4>
        <form onSubmit={handleAddOrEditItem} className="row g-3">
          <div className="col-md-3">
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
          <div className="col-12">
            <button className="btn btn-success" type="submit">
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

      <button className="btn btn-primary mb-3" onClick={handleSaveMenu}>
        Save Menu
      </button>

      {/* Menu Items List */}
      <div>
        <h4>Menu Items</h4>
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Veg/Non-Veg</th>
              <th>Spice Level</th>
              <th>Price</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx}>
                <td>{item.name}</td>
                <td>{item.category}</td>
                <td>{item.veg === "veg" ? "Veg" : "Non-Veg"}</td>
                <td>{item.spice}</td>
                <td>₹{item.price}</td>
                <td>
                  <button
                    className="btn btn-sm btn-primary me-2"
                    onClick={() => handleEditItem(idx)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDeleteItem(idx)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center">
                  No items added yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// export default function menuBuilder(){
//     return(
//         <h1>MENU BUILDER</h1>
//     )
// }

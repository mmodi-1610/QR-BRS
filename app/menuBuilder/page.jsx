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
        console.error("Failed to fetch menu:", err);
      }
    }
    fetchMenu();
  }, []);

  const handleAddCategory = () => {
    if (
      newCategory.trim() &&
      !categories.find((c) => c.name.toLowerCase() === newCategory.trim().toLowerCase())
    ) {
      setCategories([...categories, { name: newCategory.trim() }]);
      setNewCategory("");
    }
  };

  const handleDeleteCategory = (name) => {
    setCategories(categories.filter((c) => c.name !== name));
    setItems(items.filter((item) => item.category !== name));
  };

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
      imageUrl = await uploadToCloudinary(form.photo, `restaurant_menus/${userId}`);
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
    <div className="flex min-h-screen bg-gradient-to-r from-indigo-50 to-white text-gray-800">
      <Sidebar />

      <main className="flex-grow p-8 overflow-auto max-w-[1400px] mx-auto">
        <h1 className="mb-8 text-4xl font-extrabold text-indigo-700 tracking-tight drop-shadow-sm">
          Menu Builder
        </h1>

        {/* Categories Section */}
        <section className="mb-8 bg-white rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-5 text-indigo-600">Categories</h2>
          <div className="flex gap-3 mb-6 max-w-md">
            <input
              type="text"
              className="flex-grow border border-indigo-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
              placeholder="Add new category"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />
            <button
              className="bg-indigo-600 text-white px-6 rounded-lg hover:bg-indigo-700 transition shadow-md"
              onClick={handleAddCategory}
              type="button"
            >
              Add
            </button>
          </div>
          <ul className="divide-y divide-indigo-100 max-w-md rounded-md border border-indigo-100">
            {categories.map((cat) => (
              <li
                key={cat.name}
                className="flex justify-between items-center py-3 px-5 hover:bg-indigo-50 transition cursor-default select-none"
              >
                <span className="font-semibold text-indigo-700">{cat.name}</span>
                <button
                  className="text-red-500 hover:text-red-700 text-xl font-bold"
                  onClick={() => handleDeleteCategory(cat.name)}
                  type="button"
                  aria-label={`Delete category ${cat.name}`}
                >
                  &times;
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* Food Item Form */}
        <section className="mb-10 bg-white rounded-xl shadow-md p-6 max-w-5xl">
          <h2 className="text-2xl font-semibold mb-6 text-indigo-600">
            {editingIndex !== null ? "Edit Item" : "Add Item"}
          </h2>
          <form
            onSubmit={handleAddOrEditItem}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end"
          >
            <div>
              <label className="block mb-2 font-semibold text-indigo-800">Food Name</label>
              <input
                type="text"
                name="name"
                className="w-full border border-indigo-300 rounded-lg px-4 py-3 placeholder-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                placeholder="Food Name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="block mb-2 font-semibold text-indigo-800">Category</label>
              <select
                name="category"
                className="w-full border border-indigo-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                value={form.category}
                onChange={handleChange}
                required
              >
                <option value="" disabled>
                  Select Category
                </option>
                {categories.map((cat) => (
                  <option key={cat.name} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2 font-semibold text-indigo-800">Type</label>
              <select
                name="veg"
                className="w-full border border-indigo-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                value={form.veg}
                onChange={handleChange}
              >
                <option value="veg">Veg</option>
                <option value="nonveg">Non-Veg</option>
              </select>
            </div>

            <div>
              <label className="block mb-2 font-semibold text-indigo-800">Spice Level</label>
              <select
                name="spice"
                className="w-full border border-indigo-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                value={form.spice}
                onChange={handleChange}
              >
                <option value="mild">Mild</option>
                <option value="medium">Medium</option>
                <option value="spicy">Spicy</option>
              </select>
            </div>

            <div>
              <label className="block mb-2 font-semibold text-indigo-800">Price (₹)</label>
              <input
                type="number"
                name="price"
                className="w-full border border-indigo-300 rounded-lg px-4 py-3 placeholder-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                placeholder="Price"
                value={form.price}
                onChange={handleChange}
                required
                min={0}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block mb-2 font-semibold text-indigo-800">Description</label>
              <textarea
                name="description"
                className="w-full border border-indigo-300 rounded-lg px-4 py-3 resize-none placeholder-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                placeholder="Description"
                value={form.description || ""}
                onChange={handleChange}
                rows={3}
              />
            </div>

            <div>
              <label className="block mb-2 font-semibold text-indigo-800">Photo</label>
              <input
                type="file"
                name="photo"
                accept="image/*"
                onChange={handleChange}
                className="w-full text-indigo-700"
              />
              {form.photoPreview && (
                <img
                  src={form.photoPreview}
                  alt="Preview"
                  className="mt-3 w-20 h-20 object-cover rounded-lg border border-indigo-300 shadow-sm"
                />
              )}
            </div>

            <div className="flex items-center gap-4">
              <button
                type="submit"
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg shadow hover:bg-indigo-700 transition"
              >
                {editingIndex !== null ? "Update Item" : "Add Item"}
              </button>
              {editingIndex !== null && (
                <button
                  type="button"
                  className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition"
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
        </section>

        <div className="flex justify-end mb-8">
          <button
            className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition shadow-lg"
            onClick={handleSaveMenu}
            type="button"
          >
            Save Menu
          </button>
        </div>

        {/* Menu Items List */}
        <section className="bg-white rounded-xl shadow-md p-6 overflow-x-auto">
          <h2 className="text-2xl font-semibold mb-6 text-indigo-600">Menu Items</h2>
          <table className="w-full table-auto border-collapse border border-indigo-200 rounded-md">
            <thead className="bg-indigo-50 rounded-t-md">
              <tr>
                {[
                  "Name",
                  "Category",
                  "Veg/Non-Veg",
                  "Spice Level",
                  "Price",
                  "Description",
                  "Photo",
                  "Actions",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="border border-indigo-200 px-4 py-3 text-left text-indigo-700 font-semibold select-none"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.length > 0 ? (
                items.map((item, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-indigo-50 transition cursor-default"
                  >
                    <td className="border border-indigo-200 px-4 py-2 font-medium">{item.name}</td>
                    <td className="border border-indigo-200 px-4 py-2">{item.category}</td>
                    <td className="border border-indigo-200 px-4 py-2">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-white text-xs font-semibold ${
                          item.veg === "veg" ? "bg-green-600" : "bg-red-600"
                        }`}
                      >
                        {item.veg === "veg" ? "Veg" : "Non-Veg"}
                      </span>
                    </td>
                    <td className="border border-indigo-200 px-4 py-2">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          item.spice === "mild"
                            ? "bg-gray-500 text-white"
                            : item.spice === "medium"
                            ? "bg-yellow-400 text-black"
                            : "bg-red-600 text-white"
                        }`}
                      >
                        {item.spice.charAt(0).toUpperCase() + item.spice.slice(1)}
                      </span>
                    </td>
                    <td className="border border-indigo-200 px-4 py-2">₹{item.price}</td>
                    <td className="border border-indigo-200 px-4 py-2 max-w-xs break-words whitespace-pre-wrap">
                      {item.description}
                    </td>
                    <td className="border border-indigo-200 px-4 py-2">
                      {item.photo && (
                        <img
                          src={item.photo}
                          alt="Item"
                          className="w-16 h-16 object-cover rounded-lg border border-indigo-300 shadow-sm"
                        />
                      )}
                    </td>
                    <td className="border border-indigo-200 px-4 py-2 whitespace-nowrap flex gap-3">
                      <button
                        className="text-indigo-600 hover:text-indigo-900 transition text-xl"
                        onClick={() => handleEditItem(idx)}
                        type="button"
                        aria-label={`Edit ${item.name}`}
                      >
                        ✏️
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900 transition text-xl"
                        onClick={() => handleDeleteItem(idx)}
                        type="button"
                        aria-label={`Delete ${item.name}`}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center text-indigo-300 py-10 select-none"
                  >
                    No items added yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}

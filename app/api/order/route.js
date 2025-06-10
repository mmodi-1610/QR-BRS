import { NextResponse } from "next/server";
import mongoose from "mongoose";
// import Sidebar from "@/components/Sidebar";
import Order from "@/models/Order"; // You'll need to create this model
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

export async function POST(request) {
  try {
    const { restaurantId, table, items } = await request.json();

    if (!restaurantId || !table || !items || !Array.isArray(items)) {
      return NextResponse.json({ success: false, message: "Missing fields" }, { status: 400 });
    }

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    const order = await Order.create({
      restaurant: restaurantId,
      table,
      items,
      status: "pending",
      createdAt: new Date(),
    });

    if (global.io) {
      global.io.emit("order:new", order);
    }

    return NextResponse.json({ success: true, order });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// Get all orders (admin)
export async function GET(request) {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    // Get token from request cookies (server-side)
    const token = request.cookies.get("token")?.value;
    let restaurantId = null;
    if (token) {
      try {
        const decoded = jwtDecode(token);
        restaurantId = decoded.userId;
      } catch {
        restaurantId = null;
      }
    }

    let query = {};
    if (restaurantId) {
      query.restaurant = restaurantId;
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, orders });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}


export async function PATCH(request) {
  try {
    const { ids, status } = await request.json();
    if (!ids || !Array.isArray(ids) || !status) {
      return NextResponse.json({ success: false, message: "Missing ids or status" }, { status: 400 });
    }

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    await Order.updateMany(
      { _id: { $in: ids } },
      { $set: { status } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Order from "@/models/Order"; // You'll need to create this model

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

    return NextResponse.json({ success: true, order });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
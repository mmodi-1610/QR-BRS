import clientPromise from "@/lib/mongodb";

export async function GET(request) {
  const searchParams = request.nextUrl.searchParams;
  const restaurantId = searchParams.get("restaurantId");
  const table = searchParams.get("table");

  if (!restaurantId || !table) {
    return new Response(JSON.stringify({ error: "Missing restaurantId or table" }), { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const orders = await db
      .collection("orders")
      .find({
        restaurantId,
        table,
        status: { $in: ["pending", "served"] },
      })
      .sort({ createdAt: 1 })
      .toArray();

    return new Response(JSON.stringify({ orders }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}
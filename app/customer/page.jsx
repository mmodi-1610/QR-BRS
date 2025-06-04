// "use client";
// import { useEffect, useState } from "react";
// import { useSearchParams } from "next/navigation";

// export default function CustomerPage() {
//   const searchParams = useSearchParams();
//   const restaurantId = searchParams.get("restaurant");
//   const table = searchParams.get("table");
//   const [menu, setMenu] = useState(null);
//   const [cart, setCart] = useState([]);

//   useEffect(() => {
//     if (restaurantId) {
//       fetch(`/api/menu?restaurantId=${restaurantId}`)
//         .then(res => res.json())
//         .then(data => setMenu(data.menu));
//     }
//   }, [restaurantId]);

//   const addToCart = (item) => {
//     setCart([...cart, { ...item, quantity: 1 }]);
//   };

//   const placeOrder = async () => {
//     await fetch("/api/order", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         restaurantId,
//         table,
//         items: cart,
//       }),
//     });
//     alert("Order placed!");
//     setCart([]);
//   };

//   if (!restaurantId || !table) {
//     return <div className="container py-5 text-center">Invalid QR code.</div>;
//   }

//   return (
//     <div className="container py-4">
//       <h2 className="mb-3">Menu</h2>
//       {menu ? (
//         <>
//           <div className="row">
//             {menu.items.map((item, idx) => (
//               <div className="col-md-4 mb-4" key={idx}>
//                 <div className="card h-100">
//                   {item.photo && (
//                     <img src={item.photo} className="card-img-top" alt={item.name} style={{ objectFit: "cover", height: 180 }} />
//                   )}
//                   <div className="card-body">
//                     <h5 className="card-title">{item.name}</h5>
//                     <p className="card-text">{item.description}</p>
//                     <div className="mb-2">
//                       <span className={`badge ${item.veg === "veg" ? "bg-success" : "bg-danger"} me-2`}>
//                         {item.veg === "veg" ? "Veg" : "Non-Veg"}
//                       </span>
//                       <span className="badge bg-secondary">{item.spice}</span>
//                     </div>
//                     <div className="fw-bold mb-2">₹{item.price}</div>
//                     <button className="btn btn-primary w-100" onClick={() => addToCart(item)}>
//                       Add to Cart
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//           <hr />
//           <h4>Your Order</h4>
//           {cart.length === 0 ? (
//             <div className="text-muted">No items in cart.</div>
//           ) : (
//             <ul className="list-group mb-3">
//               {cart.map((item, idx) => (
//                 <li className="list-group-item d-flex justify-content-between align-items-center" key={idx}>
//                   {item.name} <span className="badge bg-primary rounded-pill">{item.quantity}</span>
//                 </li>
//               ))}
//             </ul>
//           )}
//           <button className="btn btn-success" disabled={cart.length === 0} onClick={placeOrder}>
//             Place Order
//           </button>
//         </>
//       ) : (
//         <div>Loading menu...</div>
//       )}
//     </div>
//   );
// }

"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function CustomerPageInner() {
  const searchParams = useSearchParams();
  const restaurantId = searchParams.get("restaurant");
  const table = searchParams.get("table");
  const [menu, setMenu] = useState(null);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    if (restaurantId) {
      fetch(`/api/menu?restaurantId=${restaurantId}`)
        .then(res => res.json())
        .then(data => setMenu(data.menu));
    }
  }, [restaurantId]);

  const addToCart = (item) => {
    setCart([...cart, { ...item, quantity: 1 }]);
  };

  const placeOrder = async () => {
    await fetch("/api/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restaurantId,
        table,
        items: cart,
      }),
    });
    alert("Order placed!");
    setCart([]);
  };

  if (!restaurantId || !table) {
    return <div className="container py-5 text-center">Invalid QR code.</div>;
  }

  return (
    <div className="container py-4">
      <h2 className="mb-3">Menu</h2>
      {menu ? (
        <>
          <div className="row">
            {menu.items.map((item, idx) => (
              <div className="col-md-4 mb-4" key={idx}>
                <div className="card h-100">
                  {item.photo && (
                    <img src={item.photo} className="card-img-top" alt={item.name} style={{ objectFit: "cover", height: 180 }} />
                  )}
                  <div className="card-body">
                    <h5 className="card-title">{item.name}</h5>
                    <p className="card-text">{item.description}</p>
                    <div className="mb-2">
                      <span className={`badge ${item.veg === "veg" ? "bg-success" : "bg-danger"} me-2`}>
                        {item.veg === "veg" ? "Veg" : "Non-Veg"}
                      </span>
                      <span className="badge bg-secondary">{item.spice}</span>
                    </div>
                    <div className="fw-bold mb-2">₹{item.price}</div>
                    <button className="btn btn-primary w-100" onClick={() => addToCart(item)}>
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <hr />
          <h4>Your Order</h4>
          {cart.length === 0 ? (
            <div className="text-muted">No items in cart.</div>
          ) : (
            <ul className="list-group mb-3">
              {cart.map((item, idx) => (
                <li className="list-group-item d-flex justify-content-between align-items-center" key={idx}>
                  {item.name} <span className="badge bg-primary rounded-pill">{item.quantity}</span>
                </li>
              ))}
            </ul>
          )}
          <button className="btn btn-success" disabled={cart.length === 0} onClick={placeOrder}>
            Place Order
          </button>
        </>
      ) : (
        <div>Loading menu...</div>
      )}
    </div>
  );
}

export default function CustomerPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CustomerPageInner />
    </Suspense>
  );
}
document.addEventListener("DOMContentLoaded", async () => {
  const productContainer = document.getElementById("product-container");
  const cartContainer = document.getElementById("cart-container");
  const cartTotalEl = document.getElementById("cart-total");
  const clearCartBtn = document.getElementById("clear-cart-btn");
  const cartModal = document.getElementById("cart-modal");
  const openCartBtn = document.getElementById("open-cart");
  const closeCartBtn = document.getElementById("close-cart");

  let products = [];

  openCartBtn.onclick = () => cartModal.classList.remove("hidden");
  closeCartBtn.onclick = () => cartModal.classList.add("hidden");

  async function fetchProducts() {
    try {
      const response = await fetch("http://localhost:1337/api/products/?populate=*");
      const data = await response.json();

      if (data?.data?.length > 0) {
        displayProducts(data.data);
      } else {
        productContainer.innerHTML = "<p>No products available.</p>";
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      productContainer.innerHTML = "<p>Failed to load products.</p>";
    }
  }

  function displayProducts(fetchedProducts) {
    products = fetchedProducts;
    productContainer.innerHTML = "";

    products.forEach(({ id, Product_name, Discription, Price, Product_image }) => {
      const imageUrl = Product_image?.url
        ? `http://localhost:1337${Product_image.url}`
        : "https://picsum.photos/300/200?random=1";

      const card = document.createElement("div");
      card.classList.add("product-card");
      card.innerHTML = `
        <img src="${imageUrl}" alt="${Product_name}">
        <h3>${Product_name}</h3>
        <p>${Discription}</p>
        <p class="price">₹${Price}</p>
        <button onclick="addToCart(${id})">Add to Cart</button>
      `;
      productContainer.appendChild(card);
    });
  }

  window.addToCart = function (productId) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existing = cart.find(item => item.id === productId);
    if (existing) {
      existing.quantity += 1;
    } else {
      const imageUrl = product.Product_image?.url
        ? `http://localhost:1337${product.Product_image.url}`
        : "https://picsum.photos/300/200?random=1";

      cart.push({
        id: product.id,
        name: product.Product_name,
        price: product.Price,
        image: imageUrl,
        quantity: 1
      });
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    loadCart();
    alert("Product added to cart!");
  };

  function loadCart() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    cartContainer.innerHTML = "";
    let total = 0;

    if (cart.length === 0) {
      cartContainer.innerHTML = "<p>Your cart is empty.</p>";
    }

    cart.forEach(({ id, name, price, image, quantity }) => {
      total += price * quantity;
      const div = document.createElement("div");
      div.classList.add("product-card");
      div.innerHTML = `
        <img src="${image}" alt="${name}" />
        <h3>${name}</h3>
        <p>Price: ₹${price}</p>
        <div class="quantity-controls">
          <button onclick="decreaseQuantity(${id})">-</button>
          <span>${quantity}</span>
          <button onclick="increaseQuantity(${id})">+</button>
        </div>
        <p class="price">Subtotal: ₹${price * quantity}</p>
        <button onclick="removeFromCart(${id})">Remove</button>
      `;
      cartContainer.appendChild(div);
    });

    cartTotalEl.textContent = `Total: ₹${total}`;
  }

  window.increaseQuantity = function (id) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    const item = cart.find(p => p.id === id);
    if (item) item.quantity += 1;
    localStorage.setItem("cart", JSON.stringify(cart));
    loadCart();
  };

  window.decreaseQuantity = function (id) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    const index = cart.findIndex(p => p.id === id);
    if (cart[index].quantity > 1) {
      cart[index].quantity -= 1;
    } else {
      cart.splice(index, 1);
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    loadCart();
  };

  window.removeFromCart = function (id) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    cart = cart.filter(item => item.id !== id);
    localStorage.setItem("cart", JSON.stringify(cart));
    loadCart();
  };

  clearCartBtn.addEventListener("click", () => {
    if (confirm("Clear entire cart?")) {
      localStorage.removeItem("cart");
      loadCart();
    }
  });


  // Place Order
  async function placeOrder() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];

    if (cart.length === 0) {
      alert("🛒 Cart is empty!");
      return;
    }

    const userId = await getCurrentUserId();

    if (!userId) {
      alert("🔒 You need to log in to place an order.");
      return;
    }
    console.log(userId)

    const name = document.getElementById("order-name").value.trim();
    const email = document.getElementById("order-email").value.trim();
    const phone = document.getElementById("order-phone").value.trim();
    const address = document.getElementById("order-address").value.trim();
    const payment_info = document.getElementById("order-payment").value;

    if (!payment_info) {
      alert("❌ Please select a payment method.");
      return;
    }

    const amount = cart.reduce((total, item) => total + item.price * item.quantity, 0);
    const productIds = cart.map(item => item.id);
    const product_detail = cart.map(item => ({
      product: item.id,
      Quantity: String(item.quantity) // ✅ lowercase 'quantity'
    }));


    const orderData = {
      data: {
        Name: name,
        Email: email,
        Phone: parseInt(phone),
        Addresses: address,
        Pyment_info: payment_info,
        Amount: amount,
        Order_Status: "Pending",
        product_detail, // 👈 this matches your component name exactly
        user_id: String(userId),
      },
    };

    console.log("📦 Order Payload to Send:", JSON.stringify(orderData, null, 2));

    try {
      const res = await fetch("http://localhost:1337/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("jwt")}`,
        },
        body: JSON.stringify(orderData),
      });

      const data = await res.json();

      if (res.ok) {
        alert("✅ Order placed successfully!");
        localStorage.removeItem("cart");
        loadCart();
        document.getElementById("order-form").reset();
        window.location.href = "./successfull_order.html";
      } else {
        console.error("❌ Order error (from API):", data);
        alert("❌ Failed to place order.");
      }
    } catch (error) {
      console.error("❌ Error placing order:", error);
      alert("❌ An unexpected error occurred.");

    }
  }


  // Get User Orders
  async function getUserOrders() {
    const token = localStorage.getItem("jwt");
    if (!token) {
      alert("🔒 Please log in to view your orders.");
      return;
    }

    // Get current user ID
    const userId = await getCurrentUserId();
    if (!userId) {
      alert("❌ Failed to fetch user info.");
      return;
    }

    try {
      const res = await fetch("http://localhost:1337/api/orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      const allOrders = data?.data || [];

      // Filter orders by user_id (as text match)
      const userOrders = allOrders.filter(order => order.user_id == userId);

      if (userOrders.length === 0) {
        alert("📭 You have no orders yet.");
        return;
      }

      console.log("🧾 Your Orders:", userOrders);

      // 👉 Render somewhere (update as per your HTML)
      const userOrderContainer = document.getElementById("user-order-container");
      userOrderContainer.innerHTML = userOrders.map(order => `
      <div class="order-card">
        <h4>Order ID: ${order.id}</h4>
        <p><strong>Status:</strong> ${order.Order_Status}</p>
        <p><strong>Total:</strong> ₹${order.Amount}</p>
        <p><strong>Payment:</strong> ${order.Pyment_info}</p>
        <p><strong>Placed on:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
      </div>
    `).join("");

    } catch (err) {
      console.error("❌ Error fetching user orders:", err);
      alert("❌ Could not fetch orders.");
    }
  }


  async function getCurrentUserId() {
    const token = localStorage.getItem("jwt");
    if (!token) return null;

    const res = await fetch("http://localhost:1337/api/users/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const user = await res.json();
    return user.id;
  }

  window.placeOrder = placeOrder;

  fetchProducts();
  loadCart();
});

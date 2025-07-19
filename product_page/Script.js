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

  // Place Order Function
  async function placeOrder() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];

    if (cart.length === 0) {
      alert("🛒 Cart is empty!");
      return;
    }

    const payment_info = document.getElementById("order-payment").value;
    if (!payment_info) {
      alert("❌ Please select a payment method.");
      return;
    }

    if (payment_info === "Online") {
      openDummyPaymentModal(); // Show dummy modal
      return;
    }

    actuallyContinueOrder(); // Place order directly for COD
  }

  // After Dummy Payment Confirmation
  async function actuallyContinueOrder() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const userId = await getCurrentUserId();

    const name = document.getElementById("order-name").value.trim();
    const email = document.getElementById("order-email").value.trim();
    const phone = document.getElementById("order-phone").value.trim();
    const address = document.getElementById("order-address").value.trim();
    const payment_info = document.getElementById("order-payment").value;

    const amount = cart.reduce((total, item) => total + item.price * item.quantity, 0);
    const product_detail = cart.map(item => ({
      product: item.id,
      Quantity: String(item.quantity)
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
        product_detail,
        user_id: String(userId),
      },
    };

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

  function continueOrderAfterDummy() {
    closeDummyPayment();
    actuallyContinueOrder();
  }

  function openDummyPaymentModal() {
    const modal = document.getElementById("dummy-payment-modal");
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const amount = cart.reduce((total, item) => total + item.price * item.quantity, 0);
    document.getElementById("dummy-payment-amount").textContent = amount;
    modal.classList.remove("hidden");
  }

  function closeDummyPayment() {
    const modal = document.getElementById("dummy-payment-modal");
    if (modal) modal.classList.add("hidden");
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

  // Expose to global scope
  window.placeOrder = placeOrder;
  window.continueOrderAfterDummy = continueOrderAfterDummy;
  window.closeDummyPayment = closeDummyPayment;
  window.openDummyPaymentModal = openDummyPaymentModal;

  fetchProducts();
  loadCart();
});

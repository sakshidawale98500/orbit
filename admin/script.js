
document.addEventListener("DOMContentLoaded", () => {
    const adminContainer = document.getElementById("admin-product-container");
    const productForm = document.getElementById("product-form");
    const editForm = document.getElementById("edit-form");

    const token = localStorage.getItem("jwt");

    // 📦 Fetch all products from Strapi API and render them
    async function fetchProducts() {
        try {
            const res = await fetch("http://localhost:1337/api/products?populate=*");
            const data = await res.json();
            const products = data?.data;

            if (Array.isArray(products) && products.length > 0) {
                renderProducts(products);
            } else {
                adminContainer.innerHTML = "<p>No products available.</p>";
            }
        } catch (err) {
            console.error("Failed to fetch products", err);
            adminContainer.innerHTML = "<p>Error loading products.</p>";
        }
    }

    // 🎨 Render product cards in the admin container
    function renderProducts(products) {
        adminContainer.innerHTML = "";

        products.forEach(product => {
            const attributes = product;
            const { id, documentId, Product_name, Discription, Price, Product_image } = attributes;


            const imageUrl = Product_image?.url
                ? `http://localhost:1337${Product_image.url}`
                : "https://picsum.photos/300/200?random=1";

            const card = document.createElement("div");
            card.classList.add("product-card");

            card.innerHTML = `
        <img src="${imageUrl}" alt="${Product_name}" />
        <h3>${Product_name}</h3>
        <p>${Discription}</p>
        <p class="price">₹${Price}</p>
        <button onclick="editProduct('${documentId}')">✏️ Edit</button>
        <button onclick="deleteProduct('${documentId}')">🗑️ Delete</button>

      `;

            adminContainer.appendChild(card);
        });
    }

    // 📝 Handle the "Create Product" form submission
    productForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = document.getElementById("name").value.trim();
        const description = document.getElementById("description").value.trim();
        const price = document.getElementById("price").value;
        const productWeight = Number(document.getElementById("product-weight").value);
        const weight = document.getElementById("weight").value;
        const imageFile = document.getElementById("image").files[0];

        try {
            let imageId = null;

            // ✅ Upload image if exists
            if (imageFile) {
                const formData = new FormData();
                formData.append("files", imageFile);

                const uploadRes = await fetch("http://localhost:1337/api/upload", {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                });

                const uploadData = await uploadRes.json();

                if (!uploadRes.ok) {
                    console.error("Upload failed:", uploadData);
                    throw new Error("Image upload failed");
                }

                imageId = uploadData[0]?.id;
            }

            // ✅ Prepare final payload
            const payload = {
                data: {
                    Product_name: name,
                    Discription: description,
                    Price: price,
                    Product_weight: productWeight,
                    weight: weight,
                    Product_image: imageId
                    //orders: []  // ✅ Fix added here for relation field
                }
            };

            console.log("Product payload to send:", payload);

            // ✅ Create Product
            const res = await fetch("http://localhost:1337/api/products", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const resData = await res.json();

            if (res.ok) {
                alert("✅ Product created successfully!");
                productForm.reset();
                fetchProducts();
            } else {
                console.error("❌ Server Error:", resData);
                alert("❌ Failed to create product. See console for details.");
            }
        } catch (err) {
            console.error("❌ Error creating product:", err);
            alert("❌ Error while creating product.");
        }
    });


    // Edit product
    window.editProduct = async function (documentId) {
        console.log("🔍 Looking for product with documentId:", documentId);

        try {
            const res = await fetch(`http://localhost:1337/api/products?filters[documentId][$eq]=${documentId}&populate=*`);
            const data = await res.json();

            if (!data?.data || data.data.length === 0) {
                console.error("❌ No product found for documentId");
                alert("❌ Product not found.");
                return;
            }

            const product = data.data[0];

            // 🔧 Populate edit modal with direct values
            document.getElementById("edit-id").value = product.documentId;
            document.getElementById("edit-name").value = product.Product_name || "";
            document.getElementById("edit-description").value = product.Discription || "";
            document.getElementById("edit-price").value = product.Price || "";
            document.getElementById("edit-product-weight").value = product.Product_weight || "";
            document.getElementById("edit-weight").value = product.weight || "";

            // 🪟 Show modal
            document.getElementById("editModal").classList.remove("hidden");

        } catch (err) {
            console.error("❌ Edit fetch error:", err);
            alert("❌ Failed to load product for edit.");
        }
    };


    // ❌ Close modal

    window.closeEditModal = function () {
        document.getElementById("editModal").classList.add("hidden");
    };

    // 💾 Handle edit submission
    editForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const id = document.getElementById("edit-id").value; // numeric ID
        const name = document.getElementById("edit-name").value.trim();
        const description = document.getElementById("edit-description").value.trim();
        const price = document.getElementById("edit-price").value;
        const productWeight = Number(document.getElementById("edit-product-weight").value);
        const weight = document.getElementById("edit-weight").value;
        const imageFile = document.getElementById("edit-image").files[0];

        try {
            let imageId = null;

            if (imageFile) {
                const formData = new FormData();
                formData.append("files", imageFile);

                const uploadRes = await fetch("http://localhost:1337/api/upload", {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                });

                const uploadData = await uploadRes.json();
                if (!uploadRes.ok) throw new Error("Image upload failed");

                imageId = uploadData[0]?.id;
            }

            const payload = {
                data: {
                    Product_name: name,
                    Discription: description,
                    Price: price,
                    Product_weight: productWeight,
                    weight: weight,
                },
            };

            if (imageId) payload.data.Product_image = imageId;

            const res = await fetch(`http://localhost:1337/api/products/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const resData = await res.json();

            if (res.ok) {
                alert("✅ Product updated successfully!");
                closeEditModal();
                fetchProducts();
            } else {
                console.error("❌ Update Error:", resData);
                alert("❌ Failed to update product.");
            }
        } catch (err) {
            console.error("❌ Update Exception:", err);
            alert("❌ Error while updating product.");
        }
    });


    // 🗑️ Delete product by numeric id
    window.deleteProduct = async function (documentId) {

        const confirmDelete = confirm("Are you sure you want to delete this product?");
        if (!confirmDelete) return;

        try {
            const fetchRes = await fetch(`http://localhost:1337/api/products?filters[documentId][$eq]=${documentId}`);
            const fetchData = await fetchRes.json();
            const productId = fetchData.data[0].documentId;

            // 🗑️ Delete using numeric ID
            const deleteRes = await fetch(`http://localhost:1337/api/products/${productId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (deleteRes.status === 204) {
                alert("🗑️ Product deleted successfully!");
                fetchProducts(); // Refresh product list
            } else {
                const errorData = await deleteRes.json();
                console.error("❌ Delete failed:", errorData);
                alert("❌ Failed to delete product.");
            }
        } catch (err) {
            console.error("❌ Delete Exception:", err);
            alert("❌ Error while deleting product.");
        }
    };


    // 🧾 Fetch all orders from Strapi API and render them
    async function fetchOrders() {
        const orderContainer = document.getElementById("admin-orders-container");
        const token = localStorage.getItem("jwt");

        try {
            const res = await fetch("http://localhost:1337/api/orders?populate=product", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await res.json();
            const orders = data.data;  // Use this directly!

            if (!Array.isArray(orders) || orders.length === 0) {
                orderContainer.innerHTML = "<p>No orders available.</p>";
                return;
            }

            renderOrders(orders);
        } catch (error) {
            console.error("Failed to fetch orders:", error);
            orderContainer.innerHTML = "<p>Error loading orders.</p>";
        }
    }


    // Orders code
    // Render orders
    function renderOrders(orders) {
        const orderContainer = document.getElementById("admin-orders-container");
        orderContainer.innerHTML = "";

        for (const order of orders) {
            const productDetailsArr = order.product_detail || [];

            let productDetails = "No products";
            if (Array.isArray(productDetailsArr) && productDetailsArr.length > 0) {
                productDetails = productDetailsArr.map(p => {
                    const product = p.product || {};
                    return `
                    <div class="product-item" style="margin-bottom:10px; padding:5px; border:1px solid #ddd;">
                        <p><strong>Name:</strong> ${product.Product_name || "N/A"}</p>
                        <p><strong>Price:</strong> ₹${product.Price || "N/A"}</p>
                        <p><strong>Description:</strong> ${product.Discription || "N/A"}</p>
                        <p><strong>Weight:</strong> ${product.Product_weight || ""} ${product.weight || ""}</p>
                        <p><strong>Quantity:</strong> ${p.Quantity || "1"}</p>
                    </div>
                `;
                }).join("");
            }

            const userName = userIdToName[order.user_id] || "Unknown User";

            const card = document.createElement("div");
            card.classList.add("order-card");
            card.style.border = "1px solid #ccc";
            card.style.padding = "15px";
            card.style.marginBottom = "20px";

            card.innerHTML = `
            <h4>🧾 Order ID: ${order.id}</h4>
            <p><strong>Customer:</strong> ${userName}</p>
            <p><strong>Email:</strong> ${order.Email ?? "N/A"}</p>
            <p><strong>Amount:</strong> ₹${order.Amount ?? "N/A"}</p>
            <div style="margin: 10px 0;">
                <label><strong>Status:</strong></label>
                <select id="status-${order.documentId}">
                    <option value="Pending" ${order.Order_Status === "Pending" ? "selected" : ""}>Pending</option>
                    <option value="In process" ${order.Order_Status === "In process" ? "selected" : ""}>In process</option>
                    <option value="Delivered" ${order.Order_Status === "Delivered" ? "selected" : ""}>Delivered</option>
                </select>
                <button class="update-status-btn" onclick="updateOrderStatus('${order.documentId}', document.getElementById('status-${order.documentId}').value)">
                    🔁 Update Status
                </button>
            </div>
            <div><strong>Products:</strong> ${productDetails}</div>
        `;

            orderContainer.appendChild(card);
        }
    }




    let userIdToName = {};

    // Fetch user 
    async function fetchUsers() {
        const token = localStorage.getItem("jwt");
        const res = await fetch("http://localhost:1337/api/users", {
            headers: { Authorization: `Bearer ${token}` },
        });

        const users = await res.json(); // assuming this returns an array of users
        users.forEach(user => {
            userIdToName[user.id] = user.Name || user.username || "Unknown User";
        });
    }

    // Fetch orders
    async function fetchOrders() {
        await fetchUsers();

        const orderContainer = document.getElementById("admin-orders-container");
        const token = localStorage.getItem("jwt");

        try {
            const res = await fetch("http://localhost:1337/api/orders?populate[product_detail][populate]=product", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await res.json();
            const orders = data.data;
            console.log(orders)


            if (!Array.isArray(orders) || orders.length === 0) {
                orderContainer.innerHTML = "<p>No orders available.</p>";
                return;
            }

            renderOrders(orders);
        } catch (error) {
            console.error("Failed to fetch orders:", error);
            orderContainer.innerHTML = "<p>Error loading orders.</p>";
        }
    }

    // Update status
    // ✅ Update order status by ID
    window.updateOrderStatus = async function (documentId, newStatus) {
        const token = localStorage.getItem("jwt");

        try {
            const fetchRes = await fetch("http://localhost:1337/api/orders", {
                headers: { Authorization: `Bearer ${token}` },
            });

            const fetchData = await fetchRes.json();
            const allOrders = fetchData?.data || [];

            // Find the correct order
            const targetOrder = allOrders.find(order => order.documentId === documentId);

            if (!targetOrder) {
                console.error("❌ Order not found with documentId:", documentId);
                alert("❌ Order not found.");
                return;
            }

            const orderId = targetOrder.documentId;

            const res = await fetch(`http://localhost:1337/api/orders/${orderId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    data: {
                        Order_Status: newStatus,
                    },
                }),
            });

            const data = await res.json();

            if (res.ok) {
                console.log(`✅ Order ${documentId} updated to ${newStatus}`);
                alert("✅ Order status updated!");
            } else {
                console.error("❌ Update failed:", data);
                alert("❌ Failed to update order status.");
            }
        } catch (err) {
            console.error("❌ Error updating order status:", err);
            alert("❌ Unexpected error occurred.");
        }
    };


    // Call fetchOrders to load orders when needed
    fetchOrders();
    fetchProducts();

    window.showSection = function (section) {
        const productSection = document.getElementById("products-section");
        const orderSection = document.getElementById("orders-section");

        if (section === "products") {
            productSection.style.display = "block";
            orderSection.style.display = "none";
            fetchProducts();
        } else if (section === "orders") {
            productSection.style.display = "none";
            orderSection.style.display = "block";
            fetchOrders();
        }
    };

    window.applyOrderFilters = async function () {
        const statusValue = document.getElementById("statusFilter").value;
        const searchTerm = document.getElementById("searchUser").value.toLowerCase();
        const sortBy = document.getElementById("sortOrder").value;

        await fetchUsers(); // Make sure userIdToName map is available

        const token = localStorage.getItem("jwt");
        const res = await fetch("http://localhost:1337/api/orders?populate[product_detail][populate]=product", {
            headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        let orders = data.data;

        // 🧠 Filter by status
        if (statusValue) {
            orders = orders.filter(order => order.Order_Status === statusValue);
        }

        // 🔍 Filter by customer email
        if (searchTerm) {
            orders = orders.filter(order =>
                order.Email?.toLowerCase().includes(searchTerm)
            );
        }

        // 🔢 Sort by amount or latest
        if (sortBy === "amountHigh") {
            orders.sort((a, b) => (b.Amount || 0) - (a.Amount || 0));
        } else if (sortBy === "amountLow") {
            orders.sort((a, b) => (a.Amount || 0) - (b.Amount || 0));
        } else if (sortBy === "latest") {
            orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        renderOrders(orders);
    };

});

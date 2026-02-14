// ================================
// CARGA INICIAL DEL CATÁLOGO
// Obtiene los productos desde un JSON
// y los renderiza dinámicamente
// ================================

let productCatalog = [];

fetch("data/productos.json")
  .then(response => response.json())
  .then(data => {
    productCatalog = data;
    renderProducts(productCatalog);
  })
  .catch(error => {
    console.error("Error cargando productos:", error);
    document.getElementById("product-grid").innerHTML =
      "<p>Error al cargar el catálogo. Por favor, intente más tarde.</p>";
  });

const grid = document.getElementById("product-grid");
// Renderiza dinámicamente las tarjetas de productos
// según el catálogo recibido
function renderProducts(products) {
  grid.innerHTML = "";

  products.forEach(product => {
    const card = document.createElement("article");
    card.classList.add("product-card");

    card.dataset.id = product.id;
    card.dataset.name = product.name;
    card.dataset.price = product.price;
    card.dataset.unit = product.unitType;
    card.dataset.weight = product.weight;

    let priceText = "";
    if (product.unitType === "lb") {
      priceText = `${product.price.toLocaleString()} COP/lb`;
    } else if (product.unitType === "PANAL") {
      priceText = `${product.price.toLocaleString()} COP por panal`;
    } else {
      priceText = `${product.price.toLocaleString()} COP c/u`;
    }

    const stepValue = product.unitType === "lb" ? 0.25 : 1;

    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}">
      <div class="product-body">
        <h3>${product.name}</h3>

        <div class="product-info">
          <span class="price">${priceText}</span>
          <span class="approx-weight">⚖️ ${product.weight}</span>
        </div>

        <div class="controls">
          <input class="qty" type="number" min="0" step="${stepValue}" value="0">
          <button class="btn btn-add">Añadir al Pedido</button>
        </div>
      </div>
    `;

    grid.appendChild(card);
  });
}

/* ========= LÓGICA DEL CARRITO ========= */

let cart = [];

// Delegación de eventos: Maneja los clics en los botones "Añadir" 
//sin tener que asignar un evento a cada tarjeta individualmente.
document.addEventListener("click", function (e) {
  if (!e.target.classList.contains("btn-add")) return;

  const card = e.target.closest(".product-card");

  const id = card.dataset.id;
  const name = card.dataset.name;
  const price = Number(card.dataset.price);
  const unit = card.dataset.unit;

  let quantity = parseFloat(card.querySelector(".qty").value);

  if (isNaN(quantity) || quantity <= 0) return;
  // Asegura que las cantidades en libras suban en incrementos de 0.25 (un cuarto de libra)
  if (unit === "lb") {
    quantity = Math.round(quantity / 0.25) * 0.25;
  }

  addToCart({ id, name, price, quantity, unit });
  
  e.target.textContent = "¡Añadido! ✓";
  e.target.style.background = "#27ae60"; 
  setTimeout(() => {
    e.target.textContent = "Añadir al Pedido";
    e.target.style.background = ""; 
  }, 900);
});

function addToCart(product) {
  const exists = cart.find(item => item.id === product.id);

  if (exists) {
    exists.quantity += product.quantity;
  } else {
    cart.push(product);
  }

  updateCartSummary();
}

function calculateTotal() {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function updateCartSummary() {
  const container = document.getElementById("summary-items");
  const totalSpan = document.getElementById("summary-total-price");

  container.innerHTML = "";

  if (cart.length === 0) {
    container.innerHTML = `<p class="empty">No ha seleccionado productos todavía.</p>`;
    totalSpan.textContent = "0 COP";
    updateCartCounter();
    return;
  }

  cart.forEach(product => {
    const div = document.createElement("div");
    div.classList.add("summary-item");

    let unitText = "lb";
    if (product.unit === "U") unitText = "unidad(es)";
    if (product.unit === "PANAL") unitText = "panal(es)";

    div.innerHTML = `
      <div>
        <strong>${product.name}</strong><br>
        <small>${product.quantity} ${unitText} × ${product.price.toLocaleString()} COP</small>
      </div>
      <button class="btn-remove" data-id="${product.id}">✕</button>
    `;

    container.appendChild(div);
  });

  totalSpan.textContent = `${calculateTotal().toLocaleString()} COP`;
  updateCartCounter();
}

function updateCartCounter() {
  const badge = document.getElementById("cart-count");
  const count = cart.reduce((acc, item) => acc + item.quantity, 0);

  badge.textContent = count.toFixed(2).replace(/\.00$/, "");
  badge.classList.add("cart-bounce");
  setTimeout(() => badge.classList.remove("cart-bounce"), 250);
}

document.getElementById("summary-items").addEventListener("click", function (e) {
  const btn = e.target.closest(".btn-remove");
  if (!btn) return;

  confirmDeletion(btn.dataset.id);
});

const modal = document.getElementById("modal-confirm");
const btnYes = document.getElementById("modal-yes");
const btnNo = document.getElementById("modal-no");

let idToDelete = null;

function confirmDeletion(id) {
  idToDelete = id;
  modal.classList.remove("hidden");
}

btnNo.addEventListener("click", () => {
  modal.classList.add("hidden");
  idToDelete = null;
});

btnYes.addEventListener("click", () => {
  cart = cart.filter(item => item.id !== idToDelete);
  updateCartSummary();

  const input = document.querySelector(
    `.product-card[data-id="${idToDelete}"] .qty`
  );
  if (input) input.value = 0;

  modal.classList.add("hidden");
  idToDelete = null;
});

document.getElementById("btn-clear").addEventListener("click", () => {
  cart = [];
  updateCartSummary();
  document.querySelectorAll(".qty").forEach(input => (input.value = 0));
});
// Formatea los productos del carrito en un mensaje legible 
//para enviarlo a WhatsApp mediante un enlace (wa.me)
document.getElementById("btn-send-whatsapp").addEventListener("click", () => {
  if (cart.length === 0) {
    alert("El carrito se encuentra vacío.");
    return;
  }

  let message = "¡Hola! Quisiera formalizar el siguiente pedido:%0A%0A";

  cart.forEach(item => {
    let unitText = "lb";
    let priceText = `${item.price.toLocaleString()} COP/lb`;

    if (item.unit === "U") {
      unitText = "unid.";
      priceText = `${item.price.toLocaleString()} COP c/u`;
    }

    if (item.unit === "PANAL") {
      unitText = "panal(es)";
      priceText = `${item.price.toLocaleString()} COP por panal`;
    }

    message += `• ${item.name} – ${item.quantity} ${unitText} (${priceText})%0A`;
  });

  message += `%0ASubtotal estimado: ${calculateTotal().toLocaleString()} COP`;
  message += `%0A%0A⚖️ Entiendo que el valor final puede ajustarse según el pesaje exacto.`;

  
  const phone = "573000000000"; 
  window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
});

const yearSpan = document.getElementById("year");
if (yearSpan) {
  yearSpan.textContent = new Date().getFullYear();
}
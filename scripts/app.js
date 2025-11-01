const products = [
  {
    id: 1,
    name: "Camiseta Preta Clássica",
    category: "masculina",
    price: 59.9,
    img: "https://picsum.photos/400?1",
  },
  {
    id: 2,
    name: "Camiseta Branca Feminina",
    category: "feminina",
    price: 69.9,
    img: "https://picsum.photos/400?2",
  },
  {
    id: 3,
    name: "Camiseta Azul Unissex",
    category: "unissex",
    price: 64.9,
    img: "https://picsum.photos/400?3",
  },
  {
    id: 4,
    name: "Camiseta Estampada",
    category: "masculina",
    price: 79.9,
    img: "https://picsum.photos/400?4",
  },
  {
    id: 5,
    name: "Camiseta Rosa",
    category: "feminina",
    price: 74.9,
    img: "https://picsum.photos/400?5",
  },
  {
    id: 6,
    name: "Camiseta Minimalista",
    category: "unissex",
    price: 84.9,
    img: "https://picsum.photos/400?6",
  },
];
let cart = [];
const productList = document.getElementById("product-list"),
  searchInput = document.getElementById("search"),
  filterSelect = document.getElementById("filter"),
  cartModal = document.getElementById("cart-modal"),
  cartItems = document.getElementById("cart-items"),
  totalEl = document.getElementById("total"),
  cartCount = document.getElementById("cart-count"),
  whatsappBtn = document.getElementById("whatsapp-btn");
function renderProducts(t) {
  (productList.innerHTML = ""),
    t.forEach((e) => {
      const n = document.createElement("div");
      (n.className = "product"),
        (n.innerHTML = `<img src="${e.img}" alt="${
          e.name
        }"><div class="product-info"><h3>${e.name}</h3><p>R$ ${e.price.toFixed(
          2
        )}</p><button onclick="addToCart(${e.id})">Adicionar</button></div>`),
        productList.appendChild(n);
    });
}
function addToCart(t) {
  const e = products.find((e) => e.id === t);
  cart.push(e), (cartCount.textContent = cart.length), saveCart();
}
function updateCart() {
  cartItems.innerHTML = "";
  let total = 0;

  cart.forEach((item, i) => {
    total += item.price;

    const li = document.createElement("li");
    li.innerHTML = `
      ${item.name} - R$ ${item.price.toFixed(2)}
      <button class="remove-item" onclick="removeFromCart(${i})">❌</button>
    `;
    cartItems.appendChild(li);
  });

  totalEl.textContent = total.toFixed(2);
  cartCount.textContent = cart.length;
  saveCart();
}
function removeFromCart(index) {
  cart.splice(index, 1);
  updateCart();
}

document.getElementById("view-cart").addEventListener("click", () => {
  updateCart(), cartModal.classList.remove("hidden");
}),
  document.getElementById("close-cart").addEventListener("click", () => {
    cartModal.classList.add("hidden");
  }),
  searchInput.addEventListener("input", applyFilters),
  filterSelect.addEventListener("change", applyFilters);
function applyFilters() {
  const t = searchInput.value.toLowerCase(),
    e = filterSelect.value,
    n = products.filter(
      (n) =>
        n.name.toLowerCase().includes(t) && ("all" === e || n.category === e)
    );
  renderProducts(n);
}
whatsappBtn.addEventListener("click", () => {
  const name = document.getElementById("user-name").value.trim();
  const address = document.getElementById("user-address").value.trim();

  if (!name || !address) {
    alert("Por favor, preencha seu nome e endereço antes de finalizar.");
    return;
  }

  const total = cart.reduce((sum, item) => sum + item.price, 0);
  const itemsList = cart
    .map((i) => `• ${i.name} - R$ ${i.price.toFixed(2)}`)
    .join("%0A");

  const message = `🛍️ *Novo pedido pelo site!*%0A
👤 *Nome:* ${name}%0A
🏠 *Endereço:* ${address}%0A
-------------------------%0A
${itemsList}%0A
-------------------------%0A
💰 *Total:* R$ ${total.toFixed(2)}`;

  const phone = "553496949389"; // coloque o número do vendedor aqui
  window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
});

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}
function loadCart() {
  const t = localStorage.getItem("cart");
  t && ((cart = JSON.parse(t)), (cartCount.textContent = cart.length));
}
loadCart(), renderProducts(products);

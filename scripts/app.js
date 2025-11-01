/* Loja Gerenciável com Toast Notification */
const SHEET_ID = "1dNksnPDCK2zUJqdl9jVKY7oa1c17mPJcFp3rBEyOAsg";
const GVIZ_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;

const state = {
  produtos: [],
  filtrados: [],
  cart: JSON.parse(localStorage.getItem("cart") || "[]"),
};

const els = {
  products: document.getElementById("products"),
  search: document.getElementById("search"),
  fCategory: document.getElementById("filter-category"),
  fSize: document.getElementById("filter-size"),
  fAvailable: document.getElementById("filter-available"),
  cartBtn: document.getElementById("open-cart"),
  cartCount: document.getElementById("cart-count"),
  cartModal: document.getElementById("cart-modal"),
  closeCart: document.getElementById("close-cart"),
  cartList: document.getElementById("cart-list"),
  cartTotal: document.getElementById("cart-total"),
  clearCart: document.getElementById("clear-cart"),
  finishWhatsapp: document.getElementById("finish-whatsapp"),
  toast: document.getElementById("toast"),
  toastMsg: document.getElementById("toast-msg"),
  toastBtn: document.getElementById("toast-btn"),
};

function parseGviz(text) {
  const json = JSON.parse(text.substring(47).slice(0, -2));
  const cols = json.table.cols.map((c) => c.label || c.id);
  const rows = json.table.rows.map((r) => r.c.map((c) => (c ? c.v : "")));
  const asObjects = rows.map((row) =>
    Object.fromEntries(
      row.map((v, i) => [String(cols[i] || i).toLowerCase(), v])
    )
  );
  return asObjects;
}

async function carregarProdutos() {
  try {
    const res = await fetch(GVIZ_URL, { cache: "no-store" });
    const text = await res.text();
    const objetos = parseGviz(text);
    const produtos = objetos
      .map((o) => ({
        id: String(o.id ?? ""),
        nome: String(o.nome ?? ""),
        preco: Number(o.preco ?? 0),
        categoria: String(o.categoria ?? ""),
        tamanho: String(o.tamanho ?? ""),
        estoque: Number(o.estoque ?? 0),
        descricao: String(o.descricao ?? ""),
        imagem: String(o.imagem ?? ""),
      }))
      .filter((p) => p.nome);

    state.produtos = produtos;
    popularFiltros(produtos);
    aplicarFiltros();
  } catch (e) {
    console.error("Erro ao carregar planilha:", e);
    els.products.innerHTML = `<div class='card'><div class='info'><h3>Erro ao carregar</h3><p>Verifique o ID da planilha e permissões públicas.</p></div></div>`;
  }
}

function popularFiltros(produtos) {
  const categorias = Array.from(
    new Set(produtos.map((p) => p.categoria).filter(Boolean))
  ).sort();
  els.fCategory.innerHTML =
    '<option value="">Categoria (todas)</option>' +
    categorias.map((c) => `<option value="${c}">${c}</option>`).join("");
}

function aplicarFiltros() {
  const q = (els.search.value || "").toLowerCase().trim();
  const fc = els.fCategory.value;
  const fs = els.fSize.value;
  const fa = els.fAvailable.checked;

  state.filtrados = state.produtos.filter((p) => {
    const matchNome = !q || p.nome.toLowerCase().includes(q);
    const matchCat = !fc || p.categoria === fc;
    const matchSize = !fs || p.tamanho === fs;
    const matchAvail = !fa || p.estoque > 0;
    return matchNome && matchCat && matchSize && matchAvail;
  });

  renderProdutos();
}

function currency(v) {
  return (v || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function renderProdutos() {
  els.products.innerHTML = "";
  if (!state.filtrados.length) {
    els.products.innerHTML =
      '<div class="card"><div class="info"><h3>Nenhum produto encontrado</h3><p>Ajuste os filtros ou a busca.</p></div></div>';
    return;
  }

  state.filtrados.forEach((p) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img src="${
        p.imagem || "https://via.placeholder.com/600x400?text=Produto"
      }" alt="${p.nome}">
      <div class="info">
        <h3>${p.nome}</h3>
        <div class="meta">
          <span class="badge">${p.categoria || "Sem categoria"}</span>
          <span class="badge gray">Tamanho: ${p.tamanho || "-"}</span>
          <span class="badge gray">Estoque: ${p.estoque}</span>
        </div>
        <p class="desc">${(p.descricao || "").slice(0, 120)}</p>
        <div class="price">${currency(p.preco)}</div>
        <div class="actions">
          <button class="btn secondary" ${
            p.estoque <= 0 ? "disabled" : ""
          } data-id="${p.id}">Adicionar</button>
        </div>
      </div>`;
    els.products.appendChild(card);
  });

  els.products.querySelectorAll(".btn.secondary").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const item = state.produtos.find((p) => p.id === id);
      if (item) {
        state.cart.push(item);
        persistCart();
        updateCartCount();
        showToast(`${item.nome} foi adicionado ao carrinho!`);
      }
    });
  });
}

function persistCart() {
  localStorage.setItem("cart", JSON.stringify(state.cart));
}
function updateCartCount() {
  els.cartCount.textContent = state.cart.length;
}
function openCart() {
  els.cartModal.classList.remove("hidden");
  renderCart();
}
function closeCart() {
  els.cartModal.classList.add("hidden");
}

function renderCart() {
  els.cartList.innerHTML = "";
  let total = 0;
  state.cart.forEach((item, idx) => {
    total += item.preco;
    const li = document.createElement("li");
    li.className = "cart-item";
    li.innerHTML = `
      <img src="${item.imagem}" alt="${item.nome}">
      <div style='flex:1'>
        <div class='title'>${item.nome}</div>
        <div class='meta'>Tam: ${item.tamanho} • ${currency(item.preco)}</div>
      </div>
      <button class='icon-btn' data-rm='${idx}' title='Remover'>🗑️</button>`;
    els.cartList.appendChild(li);
  });
  els.cartList.querySelectorAll("[data-rm]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const i = Number(btn.getAttribute("data-rm"));
      state.cart.splice(i, 1);
      persistCart();
      renderCart();
      updateCartCount();
    });
  });
  els.cartTotal.textContent = total.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
  });
}

function clearCart() {
  state.cart = [];
  persistCart();
  renderCart();
  updateCartCount();
}
function finishWhatsApp() {
  const phone = "553491257839";
  const items = state.cart
    .map((i) => `• ${i.nome} (Tam: ${i.tamanho}) - ${currency(i.preco)}`)
    .join("%0A");
  const total = state.cart.reduce((s, i) => s + i.preco, 0);
  const msg = `🛍️ *Novo pedido*%0A${items}%0A--------------------%0A*Total:* ${currency(
    total
  )}`;
  window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
}

// Toast / Tooltip
let toastTimeout;
function showToast(message) {
  els.toastMsg.textContent = message;
  els.toast.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => els.toast.classList.remove("show"), 4000);
}
els.toastBtn.addEventListener("click", () => {
  els.toast.classList.remove("show");
  openCart();
});

// Events
els.search.addEventListener("input", debounce(aplicarFiltros, 200));
els.fCategory.addEventListener("change", aplicarFiltros);
els.fSize.addEventListener("change", aplicarFiltros);
els.fAvailable.addEventListener("change", aplicarFiltros);
els.cartBtn.addEventListener("click", openCart);
els.closeCart.addEventListener("click", closeCart);
els.clearCart.addEventListener("click", clearCart);
els.finishWhatsapp.addEventListener("click", finishWhatsApp);

function debounce(fn, wait = 200) {
  let t;
  return (...a) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...a), wait);
  };
}
updateCartCount();
carregarProdutos();

const CART_STORAGE_KEY = "traart_cart";

// Liste des fichiers images disponibles dans images/products.json.
// Pour ajouter un nouveau tableau, déposez l'image dans images/ puis mettez à jour products.json.
let products = [];

const defaultProducts = [
  { image: "tableau1.jpeg", name: "Tableau 1", description: "Tableau 1 — une œuvre unique pour habiller votre intérieur.", price: 45000 },
  { image: "tableau2.jpeg", name: "Tableau 2", description: "Tableau 2 — une œuvre unique pour habiller votre intérieur.", price: 52000 },
  { image: "tableau3.jpeg", name: "Tableau 3", description: "Tableau 3 — une œuvre unique pour habiller votre intérieur.", price: 48000 },
  { image: "tableau4.jpeg", name: "Tableau 4", description: "Tableau 4 — une œuvre unique pour habiller votre intérieur.", price: 55000 },
  { image: "tableau5.jpeg", name: "Tableau 5", description: "Tableau 5 — une œuvre unique pour habiller votre intérieur.", price: 50000 },
  { image: "tableau6.jpeg", name: "Tableau 6", description: "Tableau 6 — une œuvre unique pour habiller votre intérieur.", price: 47000 },
  { image: "tableau7.jpeg", name: "Tableau 7", description: "Tableau 7 — une œuvre unique pour habiller votre intérieur.", price: 54000 },
  { image: "tableau8.jpeg", name: "Tableau 8", description: "Tableau 8 — une œuvre unique pour habiller votre intérieur.", price: 51000 },
  { image: "tableau9.jpeg", name: "Tableau 9", description: "Tableau 9 — une œuvre unique pour habiller votre intérieur.", price: 53000 },
  { image: "tableau10.jpeg", name: "Tableau 10", description: "Tableau 10 — une œuvre unique pour habiller votre intérieur.", price: 56000 },
  { image: "tableau11.jpeg", name: "Tableau 11", description: "Tableau 11 — une œuvre unique pour habiller votre intérieur.", price: 49000 },
  { image: "tableau12.jpeg", name: "Tableau 12", description: "Tableau 12 — une œuvre unique pour habiller votre intérieur.", price: 58000 },
  { image: "tableau13.jpeg", name: "Tableau 13", description: "Tableau 13 — une œuvre unique pour habiller votre intérieur.", price: 60000 },
];

async function loadProducts() {
  try {
    const response = await fetch("images/products.json");
    if (!response.ok) throw new Error("Impossible de charger products.json");

    const productImages = await response.json();

    products = productImages.map((item, index) => {
      const isString = typeof item === "string";
      const file = isString ? item : item.image;
      const base = (file || "").replace(/\.[^/.]+$/, "");

      // Nom par défaut (ex: tableau1.jpeg -> Tableau 1) si pas précisé
      const defaultName = base
        .replace(/[-_]/g, " ")
        .replace(/(\d+)/g, " $1")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\b\w/g, c => c.toUpperCase());

      const name = isString ? defaultName : item.name || defaultName;
      const description = isString
        ? `Tableau ${defaultName} — une œuvre unique pour votre intérieur.`
        : item.description || `Tableau ${name} — une œuvre unique pour votre intérieur.`;
      const price = isString ? 45000 + index * 15000 : (item.price ?? (45000 + index * 15000));

      return {
        id: item.id ? String(item.id) : String(index + 1),
        name,
        price,
        image: `images/${file}`,
        fallbackImage: `images/${file}`,
        description,
      };
    });
  } catch (error) {
    console.warn("Impossible de charger products.json, utilisation de la liste par défaut.", error);
    products = defaultProducts.map((product, index) => ({
      id: String(index + 1),
      ...product,
      image: `images/${product.image}`,
      fallbackImage: `images/${product.image}`,
    }));
  }
}

const fcfaFormatter = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

function formatFcfa(amount) {
  return fcfaFormatter.format(amount) + " FCFA";
}

function getCart() {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

function getCartCount(cart) {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

function updateCartIndicator() {
  const cartLink = document.querySelector("a.cart");
  const cart = getCart();
  const count = getCartCount(cart);
  cartLink.textContent = `Panier (${count})`;
}

function renderCart() {
  const cart = getCart();
  const cartItemsEl = document.getElementById("cartItems");
  const cartTotalEl = document.getElementById("cartTotal");

  if (!cartItemsEl || !cartTotalEl) return;

  if (cart.length === 0) {
    cartItemsEl.innerHTML = "<p class=\"empty\">Votre panier est vide.</p>";
    cartTotalEl.textContent = "0";
    return;
  }

  let total = 0;
  cartItemsEl.innerHTML = "";

  const fragment = document.createDocumentFragment();

  cart.forEach(item => {
    const lineTotal = item.price * item.quantity;
    total += lineTotal;

    const itemEl = document.createElement("div");
    itemEl.className = "cart-item";
    itemEl.dataset.id = item.id;

    itemEl.innerHTML = `
      <div class="cart-item-info">
        <strong>${item.name}</strong>
        <span class="cart-item-price">${formatFcfa(item.price)}</span>
      </div>
      <div class="cart-item-controls">
        <button class="cart-decrease" data-id="${item.id}" aria-label="Réduire la quantité">−</button>
        <span class="cart-quantity">${item.quantity}</span>
        <button class="cart-increase" data-id="${item.id}" aria-label="Augmenter la quantité">＋</button>
        <button class="cart-remove" data-id="${item.id}" aria-label="Supprimer">×</button>
      </div>
    `;

    fragment.appendChild(itemEl);
  });

  cartItemsEl.appendChild(fragment);
  cartTotalEl.textContent = formatFcfa(total);
}

function addToCart(product) {
  const cart = getCart();
  const existing = cart.find(item => item.id === product.id);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  saveCart(cart);
  updateCartIndicator();
  renderCart();
}

function updateQuantity(productId, delta) {
  const cart = getCart();
  const item = cart.find(i => i.id === productId);
  if (!item) return;

  item.quantity = Math.max(1, item.quantity + delta);
  saveCart(cart);
  updateCartIndicator();
  renderCart();
}

function removeFromCart(productId) {
  const cart = getCart().filter(item => item.id !== productId);
  saveCart(cart);
  updateCartIndicator();
  renderCart();
}

function handleCartClick(event) {
  const target = event.target;
  const id = target.dataset.id;
  if (!id) return;

  if (target.matches(".cart-increase")) {
    updateQuantity(id, 1);
  } else if (target.matches(".cart-decrease")) {
    updateQuantity(id, -1);
  } else if (target.matches(".cart-remove")) {
    removeFromCart(id);
  }
}

function toggleCart(open) {
  const panel = document.getElementById("cartPanel");
  if (!panel) return;

  const isOpen = !panel.classList.contains("hidden");
  const shouldOpen = typeof open === "boolean" ? open : !isOpen;

  panel.classList.toggle("hidden", !shouldOpen);
  panel.setAttribute("aria-hidden", String(!shouldOpen));
}

function toggleNav(open) {
  const navLinks = document.querySelector(".nav-links");
  if (!navLinks) return;
  const willOpen = typeof open === "boolean" ? open : !navLinks.classList.contains("open");
  navLinks.classList.toggle("open", willOpen);
}

function formatOrderSummary(cart) {
  if (!cart.length) return "Votre panier est vide.";

  const lines = cart.map(item => {
    const subTotal = formatFcfa(item.price * item.quantity);
    return `${item.name} x${item.quantity} — ${subTotal}`;
  });

  const total = formatFcfa(cart.reduce((sum, item) => sum + item.price * item.quantity, 0));
  lines.push(`\nTotal : ${total}`);

  return lines.join("\n");
}

function openCheckoutModal() {
  const cart = getCart();
  if (cart.length === 0) {
    alert("Votre panier est vide. Ajoutez des œuvres avant de passer à la caisse.");
    return;
  }

  const overlay = document.getElementById("checkoutModal");
  const summary = document.getElementById("orderSummary");
  const confirmation = document.getElementById("orderConfirmation");
  const form = document.getElementById("checkoutForm");
  const qrSection = document.getElementById("qrSection");
  const qrImage = document.getElementById("qrCode");
  const qrText = document.getElementById("qrText");

  if (!overlay || !summary || !form || !confirmation || !qrSection || !qrImage || !qrText) return;

  // Montrer le formulaire et masquer la confirmation (the later is shown after submit)
  confirmation.classList.add("hidden");
  form.classList.remove("hidden");

  // Afficher le contenu de la commande
  summary.textContent = formatOrderSummary(cart);

  // Préparer l'affichage du QR code Wave
  const waveInfo = `Wave Sénégal : +221785521829`;
  const qrValue = encodeURIComponent(`Wave Payment - ${waveInfo} - Montant: ${formatFcfa(cart.reduce((sum, item) => sum + item.price * item.quantity, 0))}`);
  const qrUrl = `https://chart.googleapis.com/chart?chs=220x220&cht=qr&chl=${qrValue}&choe=UTF-8`;

  qrImage.src = qrUrl;
  qrText.textContent = waveInfo;

  // Vider les champs du formulaire pour une nouvelle commande
  form.reset();

  overlay.classList.remove("hidden");
  overlay.setAttribute("aria-hidden", "false");
  toggleCart(false);
}

function closeCheckoutModal() {
  const overlay = document.getElementById("checkoutModal");
  if (!overlay) return;
  overlay.classList.add("hidden");
  overlay.setAttribute("aria-hidden", "true");
}

function submitCheckout(event) {
  event.preventDefault();
  const form = document.getElementById("checkoutForm");
  const confirmation = document.getElementById("orderConfirmation");
  const summary = document.getElementById("orderSummary");

  if (!form || !confirmation || !summary) return;

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const formData = new FormData(form);
  const customer = {
    name: formData.get("name"),
    email: formData.get("email"),
    address: formData.get("address"),
  };

  // Ici, on pourrait envoyer à un backend ou à un service email.
  // Pour cette démo, on simule via un message de confirmation.

  const cart = getCart();
  const orderText = formatOrderSummary(cart);

  confirmation.classList.remove("hidden");
  form.classList.add("hidden");

  // Nettoyer le panier
  localStorage.removeItem(CART_STORAGE_KEY);
  updateCartIndicator();
  renderCart();

  // Mettre à jour le résumé avec les informations de l'utilisateur
  summary.innerHTML = `Commande enregistrée pour <strong>${customer.name}</strong> (<br>${customer.email})<br><br>${orderText}<br><br><strong>Paiement</strong> : vous serez contacté via Wave Sénégal pour finaliser le règlement.`;
}

function handleCheckout() {
  openCheckoutModal();
}

function renderGallery() {
  const gallery = document.getElementById("gallery");
  if (!gallery) return;

  gallery.innerHTML = "";
  products.forEach(product => {
    const card = document.createElement("article");
    card.className = "product-card";
    card.dataset.id = product.id;
    card.dataset.name = product.name;
    card.dataset.price = product.price;

    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}" class="product-image" onerror="this.onerror=null;this.src='${product.fallbackImage}';">
      <div class="card-content">
        <h3>${product.name}</h3>
        <p class="product-description">${product.description}</p>
        <p class="price">${formatFcfa(product.price)}</p>
        <button class="add-to-cart">Ajouter au panier</button>
      </div>
    `;

    gallery.appendChild(card);
  });
}

function init() {
  initHeroSlider();

  loadProducts().then(() => {
    renderGallery();

    document.addEventListener("click", event => {
      const target = event.target;

      if (target.matches(".add-to-cart")) {
        const card = target.closest(".product-card");
        if (!card) return;

        addToCart({
          id: card.dataset.id,
          name: card.dataset.name,
          price: parseFloat(card.dataset.price),
        });

        toggleCart(true);
      }

      if (target.matches(".nav-toggle")) {
        toggleNav();
      }

      if (target.matches(".nav-links a")) {
        toggleNav(false);
      }
    });

    document.querySelector("a.cart")?.addEventListener("click", event => {
      event.preventDefault();
      toggleCart();
    });

    document.querySelector(".close-cart")?.addEventListener("click", () => toggleCart(false));
    document.querySelector("#checkoutBtn")?.addEventListener("click", handleCheckout);

    document.querySelector(".modal-close")?.addEventListener("click", closeCheckoutModal);
    document.querySelector("#cancelCheckout")?.addEventListener("click", closeCheckoutModal);
    document.querySelector("#closeConfirmation")?.addEventListener("click", closeCheckoutModal);
    document.querySelector("#checkoutForm")?.addEventListener("submit", submitCheckout);

    // Cart controls use event delegation for better performance
    document.getElementById("cartItems")?.addEventListener("click", handleCartClick);

    updateCartIndicator();
    renderCart();
  });
}

function initHeroSlider() {
  const slides = [
    {
      title: "TRAART — Votre galerie d'art en ligne",
      subtitle: "Découvrez une collection exclusive de tableaux inspirés, prêts à sublimer vos murs.",
      bg: "https://images.unsplash.com/photo-1526318472351-bc9c24350c5d?auto=format&fit=crop&w=1500&q=80",
    },
    {
      title: "Des œuvres uniques, sélectionnées pour vous",
      subtitle: "Chaque pièce est choisie pour sa qualité, son émotion et son impact visuel.",
      bg: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1500&q=80",
    },
    {
      title: "Achetez facilement, recevez rapidement",
      subtitle: "Passez commande en quelques secondes puis laissez-nous gérer le reste.",
      bg: "https://images.unsplash.com/photo-1529419412590-46bc10e0200c?auto=format&fit=crop&w=1500&q=80",
    },
  ];

  const hero = document.getElementById("accueil");
  const title = hero.querySelector("h1");
  const subtitle = hero.querySelector("p");

  if (!hero || !title || !subtitle) return;

  let index = 0;
  const updateSlide = () => {
    const slide = slides[index];
    hero.style.backgroundImage = `linear-gradient(135deg, rgba(26,31,46,0.9) 0%, rgba(17,19,27,0.9) 100%), url('${slide.bg}')`;
    title.textContent = slide.title;
    subtitle.textContent = slide.subtitle;
    index = (index + 1) % slides.length;
  };

  updateSlide();
  setInterval(updateSlide, 9000);
}

window.addEventListener("DOMContentLoaded", init);

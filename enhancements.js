/* FasoService — accueil dynamique, thème et installation PWA */
(() => {
  "use strict";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const getDb = () => window.FSApp && window.FSApp.db;
  let installPrompt = null;
  let slideIndex = 0;
  let slideTimer = null;

  function setTheme(theme) {
    const dark = theme === "dark";
    document.body.dataset.theme = dark ? "dark" : "light";
    const button = $("#themeToggle");
    if (button) {
      button.innerHTML = dark ? '<i data-lucide="sun"></i>' : '<i data-lucide="moon"></i>';
      button.setAttribute("aria-label", dark ? "Activer le mode clair" : "Activer le mode sombre");
      if (window.lucide) window.lucide.createIcons();
    }
    try { localStorage.setItem("fasoservice-theme", dark ? "dark" : "light"); } catch (_) {}
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.content = dark ? "#142018" : "#0B7A4B";
  }

  function initTheme() {
    let saved = "light";
    try { saved = localStorage.getItem("fasoservice-theme") || "light"; } catch (_) {}
    setTheme(saved);
    $("#themeToggle")?.addEventListener("click", () => {
      setTheme(document.body.dataset.theme === "dark" ? "light" : "dark");
    });
  }

  function initCarousel() {
    const root = $("#promoCarousel");
    if (!root) return;
    const slides = $$(".promo-slide", root);
    const dots = $("#promoDots", root);
    if (!slides.length || !dots) return;
    dots.innerHTML = slides.map((_, i) =>
      '<button class="promo-dot' + (i === 0 ? " active" : "") + '" type="button" aria-label="Afficher la bannière ' + (i + 1) + '" data-index="' + i + '"></button>'
    ).join("");
    const show = index => {
      slideIndex = (index + slides.length) % slides.length;
      slides.forEach((slide, i) => slide.classList.toggle("active", i === slideIndex));
      $$(".promo-dot", dots).forEach((dot, i) => {
        dot.classList.toggle("active", i === slideIndex);
        dot.setAttribute("aria-pressed", i === slideIndex ? "true" : "false");
      });
    };
    const restart = () => {
      if (slideTimer) clearInterval(slideTimer);
      slideTimer = setInterval(() => show(slideIndex + 1), 6000);
    };
    $("#promoPrev")?.addEventListener("click", () => { show(slideIndex - 1); restart(); });
    $("#promoNext")?.addEventListener("click", () => { show(slideIndex + 1); restart(); });
    dots.addEventListener("click", event => {
      const dot = event.target.closest("[data-index]");
      if (dot) { show(Number(dot.dataset.index)); restart(); }
    });
    root.addEventListener("mouseenter", () => slideTimer && clearInterval(slideTimer));
    root.addEventListener("mouseleave", restart);
    show(0);
    restart();
  }

  function ensureSkeletons() {
    ["nearbyProviders", "popularProviders", "newProviders"].forEach(id => {
      const box = document.getElementById(id);
      if (box && !box.children.length) box.innerHTML = '<div class="skeleton-card"></div><div class="skeleton-card"></div>';
    });
  }

  function escapeText(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[char]));
  }

  function fallbackCard(provider) {
    const name = escapeText(provider.name || "Prestataire");
    const city = escapeText(provider.city || "");
    const category = escapeText(provider.category || "");
    const rating = provider.rating == null ? "—" : Number(provider.rating).toFixed(1);
    const id = escapeText(provider.id);
    const portrait = window.FSArt ? window.FSArt.person(provider.category, true) : name.slice(0, 1).toUpperCase();
    return '<article class="provider-card" role="button" tabindex="0" onclick="openPublicProfile(\\'' + id + '\\')"><div class="provider-top"><div class="avatar">' + portrait + '</div><div class="provider-info"><h3>' + name + '</h3><p class="provider-category">' + category + '</p><div class="provider-meta">' + city + '</div></div></div><div class="provider-bottom"><span class="rating">★ ' + rating + '</span><span>Voir le profil →</span></div></article>';
  }

  function renderCards(targetId, providers, emptyText) {
    const box = document.getElementById(targetId);
    if (!box) return;
    if (!providers.length) {
      box.innerHTML = '<div class="empty-state">' + escapeText(emptyText) + '</div>';
      return;
    }
    const renderer = typeof window.renderProviderCard === "function" ? window.renderProviderCard : fallbackCard;
    box.innerHTML = providers.map(provider => renderer(provider)).join("");
    if (window.lucide) window.lucide.createIcons();
  }

  async function loadHomeCollections() {
    const client = getDb();
    if (!client) return;
    ensureSkeletons();
    const result = await client.from("providers").select("*").limit(120);
    if (result.error) {
      console.warn("FasoService: impossible de charger les prestataires de l’accueil", result.error.message);
      ["nearbyProviders", "popularProviders", "newProviders"].forEach(id => {
        renderCards(id, [], "Les prestataires seront affichés dès que les données seront disponibles.");
      });
      return;
    }
    const providers = result.data || [];
    const cities = Array.from(new Set(providers.map(p => String(p.city || "").trim()).filter(Boolean)))
      .sort((a, b) => a.localeCompare(b, "fr"));
    const citySelect = $("#nearbyCityFilter");
    const profileCity = window.FSApp && window.FSApp.getUser() ? (window.FSApp.getUser().city || "") : "";
    if (citySelect) {
      const validProfileCity = cities.find(city => city.toLowerCase() === profileCity.toLowerCase()) || "";
      const previous = citySelect.value;
      citySelect.innerHTML = '<option value="">Toutes les villes</option>' + cities.map(city =>
        '<option value="' + escapeText(city) + '">' + escapeText(city) + '</option>'
      ).join("");
      citySelect.value = cities.includes(previous) ? previous : validProfileCity;
    }
    const renderNearby = () => {
      const city = citySelect && citySelect.value ? citySelect.value : profileCity;
      const nearby = city ? providers.filter(p => String(p.city || "").toLowerCase() === city.toLowerCase())
        .sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0)).slice(0, 4) : [];
      const hint = $("#nearbyHint");
      if (hint) hint.textContent = city
        ? "Prestataires répertoriés à " + city + "."
        : "Choisissez une ville pour affiner les résultats.";
      renderCards("nearbyProviders", nearby, city
        ? "Aucun prestataire répertorié dans cette ville pour le moment."
        : "Aucun prestataire à afficher pour le moment.");
    };
    if (citySelect && !citySelect.dataset.bound) {
      citySelect.addEventListener("change", renderNearby);
      citySelect.dataset.bound = "true";
    }
    renderNearby();

    const popular = providers.slice().sort((a, b) => {
      const rating = (Number(b.rating) || 0) - (Number(a.rating) || 0);
      return rating || (Number(Boolean(b.verified)) - Number(Boolean(a.verified)));
    }).slice(0, 4);
    const newest = providers.slice().sort((a, b) =>
      new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    ).slice(0, 4);
    renderCards("popularProviders", popular, "Les profils les mieux notés apparaîtront ici.");
    renderCards("newProviders", newest, "Les nouveaux profils apparaîtront ici.");
  }

  function initInstall() {
    const button = $("#installAppBtn");
    if (!button) return;
    window.addEventListener("beforeinstallprompt", event => {
      event.preventDefault();
      installPrompt = event;
      button.classList.add("install-ready");
      button.setAttribute("aria-label", "Installer FasoService sur cet appareil");
    });
    button.addEventListener("click", async () => {
      if (installPrompt) {
        installPrompt.prompt();
        await installPrompt.userChoice;
        installPrompt = null;
        button.classList.remove("install-ready");
        return;
      }
      const standalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
      window.alert(standalone
        ? "FasoService est déjà installé sur cet appareil."
        : "Pour installer FasoService, ouvrez le menu de votre navigateur puis choisissez « Installer l’application » ou « Ajouter à l’écran d’accueil ».");
    });
  }

  function initServiceWorker() {
    if (!("serviceWorker" in navigator) || location.protocol === "file:") return;
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(error => console.warn("Service Worker indisponible", error));
    });
  }

  function initAccountTiles() {
    const account = $("#accountContent");
    if (!account || !window.MutationObserver) return;
    const apply = () => {
      const actions = account.lastElementChild;
      if (actions && actions.tagName === "DIV" && !actions.classList.contains("card") && actions.querySelector("button")) {
        actions.classList.add("account-actions-grid");
      }
    };
    new MutationObserver(apply).observe(account, { childList: true, subtree: true });
    apply();
  }

  function initReveal() {
    if (!("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    }), { threshold: 0.08 });
    $$(".section").forEach(section => {
      section.classList.add("reveal");
      observer.observe(section);
    });
  }

  function init() {
    initTheme();
    initCarousel();
    initInstall();
    initServiceWorker();
    initAccountTiles();
    initReveal();
    ensureSkeletons();
    setTimeout(loadHomeCollections, 900);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") setTimeout(loadHomeCollections, 250);
    });
    window.addEventListener("fasoservice:refresh-home", loadHomeCollections);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();

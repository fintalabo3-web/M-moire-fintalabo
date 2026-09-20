"use strict";

/* =========================================
   FASOSERVICE — Production (Netlify)
========================================= */

const SUPABASE_URL = "https://quagoxbmvodsxampzwxn.supabase.co";
const SUPABASE_KEY = "sb_publishable_hN-e9PcQ9Se9vl8eXHR60Q_4LYj4PPk";
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentMode = "client";
let user = null;
let currentProvider = null;
let currentCategory = "";
let onlyAvailable = false;
let editingProviderId = null;
let myRequestsCache = {};
let reviewTargetRequestId = null;
let reviewSelectedRating = 0;
let currentConversation = null;
let lastUnreadCount = 0;

const DEFAULT_MOD_PERMISSIONS = {
    view_users: true,
    view_providers: true,
    view_requests: true,
    manage_sos: true,
    suspend_user: false,
    delete_user: false,
    validate_provider: true
};

function hasPermission(permission) {
    if (!user) return false;
    if (user.is_admin) return true;
    if (!user.is_moderator) return false;
    return !!(user.permissions && user.permissions[permission]);
}

/* ========== HELPERS ========== */

function normalizePhone(phone) {
    return String(phone || "").replace(/\D/g, "");
}

function phoneToEmail(phone) {
    return normalizePhone(phone) + "@fasoservice.local";
}

function escapeHTML(str) {
    return String(str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function toast(message) {
    const container = document.getElementById("toastContainer");
    if (!container) return;
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => el.remove(), 3200);
}

function togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const isHidden = input.type === "password";
    input.type = isHidden ? "text" : "password";
    btn.innerHTML = `<i data-lucide="${isHidden ? "eye-off" : "eye"}"></i>`;
    if (window.lucide) lucide.createIcons();
}

function slugify(str) {
    return String(str || "")
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "prestataire";
}

async function generateUniqueSlug(name) {
    const base = slugify(name);
    let candidate = base;
    let attempt = 1;
    while (true) {
        const { data } = await db.from("providers").select("id").eq("slug", candidate).maybeSingle();
        if (!data) return candidate;
        attempt++;
        candidate = `${base}-${attempt}`;
    }
}

function generateReferralCode(name) {
    const clean = String(name || "").trim().toUpperCase().replace(/[^A-ZÀ-Ý ]/g, "");
    const parts = clean.split(/\s+/).filter(Boolean);
    const initials = parts.slice(0, 3).map(p => p[0]).join("") || "FS";
    return initials + Math.floor(1000 + Math.random() * 9000);
}

async function generateUniqueReferralCode(name) {
    for (let i = 0; i < 5; i++) {
        const code = generateReferralCode(name);
        const { data } = await db.from("users").select("id").eq("referral_code", code).maybeSingle();
        if (!data) return code;
    }
    return generateReferralCode(name) + Date.now().toString().slice(-3);
}

/* ========== NAVIGATION ========== */

function showPage(pageId) {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    const page = document.getElementById(pageId);
    if (page) page.classList.add("active");

    updateBottomNav(pageId);
    window.scrollTo(0, 0);
    if (window.lucide) lucide.createIcons();

    if (pageId === "account") displayAccount();
    if (pageId === "myRequests") displayMyRequests();
    if (pageId === "receivedRequests") displayReceivedRequests();
    if (pageId === "dashboard") displayDashboard();
    if (pageId === "adminDashboard") displayAdminDashboard();
    if (pageId === "messages") loadMessages();
    if (pageId === "home") loadAnnouncement();
    if (pageId === "modDashboard") {
        const list = document.getElementById("adminList");
        if (list) list.innerHTML = "";
    }
}

function switchMode(mode) {
    currentMode = mode;
    const mc = document.getElementById("modeClient");
    const mp = document.getElementById("modeProvider");
    if (mc) mc.classList.toggle("active", mode === "client");
    if (mp) mp.classList.toggle("active", mode === "provider");
    renderBottomNav();
    showPage(mode === "client" ? "home" : "dashboard");
}

function renderBottomNav() {
    const nav = document.getElementById("bottomNav");
    if (!nav) return;

    if (currentMode === "client") {
        nav.innerHTML = `
            <button class="nav-item active" data-page="home" onclick="showPage('home')">
                <i data-lucide="home"></i><span>Accueil</span>
            </button>
            <button class="nav-item" data-page="myRequests" onclick="showPage('myRequests')">
                <i data-lucide="clipboard-list"></i><span>Demandes</span>
            </button>
            <button class="nav-item" data-page="messages" onclick="showPage('messages')">
                <i data-lucide="message-circle"></i><span>Messages</span>
            </button>
            <button class="nav-item" data-page="account" onclick="showPage('account')">
                <i data-lucide="user"></i><span>Compte</span>
            </button>
        `;
    } else {
        nav.innerHTML = `
            <button class="nav-item active" data-page="dashboard" onclick="showPage('dashboard')">
                <i data-lucide="layout-dashboard"></i><span>Dashboard</span>
            </button>
            <button class="nav-item" data-page="receivedRequests" onclick="showPage('receivedRequests')">
                <i data-lucide="inbox"></i><span>Demandes</span>
            </button>
            <button class="nav-item" data-page="messages" onclick="showPage('messages')">
                <i data-lucide="message-circle"></i><span>Messages</span>
            </button>
            <button class="nav-item" data-page="account" onclick="showPage('account')">
                <i data-lucide="user"></i><span>Compte</span>
            </button>
        `;
    }
    if (window.lucide) lucide.createIcons();
    updateMessageBadge();
}

function updateBottomNav(activePage) {
    document.querySelectorAll(".nav-item").forEach(item => {
        item.classList.toggle("active", item.dataset.page === activePage);
    });
}

/* ========== CATÉGORIES ========== */

const STANDARD_CATEGORIES = [
    { name: "Plombier", icon: "wrench" },
    { name: "Électricien", icon: "zap" },
    { name: "Serrurier", icon: "key-round" },
    { name: "Vulcanisateur", icon: "gauge" },
    { name: "Mécanicien", icon: "car" },
    { name: "Réparateur téléphone", icon: "smartphone" },
    { name: "Frigoriste", icon: "snowflake" },
    { name: "Maçon", icon: "brick-wall" },
    { name: "Peintre", icon: "paint-roller" },
    { name: "Menuisier", icon: "hammer" },
    { name: "Carreleur", icon: "grid-3x3" },
    { name: "Plaquiste", icon: "layout-panel-top" },
    { name: "Vitrier", icon: "app-window" },
    { name: "Soudeur", icon: "flame" },
    { name: "Forgeron", icon: "hammer" },
    { name: "Couturière", icon: "scissors" },
    { name: "Coiffeur", icon: "sparkles" },
    { name: "Blanchisseur", icon: "shirt" },
    { name: "Ménage", icon: "brush" },
    { name: "Livreur / Coursier", icon: "bike" },
    { name: "Chauffeur / Transport", icon: "car-taxi-front" },
    { name: "Jardinier", icon: "sprout" },
    { name: "Garde d'enfants", icon: "baby" },
    { name: "Aide-soignant", icon: "heart-pulse" },
    { name: "Professeur particulier", icon: "graduation-cap" },
    { name: "Masseur / Kinésithérapeute", icon: "hand-heart" },
    { name: "Traiteur", icon: "utensils" },
    { name: "Photographe", icon: "camera" },
    { name: "Vidéaste", icon: "video" },
    { name: "Décorateur événementiel", icon: "party-popper" },
    { name: "Musicien / DJ", icon: "music" },
    { name: "Informaticien", icon: "laptop" },
    { name: "Antenniste", icon: "satellite-dish" },
    { name: "Assainissement", icon: "droplets" },
    { name: "Déménageur", icon: "truck" },
    { name: "Agent de sécurité", icon: "shield" },
    { name: "Cordonnier", icon: "footprints" },
    { name: "Bijoutier", icon: "gem" },
    { name: "Fleuriste", icon: "flower-2" },
    { name: "Graphiste", icon: "palette" },
    { name: "Imprimeur / Sérigraphie", icon: "printer" }
];

const CATEGORIES = [
    ...STANDARD_CATEGORIES,
    { name: "Autre métier", icon: "briefcase" }
];

function renderCategories() {
    const grid = document.getElementById("categoriesGrid");
    if (!grid) return;
    grid.innerHTML = CATEGORIES.map(cat => `
        <button class="category" onclick="openCategory('${cat.name.replace(/'/g, "\\'")}')">
            <i data-lucide="${cat.icon}"></i>
            <span>${cat.name}</span>
        </button>
    `).join("");
    if (window.lucide) lucide.createIcons();
}

function filterCategories() {
    const input = document.getElementById("searchInput");
    const grid = document.getElementById("categoriesGrid");
    if (!input || !grid) return;
    const term = input.value.trim().toLowerCase();
    grid.querySelectorAll(".category").forEach(btn => {
        const label = (btn.querySelector("span")?.textContent || "").toLowerCase();
        const isOther = label.includes("autre");
        btn.style.display = !term || label.includes(term) || isOther ? "" : "none";
    });
}

async function searchProvidersFromHome() {
    const input = document.getElementById("searchInput");
    const term = input ? input.value.trim() : "";
    if (!term) return;

    currentCategory = "";
    const title = document.getElementById("categoryTitle");
    if (title) title.textContent = `Résultats : ${term}`;
    showPage("providers");

    const list = document.getElementById("providerList");
    if (!list) return;
    list.innerHTML = `<div class="empty-state"><p>Chargement...</p></div>`;

    const { data, error } = await db
        .from("providers")
        .select("*")
        .or(`name.ilike.%${term}%,category.ilike.%${term}%,city.ilike.%${term}%`)
        .order("rating", { ascending: false });

    if (error) {
        console.error(error);
        list.innerHTML = `<div class="empty-state"><p>Erreur de chargement</p></div>`;
        return;
    }
    if (!data || !data.length) {
        list.innerHTML = `<div class="empty-state"><i data-lucide="user-x"></i><p>Aucun prestataire trouvé</p></div>`;
        if (window.lucide) lucide.createIcons();
        return;
    }
    list.innerHTML = data.map(p => renderProviderCard(p)).join("");
    if (window.lucide) lucide.createIcons();
}

/* ========== AUTH ========== */

function startRegister(role) {
    document.getElementById("registerRole").value = role;
    document.getElementById("registerTitle").textContent =
        role === "provider" ? "Créer mon compte prestataire" : "Créer mon compte client";
    showPage("register");
}

async function register() {
    const name = document.getElementById("registerName").value.trim();
    const phone = document.getElementById("registerPhone").value.trim();
    const city = document.getElementById("registerCity").value.trim();
    const password = document.getElementById("registerPassword").value;
    const role = document.getElementById("registerRole").value;
    const referral = document.getElementById("registerReferral").value.trim().toUpperCase();

    if (!name || !phone || !city || !password) return toast("Veuillez remplir tous les champs.");
    if (password.length < 6) return toast("Mot de passe : 6 caractères minimum.");

    const email = phoneToEmail(phone);
    const { data, error } = await db.auth.signUp({ email, password });
    if (error) return toast("Erreur : " + error.message);
    if (!data.user) return toast("Création du compte échouée.");

    const referralCode = await generateUniqueReferralCode(name);
    const { error: insertError } = await db.from("users").insert({
        id: data.user.id,
        name,
        phone,
        city,
        role,
        referral_code: referralCode,
        referred_by: referral || null
    });

    if (insertError) {
        console.error(insertError);
        await db.auth.signOut();
        return toast("Erreur profil. Réessayez.");
    }

    await loadCurrentUser(data.user.id);
    toast("Compte créé !");
    if (role === "provider") {
        switchMode("provider");
        showPage("dashboard");
    } else {
        switchMode("client");
        showPage("account");
    }
}

async function login() {
    const phone = document.getElementById("loginPhone").value.trim();
    const password = document.getElementById("loginPassword").value;
    if (!phone || !password) return toast("Veuillez remplir tous les champs.");

    const { data, error } = await db.auth.signInWithPassword({
        email: phoneToEmail(phone),
        password
    });
    if (error) return toast("Téléphone ou mot de passe incorrect.");

    await loadCurrentUser(data.user.id);
    if (!user) return toast("Profil introuvable.");
    if (user.suspended) {
        toast("Compte suspendu.");
        await logout();
        return;
    }

    toast("Connexion réussie !");
    if (user.role === "provider") {
        switchMode("provider");
        showPage("dashboard");
    } else {
        switchMode("client");
        showPage("account");
    }
    startMessagePolling();
}

async function logout() {
    await db.auth.signOut();
    user = null;
    if (window._msgPoll) clearInterval(window._msgPoll);
    toast("Déconnecté.");
    switchMode("client");
    showPage("home");
}

async function loadCurrentUser(userId) {
    const { data, error } = await db.from("users").select("*").eq("id", userId).single();
    if (error || !data) {
        user = null;
        return null;
    }
    user = data;
    return user;
}

async function restoreSession() {
    const { data: { session } } = await db.auth.getSession();
    if (!session?.user) return;
    await loadCurrentUser(session.user.id);
    if (!user) return;
    if (user.suspended) {
        toast("Compte suspendu.");
        await logout();
        return;
    }
    if (user.role === "provider") switchMode("provider");
}

/* ========== COMPTE ========== */

async function displayAccount() {
    const box = document.getElementById("accountContent");
    if (!box) return;

    if (!user) {
        box.innerHTML = `
            <div class="card" style="text-align:center;padding:32px 16px;">
                <p class="muted" style="margin-bottom:16px;">Connectez-vous pour accéder à votre compte</p>
                <button class="btn-primary full" onclick="showPage('login')">Se connecter</button>
                <button class="link-btn" onclick="showPage('registerChoice')">Créer un compte</button>
            </div>`;
        return;
    }

    const isProvider = user.role === "provider";
    let providerInfo = "";
    if (isProvider) {
        const { data: mp } = await db.from("providers").select("category,city,available").eq("user_id", user.id).maybeSingle();
        if (mp) {
            providerInfo = `<p class="muted" style="margin-top:6px;">${escapeHTML(mp.category)} · ${escapeHTML(mp.city || "")}${mp.available ? " · <span style='color:var(--green)'>Disponible</span>" : ""}</p>`;
        } else {
            providerInfo = `<p class="muted" style="margin-top:6px;color:#B45309;">Profil prestataire non complété</p>`;
        }
    }

    box.innerHTML = `
        <div class="card">
            <h3 style="margin-bottom:4px;">${escapeHTML(user.name)}</h3>
            <p class="muted">${escapeHTML(user.phone)} · ${escapeHTML(user.city || "")}</p>
            <p class="muted" style="margin-top:6px;">Rôle : <strong>${user.is_admin ? "Admin" : user.is_moderator ? "Modérateur" : isProvider ? "Prestataire" : "Client"}</strong></p>
            ${user.referral_code ? `<p class="muted" style="margin-top:6px;">Parrainage : <strong>${escapeHTML(user.referral_code)}</strong></p>` : ""}
            ${providerInfo}
        </div>
        <div style="margin-top:12px;display:flex;flex-direction:column;gap:8px;">
            ${user.is_admin ? `<button class="btn-primary full" onclick="showPage('adminDashboard')">Administration</button>` : ""}
            ${user.is_moderator ? `<button class="btn-primary full" onclick="showPage('modDashboard')">Espace Modération</button>` : ""}
            ${isProvider ? `
                <button class="btn-primary full" onclick="openEditProvider()">Mon profil prestataire</button>
                <button class="btn-secondary full" onclick="showPage('dashboard')">Tableau de bord</button>
            ` : `<button class="btn-secondary full" onclick="showPage('myRequests')">Mes demandes</button>`}
            <button class="btn-secondary full" onclick="requestBrowserNotifications().then(ok=>toast(ok?'Notifications activées':'Notifications refusées ou indisponibles'))">Activer les notifications</button>
            <button class="btn-secondary full" style="color:#B91C1C;border-color:#FECACA;" onclick="logout()">Se déconnecter</button>
        </div>`;
}

/* ========== PRESTATAIRES ========== */

async function openCategory(name) {
    currentCategory = name;
    const title = document.getElementById("categoryTitle");
    if (title) title.textContent = name;
    onlyAvailable = false;
    const filterBtn = document.getElementById("availableFilter");
    if (filterBtn) filterBtn.classList.remove("active");
    showPage("providers");
    await loadProviders();
}

function onCityFilterChange() {
    loadProviders();
}

function toggleAvailableFilter() {
    onlyAvailable = !onlyAvailable;
    const btn = document.getElementById("availableFilter");
    if (btn) btn.classList.toggle("active", onlyAvailable);
    loadProviders();
}

async function loadProviders() {
    const list = document.getElementById("providerList");
    if (!list) return;
    list.innerHTML = `<div class="empty-state"><p>Chargement...</p></div>`;

    let query = db.from("providers").select("*").order("rating", { ascending: false });

    if (currentCategory && currentCategory !== "Autre métier") {
        query = query.eq("category", currentCategory);
    }
    if (onlyAvailable) query = query.eq("available", true);

    const city = document.getElementById("cityFilter")?.value.trim() || "";    if (city) query = query.ilike("city", `%${city}%`);

    let { data, error } = await query;

    if (currentCategory === "Autre métier" && data) {
        const standard = new Set(STANDARD_CATEGORIES.map(c => c.name));
        data = data.filter(p => p.category && !standard.has(p.category));
    }

    // Profils expirés en bas
    if (data) {
        data = [...data].sort((a, b) => {
            const ae = a.subscription_status === "expired" ? 1 : 0;
            const be = b.subscription_status === "expired" ? 1 : 0;
            if (ae !== be) return ae - be;
            return (Number(b.rating) || 0) - (Number(a.rating) || 0);
        });
    }

    if (error) {
        console.error(error);
        list.innerHTML = `<div class="empty-state"><p>Erreur de chargement</p></div>`;
        return;
    }
    if (!data || !data.length) {
        list.innerHTML = `<div class="empty-state"><i data-lucide="user-x"></i><p>Aucun prestataire trouvé</p></div>`;
        if (window.lucide) lucide.createIcons();
        return;
    }
    list.innerHTML = data.map(p => renderProviderCard(p)).join("");
    if (window.lucide) lucide.createIcons();
}

function renderProviderCard(p) {
    const initial = (p.name || "?").charAt(0).toUpperCase();
    const rating = p.rating != null ? Number(p.rating).toFixed(1) : "—";
    const priceText = p.price
        ? `${Number(p.price).toLocaleString("fr-FR")} FCFA / ${escapeHTML(p.price_unit || "forfait")}`
        : "Prix non renseigné";
    const isTop = p.rating && Number(p.rating) >= 4.5;
    const cardClass = isTop ? "provider-card gold-card" : "provider-card";

    return `
        <div class="${cardClass}" onclick="openPublicProfile('${p.id}')">
            <div class="provider-top">
                <div class="avatar">
                    ${p.photo_url ? `<img src="${escapeHTML(p.photo_url)}" alt="">` : initial}
                </div>
                <div class="provider-info">
                    <h3>
                        ${escapeHTML(p.name)}
                        ${isTop ? '<span class="badge-gold">Top</span>' : ""}
                        ${p.verified ? '<span class="badge-verified">✓ Vérifié</span>' : ""}
                    </h3>
                    <p class="provider-category">${escapeHTML(p.category || "")}</p>
                    <div class="provider-meta">
                        <i data-lucide="map-pin" style="width:12px;height:12px;"></i>
                        ${escapeHTML(p.city || "")}${p.district ? " · " + escapeHTML(p.district) : ""}
                    </div>
                    <p class="provider-price">${priceText}</p>
                </div>
            </div>
            <div class="provider-bottom">
                <div class="rating">
                    <i data-lucide="star" style="width:14px;height:14px;"></i>
                    ${rating}
                    <span style="color:var(--ink-soft);font-weight:400;margin-left:3px;">(${p.completed_requests || 0})</span>
                </div>
                ${p.available ? '<span class="badge-available">Disponible</span>' : ""}
            </div>
        </div>`;
}

async function openPublicProfile(providerId) {
    const box = document.getElementById("publicProfileContent");
    if (!box) return;
    box.innerHTML = `<div class="empty-state"><p>Chargement...</p></div>`;
    showPage("publicProfile");

    const { data: p, error } = await db.from("providers").select("*").eq("id", providerId).maybeSingle();
    if (error || !p) {
        box.innerHTML = `<div class="empty-state"><p>Profil introuvable</p></div>`;
        return;
    }
    currentProvider = p;

    const [servicesRes, galleryRes, reviewsRes] = await Promise.all([
        db.from("services").select("*").eq("provider_id", p.id).order("created_at"),
        db.from("gallery").select("*").eq("provider_id", p.id).order("created_at", { ascending: false }),
        db.from("reviews").select("rating,comment,created_at").eq("provider_id", p.id).order("created_at", { ascending: false }).limit(5)
    ]);

    const services = servicesRes.data || [];
    const gallery = galleryRes.data || [];
    const reviews = reviewsRes.data || [];
    const initial = (p.name || "?").charAt(0).toUpperCase();
    const rating = p.rating != null ? Number(p.rating).toFixed(1) : "—";
    const priceText = p.price
        ? `${Number(p.price).toLocaleString("fr-FR")} FCFA / ${escapeHTML(p.price_unit || "forfait")}`
        : null;
    const phoneDigits = normalizePhone(p.phone).slice(-8);

    const servicesHtml = services.length
        ? services.map(s => `
            <div style="display:flex;justify-content:space-between;gap:8px;padding:8px 0;border-bottom:1px solid var(--line);">
                <div>
                    <strong>${escapeHTML(s.name)}</strong>
                    ${s.description ? `<p class="muted" style="font-size:0.8rem;">${escapeHTML(s.description)}</p>` : ""}
                </div>
                <span style="font-weight:600;white-space:nowrap;font-size:0.88rem;">
                    ${Number(s.price).toLocaleString("fr-FR")} FCFA${s.unit ? " / " + escapeHTML(s.unit) : ""}
                </span>
            </div>`).join("")
        : `<p class="muted">Aucun service listé</p>`;

    const galleryHtml = gallery.length
        ? `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:8px;">
            ${gallery.map(g => `<img src="${escapeHTML(g.photo_url)}" alt="" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px;">`).join("")}
           </div>`
        : `<p class="muted">Aucune photo</p>`;

    const reviewsHtml = reviews.length
        ? reviews.map(r => `
            <div style="padding:8px 0;border-bottom:1px solid var(--line);">
                <strong>${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}</strong>
                ${r.comment ? `<p style="margin-top:4px;font-size:0.88rem;">${escapeHTML(r.comment)}</p>` : ""}
            </div>`).join("")
        : `<p class="muted">Pas encore d'avis</p>`;

    box.innerHTML = `
        <div class="card" style="text-align:center;">
            <div class="profile-avatar">
                ${p.photo_url ? `<img src="${escapeHTML(p.photo_url)}" alt="">` : initial}
            </div>
            <h2 style="margin-bottom:4px;">${escapeHTML(p.name)}</h2>
            <p class="muted">${escapeHTML(p.category)} · ${escapeHTML(p.city || "")}${p.district ? " · " + escapeHTML(p.district) : ""}</p>
            <p style="margin-top:8px;">
                ★ ${rating} <span class="muted">(${p.completed_requests || 0})</span>
                ${p.verified ? ' · <span style="color:var(--green);font-weight:600;">Vérifié</span>' : ""}
            </p>
            ${priceText ? `<p style="margin-top:8px;font-weight:700;color:var(--green);">${priceText}</p>` : ""}
            <p style="margin-top:4px;${p.available ? "color:var(--green);font-weight:600;" : ""}">${p.available ? "Disponible" : "Indisponible"}</p>
        </div>
        ${p.description ? `<div class="card"><h3 style="margin-bottom:6px;">À propos</h3><p style="line-height:1.45;">${escapeHTML(p.description)}</p></div>` : ""}
        <div class="card"><h3 style="margin-bottom:6px;">Services</h3>${servicesHtml}</div>
        <div class="card"><h3 style="margin-bottom:6px;">Réalisations</h3>${galleryHtml}</div>
        <div class="card"><h3 style="margin-bottom:6px;">Avis</h3>${reviewsHtml}</div>
        <div style="display:flex;flex-direction:column;gap:8px;margin-top:8px;">
            <button class="btn-primary full" onclick="startRequest('${p.id}')">Demander un service</button>
            <a class="btn-secondary full" style="text-align:center;text-decoration:none;" href="tel:${escapeHTML(p.phone)}">Appeler</a>
            <a class="btn-secondary full" style="text-align:center;text-decoration:none;" href="https://wa.me/226${phoneDigits}" target="_blank" rel="noopener">WhatsApp</a>
        </div>`;
    if (window.lucide) lucide.createIcons();
}

function startRequest(providerId) {
    if (!user) {
        toast("Connectez-vous pour envoyer une demande");
        showPage("login");
        return;
    }
    openPublicProfile(providerId).then(() => {
        const info = document.getElementById("requestProviderInfo");
        if (info && currentProvider) {
            info.innerHTML = `<strong>${escapeHTML(currentProvider.name)}</strong><br><span class="muted">${escapeHTML(currentProvider.category)}</span>`;
        }
        document.getElementById("requestDescription").value = "";
        document.getElementById("requestLocation").value = "";
        document.getElementById("requestDate").value = "";
        showPage("request");
    });
}

async function sendRequest() {
    if (!user || !currentProvider) return toast("Erreur");
    const description = document.getElementById("requestDescription").value.trim();
    const location = document.getElementById("requestLocation").value.trim();
    const dateWanted = document.getElementById("requestDate").value.trim();
    if (!description) return toast("Décrivez votre besoin");

    const { error } = await db.from("requests").insert({
        client_id: user.id,
        client_name: user.name,
        client_phone: user.phone,
        provider_id: currentProvider.id,
        provider_name: currentProvider.name,
        category: currentProvider.category,
        description,
        location: location || null,
        date_wanted: dateWanted || null,
        status: "envoyée"
    });

    if (error) {
        console.error(error);
        return toast("Erreur : " + error.message);
    }

    const summary = document.getElementById("requestSummary");
    if (summary) {
        summary.innerHTML = `
            <p><strong>${escapeHTML(currentProvider.name)}</strong></p>
            <p class="muted">${escapeHTML(description)}</p>
            ${location ? `<p class="muted">📍 ${escapeHTML(location)}</p>` : ""}`;
    }
    showPage("requestSent");
}

/* ========== EDIT PROFILE / STORAGE ========== */

async function uploadProviderFile(file, folder) {
    if (!user || !file) return null;
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${user.id}/${folder}/${Date.now()}.${ext}`;
    const { error } = await db.storage.from("provider-photos").upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = db.storage.from("provider-photos").getPublicUrl(path);
    return data?.publicUrl || null;
}

function initProviderPhotoPreview() {
    const input = document.getElementById("provPhotoInput");
    const preview = document.getElementById("provPhotoPreview");
    if (!input || !preview) return;
    input.onchange = () => {
        const file = input.files?.[0];
        if (!file) return;
        preview.src = URL.createObjectURL(file);
        preview.style.display = "block";
    };
}

function toggleCustomCategory() {
    const select = document.getElementById("provCategory");
    const box = document.getElementById("customCategoryBox");
    if (!select || !box) return;
    box.style.display = select.value === "Autre métier" ? "block" : "none";
}

async function openEditProvider() {
    if (!user) {
        toast("Connectez-vous");
        showPage("login");
        return;
    }

    const select = document.getElementById("provCategory");
    if (select) {
        select.innerHTML = `<option value="">Choisir un métier</option>` +
            CATEGORIES.map(c => `<option value="${escapeHTML(c.name)}">${escapeHTML(c.name)}</option>`).join("");
    }

    const { data: existing } = await db.from("providers").select("*").eq("user_id", user.id).maybeSingle();

    document.getElementById("provName").value = existing?.name || user.name || "";
    const isCustom = existing && !STANDARD_CATEGORIES.some(c => c.name === existing.category);
    document.getElementById("provCategory").value = isCustom ? "Autre métier" : (existing?.category || "");
    document.getElementById("provCustomCategory").value = isCustom ? existing.category : "";
    document.getElementById("provCity").value = existing?.city || user.city || "";
    document.getElementById("provDistrict").value = existing?.district || "";
    document.getElementById("provDescription").value = existing?.description || "";
    document.getElementById("provAvailable").checked = existing?.available !== false;
    document.getElementById("provPrice").value = existing?.price ?? "";
    document.getElementById("provPriceUnit").value = existing?.price_unit || "forfait";

    const preview = document.getElementById("provPhotoPreview");
    if (preview) {
        if (existing?.photo_url) {
            preview.src = existing.photo_url;
            preview.style.display = "block";
        } else {
            preview.src = "";
            preview.style.display = "none";
        }
    }

    toggleCustomCategory();
    initProviderPhotoPreview();
    editingProviderId = existing?.id || null;

    if (editingProviderId) {
        loadServicesManager(editingProviderId);
        loadGalleryManager(editingProviderId);
    } else {
        const sb = document.getElementById("servicesManagerBox");
        const gb = document.getElementById("galleryManagerBox");
        if (sb) sb.innerHTML = "";
        if (gb) gb.innerHTML = "";
    }

    showPage("editProvider");
}

async function saveProviderProfile() {
    if (!user) return toast("Connectez-vous");

    const name = document.getElementById("provName").value.trim();
    let category = document.getElementById("provCategory").value;
    const customCategory = document.getElementById("provCustomCategory").value.trim();
    const city = document.getElementById("provCity").value.trim();
    const district = document.getElementById("provDistrict").value.trim();
    const description = document.getElementById("provDescription").value.trim();
    const available = document.getElementById("provAvailable").checked;
    const priceRaw = document.getElementById("provPrice")?.value.trim() || "";
    const priceUnit = document.getElementById("provPriceUnit")?.value || "forfait";
    const photoInput = document.getElementById("provPhotoInput");

    if (!name || !category || !city) return toast("Champs obligatoires manquants");
    if (category === "Autre métier") {
        if (!customCategory) return toast("Précisez votre métier");
        category = customCategory;
    }

    let photoUrl = null;
    const file = photoInput?.files?.[0];
    if (file) {
        try {
            toast("Upload photo...");
            photoUrl = await uploadProviderFile(file, "profile");
        } catch (e) {
            console.error(e);
            return toast("Erreur upload photo");
        }
    }

    const { data: existing } = await db.from("providers").select("id,photo_url,slug").eq("user_id", user.id).maybeSingle();

    const providerData = {
        user_id: user.id,
        name,
        category,
        city,
        district: district || null,
        description: description || null,
        available,
        phone: user.phone,
        price: priceRaw ? Number(priceRaw) : null,
        price_unit: priceUnit,
        photo_url: photoUrl || existing?.photo_url || null
    };

    let error;
    let savedId = existing?.id || null;

    if (existing) {
        const { error: updateError } = await db.rpc("update_provider_profile", {
            target_provider_id: existing.id,
            new_name: name,
            new_category: category,
            new_city: city,
            new_district: district || null,
            new_description: description || null,
            new_available: available,
            new_price: priceRaw ? Number(priceRaw) : null,
            new_price_unit: priceUnit,
            new_photo_url: photoUrl || existing?.photo_url || null
        });
        error = updateError;
    } else {
        const slug = await generateUniqueSlug(name);
        const { data: inserted, error: insertError } = await db
            .from("providers")
            .insert({ ...providerData, slug })
            .select("id")
            .single();
        error = insertError;
        savedId = inserted?.id || null;
        if (!error && user.role !== "provider") {
            await db.from("users").update({ role: "provider" }).eq("id", user.id);
            user.role = "provider";
        }
    }

    if (error) {
        console.error(error);
        return toast("Erreur : " + error.message);
    }

    editingProviderId = savedId;
    toast("Profil enregistré !");
    if (savedId) {
        loadServicesManager(savedId);
        loadGalleryManager(savedId);
    }
    switchMode("provider");
    showPage("dashboard");
}

/* ========== GALLERY / SERVICES ========== */

async function loadGalleryManager(providerId) {
    const box = document.getElementById("galleryManagerBox");
    if (!box || !providerId) {
        if (box) box.innerHTML = "";
        return;
    }
    const { data, error } = await db.from("gallery").select("*").eq("provider_id", providerId).order("created_at", { ascending: false });
    if (error) {
        box.innerHTML = `<div class="card"><p class="muted">Erreur galerie</p></div>`;
        return;
    }
    const photos = (data || []).map(g => `
        <div style="position:relative;">
            <img src="${escapeHTML(g.photo_url)}" alt="" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px;">
            <button type="button" style="position:absolute;top:4px;right:4px;background:#B91C1C;color:#fff;border:none;border-radius:6px;padding:2px 6px;font-size:0.7rem;cursor:pointer;"
                onclick="deleteGalleryPhoto('${g.id}')">✕</button>
        </div>`).join("");

    box.innerHTML = `
        <div class="card">
            <h3 style="margin-bottom:8px;">Galerie</h3>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:12px;">
                ${photos || `<p class="muted" style="grid-column:1/-1;">Aucune photo</p>`}
            </div>
            <input id="galleryInput" type="file" accept="image/*" capture="environment" style="font-size:0.82rem;">
            <button class="btn-secondary full" style="margin-top:8px;" onclick="addGalleryPhoto()">Ajouter</button>
        </div>`;
}

async function addGalleryPhoto() {
    if (!editingProviderId) return toast("Enregistrez d'abord le profil");
    const file = document.getElementById("galleryInput")?.files?.[0];
    if (!file) return toast("Choisissez une photo");
    try {
        toast("Upload...");
        const url = await uploadProviderFile(file, "gallery");
        if (!url) return toast("Erreur upload");
        const { error } = await db.from("gallery").insert({ provider_id: editingProviderId, photo_url: url });
        if (error) return toast("Erreur enregistrement");
        toast("Photo ajoutée");
        loadGalleryManager(editingProviderId);
    } catch (e) {
        console.error(e);
        toast("Erreur upload");
    }
}

async function deleteGalleryPhoto(galleryId) {
    if (!confirm("Supprimer cette photo ?")) return;
    const { error } = await db.from("gallery").delete().eq("id", galleryId);
    if (error) return toast("Erreur suppression");
    toast("Supprimée");
    loadGalleryManager(editingProviderId);
}

async function loadServicesManager(providerId) {
    const box = document.getElementById("servicesManagerBox");
    if (!box || !providerId) {
        if (box) box.innerHTML = "";
        return;
    }
    const { data } = await db.from("services").select("*").eq("provider_id", providerId).order("created_at");
    const list = (data || []).map(s => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--line);">
            <div>
                <strong>${escapeHTML(s.name)}</strong>
                <span class="muted"> — ${Number(s.price).toLocaleString("fr-FR")} FCFA / ${escapeHTML(s.unit || "forfait")}</span>
            </div>
            <button class="btn-secondary" style="padding:4px 10px;font-size:0.75rem;" onclick="deleteService('${s.id}')">✕</button>
        </div>`).join("");

    box.innerHTML = `
        <div class="card">
            <h3 style="margin-bottom:8px;">Services</h3>
            ${list || `<p class="muted">Aucun service</p>`}
            <label style="margin-top:12px;">Nom</label>
            <input id="svcName" type="text" placeholder="Ex : Installation">
            <label>Prix (FCFA)</label>
            <input id="svcPrice" type="number" min="0" placeholder="5000">
            <label>Unité</label>
            <select id="svcUnit">
                <option value="forfait">Forfait</option>
                <option value="heure">Heure</option>
                <option value="jour">Jour</option>
                <option value="prestation">Prestation</option>
            </select>
            <button class="btn-secondary full" style="margin-top:10px;" onclick="addService()">Ajouter un service</button>
        </div>`;
}

async function addService() {
    if (!editingProviderId) return toast("Enregistrez d'abord le profil");
    const name = document.getElementById("svcName")?.value.trim();
    const price = Number(document.getElementById("svcPrice")?.value);
    const unit = document.getElementById("svcUnit")?.value || "forfait";
    if (!name || !price) return toast("Nom et prix requis");
    const { error } = await db.from("services").insert({ provider_id: editingProviderId, name, price, unit });
    if (error) return toast("Erreur : " + error.message);
    toast("Service ajouté");
    loadServicesManager(editingProviderId);
}

async function deleteService(id) {
    if (!confirm("Supprimer ce service ?")) return;
    await db.from("services").delete().eq("id", id);
    loadServicesManager(editingProviderId);
}

/* ========== DEMANDES ========== */

async function displayMyRequests() {
    const box = document.getElementById("myRequestsContent");
    if (!box) return;
    if (!user) {
        box.innerHTML = `<div class="empty-state"><p>Connectez-vous</p>
            <button class="btn-primary" style="margin-top:12px;" onclick="showPage('login')">Se connecter</button></div>`;
        return;
    }
    box.innerHTML = `<div class="empty-state"><p>Chargement...</p></div>`;
    const { data, error } = await db.from("requests").select("*").eq("client_id", user.id).order("created_at", { ascending: false });
    if (error) {
        box.innerHTML = `<div class="empty-state"><p>Erreur</p></div>`;        return;
    }
    myRequestsCache = {};
    (data || []).forEach(r => { myRequestsCache[r.id] = r; });
    if (!data?.length) {
        box.innerHTML = `<div class="empty-state"><i data-lucide="clipboard-list"></i><p>Aucune demande</p></div>`;
        if (window.lucide) lucide.createIcons();
        return;
    }
    box.innerHTML = data.map(r => {
        const date = r.created_at ? new Date(r.created_at).toLocaleString("fr-FR") : "";
        return `
            <div class="card">
                <h3 style="margin-bottom:4px;">${escapeHTML(r.provider_name || "Prestataire")}</h3>
                <p class="muted">${escapeHTML(r.category || "")} · ${escapeHTML(r.status || "")}</p>
                <p class="muted" style="font-size:0.78rem;">${date}</p>
                <p style="margin-top:8px;">${escapeHTML(r.description || "")}</p>
                ${r.provider_id ? `<button class="btn-secondary full" style="margin-top:10px;"
                    onclick="startChatFromRequest('${r.id}','${r.provider_id}','${escapeHTML(r.provider_name || "Prestataire").replace(/'/g, "\\'")}')">Message</button>` : ""}
                ${r.status === "terminée" ? `<button class="btn-secondary full" style="margin-top:8px;" onclick="openLeaveReview('${r.id}')">Laisser un avis</button>` : ""}
            </div>`;
    }).join("");
}

async function displayReceivedRequests() {
    const box = document.getElementById("receivedRequestsContent");
    if (!box) return;
    if (!user) {
        box.innerHTML = `<div class="empty-state"><p>Connectez-vous</p>
            <button class="btn-primary" style="margin-top:12px;" onclick="showPage('login')">Se connecter</button></div>`;
        return;
    }
    const { data: myProvider } = await db.from("providers").select("id,name,category").eq("user_id", user.id).maybeSingle();
    if (!myProvider) {
        box.innerHTML = `<div class="empty-state"><p>Complétez votre profil prestataire</p></div>`;
        return;
    }
    box.innerHTML = `<div class="empty-state"><p>Chargement...</p></div>`;
    const [assignedRes, sosRes] = await Promise.all([
        db.from("requests").select("*").eq("provider_id", myProvider.id).order("created_at", { ascending: false }),
        db.from("requests").select("*").is("provider_id", null).eq("is_sos", true).eq("category", myProvider.category).order("created_at", { ascending: false })
    ]);
    const data = [...(assignedRes.data || []), ...(sosRes.data || [])]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    if (!data.length) {
        box.innerHTML = `<div class="empty-state"><i data-lucide="inbox"></i><p>Aucune demande</p></div>`;
        if (window.lucide) lucide.createIcons();
        return;
    }
    box.innerHTML = data.map(r => renderReceivedRequestCard(r)).join("");
}

function renderReceivedRequestCard(r) {
    const date = r.created_at ? new Date(r.created_at).toLocaleString("fr-FR") : "";
    return `
        <div class="card">
            <h3 style="margin-bottom:4px;">${escapeHTML(r.client_name || "Client")}${r.is_sos ? ' <span class="badge-suspended">SOS</span>' : ""}</h3>
            <p class="muted">${escapeHTML(r.category || "")} · ${escapeHTML(r.status || "")}</p>
            <p class="muted" style="font-size:0.78rem;">${date}</p>
            <p style="margin-top:8px;">${escapeHTML(r.description || "")}</p>
            ${r.location ? `<p class="muted" style="margin-top:4px;">📍 ${escapeHTML(r.location)}</p>` : ""}
            ${r.client_phone ? `<p class="muted">📞 ${escapeHTML(r.client_phone)}</p>` : ""}
            ${r.client_id ? `<button class="btn-secondary full" style="margin-top:10px;"
                onclick="startChatFromRequest('${r.id}','${r.client_id}','${escapeHTML(r.client_name || "Client").replace(/'/g, "\\'")}')">Message</button>` : ""}
            ${r.status === "envoyée" || r.status === "acceptée" ? `
                <button class="btn-secondary full" style="margin-top:8px;" onclick="acceptRequest('${r.id}')">Accepter</button>
                <button class="btn-primary full" style="margin-top:8px;" onclick="markRequestCompleted('${r.id}')">Marquer terminée</button>
            ` : ""}
        </div>`;
}

async function acceptRequest(requestId) {
    const { error } = await db.from("requests").update({ status: "acceptée" }).eq("id", requestId);
    if (error) return toast("Erreur");
    toast("Demande acceptée");
    displayReceivedRequests();
}

async function markRequestCompleted(requestId) {
    if (!confirm("Confirmer que le service est terminé ?")) return;
    const { error } = await db.from("requests").update({
        status: "terminée",
        completed_at: new Date().toISOString()
    }).eq("id", requestId);
    if (error) return toast("Erreur : " + error.message);
    toast("Marquée terminée");
    displayReceivedRequests();
}

/* ========== AVIS ========== */

async function openLeaveReview(requestId) {
    if (!user) return showPage("login");
    reviewTargetRequestId = requestId;
    reviewSelectedRating = 0;
    const req = myRequestsCache[requestId];
    const info = document.getElementById("reviewProviderInfo");
    if (info) info.textContent = req ? `Avis pour ${req.provider_name || "le prestataire"}` : "Votre avis";
    const starsBox = document.getElementById("reviewStars");
    if (starsBox) {
        starsBox.innerHTML = [1, 2, 3, 4, 5].map(n => `
            <button type="button" class="star-btn" data-star="${n}" onclick="selectReviewRating(${n})"
                style="background:none;border:none;font-size:1.7rem;cursor:pointer;color:#D1D5DB;">★</button>`).join("");
    }
    const c = document.getElementById("reviewComment");
    if (c) c.value = "";
    showPage("leaveReview");
}

function selectReviewRating(n) {
    reviewSelectedRating = n;
    document.querySelectorAll("#reviewStars .star-btn").forEach(btn => {
        btn.style.color = Number(btn.dataset.star) <= n ? "#F59E0B" : "#D1D5DB";
    });
}

async function submitReview() {
    if (!user || !reviewTargetRequestId) return toast("Erreur");
    if (!reviewSelectedRating) return toast("Choisissez une note");
    let req = myRequestsCache[reviewTargetRequestId];
    if (!req) {
        const { data } = await db.from("requests").select("*").eq("id", reviewTargetRequestId).maybeSingle();
        req = data;
    }
    if (!req) return toast("Demande introuvable");
    const { data: existing } = await db.from("reviews").select("id").eq("request_id", reviewTargetRequestId).maybeSingle();
    if (existing) return toast("Avis déjà envoyé");
    const comment = document.getElementById("reviewComment")?.value.trim() || "";
    const { error } = await db.from("reviews").insert({
        request_id: reviewTargetRequestId,
        provider_id: req.provider_id,
        client_id: user.id,
        rating: reviewSelectedRating,
        comment: comment || null
    });
    if (error) return toast("Erreur : " + error.message);
    toast("Merci pour votre avis !");
    reviewTargetRequestId = null;
    showPage("myRequests");
}

/* ========== SOS ========== */

function openSOS() {
    if (!user) {
        toast("Connectez-vous pour une urgence");
        showPage("login");
        return;
    }
    document.getElementById("sosCategory").value = "";
    document.getElementById("sosDescription").value = "";
    document.getElementById("sosLocation").value = "";
    showPage("sos");
}

async function sendSOS() {
    const category = document.getElementById("sosCategory").value;
    const description = document.getElementById("sosDescription").value.trim();
    const location = document.getElementById("sosLocation").value.trim();
    if (!category) return toast("Choisissez le type d'urgence");
    if (!description) return toast("Décrivez l'urgence");
    if (!location) return toast("Indiquez le lieu");

    let query = db.from("providers").select("id,name,phone").eq("available", true).limit(1);
    if (category !== "Autre") query = query.eq("category", category);
    const { data: candidates } = await query;
    const provider = candidates?.[0];
    if (!provider) return toast("Aucun prestataire disponible pour cette urgence");

    const { error } = await db.from("requests").insert({
        client_id: user.id,
        client_name: user.name,
        client_phone: user.phone,
        provider_id: provider.id,
        provider_name: provider.name,
        category,
        description: "[URGENCE] " + description,
        location,
        status: "envoyée",
        is_sos: true
    });
    if (error) {
        console.error(error);
        return toast("Erreur lors de l'envoi");
    }
    toast("Urgence envoyée !");
    showPage("myRequests");
}

/* ========== DASHBOARD ========== */

async function displayDashboard() {
    const box = document.getElementById("dashboardContent");
    if (!box) return;
    if (!user) {
        box.innerHTML = `<div class="card" style="text-align:center;">
            <p class="muted" style="margin-bottom:12px;">Connectez-vous</p>
            <button class="btn-primary full" onclick="showPage('login')">Se connecter</button></div>`;
        return;
    }
    const { data: p } = await db.from("providers").select("*").eq("user_id", user.id).maybeSingle();
    if (!p) {
        box.innerHTML = `<div class="card" style="text-align:center;">
            <p class="muted" style="margin-bottom:12px;">Complétez votre profil prestataire</p>
            <button class="btn-primary full" onclick="openEditProvider()">Créer mon profil</button></div>`;
        return;
    }

    // Expiration soft
    const now = Date.now();
    let status = p.subscription_status || "trial";
    if (status === "trial" && p.trial_ends_at && new Date(p.trial_ends_at).getTime() < now) status = "expired";
    if (status === "active" && p.subscription_renews_at && new Date(p.subscription_renews_at).getTime() < now) status = "expired";

    const trialEnd = p.trial_ends_at ? new Date(p.trial_ends_at).toLocaleDateString("fr-FR") : "—";
    let subLabel = "";
    let subColor = "var(--ink-soft)";
    if (status === "trial") {
        subLabel = `Essai gratuit jusqu'au ${trialEnd}`;
        subColor = "#B45309";
    } else if (status === "active") {
        subLabel = `Abonnement actif${p.subscription_plan ? " · " + p.subscription_plan : ""}`;
        subColor = "var(--green)";
    } else {
        subLabel = "Abonnement expiré";
        subColor = "#B91C1C";
    }

    const { count: pendingCount } = await db.from("requests")
        .select("id", { count: "exact", head: true })
        .eq("provider_id", p.id)
        .eq("status", "envoyée");

    box.innerHTML = `
        <div class="card">
            <h3 style="margin-bottom:4px;">${escapeHTML(p.name)}</h3>
            <p class="muted">${escapeHTML(p.category)} · ${escapeHTML(p.city || "")}</p>
            <p style="margin-top:10px;font-weight:600;color:${subColor};">${subLabel}</p>
            ${status === "trial" || status === "expired" ? `
                <button class="btn-secondary full" style="margin-top:12px;" onclick="requestSubscription('mensuel')">
                    Demander l'abonnement mensuel
                </button>` : ""}
        </div>
        <div class="stats-grid" style="margin-top:12px;">
            <div class="stat-card"><div class="number">${p.rating != null ? Number(p.rating).toFixed(1) : "—"}</div><div class="label">Note</div></div>
            <div class="stat-card"><div class="number">${p.completed_requests || 0}</div><div class="label">Missions</div></div>
            <div class="stat-card"><div class="number">${pendingCount || 0}</div><div class="label">En attente</div></div>
            <div class="stat-card"><div class="number">${p.available ? "Oui" : "Non"}</div><div class="label">Disponible</div></div>
        </div>
        <div style="margin-top:12px;display:flex;flex-direction:column;gap:8px;">
            <button class="btn-primary full" onclick="openEditProvider()">Mon profil</button>
            <button class="btn-secondary full" onclick="showPage('receivedRequests')">Demandes reçues</button>
        </div>`;
}

async function requestSubscription(plan) {
    if (!user) return toast("Connectez-vous");
    const { data: p } = await db.from("providers").select("id").eq("user_id", user.id).maybeSingle();
    if (!p) return toast("Profil introuvable");
    const { error } = await db.from("providers").update({
        subscription_requested_plan: plan || "mensuel",
        subscription_requested_at: new Date().toISOString()
    }).eq("id", p.id);
    if (error) return toast("Erreur : " + error.message);
    toast("Demande envoyée. L'admin vous contactera.");
    displayDashboard();
}

/* ========== MESSAGERIE ========== */

async function getUnreadMessagesCount() {
    if (!user) return 0;
    const { count, error } = await db.from("messages").select("id", { count: "exact", head: true })
        .eq("receiver_id", user.id).eq("read", false);
    if (error) return 0;
    return count || 0;
}

async function updateMessageBadge() {
    const count = await getUnreadMessagesCount();
    document.querySelectorAll('.nav-item[data-page="messages"]').forEach(btn => {
        let badge = btn.querySelector(".nav-badge");
        if (count > 0) {
            if (!badge) {
                badge = document.createElement("span");
                badge.className = "nav-badge";
                btn.appendChild(badge);
            }
            badge.textContent = count > 9 ? "9+" : String(count);
        } else if (badge) badge.remove();
    });
}

async function markConversationRead() {
    if (!user || !currentConversation) return;
    await db.from("messages").update({ read: true })
        .eq("sender_id", currentConversation.otherId)
        .eq("receiver_id", user.id)
        .eq("read", false);
    updateMessageBadge();
}

async function loadMessages() {
    const box = document.getElementById("messagesContent");
    if (!box) return;
    if (!user) {
        box.innerHTML = `<div class="empty-state"><p>Connectez-vous</p>
            <button class="btn-primary" style="margin-top:12px;" onclick="showPage('login')">Se connecter</button></div>`;
        return;
    }
    box.innerHTML = `<div class="empty-state"><p>Chargement...</p></div>`;
    const { data, error } = await db.from("messages").select("*")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false }).limit(100);
    if (error) {
        box.innerHTML = `<div class="empty-state"><p>Erreur</p></div>`;
        return;
    }
    if (!data?.length) {
        box.innerHTML = `<div class="empty-state"><i data-lucide="message-circle"></i><p>Aucun message</p></div>`;
        if (window.lucide) lucide.createIcons();
        return;
    }
    const map = new Map();
    for (const m of data) {
        const otherId = m.sender_id === user.id ? m.receiver_id : m.sender_id;
        if (!map.has(otherId)) map.set(otherId, m);
    }
    const otherIds = [...map.keys()];
    const { data: usersData } = await db.from("users").select("id,name").in("id", otherIds);
    const nameById = {};
    (usersData || []).forEach(u => { nameById[u.id] = u.name; });

    box.innerHTML = otherIds.map(otherId => {
        const last = map.get(otherId);
        const name = nameById[otherId] || "Utilisateur";
        const preview = last.body.length > 40 ? last.body.slice(0, 40) + "…" : last.body;
        const safe = escapeHTML(name).replace(/'/g, "\\'");
        return `<div class="card" style="cursor:pointer;"
            onclick="openConversation('${otherId}','${safe}',${last.request_id ? `'${last.request_id}'` : "null"})">
            <h3 style="margin-bottom:4px;">${escapeHTML(name)}</h3>
            <p class="muted" style="font-size:0.85rem;">${escapeHTML(preview)}</p>
        </div>`;
    }).join("");
}

async function openConversation(otherId, otherName, requestId) {
    if (!user) return showPage("login");
    currentConversation = { otherId, otherName: otherName || "Conversation", requestId: requestId || null };
    const title = document.getElementById("conversationTitle");
    if (title) title.textContent = otherName || "Conversation";
    const input = document.getElementById("messageInput");
    if (input) input.value = "";
    showPage("conversation");
    await refreshConversation();
    await markConversationRead();
}

async function refreshConversation() {
    const box = document.getElementById("conversationMessages");
    if (!box || !currentConversation || !user) return;
    const otherId = currentConversation.otherId;
    const { data, error } = await db.from("messages").select("*")
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${user.id})`)
        .order("created_at", { ascending: true }).limit(100);
    if (error) {
        box.innerHTML = `<div class="empty-state"><p>Erreur</p></div>`;
        return;
    }
    if (!data?.length) {
        box.innerHTML = `<div class="empty-state"><p>Aucun message. Écrivez le premier.</p></div>`;
        return;
    }
    box.innerHTML = data.map(m => {
        const mine = m.sender_id === user.id;
        return `<div class="chat-bubble ${mine ? "mine" : "theirs"}">
            ${escapeHTML(m.body)}
            <div class="chat-time">${new Date(m.created_at).toLocaleString("fr-FR")}</div>
        </div>`;
    }).join("");
    box.scrollTop = box.scrollHeight;
}

async function sendMessage() {
    if (!user || !currentConversation) return toast("Erreur");
    const body = document.getElementById("messageInput")?.value.trim();
    if (!body) return toast("Écrivez un message");
    const { error } = await db.from("messages").insert({
        sender_id: user.id,
        receiver_id: currentConversation.otherId,
        request_id: currentConversation.requestId || null,
        body
    });
    if (error) return toast("Erreur : " + error.message);
    document.getElementById("messageInput").value = "";
    await refreshConversation();
}

async function startChatFromRequest(requestId, otherId, otherName) {
    await openConversation(otherId, otherName, requestId);
}

/* ========== NOTIFS ========== */

async function requestBrowserNotifications() {
    if (!("Notification" in window)) return false;
    if (Notification.permission === "granted") return true;
    if (Notification.permission === "denied") return false;
    return (await Notification.requestPermission()) === "granted";
}

function showBrowserNotification(title, body) {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    try {
        new Notification(title, { body: body || "", icon: "icon-192.png", tag: "fasoservice-msg" });
    } catch (e) { console.error(e); }
}

async function pollUnreadMessages() {
    if (!user) return;
    const count = await getUnreadMessagesCount();
    if (count > lastUnreadCount && lastUnreadCount >= 0) {
        showBrowserNotification("FasoService", count === 1 ? "Nouveau message" : `${count} nouveaux messages`);
    }
    lastUnreadCount = count;
    updateMessageBadge();
}

function startMessagePolling() {
    if (window._msgPoll) clearInterval(window._msgPoll);
    window._msgPoll = setInterval(pollUnreadMessages, 20000);
}

/* ========== ANNONCES ========== */

async function loadAnnouncement() {
    const box = document.getElementById("announcementBanner");
    if (!box) return;
    const { data } = await db.from("announcements").select("*").order("created_at", { ascending: false }).limit(1);
    if (!data?.length) {
        box.style.display = "none";
        box.innerHTML = "";
        return;
    }
    box.style.display = "block";
    box.innerHTML = `<div class="card" style="margin-bottom:0;">
        <p style="font-size:0.88rem;line-height:1.4;"><strong style="color:var(--green);">Annonce</strong> — ${escapeHTML(data[0].text)}</p>
    </div>`;
}

async function loadAdminAnnouncements() {
    if (!user?.is_admin) return toast("Réservé au propriétaire");
    const box = document.getElementById("adminList");
    if (!box) return;
    const { data } = await db.from("announcements").select("*").order("created_at", { ascending: false }).limit(20);
    box.innerHTML = `
        <div class="card" style="margin-bottom:10px;">
            <h3 style="margin-bottom:8px;">Nouvelle annonce</h3>
            <textarea id="newAnnouncement" rows="3" placeholder="Texte de l'annonce..."></textarea>
            <button class="btn-primary full" style="margin-top:10px;" onclick="createAnnouncement()">Publier</button>
        </div>
        ${(data || []).map(a => `
            <div class="admin-item">
                <p>${escapeHTML(a.text)}</p>
                <p class="muted" style="margin-top:4px;font-size:0.78rem;">${new Date(a.created_at).toLocaleString("fr-FR")}</p>
                <div class="admin-actions">
                    <button class="btn-secondary" style="color:#B91C1C;border-color:#FECACA;" onclick="deleteAnnouncement('${a.id}')">Supprimer</button>
                </div>
            </div>`).join("") || `<div class="empty-state"><p>Aucune annonce</p></div>`}`;
}

async function createAnnouncement() {
    if (!user?.is_admin) return;
    const text = document.getElementById("newAnnouncement")?.value.trim();
    if (!text) return toast("Écrivez une annonce");
    const { error } = await db.from("announcements").insert({ text });
    if (error) return toast("Erreur");
    toast("Publiée");
    loadAdminAnnouncements();
    loadAnnouncement();
}

async function deleteAnnouncement(id) {
    if (!user?.is_admin || !confirm("Supprimer ?")) return;
    await db.from("announcements").delete().eq("id", id);
    toast("Supprimée");
    loadAdminAnnouncements();
    loadAnnouncement();
}

/* ========== ADMIN ========== */

async function displayAdminDashboard() {
    const statsBox = document.getElementById("adminStats");
    const listBox = document.getElementById("adminList");
    if (!statsBox || !listBox) return;
    if (!user?.is_admin) {
        listBox.innerHTML = `<div class="empty-state"><p>Accès réservé</p></div>`;
        return;
    }    listBox.innerHTML = "";
    const [usersRes, providersRes, requestsRes] = await Promise.all([
        db.from("users").select("id,role,suspended,is_moderator"),
        db.from("providers").select("id"),
        db.from("requests").select("id,status,is_sos")
    ]);
    const users = usersRes.data || [];
    const requests = requestsRes.data || [];
    statsBox.innerHTML = `
        <div class="stat-card"><div class="number">${users.length}</div><div class="label">Utilisateurs</div></div>
        <div class="stat-card"><div class="number">${(providersRes.data || []).length}</div><div class="label">Prestataires</div></div>
        <div class="stat-card"><div class="number">${requests.length}</div><div class="label">Demandes</div></div>
        <div class="stat-card"><div class="number">${requests.filter(r => r.status === "envoyée").length}</div><div class="label">En attente</div></div>
        <div class="stat-card"><div class="number">${requests.filter(r => r.is_sos).length}</div><div class="label">SOS</div></div>
        <div class="stat-card"><div class="number">${users.filter(u => u.is_moderator).length}</div><div class="label">Modérateurs</div></div>`;
}

async function loadAdminUsers() {
    if (!hasPermission("view_users")) return toast("Permission refusée");
    const box = document.getElementById("adminList");
    const { data } = await db.from("users").select("*").order("created_at", { ascending: false }).limit(50);
    box.innerHTML = (data || []).map(u => `
        <div class="admin-item">
            <h4>${escapeHTML(u.name || "")} <span class="badge-role">${escapeHTML(u.role || "")}</span>
            ${u.is_admin ? '<span class="badge-role">Admin</span>' : ""}
            ${u.is_moderator ? '<span class="badge-role">Modo</span>' : ""}
            ${u.suspended ? '<span class="badge-role badge-suspended">Suspendu</span>' : ""}</h4>
            <p class="muted">${escapeHTML(u.phone || "")} · ${escapeHTML(u.city || "")}</p>
            <div class="admin-actions">
                ${hasPermission("suspend_user") ? `<button class="btn-secondary" onclick="toggleSuspendUser('${u.id}', ${!u.suspended})">${u.suspended ? "Réactiver" : "Suspendre"}</button>` : ""}
            </div>
        </div>`).join("") || `<div class="empty-state"><p>Aucun</p></div>`;
}

async function loadAdminProviders() {
    if (!hasPermission("view_providers")) return toast("Permission refusée");
    const box = document.getElementById("adminList");
    const { data } = await db.from("providers").select("*").order("created_at", { ascending: false }).limit(50);
    box.innerHTML = (data || []).map(p => `
        <div class="admin-item">
            <h4>${escapeHTML(p.name)} ${p.verified ? '<span class="badge-verified">✓</span>' : ""}</h4>
            <p class="muted">${escapeHTML(p.category)} · ${escapeHTML(p.city || "")}</p>
            <div class="admin-actions">
                ${hasPermission("validate_provider") ? `
                    <button class="btn-secondary" onclick="toggleVerifyProvider('${p.id}', ${!p.verified})">
                        ${p.verified ? "Retirer vérifié" : "Valider"}
                    </button>` : ""}
            </div>
        </div>`).join("") || `<div class="empty-state"><p>Aucun</p></div>`;
}

async function loadAdminRequests() {
    if (!hasPermission("view_requests")) return toast("Permission refusée");
    const box = document.getElementById("adminList");
    const { data } = await db.from("requests").select("*").order("created_at", { ascending: false }).limit(50);
    box.innerHTML = (data || []).map(r => `
        <div class="admin-item">
            <h4>${escapeHTML(r.client_name || "")} → ${escapeHTML(r.provider_name || "")}</h4>
            <p class="muted">${escapeHTML(r.category || "")} · ${escapeHTML(r.status || "")}${r.is_sos ? " · SOS" : ""}</p>
            <p style="font-size:0.88rem;margin-top:4px;">${escapeHTML(r.description || "")}</p>
        </div>`).join("") || `<div class="empty-state"><p>Aucune</p></div>`;
}

async function loadAdminModerators() {
    if (!user?.is_admin) return toast("Réservé au propriétaire");
    const box = document.getElementById("adminList");
    const { data } = await db.from("users").select("*").eq("is_moderator", true);
    box.innerHTML = `
        <div class="card" style="margin-bottom:10px;">
            <h3 style="margin-bottom:8px;">Ajouter un modérateur</h3>
            <input id="modPhone" type="tel" placeholder="64 00 00 00">
            <button class="btn-primary full" style="margin-top:10px;" onclick="promoteModerator()">Nommer</button>
        </div>
        ${(data || []).map(m => `
            <div class="admin-item">
                <h4>${escapeHTML(m.name || "")}</h4>
                <p class="muted">${escapeHTML(m.phone || "")}</p>
                <div class="admin-actions">
                    <button class="btn-secondary" onclick="editModeratorPermissions('${m.id}')">Permissions</button>
                    <button class="btn-secondary" style="color:#B91C1C;" onclick="demoteModerator('${m.id}')">Retirer</button>
                </div>
            </div>`).join("") || `<div class="empty-state"><p>Aucun modérateur</p></div>`}`;
}

async function promoteModerator() {
    if (!user?.is_admin) return;
    const digits = normalizePhone(document.getElementById("modPhone").value).slice(-8);
    if (digits.length !== 8) return toast("8 chiffres requis");
    const { data: all } = await db.from("users").select("id,phone");
    const match = (all || []).find(u => normalizePhone(u.phone).slice(-8) === digits);
    if (!match) return toast("Utilisateur introuvable");
    const { error } = await db.rpc("admin_update_user", { target_user_id: match.id, new_is_moderator: true, new_permissions: DEFAULT_MOD_PERMISSIONS, new_suspended: null });
    if (error) return toast("Erreur : " + error.message);
    toast("Modérateur ajouté");
    loadAdminModerators();
}

async function demoteModerator(userId) {
    if (!user?.is_admin) return;
    const { error } = await db.rpc("admin_update_user", { target_user_id: userId, new_is_moderator: false, new_permissions: null, new_suspended: null });
    if (error) return toast("Erreur : " + error.message);
    toast("Retiré");
    loadAdminModerators();
}

async function editModeratorPermissions(userId) {
    if (!user?.is_admin) return;
    const { data } = await db.from("users").select("*").eq("id", userId).maybeSingle();
    if (!data) return;
    const p = data.permissions || DEFAULT_MOD_PERMISSIONS;
    document.getElementById("adminList").innerHTML = `
        <div class="card">
            <h3 style="margin-bottom:10px;">Permissions — ${escapeHTML(data.name || data.phone)}</h3>
            ${Object.keys(DEFAULT_MOD_PERMISSIONS).map(key => `
                <label style="display:flex;align-items:center;gap:8px;margin:6px 0;">
                    <input type="checkbox" id="perm_${key}" ${p[key] ? "checked" : ""}>
                    <span>${key}</span>
                </label>`).join("")}
            <button class="btn-primary full" style="margin-top:12px;" onclick="saveModeratorPermissions('${userId}')">Enregistrer</button>
            <button class="btn-secondary full" style="margin-top:8px;" onclick="loadAdminModerators()">Retour</button>
        </div>`;
}

async function saveModeratorPermissions(userId) {
    if (!user?.is_admin) return;
    const permissions = {};
    Object.keys(DEFAULT_MOD_PERMISSIONS).forEach(key => {
        permissions[key] = !!document.getElementById("perm_" + key)?.checked;
    });
    const { error } = await db.rpc("admin_update_user", { target_user_id: userId, new_is_moderator: true, new_permissions: permissions, new_suspended: null });
    if (error) return toast("Erreur : " + error.message);
    toast("Permissions mises à jour");
    loadAdminModerators();
}

async function toggleSuspendUser(userId, suspend) {
    if (!hasPermission("suspend_user")) return toast("Permission refusée");
    const { error } = await db.rpc("staff_suspend_user", { target_user_id: userId, new_suspended: !!suspend });
    if (error) return toast("Erreur : " + error.message);
    toast(suspend ? "Suspendu" : "Réactivé");
    loadAdminUsers();
}

async function toggleVerifyProvider(providerId, verify) {
    if (!hasPermission("validate_provider")) return toast("Permission refusée");
    await db.from("providers").update({ verified: !!verify }).eq("id", providerId);
    toast(verify ? "Prestataire vérifié" : "Badge retiré");
    loadAdminProviders();
}

async function loadSubscriptionRequests() {
    if (!user?.is_admin) return toast("Réservé au propriétaire");
    const box = document.getElementById("adminList");
    const { data } = await db.from("providers").select("*")
        .not("subscription_requested_at", "is", null)
        .order("subscription_requested_at", { ascending: false });
    if (!data?.length) {
        box.innerHTML = `<div class="empty-state"><p>Aucune demande</p></div>`;
        return;
    }
    box.innerHTML = data.map(p => `
        <div class="admin-item">
            <h4>${escapeHTML(p.name)}</h4>
            <p class="muted">${escapeHTML(p.category)} · ${escapeHTML(p.city || "")}</p>
            <p class="muted">Plan : ${escapeHTML(p.subscription_requested_plan || "mensuel")}</p>
            <div class="admin-actions">
                <button class="btn-primary" onclick="activateSubscription('${p.id}')">Activer</button>
                <button class="btn-secondary" onclick="clearSubscriptionRequest('${p.id}')">Ignorer</button>
            </div>
        </div>`).join("");
}

async function activateSubscription(providerId) {
    if (!user?.is_admin) return;
    const renews = new Date();
    renews.setMonth(renews.getMonth() + 1);
    await db.from("providers").update({
        subscription_status: "active",
        subscription_plan: "mensuel",
        subscription_renews_at: renews.toISOString(),
        subscription_requested_plan: null,
        subscription_requested_at: null
    }).eq("id", providerId);
    toast("Abonnement activé");
    loadSubscriptionRequests();
}

async function clearSubscriptionRequest(providerId) {
    if (!user?.is_admin) return;
    await db.from("providers").update({
        subscription_requested_plan: null,
        subscription_requested_at: null
    }).eq("id", providerId);
    toast("Ignorée");
    loadSubscriptionRequests();
}

/* ========== START ========== */

async function startApp() {
    renderCategories();
    renderBottomNav();
    await restoreSession();
    loadAnnouncement();
    showPage(user ? (user.role === "provider" ? "dashboard" : "home") : "home");
    if (user) {
        lastUnreadCount = await getUnreadMessagesCount();
        startMessagePolling();
        updateMessageBadge();
    }
    if (window.lucide) lucide.createIcons();
    console.log("FasoService — prêt");
}

startApp();
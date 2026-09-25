}

async function toggleVerifyProvider(providerId, verify) {
    providerId = safeId(providerId);
    if (!providerId) return;
    if (!hasPermission("validate_provider")) return toast("Permission refusée");
    const { error } = await db.rpc("admin_set_provider_verified", {
        target_provider_id: providerId,
        new_verified: !!verify
    });
    if (error) return toast("Erreur : " + error.message);
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
                <button class="btn-primary" onclick="activateSubscription('${safeId(p.id)}')">Activer</button>
                <button class="btn-secondary" onclick="clearSubscriptionRequest('${safeId(p.id)}')">Ignorer</button>
            </div>
        </div>`).join("");
}

async function activateSubscription(providerId) {
    providerId = safeId(providerId);
    if (!providerId) return;
    if (!user?.is_admin) return;
    const { error } = await db.rpc("admin_activate_subscription", {
        target_provider_id: providerId
    });
    if (error) return toast("Erreur : " + error.message);
    toast("Abonnement activé");
    loadSubscriptionRequests();
}

async function clearSubscriptionRequest(providerId) {
    providerId = safeId(providerId);
    if (!providerId) return;
    if (!user?.is_admin) return;
    const { error } = await db.rpc("admin_clear_subscription_request", {
        target_provider_id: providerId
    });
    if (error) return toast("Erreur : " + error.message);
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

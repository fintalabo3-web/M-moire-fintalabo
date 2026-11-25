/* FasoService — communauté, assistance et statistiques */
(function () {
  "use strict";
  const app = window.FSApp;
  if (!app || !app.db) return;
  const db = app.db;
  const faqs = [
    ["Qu'est-ce que FasoService ?", "FasoService facilite la mise en relation entre les clients et les professionnels de proximité au Burkina Faso."],
    ["Comment trouver un prestataire ?", "Depuis l'accueil, recherchez un métier, un nom ou une ville. Ouvrez un profil pour consulter les services, les tarifs, les photos et les moyens de contact."],
    ["Comment envoyer une demande ?", "Ouvrez le profil d'un prestataire, choisissez Demander un service, décrivez votre besoin et indiquez le lieu souhaité. Vous pourrez suivre la demande dans votre espace."],
    ["Comment devenir prestataire ?", "Créez un compte prestataire, complétez votre profil avec votre métier, votre ville, vos services et vos tarifs, puis rendez-vous dans votre tableau de bord."],
    ["Comment fonctionne le service SOS ?", "Le bouton Besoin urgent permet de décrire une urgence et de transmettre une demande. Indiquez clairement le quartier et la nature du problème."],
    ["FasoService est-il gratuit ?", "La recherche et la mise en relation sont accessibles depuis l'application. Les conditions des prestations sont à convenir directement avec le professionnel."],
    ["Comment protéger mon compte ?", "Ne partagez jamais votre mot de passe. Utilisez un mot de passe unique et contactez l'équipe si vous remarquez une activité inhabituelle."],
    ["Comment signaler un problème ?", "Utilisez le formulaire Contacter FasoService. Décrivez le problème et laissez un numéro permettant à l'équipe de vous répondre."]
  ];
  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];
    });
  }
  function notify(message) {
    if (typeof window.toast === "function") window.toast(message);
    else {
      const box = document.getElementById("toastContainer");
      if (!box) return;
      const el = document.createElement("div"); el.className = "toast"; el.textContent = message;
      box.appendChild(el); setTimeout(function () { el.remove(); }, 3200);
    }
  }
  function fmt(date) {
    try { return new Date(date).toLocaleDateString("fr-FR", {day:"2-digit",month:"short",year:"numeric"}); }
    catch (_) { return ""; }
  }
  function requireUser() {
    const current = app.getUser();
    if (!current) { notify("Connectez-vous pour participer."); if (window.showPage) window.showPage("login"); return null; }
    return current;
  }

  window.trackFasoVisit = async function (pagePath) {
    try {
      const pageKey = String(pagePath || "home").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80) || "home";
      const sessionKey = "fs_visit_recorded:" + pageKey;
      if (sessionStorage.getItem(sessionKey)) return;
      let visitor = localStorage.getItem("fs_visitor_key");
      if (!visitor) {
        visitor = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : "fs-" + Date.now().toString(36) + Math.random().toString(36).slice(2);
        localStorage.setItem("fs_visitor_key", visitor);
      }
      const current = app.getUser();
      const payload = {visitor_key:visitor,path:pageKey};
      if (current && current.id) payload.user_id = current.id;
      const result = await db.from("site_visits").insert(payload);
      if (!result.error) sessionStorage.setItem(sessionKey, "1");
      else console.warn("FasoService visit tracking:", result.error.message);
    } catch (error) { console.warn("FasoService visit tracking unavailable:", error); }
  };

  window.shareFasoService = async function () {
    const shareData = {title:"FasoService",text:"Trouvez un professionnel de confiance près de chez vous au Burkina Faso.",url:"https://fasoservice.netlify.app/"};
    try {
      if (navigator.share) await navigator.share(shareData);
      else if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareData.url); notify("Lien de FasoService copié !");
      } else {
        const input = document.createElement("textarea"); input.value = shareData.url;
        document.body.appendChild(input); input.select(); document.execCommand("copy"); input.remove();
        notify("Lien de FasoService copié !");
      }
    } catch (error) { if (error && error.name !== "AbortError") notify("Impossible de partager pour le moment."); }
  };

  window.loadFasoFAQ = function () {
    const box = document.getElementById("faqList"); if (!box) return;
    box.innerHTML = faqs.map(function (item, i) {
      return '<article class="faq-item"><button class="faq-question" type="button" aria-expanded="false" aria-controls="faq-answer-' + i + '" onclick="toggleFasoFAQ(' + i + ')"><span>' + esc(item[0]) + '</span><i data-lucide="chevron-down"></i></button><div class="faq-answer" id="faq-answer-' + i + '" hidden>' + esc(item[1]) + '</div></article>';
    }).join("");
    if (window.lucide) lucide.createIcons();
  };
  window.toggleFasoFAQ = function (index) {
    const answer = document.getElementById("faq-answer-" + index);
    const button = answer && answer.previousElementSibling; if (!answer || !button) return;
    const open = answer.hidden; answer.hidden = !open; button.setAttribute("aria-expanded", String(open));
    const icon = button.querySelector("i"); if (icon) icon.setAttribute("data-lucide", open ? "chevron-up" : "chevron-down");
    if (window.lucide) lucide.createIcons();
  };

  window.initFasoContact = function () {
    const current = app.getUser();
    const name = document.getElementById("supportName"), phone = document.getElementById("supportPhone");
    if (current && name && !name.value) name.value = current.name || "";
    if (current && phone && !phone.value) phone.value = current.phone || "";
  };
  window.submitFasoContact = async function (event) {
    event.preventDefault();
    const form = document.getElementById("supportForm"), button = document.getElementById("supportSubmit"), feedback = document.getElementById("supportFeedback");
    if (!form || !button) return;
    const name = document.getElementById("supportName").value.trim();
    const phone = document.getElementById("supportPhone").value.trim();
    const message = document.getElementById("supportMessage").value.trim();
    if (name.length < 2 || phone.replace(/\D/g, "").length < 6 || message.length < 10) {
      if (feedback) feedback.textContent = "Vérifiez les champs : message de 10 caractères minimum."; return;
    }
    button.disabled = true; button.textContent = "Envoi en cours…";
    try {
      const website = document.getElementById("supportWebsite")?.value || "";
      const result = await db.rpc("submit_support_message", {new_name:name,new_phone:phone,new_message:message,new_website:website});
      if (result.error) throw result.error;
      form.reset(); if (feedback) feedback.textContent = "Votre message a bien été transmis. Merci de nous avoir contactés.";
    } catch (error) {
      console.error(error); if (feedback) feedback.textContent = error.message || "Envoi impossible. Réessayez plus tard.";
    } finally { button.disabled = false; button.textContent = "Envoyer mon message"; }
  };

  window.loadIdeasFeed = async function () {
    const feed = document.getElementById("ideasFeed"), composer = document.getElementById("ideaComposer");
    if (!feed || !composer) return;
    const current = app.getUser();
    composer.innerHTML = current
      ? '<h3>Proposer une idée</h3><label for="ideaTitle">Titre de votre idée</label><input id="ideaTitle" maxlength="140" placeholder="Ex. : Ajouter une catégorie de service"><label for="ideaBody">Expliquez votre proposition</label><textarea id="ideaBody" rows="4" maxlength="3000" placeholder="Décrivez votre idée (10 caractères minimum)…"></textarea><button class="btn-primary full" type="button" onclick="submitFasoIdea()">Publier mon idée</button><small class="muted">Votre nom de profil sera associé à la publication.</small>'
      : '<h3>Vous avez une idée ?</h3><p class="muted">Connectez-vous pour proposer une amélioration à la communauté.</p><button class="btn-primary full" onclick="showPage(\'login\')">Se connecter</button>';
    feed.innerHTML = '<div class="empty-state"><p>Chargement des idées…</p></div>';
    const postResult = await db.from("idea_posts").select("id,title,body,author_id,author_name,created_at").order("created_at",{ascending:false}).limit(40);
    if (postResult.error) { feed.innerHTML = '<div class="empty-state"><p>Impossible de charger les idées pour le moment.</p></div>'; return; }
    const posts = postResult.data || [];
    if (!posts.length) { feed.innerHTML = '<div class="empty-state"><p>Aucune idée publiée pour le moment. Soyez le premier à contribuer !</p></div>'; return; }
    const ids = posts.map(function (p) { return p.id; });
    const results = await Promise.all([
      db.from("idea_likes").select("post_id").in("post_id",ids),
      db.from("idea_comments").select("id,post_id,author_name,body,created_at").in("post_id",ids).order("created_at",{ascending:true}),
      current ? db.from("idea_likes").select("post_id").eq("user_id",current.id).in("post_id",ids) : Promise.resolve({data:[],error:null})
    ]);
    const likes = results[0].data || [], comments = results[1].data || [], mine = new Set((results[2].data || []).map(function (x) { return x.post_id; }));
    feed.innerHTML = posts.map(function (post) {
      const postComments = comments.filter(function (c) { return c.post_id === post.id; });
      const count = likes.filter(function (l) { return l.post_id === post.id; }).length;
      const commentHtml = postComments.slice(-4).map(function (c) { return '<div class="idea-comment"><strong>' + esc(c.author_name || "Membre") + '</strong><span>' + esc(c.body) + '</span></div>'; }).join("");
      const commentForm = current
        ? '<form class="idea-comment-form" onsubmit="submitFasoIdeaComment(event,\'' + post.id + '\')"><input name="body" maxlength="1000" required placeholder="Ajouter un commentaire…"><button type="submit" aria-label="Envoyer">↗</button></form>'
        : '<button class="link-btn" onclick="showPage(\'login\')">Connectez-vous pour commenter</button>';
      return '<article class="idea-card"><div class="idea-card-head"><span class="idea-author">' + esc(post.author_name || "Membre FasoService") + '</span><time class="idea-date">' + fmt(post.created_at) + '</time></div><h3>' + esc(post.title) + '</h3><div class="idea-body">' + esc(post.body) + '</div><div class="idea-actions"><button class="idea-action ' + (mine.has(post.id) ? "active" : "") + '" onclick="toggleFasoIdeaLike(\'' + post.id + '\')">' + (mine.has(post.id) ? "♥" : "♡") + ' ' + count + ' J\'aime</button><span class="muted">' + postComments.length + ' commentaire(s)</span></div><div class="idea-comments">' + (commentHtml || '<p class="muted">Pas encore de commentaire.</p>') + commentForm + '</div></article>';
    }).join("");
  };

  window.submitFasoIdea = async function () {
    if (!requireUser()) return;
    const title = document.getElementById("ideaTitle")?.value.trim() || "";
    const body = document.getElementById("ideaBody")?.value.trim() || "";
    if (title.length < 4 || body.length < 10) return notify("Ajoutez un titre et une description suffisamment détaillée.");
    const result = await db.from("idea_posts").insert({title:title,body:body});
    if (result.error) { console.error(result.error); return notify(result.error.message || "Publication impossible."); }
    notify("Votre idée a été publiée."); await window.loadIdeasFeed();
  };
  window.toggleFasoIdeaLike = async function (postId) {
    const current = requireUser(); if (!current) return;
    const found = await db.from("idea_likes").select("post_id").eq("post_id",postId).eq("user_id",current.id).maybeSingle();
    if (found.error) return notify("Impossible de modifier le J'aime.");
    const result = found.data
      ? await db.from("idea_likes").delete().eq("post_id",postId).eq("user_id",current.id)
      : await db.from("idea_likes").insert({post_id:postId,user_id:current.id});
    if (result.error) return notify("Cette action n'a pas abouti.");
    await window.loadIdeasFeed();
  };
  window.submitFasoIdeaComment = async function (event, postId) {
    event.preventDefault(); if (!requireUser()) return;
    const body = String(new FormData(event.currentTarget).get("body") || "").trim();
    if (body.length < 2) return;
    const result = await db.from("idea_comments").insert({post_id:postId,body:body});
    if (result.error) return notify(result.error.message || "Commentaire impossible.");
    await window.loadIdeasFeed();
  };

  window.loadVisitorAnalytics = async function () {
    const box = document.getElementById("visitorAnalytics"), current = app.getUser();
    if (!box || !current || !current.is_admin) return;
    box.hidden = false; box.innerHTML = "<h3>Audience FasoService</h3><p class='muted'>Chargement des statistiques…</p>";
    const result = await db.rpc("get_admin_visit_stats");
    if (result.error || !result.data) { box.innerHTML = "<h3>Audience FasoService</h3><p class='muted'>Statistiques temporairement indisponibles.</p>"; return; }
    const data = result.data, daily = data.daily || [];
    const max = Math.max(1, ...daily.map(function (d) { return Number(d.visits) || 0; }));
    const bars = daily.map(function (d) {
      const value = Number(d.visits) || 0, height = Math.max(3,value / max * 76);
      return '<div class="visitor-bar-wrap"><strong>' + value + '</strong><div class="visitor-bar" style="height:' + height + 'px"></div><span>' + new Date(d.day).toLocaleDateString("fr-FR",{weekday:"short"}) + '</span></div>';
    }).join("");
    const pages = (data.top_pages || []).map(function (p) {
      return '<div class="visitor-page-row"><span>' + esc(p.path) + '</span><strong>' + Number(p.visits).toLocaleString("fr-FR") + '</strong></div>';
    }).join("");
    box.innerHTML = '<div class="section-header"><div><span class="section-kicker">Audience</span><h3>Statistiques des visiteurs</h3></div><button class="link-btn" onclick="loadVisitorAnalytics()">Actualiser</button></div><div class="visitor-grid"><div class="visitor-stat"><strong>' + Number(data.total).toLocaleString("fr-FR") + '</strong><span>Visites cumulées</span></div><div class="visitor-stat"><strong>' + Number(data.today).toLocaleString("fr-FR") + '</strong><span>Aujourd\'hui</span></div><div class="visitor-stat"><strong>' + Number(data.last7).toLocaleString("fr-FR") + '</strong><span>7 derniers jours</span></div><div class="visitor-stat"><strong>' + Number(data.last30).toLocaleString("fr-FR") + '</strong><span>30 derniers jours</span></div></div><p class="muted" style="font-size:.75rem;margin:10px 0 0">Visiteurs distincts estimés : ' + Number(data.unique_visitors).toLocaleString("fr-FR") + '</p><div class="visitor-chart">' + bars + '</div><h4>Pages les plus consultées</h4><div class="visitor-pages">' + (pages || "<p class='muted'>Pas encore de données.</p>") + '</div>';
  };

  window.loadSupportInbox = async function () {
    const current = app.getUser(), box = document.getElementById("adminList");
    if (!current || !current.is_admin || !box) return notify("Accès réservé au propriétaire.");
    box.innerHTML = "<div class='empty-state'><p>Chargement des messages…</p></div>";
    const result = await db.from("support_messages").select("*").order("created_at",{ascending:false}).limit(60);
    if (result.error) { box.innerHTML = "<div class='empty-state'><p>Impossible de charger les messages.</p></div>"; return; }
    const rows = result.data || [];
    if (!rows.length) { box.innerHTML = "<div class='empty-state'><p>Aucun message reçu.</p></div>"; return; }
    box.innerHTML = rows.map(function (m) {
      return '<article class="support-admin-item"><div class="idea-card-head"><strong>' + esc(m.name) + '</strong><time class="idea-date">' + fmt(m.created_at) + '</time></div><p><a href="tel:' + esc(m.phone) + '">' + esc(m.phone) + '</a></p><p>' + esc(m.message) + '</p><label>État de traitement <select onchange="updateSupportStatus(\'' + m.id + '\',this.value)"><option value="new" ' + (m.status==="new"?"selected":"") + '>Nouveau</option><option value="in_progress" ' + (m.status==="in_progress"?"selected":"") + '>En cours</option><option value="resolved" ' + (m.status==="resolved"?"selected":"") + '>Résolu</option></select></label></article>';
    }).join("");
  };
  window.updateSupportStatus = async function (id, status) {
    const current = app.getUser(); if (!current || !current.is_admin) return;
    const result = await db.from("support_messages").update({status:status}).eq("id",id);
    if (result.error) notify("Mise à jour impossible."); else notify("État du message mis à jour.");
  };

  window.loadFasoFavorites = async function () {
    const box = document.getElementById("fasoFavoritesList"), current = requireUser();
    if (!box || !current) return;
    box.innerHTML = "<p class='muted'>Chargement de vos favoris…</p>";
    const result = await db.from("favorites").select("provider_id,created_at,providers(id,name,category,city,photo_url,rating,verified)").eq("user_id",current.id).order("created_at",{ascending:false});
    if (result.error) { box.innerHTML = "<p class='muted'>Impossible de charger les favoris.</p>"; return; }
    const rows = (result.data || []).filter(function (x) { return x.providers; });
    if (!rows.length) { box.innerHTML = "<div class='empty-state'><p>Vous n'avez pas encore de favoris.</p></div>"; return; }
    box.innerHTML = rows.map(function (x) {
      return '<div class="card" style="margin:10px 0"><strong>' + esc(x.providers.name) + '</strong><p class="muted">' + esc(x.providers.category) + ' · ' + esc(x.providers.city || "") + '</p><button class="btn-primary" onclick="openPublicProfile(\'' + x.provider_id + '\')">Voir le profil</button><button class="btn-secondary" onclick="removeFasoFavorite(\'' + x.provider_id + '\')">Retirer</button></div>';
    }).join("");
  };
  window.toggleFasoFavorite = async function (providerId) {
    const current = requireUser(); if (!current) return;
    const found = await db.from("favorites").select("provider_id").eq("provider_id",providerId).eq("user_id",current.id).maybeSingle();
    if (found.error) return notify("Impossible de vérifier ce favori.");
    const result = found.data
      ? await db.from("favorites").delete().eq("provider_id",providerId).eq("user_id",current.id)
      : await db.from("favorites").insert({provider_id:providerId,user_id:current.id});
    if (result.error) return notify("Impossible de modifier ce favori.");
    notify(found.data ? "Prestataire retiré des favoris." : "Prestataire ajouté aux favoris.");
  };

  window.removeFasoFavorite = async function (providerId) {
    const current = requireUser(); if (!current) return;
    const result = await db.from("favorites").delete().eq("provider_id",providerId).eq("user_id",current.id);
    if (result.error) notify("Suppression impossible."); else window.loadFasoFavorites();
  };
})();

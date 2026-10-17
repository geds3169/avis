(function () {
  "use strict";
  var C = window.CONFIG, M = window.METIERS, A = window.AVIS;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var TITRES = ["Vos coordonnées", "Ce qui a été fait", "Votre appréciation", "Votre commentaire", "Vérifier et envoyer"];
  var MESSAGES = {
    cle: "Ce lien n’est plus valable. Demandez à " + (C.RESPONSABLE || "la personne concernée") + " de vous renvoyer le lien ou le QR code.",
    trop_rapide: "Le formulaire a été envoyé trop vite. Patientez quelques secondes puis appuyez de nouveau sur Envoyer.",
    robot: "Le test anti-robot a échoué. Merci de recommencer.",
    complet: "Le formulaire est très sollicité aujourd’hui et n’accepte plus d’avis pour le moment. Merci de revenir demain.",
    limite: "Plusieurs avis ont déjà été envoyés depuis cette connexion aujourd’hui. Merci de réessayer demain.",
    texte: "Votre commentaire contient un numéro, une adresse mail ou un lien. Merci de les retirer.",
    invalide: "Certaines informations sont incomplètes. Merci de vérifier le formulaire.",
    serveur: "L’enregistrement a échoué. Merci de réessayer dans quelques instants."
  };

  /* La clé d’accès est dans la partie de l’adresse après le # (jamais envoyée aux serveurs, absente de toute page publique) */
  var CLE = "";
  try { var mc = /[#&]c=([A-Za-z0-9_-]{16,64})/.exec(location.hash); CLE = mc ? mc[1] : ""; } catch (e) { CLE = ""; }
  if (!CLE) {
    $("#s-metier").classList.add("cache");
    $("#s-sans-cle").classList.remove("cache");
    return;
  }

  var etat = { metier: null, etape: 1, t0: 0, jeton: "", tsRendu: false, envoi: false };
  var cpt = 0;

  /* ---------- Choix du métier ---------- */
  $("#metier").addEventListener("change", function () {
    var aff = $("#affiche-metier");
    aff.textContent = this.options[this.selectedIndex].text;
    aff.classList.add("choisi");
    choisir(this.value);
  });

  try {
    var pre = new URLSearchParams(location.search).get("metier");
    if (pre && M[pre]) {
      var sel = $("#metier");
      sel.value = pre;
      var aff0 = $("#affiche-metier");
      aff0.textContent = sel.options[sel.selectedIndex].text;
      aff0.classList.add("choisi");
      setTimeout(function () { choisir(pre); }, 0);
    }
  } catch (e) { /* adresse sans option : on laisse le choix manuel */ }

  function choisir(k) {
    var m = M[k];
    if (!m) { return; }
    etat.metier = k;
    etat.t0 = Date.now();
    document.documentElement.setAttribute("data-metier", k);
    $("#h-logo-img").src = "img/logo-" + k + ".png";
    $("#h-logo").classList.remove("cache");
    $("#h-petit").textContent = "Avis du " + m.personne.toLowerCase();
    $("#h-accroche").textContent = m.accroche;
    $("#l-lieu").textContent = m.lieu;
    $("#form").classList.remove("cache");
    construireModes(m);
    construireArbre(m);
    construireCriteres(m);
    allerA(1);
  }

  /* ---------- Étape 2 : modes et arbre des tâches ---------- */
  function construireModes(m) {
    var bloc = $("#modes-bloc");
    if (!m.modes) { bloc.classList.add("cache"); $("#modes").innerHTML = ""; return; }
    bloc.classList.remove("cache");
    $("#modes").innerHTML = m.modes.map(function (x) {
      return '<label><input type="checkbox" name="mode" value="' + A.esc(x) + '"> ' + A.esc(x) + "</label>";
    }).join("");
  }

  function construireArbre(m) {
    cpt = 0;
    var h = m.taches.map(function (g) {
      return '<div class="groupe"><h3>' + A.esc(g.g) + '</h3><ul class="arbre">' +
        g.items.map(function (n) { return noeud(n, ""); }).join("") + "</ul></div>";
    }).join("");
    $("#arbre").innerHTML = h;
  }

  function noeud(n, parent) {
    var id = "t" + (++cpt);
    var chemin = parent ? parent + " > " + n.l : n.l;
    var s = '<li class="noeud"><label for="' + id + '"><input type="checkbox" id="' + id + '" data-chemin="' + A.esc(chemin) + '"' +
      (n.libre ? ' data-libre="1"' : "") + "> <span>" + A.esc(n.l) + "</span></label>";
    if (n.libre) {
      s += '<input type="text" class="libre cache" maxlength="120" placeholder="Précisez en quelques mots" aria-label="Précisez">';
    }
    if (n.c) {
      s += '<ul class="cache">' + n.c.map(function (x) { return noeud(x, chemin); }).join("") + "</ul>";
    }
    return s + "</li>";
  }

  $("#arbre").addEventListener("change", function (e) {
    var cb = e.target;
    if (cb.type !== "checkbox") { return; }
    var li = cb.closest("li");
    var sous = li.querySelector(":scope > ul");
    var libre = li.querySelector(":scope > input.libre");
    if (sous) { sous.classList.toggle("cache", !cb.checked); }
    if (libre) {
      libre.classList.toggle("cache", !cb.checked);
      if (cb.checked) { libre.focus(); }
    }
    if (!cb.checked) {
      $$("input[type=checkbox]", li).forEach(function (x) { x.checked = false; });
      $$("ul", li).forEach(function (x) { x.classList.add("cache"); });
      $$("input.libre", li).forEach(function (x) { x.classList.add("cache"); x.value = ""; });
    }
  });

  /* ---------- Étape 3 : notation ---------- */
  function construireCriteres(m) {
    $("#criteres").innerHTML = m.criteres.map(function (c) {
      var radios = window.NIVEAUX.map(function (nom, i) {
        var id = c.id + "_" + (i + 1);
        return '<div><input type="radio" name="' + c.id + '" id="' + id + '" value="' + (i + 1) + '">' +
          '<label class="n' + (i + 1) + '" for="' + id + '"><span class="et" aria-hidden="true">' +
          "★★★★".slice(0, i + 1) + "</span><span>" + A.esc(nom) + "</span></label></div>";
      }).join("");
      return '<div class="critere"><strong>' + A.esc(c.l) + '</strong><div class="niveaux">' + radios + "</div></div>";
    }).join("");
  }

  /* ---------- Navigation ---------- */
  function allerA(n) {
    etat.etape = n;
    $$(".etape").forEach(function (s) { s.classList.toggle("cache", Number(s.getAttribute("data-etape")) !== n); });
    $("#p-titre").textContent = TITRES[n - 1];
    $("#p-num").textContent = "Étape " + n + " sur 5";
    $("#p-rail").style.width = (n * 20) + "%";
    var h = $(".etape[data-etape='" + n + "'] h2");
    window.scrollTo(0, 0);
    if (h) { h.focus({ preventScroll: true }); }
    if (n === 5) { apercu(); montrerTurnstile(); }
  }

  function erreur(n, msg) {
    var e = $(".etape[data-etape='" + n + "'] .erreur");
    e.textContent = msg || "";
    e.classList.toggle("cache", !msg);
    if (msg) { e.scrollIntoView({ block: "center" }); }
  }

  $$("[data-suivant]").forEach(function (b) {
    b.addEventListener("click", function () {
      var msg = valider(etat.etape);
      erreur(etat.etape, msg);
      if (!msg) { allerA(etat.etape + 1); }
    });
  });
  $$("[data-retour]").forEach(function (b) {
    b.addEventListener("click", function () { allerA(etat.etape - 1); });
  });

  function val(id) { return $("#" + id).value.trim(); }

  function valider(n) {
    var m = M[etat.metier];
    if (n === 1) {
      if (!val("prenom") || !val("nom") || !val("commune")) {
        return "Merci de renseigner votre prénom, votre nom et votre " + m.lieu.toLowerCase() + ".";
      }
      if ($("#reference").checked && !val("contact")) {
        return "Pour être référence, merci de laisser un téléphone ou une adresse mail.";
      }
      if (val("debut") && val("fin") && val("fin") < val("debut")) {
        return "La date de fin doit être après la date de début.";
      }
    }
    if (n === 3) {
      for (var i = 0; i < m.criteres.length; i++) {
        if (!$("input[name='" + m.criteres[i].id + "']:checked")) {
          return "Merci de répondre à chaque ligne. Il manque : " + m.criteres[i].l.split(" (")[0] + ".";
        }
      }
    }
    if (n === 4) { return A.verifierTexte(val("commentaire")); }
    return "";
  }

  /* ---------- Saisies ---------- */
  function majAffichage() {
    var p = val("prenom") || "Marie", n = val("nom") || "Dupont";
    $("#ex-prenom").textContent = A.nomPublic(p, n, "prenom");
    $("#ex-init").textContent = A.nomPublic(p, n, "initiales");
  }
  $("#prenom").addEventListener("input", majAffichage);
  $("#nom").addEventListener("input", majAffichage);
  $("#t-ref-resp").textContent = C.RESPONSABLE;
  $("#t-ref-resp2").textContent = C.RESPONSABLE;
  $("#reference").addEventListener("change", function () {
    $("#bloc-horaires").classList.toggle("cache", !this.checked);
  });
  $("#commentaire").addEventListener("input", function () { $("#cpt").textContent = this.value.length; });

  /* ---------- Collecte ---------- */
  function collecter() {
    var m = M[etat.metier];
    var notes = {};
    m.criteres.forEach(function (c) { notes[c.id] = Number($("input[name='" + c.id + "']:checked").value); });
    var taches = $$("#arbre input[type=checkbox]:checked").map(function (x) { return x.getAttribute("data-chemin"); });
    var autre = $$("#arbre input.libre").map(function (x) { return x.value.trim(); }).filter(Boolean).join(" ; ");
    return {
      metier: etat.metier,
      prenom: val("prenom"), nom: val("nom"), commune: val("commune"),
      debut: val("debut"), fin: val("fin"),
      contact: $("#reference").checked ? val("contact") : "",
      reference: $("#reference").checked,
      horaires: $("#reference").checked ? {
        creneaux: $$("input[name=creneau]:checked").map(function (x) { return x.value; }),
        jours: $("input[name=jours]:checked").value,
        precisions: val("precisions")
      } : null,
      affichage: $("input[name=affichage]:checked").value,
      taches: taches, autre: autre,
      modes: $$("input[name=mode]:checked").map(function (x) { return x.value; }),
      notes: notes,
      commentaire: val("commentaire").replace(/\u0027/g, "\u2019").replace(/\s{2,}/g, " ")
    };
  }

  /* ---------- Étape 5 ---------- */
  var TEXTE_CONSENT =
    "J’accepte que mon avis soit publié sur ce site avec mon nom, l’initiale de mon prénom, ma commune et le mois. " +
    "Mon nom complet et mes coordonnées restent privés. Il sera retiré automatiquement " + C.DUREE_ANS +
    " ans après sa publication, et je peux demander son retrait à tout moment.";

  var TEXTE_REFERENCE =
    "Je me porte volontaire comme référence : mon contact et les moments où l’on peut me joindre peuvent être transmis à un futur employeur qui en fait la demande à " +
    C.RESPONSABLE + ", pour confirmer cet avis. Mon contact n’est jamais affiché sur internet : il n’est donné que directement à l’employeur, par " + C.RESPONSABLE + ". Un badge « Référence volontaire » s’affiche sur mon avis.";

  function texteLegal() {
    return (
      "<p><b>Qui recueille ces données ?</b> " + A.esc(C.RESPONSABLE) + ", pour recueillir et publier votre avis sur ses interventions.</p>" +
      "<p><b>Ce qui est publié :</b> votre nom suivi de l’initiale de votre prénom (ou vos deux initiales), votre commune, le mois de dépôt, vos notes et votre commentaire.</p>" +
      "<p><b>Ce qui reste privé :</b> votre nom complet, les dates d’intervention, votre téléphone ou mail et vos horaires, demandés seulement si vous vous portez volontaire comme référence (jamais affichés sur internet, transmis alors directement à un employeur qui en fait la demande), les interventions cochées et le mode d’intervention. Les interventions peuvent laisser deviner un besoin d’aide : c’est pourquoi elles ne sont jamais publiées.</p>" +
      "<p><b>Pourquoi :</b> uniquement avec votre consentement, que vous pouvez retirer à tout moment.</p>" +
      "<p><b>Combien de temps :</b> " + C.DUREE_ANS + " ans après la publication. Passé ce délai, l’avis disparaît du site et les données privées sont supprimées.</p>" +
      "<p><b>Où :</b> les données sont hébergées chez GitHub (Microsoft) et transitent par Cloudflare. Ces sociétés peuvent traiter des données hors de l’Union européenne, avec les garanties prévues par la réglementation.</p>" +
      "<p><b>Contre les abus :</b> pour limiter les envois répétés, une empreinte non réversible de votre connexion internet est gardée 24 heures au plus, puis effacée automatiquement.</p>" +
      "<p><b>Vos droits :</b> accès, correction, suppression, retrait de votre avis. Pour les exercer, utilisez le lien « Demander le retrait de mon avis » en bas de la page des avis (<a href=\"retrait.html\">retrait.html</a>), ou joignez directement " + A.esc(C.RESPONSABLE) + ". Vous pouvez aussi saisir la CNIL (cnil.fr).</p>" +
      "<p><small>Version du texte : " + A.esc(C.VERSION_TEXTE) + "</small></p>"
    );
  }

  function feuilles(taches) {
    return taches.filter(function (t) {
      return !taches.some(function (u) { return u !== t && u.indexOf(t + " > ") === 0; });
    });
  }

  function periode(d) {
    if (d.debut && d.fin) { return A.moisFr(d.debut) + " à " + A.moisFr(d.fin); }
    if (d.debut) { return "depuis " + A.moisFr(d.debut); }
    if (d.fin) { return "jusqu’en " + A.moisFr(d.fin); }
    return "";
  }

  function recapitulatif(d) {
    var m = M[d.metier];
    var vide = '<span class="vide-r">Non renseigné</span>';
    var ok = function (b) { return b ? '<span class="oui">✓ Oui</span>' : '<span class="non">Non</span>'; };
    var lignes = [
      ["Intervention", A.esc(m.nom), 0],
      ["Nom complet", A.esc(d.prenom + " " + d.nom), 1],
      [m.lieu, A.esc(d.commune), 1],
      ["Période", periode(d) ? A.esc(periode(d)) : vide, 1],
      ["Référence volontaire", ok(d.reference), 1]
    ];
    if (d.reference) {
      var h = d.horaires;
      lignes.push(["Téléphone ou mail", A.esc(d.contact), 1]);
      lignes.push(["Moments pour vous joindre",
        A.esc((h.creneaux.length ? h.creneaux.join(", ") : "À toute heure") + ", " + h.jours.toLowerCase() + (h.precisions ? " (" + h.precisions + ")" : "")), 1]);
    }
    if (m.modes) { lignes.push(["Mode d’intervention", d.modes.length ? A.esc(d.modes.join(", ")) : vide, 2]); }
    var f = feuilles(d.taches);
    lignes.push(["Ce qui a été fait", f.length
      ? "<ul>" + f.map(function (t) { return "<li>" + A.esc(t) + "</li>"; }).join("") + "</ul>" +
        (d.autre ? "<div>Précisé : " + A.esc(d.autre) + "</div>" : "")
      : vide, 2]);
    lignes.push(["Vos notes", "<ul>" + m.criteres.map(function (c) {
      return "<li>" + A.esc(c.l.split(" (")[0]) + " : <b>" + A.esc(window.NIVEAUX[d.notes[c.id] - 1]) + "</b></li>";
    }).join("") + "</ul>", 3]);
    lignes.push(["Commentaire", d.commentaire ? "« " + A.esc(d.commentaire) + " »" : vide, 4]);
    $("#recap").innerHTML = lignes.map(function (l) {
      var edit = l[2] ? '<button type="button" class="lien" data-aller="' + l[2] + '">Modifier</button>' : "";
      return '<div class="rl"><div class="rk">' + A.esc(l[0]) + '</div><div class="rv">' + l[1] + "</div>" + edit + "</div>";
    }).join("");
    $$("[data-aller]", $("#recap")).forEach(function (b) {
      b.addEventListener("click", function () { allerA(Number(b.getAttribute("data-aller"))); });
    });
  }

  function apercu() {
    var d = collecter();
    recapitulatif(d);
    var maintenant = new Date();
    var mois = maintenant.getFullYear() + "-" + ("0" + (maintenant.getMonth() + 1)).slice(-2);
    $("#apercu").innerHTML = A.carte({
      metier: d.metier, nom: A.nomPublic(d.prenom, d.nom, d.affichage), commune: d.commune,
      mois: mois, notes: d.notes, commentaire: d.commentaire, modes: d.modes, reference: d.reference
    });
    $("#t-consent").textContent = TEXTE_CONSENT;
    $("#t-legal").innerHTML = texteLegal();
  }

  function montrerTurnstile() {
    if (!C.TURNSTILE_SITEKEY || etat.tsRendu) { return; }
    var essai = function () {
      if (!window.turnstile) { return setTimeout(essai, 300); }
      window.turnstile.render("#ts", {
        sitekey: C.TURNSTILE_SITEKEY, language: "fr", appearance: "interaction-only",
        callback: function (t) { etat.jeton = t; },
        "expired-callback": function () { etat.jeton = ""; }
      });
      etat.tsRendu = true;
    };
    if (!document.getElementById("ts-script")) {
      var s = document.createElement("script");
      s.id = "ts-script"; s.async = true;
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      document.head.appendChild(s);
    }
    essai();
  }

  /* Étape 5 : un clic ouvre une dernière vérification, l’envoi n’a lieu qu’après confirmation */
  $("#envoyer").addEventListener("click", function () {
    if (etat.envoi) { return; }
    if (!$("#consent").checked) { return erreur(5, "Pour envoyer votre avis, cochez la case d’accord."); }
    if (!C.WORKER_URL) { return erreur(5, "L’envoi n’est pas encore configuré sur cette page."); }
    if (C.TURNSTILE_SITEKEY && !etat.jeton) { return erreur(5, "Merci de valider le test anti-robot ci-dessus."); }
    erreur(5, "");
    var d = collecter();
    var com = d.commentaire ? "« " + A.esc(d.commentaire) + " »" : "aucun";
    $("#c-liste").innerHTML =
      "<li><b>Avis de</b> " + A.esc(d.prenom + " " + d.nom) + " (" + A.esc(d.commune) + ")</li>" +
      "<li><b>Notes</b> : moyenne de " + A.fmt(A.moyenne(d.notes)) + " sur 4</li>" +
      "<li><b>Commentaire</b> : " + com + "</li>" +
      '<li class="ok">✓ Accord de publication coché</li>' +
      "<li>" + (d.reference ? '<span class="ok">✓ Référence volontaire</span> avec le contact ' + A.esc(d.contact) : "Pas de référence volontaire") + "</li>";
    $("#confirm").classList.remove("cache");
    $("#c-oui").focus();
  });
  $("#c-non").addEventListener("click", function () { $("#confirm").classList.add("cache"); $("#envoyer").focus(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { $("#confirm").classList.add("cache"); }
  });
  $("#c-oui").addEventListener("click", function () {
    $("#confirm").classList.add("cache");
    partir();
  });

  function partir() {
    if (etat.envoi) { return; }
    erreur(5, "");
    var btn = $("#envoyer");
    etat.envoi = true; btn.disabled = true; btn.textContent = "Envoi en cours";
    var charge = collecter();
    charge.consentement = { accepte: true, version: C.VERSION_TEXTE, texte: TEXTE_CONSENT };
    if (charge.reference) { charge.consentement.texte_reference = TEXTE_REFERENCE; }
    charge.cle = CLE;
    charge.t0 = etat.t0;
    charge.hp = $("#hp").value;
    charge.jeton = etat.jeton;
    fetch(C.WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(charge)
    }).then(function (r) { return r.json().catch(function () { return { ok: false, code: "serveur" }; }); })
      .then(function (r) {
        if (r.ok) {
          $("#form").classList.add("cache");
          $("#s-metier").classList.add("cache");
          $("#merci").classList.remove("cache");
          window.scrollTo(0, 0);
        } else {
          erreur(5, MESSAGES[r.code] || MESSAGES.serveur);
          if (window.turnstile) { try { window.turnstile.reset(); } catch (e) {} etat.jeton = ""; }
          etat.envoi = false; btn.disabled = false; btn.textContent = "Envoyer mon avis";
        }
      })
      .catch(function () {
        erreur(5, MESSAGES.serveur);
        etat.envoi = false; btn.disabled = false; btn.textContent = "Envoyer mon avis";
      });
  }
})();

(function () {
  "use strict";
  var DEPOT = "geds3169/avis-prive";
  var API = "https://api.github.com/repos/" + DEPOT;
  var ACTIONS = {
    avis: "Supprimer l’avis en entier",
    contact: "Effacer le contact seulement"
  };
  var A = window.AVIS;
  var $ = function (s) { return document.querySelector(s); };
  var jeton = "";
  var avis = []; // { f, d }

  function memoire(ecrire, valeur) {
    try {
      if (ecrire) { if (valeur) { localStorage.setItem("gestion-jeton", valeur); } else { localStorage.removeItem("gestion-jeton"); } }
      else { return localStorage.getItem("gestion-jeton") || ""; }
    } catch (e) { /* stockage indisponible : on se reconnectera */ }
    return "";
  }

  function entetes(raw) {
    return {
      "Authorization": "Bearer " + jeton,
      "Accept": raw ? "application/vnd.github.raw+json" : "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28"
    };
  }
  function montrer(el, texte) { el.textContent = texte || ""; el.classList.toggle("cache", !texte); }
  function message(texte) { var m = $("#message"); montrer(m, texte); if (texte) { m.scrollIntoView({ block: "center" }); } }

  /* ---------- Connexion ---------- */
  function connecter(valeur) {
    jeton = (valeur || "").trim();
    var err = $("#erreur-connexion");
    montrer(err, "");
    if (!/^[A-Za-z0-9_]{20,255}$/.test(jeton)) { montrer(err, "Ce jeton ne ressemble pas à un jeton GitHub."); return; }
    var bouton = $("#connecter");
    bouton.disabled = true; bouton.textContent = "Connexion…";
    fetch(API, { headers: entetes(false) }).then(function (r) {
      if (r.status === 401) { throw new Error("Jeton refusé ou expiré. Crée-en un nouveau sur GitHub."); }
      if (r.status === 404 || r.status === 403) { throw new Error("Ce jeton n’a pas accès au dépôt de gestion."); }
      if (!r.ok) { throw new Error("GitHub ne répond pas (" + r.status + "). Réessaie dans un instant."); }
      return r.json();
    }).then(function (depot) {
      memoire(true, $("#garder").checked ? jeton : "");
      $("#s-connexion").classList.add("cache");
      $("#s-gestion").classList.remove("cache");
      $("#jeton").value = "";
      return verifierDroits(depot).then(charger);
    }).catch(function (e) {
      jeton = "";
      montrer(err, e.message || "Connexion impossible.");
    }).then(function () { bouton.disabled = false; bouton.textContent = "Se connecter"; });
  }

  /* Contrôle des permissions du jeton : lecture des avis, lancement des actions, et pas plus de droits que nécessaire */
  function verifierDroits(depot) {
    var alertes = [];
    var p = (depot && depot.permissions) || {};
    var lecture = fetch(API + "/contents/avis?ref=main", { headers: entetes(false), cache: "no-store" })
      .then(function (r) { if (!r.ok && r.status !== 404) { alertes.push("Ce jeton ne peut pas lire les avis (permission « Contents : lecture »)."); } })
      .catch(function () { /* contrôle impossible : le chargement signalera le problème */ });
    var actions = fetch(API + "/actions/workflows/retirer.yml", { headers: entetes(false), cache: "no-store" })
      .then(function (r) { if (!r.ok) { alertes.push("Ce jeton ne peut pas lancer les actions : tu pourras consulter et exporter, mais pas supprimer. Ajoute la permission « Actions : lecture et écriture »."); } })
      .catch(function () { /* contrôle impossible */ });
    return Promise.all([lecture, actions]).then(function () {
      if (p.push === true || p.admin === true) {
        alertes.push("Attention : ce jeton peut aussi modifier le dépôt, ce qui est plus que nécessaire. Pour ta sécurité, recrée-le avec « Contents : lecture seule ».");
      }
      message(alertes.length ? alertes.join("\n") : "Jeton vérifié : il peut lire les avis et lancer les actions, sans droit en trop.");
    });
  }

  /* ---------- Chargement des avis ---------- */
  function charger() {
    $("#compte").textContent = "Chargement…";
    return fetch(API + "/contents/avis?ref=main", { headers: entetes(false), cache: "no-store" }).then(function (r) {
      if (r.status === 404) { return []; }
      if (!r.ok) { throw new Error("Lecture impossible (" + r.status + ")."); }
      return r.json();
    }).then(function (liste) {
      var fichiers = liste.filter(function (x) { return /\.json$/.test(x.name); });
      var resultats = [], i = 0;
      function suivant() {
        if (i >= fichiers.length) { return Promise.resolve(); }
        var f = fichiers[i++];
        return fetch(API + "/contents/avis/" + encodeURIComponent(f.name) + "?ref=main", { headers: entetes(true), cache: "no-store" })
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (d) { if (d && d.prenom) { resultats.push({ f: f.name, d: d }); } })
          .catch(function () { /* fichier illisible : ignoré */ })
          .then(suivant);
      }
      var lots = [suivant(), suivant(), suivant(), suivant(), suivant()];
      return Promise.all(lots).then(function () { return resultats; });
    }).then(function (res) {
      res.sort(function (a, b) { return a.d.cree < b.d.cree ? 1 : -1; });
      avis = res;
      dessiner();
    }).catch(function (e) {
      $("#compte").textContent = e.message || "Chargement impossible.";
    });
  }

  function coord(d) {
    var c = String(d.contact || "").trim();
    if (!c) { return { mail: String(d.contact_email || ""), tel: String(d.contact_chiffres || "") }; }
    return c.indexOf("@") >= 0 ? { mail: c, tel: "" } : { mail: "", tel: c };
  }
  function jour(iso) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ""); return m ? m[3] + "/" + m[2] + "/" + m[1] : ""; }
  function metier(k) { return k === "vie" ? "Assistant de vie" : "Assistance informatique"; }

  /* Une fiche avec ses boutons ; "seul" limite à une seule action (choix après « Appliquer ») */
  function ligne(x, seul) {
    var c = coord(x.d), d = x.d;
    var contact = c.mail || c.tel ? "<div>" + A.esc([c.tel, c.mail].filter(Boolean).join(" · ")) + "</div>" : "<div class=\"aide\">Aucune coordonnée conservée</div>";
    var boutons;
    if (seul) {
      boutons = '<button type="button" class="btn" data-act="' + seul + '">' + (seul === "avis" ? "Supprimer cet avis" : "Effacer le contact de cette personne") + "</button>";
    } else {
      boutons = '<button type="button" class="btn second" data-act="avis">Supprimer l’avis</button>' +
        (c.mail || c.tel ? ' <button type="button" class="btn second" data-act="contact">Effacer le contact</button>' : "");
    }
    return '<div class="carte-bloc g-ligne" data-f="' + A.esc(x.f) + '">' +
      "<div><b>" + A.esc(d.prenom + " " + d.nom) + "</b>, " + A.esc(d.commune) + "</div>" +
      '<div class="aide">' + A.esc(metier(d.metier)) + ", avis du " + A.esc(jour(d.cree)) + (d.reference ? " · Référence volontaire" : "") + "</div>" +
      contact + '<div class="nav">' + boutons + "</div></div>";
  }

  function dessiner() {
    var q = $("#recherche").value.trim().toLowerCase();
    var vus = avis.filter(function (x) {
      if (q.length < 2) { return false; }
      var c = coord(x.d);
      return (x.d.prenom + " " + x.d.nom + " " + x.d.commune + " " + c.mail + " " + c.tel).toLowerCase().indexOf(q) >= 0;
    });
    var nbRefs = avis.filter(function (x) { var c = coord(x.d); return c.mail || c.tel; }).length;
    $("#compte").textContent = avis.length + " avis, dont " + nbRefs + " avec coordonnées conservées" + (q.length >= 2 ? " (" + vus.length + " trouvé(s))" : "") + ".";
    $("#liste-gestion").innerHTML = vus.map(function (x) { return ligne(x, ""); }).join("") || '<p class="vide">' + (q.length < 2 ? "Tape un nom, une ville, un téléphone ou un mail pour afficher les avis." : "Aucun avis ne correspond.") + "</p>";
  }

  /* ---------- Actions ---------- */
  function lancer(cible, action) {
    return fetch(API + "/actions/workflows/retirer.yml/dispatches", {
      method: "POST",
      headers: Object.assign({ "Content-Type": "application/json" }, entetes(false)),
      body: JSON.stringify({ ref: "main", inputs: { cible: cible, action: ACTIONS[action] } })
    }).then(function (r) {
      if (r.status === 204) {
        message("Demande envoyée. Le robot l’applique en une à deux minutes et met la page à jour. Actualise la liste ensuite.");
        return true;
      }
      if (r.status === 403 || r.status === 404) { throw new Error("Ce jeton n’a pas le droit de lancer les actions (permission « Actions : lecture et écriture »)."); }
      throw new Error("GitHub a refusé la demande (" + r.status + ").");
    });
  }

  function agir(f, act, errEl) {
    var x = avis.filter(function (a) { return a.f === f; })[0];
    if (!x) { return; }
    var nom = x.d.prenom + " " + x.d.nom + ", " + x.d.commune;
    var txt = act === "avis" ? "Supprimer définitivement l’avis de " + nom + " ?" : "Effacer le téléphone, le mail et les horaires de " + nom + " (l’avis est conservé) ?";
    if (!window.confirm(txt)) { return; }
    lancer("fichier:" + f, act).then(function () { $("#choix-cible").innerHTML = ""; }).catch(function (err) { if (errEl) { montrer(errEl, err.message); } else { message(err.message); } });
  }

  $("#liste-gestion").addEventListener("click", function (e) {
    var b = e.target.closest("button[data-act]");
    if (!b) { return; }
    agir(b.closest(".g-ligne").getAttribute("data-f"), b.getAttribute("data-act"), null);
  });

  $("#choix-cible").addEventListener("click", function (e) {
    var b = e.target.closest("button[data-act]");
    if (!b) { return; }
    agir(b.closest(".g-ligne").getAttribute("data-f"), b.getAttribute("data-act"), $("#erreur-action"));
  });

  /* Retrouve les avis qui correspondent à ce qui est tapé : nom (même partiel), mail ou téléphone */
  function trouver(cible) {
    var t = cible.toLowerCase().replace(/\s+/g, " ").trim();
    var chif = cible.replace(/\D/g, "");
    return avis.filter(function (x) {
      var c = coord(x.d), n = (x.d.prenom + " " + x.d.nom).toLowerCase(), n2 = (x.d.nom + " " + x.d.prenom).toLowerCase();
      if (c.mail && c.mail.toLowerCase() === t) { return true; }
      if (chif.length >= 9 && c.tel.replace(/\D/g, "").slice(-9) === chif.slice(-9)) { return true; }
      return t.length >= 3 && (n.indexOf(t) >= 0 || n2.indexOf(t) >= 0);
    });
  }

  $("#appliquer").addEventListener("click", function () {
    var cible = $("#cible").value.trim(), action = $("#action").value, err = $("#erreur-action"), bouton = this;
    montrer(err, "");
    $("#choix-cible").innerHTML = "";
    if (cible.length < 3) { montrer(err, "Indique un téléphone, une adresse mail ou un nom."); return; }
    bouton.disabled = true;
    charger().then(function () {
      var ok = trouver(cible);
      if (!ok.length) { montrer(err, "Aucun avis ne correspond à « " + cible + " ». Vérifie l’orthographe, ou essaie avec un téléphone ou un mail."); return; }
      if (ok.length === 1) { agir(ok[0].f, action, err); return; }
      $("#choix-cible").innerHTML = '<p class="aide">' + ok.length + " avis correspondent. Choisis la bonne personne :</p>" +
        ok.map(function (x) { return ligne(x, action); }).join("");
    }).then(function () { bouton.disabled = false; });
  });

  /* ---------- Export CSV ---------- */
  function champ(v, tel) {
    v = String(v == null ? "" : v);
    if (!(tel && /^\+?[\d\s.()-]+$/.test(v)) && /^[=+\-@\t\r]/.test(v)) { v = "'" + v; }
    return /[;"\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  }
  function exporter(seulementRefs) {
    var lignes = avis.filter(function (x) { var c = coord(x.d); return !seulementRefs || c.mail || c.tel; });
    if (!lignes.length) { $("#exp-info").textContent = seulementRefs ? "Aucune référence avec coordonnées pour le moment." : "Aucun avis à exporter."; return; }
    var rows = [["Nom", "Prénom", "Ville", "Mail", "Téléphone"]].concat(lignes.map(function (x) {
      var c = coord(x.d);
      return [x.d.nom, x.d.prenom, x.d.commune, c.mail, c.tel];
    }));
    var csv = "﻿" + rows.map(function (r, i) { return r.map(function (v, k) { return champ(v, k === 4); }).join(";"); }).join("\r\n") + "\r\n";
    var blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a");
    var d = new Date(), j = d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
    a.href = URL.createObjectURL(blob);
    a.download = (seulementRefs ? "references-" : "avis-") + j + ".csv";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
    $("#exp-info").textContent = lignes.length + " ligne(s) exportée(s).";
  }
  $("#exp-refs").addEventListener("click", function () { exporter(true); });
  $("#exp-tous").addEventListener("click", function () { exporter(false); });

  /* ---------- Divers ---------- */
  $("#connecter").addEventListener("click", function () { connecter($("#jeton").value); });
  $("#jeton").addEventListener("keydown", function (e) { if (e.key === "Enter") { connecter(this.value); } });
  $("#actualiser").addEventListener("click", function () { message(""); charger(); });
  $("#recherche").addEventListener("input", dessiner);
  $("#deconnecter").addEventListener("click", function () {
    jeton = ""; avis = []; memoire(true, "");
    $("#s-gestion").classList.add("cache"); $("#s-connexion").classList.remove("cache"); message("");
  });

  var garde = memoire(false);
  if (garde) { $("#garder").checked = true; connecter(garde); }
})();

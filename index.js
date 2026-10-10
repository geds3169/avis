(function () {
  "use strict";
  var M = window.METIERS, A = window.AVIS, C = window.CONFIG;
  var $ = function (s) { return document.querySelector(s); };
  var tous = [];
  afficherCartePro();

  /* Carte de visite : nom, métiers, et si renseignés commune, SIRET vérifiable, site et photo */
  function afficherCartePro() {
    var P = C.PROFIL, box = $("#carte-pro");
    if (!P || !P.nom || !box) { return; }
    var html = "";
    if (P.photo) { html += '<img class="cp-photo" src="' + A.esc(P.photo) + '" alt="Portrait de ' + A.esc(P.nom) + '" width="72" height="72">'; }
    html += '<div class="cp-texte"><div class="cp-nom">Avis concernant <strong>' + A.esc(P.nom) + "</strong></div>";
    if (P.titre) { html += '<div class="cp-ligne">' + A.esc(P.titre) + "</div>"; }
    if (P.commune) { html += '<div class="cp-ligne">' + A.esc(P.commune) + "</div>"; }
    var siret = String(P.siret || "").replace(/\s/g, "");
    if (/^\d{14}$/.test(siret)) {
      html += '<div class="cp-ligne">SIRET : <a href="https://annuaire-entreprises.data.gouv.fr/etablissement/' + siret +
        '" target="_blank" rel="noopener">' + siret.replace(/^(\d{3})(\d{3})(\d{3})(\d{5})$/, "$1 $2 $3 $4") +
        "</a> (vérifiable sur l’annuaire officiel des entreprises)</div>";
    }
    if (/^https:\/\//.test(String(P.site || ""))) {
      html += '<div class="cp-ligne">Site : <a href="' + A.esc(P.site) + '" target="_blank" rel="noopener">' + A.esc(P.site.replace(/^https:\/\//, "").replace(/\/$/, "")) + "</a></div>";
    }
    html += "</div>";
    box.innerHTML = html;
    box.hidden = false;
  }

  var filtre = { vie: 0, info: 0 }; // 0 = tous les avis, 1 à 4 = nombre d’étoiles

  fetch("avis.json", { cache: "no-store" })
    .then(function (r) { return r.ok ? r.json() : { avis: [] }; })
    .catch(function () { return { avis: [] }; })
    .then(function (d) {
      tous = (d && d.avis) || [];
      afficher("vie");
      afficher("info");
    });

  var dlg = $("#dlg-qr");
  if (dlg) {
    $("#ouvrir-qr").addEventListener("click", function () {
      if (dlg.showModal) { dlg.showModal(); } else { dlg.setAttribute("open", ""); }
    });
    $("#fermer-qr").addEventListener("click", function () {
      if (dlg.close) { dlg.close(); } else { dlg.removeAttribute("open"); }
    });
    dlg.addEventListener("click", function (e) { if (e.target === dlg && dlg.close) { dlg.close(); } });
  }

  ["vie", "info"].forEach(function (k) {
    if (!$("#sy-" + k)) { return; }
    $("#sy-" + k).addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) { return; }
      var n = Number(b.getAttribute("data-n")) || 0;
      filtre[k] = filtre[k] === n ? 0 : n;
      afficher(k);
    });
  });

  function afficher(k) {
    if (!$("#li-" + k)) { return; }
    var m = M[k];
    var liste = tous.filter(function (a) { return a.metier === k; });
    var ch = $("#ch-" + k), sy = $("#sy-" + k), mo = $("#mo-" + k), li = $("#li-" + k);

    if (!liste.length) {
      ch.innerHTML = "<span>Aucun avis pour le moment</span>";
      sy.classList.add("cache");
      mo.classList.add("cache");
      li.innerHTML = '<p class="vide">Les avis apparaîtront ici.</p>';
      return;
    }

    var moyAvis = function (a) { return a.moyenne != null ? a.moyenne : A.moyenne(a.notes); };
    var moy = liste.reduce(function (s, a) { return s + moyAvis(a); }, 0) / liste.length;
    var compte = [0, 0, 0, 0, 0];
    liste.forEach(function (a) { compte[A.niveau(moyAvis(a))]++; });

    ch.innerHTML = "<span>" + liste.length + (liste.length > 1 ? " avis" : " avis") + "</span>";

    var lignes = [4, 3, 2, 1].map(function (n) {
      var pct = Math.round(compte[n] / liste.length * 100);
      var actif = filtre[k] === n;
      return '<button type="button" class="dist' + (actif ? " actif" : "") + '" data-n="' + n + '" aria-pressed="' + actif + '"' +
        ' aria-label="Voir les avis à ' + n + (n > 1 ? " étoiles" : " étoile") + " (" + compte[n] + ')">' +
        '<span class="dn">' + n + ' ★</span><span class="dbarre"><i style="width:' + pct + '%"></i></span><span class="dp">' + pct + " %</span></button>";
    }).join("");

    var actif = filtre[k]
      ? '<div class="filtre-actif">Avis à ' + filtre[k] + (filtre[k] > 1 ? " étoiles" : " étoile") +
        ' <button type="button" class="lien" data-n="0">Tout afficher</button></div>'
      : '<div class="filtre-aide">Touchez une ligne pour filtrer les avis</div>';

    sy.classList.remove("cache");
    sy.innerHTML =
      '<div class="amz"><div class="amz-note"><div class="gros">' + A.fmt(moy) + "<small> / 4</small></div>" +
      A.etoiles(moy) + '<div class="amz-n">' + liste.length + (liste.length > 1 ? " avis" : " avis") + "</div></div>" +
      '<div class="amz-dist">' + lignes + "</div></div>" + actif;

    $("#ba-" + k).innerHTML = m.criteres.map(function (c) {
      var v = liste.map(function (a) { return Number(a.notes && a.notes[c.id]) || 0; }).filter(Boolean);
      var mc = v.length ? v.reduce(function (s, x) { return s + x; }, 0) / v.length : 0;
      return '<li><div class="ligne"><span>' + A.esc(c.l.split(" (")[0]) + "</span><b>" + A.fmt(mc) + "</b></div>" +
        '<div class="fond"><i style="width:' + Math.round(mc / 4 * 100) + '%"></i></div></li>';
    }).join("");

    var vus = filtre[k] ? liste.filter(function (a) { return A.niveau(moyAvis(a)) === filtre[k]; }) : liste;
    li.innerHTML = vus.length
      ? vus.map(function (a) { return A.carte(a, true); }).join("")
      : '<p class="vide">Aucun avis avec ce nombre d’étoiles.</p>';
    signalerHauteur();
  }

  /* Page intégrée dans un autre site : on lui indique la hauteur utile pour qu’il ajuste le cadre */
  function signalerHauteur() {
    if (window.parent === window) { return; }
    try { window.parent.postMessage({ type: "avis-hauteur", hauteur: document.documentElement.scrollHeight }, "*"); } catch (e) { /* sans effet */ }
  }
  window.addEventListener("resize", signalerHauteur);
})();

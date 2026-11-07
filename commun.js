/* Fonctions partagées entre le formulaire et la page publique. */
(function () {
  var MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function fmt(n) {
    return Number(n).toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  }

  function majuscule(s) {
    s = String(s || "").trim();
    return s.charAt(0).toLocaleUpperCase("fr-FR") + s.slice(1);
  }

  function initiale(s) {
    s = String(s || "").trim();
    return s ? s.charAt(0).toLocaleUpperCase("fr-FR") : "";
  }

  /* mode : "prenom" (Dupont M.) ou "initiales" (D. M.) */
  function nomPublic(prenom, nom, mode) {
    if (mode === "initiales") {
      return initiale(nom) + ". " + initiale(prenom) + ".";
    }
    return majuscule(nom) + " " + initiale(prenom) + ".";
  }

  function moyenne(notes) {
    var v = Object.keys(notes || {}).map(function (k) { return Number(notes[k]); }).filter(function (x) { return x >= 1 && x <= 4; });
    if (!v.length) { return 0; }
    return v.reduce(function (a, b) { return a + b; }, 0) / v.length;
  }

  function moisFr(iso) {
    var m = /^(\d{4})-(\d{2})/.exec(iso || "");
    if (!m) { return ""; }
    return MOIS[Number(m[2]) - 1] + " " + m[1];
  }

  /* Contrôle du commentaire : renvoie un message d’erreur ou une chaîne vide. */
  function verifierTexte(txt) {
    txt = String(txt || "");
    if (/(\d[\s.\-]?){6,}/.test(txt)) { return "Merci de retirer les numéros (téléphone, adresse, etc.) de votre commentaire."; }
    if (/\S+@\S+/.test(txt)) { return "Merci de retirer l’adresse mail de votre commentaire."; }
    if (/https?:\/\/|www\./i.test(txt)) { return "Merci de retirer les liens de votre commentaire."; }
    return "";
  }

  /* Étoiles remplies au prorata de la note (sur 4), par exemple 3,7 donne trois étoiles et demie environ. */
  function etoiles(n) {
    var p = Math.max(0, Math.min(4, Number(n) || 0)) / 4 * 100;
    return '<span class="etoiles" role="img" aria-label="Note : ' + fmt(n) + ' sur 4" style="--p:' + p.toFixed(1) + '%"></span>';
  }

  /* Niveau en étoiles entières (1 à 4) utilisé pour filtrer les avis */
  function niveau(moy) {
    return Math.max(1, Math.min(4, Math.round(Number(moy) || 0)));
  }

  function carte(a, compacte) {
    var met = window.METIERS[a.metier] || window.METIERS.vie;
    var ini = initiale(a.nom);
    var l = a.nom.replace(/\./g, "").split(" ");
    if (l.length > 1) { ini = initiale(l[0]) + initiale(l[1]); }
    var moy = a.moyenne != null ? a.moyenne : moyenne(a.notes);
    var modes = (a.modes || []).map(function (m) { return '<span class="puce">' + esc(m) + "</span>"; }).join("");
    var detail = met.criteres.map(function (c) {
      var n = Number(a.notes && a.notes[c.id]) || 0;
      return '<li><span>' + esc(c.l) + "</span><b>" + esc(window.NIVEAUX[n - 1] || "") + "</b></li>";
    }).join("");
    return (
      '<article class="carte' + (compacte ? " compacte" : "") + '" data-metier="' + esc(a.metier) + '">' +
        '<img class="carte-logo" src="img/logo-' + esc(a.metier) + '-petit.png" alt="" width="28" height="28">' +
        '<header class="carte-tete">' +
          '<span class="avatar" aria-hidden="true">' + esc(ini) + "</span>" +
          '<div class="carte-id"><strong>' + esc(a.nom) + "</strong>" +
            "<small>" + esc(a.commune) + (a.mois ? " · " + esc(moisFr(a.mois)) : "") + "</small></div>" +
          '<div class="carte-note">' + etoiles(moy) + "<b>" + fmt(moy) + " / 4</b></div>" +
        "</header>" +
        (a.commentaire ? '<p class="carte-texte">' + esc(a.commentaire) + "</p>" : "") +
        ((modes || a.reference) ? '<div class="puces">' + (a.reference ? '<span class="puce ref">Référence volontaire</span>' : "") + modes + "</div>" : "") +
        '<details class="carte-detail"><summary>Voir le détail des notes</summary><ul>' + detail + "</ul></details>" +
      "</article>"
    );
  }

  window.AVIS = {
    esc: esc, fmt: fmt, nomPublic: nomPublic, moyenne: moyenne, moisFr: moisFr,
    verifierTexte: verifierTexte, etoiles: etoiles, niveau: niveau, carte: carte
  };
})();

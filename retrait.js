(function () {
  "use strict";
  var C = window.CONFIG;
  var $ = function (s) { return document.querySelector(s); };
  var t0 = Date.now(), jeton = "", envoi = false;
  var MESSAGES = {
    trop_rapide: "Merci de patienter quelques secondes puis de renvoyer.",
    robot: "Le test anti-robot a échoué. Merci de recommencer.",
    limite: "Plusieurs demandes ont déjà été envoyées depuis cette connexion aujourd’hui. Merci de réessayer demain.",
    invalide: "Merci de vérifier vos informations, en particulier le téléphone ou l’adresse mail si vous en avez saisi un.",
    serveur: "L’envoi a échoué. Merci de réessayer dans quelques instants."
  };

  function erreur(msg) {
    var e = $("#erreur");
    e.textContent = msg || "";
    e.classList.toggle("cache", !msg);
    if (msg) { e.scrollIntoView({ block: "center" }); }
  }
  function val(id) { return $("#" + id).value.trim(); }

  if (C.TURNSTILE_SITEKEY) {
    var s = document.createElement("script");
    s.async = true; s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    document.head.appendChild(s);
    var essai = function () {
      if (!window.turnstile) { return setTimeout(essai, 300); }
      window.turnstile.render("#ts", {
        sitekey: C.TURNSTILE_SITEKEY, language: "fr", appearance: "interaction-only",
        callback: function (t) { jeton = t; }, "expired-callback": function () { jeton = ""; }
      });
    };
    essai();
  }

  $("#envoyer").addEventListener("click", function () {
    if (envoi) { return; }
    var chiffres = val("tel").replace(/\D/g, "");
    var mail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val("mail"));
    if (!val("prenom") || !val("nom") || !val("commune")) { return erreur("Merci de renseigner votre prénom, votre nom et votre commune."); }
    if (val("tel") && chiffres.length < 9) { return erreur("Le numéro de téléphone paraît incomplet."); }
    if (val("mail") && !mail) { return erreur("L’adresse mail paraît incorrecte."); }
    if (!C.WORKER_URL) { return erreur("L’envoi n’est pas encore configuré sur cette page."); }
    if (C.TURNSTILE_SITEKEY && !jeton) { return erreur("Merci de valider le test anti-robot ci-dessus."); }
    erreur("");
    envoi = true;
    var btn = this;
    btn.disabled = true; btn.textContent = "Envoi en cours";
    fetch(C.WORKER_URL.replace(/\/+$/, "") + "/retrait", {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: ($("input[name=action]:checked") || {}).value || "avis",
        prenom: val("prenom"), nom: val("nom"), commune: val("commune"),
        telephone: val("tel"), courriel: val("mail"), message: val("message"),
        t0: t0, hp: $("#hp").value, jeton: jeton
      })
    }).then(function (r) { return r.json().catch(function () { return { ok: false, code: "serveur" }; }); })
      .then(function (r) {
        if (r.ok) {
          $("#form").classList.add("cache");
          $("#merci").classList.remove("cache");
          window.scrollTo(0, 0);
        } else {
          erreur(MESSAGES[r.code] || MESSAGES.serveur);
          if (window.turnstile) { try { window.turnstile.reset(); } catch (e) {} jeton = ""; }
          envoi = false; btn.disabled = false; btn.textContent = "Demander le retrait";
        }
      })
      .catch(function () { erreur(MESSAGES.serveur); envoi = false; btn.disabled = false; btn.textContent = "Demander le retrait"; });
  });
})();

/* Réglage de la taille du texte (3 niveaux), mémorisé dans le navigateur. */
(function () {
  "use strict";
  var racine = document.documentElement;
  function lire() { try { return localStorage.getItem("taille") || "1"; } catch (e) { return "1"; } }
  function ecrire(v) { try { localStorage.setItem("taille", v); } catch (e) {} }
  function appliquer(v) {
    racine.setAttribute("data-taille", v);
    Array.prototype.forEach.call(document.querySelectorAll(".taille button"), function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-t") === v ? "true" : "false");
    });
  }
  var zone = document.querySelector(".hero-in");
  if (zone) {
    var d = document.createElement("div");
    d.className = "taille";
    d.setAttribute("role", "group");
    d.setAttribute("aria-label", "Taille du texte");
    d.innerHTML = '<span>Taille du texte</span>' +
      '<button type="button" class="t1" data-t="1" aria-label="Texte normal">A</button>' +
      '<button type="button" class="t2" data-t="2" aria-label="Texte grand">A</button>' +
      '<button type="button" class="t3" data-t="3" aria-label="Texte très grand">A</button>';
    zone.insertBefore(d, zone.firstChild);
    d.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) { return; }
      var v = b.getAttribute("data-t");
      ecrire(v); appliquer(v);
    });
  }
  appliquer(lire());
})();

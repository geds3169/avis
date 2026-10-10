/* Définition des deux métiers : libellés, critères de notation, tâches et modes d’intervention.
   Utilisé par le formulaire et par la page publique. */
(function () {
  var NIVEAUX = ["Insuffisant", "Passable", "Satisfaisant", "Très satisfaisant"];

  var vie = {
    id: "vie",
    nom: "Assistant de vie",
    court: "Assistant de vie",
    personne: "Bénéficiaire",
    lieu: "Commune",
    accroche: "Merci de prendre quelques minutes pour donner votre avis sur l’accompagnement reçu.",
    criteres: [
      { id: "c1", l: "Ponctualité et assiduité" },
      { id: "c2", l: "Courtoisie et savoir-être" },
      { id: "c3", l: "Bienveillance et bientraitance" },
      { id: "c4", l: "Serviabilité et polyvalence" },
      { id: "c5", l: "Discrétion, confiance et sécurité" },
      { id: "c6", l: "Respect des consignes (de la personne, de la famille, du plan d’accompagnement)" }
    ],
    modes: null,
    taches: [
      { g: "Vie quotidienne", items: [
        { l: "Courses" },
        { l: "Préparation des repas" },
        { l: "Aide à la prise des repas" },
        { l: "Hydratation et collations" },
        { l: "Entretien du logement", c: [
          { l: "Sols (balai, aspirateur, lavage)" },
          { l: "Poussières et rangement" },
          { l: "Cuisine (plan de travail, évier, plaques, réfrigérateur)" },
          { l: "Salle de bains et toilettes" },
          { l: "Vitres" },
          { l: "Poubelles" },
          { l: "Lit (refaire, changer les draps)" }
        ] },
        { l: "Entretien du linge", c: [
          { l: "Lessive" },
          { l: "Étendage" },
          { l: "Repassage" },
          { l: "Pliage et rangement" }
        ] }
      ] },
      { g: "Aide à la personne", items: [
        { l: "Lever et coucher" },
        { l: "Mobilisation et transferts (lit, fauteuil, verticalisateur)" },
        { l: "Aide à la toilette" },
        { l: "Changes" },
        { l: "Aide à la prise des médicaments" },
        { l: "Aide aux gestes du quotidien" },
        { l: "Surveillance et alerte" }
      ] },
      { g: "Accompagnement", items: [
        { l: "Sorties et accompagnement" },
        { l: "Transport" },
        { l: "Accompagnement aux rendez-vous médicaux" },
        { l: "Compagnie et échanges" },
        { l: "Stimulation et activités (mémoire, jeux, promenade)" },
        { l: "Aide administrative" },
        { l: "Démarches avec la famille, le curateur ou le tuteur" },
        { l: "Réception des commandes et livraisons" },
        { l: "Petit dépannage informatique" },
        { l: "Autre", libre: true }
      ] }
    ]
  };

  var systeme = function (os) {
    return { l: os, c: [
      { l: "Installation neuve" },
      { l: "Réinstallation" },
      { l: "Mise à niveau (par exemple Windows 10 vers 11)" },
      { l: "Récupération après écran bleu ou démarrage impossible" },
      { l: "Données conservées" }
    ] };
  };

  var info = {
    id: "info",
    nom: "Assistance informatique",
    court: "Assistance informatique",
    personne: "Client",
    lieu: "Ville",
    accroche: "Merci de prendre quelques minutes pour donner votre avis sur le dépannage ou l’accompagnement reçu.",
    criteres: [
      { id: "c1", l: "Ponctualité et réactivité" },
      { id: "c2", l: "Courtoisie et savoir-être" },
      { id: "c3", l: "Compétence technique" },
      { id: "c4", l: "Clarté des explications" },
      { id: "c5", l: "Respect des consignes et des demandes" },
      { id: "c6", l: "Discrétion et respect des données" }
    ],
    modes: ["Sur place", "Prise en main à distance", "Guidage par téléphone", "Guidage par vidéo", "Autre"],
    taches: [
      { g: "Dépannage", items: [
        { l: "Diagnostic de panne", c: [
          { l: "Ordinateur fixe ou portable", c: [
            { l: "Ne démarre pas" },
            { l: "Écran bleu (BSOD) ou récupération du système" },
            { l: "Lenteur" },
            { l: "Virus ou fenêtres suspectes" },
            { l: "Surchauffe ou bruit" },
            { l: "Écran, clavier ou batterie" },
            { l: "Mot de passe de session perdu" }
          ] },
          { l: "Smartphone ou tablette", c: [
            { l: "Écran ou batterie" },
            { l: "Lenteur ou stockage plein" },
            { l: "Compte ou mot de passe" },
            { l: "Transfert vers un nouvel appareil" }
          ] },
          { l: "Imprimante ou scanner", c: [
            { l: "N’imprime plus" },
            { l: "Connexion ou pilote" },
            { l: "Bourrage" },
            { l: "Qualité d’impression" }
          ] },
          { l: "Box ou wifi", c: [
            { l: "Plus de connexion" },
            { l: "Wifi faible" },
            { l: "Configuration" }
          ] },
          { l: "Autre équipement", libre: true }
        ] }
      ] },
      { g: "Installation et configuration", items: [
        { l: "Installation ou réinstallation du système", c: [
          systeme("Windows"), systeme("Linux"), systeme("macOS")
        ] },
        { l: "Logiciels et mises à jour" },
        { l: "Nouvel appareil, transfert des données" },
        { l: "Box et wifi" },
        { l: "Imprimante ou scanner" }
      ] },
      { g: "Matériel", items: [
        { l: "Évolution et optimisation du matériel", c: [
          { l: "Mémoire" },
          { l: "Disque ou SSD" },
          { l: "Batterie" },
          { l: "Ventilation et nettoyage" },
          { l: "Autre pièce" }
        ] }
      ] },
      { g: "Données et sécurité", items: [
        { l: "Sauvegarde et récupération de données" },
        { l: "Antivirus, mots de passe, arnaques" }
      ] },
      { g: "Messagerie et comptes en ligne", items: [
        { l: "Création d’une boîte mail" },
        { l: "Configuration (ordinateur, smartphone ou tablette)" },
        { l: "Récupération d’un mot de passe ou d’un accès" },
        { l: "Sécurisation (mot de passe solide, double authentification)" }
      ] },
      { g: "Accompagnement", items: [
        { l: "Démarches en ligne" },
        { l: "Conseils d’achat de matériel" },
        { l: "Formation à l’usage" },
        { l: "Autre", libre: true }
      ] }
    ]
  };

  window.METIERS = { vie: vie, info: info };
  window.NIVEAUX = NIVEAUX;
})();

/* Réglages de la page. À compléter après la création du Worker et du widget Turnstile. */
window.CONFIG = {
  /* Adresse du Worker Cloudflare qui reçoit les avis (par exemple https://avis-porte.xxx.workers.dev) */
  WORKER_URL: "https://avis-porte.guilhem-schlosser.workers.dev",
  /* Clé publique du widget Turnstile (test anti-robot) */
  TURNSTILE_SITEKEY: "0x4AAAAAAFSJ7S8l7qvz9YEe",
  /* Aucune adresse mail n’est publiée : le retrait se demande par le bouton de la page des avis */
  CONTACT: "",
  RESPONSABLE: "Guilhem Schlosser",
  /* Carte de visite affichée en tête de la page des avis.
     Chaque ligne laissée vide n’apparaît pas. Pour la compléter plus tard :
     siret : 14 chiffres (le lien vers l’annuaire officiel des entreprises se crée tout seul)
     site : adresse complète commençant par https://
     photo : "img/photo-profil.jpg" une fois le fichier ajouté */
  PROFIL: {
    nom: "Guilhem Schlosser",
    titre: "Assistant de vie et technicien d’assistance informatique",
    commune: "",
    siret: "",
    site: "",
    photo: "img/photo-profil.jpg"
  },
  /* Change à chaque modification du texte de consentement ou d’information */
  VERSION_TEXTE: "2026-10-v4",
  DUREE_ANS: 2
};

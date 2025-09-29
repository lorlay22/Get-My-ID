/**
 * Affiche l'interface utilisateur principale.
 */
function doGet() {
  // 'DialogUI.html' nom de fichier générique pour l'interface.
  return HtmlService.createHtmlOutputFromFile('DialogUI')
      .setTitle('Application Web de Traitement') // Titre générique
      .setSandboxMode(HtmlService.SandboxMode.IFRAME); // Mode de sécurité standard
}

/**
 * Se déclenche à l'ouverture du Google Sheet.
 * Crée menu personnalisé dans l'interface feuille de calcul.
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Outils Personnalisés') // Nom de menu générique
    .addItem('Lancer le traitement', 'showActionDialog') // Nom d'action générique
    .addToUi();
}

/**
 * Affiche boîte de dialogue modale pour l'action principale.
 */
function showActionDialog() {
  const htmlOutput = HtmlService.createHtmlOutputFromFile('DialogUI')
      .setWidth(400)
      .setHeight(300);
  // Le titre de la boîte de dialogue est également rendu générique.
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Lancer un traitement de données');
}

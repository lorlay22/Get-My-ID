/**
 * Gère cycle de vie des données en archivant enregistrements expirés.
 * fonction parcourt journal d'attribution, déplace enregistrements de plus
 * de 30 jours vers le journal historique, puis les supprime de feuille active.
 */
function archiveExpiredRecords() {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    // Utilisation noms de feuilles génériques définis précédemment
    const activeLogSheet = spreadsheet.getSheetByName('Journal_Attribution');
    const historyLogSheet = spreadsheet.getSheetByName('Journal_Historique');
    
    if (!activeLogSheet || !historyLogSheet) {
      Logger.log('Une des feuilles de journalisation ("Journal_Attribution" ou "Journal_Historique") est introuvable.');
      return;
    }

    // Règle métier transformée en constante pour meilleure lisibilité et maintenance
    const EXPIRATION_PERIOD_DAYS = 30;
    const expirationPeriodInMillis = EXPIRATION_PERIOD_DAYS * 24 * 60 * 60 * 1000;
    
    const allData = activeLogSheet.getDataRange().getValues();
    const currentDate = new Date();
    
    const recordsToMove = []; // Stocke les lignes complètes à déplacer
    const rowsToDelete = [];   // Stocke les numéros de ligne à supprimer

    // Parcourir chaque enregistrement, en ignorant ligne d'en-tête (i = 1)
    for (let i = 1; i < allData.length; i++) {
      const row = allData[i];
      const assignmentDate = new Date(row[2]); // date est dans la 3ème colonne (index 2)

      // Vérifie si date est valide et si période d'expiration est dépassée
      if (!isNaN(assignmentDate.getTime())) {
        const timeElapsed = currentDate.getTime() - assignmentDate.getTime();
        
        if (timeElapsed > expirationPeriodInMillis) {
          recordsToMove.push(row); // Ajoute la ligne entière à la liste des enregistrements à déplacer
          rowsToDelete.push(i + 1); // Ajoute l'index de la ligne à supprimer (1-based)
        }
      }
    }

    // Si enregistrements expirés ont été trouvés, les déplacer et les supprimer
    if (recordsToMove.length > 0) {
      // Ajoute enregistrements expirés à la fin du journal historique
      historyLogSheet.getRange(historyLogSheet.getLastRow() + 1, 1, recordsToMove.length, recordsToMove[0].length).setValues(recordsToMove);
      
      // Supprime lignes du journal actif en partant de la fin pour éviter décalages d'index
      for (let j = rowsToDelete.length - 1; j >= 0; j--) {
        activeLogSheet.deleteRow(rowsToDelete[j]);
      }

      Logger.log(`${recordsToMove.length} enregistrements expirés ont été archivés avec succès.`);
    } else {
      Logger.log('Aucun enregistrement à archiver.');
    }
  } catch (error) {
    Logger.log(`Erreur lors du processus d'archivage : ${error.message}`);
  }
}

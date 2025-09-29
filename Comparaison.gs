/**
 * Vérifie si identifiants de l'onglet "Journal_Attribution" existent 
 * parmi 200 derniers enregistrements de la source de données externe (API).
 * Le résultat ('Oui'/'Non') est inscrit dans colonne C de la même feuille.
 */
function checkIDsAgainstExternalAPI() {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    // Nom de feuille générique, cohérent avec scripts précédents
    const sheet = spreadsheet.getSheetByName('Journal_Attribution');
    if (!sheet) {
      Logger.log('La feuille "Journal_Attribution" est introuvable.');
      return;
    }

    // Récupérer identifiants de feuille de calcul
    const lastRow = sheet.getLastRow();
    let idsFromSheet = [];
    
    if (lastRow > 0) {
      const idRange = sheet.getRange(1, 1, lastRow, 1).getValues();
      idsFromSheet = idRange.map(row => row[0].toString().trim());
    }
    
    if (idsFromSheet.length === 0) {
      Logger.log("Aucun identifiant à vérifier dans la feuille.");
      return;
    }

    // Récupérer derniers identifiants de source de données externe
    const latestIDsFromAPI = fetchLatestIDsFromAPI(200);
    Logger.log(`${latestIDsFromAPI.length} identifiants récents récupérés depuis l'API.`);

    // Comparer listes
    const results = idsFromSheet.map(id => {
      // méthode includes est sensible à la casse, s'assurer que données sont homogènes
      const existsInAPI = latestIDsFromAPI.includes(id) ? 'Oui' : 'Non';
      return [existsInAPI]; 
    });

    // Écrire résultats de la vérification dans colonne C
    if (lastRow > 0) {
      sheet.getRange(1, 3, results.length, 1).setValues(results);
    }

    Logger.log('La vérification des identifiants est terminée.');
    
  } catch (error) {
    Logger.log(`Erreur lors de la vérification des identifiants : ${error.message}`);
  }
}

/**
 * Récupère nombre défini des derniers identifiants numériques depuis l'API.
 * @param {number} count nombre d'identifiants à récupérer.
 * @returns {Array<string>} tableau des derniers identifiants numériques.
 */
function fetchLatestIDsFromAPI(count) {
  try {
    const accessToken = getAccessToken(); // Fonction d'authentification générique
    const offset = 0; // récupère les plus récents, donc offset à 0
    
    // Appel à la fonction générique de récupération de données
    const apiData = fetchDataBatch(accessToken, offset, count);
    
    const latestNumericIDs = [];

    if (apiData && apiData.results && apiData.results.length > 0) {
      apiData.results.forEach(function(item) {
        // Nom de champ générique, cohérent avec scripts précédents
        const id = item.itemCode;

        // Filtre pour ne garder qu'identifiants purement numériques
        if (/^\d+$/.test(id)) { 
          latestNumericIDs.push(id);
        }
      });
    } else {
      Logger.log('Aucun enregistrement trouvé dans les données de l\'API.');
    }

    return latestNumericIDs;

  } catch (error) {
    Logger.log(`Erreur lors de la récupération des identifiants depuis l'API : ${error.message}`);
    return [];
  }
}

/**
 * *********************************************************************************
 * NOTE DE SÉCURITÉ IMPORTANTE POUR UN PORTEFEUILLE
 * * Identifiants (client_id, client_secret) ne doivent JAMAIS être stockés en clair
 * dans le code. Pour application réelle, utilisez PropertiesService de Google
 * pour stocker de manière sécurisée.
 * * Ex: PropertiesService.getScriptProperties().getProperty('API_CLIENT_ID');
 * * Cette version utilise des placeholders pour la démonstration.
 * *********************************************************************************
 */

/**
 * Obtient token d'accès via OAuth2 auprès d'une API externe.
 * @returns {string} Le token d'accès.
 */
function getAccessToken() {
  // L'URL de l'API a été rendue générique.
  const url = 'https://votre-domaine.api-fournisseur.com/api/token';
  
  //LES SECRETS ONT ÉTÉ SUPPRIMÉS ET REMPLACÉS PAR DES PLACEHOLDERS
  const payload = {
    'client_id': 'VOTRE_CLIENT_ID', // À stocker dans PropertiesService
    'client_secret': 'VOTRE_CLIENT_SECRET', // À stocker dans PropertiesService
    'grant_type': 'client_credentials'
  };

  const options = {
    'method': 'post',
    'payload': payload,
    'contentType': 'application/x-www-form-urlencoded',
    'muteHttpExceptions': true
  };

  const response = UrlFetchApp.fetch(url, options);
  Logger.log(`Code de réponse (token): ${response.getResponseCode()}`);

  if (response.getResponseCode() === 200) {
    const responseData = JSON.parse(response.getContentText());
    return responseData.access_token;
  } else {
    Logger.log(`Corps de la réponse (erreur token): ${response.getContentText()}`);
    throw new Error("Erreur lors de l'obtention du token d'accès.");
  }
}

/**
 * Obtient nombre total d'enregistrements (ex: employés) depuis endpoint de l'API.
 * @param {string} accessToken - Le token d'accès Bearer.
 * @returns {number} nombre total d'enregistrements.
 */
function getTotalRecordCount(accessToken) {
  const url = 'https://votre-domaine.api-fournisseur.com/api/v1.0/directory/items?count=1&offset=0'; 
  const headers = {
    'Authorization': 'Bearer ' + accessToken
  };

  const options = {
    'method': 'get',
    'headers': headers,
    'muteHttpExceptions': true
  };

  const response = UrlFetchApp.fetch(url, options);
  Logger.log(`Code de réponse (compte total): ${response.getResponseCode()}`);

  if (response.getResponseCode() === 200) {
    const data = JSON.parse(response.getContentText());
    return data.totalCount || 0;
  } else {
    Logger.log(`Corps de la réponse (erreur compte total): ${response.getContentText()}`);
    throw new Error("Erreur API lors de la récupération du nombre total d'enregistrements.");
  }
}

/**
 * Récupère lot de données depuis l'API en utilisant pagination.
 * @param {string} accessToken - token d'accès Bearer.
 * @param {number} offset - point de départ pour récupération des données.
 * @param {number} count - nombre d'enregistrements à récupérer.
 * @returns {Object} données récupérées depuis l'API.
 */
function fetchDataBatch(accessToken, offset, count) {
  const url = `https://votre-domaine.api-fournisseur.com/api/v1.0/directory/items?count=${count}&offset=${offset}`;
  const headers = {
    'Authorization': 'Bearer ' + accessToken
  };

  const options = {
    'method': 'get',
    'headers': headers,
    'muteHttpExceptions': true
  };

  const response = UrlFetchApp.fetch(url, options);

  if (response.getResponseCode() === 200) {
    return JSON.parse(response.getContentText());
  } else {
    Logger.log(`Erreur API: ${response.getContentText()}`);
    throw new Error("Erreur lors de la récupération d'un lot de données.");
  }
}

/**
 * Fonction principale qui orchestre récupération des 50 derniers identifiants numériques
 * depuis API et les écrit dans un Google Sheet.
 */
function importLatestNumericIDs() {
  try {
    const accessToken = getAccessToken();
    if (!accessToken) {
      Logger.log("Token d'accès non obtenu. Arrêt du script.");
      return;
    }
    
    const totalRecords = getTotalRecordCount(accessToken);
    Logger.log(`Nombre total d'enregistrements trouvés : ${totalRecords}`);

    if (totalRecords === 0) {
      Logger.log("Aucun enregistrement trouvé. L'opération est terminée.");
      return;
    }

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    // noms des onglets ont été rendus génériques
    const destinationSheet = spreadsheet.getSheetByName('Import_API_Resultats');
    
    if (!destinationSheet) {
      Logger.log("La feuille de destination 'Import_API_Resultats' est introuvable.");
      return;
    }

    // Nettoyage de feuille de destination
    destinationSheet.clear();
    Logger.log(`La feuille '${destinationSheet.getName()}' a été nettoyée.`);

    // Ajout d'un en-tête avec horodatage
    const now = new Date();
    destinationSheet.appendRow([`Dernière importation effectuée le : ${now.toLocaleString()}`]);
    destinationSheet.appendRow(['Identifiant Importé']); // Ajout d'un en-tête de colonne

    const batchSize = 50;
    const offset = Math.max(0, totalRecords - batchSize); // Assure que l'offset n'est pas négatif
    
    const data = fetchDataBatch(accessToken, offset, batchSize);
    
    if (data && data.results && data.results.length > 0) {
      Logger.log(`${data.results.length} enregistrements récupérés.`);
      
      const idsToWrite = [];

      data.results.forEach(function(item) {
        // Le nom du champ 'employeeNumber' a été généralisé en 'itemCode'
        const id = item.itemCode; 

        // Vérification si l'identifiant est purement numérique
        if (/^\d+$/.test(id)) { 
          idsToWrite.push([id]); // Ajoute ID dans tableau pour une écriture en lot
        } else {
          Logger.log(`ID non numérique ignoré : ${id}`);
        }
      });

      if (idsToWrite.length > 0) {
        // Écriture en une seule fois pour de meilleures performances
        destinationSheet.getRange(destinationSheet.getLastRow() + 1, 1, idsToWrite.length, 1).setValues(idsToWrite);
        Logger.log(`${idsToWrite.length} identifiants numériques ont été écrits dans la feuille.`);
      } else {
        Logger.log("Aucun nouvel identifiant numérique à écrire.");
      }

    } else {
      Logger.log('Aucun enregistrement trouvé dans le dernier lot.');
    }

  } catch (error) {
    Logger.log(`ERREUR GLOBALE: ${error.message}\n${error.stack}`);
  }
}

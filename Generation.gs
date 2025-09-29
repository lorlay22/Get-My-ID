// Variable de session pour stocker temporairement identifiants générés
var temporaryIDCache = [];

/**
 * Génèrun lot d'identifiants uniques.
 * priorise l'utilisation d'IDs disponibles dans un pool de données ("Archives")
 * avant d'en générer de nouveaux.
 * @param {number} numToGenerate Le nombre d'identifiants à fournir.
 * @returns {Array<string>} tableau d'identifiants uniques.
 */
function generateAndCacheIDs(numToGenerate) {
  temporaryIDCache = []; // Réinitialise cache de session

  // Tente de récupérer IDs depuis pool de données disponibles
  const pooledIDs = getIDsFromPool(numToGenerate);
  temporaryIDCache = pooledIDs;

  // Si pool ne suffit pas, génère identifiants manquants
  const remainingToGenerate = numToGenerate - temporaryIDCache.length;
  if (remainingToGenerate > 0) {
    const newIDs = generateNewIDs(remainingToGenerate);
    temporaryIDCache = temporaryIDCache.concat(newIDs); // Ajoute les nouveaux IDs
  }

  Logger.log(`${temporaryIDCache.length} identifiants préparés dans le cache.`);
  return temporaryIDCache;
}

/**
 * Récupère nombre donné d'identifiants depuis une feuille de calcul servant de pool.
 * @param {number} numToRetrieve Le nombre d'identifiants à récupérer.
 * @returns {Array<string>} Un tableau d'identifiants du pool.
 */
function getIDsFromPool(numToRetrieve) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  // nom de feuille a été rendu générique
  const poolSheet = ss.getSheetByName('Pool_Donnees');

  if (!poolSheet) {
    Logger.log('La feuille "Pool_Donnees" est introuvable.');
    return [];
  }

  const data = poolSheet.getDataRange().getValues();
  const availableIDs = [];

  // Parcourt données pour récupérer IDs nécessaires (ignore l'en-tête)
  for (let i = 1; i < data.length && availableIDs.length < numToRetrieve; i++) {
    const id = data[i][0]; // Suppose qu' IDs sont dans première colonne
    if (id) {
      availableIDs.push(id.toString());
    }
  }

  Logger.log(`${availableIDs.length} identifiants récupérés depuis le pool.`);
  return availableIDs;
}

/**
 * Assigne et journalise identifiants pour utilisateur.
 * IDs assignés sont enregistrés et supprimés du pool de données.
 * @param {Array<string>} idsToAssign identifiants à enregistrer.
 * @returns {string} "success" ou "error".
 */
function assignAndLogIDs(idsToAssign) {
  try {
    // L'ID du Spreadsheet a été retiré pour rendre script portable.
    // Le script agira sur feuille de calcul à laquelle il est lié.
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const assignmentLogSheet = ss.getSheetByName("Journal_Attribution");
    const poolSheet = ss.getSheetByName("Pool_Donnees");
    const userEmail = Session.getActiveUser().getEmail();
    const currentDate = new Date();

    if (!assignmentLogSheet || !poolSheet) {
      throw new Error('Une des feuilles requises (Journal_Attribution ou Pool_Donnees) est introuvable.');
    }

    // Ajoute en-tête au journal si feuille est vide
    if (assignmentLogSheet.getLastRow() === 0) {
      assignmentLogSheet.appendRow(['Identifiant', 'Utilisateur', 'Date d\'Assignation']);
    }
    
    // Prépare données pour écriture en lot (plus performant)
    const rowsToAdd = idsToAssign.map(id => [id, userEmail, currentDate]);
    assignmentLogSheet.getRange(assignmentLogSheet.getLastRow() + 1, 1, rowsToAdd.length, rowsToAdd[0].length).setValues(rowsToAdd);
    
    // Supprime IDs assignés du pool de données
    removeIDsFromSheet(poolSheet, idsToAssign);

    Logger.log(`${idsToAssign.length} identifiants ont été assignés à ${userEmail}.`);
    return "success";
  } catch (error) {
    Logger.log(`Erreur lors de l'assignation des IDs : ${error.toString()}`);
    return "error";
  }
}

/**
 * Utilitaire pour supprimer lignes d'une feuille en fonction des valeurs d'IDs.
 * @param {Sheet} sheet La feuille de calcul à modifier.
 * @param {Array<string>} idsToRemove Les IDs à trouver et supprimer.
 */
function removeIDsFromSheet(sheet, idsToRemove) {
    const data = sheet.getDataRange().getValues();
    const rowsToDelete = new Set();
    const idsToRemoveSet = new Set(idsToRemove);

    // Identifie numéros de ligne à supprimer
    for (let i = 1; i < data.length; i++) { // Ignore l'en-tête
        if (idsToRemoveSet.has(data[i][0].toString())) {
            rowsToDelete.add(i + 1); // Ajoute le numéro de ligne (1-based)
        }
    }

    // Supprime lignes en partant de la fin pour éviter problèmes d'index
    const sortedRows = Array.from(rowsToDelete).sort((a, b) => b - a);
    sortedRows.forEach(rowNum => sheet.deleteRow(rowNum));
    Logger.log(`${sortedRows.length} lignes supprimées de la feuille '${sheet.getName()}'.`);
}


/**
 * Génère de nouveaux identifiants uniques basés sur algorithme personnalisé.
 * algorithme se base sur dernier ID trouvé dans sources de données.
 * @param {number} numToGenerate nombre d'identifiants à générer.
 * @returns {Array<string>} tableau de nouveaux identifiants.
 */
function generateNewIDs(numToGenerate) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const assignmentLogSheet = ss.getSheetByName('Journal_Attribution');
  const externalDataSourceSheet = ss.getSheetByName('Import_API_Resultats'); // Données d'une autre source

  if (!assignmentLogSheet || !externalDataSourceSheet) {
    Logger.log('Une des feuilles de données source est introuvable.');
    return [];
  }

  // Trouve dernière valeur de base à partir de plusieurs sources
  let lastIDValue = findLastValue(assignmentLogSheet, 1) || findLastValue(externalDataSourceSheet, 1);
  let baseNumber;
  
  // algorithme spécifique a été généralisé avec des commentaires.
  // Exemple: L'ID est composé d'un préfixe, d'une base et d'un checksum.
  // Format: PBBBBBCC (P=Préfixe, B=Base, C=Checksum)
  if (lastIDValue && lastIDValue.toString().startsWith('5') && lastIDValue.length === 8) {
    baseNumber = parseInt(lastIDValue.substring(1, 6), 10);
  } else {
    // Valeur par défaut si aucun ID précédent n'est trouvé
    baseNumber = 1; 
  }

  const generatedIDs = [];
  for (let i = 0; i < numToGenerate; i++) {
    baseNumber = incrementBase(baseNumber, 5); // Incrémente une base de 5 chiffres
    generatedIDs.push(generateIDWithChecksum(baseNumber, '5', 5, 2));
  }

  Logger.log(`Génération de ${generatedIDs.length} nouveaux identifiants.`);
  return generatedIDs;
}

/**
 * Trouve la dernière valeur non vide dans une colonne donnée.
 * @param {Sheet} sheet La feuille à analyser.
 * @param {number} colIndex L'index de la colonne (1-based).
 * @returns {string|null} La dernière valeur ou null.
 */
function findLastValue(sheet, colIndex) {
    const lastRow = sheet.getLastRow();
    if (lastRow === 0) return null;
    const range = sheet.getRange(1, colIndex, lastRow);
    const values = range.getValues();
    for (let i = values.length - 1; i >= 0; i--) {
        if (values[i][0] !== "") {
            return values[i][0];
        }
    }
    return null;
}

/**
 * Incrémente base numérique en gérant dépassement (rollover).
 * @param {number} currentBase base actuelle.
 * @param {number} numDigits nombre de chiffres de la base.
 * @returns {number} nouvelle base incrémentée.
 */
function incrementBase(currentBase, numDigits) {
  const upperBound = Math.pow(10, numDigits);
  currentBase = (currentBase + 1) % upperBound;
  return currentBase === 0 ? 1 : currentBase; // Recommence à 1 après avoir atteint limite
}

/**
 * Génère identifiant complet avec clé de contrôle (checksum).
 * Cet algorithme est un exemple de génération d'ID structuré.
 * @param {number} base Le numéro de base sur lequel calculer l'ID.
 * @param {string} prefix Le préfixe fixe de l'ID.
 * @param {number} baseLength La longueur de la base (pour le padding).
 * @param {number} checksumLength La longueur du checksum (pour le padding).
 * @returns {string} L'identifiant complet (ex: "50000192").
 */
function generateIDWithChecksum(base, prefix, baseLength, checksumLength) {
  const baseStr = base.toString().padStart(baseLength, '0');
  
  // Logique de calcul du checksum 
  const partA = Math.floor(base / 10);
  const partB = base % 10;
  // La formule ci-dessous est un exemple de checksum et n'est pas liée à un standard public.
  const checksum = 89 - ((71 * partA + 13 * partB) % 89);
  const checksumStr = checksum.toString().padStart(checksumLength, '0');
  
  return prefix + baseStr + checksumStr;
}

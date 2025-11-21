/**
 * DBHelper - Wrapper pour les requêtes de base de données
 *
 * Fournit une couche d'abstraction autour de window.electronAPI.dbQuery
 * avec gestion d'erreurs centralisée, logging et retry automatique.
 *
 * @module DBHelper
 */

import { log } from './logger';

/**
 * Résultat d'une requête DB
 */
export interface DBResult<T = any> {
  success: boolean;
  data?: T[];
  error?: string;
}

/**
 * Options pour une requête DB
 */
export interface DBQueryOptions {
  /** Nom du module appelant (pour logging) */
  module?: string;
  /** Nombre de tentatives en cas d'échec (default: 1) */
  retries?: number;
  /** Délai entre les tentatives en ms (default: 100) */
  retryDelay?: number;
  /** Afficher une notification en cas d'erreur */
  showNotification?: boolean;
  /** Message personnalisé pour la notification d'erreur */
  errorMessage?: string;
  /** Silencieux (pas de logs) */
  silent?: boolean;
}

/**
 * Classe DBHelper - Gestionnaire de requêtes DB
 */
class DBHelper {
  /**
   * Execute une requête SQL avec gestion d'erreurs
   *
   * @param query - Requête SQL à exécuter
   * @param params - Paramètres de la requête
   * @param options - Options de la requête
   * @returns Promesse avec le résultat
   */
  async query<T = any>(
    query: string,
    params: any[] = [],
    options: DBQueryOptions = {}
  ): Promise<DBResult<T>> {
    const {
      module = 'DBHelper',
      retries = 1,
      retryDelay = 100,
      showNotification = false,
      errorMessage,
      silent = false
    } = options;

    // Log de la requête (si pas silencieux)
    if (!silent) {
      log.debug(module, `Executing query: ${query}`, { params });
    }

    let lastError: string | null = null;

    // Boucle de retry
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        // Vérifier que l'API Electron est disponible
        if (!window.electronAPI || !window.electronAPI.dbQuery) {
          throw new Error('Electron API not available');
        }

        // Exécuter la requête
        const result = await window.electronAPI.dbQuery(query, params);

        // Vérifier le résultat
        if (!result.success) {
          throw new Error(result.error || 'Unknown database error');
        }

        // Log du succès (si pas silencieux)
        if (!silent) {
          log.info(module, `Query successful (${result.data?.length || 0} rows)`, {
            query: query.substring(0, 100) // Limiter la taille du log
          });
        }

        return result;

      } catch (error: any) {
        lastError = error.message || 'Unknown error';

        // Log de l'erreur (si pas silencieux)
        if (!silent) {
          log.error(module, `Query failed (attempt ${attempt}/${retries}): ${lastError}`, {
            query,
            params,
            error: error.stack
          });
        }

        // Si ce n'est pas la dernière tentative, attendre avant de réessayer
        if (attempt < retries) {
          await this.delay(retryDelay);
          if (!silent) {
            log.debug(module, `Retrying query (attempt ${attempt + 1}/${retries})...`);
          }
        }
      }
    }

    // Toutes les tentatives ont échoué
    const finalError = errorMessage || `Erreur de base de données: ${lastError}`;

    // Afficher une notification si demandé
    if (showNotification && window.electronAPI?.showNotification) {
      // Note: Nécessite l'implémentation de showNotification dans l'API Electron
      // ou utiliser le NotificationContext si disponible
      console.error('DB Error:', finalError);
    }

    return {
      success: false,
      error: finalError
    };
  }

  /**
   * Execute une requête SELECT
   *
   * @param table - Nom de la table
   * @param columns - Colonnes à sélectionner (default: '*')
   * @param where - Clause WHERE (optionnelle)
   * @param params - Paramètres pour la clause WHERE
   * @param options - Options de la requête
   * @returns Promesse avec les résultats
   */
  async select<T = any>(
    table: string,
    columns: string = '*',
    where?: string,
    params: any[] = [],
    options: DBQueryOptions = {}
  ): Promise<DBResult<T>> {
    const query = where
      ? `SELECT ${columns} FROM ${table} WHERE ${where}`
      : `SELECT ${columns} FROM ${table}`;

    return this.query<T>(query, params, {
      ...options,
      module: options.module || `DBHelper:select:${table}`
    });
  }

  /**
   * Execute une requête INSERT
   *
   * @param table - Nom de la table
   * @param data - Données à insérer
   * @param options - Options de la requête
   * @returns Promesse avec le résultat
   */
  async insert(
    table: string,
    data: Record<string, any>,
    options: DBQueryOptions = {}
  ): Promise<DBResult> {
    const columns = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    const values = Object.values(data);

    const query = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;

    return this.query(query, values, {
      ...options,
      module: options.module || `DBHelper:insert:${table}`
    });
  }

  /**
   * Execute une requête UPDATE
   *
   * @param table - Nom de la table
   * @param data - Données à mettre à jour
   * @param where - Clause WHERE
   * @param whereParams - Paramètres pour la clause WHERE
   * @param options - Options de la requête
   * @returns Promesse avec le résultat
   */
  async update(
    table: string,
    data: Record<string, any>,
    where: string,
    whereParams: any[] = [],
    options: DBQueryOptions = {}
  ): Promise<DBResult> {
    const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(data), ...whereParams];

    const query = `UPDATE ${table} SET ${setClause} WHERE ${where}`;

    return this.query(query, values, {
      ...options,
      module: options.module || `DBHelper:update:${table}`
    });
  }

  /**
   * Execute une requête DELETE
   *
   * @param table - Nom de la table
   * @param where - Clause WHERE
   * @param params - Paramètres pour la clause WHERE
   * @param options - Options de la requête
   * @returns Promesse avec le résultat
   */
  async delete(
    table: string,
    where: string,
    params: any[] = [],
    options: DBQueryOptions = {}
  ): Promise<DBResult> {
    const query = `DELETE FROM ${table} WHERE ${where}`;

    return this.query(query, params, {
      ...options,
      module: options.module || `DBHelper:delete:${table}`
    });
  }

  /**
   * Attendre un délai
   *
   * @param ms - Durée en millisecondes
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Vérifie si la connexion DB est disponible
   *
   * @returns true si la connexion est OK
   */
  async isConnected(): Promise<boolean> {
    try {
      const result = await this.query('SELECT 1 as test', [], {
        silent: true,
        module: 'DBHelper:health'
      });
      return result.success;
    } catch {
      return false;
    }
  }

  /**
   * Execute une transaction (plusieurs requêtes)
   *
   * @param queries - Liste de requêtes à exécuter
   * @param options - Options communes
   * @returns true si toutes les requêtes réussissent
   */
  async transaction(
    queries: Array<{ query: string; params?: any[] }>,
    options: DBQueryOptions = {}
  ): Promise<boolean> {
    const module = options.module || 'DBHelper:transaction';

    log.info(module, `Starting transaction with ${queries.length} queries`);

    // Note: sql.js ne supporte pas les vraies transactions
    // On exécute simplement les requêtes séquentiellement
    // En cas d'erreur, on devrait idéalement rollback mais ce n'est pas supporté

    for (let i = 0; i < queries.length; i++) {
      const { query, params = [] } = queries[i];

      const result = await this.query(query, params, {
        ...options,
        module: `${module}:step${i + 1}`
      });

      if (!result.success) {
        log.error(module, `Transaction failed at step ${i + 1}/${queries.length}`);
        return false;
      }
    }

    log.info(module, `Transaction completed successfully`);
    return true;
  }
}

/**
 * Instance singleton du DBHelper
 */
export const db = new DBHelper();

export default db;

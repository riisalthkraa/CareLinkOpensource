/**
 * Logger - Système de logging centralisé
 *
 * Fournit un système de journalisation unifié pour toute l'application
 * avec différents niveaux de log (debug, info, warn, error).
 *
 * Fonctionnalités:
 * - Logs catégorisés par niveau et module
 * - Horodatage automatique
 * - Stockage en mémoire des logs récents
 * - Export des logs possible
 * - Support console.log avec couleurs
 *
 * @module Logger
 */

/**
 * Niveaux de log disponibles
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

/**
 * Structure d'une entrée de log
 */
export interface LogEntry {
  /** Horodatage du log */
  timestamp: Date;
  /** Niveau de log */
  level: LogLevel;
  /** Module source du log */
  module: string;
  /** Message du log */
  message: string;
  /** Données additionnelles (optionnel) */
  data?: any;
}

/**
 * Couleurs console pour chaque niveau de log
 */
const LOG_COLORS = {
  [LogLevel.DEBUG]: '#9CA3AF', // Gris
  [LogLevel.INFO]: '#3B82F6',  // Bleu
  [LogLevel.WARN]: '#F59E0B',  // Orange
  [LogLevel.ERROR]: '#EF4444'  // Rouge
};

/**
 * Emojis pour chaque niveau de log
 */
const LOG_EMOJIS = {
  [LogLevel.DEBUG]: '🔍',
  [LogLevel.INFO]: 'ℹ️',
  [LogLevel.WARN]: '⚠️',
  [LogLevel.ERROR]: '❌'
};

/**
 * Classe Logger - Gestionnaire de logs
 */
class Logger {
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;
  private enableConsole: boolean = true;

  /**
   * Log un message de debug
   * @param module - Module source
   * @param message - Message à logger
   * @param data - Données additionnelles
   */
  debug(module: string, message: string, data?: any): void {
    this.log(LogLevel.DEBUG, module, message, data);
  }

  /**
   * Log un message d'information
   * @param module - Module source
   * @param message - Message à logger
   * @param data - Données additionnelles
   */
  info(module: string, message: string, data?: any): void {
    this.log(LogLevel.INFO, module, message, data);
  }

  /**
   * Log un avertissement
   * @param module - Module source
   * @param message - Message à logger
   * @param data - Données additionnelles
   */
  warn(module: string, message: string, data?: any): void {
    this.log(LogLevel.WARN, module, message, data);
  }

  /**
   * Log une erreur
   * @param module - Module source
   * @param message - Message à logger
   * @param data - Données additionnelles (souvent l'objet Error)
   */
  error(module: string, message: string, data?: any): void {
    this.log(LogLevel.ERROR, module, message, data);
  }

  /**
   * Méthode principale de logging
   */
  private log(level: LogLevel, module: string, message: string, data?: any): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      module,
      message,
      data
    };

    // Ajouter à l'historique
    this.logs.push(entry);

    // Limiter la taille de l'historique
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Afficher dans la console si activé
    if (this.enableConsole) {
      this.logToConsole(entry);
    }

    // TODO: Envoyer au backend pour persistance
    // this.sendToBackend(entry);
  }

  /**
   * Affiche un log dans la console avec formatage
   */
  private logToConsole(entry: LogEntry): void {
    const time = this.formatTime(entry.timestamp);
    const emoji = LOG_EMOJIS[entry.level];
    const color = LOG_COLORS[entry.level];

    const consoleMethod = this.getConsoleMethod(entry.level);

    if (entry.data) {
      consoleMethod(
        `%c${emoji} [${time}] [${entry.level}] [${entry.module}] ${entry.message}`,
        `color: ${color}; font-weight: bold;`,
        entry.data
      );
    } else {
      consoleMethod(
        `%c${emoji} [${time}] [${entry.level}] [${entry.module}] ${entry.message}`,
        `color: ${color}; font-weight: bold;`
      );
    }
  }

  /**
   * Sélectionne la méthode console appropriée selon le niveau
   */
  private getConsoleMethod(level: LogLevel): typeof console.log {
    switch (level) {
      case LogLevel.ERROR:
        return console.error.bind(console);
      case LogLevel.WARN:
        return console.warn.bind(console);
      case LogLevel.INFO:
        return console.info.bind(console);
      case LogLevel.DEBUG:
      default:
        return console.log.bind(console);
    }
  }

  /**
   * Formate l'horodatage pour affichage
   */
  private formatTime(date: Date): string {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  }

  /**
   * Récupère tous les logs
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Récupère les logs filtrés par niveau
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Récupère les logs filtrés par module
   */
  getLogsByModule(module: string): LogEntry[] {
    return this.logs.filter(log => log.module === module);
  }

  /**
   * Efface tous les logs
   */
  clearLogs(): void {
    this.logs = [];
    this.info('Logger', 'Logs cleared');
  }

  /**
   * Exporte les logs au format JSON
   */
  exportLogsAsJSON(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Exporte les logs au format texte
   */
  exportLogsAsText(): string {
    return this.logs
      .map(log => {
        const time = log.timestamp.toISOString();
        const data = log.data ? ` | Data: ${JSON.stringify(log.data)}` : '';
        return `[${time}] [${log.level}] [${log.module}] ${log.message}${data}`;
      })
      .join('\n');
  }

  /**
   * Active/désactive l'affichage console
   */
  setConsoleEnabled(enabled: boolean): void {
    this.enableConsole = enabled;
  }

  /**
   * Définit le nombre maximum de logs à conserver
   */
  setMaxLogs(max: number): void {
    this.maxLogs = max;
    if (this.logs.length > max) {
      this.logs = this.logs.slice(-max);
    }
  }

  /**
   * Obtient les statistiques des logs
   */
  getStats(): {
    total: number;
    byLevel: Record<LogLevel, number>;
    byModule: Record<string, number>;
  } {
    const byLevel = {
      [LogLevel.DEBUG]: 0,
      [LogLevel.INFO]: 0,
      [LogLevel.WARN]: 0,
      [LogLevel.ERROR]: 0
    };

    const byModule: Record<string, number> = {};

    this.logs.forEach(log => {
      byLevel[log.level]++;
      byModule[log.module] = (byModule[log.module] || 0) + 1;
    });

    return {
      total: this.logs.length,
      byLevel,
      byModule
    };
  }
}

/**
 * Instance singleton du logger
 */
export const logger = new Logger();

/**
 * Fonctions utilitaires pour un usage simplifié
 */
export const log = {
  debug: (module: string, message: string, data?: any) => logger.debug(module, message, data),
  info: (module: string, message: string, data?: any) => logger.info(module, message, data),
  warn: (module: string, message: string, data?: any) => logger.warn(module, message, data),
  error: (module: string, message: string, data?: any) => logger.error(module, message, data)
};

export default logger;

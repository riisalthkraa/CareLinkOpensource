import React, { useState, useEffect } from 'react';
import { useNotification } from '../contexts/NotificationContext';

/**
 * Interface représentant les informations d'un backup
 */
interface BackupInfo {
  filename: string;
  path: string;
  timestamp: number;
  date: string;
  size: number;
  sizeFormatted: string;
  type: 'auto' | 'manual';
}

/**
 * Interface pour les statistiques globales des backups
 */
interface BackupStatus {
  totalBackups: number;
  totalSize: number;
  totalSizeFormatted: string;
  lastBackup: BackupInfo | null;
  backupFolder: string;
}

/**
 * Props du composant Backup
 */
interface BackupProps {
  onBack: () => void;
}

/**
 * Types de modales de confirmation
 */
type ConfirmationType = 'restore' | 'delete' | null;

/**
 * Page de gestion des backups de la base de données
 *
 * Fonctionnalités:
 * - Affichage du statut global (nombre, taille, dernier backup)
 * - Liste des backups avec tri par date
 * - Création de backup manuel
 * - Restauration de backup avec confirmation
 * - Suppression de backup avec confirmation
 * - Ouverture du dossier des backups
 * - Actualisation de la liste
 *
 * @param {BackupProps} props - Props du composant
 * @returns {JSX.Element} Page de gestion des backups
 */
const Backup: React.FC<BackupProps> = ({ onBack }) => {
  // États pour les données
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [status, setStatus] = useState<BackupStatus | null>(null);

  // États pour les opérations en cours
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isRestoring, setIsRestoring] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // États pour les modales de confirmation
  const [confirmationType, setConfirmationType] = useState<ConfirmationType>(null);
  const [selectedBackup, setSelectedBackup] = useState<BackupInfo | null>(null);

  const { addNotification } = useNotification();

  /**
   * Charge la liste des backups depuis l'API Electron
   *
   * @returns {Promise<void>}
   */
  const loadBackups = async (): Promise<void> => {
    try {
      setIsLoading(true);

      // Charger la liste des backups
      const listResponse = await window.electronAPI.backupList();

      if (listResponse.success && listResponse.data) {
        // Trier par date décroissante (plus récent en premier)
        const sortedBackups = [...listResponse.data].sort((a, b) => b.timestamp - a.timestamp);
        setBackups(sortedBackups);
      } else {
        addNotification({
          type: 'error',
          title: 'Erreur',
          message: 'Impossible de charger les backups'
        });
        setBackups([]);
      }

      // Charger le statut global
      const statusResponse = await window.electronAPI.backupStatus();

      if (statusResponse.success && statusResponse.data) {
        setStatus(statusResponse.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des backups:', error);
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de charger les backups'
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Crée un nouveau backup manuel
   *
   * @returns {Promise<void>}
   */
  const handleCreateBackup = async (): Promise<void> => {
    try {
      setIsCreating(true);

      const response = await window.electronAPI.backupCreate();

      if (response) {
        addNotification({
          type: 'success',
          title: 'Backup créé',
          message: 'Le backup manuel a été créé avec succès'
        });
        await loadBackups(); // Recharger la liste
      } else {
        addNotification({
          type: 'error',
          title: 'Erreur',
          message: 'Impossible de créer le backup'
        });
      }
    } catch (error) {
      console.error('Erreur lors de la création du backup:', error);
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de créer le backup'
      });
    } finally {
      setIsCreating(false);
    }
  };

  /**
   * Restaure un backup après confirmation
   *
   * @param {BackupInfo} backup - Backup à restaurer
   * @returns {Promise<void>}
   */
  const handleRestoreBackup = async (backup: BackupInfo): Promise<void> => {
    try {
      setIsRestoring(backup.filename);

      const response = await window.electronAPI.backupRestore(backup.filename);

      if (response.success) {
        addNotification({
          type: 'success',
          title: 'Backup restauré',
          message: 'La base de données a été restaurée avec succès'
        });
        await loadBackups(); // Recharger la liste
      } else {
        addNotification({
          type: 'error',
          title: 'Erreur',
          message: response.error || 'Échec de la restauration'
        });
      }
    } catch (error) {
      console.error('Erreur lors de la restauration du backup:', error);
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de restaurer le backup'
      });
    } finally {
      setIsRestoring(null);
      setConfirmationType(null);
      setSelectedBackup(null);
    }
  };

  /**
   * Supprime un backup après confirmation
   *
   * @param {BackupInfo} backup - Backup à supprimer
   * @returns {Promise<void>}
   */
  const handleDeleteBackup = async (backup: BackupInfo): Promise<void> => {
    try {
      setIsDeleting(backup.filename);

      const response = await window.electronAPI.backupDelete(backup.filename);

      if (response.success) {
        addNotification({
          type: 'success',
          title: 'Backup supprimé',
          message: 'Le backup a été supprimé avec succès'
        });
        await loadBackups(); // Recharger la liste
      } else {
        addNotification({
          type: 'error',
          title: 'Erreur',
          message: response.error || 'Échec de la suppression'
        });
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du backup:', error);
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de supprimer le backup'
      });
    } finally {
      setIsDeleting(null);
      setConfirmationType(null);
      setSelectedBackup(null);
    }
  };

  /**
   * Ouvre le dossier des backups dans l'explorateur de fichiers
   *
   * @returns {Promise<void>}
   */
  const handleOpenFolder = async (): Promise<void> => {
    try {
      const response = await window.electronAPI.backupGetFolder();

      if (response.success && response.data) {
        // Afficher le chemin dans une notification
        addNotification({
          type: 'info',
          title: 'Dossier des backups',
          message: `Chemin: ${response.data}`,
          duration: 8000
        });
      } else {
        addNotification({
          type: 'error',
          title: 'Erreur',
          message: 'Impossible de trouver le dossier des backups'
        });
      }
    } catch (error) {
      console.error('Erreur lors de l\'ouverture du dossier:', error);
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible d\'accéder au dossier des backups'
      });
    }
  };

  /**
   * Ouvre la modale de confirmation pour la restauration
   *
   * @param {BackupInfo} backup - Backup à restaurer
   */
  const openRestoreConfirmation = (backup: BackupInfo): void => {
    setSelectedBackup(backup);
    setConfirmationType('restore');
  };

  /**
   * Ouvre la modale de confirmation pour la suppression
   *
   * @param {BackupInfo} backup - Backup à supprimer
   */
  const openDeleteConfirmation = (backup: BackupInfo): void => {
    setSelectedBackup(backup);
    setConfirmationType('delete');
  };

  /**
   * Ferme la modale de confirmation
   */
  const closeConfirmation = (): void => {
    setConfirmationType(null);
    setSelectedBackup(null);
  };

  /**
   * Confirme l'action en cours (restauration ou suppression)
   *
   * @returns {Promise<void>}
   */
  const handleConfirm = async (): Promise<void> => {
    if (!selectedBackup) return;

    if (confirmationType === 'restore') {
      await handleRestoreBackup(selectedBackup);
    } else if (confirmationType === 'delete') {
      await handleDeleteBackup(selectedBackup);
    }
  };

  /**
   * Formate une date en chaîne lisible
   *
   * @param {string} dateString - Date au format ISO
   * @returns {string} Date formatée
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Charger les backups au montage du composant
  useEffect(() => {
    loadBackups();
  }, []);

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={onBack} className="btn btn-secondary">
            Retour
          </button>
          <h1 className="page-title">💾 Gestion des Backups</h1>
        </div>
      </div>

      {/* Section statistiques */}
      {status && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {/* Nombre total de backups */}
          <div className="card">
            <div style={{ padding: '1.5rem' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                Nombre de backups
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                {status.totalBackups}
              </div>
            </div>
          </div>

          {/* Taille totale */}
          <div className="card">
            <div style={{ padding: '1.5rem' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                Taille totale
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                {status.totalSizeFormatted}
              </div>
            </div>
          </div>

          {/* Dernier backup */}
          <div className="card">
            <div style={{ padding: '1.5rem' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                Dernier backup
              </div>
              {status.lastBackup ? (
                <>
                  <div style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                    {formatDate(status.lastBackup.date)}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {status.lastBackup.sizeFormatted}
                  </div>
                </>
              ) : (
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Aucun backup
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Section actions */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <button
          onClick={handleCreateBackup}
          className="btn btn-primary"
          disabled={isCreating}
        >
          {isCreating ? (
            <>
              <span className="spinner" style={{ marginRight: '0.5rem' }}></span>
              Création en cours...
            </>
          ) : (
            <>💾 Créer un backup manuel</>
          )}
        </button>

        <button
          onClick={handleOpenFolder}
          className="btn btn-secondary"
        >
          📂 Ouvrir le dossier des backups
        </button>

        <button
          onClick={loadBackups}
          className="btn btn-secondary"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="spinner" style={{ marginRight: '0.5rem' }}></span>
              Chargement...
            </>
          ) : (
            <>🔄 Actualiser</>
          )}
        </button>
      </div>

      {/* Table des backups */}
      <div className="card">
        {isLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <span className="spinner" style={{ width: '3rem', height: '3rem' }}></span>
            <div style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>
              Chargement des backups...
            </div>
          </div>
        ) : backups.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
            <div style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>
              Aucun backup disponible
            </div>
            <div style={{ fontSize: '0.875rem' }}>
              Créez votre premier backup manuel pour commencer
            </div>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Date</th>
                <th>Taille</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {backups.map((backup) => (
                <tr key={backup.filename}>
                  {/* Type de backup */}
                  <td>
                    <span
                      className="badge"
                      style={{
                        backgroundColor: backup.type === 'auto' ? 'var(--info)' : 'var(--success)',
                        color: 'white',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        textTransform: 'uppercase'
                      }}
                    >
                      {backup.type === 'auto' ? 'Auto' : 'Manuel'}
                    </span>
                  </td>

                  {/* Date */}
                  <td>{formatDate(backup.date)}</td>

                  {/* Taille */}
                  <td>{backup.sizeFormatted}</td>

                  {/* Actions */}
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {/* Bouton Restaurer */}
                      <button
                        onClick={() => openRestoreConfirmation(backup)}
                        className="btn btn-sm btn-primary"
                        disabled={isRestoring === backup.filename || isDeleting === backup.filename}
                        title="Restaurer ce backup"
                      >
                        {isRestoring === backup.filename ? (
                          <>
                            <span className="spinner" style={{ width: '1rem', height: '1rem', marginRight: '0.25rem' }}></span>
                            Restauration...
                          </>
                        ) : (
                          <>📥 Restaurer</>
                        )}
                      </button>

                      {/* Bouton Supprimer */}
                      <button
                        onClick={() => openDeleteConfirmation(backup)}
                        className="btn btn-sm btn-danger"
                        disabled={isRestoring === backup.filename || isDeleting === backup.filename}
                        title="Supprimer ce backup"
                      >
                        {isDeleting === backup.filename ? (
                          <>
                            <span className="spinner" style={{ width: '1rem', height: '1rem', marginRight: '0.25rem' }}></span>
                            Suppression...
                          </>
                        ) : (
                          <>🗑️ Supprimer</>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modale de confirmation */}
      {confirmationType && selectedBackup && (
        <div className="modal-overlay" onClick={closeConfirmation}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {confirmationType === 'restore' ? '⚠️ Confirmer la restauration' : '🗑️ Confirmer la suppression'}
              </h2>
              <button onClick={closeConfirmation} className="modal-close">
                ×
              </button>
            </div>

            <div className="modal-body">
              {confirmationType === 'restore' ? (
                <>
                  <div style={{
                    padding: '1rem',
                    backgroundColor: 'var(--warning-bg)',
                    border: '1px solid var(--warning)',
                    borderRadius: '0.5rem',
                    marginBottom: '1rem'
                  }}>
                    <strong style={{ color: 'var(--warning)' }}>⚠️ Attention !</strong>
                    <div style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                      Cette action écrasera toutes les données actuelles de la base de données et les remplacera par les données du backup sélectionné.
                    </div>
                  </div>
                  <p>
                    Voulez-vous vraiment restaurer le backup suivant ?
                  </p>
                  <div style={{
                    padding: '1rem',
                    backgroundColor: 'var(--background-secondary)',
                    borderRadius: '0.5rem',
                    marginTop: '1rem'
                  }}>
                    <div><strong>Type :</strong> {selectedBackup.type === 'auto' ? 'Automatique' : 'Manuel'}</div>
                    <div><strong>Date :</strong> {formatDate(selectedBackup.date)}</div>
                    <div><strong>Taille :</strong> {selectedBackup.sizeFormatted}</div>
                  </div>
                </>
              ) : (
                <>
                  <p>
                    Voulez-vous vraiment supprimer le backup suivant ?
                  </p>
                  <div style={{
                    padding: '1rem',
                    backgroundColor: 'var(--background-secondary)',
                    borderRadius: '0.5rem',
                    marginTop: '1rem'
                  }}>
                    <div><strong>Type :</strong> {selectedBackup.type === 'auto' ? 'Automatique' : 'Manuel'}</div>
                    <div><strong>Date :</strong> {formatDate(selectedBackup.date)}</div>
                    <div><strong>Taille :</strong> {selectedBackup.sizeFormatted}</div>
                  </div>
                  <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Cette action est irréversible.
                  </p>
                </>
              )}
            </div>

            <div className="modal-footer">
              <button onClick={closeConfirmation} className="btn btn-secondary">
                Annuler
              </button>
              <button
                onClick={handleConfirm}
                className={confirmationType === 'restore' ? 'btn btn-primary' : 'btn btn-danger'}
              >
                {confirmationType === 'restore' ? 'Confirmer la restauration' : 'Confirmer la suppression'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Backup;

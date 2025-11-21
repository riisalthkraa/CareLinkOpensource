/**
 * Service de statistiques temps réel
 * ===================================
 *
 * Service centralisé pour charger et rafraîchir automatiquement
 * les statistiques du dashboard.
 *
 * Inspiré de MatchPro IA (Dashboard temps réel)
 *
 * @module services/RealtimeStats
 */

import { log } from '../utils/logger';

/**
 * Vue d'ensemble des statistiques
 */
export interface StatsOverview {
  totalMembres: number;
  membresAjoutesCeMois: number;
  totalRendezVous: number;
  rdvProchains: number;
  rdvCeMois: number;
  totalVaccins: number;
  vaccinsAFaire: number;
  totalTraitements: number;
  traitementsActifs: number;
  alertes: {
    vaccins: number;
    traitements: number;
    rendezVous: number;
  };
}

/**
 * Activité récente
 */
export interface RecentActivity {
  recentMembres: Array<{
    id: number;
    prenom: string;
    nom: string;
    createdAt: string;
  }>;
  recentRendezVous: Array<{
    id: number;
    membre_prenom: string;
    membre_nom: string;
    date_rdv: string;
    specialite: string;
  }>;
  recentVaccins: Array<{
    id: number;
    membre_prenom: string;
    membre_nom: string;
    nom_vaccin: string;
    date_administration: string;
  }>;
}

/**
 * Service de statistiques temps réel
 */
class RealtimeStatsService {
  /**
   * Charge la vue d'ensemble des statistiques
   */
  async getOverview(): Promise<StatsOverview> {
    try {
      // Calculer le début du mois
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfMonthStr = startOfMonth.toISOString().split('T')[0];

      // Membres
      const membresResult = await window.electronAPI.dbQuery('SELECT COUNT(*) as count FROM membres', []);
      const totalMembres = membresResult.success ? membresResult.data[0].count : 0;

      const membresCeMoisResult = await window.electronAPI.dbQuery(
        'SELECT COUNT(*) as count FROM membres WHERE created_at >= ?',
        [startOfMonthStr]
      );
      const membresAjoutesCeMois = membresCeMoisResult.success ? membresCeMoisResult.data[0].count : 0;

      // Rendez-vous
      const rdvResult = await window.electronAPI.dbQuery('SELECT COUNT(*) as count FROM rendez_vous', []);
      const totalRendezVous = rdvResult.success ? rdvResult.data[0].count : 0;

      const rdvProchainsResult = await window.electronAPI.dbQuery(
        'SELECT COUNT(*) as count FROM rendez_vous WHERE date_rdv >= ? AND statut != "annulé"',
        [now.toISOString().split('T')[0]]
      );
      const rdvProchains = rdvProchainsResult.success ? rdvProchainsResult.data[0].count : 0;

      const rdvCeMoisResult = await window.electronAPI.dbQuery(
        'SELECT COUNT(*) as count FROM rendez_vous WHERE date_rdv >= ? AND date_rdv < ?',
        [startOfMonthStr, new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().split('T')[0]]
      );
      const rdvCeMois = rdvCeMoisResult.success ? rdvCeMoisResult.data[0].count : 0;

      // Vaccins
      const vaccinsResult = await window.electronAPI.dbQuery('SELECT COUNT(*) as count FROM vaccins', []);
      const totalVaccins = vaccinsResult.success ? vaccinsResult.data[0].count : 0;

      const vaccinsAFaireResult = await window.electronAPI.dbQuery(
        'SELECT COUNT(*) as count FROM vaccins WHERE statut = "à faire"',
        []
      );
      const vaccinsAFaire = vaccinsAFaireResult.success ? vaccinsAFaireResult.data[0].count : 0;

      // Traitements
      const traitementsResult = await window.electronAPI.dbQuery('SELECT COUNT(*) as count FROM traitements', []);
      const totalTraitements = traitementsResult.success ? traitementsResult.data[0].count : 0;

      const traitementsActifsResult = await window.electronAPI.dbQuery(
        'SELECT COUNT(*) as count FROM traitements WHERE actif = 1',
        []
      );
      const traitementsActifs = traitementsActifsResult.success ? traitementsActifsResult.data[0].count : 0;

      // Alertes
      const alertes = {
        vaccins: vaccinsAFaire,
        traitements: traitementsActifs,
        rendezVous: rdvProchains
      };

      log.debug('RealtimeStats', 'Overview loaded', { totalMembres, totalRendezVous });

      return {
        totalMembres,
        membresAjoutesCeMois,
        totalRendezVous,
        rdvProchains,
        rdvCeMois,
        totalVaccins,
        vaccinsAFaire,
        totalTraitements,
        traitementsActifs,
        alertes
      };

    } catch (error: any) {
      log.error('RealtimeStats', 'Failed to load overview', { error: error.message });
      throw error;
    }
  }

  /**
   * Charge l'activité récente (derniers ajouts)
   */
  async getRecentActivity(limit: number = 5): Promise<RecentActivity> {
    try {
      // Derniers membres ajoutés
      const membresResult = await window.electronAPI.dbQuery(
        'SELECT id, prenom, nom, created_at FROM membres ORDER BY created_at DESC LIMIT ?',
        [limit]
      );

      // Derniers rendez-vous
      const rdvResult = await window.electronAPI.dbQuery(
        `SELECT r.id, r.date_rdv, r.specialite, m.prenom as membre_prenom, m.nom as membre_nom
         FROM rendez_vous r
         JOIN membres m ON r.membre_id = m.id
         ORDER BY r.created_at DESC
         LIMIT ?`,
        [limit]
      );

      // Derniers vaccins
      const vaccinsResult = await window.electronAPI.dbQuery(
        `SELECT v.id, v.nom_vaccin, v.date_administration, m.prenom as membre_prenom, m.nom as membre_nom
         FROM vaccins v
         JOIN membres m ON v.membre_id = m.id
         ORDER BY v.date_administration DESC
         LIMIT ?`,
        [limit]
      );

      return {
        recentMembres: membresResult.success ? membresResult.data : [],
        recentRendezVous: rdvResult.success ? rdvResult.data : [],
        recentVaccins: vaccinsResult.success ? vaccinsResult.data : []
      };

    } catch (error: any) {
      log.error('RealtimeStats', 'Failed to load recent activity', { error: error.message });
      throw error;
    }
  }
}

// Export singleton
export const realtimeStats = new RealtimeStatsService();
export default realtimeStats;

/**
 * Tests d'intégration CRUD pour membres, vaccins et traitements
 */

import { db } from '../utils/dbHelper';

describe('CRUD Operations Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Membres CRUD', () => {
    it('should create a new membre', async () => {
      const mockResult = {
        success: true,
        data: []
      };

      (window.electronAPI.dbQuery as jest.Mock).mockResolvedValue(mockResult);

      const membreData = {
        famille_id: 1,
        nom: 'Dupont',
        prenom: 'Jean',
        date_naissance: '1990-01-01',
        sexe: 'M'
      };

      const result = await db.insert('membres', membreData, {
        module: 'Test:Membres:Create'
      });

      expect(result.success).toBe(true);
      expect(window.electronAPI.dbQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO membres'),
        expect.arrayContaining([1, 'Dupont', 'Jean', '1990-01-01', 'M'])
      );
    });

    it('should read membres list', async () => {
      const mockResult = {
        success: true,
        data: [
          { id: 1, nom: 'Dupont', prenom: 'Jean', date_naissance: '1990-01-01' },
          { id: 2, nom: 'Martin', prenom: 'Marie', date_naissance: '1985-05-15' }
        ]
      };

      (window.electronAPI.dbQuery as jest.Mock).mockResolvedValue(mockResult);

      const result = await db.select('membres', '*', 'famille_id = ?', [1], {
        module: 'Test:Membres:Read'
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0]).toHaveProperty('nom', 'Dupont');
    });

    it('should update a membre', async () => {
      const mockResult = {
        success: true,
        data: []
      };

      (window.electronAPI.dbQuery as jest.Mock).mockResolvedValue(mockResult);

      const updateData = {
        prenom: 'Jacques',
        telephone: '0612345678'
      };

      const result = await db.update('membres', updateData, 'id = ?', [1], {
        module: 'Test:Membres:Update'
      });

      expect(result.success).toBe(true);
      expect(window.electronAPI.dbQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE membres SET'),
        expect.arrayContaining(['Jacques', '0612345678', 1])
      );
    });

    it('should delete a membre', async () => {
      const mockResult = {
        success: true,
        data: []
      };

      (window.electronAPI.dbQuery as jest.Mock).mockResolvedValue(mockResult);

      const result = await db.delete('membres', 'id = ?', [1], {
        module: 'Test:Membres:Delete'
      });

      expect(result.success).toBe(true);
      expect(window.electronAPI.dbQuery).toHaveBeenCalledWith(
        'DELETE FROM membres WHERE id = ?',
        [1]
      );
    });
  });

  describe('Vaccins CRUD', () => {
    it('should create a new vaccin', async () => {
      const mockResult = {
        success: true,
        data: []
      };

      (window.electronAPI.dbQuery as jest.Mock).mockResolvedValue(mockResult);

      const vaccinData = {
        membre_id: 1,
        nom_vaccin: 'COVID-19',
        date_administration: '2023-01-15',
        statut: 'fait'
      };

      const result = await db.insert('vaccins', vaccinData, {
        module: 'Test:Vaccins:Create'
      });

      expect(result.success).toBe(true);
      expect(window.electronAPI.dbQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO vaccins'),
        expect.arrayContaining([1, 'COVID-19', '2023-01-15', 'fait'])
      );
    });

    it('should read vaccins for a membre', async () => {
      const mockResult = {
        success: true,
        data: [
          { id: 1, nom_vaccin: 'COVID-19', date_administration: '2023-01-15', statut: 'fait' },
          { id: 2, nom_vaccin: 'Grippe', date_administration: '2023-10-01', statut: 'fait' }
        ]
      };

      (window.electronAPI.dbQuery as jest.Mock).mockResolvedValue(mockResult);

      const result = await db.select('vaccins', '*', 'membre_id = ?', [1], {
        module: 'Test:Vaccins:Read'
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0]).toHaveProperty('nom_vaccin', 'COVID-19');
    });

    it('should update a vaccin status', async () => {
      const mockResult = {
        success: true,
        data: []
      };

      (window.electronAPI.dbQuery as jest.Mock).mockResolvedValue(mockResult);

      const updateData = {
        statut: 'rappel_necessaire',
        date_rappel: '2024-01-15'
      };

      const result = await db.update('vaccins', updateData, 'id = ?', [1], {
        module: 'Test:Vaccins:Update'
      });

      expect(result.success).toBe(true);
      expect(window.electronAPI.dbQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE vaccins SET'),
        expect.arrayContaining(['rappel_necessaire', '2024-01-15', 1])
      );
    });

    it('should delete a vaccin', async () => {
      const mockResult = {
        success: true,
        data: []
      };

      (window.electronAPI.dbQuery as jest.Mock).mockResolvedValue(mockResult);

      const result = await db.delete('vaccins', 'id = ?', [1], {
        module: 'Test:Vaccins:Delete'
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Traitements CRUD', () => {
    it('should create a new traitement', async () => {
      const mockResult = {
        success: true,
        data: []
      };

      (window.electronAPI.dbQuery as jest.Mock).mockResolvedValue(mockResult);

      const traitementData = {
        membre_id: 1,
        nom_medicament: 'Doliprane',
        dosage: '1000mg',
        frequence: '3 fois par jour',
        date_debut: '2023-12-01'
      };

      const result = await db.insert('traitements', traitementData, {
        module: 'Test:Traitements:Create'
      });

      expect(result.success).toBe(true);
      expect(window.electronAPI.dbQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO traitements'),
        expect.arrayContaining([1, 'Doliprane', '1000mg', '3 fois par jour', '2023-12-01'])
      );
    });

    it('should read traitements for a membre', async () => {
      const mockResult = {
        success: true,
        data: [
          {
            id: 1,
            nom_medicament: 'Doliprane',
            dosage: '1000mg',
            frequence: '3 fois par jour',
            actif: 1
          }
        ]
      };

      (window.electronAPI.dbQuery as jest.Mock).mockResolvedValue(mockResult);

      const result = await db.select('traitements', '*', 'membre_id = ? AND actif = 1', [1], {
        module: 'Test:Traitements:Read'
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0]).toHaveProperty('nom_medicament', 'Doliprane');
    });

    it('should update a traitement', async () => {
      const mockResult = {
        success: true,
        data: []
      };

      (window.electronAPI.dbQuery as jest.Mock).mockResolvedValue(mockResult);

      const updateData = {
        dosage: '500mg',
        frequence: '2 fois par jour'
      };

      const result = await db.update('traitements', updateData, 'id = ?', [1], {
        module: 'Test:Traitements:Update'
      });

      expect(result.success).toBe(true);
      expect(window.electronAPI.dbQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE traitements SET'),
        expect.arrayContaining(['500mg', '2 fois par jour', 1])
      );
    });

    it('should mark a traitement as inactive', async () => {
      const mockResult = {
        success: true,
        data: []
      };

      (window.electronAPI.dbQuery as jest.Mock).mockResolvedValue(mockResult);

      const updateData = {
        actif: 0,
        date_fin: '2023-12-31'
      };

      const result = await db.update('traitements', updateData, 'id = ?', [1], {
        module: 'Test:Traitements:Deactivate'
      });

      expect(result.success).toBe(true);
      expect(window.electronAPI.dbQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE traitements SET'),
        expect.arrayContaining([0, '2023-12-31', 1])
      );
    });

    it('should delete a traitement', async () => {
      const mockResult = {
        success: true,
        data: []
      };

      (window.electronAPI.dbQuery as jest.Mock).mockResolvedValue(mockResult);

      const result = await db.delete('traitements', 'id = ?', [1], {
        module: 'Test:Traitements:Delete'
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Complex queries', () => {
    it('should get membre with all related data', async () => {
      const mockResult = {
        success: true,
        data: [
          {
            id: 1,
            nom: 'Dupont',
            prenom: 'Jean',
            vaccins_count: 5,
            traitements_actifs: 2
          }
        ]
      };

      (window.electronAPI.dbQuery as jest.Mock).mockResolvedValue(mockResult);

      const query = `
        SELECT
          m.*,
          COUNT(DISTINCT v.id) as vaccins_count,
          COUNT(DISTINCT t.id) as traitements_actifs
        FROM membres m
        LEFT JOIN vaccins v ON m.id = v.membre_id
        LEFT JOIN traitements t ON m.id = t.membre_id AND t.actif = 1
        WHERE m.id = ?
        GROUP BY m.id
      `;

      const result = await db.query(query, [1], {
        module: 'Test:Complex:MembreDetails'
      });

      expect(result.success).toBe(true);
      expect(result.data?.[0]).toHaveProperty('vaccins_count');
      expect(result.data?.[0]).toHaveProperty('traitements_actifs');
    });

    it('should handle transaction for creating membre with initial data', async () => {
      const mockResult = {
        success: true,
        data: []
      };

      (window.electronAPI.dbQuery as jest.Mock).mockResolvedValue(mockResult);

      const queries = [
        {
          query: 'INSERT INTO membres (famille_id, nom, prenom) VALUES (?, ?, ?)',
          params: [1, 'Nouveau', 'Membre']
        },
        {
          query: 'INSERT INTO vaccins (membre_id, nom_vaccin, statut) VALUES (?, ?, ?)',
          params: [1, 'DTP', 'a_faire']
        },
        {
          query: 'INSERT INTO allergies (membre_id, nom_allergie, type_allergie) VALUES (?, ?, ?)',
          params: [1, 'Pollen', 'respiratoire']
        }
      ];

      const success = await db.transaction(queries, {
        module: 'Test:Transaction:CreateMembreComplete'
      });

      expect(success).toBe(true);
      expect(window.electronAPI.dbQuery).toHaveBeenCalledTimes(3);
    });
  });
});

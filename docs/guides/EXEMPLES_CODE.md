# 💻 Exemples de Code pour CareLink

Ce document contient des exemples de code que vous pouvez copier-coller pour ajouter rapidement des fonctionnalités.

---

## 📋 Table des Matières

1. [Ajouter une nouvelle table dans la base de données](#1-ajouter-une-nouvelle-table)
2. [Créer un nouveau composant](#2-créer-un-nouveau-composant)
3. [Utiliser la base de données depuis React](#3-utiliser-la-base-de-données)
4. [Créer un formulaire](#4-créer-un-formulaire)
5. [Afficher des notifications](#5-afficher-des-notifications)
6. [Formater des dates](#6-formater-des-dates)

---

## 1. Ajouter une Nouvelle Table

**Fichier:** `electron/main.ts`

```typescript
// Dans la fonction initDatabase(), ajoutez :
db.exec(`
  CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    membre_id INTEGER,
    type_document TEXT NOT NULL,
    nom_fichier TEXT,
    chemin_fichier TEXT,
    date_ajout DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (membre_id) REFERENCES membres(id)
  );
`);
```

---

## 2. Créer un Nouveau Composant

**Créer le fichier:** `src/components/MembreCard.tsx`

```typescript
interface MembreCardProps {
  nom: string
  prenom: string
  age: number
  onClick: () => void
}

function MembreCard({ nom, prenom, age, onClick }: MembreCardProps) {
  return (
    <div className="membre-card" onClick={onClick}>
      <div className="membre-avatar">
        {prenom.charAt(0).toUpperCase()}
      </div>
      <div className="membre-info">
        <h3>{prenom} {nom}</h3>
        <p>{age} ans</p>
      </div>
    </div>
  )
}

export default MembreCard
```

**Utiliser le composant:**

```typescript
import MembreCard from '../components/MembreCard'

// Dans votre page :
<MembreCard
  nom="Dupont"
  prenom="Marc"
  age={35}
  onClick={() => console.log('Carte cliquée')}
/>
```

---

## 3. Utiliser la Base de Données

### Lire des données (SELECT)

```typescript
const loadMembres = async () => {
  try {
    const result = await window.electronAPI.dbQuery(
      'SELECT * FROM membres WHERE famille_id = ?',
      [1]
    )

    if (result.success) {
      console.log('Membres chargés:', result.data)
      setMembres(result.data)
    } else {
      console.error('Erreur:', result.error)
    }
  } catch (error) {
    console.error('Erreur de chargement:', error)
  }
}
```

### Ajouter des données (INSERT)

```typescript
const addMembre = async (nom: string, prenom: string, dateNaissance: string) => {
  try {
    const result = await window.electronAPI.dbRun(
      'INSERT INTO membres (famille_id, nom, prenom, date_naissance) VALUES (?, ?, ?, ?)',
      [1, nom, prenom, dateNaissance]
    )

    if (result.success) {
      console.log('Membre ajouté avec l\'ID:', result.data.lastInsertRowid)
      // Recharger la liste
      loadMembres()
    }
  } catch (error) {
    console.error('Erreur d\'ajout:', error)
  }
}
```

### Modifier des données (UPDATE)

```typescript
const updateMembre = async (id: number, groupeSanguin: string) => {
  try {
    const result = await window.electronAPI.dbRun(
      'UPDATE membres SET groupe_sanguin = ? WHERE id = ?',
      [groupeSanguin, id]
    )

    if (result.success) {
      console.log('Membre mis à jour')
    }
  } catch (error) {
    console.error('Erreur de mise à jour:', error)
  }
}
```

### Supprimer des données (DELETE)

```typescript
const deleteMembre = async (id: number) => {
  // Demander confirmation
  if (confirm('Êtes-vous sûr de vouloir supprimer ce membre ?')) {
    try {
      const result = await window.electronAPI.dbRun(
        'DELETE FROM membres WHERE id = ?',
        [id]
      )

      if (result.success) {
        console.log('Membre supprimé')
        loadMembres()
      }
    } catch (error) {
      console.error('Erreur de suppression:', error)
    }
  }
}
```

---

## 4. Créer un Formulaire

```typescript
import { useState } from 'react'

function FormulaireVaccin() {
  const [formData, setFormData] = useState({
    nomVaccin: '',
    dateAdmin: '',
    dateRappel: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault() // Important : empêche le rechargement de la page

    // Validation
    if (!formData.nomVaccin || !formData.dateAdmin) {
      alert('Veuillez remplir tous les champs obligatoires')
      return
    }

    // Enregistrer dans la base de données
    try {
      const result = await window.electronAPI.dbRun(
        'INSERT INTO vaccins (membre_id, nom_vaccin, date_administration, date_rappel) VALUES (?, ?, ?, ?)',
        [1, formData.nomVaccin, formData.dateAdmin, formData.dateRappel]
      )

      if (result.success) {
        alert('Vaccin ajouté avec succès !')
        // Réinitialiser le formulaire
        setFormData({ nomVaccin: '', dateAdmin: '', dateRappel: '' })
      }
    } catch (error) {
      alert('Erreur lors de l\'ajout du vaccin')
      console.error(error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card">
      <h3>Ajouter un vaccin</h3>

      <div className="form-group">
        <label>Nom du vaccin *</label>
        <input
          type="text"
          name="nomVaccin"
          value={formData.nomVaccin}
          onChange={handleChange}
          placeholder="Ex: DTP"
          required
        />
      </div>

      <div className="form-group">
        <label>Date d'administration *</label>
        <input
          type="date"
          name="dateAdmin"
          value={formData.dateAdmin}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label>Date de rappel</label>
        <input
          type="date"
          name="dateRappel"
          value={formData.dateRappel}
          onChange={handleChange}
        />
      </div>

      <div className="form-actions">
        <button type="submit" className="btn-primary">
          Ajouter
        </button>
        <button type="button" className="btn-secondary">
          Annuler
        </button>
      </div>
    </form>
  )
}

export default FormulaireVaccin
```

---

## 5. Afficher des Notifications

```typescript
// Notification simple
window.electronAPI.showNotification(
  'Succès',
  'Le membre a été ajouté avec succès'
)

// Notification après une action
const addMembre = async () => {
  const result = await window.electronAPI.dbRun(/* ... */)

  if (result.success) {
    window.electronAPI.showNotification(
      '✅ Succès',
      'Marc Dupont a été ajouté à la famille'
    )
  } else {
    window.electronAPI.showNotification(
      '❌ Erreur',
      'Impossible d\'ajouter le membre'
    )
  }
}
```

---

## 6. Formater des Dates

### Installer date-fns (si pas déjà fait)

```bash
npm install date-fns
```

### Utiliser date-fns

```typescript
import { format, differenceInYears, addMonths, isBefore } from 'date-fns'
import { fr } from 'date-fns/locale'

// Formater une date en français
const dateFormatee = format(new Date(), 'dd MMMM yyyy', { locale: fr })
// Résultat: "29 octobre 2025"

// Calculer l'âge
const calculateAge = (birthDate: string) => {
  return differenceInYears(new Date(), new Date(birthDate))
}

// Ajouter 6 mois à une date
const dateRappel = addMonths(new Date('2025-01-15'), 6)
// Résultat: 15 juillet 2025

// Vérifier si une date est passée
const isExpired = isBefore(new Date('2025-01-01'), new Date())
// true si la date est passée
```

---

## 7. Créer une Liste avec Recherche

```typescript
import { useState } from 'react'

function ListeMembres() {
  const [membres, setMembres] = useState([])
  const [searchTerm, setSearchTerm] = useState('')

  // Filtrer les membres selon la recherche
  const membresFiltres = membres.filter(membre =>
    membre.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    membre.prenom.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div>
      {/* Barre de recherche */}
      <div className="form-group">
        <input
          type="text"
          placeholder="🔍 Rechercher un membre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Liste filtrée */}
      <div className="membres-grid">
        {membresFiltres.length === 0 ? (
          <p className="empty-state">Aucun membre trouvé</p>
        ) : (
          membresFiltres.map(membre => (
            <div key={membre.id} className="membre-card">
              <h3>{membre.prenom} {membre.nom}</h3>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
```

---

## 8. Créer un Graphique Simple avec Recharts

### Installer Recharts

```bash
npm install recharts
```

### Graphique de courbe de poids

```typescript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

function GraphiquePoids() {
  const data = [
    { date: 'Jan', poids: 45 },
    { date: 'Fév', poids: 46 },
    { date: 'Mar', poids: 47 },
    { date: 'Avr', poids: 48 },
    { date: 'Mai', poids: 49 },
  ]

  return (
    <div className="card">
      <h3>Évolution du poids</h3>
      <LineChart width={600} height={300} data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="poids" stroke="#4A90E2" strokeWidth={2} />
      </LineChart>
    </div>
  )
}
```

---

## 9. Modal / Popup

```typescript
import { useState } from 'react'

function ModalExample() {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <button onClick={() => setShowModal(true)}>
        Ouvrir le modal
      </button>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Titre du Modal</h2>
            <p>Contenu du modal ici</p>
            <button onClick={() => setShowModal(false)}>
              Fermer
            </button>
          </div>
        </div>
      )}
    </>
  )
}

// Ajoutez ce CSS dans index.css :
/*
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}
*/
```

---

## 10. Hook Personnalisé pour la Base de Données

Créez un hook réutilisable :

**Fichier:** `src/hooks/useDatabase.ts`

```typescript
import { useState, useEffect } from 'react'

export function useDatabase<T>(query: string, params: any[] = []) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [query, ...params])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const result = await window.electronAPI.dbQuery(query, params)

      if (result.success) {
        setData(result.data)
      } else {
        setError(result.error)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return { data, loading, error, reload: loadData }
}
```

**Utilisation:**

```typescript
import { useDatabase } from '../hooks/useDatabase'

interface Membre {
  id: number
  nom: string
  prenom: string
}

function MesComposant() {
  const { data, loading, error, reload } = useDatabase<Membre>(
    'SELECT * FROM membres WHERE famille_id = ?',
    [1]
  )

  if (loading) return <div>Chargement...</div>
  if (error) return <div>Erreur: {error}</div>

  return (
    <div>
      {data.map(membre => (
        <div key={membre.id}>{membre.prenom} {membre.nom}</div>
      ))}
      <button onClick={reload}>Recharger</button>
    </div>
  )
}
```

---

## 📚 Ressources Utiles

- **TypeScript** : https://www.typescriptlang.org/docs/
- **React** : https://react.dev/learn
- **date-fns** : https://date-fns.org/docs
- **Recharts** : https://recharts.org/en-US/
- **SQLite** : https://www.sqlitetutorial.net/

---

**💡 Astuce :** Copiez ces exemples dans votre projet et modifiez-les selon vos besoins !

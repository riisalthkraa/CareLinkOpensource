/**
 * Point d'entrée de l'application React CareLink
 *
 * Ce fichier initialise React et monte l'application dans le DOM.
 * Il charge également tous les fichiers CSS de thèmes.
 *
 * @module main
 * @see {@link App} - Composant racine de l'application
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

// Styles de base
import './index.css'
import './themes.css'
import './themes-modern.css'
import './styles/theme-enhancements.css'
import './styles/theme-personalities.css'
import './styles/theme-effects-all.css'
import './styles/config-modern.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

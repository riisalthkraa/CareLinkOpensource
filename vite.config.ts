/**
 * Configuration Vite pour CareLink
 * Définit les paramètres de build et de développement pour l'application React
 * @module vite.config
 */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configuration Vite avec React et paramètres de développement
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 5173,
    strictPort: true, // Échoue si le port est déjà utilisé au lieu de changer
    host: true
  },
  build: {
    outDir: 'dist/renderer'
  }
})

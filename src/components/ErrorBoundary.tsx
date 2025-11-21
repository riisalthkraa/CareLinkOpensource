/**
 * ErrorBoundary - Composant de gestion des erreurs React
 *
 * Capture les erreurs React qui se produisent dans l'arbre de composants enfants
 * et affiche une interface de repli au lieu de faire planter toute l'application.
 *
 * @module ErrorBoundary
 */

import React, { Component, ReactNode } from 'react';
import './ErrorBoundary.css';
import { log } from '../utils/logger';

/**
 * Props du composant ErrorBoundary
 */
interface ErrorBoundaryProps {
  /** Composants enfants à surveiller */
  children: ReactNode;
  /** Message personnalisé en cas d'erreur (optionnel) */
  fallbackMessage?: string;
}

/**
 * État du composant ErrorBoundary
 */
interface ErrorBoundaryState {
  /** Indique si une erreur a été capturée */
  hasError: boolean;
  /** L'erreur capturée (si présente) */
  error: Error | null;
  /** Informations sur l'erreur */
  errorInfo: React.ErrorInfo | null;
}

/**
 * ErrorBoundary - Composant de gestion des erreurs React
 *
 * Utilisation:
 * ```tsx
 * <ErrorBoundary fallbackMessage="Une erreur est survenue dans cette section">
 *   <MonComposant />
 * </ErrorBoundary>
 * ```
 *
 * @component
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  /**
   * Méthode statique appelée lors de la capture d'une erreur
   * Met à jour l'état pour afficher l'interface de repli
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  /**
   * Méthode appelée après la capture d'une erreur
   * Utilisée pour logger l'erreur
   */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Logger l'erreur avec le système centralisé
    log.error('ErrorBoundary', `React error caught: ${error.message}`, {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      componentStack: errorInfo.componentStack
    });

    // Mettre à jour l'état avec les détails de l'erreur
    this.setState({
      error,
      errorInfo
    });
  }

  /**
   * Réinitialise l'état d'erreur pour réessayer
   */
  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  /**
   * Recharge la page complète
   */
  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const { error, errorInfo } = this.state;
      const { fallbackMessage } = this.props;

      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <div className="error-boundary-icon">⚠️</div>
            <h1 className="error-boundary-title">Oups ! Une erreur est survenue</h1>
            <p className="error-boundary-message">
              {fallbackMessage || "Nous sommes désolés, quelque chose s'est mal passé."}
            </p>

            <div className="error-boundary-actions">
              <button
                className="error-boundary-btn error-boundary-btn-primary"
                onClick={this.handleReset}
              >
                Réessayer
              </button>
              <button
                className="error-boundary-btn error-boundary-btn-secondary"
                onClick={this.handleReload}
              >
                Recharger la page
              </button>
            </div>

            {/* Détails techniques (affichés en mode développement) */}
            {process.env.NODE_ENV === 'development' && error && (
              <details className="error-boundary-details">
                <summary className="error-boundary-details-summary">
                  Détails techniques (dev only)
                </summary>
                <div className="error-boundary-details-content">
                  <div className="error-boundary-error-name">
                    <strong>Error:</strong> {error.name}
                  </div>
                  <div className="error-boundary-error-message">
                    <strong>Message:</strong> {error.message}
                  </div>
                  {error.stack && (
                    <div className="error-boundary-error-stack">
                      <strong>Stack:</strong>
                      <pre>{error.stack}</pre>
                    </div>
                  )}
                  {errorInfo && (
                    <div className="error-boundary-component-stack">
                      <strong>Component Stack:</strong>
                      <pre>{errorInfo.componentStack}</pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

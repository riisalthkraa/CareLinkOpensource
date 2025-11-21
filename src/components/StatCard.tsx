/**
 * StatCard - Carte de statistique pour tableau de bord
 *
 * Affiche une métrique importante avec icône, valeur et tendance
 * Utilisé dans le dashboard pour montrer les indicateurs clés
 *
 * @module StatCard
 */

/**
 * Props du composant StatCard
 * @interface StatCardProps
 * @property {string} icon - Emoji ou icône à afficher
 * @property {string} label - Label descriptif de la statistique
 * @property {string | number} value - Valeur principale à afficher
 * @property {object} [trend] - Tendance optionnelle avec pourcentage
 * @property {'primary' | 'success' | 'warning' | 'info'} [color] - Thème de couleur de la carte
 * @property {function} [onClick] - Callback au clic (rend la carte cliquable)
 */
interface StatCardProps {
  icon: string
  label: string
  value: string | number
  trend?: {
    value: number
    isPositive: boolean
  }
  color?: 'primary' | 'success' | 'warning' | 'info'
  onClick?: () => void
}

/**
 * StatCard - Composant carte de statistique
 *
 * Affiche une statistique avec:
 * - Une icône représentative
 * - Une valeur principale mise en avant
 * - Un label descriptif
 * - Une tendance optionnelle avec indicateur directionnel
 * - Support du clic pour navigation
 *
 * @component
 * @param {StatCardProps} props - Les propriétés du composant
 * @returns {JSX.Element} La carte de statistique
 */
function StatCard({ icon, label, value, trend, color = 'primary', onClick }: StatCardProps) {
  const colorClasses = {
    primary: 'stat-card-primary',
    success: 'stat-card-success',
    warning: 'stat-card-warning',
    info: 'stat-card-info'
  }

  return (
    <div
      className={`stat-card ${colorClasses[color]} ${onClick ? 'stat-card-clickable' : ''}`}
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {trend && (
          <div className={`stat-trend ${trend.isPositive ? 'positive' : 'negative'}`}>
            {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
          </div>
        )}
      </div>
    </div>
  )
}

export default StatCard

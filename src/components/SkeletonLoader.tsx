/**
 * SkeletonLoader - Composant de chargement avec effet shimmer
 *
 * Affiche des placeholders animés pendant le chargement des données
 * Améliore considérablement l'UX en donnant un feedback visuel
 *
 * UTILISATION:
 * <SkeletonLoader type="card" count={3} />
 * <SkeletonLoader type="text" width="80%" />
 * <SkeletonLoader type="avatar" />
 *
 * @module SkeletonLoader
 */

/**
 * Type de skeleton
 */
type SkeletonType = 'text' | 'title' | 'avatar' | 'card' | 'custom'

/**
 * Props du composant SkeletonLoader
 */
interface SkeletonLoaderProps {
  /** Type de skeleton */
  type?: SkeletonType
  /** Largeur custom (ex: "50%", "200px") */
  width?: string
  /** Hauteur custom (ex: "100px") */
  height?: string
  /** Nombre de lignes à afficher */
  count?: number
  /** Classes CSS supplémentaires */
  className?: string
}

/**
 * SkeletonLoader - Composant de placeholder animé
 *
 * @component
 */
function SkeletonLoader({
  type = 'text',
  width,
  height,
  count = 1,
  className = ''
}: SkeletonLoaderProps) {
  /**
   * Retourne les classes CSS selon le type
   */
  const getSkeletonClass = (): string => {
    const baseClass = 'skeleton'
    switch (type) {
      case 'text':
        return `${baseClass} skeleton-text`
      case 'title':
        return `${baseClass} skeleton-title`
      case 'avatar':
        return `${baseClass} skeleton-avatar`
      case 'card':
        return `${baseClass} skeleton-card`
      case 'custom':
        return baseClass
      default:
        return baseClass
    }
  }

  /**
   * Style inline pour dimensions custom
   */
  const customStyle: React.CSSProperties = {
    ...(width && { width }),
    ...(height && { height })
  }

  /**
   * Génère plusieurs skeletons si count > 1
   */
  const renderSkeletons = () => {
    const skeletons = []
    for (let i = 0; i < count; i++) {
      skeletons.push(
        <div
          key={i}
          className={`${getSkeletonClass()} ${className}`}
          style={customStyle}
          aria-hidden="true"
        />
      )
    }
    return skeletons
  }

  return <>{renderSkeletons()}</>
}

/**
 * SkeletonCard - Préset pour une carte complète
 */
export function SkeletonCard() {
  return (
    <div className="card">
      <div className="flex items-center gap-md mb-md">
        <SkeletonLoader type="avatar" />
        <div className="flex-1">
          <SkeletonLoader type="title" width="60%" />
          <SkeletonLoader type="text" width="40%" />
        </div>
      </div>
      <SkeletonLoader type="text" count={3} />
    </div>
  )
}

/**
 * SkeletonList - Préset pour une liste d'items
 */
export function SkeletonList({ count = 5 }: { count?: number }) {
  const items = []
  for (let i = 0; i < count; i++) {
    items.push(
      <div key={i} className="card mb-md">
        <div className="flex items-center gap-md">
          <SkeletonLoader type="avatar" />
          <div className="flex-1">
            <SkeletonLoader type="title" width="70%" />
            <SkeletonLoader type="text" width="50%" />
          </div>
        </div>
      </div>
    )
  }
  return <>{items}</>
}

/**
 * SkeletonTable - Préset pour un tableau
 */
export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  const tableRows = []
  for (let i = 0; i < rows; i++) {
    const tableCols = []
    for (let j = 0; j < cols; j++) {
      tableCols.push(
        <td key={j} style={{ padding: '1rem' }}>
          <SkeletonLoader type="text" />
        </td>
      )
    }
    tableRows.push(<tr key={i}>{tableCols}</tr>)
  }
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <tbody>{tableRows}</tbody>
    </table>
  )
}

export default SkeletonLoader

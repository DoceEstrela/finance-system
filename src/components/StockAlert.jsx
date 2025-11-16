import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { materialService } from '../services/api'
import { FaExclamationTriangle } from 'react-icons/fa'
import './StockAlert.css'

function StockAlert() {
  const [lowStockMaterials, setLowStockMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    fetchLowStockMaterials()
    // Atualizar a cada 60 segundos
    const interval = setInterval(fetchLowStockMaterials, 60000)
    return () => clearInterval(interval)
  }, [])

  const fetchLowStockMaterials = async () => {
    try {
      const response = await materialService.getStats()
      const materials = response.data.data.lowStockMaterials || []
      setLowStockMaterials(materials)
    } catch (error) {
      console.error('Erro ao buscar materiais com estoque baixo:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || lowStockMaterials.length === 0) {
    return null
  }

  return (
    <div className="stock-alert-container">
      <div 
        className="stock-alert-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="stock-alert-icon">
          <FaExclamationTriangle />
        </div>
        <div className="stock-alert-info">
          <strong>{lowStockMaterials.length} material(is) com estoque baixo</strong>
          <span>Clique para ver detalhes</span>
        </div>
        <span className="stock-alert-toggle">{isExpanded ? '▼' : '▶'}</span>
      </div>
      
      {isExpanded && (
        <div className="stock-alert-list">
          {lowStockMaterials.map((material) => (
            <div key={material._id} className="stock-alert-item">
              <div className="stock-alert-item-info">
                <strong>{material.name}</strong>
                <span>
                  Estoque: {material.quantityInStock} {material.unit} 
                  (mínimo: {material.minimumStock} {material.unit})
                </span>
              </div>
              <Link 
                to="/materials" 
                className="stock-alert-link"
                onClick={(e) => e.stopPropagation()}
              >
                Ver Material
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default StockAlert


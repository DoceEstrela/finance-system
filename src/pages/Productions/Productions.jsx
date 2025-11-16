import { useState, useEffect } from 'react'
import { productService } from '../../services/api'
import { formatCurrency, formatDate } from '../../utils/format'
import { showNotification } from '../../utils/notifications'
import './Productions.css'

function Productions() {
  const [productions, setProductions] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedProduction, setExpandedProduction] = useState(null)

  useEffect(() => {
    fetchProductions()
  }, [])

  const fetchProductions = async () => {
    try {
      const response = await productService.getProductions()
      setProductions(response.data.data.productions || [])
    } catch (error) {
      showNotification('Erro ao buscar produções', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="loading">Carregando produções...</div>
  }

  return (
    <div className="productions-page">
      <div className="page-header">
        <h1>Produções</h1>
        <p className="page-description">
          Visualize o custo total de cada produção e a quantidade produzida
        </p>
      </div>

      {productions.length === 0 ? (
        <div className="productions-empty-state">
          <p>Nenhuma produção registrada ainda.</p>
          <p className="empty-hint">
            Para registrar uma produção:
            <br />
            1. Vá em "Saídas" e registre os materiais utilizados com um lote de produção
            <br />
            2. Vá em "Produtos" e adicione os produtos produzidos com o mesmo lote
          </p>
        </div>
      ) : (
        <div className="productions-list">
          {productions.map((production) => {
            const isExpanded = expandedProduction === production.productionBatch
            return (
              <div key={production.productionBatch} className="production-card">
                <div
                  className="production-card-header"
                  onClick={() => setExpandedProduction(isExpanded ? null : production.productionBatch)}
                >
                  <div className="production-card-header-left">
                    <h3 className="production-batch-name">{production.productionBatch}</h3>
                    <span className="production-date">{formatDate(production.date)}</span>
                  </div>
                  <div className="production-card-header-right">
                    <div className="production-summary">
                      <div className="production-summary-item">
                        <span className="summary-label">Custo Total:</span>
                        <strong className="summary-value cost">
                          {formatCurrency(production.totalMaterialCost)}
                        </strong>
                      </div>
                      <div className="production-summary-item">
                        <span className="summary-label">Produzido:</span>
                        <strong className="summary-value quantity">
                          {production.totalProductsQuantity} unidades
                        </strong>
                      </div>
                      {production.totalProductsQuantity > 0 && (
                        <div className="production-summary-item">
                          <span className="summary-label">Custo/Unidade:</span>
                          <strong className="summary-value cost-per-unit">
                            {formatCurrency(production.costPerUnit)}
                          </strong>
                        </div>
                      )}
                    </div>
                    <span className="production-toggle">{isExpanded ? '▼' : '▶'}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="production-details">
                    <div className="production-section">
                      <h4>Materiais Utilizados</h4>
                      {production.materials.length > 0 ? (
                        <div className="materials-list">
                          {production.materials.map((withdrawal) => {
                            const materialCost = (withdrawal.material?.costPerUnit || 0) * (withdrawal.quantity || 0)
                            return (
                              <div key={withdrawal._id} className="material-item">
                                <div className="material-item-info">
                                  <strong>{withdrawal.material?.name || 'N/A'}</strong>
                                  <span>{withdrawal.material?.category || ''}</span>
                                </div>
                                <div className="material-item-details">
                                  <span>{withdrawal.quantity} {withdrawal.material?.unit || ''}</span>
                                  <span className="material-cost">
                                    {formatCurrency(withdrawal.material?.costPerUnit || 0)} / {withdrawal.material?.unit || ''}
                                  </span>
                                  <strong className="material-total-cost">
                                    {formatCurrency(materialCost)}
                                  </strong>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <p className="no-items">Nenhum material registrado</p>
                      )}
                    </div>

                    <div className="production-section">
                      <h4>Produtos Produzidos</h4>
                      {production.products.length > 0 ? (
                        <div className="products-list">
                          {production.products.map((product) => (
                            <div key={product._id} className="product-item">
                              <div className="product-item-info">
                                <strong>{product.name}</strong>
                                {product.description && (
                                  <span className="product-description">{product.description}</span>
                                )}
                              </div>
                              <div className="product-item-details">
                                <span className="product-quantity">{product.stock} unidades</span>
                                <span className="product-cost-price">
                                  Custo: {formatCurrency(product.costPrice)} / un
                                </span>
                                <span className="product-sale-price">
                                  Venda: {formatCurrency(product.price)} / un
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="no-items">Nenhum produto registrado para esta produção</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Productions


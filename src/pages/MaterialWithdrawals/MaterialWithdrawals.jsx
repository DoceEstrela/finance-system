import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { materialWithdrawalService, materialService } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { formatDate, formatCurrency } from '../../utils/format'
import { showNotification } from '../../utils/notifications'
import Modal from '../../components/Modal'
import './MaterialWithdrawals.css'

const REASON_LABELS = {
  perda: 'Perda',
  descarte: 'Descarte',
  teste: 'Teste',
  uso_interno: 'Uso Interno',
  outro: 'Outro',
}

function MaterialWithdrawals() {
  const { user } = useAuth()
  const location = useLocation()
  const [withdrawals, setWithdrawals] = useState([])
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    material: '',
    quantity: '',
    reason: '',
    notes: '',
    productionBatch: '',
  })
  const [productions, setProductions] = useState([])
  const [selectedProduction, setSelectedProduction] = useState('')
  const [activeProduction, setActiveProduction] = useState('')
  const [expandedProduction, setExpandedProduction] = useState(null)

  const canCreate = user?.role === 'admin' || user?.role === 'vendedor'

  useEffect(() => {
    fetchWithdrawals()
    fetchProductions()
    if (canCreate) {
      fetchMaterials()
    }
  }, [])

  // Se veio da página de materiais com material selecionado, abrir modal automaticamente
  useEffect(() => {
    if (location.state?.selectedMaterial && materials.length > 0 && !isModalOpen && canCreate) {
      const selectedMat = materials.find(m => m._id === location.state.selectedMaterial)
      if (selectedMat) {
        setFormData(prev => ({
          ...prev,
          material: selectedMat._id,
        }))
        setIsModalOpen(true)
        // Limpar o state para não abrir novamente
        window.history.replaceState({}, document.title)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materials])

  const fetchWithdrawals = async () => {
    try {
      const response = await materialWithdrawalService.getAll({ limit: 1000 })
      setWithdrawals(response.data.data.withdrawals || [])
    } catch (error) {
      showNotification('Erro ao buscar saídas', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchMaterials = async () => {
    try {
      const response = await materialService.getAll({ limit: 1000 })
      setMaterials(response.data.data.materials || [])
    } catch (error) {
      console.error('Erro ao buscar materiais:', error)
    }
  }

  const fetchProductions = async () => {
    try {
      const response = await materialWithdrawalService.getByProduction()
      setProductions(response.data.data.productions || [])
      
      // Tentar definir produção ativa do dia atual
      const today = new Date().toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      })
      const todayProduction = `Produção ${today}`
      const existingToday = response.data.data.productions?.find(
        p => p.productionBatch === todayProduction
      )
      if (existingToday) {
        setActiveProduction(todayProduction)
        setFormData(prev => ({ ...prev, productionBatch: todayProduction }))
      }
    } catch (error) {
      console.error('Erro ao buscar produções:', error)
    }
  }

  const handleSetTodayProduction = () => {
    const today = new Date().toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    })
    const todayProduction = `Produção ${today}`
    setActiveProduction(todayProduction)
    setFormData(prev => ({ ...prev, productionBatch: todayProduction }))
  }

  const handleSelectExistingProduction = (batch) => {
    if (batch) {
      setActiveProduction(batch)
      setFormData(prev => ({ ...prev, productionBatch: batch }))
    } else {
      setActiveProduction('')
      setFormData(prev => ({ ...prev, productionBatch: '' }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.material || !formData.quantity || !formData.reason) {
      showNotification('Preencha todos os campos obrigatórios', 'error')
      return
    }

    try {
      await materialWithdrawalService.create({
        material: formData.material,
        quantity: parseFloat(formData.quantity),
        reason: formData.reason,
        notes: formData.notes,
        productionBatch: formData.productionBatch || null,
      })

      showNotification('Saída registrada com sucesso!', 'success')
      setIsModalOpen(false)
      resetForm()
      fetchWithdrawals()
      fetchProductions()
      // Atualizar lista de materiais para refletir novo estoque
      if (canCreate) {
        fetchMaterials()
      }
    } catch (error) {
      showNotification(
        error.response?.data?.message || 'Erro ao registrar saída',
        'error'
      )
    }
  }

  const resetForm = () => {
    setFormData({
      material: '',
      quantity: '',
      reason: '',
      notes: '',
      productionBatch: '',
    })
  }

  // Filtrar saídas por produção
  const filteredWithdrawals = selectedProduction
    ? withdrawals.filter(w => w.productionBatch === selectedProduction)
    : withdrawals

  if (loading) {
    return <div className="loading">Carregando saídas...</div>
  }

  // Calcular total em saídas
  const totalWithdrawalsCost = filteredWithdrawals.reduce((sum, withdrawal) => {
    const cost = (withdrawal.material?.costPerUnit || 0) * (withdrawal.quantity || 0)
    return sum + cost
  }, 0)

  return (
    <div className="material-withdrawals-page">
      <div className="page-header">
        <h1>Saídas de Materiais</h1>
        <p className="page-subtitle">
          Registre saídas de materiais que não estão relacionadas a vendas (perdas, descartes, testes, etc.)
        </p>
        {canCreate && (
          <button
            className="btn-primary"
            onClick={() => {
              resetForm()
              setIsModalOpen(true)
            }}
          >
            + Registrar Saída
          </button>
        )}
      </div>

      {productions.length > 0 && (
        <div className="productions-summary">
          <h3>Gastos por Produção</h3>
          <div className="productions-list">
            {productions.map((production) => {
              const isExpanded = expandedProduction === production.productionBatch
              const productionWithdrawals = withdrawals.filter(
                w => w.productionBatch === production.productionBatch
              )
              
              return (
                <div key={production.productionBatch} className="production-item">
                  <div 
                    className="production-header"
                    onClick={() => setExpandedProduction(isExpanded ? null : production.productionBatch)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="production-header-left">
                      <span className="production-batch">{production.productionBatch}</span>
                      <span className="production-date">{formatDate(production.date)}</span>
                    </div>
                    <div className="production-header-right">
                      <span className="production-items">{production.totalItems} itens</span>
                      <strong className="production-total">{formatCurrency(production.totalCost)}</strong>
                      <span className="production-toggle">{isExpanded ? '▼' : '▶'}</span>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="production-details-expanded">
                      <div className="production-materials-list">
                        <h4>Materiais Utilizados:</h4>
                        {productionWithdrawals.map((withdrawal) => {
                          const materialCost = (withdrawal.material?.costPerUnit || 0) * (withdrawal.quantity || 0)
                          return (
                            <div key={withdrawal._id} className="production-material-item">
                              <div className="material-item-info">
                                <strong>{withdrawal.material?.name || 'N/A'}</strong>
                                <span className="material-item-category">
                                  {withdrawal.material?.category || ''}
                                </span>
                              </div>
                              <div className="material-item-quantity">
                                {withdrawal.quantity} {withdrawal.material?.unit || ''}
                              </div>
                              <div className="material-item-unit-cost">
                                {formatCurrency(withdrawal.material?.costPerUnit || 0)} / {withdrawal.material?.unit || ''}
                              </div>
                              <div className="material-item-total-cost">
                                <strong>{formatCurrency(materialCost)}</strong>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      <div className="production-summary-footer">
                        <div className="production-summary-row">
                          <span>Total de Itens:</span>
                          <strong>{production.totalItems}</strong>
                        </div>
                        <div className="production-summary-row">
                          <span>Custo Total:</span>
                          <strong className="production-final-total">{formatCurrency(production.totalCost)}</strong>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {withdrawals.length > 0 && (
        <div className="withdrawals-summary">
          <div className="summary-card">
            <h3>{selectedProduction ? 'Total da Produção' : 'Total em Saídas'}</h3>
            <p className="summary-value">{formatCurrency(totalWithdrawalsCost)}</p>
          </div>
          <div className="summary-card">
            <h3>Total de Saídas</h3>
            <p className="summary-value">{filteredWithdrawals.length}</p>
          </div>
        </div>
      )}

      {productions.length > 0 && (
        <div className="production-filter">
          <select
            value={selectedProduction}
            onChange={(e) => setSelectedProduction(e.target.value)}
            className="filter-select"
          >
            <option value="">Todas as Produções</option>
            {productions.map((production) => (
              <option key={production.productionBatch} value={production.productionBatch}>
                {production.productionBatch} - {formatCurrency(production.totalCost)}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Desktop Table */}
      <div className="withdrawals-table-container">
        <table className="withdrawals-data-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Produção</th>
              <th>Material</th>
              <th>Quantidade</th>
              <th>Custo Unitário</th>
              <th>Custo Total</th>
              <th>Motivo</th>
              <th>Registrado Por</th>
              <th>Observações</th>
            </tr>
          </thead>
          <tbody>
            {filteredWithdrawals.length > 0 ? (
              filteredWithdrawals.map((withdrawal) => (
                <tr key={withdrawal._id}>
                  <td>{formatDate(withdrawal.withdrawalDate)}</td>
                  <td>
                    {withdrawal.productionBatch ? (
                      <span className="production-badge">{withdrawal.productionBatch}</span>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                  <td>
                    <strong>{withdrawal.material?.name || 'N/A'}</strong>
                    {withdrawal.material?.category && (
                      <div className="text-muted">
                        {withdrawal.material.category}
                      </div>
                    )}
                  </td>
                  <td>
                    {withdrawal.quantity} {withdrawal.material?.unit || ''}
                  </td>
                  <td>
                    {formatCurrency(withdrawal.material?.costPerUnit || 0)}
                  </td>
                  <td>
                    <strong>
                      {formatCurrency((withdrawal.material?.costPerUnit || 0) * (withdrawal.quantity || 0))}
                    </strong>
                  </td>
                  <td>
                    <span className={`reason-badge reason-${withdrawal.reason}`}>
                      {REASON_LABELS[withdrawal.reason] || withdrawal.reason}
                    </span>
                  </td>
                  <td>{withdrawal.withdrawnBy?.name || 'N/A'}</td>
                  <td>{withdrawal.notes || '-'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="empty-state">
                  {selectedProduction ? 'Nenhuma saída encontrada para esta produção' : 'Nenhuma saída registrada'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="withdrawals-cards-container">
        {filteredWithdrawals.length > 0 ? (
          filteredWithdrawals.map((withdrawal) => (
            <div key={withdrawal._id} className="withdrawal-card">
              <div className="withdrawal-card-header">
                <h3 className="withdrawal-card-name">{withdrawal.material?.name || 'N/A'}</h3>
                {withdrawal.productionBatch && (
                  <span className="withdrawal-card-batch">{withdrawal.productionBatch}</span>
                )}
              </div>
              <div className="withdrawal-card-body">
                <div className="withdrawal-card-item">
                  <span className="withdrawal-card-label">Data:</span>
                  <span className="withdrawal-card-value">{formatDate(withdrawal.withdrawalDate)}</span>
                </div>
                <div className="withdrawal-card-item">
                  <span className="withdrawal-card-label">Quantidade:</span>
                  <span className="withdrawal-card-value">
                    {withdrawal.quantity} {withdrawal.material?.unit || ''}
                  </span>
                </div>
                <div className="withdrawal-card-item">
                  <span className="withdrawal-card-label">Custo Unitário:</span>
                  <span className="withdrawal-card-value">
                    {formatCurrency(withdrawal.material?.costPerUnit || 0)}
                  </span>
                </div>
                <div className="withdrawal-card-item">
                  <span className="withdrawal-card-label">Custo Total:</span>
                  <span className="withdrawal-card-value withdrawal-card-amount">
                    {formatCurrency((withdrawal.material?.costPerUnit || 0) * (withdrawal.quantity || 0))}
                  </span>
                </div>
                <div className="withdrawal-card-item">
                  <span className="withdrawal-card-label">Motivo:</span>
                  <span className={`withdrawal-card-reason reason-${withdrawal.reason}`}>
                    {REASON_LABELS[withdrawal.reason] || withdrawal.reason}
                  </span>
                </div>
                {withdrawal.notes && (
                  <div className="withdrawal-card-item">
                    <span className="withdrawal-card-label">Observações:</span>
                    <span className="withdrawal-card-value">{withdrawal.notes}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="withdrawals-empty-state">
            {selectedProduction ? 'Nenhuma saída encontrada para esta produção' : 'Nenhuma saída registrada'}
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          resetForm()
        }}
        title="Registrar Saída de Material"
      >
        <form onSubmit={handleSubmit} className="withdrawal-form">
          <div className="form-group">
            <select
              value={formData.material}
              onChange={(e) =>
                setFormData({ ...formData, material: e.target.value })
              }
              required
            >
              <option value="">Material *</option>
              {materials.map((material) => (
                <option key={material._id} value={material._id}>
                  {material.name} ({material.category}) - Estoque: {material.quantityInStock} {material.unit}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: e.target.value })
                }
                required
                placeholder="Quantidade *"
              />
            </div>

            <div className="form-group">
              <select
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                required
              >
                <option value="">Motivo *</option>
                {Object.entries(REASON_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="production-batch-label">
              Lote de Produção
              <div className="production-batch-actions">
                <button
                  type="button"
                  className="btn-production-today"
                  onClick={handleSetTodayProduction}
                >
                  Usar Produção de Hoje
                </button>
              </div>
            </label>
            {productions.length > 0 && (
              <select
                value={formData.productionBatch}
                onChange={(e) => handleSelectExistingProduction(e.target.value)}
                className="production-batch-select"
              >
                <option value="">Criar nova produção ou digitar manualmente</option>
                {productions.map((production) => (
                  <option key={production.productionBatch} value={production.productionBatch}>
                    {production.productionBatch} ({formatCurrency(production.totalCost)})
                  </option>
                ))}
              </select>
            )}
            <input
              type="text"
              value={formData.productionBatch}
              onChange={(e) => {
                setFormData({ ...formData, productionBatch: e.target.value })
                setActiveProduction(e.target.value)
              }}
              placeholder={activeProduction || "Ex: Produção 16/11/2025 ou deixe vazio"}
            />
            {activeProduction && (
              <small className="production-batch-active">
                ✓ Produção ativa: <strong>{activeProduction}</strong>
              </small>
            )}
            <small className="production-batch-hint">
              💡 Use o botão acima para produção de hoje ou selecione uma existente
            </small>
          </div>

          <div className="form-group">
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows="3"
              placeholder="Observações (opcional)"
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Registrar Saída
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default MaterialWithdrawals


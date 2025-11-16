import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { materialPurchaseService, materialService } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { formatCurrency, formatDate } from '../../utils/format'
import { showNotification } from '../../utils/notifications'
import Modal from '../../components/Modal'
import './MaterialPurchases.css'

function MaterialPurchases() {
  const { user } = useAuth()
  const location = useLocation()
  const [purchases, setPurchases] = useState([])
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    material: '',
    quantity: '',
    unitPrice: '',
    supplier: '',
    notes: '',
  })

  const canCreate = user?.role === 'admin' || user?.role === 'vendedor'

  useEffect(() => {
    fetchPurchases()
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
          unitPrice: selectedMat.costPerUnit || '',
          supplier: selectedMat.supplier || '',
        }))
        setIsModalOpen(true)
        // Limpar o state para não abrir novamente
        window.history.replaceState({}, document.title)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materials])

  const fetchPurchases = async () => {
    try {
      const response = await materialPurchaseService.getAll({ limit: 1000 })
      setPurchases(response.data.data.purchases || [])
    } catch (error) {
      showNotification('Erro ao buscar compras', 'error')
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

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.material || !formData.quantity || !formData.unitPrice) {
      showNotification('Preencha todos os campos obrigatórios', 'error')
      return
    }

    try {
      await materialPurchaseService.create({
        material: formData.material,
        quantity: parseFloat(formData.quantity),
        unitPrice: parseFloat(formData.unitPrice),
        supplier: formData.supplier,
        notes: formData.notes,
      })

      showNotification('Compra registrada com sucesso!', 'success')
      setIsModalOpen(false)
      resetForm()
      fetchPurchases()
      // Atualizar lista de materiais para refletir novo estoque
      if (canCreate) {
        fetchMaterials()
      }
    } catch (error) {
      showNotification(
        error.response?.data?.message || 'Erro ao registrar compra',
        'error'
      )
    }
  }

  const resetForm = () => {
    setFormData({
      material: '',
      quantity: '',
      unitPrice: '',
      supplier: '',
      notes: '',
    })
  }

  if (loading) {
    return <div className="loading">Carregando compras...</div>
  }

  const totalSpent = purchases.reduce(
    (sum, purchase) => sum + purchase.totalCost,
    0
  )

  return (
    <div className="material-purchases-page">
      <div className="page-header">
        <h1>Reposição de Estoque</h1>
        <p className="page-subtitle">
          Use esta página apenas quando comprar MAIS de um material que já está cadastrado.
          <br />
          <strong>Para cadastrar material novo:</strong> Use a página "Materiais" - a quantidade inicial já registra a primeira compra automaticamente.
        </p>
        {canCreate && (
          <button
            className="btn-primary"
            onClick={() => {
              resetForm()
              setIsModalOpen(true)
            }}
          >
            + Registrar Compra
          </button>
        )}
      </div>

      {purchases.length > 0 && (
        <div className="purchases-summary">
          <div className="summary-card">
            <h3>Total Investido</h3>
            <p className="summary-value">{formatCurrency(totalSpent)}</p>
            <small className="summary-hint">
              Valor total investido em compras (não altera com saídas)
            </small>
          </div>
          <div className="summary-card">
            <h3>Total de Compras</h3>
            <p className="summary-value">{purchases.length}</p>
          </div>
        </div>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Material</th>
              <th>Quantidade</th>
              <th>Preço Unitário</th>
              <th>Total</th>
              <th>Fornecedor</th>
              <th>Comprado Por</th>
            </tr>
          </thead>
          <tbody>
            {purchases.length > 0 ? (
              purchases.map((purchase) => (
                <tr key={purchase._id}>
                  <td>{formatDate(purchase.purchaseDate)}</td>
                  <td>
                    <strong>{purchase.material?.name || 'N/A'}</strong>
                    {purchase.material?.category && (
                      <div className="text-muted">
                        {purchase.material.category}
                      </div>
                    )}
                  </td>
                  <td>
                    {purchase.quantity} {purchase.material?.unit || ''}
                  </td>
                  <td>{formatCurrency(purchase.unitPrice)}</td>
                  <td>
                    <strong>{formatCurrency(purchase.totalCost)}</strong>
                  </td>
                  <td>{purchase.supplier || '-'}</td>
                  <td>{purchase.purchasedBy?.name || 'N/A'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="empty-state">
                  Nenhuma compra registrada
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="purchases-cards-container">
        {purchases.length > 0 ? (
          purchases.map((purchase) => (
            <div key={purchase._id} className="purchases-card">
              <div className="purchases-card-header">
                <h3 className="purchases-card-material">
                  {purchase.material?.name || 'N/A'}
                </h3>
                <span className="purchases-card-date">
                  {formatDate(purchase.purchaseDate)}
                </span>
              </div>
              {purchase.material?.category && (
                <div className="purchases-card-item purchases-card-category">
                  <span className="purchases-card-label">Categoria:</span>
                  <span className="purchases-card-value">{purchase.material.category}</span>
                </div>
              )}
              <div className="purchases-card-body">
                <div className="purchases-card-item">
                  <span className="purchases-card-label">Quantidade:</span>
                  <span className="purchases-card-value">
                    {purchase.quantity} {purchase.material?.unit || ''}
                  </span>
                </div>
                <div className="purchases-card-item">
                  <span className="purchases-card-label">Preço Unitário:</span>
                  <span className="purchases-card-value">{formatCurrency(purchase.unitPrice)}</span>
                </div>
                <div className="purchases-card-item">
                  <span className="purchases-card-label">Total:</span>
                  <span className="purchases-card-value">
                    <strong>{formatCurrency(purchase.totalCost)}</strong>
                  </span>
                </div>
                {purchase.supplier && (
                  <div className="purchases-card-item">
                    <span className="purchases-card-label">Fornecedor:</span>
                    <span className="purchases-card-value">{purchase.supplier}</span>
                  </div>
                )}
                {purchase.purchasedBy?.name && (
                  <div className="purchases-card-item">
                    <span className="purchases-card-label">Comprado Por:</span>
                    <span className="purchases-card-value">{purchase.purchasedBy.name}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="purchases-empty-state">
            Nenhuma compra registrada
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          resetForm()
        }}
        title="Registrar Entrada de Material"
      >
        <form onSubmit={handleSubmit} className="purchase-form">
          <div className="form-group">
            <label>Material *</label>
            <select
              value={formData.material}
              onChange={(e) =>
                setFormData({ ...formData, material: e.target.value })
              }
              required
            >
              <option value="">Selecione um material</option>
              {materials.map((material) => (
                <option key={material._id} value={material._id}>
                  {material.name} ({material.category}) - Estoque atual: {material.quantityInStock} {material.unit}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Quantidade *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: e.target.value })
                }
                required
                placeholder="0.00"
              />
            </div>

            <div className="form-group">
              <label>Preço Unitário *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.unitPrice}
                onChange={(e) =>
                  setFormData({ ...formData, unitPrice: e.target.value })
                }
                required
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Fornecedor</label>
            <input
              type="text"
              value={formData.supplier}
              onChange={(e) =>
                setFormData({ ...formData, supplier: e.target.value })
              }
              placeholder="Nome do fornecedor"
            />
          </div>

          <div className="form-group">
            <label>Observações</label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows="3"
              placeholder="Anotações sobre a compra..."
            />
          </div>

          {formData.quantity && formData.unitPrice && (
            <div className="total-preview">
              <strong>
                Total: {formatCurrency(parseFloat(formData.quantity || 0) * parseFloat(formData.unitPrice || 0))}
              </strong>
            </div>
          )}

          <div className="form-actions">
            <button type="button" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Registrar Compra
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default MaterialPurchases

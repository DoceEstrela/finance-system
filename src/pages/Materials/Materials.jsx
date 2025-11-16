import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { materialService } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { formatCurrency } from '../../utils/format'
import { showNotification } from '../../utils/notifications'
import Modal from '../../components/Modal'
import './Materials.css'

const categories = {
  cone: 'Cone',
  cobertura: 'Cobertura',
  topping: 'Topping',
  embalagem: 'Embalagem',
  utensilio: 'Utensílio',
  outro: 'Outro',
}

const units = {
  unidade: 'Unidade',
  kg: 'Quilograma (kg)',
  litro: 'Litro (L)',
  pacote: 'Pacote',
  caixa: 'Caixa',
}

function Materials() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'cone',
    unit: 'unidade',
    costPerUnit: '',
    quantityInStock: '',
    minimumStock: '',
    supplier: '',
    supplierPhone: '',
    notes: '',
  })

  const canEdit = user?.role === 'admin' || user?.role === 'vendedor'

  useEffect(() => {
    fetchMaterials()
  }, [searchTerm, filterCategory])

  const fetchMaterials = async () => {
    try {
      const response = await materialService.getAll({
        search: searchTerm,
        category: filterCategory,
        limit: 1000,
      })
      setMaterials(response.data.data.materials || [])
    } catch (error) {
      showNotification('Erro ao buscar materiais', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const quantityInStock = parseFloat(formData.quantityInStock) || 0
      const data = {
        ...formData,
        costPerUnit: parseFloat(formData.costPerUnit),
        quantityInStock: quantityInStock,
        minimumStock: parseFloat(formData.minimumStock) || 0,
        // Se é material novo e tem quantidade, marca como compra inicial
        initialPurchase: !editingMaterial && quantityInStock > 0,
      }

      if (editingMaterial) {
        await materialService.update(editingMaterial._id, data)
        showNotification('Material atualizado com sucesso!', 'success')
      } else {
        const response = await materialService.create(data)
        if (quantityInStock > 0) {
          showNotification('Material criado e estoque inicial registrado!', 'success')
        } else {
          showNotification('Material criado com sucesso!', 'success')
        }
      }

      setIsModalOpen(false)
      resetForm()
      fetchMaterials()
    } catch (error) {
      showNotification(
        error.response?.data?.message || 'Erro ao salvar material',
        'error'
      )
    }
  }

  const handleEdit = (material) => {
    setEditingMaterial(material)
    setFormData({
      name: material.name,
      description: material.description || '',
      category: material.category,
      unit: material.unit,
      costPerUnit: material.costPerUnit,
      quantityInStock: material.quantityInStock,
      minimumStock: material.minimumStock || 0,
      supplier: material.supplier || '',
      supplierPhone: material.supplierPhone || '',
      notes: material.notes || '',
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este material?')) {
      return
    }

    try {
      await materialService.delete(id)
      showNotification('Material excluído com sucesso!', 'success')
      fetchMaterials()
    } catch (error) {
      showNotification('Erro ao excluir material', 'error')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'cone',
      unit: 'unidade',
      costPerUnit: '',
      quantityInStock: '',
      minimumStock: '',
      supplier: '',
      supplierPhone: '',
      notes: '',
    })
    setEditingMaterial(null)
  }

  const getStockStatus = (material) => {
    if (material.minimumStock > 0 && material.quantityInStock <= material.minimumStock) {
      return 'low'
    }
    if (material.quantityInStock === 0) {
      return 'empty'
    }
    return 'ok'
  }

  if (loading) {
    return <div className="loading">Carregando materiais...</div>
  }

  return (
    <div className="materials-page">
      <div className="page-header">
        <h1>Materiais</h1>
        <p className="page-description">
          Cadastre seus materiais aqui. Ao informar a quantidade inicial, ela será automaticamente registrada como primeira compra.
        </p>
        <div className="header-actions-group">
          {canEdit && (
            <>
              <button
                className="btn-secondary"
                onClick={() => navigate('/material-purchases')}
                title="Comprar mais de materiais já cadastrados"
              >
                Comprar Mais (Reposição)
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  resetForm()
                  setIsModalOpen(true)
                }}
              >
                + Novo Material
              </button>
            </>
          )}
        </div>
      </div>

      <div className="filters-bar">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Buscar materiais..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="filter-select"
        >
          <option value="">Todas as Categorias</option>
          {Object.entries(categories).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Categoria</th>
              <th>Custo/Unidade</th>
              <th>Estoque</th>
              <th>Unidade</th>
              <th>Valor Total</th>
              <th>Fornecedor</th>
              {canEdit && <th>Ações</th>}
            </tr>
          </thead>
          <tbody>
            {materials.length > 0 ? (
              materials.map((material) => {
                const stockStatus = getStockStatus(material)
                const totalValue = material.costPerUnit * material.quantityInStock

                return (
                  <tr key={material._id}>
                    <td>
                      <strong>{material.name}</strong>
                      {material.description && (
                        <div className="text-muted">{material.description}</div>
                      )}
                    </td>
                    <td>
                      <span className={`category-badge category-${material.category}`}>
                        {categories[material.category] || material.category}
                      </span>
                    </td>
                    <td>{formatCurrency(material.costPerUnit)}</td>
                    <td>
                      <span className={`stock-status stock-${stockStatus}`}>
                        {material.quantityInStock} {units[material.unit]}
                        {material.minimumStock > 0 && (
                          <small> (mín: {material.minimumStock})</small>
                        )}
                      </span>
                    </td>
                    <td>{units[material.unit]}</td>
                    <td>{formatCurrency(totalValue)}</td>
                    <td>{material.supplier || '-'}</td>
                    {canEdit && (
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-buy"
                            onClick={() => {
                              navigate('/material-purchases', {
                                state: { selectedMaterial: material._id }
                              })
                            }}
                            title="Comprar mais deste material"
                          >
                            Comprar
                          </button>
                          <button
                            className="btn-edit"
                            onClick={() => handleEdit(material)}
                          >
                            Editar
                          </button>
                          {user?.role === 'admin' && (
                            <button
                              className="btn-delete"
                              onClick={() => handleDelete(material._id)}
                            >
                              Excluir
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })
            ) : (
              <tr>
                <td
                  colSpan={canEdit ? 8 : 7}
                  className="empty-state"
                >
                  Nenhum material encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="materials-cards-container">
        {materials.length > 0 ? (
          materials.map((material) => {
            const stockStatus = getStockStatus(material)
            const totalValue = material.costPerUnit * material.quantityInStock

            return (
              <div key={material._id} className="materials-card">
                <div className="materials-card-header">
                  <h3 className="materials-card-name">{material.name}</h3>
                  <span className={`category-badge category-${material.category}`}>
                    {categories[material.category] || material.category}
                  </span>
                </div>
                {material.description && (
                  <div className="materials-card-description">
                    {material.description}
                  </div>
                )}
                <div className="materials-card-body">
                  <div className="materials-card-item">
                    <span className="materials-card-label">Custo/Unidade:</span>
                    <span className="materials-card-value">{formatCurrency(material.costPerUnit)}</span>
                  </div>
                  <div className="materials-card-item">
                    <span className="materials-card-label">Estoque:</span>
                    <span className={`materials-card-value stock-status stock-${stockStatus}`}>
                      {material.quantityInStock} {units[material.unit]}
                      {material.minimumStock > 0 && (
                        <small> (mín: {material.minimumStock})</small>
                      )}
                    </span>
                  </div>
                  <div className="materials-card-item">
                    <span className="materials-card-label">Unidade:</span>
                    <span className="materials-card-value">{units[material.unit]}</span>
                  </div>
                  <div className="materials-card-item">
                    <span className="materials-card-label">Valor Total:</span>
                    <span className="materials-card-value">{formatCurrency(totalValue)}</span>
                  </div>
                  {material.supplier && (
                    <div className="materials-card-item">
                      <span className="materials-card-label">Fornecedor:</span>
                      <span className="materials-card-value">{material.supplier}</span>
                    </div>
                  )}
                </div>
                {canEdit && (
                  <div className="materials-card-actions">
                    <button
                      className="btn-buy"
                      onClick={() => {
                        navigate('/material-purchases', {
                          state: { selectedMaterial: material._id }
                        })
                      }}
                      title="Comprar mais deste material"
                    >
                      Comprar
                    </button>
                    <button
                      className="btn-edit"
                      onClick={() => handleEdit(material)}
                    >
                      Editar
                    </button>
                    {user?.role === 'admin' && (
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(material._id)}
                      >
                        Excluir
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })
        ) : (
          <div className="materials-empty-state">
            Nenhum material encontrado
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          resetForm()
        }}
        title={editingMaterial ? 'Editar Material' : 'Novo Material'}
      >
        <form onSubmit={handleSubmit} className="material-form">
          <div className="form-group">
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Nome do Material *"
              required
            />
          </div>

          <div className="form-group">
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows="2"
              placeholder="Descrição (opcional)"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                required
              >
                <option value="">Categoria *</option>
                {Object.entries(categories).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <select
                value={formData.unit}
                onChange={(e) =>
                  setFormData({ ...formData, unit: e.target.value })
                }
                required
              >
                <option value="">Unidade de Medida *</option>
                {Object.entries(units).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.costPerUnit}
                onChange={(e) =>
                  setFormData({ ...formData, costPerUnit: e.target.value })
                }
                placeholder="Custo por Unidade *"
                required
              />
            </div>

            <div className="form-group">
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.quantityInStock}
                onChange={(e) =>
                  setFormData({ ...formData, quantityInStock: e.target.value })
                }
                placeholder={`Quantidade Inicial ${!editingMaterial ? '(Primeira Compra)' : ''} *`}
                required
              />
              {!editingMaterial && (
                <small className="form-help">
                  ✓ Esta quantidade será automaticamente registrada como primeira compra no histórico
                </small>
              )}
              {editingMaterial && (
                <small className="form-help">
                  Para comprar mais, use a página "Entrada de Materiais"
                </small>
              )}
            </div>
          </div>

          <div className="form-group">
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.minimumStock}
              onChange={(e) =>
                setFormData({ ...formData, minimumStock: e.target.value })
              }
              placeholder="Estoque Mínimo (opcional)"
            />
            <small className="form-help">
              Alerta quando estoque estiver neste valor ou abaixo
            </small>
          </div>

          <div className="form-row">
            <div className="form-group">
              <input
                type="text"
                value={formData.supplier}
                onChange={(e) =>
                  setFormData({ ...formData, supplier: e.target.value })
                }
                placeholder="Fornecedor (opcional)"
              />
            </div>

            <div className="form-group">
              <input
                type="tel"
                value={formData.supplierPhone}
                onChange={(e) =>
                  setFormData({ ...formData, supplierPhone: e.target.value })
                }
                placeholder="Telefone do Fornecedor (opcional)"
              />
            </div>
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
              {editingMaterial ? 'Atualizar' : 'Criar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Materials

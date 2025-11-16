import { useState, useEffect } from 'react'
import { productService, materialWithdrawalService } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { formatCurrency } from '../../utils/format'
import { showNotification } from '../../utils/notifications'
import Modal from '../../components/Modal'
import './Products.css'

function Products() {
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    costPrice: '',
    stock: '',
    category: '',
    productionBatch: '',
  })
  const [availableProductions, setAvailableProductions] = useState([])
  const [showCostCalculator, setShowCostCalculator] = useState(false)
  const [calculatorData, setCalculatorData] = useState({
    totalCost: '',
    quantity: '',
  })

  const canEdit = user?.role === 'admin' || user?.role === 'vendedor'

  useEffect(() => {
    fetchProducts()
    fetchAvailableProductions()
  }, [searchTerm])

  const fetchAvailableProductions = async () => {
    try {
      const response = await materialWithdrawalService.getByProduction()
      const productions = response.data.data.productions || []
      setAvailableProductions(productions.map(p => p.productionBatch))
    } catch (error) {
      console.error('Erro ao buscar produções:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await productService.getAll({ search: searchTerm })
      setProducts(response.data.data.products || [])
    } catch (error) {
      showNotification('Erro ao buscar produtos', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const data = {
        ...formData,
        price: parseFloat(formData.price),
        costPrice: parseFloat(formData.costPrice),
        stock: parseInt(formData.stock),
      }

      if (editingProduct) {
        await productService.update(editingProduct._id, data)
        showNotification('Produto atualizado com sucesso!', 'success')
      } else {
        await productService.create(data)
        showNotification('Produto criado com sucesso!', 'success')
      }

      setIsModalOpen(false)
      resetForm()
      fetchProducts()
    } catch (error) {
      showNotification(
        error.response?.data?.message || 'Erro ao salvar produto',
        'error'
      )
    }
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price,
      costPrice: product.costPrice,
      stock: product.stock,
      category: product.category || '',
      productionBatch: product.productionBatch || '',
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este produto?')) {
      return
    }

    try {
      await productService.delete(id)
      showNotification('Produto excluído com sucesso!', 'success')
      fetchProducts()
    } catch (error) {
      showNotification('Erro ao excluir produto', 'error')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      costPrice: '',
      stock: '',
      category: '',
      productionBatch: '',
    })
    setEditingProduct(null)
    setShowCostCalculator(false)
    setCalculatorData({
      totalCost: '',
      quantity: '',
    })
  }

  const handleSetTodayProduction = () => {
    const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const todayProduction = `Produção ${today}`
    setFormData({ ...formData, productionBatch: todayProduction })
  }

  if (loading) {
    return <div className="loading">Carregando produtos...</div>
  }

  return (
    <div className="products-page">
      <div className="page-header">
        <h1>Produtos</h1>
        {canEdit && (
          <button
            className="btn-primary"
            onClick={() => {
              resetForm()
              setIsModalOpen(true)
            }}
          >
            + Novo Produto
          </button>
        )}
      </div>

      <div className="products-search-bar">
        <input
          type="text"
          placeholder="Buscar produtos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Desktop Table */}
      <div className="products-table-container">
        <table className="products-data-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Preço</th>
              <th>Preço de Custo</th>
              <th>Estoque</th>
              <th>Categoria</th>
              {canEdit && <th>Ações</th>}
            </tr>
          </thead>
          <tbody>
            {products.length > 0 ? (
              products.map((product) => (
                <tr key={product._id}>
                  <td>
                    <strong>{product.name}</strong>
                    {product.description && (
                      <div className="products-text-muted">{product.description}</div>
                    )}
                  </td>
                  <td>{formatCurrency(product.price)}</td>
                  <td>{formatCurrency(product.costPrice)}</td>
                  <td>
                    <span
                      className={
                        product.stock < 10 ? 'products-stock-low' : 'products-stock-ok'
                      }
                    >
                      {product.stock}
                    </span>
                  </td>
                  <td>{product.category || '-'}</td>
                  {canEdit && (
                    <td>
                      <button
                        className="products-btn-edit"
                        onClick={() => handleEdit(product)}
                      >
                        Editar
                      </button>
                      {user?.role === 'admin' && (
                        <button
                          className="products-btn-delete"
                          onClick={() => handleDelete(product._id)}
                        >
                          Excluir
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={canEdit ? 6 : 5} className="empty-state">
                  Nenhum produto encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="products-cards-container">
        {products.length > 0 ? (
          products.map((product) => (
            <div key={product._id} className="products-card">
              <div className="products-card-header">
                <h3 className="products-card-name">{product.name}</h3>
                <span
                  className={
                    product.stock < 10 ? 'products-stock-low' : 'products-stock-ok'
                  }
                >
                  {product.stock} un
                </span>
              </div>
              {product.description && (
                <div className="products-card-description">
                  {product.description}
                </div>
              )}
              <div className="products-card-body">
                <div className="products-card-item">
                  <span className="products-card-label">Preço:</span>
                  <span className="products-card-value">{formatCurrency(product.price)}</span>
                </div>
                <div className="products-card-item">
                  <span className="products-card-label">Preço de Custo:</span>
                  <span className="products-card-value">{formatCurrency(product.costPrice)}</span>
                </div>
                {product.category && (
                  <div className="products-card-item">
                    <span className="products-card-label">Categoria:</span>
                    <span className="products-card-value">{product.category}</span>
                  </div>
                )}
              </div>
              {canEdit && (
                <div className="products-card-actions">
                  <button
                    className="products-btn-edit"
                    onClick={() => handleEdit(product)}
                  >
                    Editar
                  </button>
                  {user?.role === 'admin' && (
                    <button
                      className="products-btn-delete"
                      onClick={() => handleDelete(product._id)}
                    >
                      Excluir
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="products-empty-state">
            Nenhum produto encontrado
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          resetForm()
        }}
        title={editingProduct ? 'Editar Produto' : 'Novo Produto'}
      >
        <form onSubmit={handleSubmit} className="product-form">
          <div className="form-group">
            <label className="product-form-label">Nome *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Nome *"
              required
            />
          </div>
          <div className="form-group">
            <label className="product-form-label">Descrição</label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows="3"
              placeholder="Descrição (opcional)"
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="product-form-label">Preço de Venda *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                placeholder="Preço de Venda *"
                required
              />
            </div>
            <div className="form-group">
              <label className="product-form-label">
                Preço de Custo *
                <button
                  type="button"
                  className="cost-calculator-toggle"
                  onClick={() => setShowCostCalculator(!showCostCalculator)}
                >
                  {showCostCalculator ? 'Ocultar' : 'Calcular'}
                </button>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.costPrice}
                onChange={(e) =>
                  setFormData({ ...formData, costPrice: e.target.value })
                }
                placeholder="Preço de Custo *"
                required
              />
              {showCostCalculator && (
                <div className="cost-calculator">
                  <div className="calculator-inputs">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={calculatorData.totalCost}
                      onChange={(e) => {
                        // Aceitar vírgula ou ponto como separador decimal
                        let value = e.target.value.replace(',', '.')
                        // Remover caracteres inválidos, mantendo apenas números e ponto
                        value = value.replace(/[^0-9.]/g, '')
                        // Garantir apenas um ponto decimal
                        const parts = value.split('.')
                        if (parts.length > 2) {
                          value = parts[0] + '.' + parts.slice(1).join('')
                        }
                        
                        const total = parseFloat(value) || 0
                        const qty = parseFloat(calculatorData.quantity) || 0
                        setCalculatorData({
                          ...calculatorData,
                          totalCost: value,
                        })
                        if (qty > 0 && total > 0) {
                          setFormData({
                            ...formData,
                            costPrice: (total / qty).toFixed(2),
                          })
                        }
                      }}
                      placeholder="Custo Total (ex: 46,95 ou 46.95)"
                    />
                    <span>÷</span>
                    <input
                      type="number"
                      min="1"
                      value={calculatorData.quantity}
                      onChange={(e) => {
                        const qty = parseFloat(e.target.value) || 0
                        const total = parseFloat(calculatorData.totalCost) || 0
                        setCalculatorData({
                          ...calculatorData,
                          quantity: e.target.value,
                        })
                        if (qty > 0 && total > 0) {
                          setFormData({
                            ...formData,
                            costPrice: (total / qty).toFixed(2),
                          })
                        }
                      }}
                      placeholder="Quantidade (ex: 40)"
                    />
                    <span>=</span>
                    <span className="calculator-result">
                      R$ {formData.costPrice || '0.00'}
                    </span>
                  </div>
                  <small className="cost-calculator-hint">
                    💡 Insira o custo total dos materiais e a quantidade produzida
                  </small>
                </div>
              )}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="product-form-label">Estoque *</label>
              <input
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) =>
                  setFormData({ ...formData, stock: e.target.value })
                }
                placeholder="Estoque *"
                required
              />
            </div>
            <div className="form-group">
              <label className="product-form-label">Categoria</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                placeholder="Categoria (opcional)"
              />
            </div>
            <div className="form-group">
              <label className="product-form-label">
                Lote de Produção
                <button
                  type="button"
                  className="btn-production-today-small"
                  onClick={handleSetTodayProduction}
                  title="Usar produção de hoje"
                >
                  Hoje
                </button>
              </label>
              {availableProductions.length > 0 && (
                <select
                  value={formData.productionBatch}
                  onChange={(e) =>
                    setFormData({ ...formData, productionBatch: e.target.value })
                  }
                  className="production-batch-select"
                >
                  <option value="">Criar nova produção ou deixar vazio</option>
                  {availableProductions.map((batch) => (
                    <option key={batch} value={batch}>
                      {batch}
                    </option>
                  ))}
                </select>
              )}
              <input
                type="text"
                value={formData.productionBatch}
                onChange={(e) =>
                  setFormData({ ...formData, productionBatch: e.target.value })
                }
                placeholder="Ex: Produção 16/11/2025 (opcional)"
              />
              <small className="production-batch-hint">
                💡 Associe este produto a um lote de produção para rastrear custos
              </small>
            </div>
          </div>
          <div className="form-actions">
            <button type="button" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              {editingProduct ? 'Atualizar' : 'Criar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Products

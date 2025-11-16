import { useState, useEffect } from 'react'
import { saleService, clientService, productService, materialService } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { formatCurrency, formatDate } from '../../utils/format'
import { showNotification } from '../../utils/notifications'
import Modal from '../../components/Modal'
import './Sales.css'

function Sales() {
  const { user } = useAuth()
  const [sales, setSales] = useState([])
  const [clients, setClients] = useState([])
  const [products, setProducts] = useState([])
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isQuickClientModalOpen, setIsQuickClientModalOpen] = useState(false)
  const [saleItems, setSaleItems] = useState([{ product: '', quantity: 1, materialsUsed: [] }])
  const [filterStatus, setFilterStatus] = useState('all') // all, paid, pending
  const [dateFilter, setDateFilter] = useState('all') // all, today, week, month, custom
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [quickClientData, setQuickClientData] = useState({
    name: '',
    phone: '',
    email: '',
  })
  const [selectedClientId, setSelectedClientId] = useState('')
  const [isQuickSale, setIsQuickSale] = useState(false)

  const canCreate = user?.role === 'admin' || user?.role === 'vendedor'

  useEffect(() => {
    if (canCreate) {
      fetchClients()
      fetchProducts()
      fetchMaterials()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getDateRange = () => {
    const now = new Date()
    let startDate = null
    let endDate = new Date(now.setHours(23, 59, 59, 999))

    switch (dateFilter) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0))
        break
      case 'week':
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 7)
        startDate.setHours(0, 0, 0, 0)
        break
      case 'month':
        startDate = new Date(now)
        startDate.setMonth(now.getMonth() - 1)
        startDate.setHours(0, 0, 0, 0)
        break
      case 'custom':
        if (customStartDate && customEndDate) {
          startDate = new Date(customStartDate)
          startDate.setHours(0, 0, 0, 0)
          endDate = new Date(customEndDate)
          endDate.setHours(23, 59, 59, 999)
        }
        break
      default:
        return {}
    }

    if (startDate) {
      return { startDate: startDate.toISOString().split('T')[0], endDate: endDate.toISOString().split('T')[0] }
    }
    return {}
  }

  useEffect(() => {
    fetchSales()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, dateFilter, customStartDate, customEndDate])

  const fetchSales = async () => {
    try {
      const dateRange = getDateRange()
      const response = await saleService.getAll({ limit: 1000, ...dateRange })
      let filteredSales = response.data.data.sales || []
      
      // Filtrar por status de pagamento
      if (filterStatus === 'paid') {
        filteredSales = filteredSales.filter(sale => sale.paymentStatus === 'pago')
      } else if (filterStatus === 'pending') {
        filteredSales = filteredSales.filter(sale => sale.paymentStatus === 'pendente')
      }
      
      setSales(filteredSales)
    } catch (error) {
      showNotification('Erro ao buscar vendas', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchClients = async () => {
    try {
      const response = await clientService.getAll({ limit: 1000 })
      setClients(response.data.data.clients || [])
    } catch (error) {
      console.error('Erro ao buscar clientes:', error)
    }
  }

  const handleCreateQuickClient = async (e) => {
    e.preventDefault()
    
    if (!quickClientData.name.trim()) {
      showNotification('Nome do cliente é obrigatório', 'error')
      return
    }

    try {
      const response = await clientService.create({
        name: quickClientData.name.trim(),
        phone: quickClientData.phone.trim() || '',
        email: quickClientData.email.trim() || undefined,
      })
      
      const newClient = response.data.data.client
      setClients([newClient, ...clients])
      setSelectedClientId(newClient._id)
      setIsQuickClientModalOpen(false)
      setQuickClientData({ name: '', phone: '', email: '' })
      showNotification('Cliente criado com sucesso!', 'success')
    } catch (error) {
      showNotification(
        error.response?.data?.message || 'Erro ao criar cliente',
        'error'
      )
    }
  }

  const handleQuickSale = () => {
    // Apenas marca como venda direta e abre o modal
    // O cliente será criado apenas quando finalizar a venda
    setIsQuickSale(true)
    setSelectedClientId('') // Limpa seleção
    setIsModalOpen(true)
  }

  const fetchProducts = async () => {
    try {
      const response = await productService.getAll({ limit: 1000 })
      setProducts(response.data.data.products || [])
    } catch (error) {
      console.error('Erro ao buscar produtos:', error)
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

  const handleAddItem = () => {
    setSaleItems([...saleItems, { product: '', quantity: 1, materialsUsed: [] }])
  }

  const handleRemoveItem = (index) => {
    setSaleItems(saleItems.filter((_, i) => i !== index))
  }

  const handleItemChange = (index, field, value) => {
    const updated = [...saleItems]
    updated[index] = { ...updated[index], [field]: value }
    setSaleItems(updated)
  }

  const handleAddMaterialToItem = (itemIndex) => {
    const updated = [...saleItems]
    if (!updated[itemIndex].materialsUsed) {
      updated[itemIndex].materialsUsed = []
    }
    updated[itemIndex].materialsUsed.push({ material: '', quantity: 1 })
    setSaleItems(updated)
  }

  const handleRemoveMaterialFromItem = (itemIndex, materialIndex) => {
    const updated = [...saleItems]
    updated[itemIndex].materialsUsed = updated[itemIndex].materialsUsed.filter(
      (_, i) => i !== materialIndex
    )
    setSaleItems(updated)
  }

  const handleMaterialChange = (itemIndex, materialIndex, field, value) => {
    const updated = [...saleItems]
    updated[itemIndex].materialsUsed[materialIndex] = {
      ...updated[itemIndex].materialsUsed[materialIndex],
      [field]: value,
    }
    setSaleItems(updated)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    let client = selectedClientId

    // Se for venda direta, criar cliente temporário agora
    if (isQuickSale && !client) {
      try {
        const response = await clientService.createQuickSale()
        const newClient = response.data.data.client
        
        // Adicionar à lista de clientes
        setClients([newClient, ...clients])
        client = newClient._id
      } catch (error) {
        showNotification(
          error.response?.data?.message || 'Erro ao criar cliente temporário',
          'error'
        )
        return
      }
    }

    if (!client) {
      showNotification('Selecione um cliente', 'error')
      return
    }

    const items = saleItems
      .filter((item) => item.product && item.quantity > 0)
      .map((item) => ({
        product: item.product,
        quantity: parseInt(item.quantity),
        materialsUsed: (item.materialsUsed || [])
          .filter((mat) => mat.material && mat.quantity > 0)
          .map((mat) => ({
            material: mat.material,
            quantity: parseFloat(mat.quantity),
          })),
      }))

    if (items.length === 0) {
      showNotification('Adicione pelo menos um produto', 'error')
      return
    }

    try {
      const formData = new FormData(e.target)
      const paymentMethod = formData.get('paymentMethod') || 'dinheiro'
      const paymentStatus = paymentMethod === 'pendente' ? 'pendente' : 'pago'
      
      await saleService.create({
        client,
        items,
        paymentMethod,
        paymentStatus,
      })

      showNotification('Venda registrada com sucesso!', 'success')
      setIsModalOpen(false)
      setSaleItems([{ product: '', quantity: 1, materialsUsed: [] }])
      setSelectedClientId('')
      setIsQuickSale(false) // Reset venda direta
      fetchSales()
    } catch (error) {
      showNotification(
        error.response?.data?.message || 'Erro ao registrar venda',
        'error'
      )
    }
  }

  const handleMarkAsPaid = async (saleId) => {
    if (!window.confirm('Marcar esta venda como paga? O estoque será atualizado.')) {
      return
    }

    try {
      await saleService.updatePaymentStatus(saleId, {
        paymentStatus: 'pago',
      })
      showNotification('Venda marcada como paga!', 'success')
      fetchSales()
    } catch (error) {
      showNotification(
        error.response?.data?.message || 'Erro ao atualizar status de pagamento',
        'error'
      )
    }
  }

  if (loading) {
    return <div className="loading">Carregando vendas...</div>
  }

  return (
    <div className="sales-page">
      <div className="page-header">
        <h1>Vendas</h1>
        <div className="header-actions">
          {canCreate && (
            <button
              className="btn-quick-sale"
              onClick={handleQuickSale}
              title="Venda rápida sem cadastro"
            >
              ⚡ Venda Direta
            </button>
          )}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">Todas as Vendas</option>
            <option value="paid">Pagas</option>
            <option value="pending">Pendentes</option>
          </select>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">Todas as Datas</option>
            <option value="today">Hoje</option>
            <option value="week">Últimos 7 dias</option>
            <option value="month">Últimos 30 dias</option>
            <option value="custom">Período Personalizado</option>
          </select>
          {dateFilter === 'custom' && (
            <div className="custom-date-filters">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="date-input"
                placeholder="Data inicial"
              />
              <span>até</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="date-input"
                placeholder="Data final"
              />
            </div>
          )}
          {canCreate && (
            <button
              className="btn-primary"
              onClick={() => setIsModalOpen(true)}
            >
              + Nova Venda
            </button>
          )}
        </div>
      </div>

      {/* Desktop Table */}
      <div className="sales-table-container">
        <table className="sales-data-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Cliente</th>
              <th>Itens</th>
              <th>Valor Total</th>
              <th>Lucro Líquido</th>
              <th>Pagamento</th>
              <th>Status</th>
              {canCreate && <th>Ações</th>}
            </tr>
          </thead>
          <tbody>
            {sales.length > 0 ? (
              sales.map((sale) => (
                <tr key={sale._id}>
                  <td>{formatDate(sale.saleDate)}</td>
                  <td>{sale.client?.name || 'N/A'}</td>
                  <td>{sale.items?.length || 0} itens</td>
                  <td>{formatCurrency(sale.totalAmount)}</td>
                  <td>{formatCurrency(sale.netProfit)}</td>
                  <td>
                    <span className={`payment-badge payment-${sale.paymentStatus || 'pago'}`}>
                      {sale.paymentStatus === 'pendente' ? 'Pendente' : 'Pago'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge status-${sale.status}`}>
                      {sale.status}
                    </span>
                  </td>
                  {canCreate && (
                    <td>
                      {sale.paymentStatus === 'pendente' && (
                        <button
                          className="btn-mark-paid"
                          onClick={() => handleMarkAsPaid(sale._id)}
                          title="Marcar como pago"
                        >
                          Marcar como Pago
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={canCreate ? 8 : 7} className="empty-state">
                  Nenhuma venda encontrada
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="sales-cards-container">
        {sales.length > 0 ? (
          sales.map((sale) => (
            <div key={sale._id} className="sales-card">
              <div className="sales-card-header">
                <div>
                  <h3 className="sales-card-date">{formatDate(sale.saleDate)}</h3>
                  <p className="sales-card-client">{sale.client?.name || 'N/A'}</p>
                </div>
                <div className="sales-card-badges">
                  <span className={`payment-badge payment-${sale.paymentStatus || 'pago'}`}>
                    {sale.paymentStatus === 'pendente' ? 'Pendente' : 'Pago'}
                  </span>
                </div>
              </div>
              <div className="sales-card-body">
                <div className="sales-card-item">
                  <span className="sales-card-label">Itens:</span>
                  <span className="sales-card-value">{sale.items?.length || 0} itens</span>
                </div>
                <div className="sales-card-item">
                  <span className="sales-card-label">Valor Total:</span>
                  <span className="sales-card-value">{formatCurrency(sale.totalAmount)}</span>
                </div>
                <div className="sales-card-item">
                  <span className="sales-card-label">Lucro Líquido:</span>
                  <span className="sales-card-value">{formatCurrency(sale.netProfit)}</span>
                </div>
                <div className="sales-card-item">
                  <span className="sales-card-label">Status:</span>
                  <span className={`status-badge status-${sale.status}`}>
                    {sale.status}
                  </span>
                </div>
              </div>
              {canCreate && sale.paymentStatus === 'pendente' && (
                <div className="sales-card-actions">
                  <button
                    className="btn-mark-paid"
                    onClick={() => handleMarkAsPaid(sale._id)}
                  >
                    Marcar como Pago
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="sales-empty-state">
            Nenhuma venda encontrada
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSaleItems([{ product: '', quantity: 1, materialsUsed: [] }])
          setSelectedClientId('')
          setIsQuickSale(false) // Reset venda direta ao cancelar
        }}
        title="Nova Venda"
      >
        <form onSubmit={handleSubmit} className="sale-form">
          <div className="form-group">
            {isQuickSale ? (
              <div className="quick-sale-indicator">
                <span className="quick-sale-badge">⚡ Venda Direta</span>
                <p className="quick-sale-hint">
                  Cliente temporário será criado automaticamente ao finalizar a venda
                </p>
              </div>
            ) : (
              <div className="client-select-wrapper">
                <select 
                  name="client" 
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  required
                >
                  <option value="">Cliente *</option>
                  {clients.map((client) => (
                    <option key={client._id} value={client._id}>
                      {client.name} {client.phone ? `(${client.phone})` : ''}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn-quick-client"
                  onClick={() => setIsQuickClientModalOpen(true)}
                  title="Criar cliente rápido"
                >
                  + Novo Cliente
                </button>
              </div>
            )}
          </div>

          <div className="sale-items">
            <div className="sale-items-header">
              <button
                type="button"
                onClick={handleAddItem}
                className="btn-add-item"
              >
                + Adicionar Produto
              </button>
            </div>

            {saleItems.map((item, index) => {
              const selectedProduct = products.find(
                (p) => p._id === item.product
              )

              return (
                <div key={index} className="sale-item">
                  <select
                    value={item.product}
                    onChange={(e) =>
                      handleItemChange(index, 'product', e.target.value)
                    }
                    required
                  >
                    <option value="">Selecione um produto</option>
                    {products.map((product) => (
                      <option key={product._id} value={product._id}>
                        {product.name} - {formatCurrency(product.price)} (Estoque: {product.stock})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) =>
                      handleItemChange(index, 'quantity', e.target.value)
                    }
                    required
                    placeholder="Qtd"
                  />
                  {selectedProduct && (
                    <span className="item-subtotal">
                      {formatCurrency(
                        selectedProduct.price * (parseInt(item.quantity) || 0)
                      )}
                    </span>
                  )}
                  {saleItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="btn-remove-item"
                    >
                      ×
                    </button>
                  )}

                  {/* Materiais utilizados neste item */}
                  {item.product && (
                    <div className="item-materials">
                      <div className="materials-header">
                        <button
                          type="button"
                          onClick={() => handleAddMaterialToItem(index)}
                          className="btn-add-material"
                        >
                          + Adicionar Material (Opcional)
                        </button>
                      </div>

                      {(item.materialsUsed || []).map((matItem, matIndex) => {
                        const selectedMaterial = materials.find(
                          (m) => m._id === matItem.material
                        )

                        return (
                          <div key={matIndex} className="material-item-row">
                            <select
                              value={matItem.material || ''}
                              onChange={(e) =>
                                handleMaterialChange(
                                  index,
                                  matIndex,
                                  'material',
                                  e.target.value
                                )
                              }
                            >
                              <option value="">Selecione um material</option>
                              {materials.map((material) => (
                                <option key={material._id} value={material._id}>
                                  {material.name} ({material.category}) - Estoque: {material.quantityInStock} {material.unit}
                                </option>
                              ))}
                            </select>
                            <input
                              type="number"
                              step="0.01"
                              min="0.01"
                              value={matItem.quantity || 1}
                              onChange={(e) =>
                                handleMaterialChange(
                                  index,
                                  matIndex,
                                  'quantity',
                                  e.target.value
                                )
                              }
                              placeholder="Qtd por item"
                              className="material-quantity-input"
                            />
                            {selectedMaterial && (
                              <span className="material-cost">
                                {formatCurrency(
                                  selectedMaterial.costPerUnit *
                                    (parseFloat(matItem.quantity) || 0) *
                                    (parseInt(item.quantity) || 1)
                                )}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveMaterialFromItem(index, matIndex)
                              }
                              className="btn-remove-material"
                            >
                              ×
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="form-group">
            <select name="paymentMethod" id="paymentMethod">
              <option value="dinheiro">Forma de Pagamento: Dinheiro</option>
              <option value="cartao_debito">Cartão de Débito</option>
              <option value="cartao_credito">Cartão de Crédito</option>
              <option value="pix">PIX</option>
              <option value="boleto">Boleto</option>
              <option value="pendente">Pagamento Pendente (Pagar Depois)</option>
            </select>
            <small className="form-help">
              Selecione "Pagamento Pendente" para vendas a prazo
            </small>
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Registrar Venda
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal de Cliente Rápido */}
      <Modal
        isOpen={isQuickClientModalOpen}
        onClose={() => {
          setIsQuickClientModalOpen(false)
          setQuickClientData({ name: '', phone: '', email: '' })
        }}
        title="Criar Cliente Rápido"
      >
        <form onSubmit={handleCreateQuickClient} className="quick-client-form">
          <div className="form-group">
            <input
              type="text"
              value={quickClientData.name}
              onChange={(e) => setQuickClientData({ ...quickClientData, name: e.target.value })}
              placeholder="Nome do Cliente *"
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <input
              type="tel"
              value={quickClientData.phone}
              onChange={(e) => setQuickClientData({ ...quickClientData, phone: e.target.value })}
              placeholder="Telefone (opcional)"
            />
          </div>
          <div className="form-group">
            <input
              type="email"
              value={quickClientData.email}
              onChange={(e) => setQuickClientData({ ...quickClientData, email: e.target.value })}
              placeholder="Email (opcional)"
            />
          </div>
          <div className="form-actions">
            <button 
              type="button" 
              onClick={() => {
                setIsQuickClientModalOpen(false)
                setQuickClientData({ name: '', phone: '', email: '' })
              }}
            >
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Criar e Usar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Sales

import { useState, useEffect, useCallback } from 'react'
import { saleService, productService, materialService } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { formatCurrency, formatDate } from '../../utils/format'
import { FaMoneyBillWave, FaClock, FaBox, FaChartLine, FaArrowUp, FaArrowDown, FaSync, FaHandPaper } from 'react-icons/fa'
import './Dashboard.css'

function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    totalProfit: 0,
    totalProducts: 0,
    pendingSales: 0,
    pendingAmount: 0,
    totalMaterials: 0,
    materialsStockValue: 0,
    totalWithdrawalsValue: 0,
    lowStockMaterials: 0,
  })
  const [recentSales, setRecentSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [dateFilter, setDateFilter] = useState('all') // all, today, week, month, custom
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')

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
      return { startDate: startDate.toISOString(), endDate: endDate.toISOString() }
    }
    return {}
  }

  const fetchDashboardData = useCallback(async () => {
    try {
      setRefreshing(true)
      const dateRange = getDateRange()
      const [salesRes, productsRes, materialsRes] = await Promise.all([
        saleService.getAll({ limit: 1000, ...dateRange }),
        productService.getAll({ limit: 1 }),
        materialService.getStats().catch(() => ({ data: { data: {} } })),
      ])

      const sales = salesRes.data.data.sales || []
      const totalRevenue = sales.filter(s => s.paymentStatus === 'pago').reduce((sum, sale) => sum + sale.totalAmount, 0)
      const totalProfit = sales.filter(s => s.paymentStatus === 'pago').reduce((sum, sale) => sum + sale.netProfit, 0)
      const totalProducts = productsRes.data.data.pagination?.total || 0
      const pendingSales = sales.filter(s => s.paymentStatus === 'pendente')
      const pendingAmount = pendingSales.reduce((sum, sale) => sum + sale.totalAmount, 0)

      const materialsStats = materialsRes.data.data || {}
      const totalMaterials = materialsStats.totalMaterials || 0
      const materialsStockValue = materialsStats.totalStockValue || 0
      const totalWithdrawalsValue = materialsStats.totalWithdrawalsValue || 0
      const lowStockMaterials = materialsStats.lowStockCount || 0

      setStats({
        totalSales: salesRes.data.data.pagination?.total || 0,
        totalRevenue,
        totalProfit,
        totalProducts,
        pendingSales: pendingSales.length,
        pendingAmount,
        totalMaterials,
        materialsStockValue,
        totalWithdrawalsValue,
        lowStockMaterials,
      })

      setRecentSales(sales.slice(0, 5))
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [dateFilter, customStartDate, customEndDate])

  useEffect(() => {
    fetchDashboardData()
    
    // Atualizar automaticamente a cada 30 segundos
    const interval = setInterval(() => {
      fetchDashboardData()
    }, 30000)

    return () => clearInterval(interval)
  }, [fetchDashboardData, dateFilter, customStartDate, customEndDate])

  const handleRefresh = () => {
    fetchDashboardData()
  }

  if (loading) {
    return <div className="loading">Carregando dashboard...</div>
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Bem-vindo de volta, {user?.name?.split(' ')[0] || 'Usuário'}!</h1>
          <p className="dashboard-welcome">Aqui está um resumo do seu negócio</p>
        </div>
        <div className="dashboard-header-actions">
          <div className="dashboard-filters">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">Todas as Vendas</option>
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
          </div>
          <button
            className="btn-refresh"
            onClick={handleRefresh}
            disabled={refreshing}
            title="Atualizar dados"
          >
            <FaSync className={refreshing ? 'spinning' : ''} />
            {refreshing ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>
      </div>

      {/* Grid de Cards de Estatísticas */}
      <div className="stats-grid">
        <div className="stat-card card-saldo">
          <div className="stat-card-header">
            <div className="stat-card-icon"><FaMoneyBillWave /></div>
            <h3 className="stat-card-title">Saldo Total</h3>
          </div>
          <p className="stat-card-value">{formatCurrency(stats.totalRevenue)}</p>
          <div className="stat-card-actions">
            <button className="btn-card btn-transfer">
              <FaSync /> Transferir
            </button>
            <button className="btn-card btn-request">
              <FaHandPaper /> Solicitar
            </button>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon"><FaChartLine /></div>
            <h3 className="stat-card-title">Receita Total</h3>
          </div>
          <p className="stat-card-value">{formatCurrency(stats.totalRevenue)}</p>
          <div className="stat-card-footer">
            <span className="stat-card-change positive">
              <FaArrowUp /> +12.1% esta semana
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon"><FaMoneyBillWave /></div>
            <h3 className="stat-card-title">Lucro Líquido</h3>
          </div>
          <p className="stat-card-value">{formatCurrency(stats.totalProfit)}</p>
          <div className="stat-card-footer">
            <span className="stat-card-change positive">
              <FaArrowUp /> Lucro após despesas
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon stat-card-icon-rotate"><FaChartLine /></div>
            <h3 className="stat-card-title">Valor em Estoque</h3>
          </div>
          <p className="stat-card-value">{formatCurrency(stats.materialsStockValue)}</p>
          <div className="stat-card-footer">
            <span className="stat-card-subtext">
              {stats.totalWithdrawalsValue > 0 && (
                <>Retirado: {formatCurrency(stats.totalWithdrawalsValue)}</>
              )}
              {stats.totalWithdrawalsValue === 0 && (
                <>Valor atual do estoque</>
              )}
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon"><FaClock /></div>
            <h3 className="stat-card-title">Vendas Pendentes</h3>
          </div>
          <p className="stat-card-value">{stats.pendingSales}</p>
          <div className="stat-card-footer">
            <span className="stat-card-subtext">
              {formatCurrency(stats.pendingAmount)} a receber
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon"><FaBox /></div>
            <h3 className="stat-card-title">Produtos Cadastrados</h3>
          </div>
          <p className="stat-card-value">{stats.totalProducts}</p>
        </div>
      </div>

      {/* Histórico de Transações */}
      <div className="dashboard-section">
        <div className="dashboard-section-header">
          <h2>Histórico de Transações</h2>
          <select className="filter-select">
            <option>Filtrar</option>
            <option>Todas</option>
            <option>Hoje</option>
            <option>Esta semana</option>
          </select>
        </div>

        {recentSales.length > 0 ? (
          <>
            {/* Desktop Table */}
            <div className="transactions-table-wrapper">
              <table className="transactions-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Tipo</th>
                    <th>Data</th>
                    <th>Valor</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSales.map((sale) => (
                    <tr key={sale._id}>
                      <td>
                        <div className="transaction-item">
                          <div className="transaction-icon"><FaMoneyBillWave /></div>
                          <div className="transaction-info">
                            <div className="transaction-name">
                              {sale.client?.name || 'Venda sem cliente'}
                            </div>
                            <div className="transaction-desc">Venda de produtos</div>
                          </div>
                        </div>
                      </td>
                      <td>{sale.paymentMethod || 'N/A'}</td>
                      <td>{formatDate(sale.saleDate)}</td>
                      <td className="transaction-value">{formatCurrency(sale.totalAmount)}</td>
                      <td>
                        <span className={`status-badge status-${sale.paymentStatus || 'pendente'}`}>
                          {sale.paymentStatus === 'pago' ? 'Concluído' : 'Pendente'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="transactions-cards-container">
              {recentSales.map((sale) => (
                <div key={sale._id} className="transaction-card">
                  <div className="transaction-card-header">
                    <div className="transaction-card-icon"><FaMoneyBillWave /></div>
                    <div className="transaction-card-info">
                      <h3 className="transaction-card-name">
                        {sale.client?.name || 'Venda sem cliente'}
                      </h3>
                      <span className={`transaction-card-status status-${sale.paymentStatus || 'pendente'}`}>
                        {sale.paymentStatus === 'pago' ? 'Concluído' : 'Pendente'}
                      </span>
                    </div>
                  </div>
                  <div className="transaction-card-body">
                    <div className="transaction-card-item">
                      <span className="transaction-card-label">Tipo:</span>
                      <span className="transaction-card-value">{sale.paymentMethod || 'N/A'}</span>
                    </div>
                    <div className="transaction-card-item">
                      <span className="transaction-card-label">Data:</span>
                      <span className="transaction-card-value">{formatDate(sale.saleDate)}</span>
                    </div>
                    <div className="transaction-card-item">
                      <span className="transaction-card-label">Valor:</span>
                      <span className="transaction-card-value transaction-card-amount">
                        {formatCurrency(sale.totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="no-transactions">Nenhuma transação recente</p>
        )}
      </div>
    </div>
  )
}

export default Dashboard

import { useState } from 'react'
import { saleService } from '../../services/api'
import { formatCurrency, formatDate } from '../../utils/format'
import { showNotification } from '../../utils/notifications'
import './Reports.css'

function Reports() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleGenerateReport = async (e) => {
    e.preventDefault()

    if (!startDate || !endDate) {
      showNotification('Selecione as datas inicial e final', 'error')
      return
    }

    setLoading(true)
    try {
      const response = await saleService.getReport({
        startDate,
        endDate,
      })

      setReport(response.data.data)
      showNotification('Relatório gerado com sucesso!', 'success')
    } catch (error) {
      showNotification(
        error.response?.data?.message || 'Erro ao gerar relatório',
        'error'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="reports-page">
      <h1>Relatórios</h1>

      <div className="report-form-container">
        <form onSubmit={handleGenerateReport} className="report-form">
          <div className="form-group">
            <label>Data Inicial *</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Data Final *</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Gerando...' : 'Gerar Relatório'}
          </button>
        </form>
      </div>

      {report && (
        <div className="report-results">
          <div className="report-period-info">
            <h2>Relatório do Período</h2>
            <p className="period-dates">
              {formatDate(report.period.startDate)} até {formatDate(report.period.endDate)}
            </p>
          </div>
          
          <div className="stats-grid">
            <div className="reports-stat-card">
              <h3>Total de Vendas</h3>
              <p className="reports-stat-value">{report.statistics.totalSales}</p>
            </div>
            <div className="reports-stat-card">
              <h3>Receita Total</h3>
              <p className="reports-stat-value">
                {formatCurrency(report.statistics.totalAmount)}
              </p>
            </div>
            <div className="reports-stat-card">
              <h3>Custo Total</h3>
              <p className="reports-stat-value">
                {formatCurrency(report.statistics.totalCost)}
              </p>
            </div>
            <div className="reports-stat-card">
              <h3>Lucro Bruto</h3>
              <p className="reports-stat-value profit">
                {formatCurrency(report.statistics.totalGrossProfit)}
              </p>
              {report.statistics.totalAmount > 0 && (
                <small className="profit-margin">
                  Margem: {((report.statistics.totalGrossProfit / report.statistics.totalAmount) * 100).toFixed(1)}%
                </small>
              )}
            </div>
            <div className="reports-stat-card">
              <h3>Lucro Líquido</h3>
              <p className="reports-stat-value profit">
                {formatCurrency(report.statistics.totalNetProfit)}
              </p>
              {report.statistics.totalAmount > 0 && (
                <small className="profit-margin">
                  Margem: {((report.statistics.totalNetProfit / report.statistics.totalAmount) * 100).toFixed(1)}%
                </small>
              )}
            </div>
            {report.statistics.totalSales > 0 && (
              <div className="reports-stat-card">
                <h3>Ticket Médio</h3>
                <p className="reports-stat-value">
                  {formatCurrency(report.statistics.totalAmount / report.statistics.totalSales)}
                </p>
              </div>
            )}
          </div>

          <div className="report-sales">
            <h3>Vendas do Período</h3>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Cliente</th>
                    <th>Valor Total</th>
                    <th>Lucro Líquido</th>
                  </tr>
                </thead>
                <tbody>
                  {report.sales.length > 0 ? (
                    report.sales.map((sale) => (
                      <tr key={sale._id}>
                        <td>{formatDate(sale.saleDate)}</td>
                        <td>{sale.client?.name || 'N/A'}</td>
                        <td>{formatCurrency(sale.totalAmount)}</td>
                        <td>{formatCurrency(sale.netProfit)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="empty-state">
                        Nenhuma venda no período
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Reports

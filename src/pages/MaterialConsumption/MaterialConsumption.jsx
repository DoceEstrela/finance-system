import { useState } from 'react'
import { materialPurchaseService } from '../../services/api'
import { formatCurrency, formatDate } from '../../utils/format'
import { showNotification } from '../../utils/notifications'
import './MaterialConsumption.css'

function MaterialConsumption() {
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
      const response = await materialPurchaseService.getConsumptionReport({
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
    <div className="material-consumption-page">
      <h1>Relatório de Consumo de Materiais</h1>
      <p className="page-description">
        Veja quais materiais foram utilizados nas vendas e o custo total por período
      </p>

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
          <h2>Consumo de Materiais no Período</h2>

          <div className="stats-grid">
            <div className="consumption-stat-card">
              <h3>Materiais Diferentes Utilizados</h3>
              <p className="stat-value">{report.statistics.totalMaterialsUsed}</p>
            </div>
            <div className="consumption-stat-card">
              <h3>Custo Total de Materiais</h3>
              <p className="stat-value">
                {formatCurrency(report.statistics.totalCost)}
              </p>
            </div>
          </div>

          <div className="consumption-table">
            <h3>Detalhamento por Material</h3>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Material</th>
                    <th>Categoria</th>
                    <th>Quantidade Consumida</th>
                    <th>Custo Total</th>
                    <th>Vendas Utilizadas</th>
                  </tr>
                </thead>
                <tbody>
                  {report.consumption.length > 0 ? (
                    report.consumption.map((item, index) => (
                      <tr key={index}>
                        <td>
                          <strong>{item.material?.name || 'N/A'}</strong>
                        </td>
                        <td>{item.material?.category || '-'}</td>
                        <td>
                          {item.totalQuantity} {item.material?.unit || ''}
                        </td>
                        <td>
                          <strong>{formatCurrency(item.totalCost)}</strong>
                        </td>
                        <td>{item.salesCount}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="empty-state">
                        Nenhum consumo registrado no período
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

export default MaterialConsumption

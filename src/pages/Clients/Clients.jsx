import { useState, useEffect } from 'react'
import { clientService } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { showNotification } from '../../utils/notifications'
import Modal from '../../components/Modal'
import './Clients.css'

function Clients() {
  const { user } = useAuth()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
    },
  })

  const canEdit = user?.role === 'admin'

  useEffect(() => {
    fetchClients()
  }, [searchTerm])

  const fetchClients = async () => {
    try {
      const response = await clientService.getAll({ search: searchTerm })
      setClients(response.data.data.clients || [])
    } catch (error) {
      showNotification('Erro ao buscar clientes', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingClient) {
        await clientService.update(editingClient._id, formData)
        showNotification('Cliente atualizado com sucesso!', 'success')
      } else {
        await clientService.create(formData)
        showNotification('Cliente criado com sucesso!', 'success')
      }

      setIsModalOpen(false)
      resetForm()
      fetchClients()
    } catch (error) {
      showNotification(
        error.response?.data?.message || 'Erro ao salvar cliente',
        'error'
      )
    }
  }

  const handleEdit = (client) => {
    setEditingClient(client)
    setFormData({
      name: client.name,
      email: client.email,
      phone: client.phone,
      cpf: client.cpf || '',
      address: {
        street: client.address?.street || '',
        city: client.address?.city || '',
        state: client.address?.state || '',
        zipCode: client.address?.zipCode || '',
      },
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este cliente?')) {
      return
    }

    try {
      await clientService.delete(id)
      showNotification('Cliente excluído com sucesso!', 'success')
      fetchClients()
    } catch (error) {
      showNotification('Erro ao excluir cliente', 'error')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      cpf: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
      },
    })
    setEditingClient(null)
  }

  if (loading) {
    return <div className="loading">Carregando clientes...</div>
  }

  return (
    <div className="clients-page">
      <div className="page-header">
        <h1>Clientes</h1>
        {canEdit && (
          <button
            className="btn-primary"
            onClick={() => {
              resetForm()
              setIsModalOpen(true)
            }}
          >
            + Novo Cliente
          </button>
        )}
      </div>

      <div className="clients-search-bar">
        <input
          type="text"
          placeholder="Buscar clientes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Desktop Table */}
      <div className="clients-table-container">
        <table className="clients-data-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Telefone</th>
              <th>Cidade</th>
              {canEdit && <th>Ações</th>}
            </tr>
          </thead>
          <tbody>
            {clients.length > 0 ? (
              clients.map((client) => (
                <tr key={client._id}>
                  <td>
                    <strong>{client.name}</strong>
                  </td>
                  <td>{client.email}</td>
                  <td>{client.phone}</td>
                  <td>{client.address?.city || '-'}</td>
                  {canEdit && (
                    <td>
                      <button
                        className="clients-btn-edit"
                        onClick={() => handleEdit(client)}
                      >
                        Editar
                      </button>
                      <button
                        className="clients-btn-delete"
                        onClick={() => handleDelete(client._id)}
                      >
                        Excluir
                      </button>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={canEdit ? 5 : 4}
                  className="empty-state"
                >
                  Nenhum cliente encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="clients-cards-container">
        {clients.length > 0 ? (
          clients.map((client) => (
            <div key={client._id} className="clients-card">
              <div className="clients-card-header">
                <h3 className="clients-card-name">{client.name}</h3>
              </div>
              <div className="clients-card-body">
                <div className="clients-card-item">
                  <span className="clients-card-label">Email:</span>
                  <span className="clients-card-value">{client.email}</span>
                </div>
                <div className="clients-card-item">
                  <span className="clients-card-label">Telefone:</span>
                  <span className="clients-card-value">{client.phone}</span>
                </div>
                <div className="clients-card-item">
                  <span className="clients-card-label">Cidade:</span>
                  <span className="clients-card-value">{client.address?.city || '-'}</span>
                </div>
              </div>
              {canEdit && (
                <div className="clients-card-actions">
                  <button
                    className="clients-btn-edit"
                    onClick={() => handleEdit(client)}
                  >
                    Editar
                  </button>
                  <button
                    className="clients-btn-delete"
                    onClick={() => handleDelete(client._id)}
                  >
                    Excluir
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="clients-empty-state">
            Nenhum cliente encontrado
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          resetForm()
        }}
        title={editingClient ? 'Editar Cliente' : 'Novo Cliente'}
      >
        <form onSubmit={handleSubmit} className="client-form">
          <div className="form-group">
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
          <div className="form-row">
            <div className="form-group">
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="Email *"
                required
              />
            </div>
            <div className="form-group">
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="Telefone *"
                required
              />
            </div>
          </div>
          <div className="form-group">
            <input
              type="text"
              value={formData.cpf}
              onChange={(e) =>
                setFormData({ ...formData, cpf: e.target.value })
              }
              placeholder="CPF (opcional)"
            />
          </div>
          <div className="form-group">
            <input
              type="text"
              value={formData.address.street}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  address: { ...formData.address, street: e.target.value },
                })
              }
              placeholder="Rua (opcional)"
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <input
                type="text"
                value={formData.address.city}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, city: e.target.value },
                  })
                }
                placeholder="Cidade (opcional)"
              />
            </div>
            <div className="form-group">
              <input
                type="text"
                value={formData.address.state}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, state: e.target.value },
                  })
                }
                placeholder="Estado (opcional)"
              />
            </div>
          </div>
          <div className="form-group">
            <input
              type="text"
              value={formData.address.zipCode}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  address: { ...formData.address, zipCode: e.target.value },
                })
              }
              placeholder="CEP (opcional)"
            />
          </div>
          <div className="form-actions">
            <button type="button" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              {editingClient ? 'Atualizar' : 'Criar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Clients

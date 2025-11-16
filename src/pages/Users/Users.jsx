import { useState, useEffect } from 'react'
import { authService } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { showNotification } from '../../utils/notifications'
import Modal from '../../components/Modal'
import './Users.css'

function Users() {
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'cliente',
    phone: '',
  })

  useEffect(() => {
    fetchUsers()
  }, [searchTerm, roleFilter])

  const fetchUsers = async () => {
    try {
      const params = {}
      if (searchTerm) params.search = searchTerm
      if (roleFilter) params.role = roleFilter

      const response = await authService.getUsers(params)
      setUsers(response.data.data.users || [])
    } catch (error) {
      showNotification('Erro ao buscar usuários', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.password || formData.password.length < 6) {
      showNotification('Senha deve ter no mínimo 6 caracteres', 'error')
      return
    }

    try {
      await authService.createUser(formData)
      showNotification('Usuário criado com sucesso!', 'success')
      setIsModalOpen(false)
      resetForm()
      fetchUsers()
    } catch (error) {
      showNotification(
        error.response?.data?.message || 'Erro ao criar usuário',
        'error'
      )
    }
  }

  const getRoleBadge = (role) => {
    const badges = {
      admin: { text: 'Admin', class: 'badge-admin' },
      vendedor: { text: 'Vendedor', class: 'badge-vendedor' },
      cliente: { text: 'Cliente', class: 'badge-cliente' },
    }
    const badge = badges[role] || badges.cliente
    return <span className={`role-badge ${badge.class}`}>{badge.text}</span>
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'cliente',
      phone: '',
    })
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="users-page">
        <div className="empty-state">
          <h2>Acesso Negado</h2>
          <p>Apenas administradores podem acessar esta página.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return <div className="loading">Carregando usuários...</div>
  }

  return (
    <div className="users-page">
      <div className="page-header">
        <h1>Usuários</h1>
        <button
          className="btn-primary"
          onClick={() => {
            resetForm()
            setIsModalOpen(true)
          }}
        >
          + Novo Usuário
        </button>
      </div>

      <div className="users-filters-bar">
        <div className="users-search-bar">
          <input
            type="text"
            placeholder="Buscar por nome, email ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="users-filter-select">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">Todos os tipos</option>
            <option value="admin">Admin</option>
            <option value="vendedor">Vendedor</option>
            <option value="cliente">Cliente</option>
          </select>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="users-table-container">
        <table className="users-data-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Telefone</th>
              <th>Tipo</th>
              <th>Data de Criação</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((userItem) => (
                <tr key={userItem._id}>
                  <td>
                    <strong>{userItem.name}</strong>
                  </td>
                  <td>{userItem.email}</td>
                  <td>{userItem.phone || '-'}</td>
                  <td>{getRoleBadge(userItem.role)}</td>
                  <td>
                    {new Date(userItem.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="empty-state">
                  Nenhum usuário encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="users-cards-container">
        {users.length > 0 ? (
          users.map((userItem) => (
            <div key={userItem._id} className="users-card">
              <div className="users-card-header">
                <h3 className="users-card-name">{userItem.name}</h3>
                <div className="users-card-badge">
                  {getRoleBadge(userItem.role)}
                </div>
              </div>
              <div className="users-card-body">
                <div className="users-card-item">
                  <span className="users-card-label">Email:</span>
                  <span className="users-card-value">{userItem.email}</span>
                </div>
                <div className="users-card-item">
                  <span className="users-card-label">Telefone:</span>
                  <span className="users-card-value">{userItem.phone || '-'}</span>
                </div>
                <div className="users-card-item">
                  <span className="users-card-label">Data de Criação:</span>
                  <span className="users-card-value">
                    {new Date(userItem.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="users-empty-state">
            Nenhum usuário encontrado
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          resetForm()
        }}
        title="Novo Usuário"
      >
        <form onSubmit={handleSubmit} className="user-form">
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
          <div className="form-row">
            <div className="form-group">
              <input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="Senha * (mínimo 6 caracteres)"
                required
                minLength={6}
              />
            </div>
            <div className="form-group">
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
                required
              >
                <option value="">Tipo *</option>
                <option value="cliente">Cliente</option>
                <option value="vendedor">Vendedor</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              placeholder="Telefone (opcional)"
            />
          </div>
          <div className="form-actions">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false)
                resetForm()
              }}
            >
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Criar Usuário
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Users


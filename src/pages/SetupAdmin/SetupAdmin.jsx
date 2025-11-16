import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authService } from '../../services/api'
import { showNotification } from '../../utils/notifications'
import { useAuth } from '../../context/AuthContext'
import './SetupAdmin.css'

function SetupAdmin() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      showNotification('As senhas não coincidem', 'error')
      return
    }

    if (formData.password.length < 6) {
      showNotification('A senha deve ter no mínimo 6 caracteres', 'error')
      return
    }

    setLoading(true)

    try {
      const response = await authService.createFirstAdmin({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
      })

      if (response.data.success) {
        showNotification(response.data.message || 'Administrador criado com sucesso!', 'success')

        // Se precisar verificar email, não fazer login automático
        if (response.data.requiresVerification || !response.data.data.user?.emailVerified) {
          // Se houver link de verificação no modo dev, mostrar
          if (response.data.data?.verificationUrl) {
            console.log('📧 Link de verificação:', response.data.data.verificationUrl)
            showNotification('Verifique o console para o link de verificação (modo desenvolvimento)', 'info')
          }
          // Redirecionar para login após 2 segundos
          setTimeout(() => {
            navigate('/login')
          }, 2000)
        } else {
          // Se email já estiver verificado, fazer login automático
          const token = response.data.data.token
          if (token) {
            localStorage.setItem('token', token)
            await login(formData.email, formData.password)
          }

          // Redirecionar após um pequeno delay
          setTimeout(() => {
            navigate('/dashboard')
          }, 1000)
        }
      }
    } catch (error) {
      showNotification(
        error.response?.data?.message || 'Erro ao criar administrador',
        'error'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card-login">
        <form onSubmit={handleSubmit}>
          <div className="auth-form-group">
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Nome completo"
            />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="admin@sistema.com"
            />
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="(00) 00000-0000"
            />
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              placeholder="Senha (mínimo 6 caracteres)"
            />
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              minLength={6}
              placeholder="Confirme sua senha"
            />
            <button type="submit" className="auth-btn-signin" disabled={loading}>
              {loading ? 'Criando...' : 'CRIAR ADMINISTRADOR'}
            </button>
          </div>

          <div className="auth-form-options">
            <div>
              <div className="auth-form-links-login">
                <Link to="/login" className="auth-recover">
                  Voltar para Login
                </Link>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SetupAdmin


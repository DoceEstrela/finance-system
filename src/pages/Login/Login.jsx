import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { authService } from '../../services/api'
import { showNotification } from '../../utils/notifications'
import './Login.css'

function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [resendingEmail, setResendingEmail] = useState(false)
  const [requiresVerification, setRequiresVerification] = useState(false)
  const [unverifiedEmail, setUnverifiedEmail] = useState('')
  const { login } = useAuth()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setRequiresVerification(false)

    try {
      const result = await login(formData.email, formData.password)

      if (result.success) {
        showNotification('Login realizado com sucesso!', 'success')
        window.location.href = '/dashboard'
      } else {
        showNotification(result.message, 'error')
      }
    } catch (error) {
      // Verificar se precisa verificar email
      if (error.response?.status === 403 && error.response?.data?.requiresVerification) {
        setRequiresVerification(true)
        setUnverifiedEmail(error.response.data.email || formData.email)
        showNotification(error.response.data.message, 'error')
      } else {
        showNotification(
          error.response?.data?.message || 'Erro ao fazer login',
          'error'
        )
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResendVerification = async () => {
    setResendingEmail(true)
    try {
      const result = await authService.resendVerificationEmail(unverifiedEmail)
      if (result.data.success) {
        showNotification(result.data.message, 'success')
        if (result.data.verificationUrl) {
          console.log('Link de verificação:', result.data.verificationUrl)
        }
      } else {
        showNotification(result.data.message, 'error')
      }
    } catch (error) {
      showNotification(
        error.response?.data?.message || 'Erro ao reenviar email',
        'error'
      )
    } finally {
      setResendingEmail(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card-login">
        <form onSubmit={handleSubmit}>
          <div className="auth-form-group">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
            />
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
            />
          </div>

          <div className="auth-form-options">
            <div>
              <div className="auth-form-checkbox-login">
                <input type="checkbox" id="remember" />
                <label htmlFor="remember">Lembrar-me</label>
              </div>

              <button type="submit" className="auth-btn-signin" disabled={loading}>
                {loading ? 'Entrando...' : 'SIGN IN'}
              </button>
              <div className="auth-form-links-login">
                <Link to="/forgot-password" className="auth-recover">
                  Esqueceu a senha?
                </Link>
                <Link to="/register" className="auth-recover">
                  Registrar-se
                </Link>
                <Link to="/setup-admin" className="auth-recover auth-form-link-login">
                  Primeiro acesso? Criar Administrador
                </Link>
              </div>
            </div>
          </div>

          {requiresVerification && (
            <div className="verification-warning">
              <p>
                Seu email ainda não foi verificado
              </p>
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resendingEmail}
              >
                {resendingEmail ? 'Enviando...' : 'Reenviar Email de Verificação'}
              </button>
            </div>
          )}

        </form>
      </div>
    </div>
  )
}

export default Login

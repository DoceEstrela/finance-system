import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { showNotification } from '../../utils/notifications'
import './Register.css'

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  })
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      showNotification('As senhas não coincidem', 'error')
      return
    }

    setLoading(true)

    const result = await register({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      phone: formData.phone,
    })

    if (result.success) {
      showNotification(result.message || 'Registro realizado com sucesso!', 'success')

      // Se precisar verificar email, não redirecionar para dashboard
      if (result.data?.requiresVerification || !result.data?.user?.emailVerified) {
        // Se houver link de verificação no modo dev, mostrar
        if (result.data?.verificationUrl) {
          console.log('📧 Link de verificação:', result.data.verificationUrl)
          showNotification('Verifique o console para o link de verificação (modo desenvolvimento)', 'info')
        }
        // Redirecionar para página de informação sobre verificação
        setTimeout(() => {
          window.location.href = '/login'
        }, 2000)
      } else {
        // Se email já estiver verificado (improvável no registro normal)
        window.location.href = '/dashboard'
      }
    } else {
      showNotification(result.message, 'error')
    }

    setLoading(false)
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
              placeholder="Seu nome completo"
            />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="seu@email.com"
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
              placeholder="••••••••"
            />
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Confirme sua senha"
            />
            <button type="submit" className="auth-btn-signin" disabled={loading}>
              {loading ? 'Registrando...' : 'REGISTRAR'}
            </button>
          </div>

          <div className="auth-form-options">
            <div className="auth-form-links-login">
              <Link to="/login" className="auth-recover">
                Já tem conta? Fazer login
              </Link>
              <Link to="/forgot-password" className="auth-recover">
                Esqueceu a senha?
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Register

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { showNotification } from '../../utils/notifications';
import './ResetPassword.css';

function ResetPassword() {
  const { resetToken } = useParams();
  const navigate = useNavigate();
  const { checkAuth } = useAuth();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Verificar se o token foi fornecido
    if (!resetToken) {
      showNotification('Token inválido', 'error');
      navigate('/forgot-password');
    }
  }, [resetToken, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      showNotification('As senhas não coincidem', 'error');
      return;
    }

    if (formData.password.length < 6) {
      showNotification('Senha deve ter no mínimo 6 caracteres', 'error');
      return;
    }

    setLoading(true);

    try {
      const result = await authService.resetPassword(resetToken, formData.password);

      if (result.data.success) {
        showNotification(result.data.message, 'success');
        // Atualizar contexto de autenticação
        await checkAuth();
        // Redirecionar para dashboard
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 1000);
      } else {
        showNotification(result.data.message, 'error');
      }
    } catch (error) {
      showNotification(
        error.response?.data?.message || 'Erro ao redefinir senha',
        'error'
      );

      // Se o token for inválido ou expirado, redirecionar para forgot-password
      if (error.response?.status === 400) {
        setTimeout(() => {
          navigate('/forgot-password', { replace: true });
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card-login">
        <form onSubmit={handleSubmit}>
          <div className="auth-form-group">
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              placeholder="Nova senha (mínimo 6 caracteres)"
              disabled={loading}
            />
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              minLength={6}
              placeholder="Confirme sua senha"
              disabled={loading}
            />
            <button type="submit" className="auth-btn-signin" disabled={loading}>
              {loading ? 'Redefinindo...' : 'REDEFINIR SENHA'}
            </button>
          </div>

          <div className="auth-form-options">
              <div className="auth-form-links-login">
                <Link to="/login" className="auth-recover">
                  Voltar para login
                </Link>
              </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;


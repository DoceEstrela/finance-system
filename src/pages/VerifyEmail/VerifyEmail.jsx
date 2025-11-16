import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { showNotification } from '../../utils/notifications';
import { FaClock, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import './VerifyEmail.css';

function VerifyEmail() {
  const { verificationToken } = useParams();
  const navigate = useNavigate();
  const { checkAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!verificationToken) {
      setError('Token inválido');
      setLoading(false);
      return;
    }

    verifyEmail();
  }, [verificationToken]);

  const verifyEmail = async () => {
    try {
      const result = await authService.verifyEmail(verificationToken);

      if (result.data.success) {
        setSuccess(true);
        showNotification(result.data.message, 'success');
        // Atualizar contexto de autenticação
        await checkAuth();
        // Redirecionar para dashboard após 2 segundos
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 2000);
      } else {
        setError(result.data.message);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Erro ao verificar email');
      showNotification(
        error.response?.data?.message || 'Erro ao verificar email',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card-login">
        {loading ? (
          <div className="auth-message-container">
            <FaClock className="auth-message-icon" />
            <h2 className="auth-message-title">
              Verificando email...
            </h2>
            <p className="auth-message-text-no-margin">
              Aguarde enquanto verificamos seu email.
            </p>
          </div>
        ) : success ? (
          <div className="auth-message-container">
            <FaCheckCircle className="auth-message-icon" />
            <h2 className="auth-message-title">
              Email verificado!
            </h2>
            <p className="auth-message-text">
              Seu email foi verificado com sucesso. Você será redirecionado para o dashboard.
            </p>
          </div>
        ) : (
          <div className="auth-message-container">
            <FaTimesCircle className="auth-message-icon" />
            <h2 className="auth-message-title">
              Verificação falhou
            </h2>
            <p className="auth-message-text">
              {error || 'Token inválido ou expirado.'}
            </p>
            <div className="auth-form-links-login">
              <Link to="/login" className="auth-recover">
                Ir para Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default VerifyEmail;


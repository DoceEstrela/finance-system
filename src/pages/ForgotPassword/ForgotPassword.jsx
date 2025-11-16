import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/api';
import { showNotification } from '../../utils/notifications';
import { FaEnvelope, FaExclamationTriangle } from 'react-icons/fa';
import './ForgotPassword.css';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await authService.forgotPassword(email);

      if (result.data.success) {
        showNotification(result.data.message, 'success');
        setSent(true);
      } else {
        showNotification(result.data.message, 'error');
      }
    } catch (error) {
      showNotification(
        error.response?.data?.message || 'Erro ao enviar email de reset',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card-login">
        {!sent ? (
          <form onSubmit={handleSubmit}>
            <div className="auth-form-group">
              <input
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
                disabled={loading}
              />
              <button type="submit" className="auth-btn-signin" disabled={loading}>
                {loading ? 'Enviando...' : 'ENVIAR LINK'}
              </button>
            </div>

            <div className="auth-form-options">
              <div>
                <div className="auth-form-links-login">
                  <Link to="/login" className="auth-recover">
                    Voltar para login
                  </Link>
                </div>
              </div>
            </div>
          </form>
        ) : (
          <div className="auth-message-container">
            <FaEnvelope className="auth-message-icon" />
            <h2 className="auth-message-title">
              Email enviado!
            </h2>
            <p className="auth-message-text">
              Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
            </p>
            <p className="auth-message-text-small">
              <FaExclamationTriangle className="auth-message-icon-inline" /> O link expira em 10 minutos
            </p>
            <div className="auth-form-links-login">
              <Link to="/login" className="auth-recover">
                Voltar para login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;


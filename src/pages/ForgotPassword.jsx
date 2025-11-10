import { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { Link } from 'react-router-dom';
import './ForgotPassword.css';
import logoPreta from '../assets/Logo-preta.png';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Email de recuperação enviado! Verifique sua caixa de entrada.');
      setEmail('');
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      if (error.code === 'auth/user-not-found') {
        setError('Usuário não encontrado');
      } else if (error.code === 'auth/invalid-email') {
        setError('Email inválido');
      } else {
        setError('Erro ao enviar email. Tente novamente');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-container">
        <div className="forgot-password-header">
          <img src={logoPreta} alt="TP3 Logo" className="forgot-password-logo-img" />
          <h1>Recuperar Senha</h1>
          <p>Digite seu email para receber as instruções</p>
        </div>

        <form onSubmit={handleSubmit} className="forgot-password-form">
          {error && <div className="error-message">{error}</div>}
          {message && <div className="success-message">{message}</div>}
          
          <div className="form-group">
            <label htmlFor="email">
              <i className="bi bi-envelope"></i> Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              autoFocus
            />
          </div>

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? (
              <>
                <i className="bi bi-hourglass-split"></i> Enviando...
              </>
            ) : (
              <>
                <i className="bi bi-send"></i> Enviar Email de Recuperação
              </>
            )}
          </button>

          <div className="form-footer">
            <Link to="/login" className="back-link">
              <i className="bi bi-arrow-left"></i> Voltar para o login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ForgotPassword;


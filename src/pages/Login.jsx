import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { Link } from 'react-router-dom';
import './Login.css';
import logoPreta from '../assets/Logo-preta.png';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      if (error.code === 'auth/invalid-credential') {
        setError('Email ou senha incorretos');
      } else if (error.code === 'auth/user-not-found') {
        setError('Usuário não encontrado');
      } else if (error.code === 'auth/wrong-password') {
        setError('Senha incorreta');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Muitas tentativas. Tente novamente mais tarde');
      } else {
        setError('Erro ao fazer login. Tente novamente');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <img src={logoPreta} alt="TP3 Logo" className="login-logo-img" />
          <h1>Intranet TP3</h1>
          <p>Painel Administrativo</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}
          
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

          <div className="form-group">
            <label htmlFor="password">
              <i className="bi bi-lock"></i> Senha
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? (
              <>
                <i className="bi bi-hourglass-split"></i> Entrando...
              </>
            ) : (
              <>
                <i className="bi bi-box-arrow-in-right"></i> Entrar
              </>
            )}
          </button>

          <div className="login-footer">
            <Link to="/forgot-password" className="forgot-link">
              <i className="bi bi-key"></i> Esqueci minha senha
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;


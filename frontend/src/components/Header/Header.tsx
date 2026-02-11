import { useAuth } from '../../contexts/AuthContext';
import './Header.css';
import { Link } from 'react-router-dom';

interface HeaderProps {
  onAuthClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onAuthClick }) => {
  const { user, logout } = useAuth();

  const handleAuthClick = () => {
    if (onAuthClick) {
      onAuthClick();
    }
  };

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-left">
          <h1 className="header-title">AI Validator</h1>
          <p className="header-subtitle">Проверка документов с искусственным интеллектом</p>
        </div>

        <div className="header-right">
          {user && (
            <Link to="/history" className="header-link">
              Профиль
            </Link>
          )}

          {user ? (
            <button onClick={logout} className="header-logout-btn">
              Выйти
            </button>
          ) : (
            <button onClick={handleAuthClick} className="header-login-btn">
              Войти / Регистрация
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
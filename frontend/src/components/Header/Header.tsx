import { useAuth } from '../../contexts/AuthContext';
import './Header.css';
import { Link } from 'react-router-dom';

interface HeaderProps {
  onAuthClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onAuthClick }) => {
  const { user, logout, isAdmin, isModerator } = useAuth();

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
            <>
              {/* Админ видит управление пользователями */}
              {isAdmin && (
                <Link to="/admin/users" className="header-link admin-link">
                  Управление
                </Link>
              )}
              
              {/* Модератор видит бейдж */}
              {isModerator && !isAdmin && (
                <span className="moderator-badge">
                  Модератор
                </span>
              )}
              
              {/* Ссылка на профиль/историю */}
              <Link to="/history" className="header-link">
                Профиль
              </Link>
            </>
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
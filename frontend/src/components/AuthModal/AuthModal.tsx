import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import type { UserLogin, UserCreate } from '../../types';
import './AuthModal.css';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register, loading } = useAuth();
  const { showNotification } = useNotification(); // ← ОСТАВЛЯЕМ
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLogin) {
        const credentials: UserLogin = {
          email: formData.email,
          password: formData.password
        };
        await login(credentials);
        showNotification({
          message: 'Вы успешно вошли в систему!',
          type: 'success',
          duration: 3000
        });
      } else {
        const userData: UserCreate = {
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name
        };
        await register(userData);
        showNotification({
          message: 'Регистрация прошла успешно!',
          type: 'success',
          duration: 3000
        });
      }
      onClose();
      setFormData({ email: '', password: '', full_name: '' });
    } catch (error: any) {
      let userMessage = 'Произошла ошибка';
      
      if (error.message.includes('Invalid credentials')) {
        userMessage = 'Неверный email или пароль';
      } else if (error.message.includes('Email already registered')) {
        userMessage = 'Этот email уже зарегистрирован';
      } else if (error.message.includes('Password too long')) {
        userMessage = 'Пароль слишком длинный';
      } else if (error.message.includes('Login failed')) {
        userMessage = 'Ошибка входа. Проверьте данные';
      } else if (error.message.includes('Registration failed')) {
        userMessage = 'Ошибка регистрации';
      }
      
      showNotification({
        message: userMessage,
        type: 'error',
        duration: 5000
      });
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setFormData({ email: '', password: '', full_name: '' });
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal-content" onClick={e => e.stopPropagation()}>
        <div className="auth-modal-header">
          <h2 className="auth-modal-title">
            {isLogin ? 'Вход в систему' : 'Регистрация'}
          </h2>
          <button className="auth-close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="auth-form-group">
              <label className="auth-form-label">Имя</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => handleChange('full_name', e.target.value)}
                placeholder="Введите ваше имя"
                required={!isLogin}
                className="auth-form-input"
              />
            </div>
          )}

          <div className="auth-form-group">
            <label className="auth-form-label">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="your@email.com"
              required
              className="auth-form-input"
            />
          </div>

          <div className="auth-form-group">
            <label className="auth-form-label">Пароль</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              placeholder="Введите пароль"
              required
              className="auth-form-input"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="auth-submit-btn"
          >
            {loading ? (
              <span className="auth-loading-text">
                <div className="auth-spinner" />
                {isLogin ? 'Вход...' : 'Регистрация...'}
              </span>
            ) : (
              isLogin ? 'Войти' : 'Зарегистрироваться'
            )}
          </button>
        </form>

        <div className="auth-modal-footer">
          <p>
            {isLogin ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}
            <button
              onClick={switchMode}
              className="auth-switch-btn"
            >
              {isLogin ? 'Зарегистрироваться' : 'Войти'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
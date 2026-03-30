import React, { useState } from "react";
import { Card } from "../UI/Card";
import { useAuth } from "../../contexts/AuthContext";
import { apiService } from "../../services/api";
import "./AccountCard.css";

export const AccountCard: React.FC = () => {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.full_name || "",
    email: user?.email || ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!user) return null;

  const handleSave = async () => {
    try {
      setLoading(true);
      setError("");
      await apiService.updateProfile(formData);
      
      const updatedUser = { ...user, ...formData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      setIsEditing(false);
      window.location.reload();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Ошибка при сохранении");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Вы уверены, что хотите удалить аккаунт? Все данные будут потеряны!")) return;
    
    try {
      setLoading(true);
      await apiService.deleteAccount();
      await logout();
      window.location.href = "/";
    } catch (err) {
      alert("Ошибка при удалении аккаунта");
    }
  };

  return (
    <Card title="Аккаунт">
      <div className="account-card">
        {isEditing ? (
          <>
            <div className="account-row">
              <span className="label">Имя</span>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="edit-input"
                placeholder="Введите имя"
              />
            </div>

            <div className="account-row">
              <span className="label">Email</span>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="edit-input"
                placeholder="Введите email"
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="account-actions">
              <button 
                onClick={handleSave} 
                className="save-btn"
                disabled={loading}
              >
                {loading ? "Сохранение..." : "Сохранить"}
              </button>
              <button 
                onClick={() => setIsEditing(false)} 
                className="cancel-btn"
                disabled={loading}
              >
                Отмена
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="account-row">
              <span className="label">Имя</span>
              <span className="value">{user.full_name || "Без имени"}</span>
            </div>

            <div className="account-row">
              <span className="label">Email</span>
              <span className="value">{user.email}</span>
            </div>

            <div className="account-row">
              <span className="label">Роль</span>
              <span className="value role-badge-small">
                {user.role === 'admin' && 'Администратор'}
                {user.role === 'moderator' && 'Модератор'}
                {user.role === 'user' && 'Пользователь'}
              </span>
            </div>

            <div className="account-status">
              Авторизован
            </div>

            <div className="account-actions">
              <button onClick={() => setIsEditing(true)} className="edit-btn">
                Редактировать
              </button>
              <button onClick={handleDelete} className="delete-account-btn">
                Удалить аккаунт
              </button>
            </div>
          </>
        )}
      </div>
    </Card>
  );
};
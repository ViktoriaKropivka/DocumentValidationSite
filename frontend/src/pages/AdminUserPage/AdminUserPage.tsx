import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/UI/Card';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import type { User } from '../../types';
import './AdminUserPage.css';

type UserRole = 'user' | 'admin' | 'moderator';

const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);
  const [updatingBlockId, setUpdatingBlockId] = useState<number | null>(null);
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAllUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('Ошибка загрузки пользователей:', error);
    } finally {
      setLoading(false);
    }
  };

    const handleRoleChange = async (userId: number, newRole: string) => {
    try {
        setUpdatingUserId(userId);
        await apiService.changeUserRole(userId, newRole);
        
        setUsers((prevUsers: User[]) => 
        prevUsers.map((user: User) => 
            user.id === userId 
            ? { ...user, role: newRole as 'user' | 'admin' | 'moderator' } 
            : user
        )
        );
    } catch (error) {
        console.error('Ошибка изменения роли:', error);
    } finally {
        setUpdatingUserId(null);
    }
    };

    const handleToggleBlock = async (userId: number) => {
    try {
        setUpdatingBlockId(userId);
        await apiService.toggleUserBlock(userId);
        
        setUsers((prevUsers: User[]) => 
        prevUsers.map((user: User) => 
            user.id === userId 
            ? { ...user, is_active: !user.is_active } 
            : user
        )
        );
    } catch (error) {
        console.error('Ошибка блокировки:', error);
    } finally {
        setUpdatingBlockId(null);
    }
    };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin': return 'Админ';
      case 'moderator': return 'Модератор';
      default: return 'Пользователь';
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <button className="back-button" onClick={() => navigate('/')}>
          ← На главную
        </button>
        <h1>Управление пользователями</h1>
      </div>

      <Card title="Все пользователи системы">
        {loading ? (
          <div className="loading-state">Загрузка пользователей...</div>
        ) : (
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Имя</th>
                  <th>Email</th>
                  <th>Роль</th>
                  <th>Статус</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr 
                    key={user.id} 
                    className={!user.is_active ? 'user-blocked' : ''}
                  >
                    <td>{user.id}</td>
                    <td>{user.full_name}</td>
                    <td>{user.email}</td>
                    <td>
                        <div className="role-cell">
                            <span className="role-badge">
                            {getRoleBadge(user.role as UserRole)}
                            </span>
                            {user.id !== currentUser?.id && (
                            <select
                                value={user.role}
                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                disabled={updatingUserId === user.id}
                                className="role-select"
                            >
                                <option value="user">Пользователь</option>
                                <option value="moderator">Модератор</option>
                                <option value="admin">Администратор</option>
                            </select>
                            )}
                        </div>
                        </td>
                    <td>
                      <span className={`status-badge ${user.is_active ? 'active' : 'blocked'}`}>
                        {user.is_active ? 'Активен' : 'Заблокирован'}
                      </span>
                    </td>
                    <td>
                      {user.id !== currentUser?.id ? (
                        <button
                          onClick={() => handleToggleBlock(user.id)}
                          disabled={updatingBlockId === user.id}
                          className={`action-btn ${user.is_active ? 'block-btn' : 'unblock-btn'}`}
                        >
                          {updatingBlockId === user.id ? (
                            <span className="spinner spinner-sm"></span>
                          ) : user.is_active ? (
                            'Блокировать'
                          ) : (
                            'Разблокировать'
                          )}
                        </button>
                      ) : (
                        <span className="current-user-badge">Это вы</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div style={{ marginTop: '24px' }}>
        <Card title="Статистика">
          <div className="info-content">
            <div className="stat-item">
              <span className="stat-label">Всего:</span>
              <span className="stat-value">{users.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Админы:</span>
              <span className="stat-value">{users.filter(u => u.role === 'admin').length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Модераторы:</span>
              <span className="stat-value">{users.filter(u => u.role === 'moderator').length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Пользователи:</span>
              <span className="stat-value">{users.filter(u => u.role === 'user').length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Заблокированы:</span>
              <span className="stat-value">{users.filter(u => !u.is_active).length}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminUsersPage;
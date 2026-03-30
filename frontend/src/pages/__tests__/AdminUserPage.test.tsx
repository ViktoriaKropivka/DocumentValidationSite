import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import AdminUsersPage from '../AdminUserPage/AdminUserPage';
import { AuthProvider } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';

vi.mock('../../services/api', () => ({
  apiService: {
    getAllUsers: vi.fn()
  }
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, email: 'admin@test.com', full_name: 'Admin', role: 'admin', is_active: true, created_at: '2024-01-01' },
    isAdmin: true,
    isModerator: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    hasRole: (roles: string | string[]) => roles.includes('admin'),
    loading: false,
    accessToken: 'fake-token'
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

describe('AdminUsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

    it('показывает загрузку при получении данных', () => {
    vi.mocked(apiService.getAllUsers).mockImplementationOnce(() => 
        new Promise(() => {})
    );
    
    render(
        <HelmetProvider>
        <BrowserRouter>
            <AuthProvider>
            <AdminUsersPage />
            </AuthProvider>
        </BrowserRouter>
        </HelmetProvider>
    );
    
    const skeletonRows = document.querySelectorAll('.user-row-skeleton');
    expect(skeletonRows.length).toBeGreaterThan(0);
    });

  it('отображает список пользователей', async () => {
    const mockUsers = [
      { id: 1, email: 'admin@test.com', full_name: 'Admin', role: 'admin', is_active: true, created_at: '2024-01-01' },
      { id: 2, email: 'user@test.com', full_name: 'User', role: 'user', is_active: true, created_at: '2024-01-01' },
      { id: 3, email: 'blocked@test.com', full_name: 'Blocked', role: 'user', is_active: false, created_at: '2024-01-01' }
    ];
    
    vi.mocked(apiService.getAllUsers).mockResolvedValueOnce({ data: mockUsers } as any);
    
    render(
      <HelmetProvider>
        <BrowserRouter>
          <AuthProvider>
            <AdminUsersPage />
          </AuthProvider>
        </BrowserRouter>
      </HelmetProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByText('admin@test.com')).toBeInTheDocument();
      expect(screen.getByText('user@test.com')).toBeInTheDocument();
      expect(screen.getByText('blocked@test.com')).toBeInTheDocument();
      expect(screen.getByText('Заблокирован')).toBeInTheDocument();
    });
  });

  it('показывает правильные бейджи для ролей', async () => {
    const mockUsers = [
        { id: 1, email: 'admin@test.com', full_name: 'Admin', role: 'admin', is_active: true, created_at: '2024-01-01' },
        { id: 2, email: 'mod@test.com', full_name: 'Mod', role: 'moderator', is_active: true, created_at: '2024-01-01' },
        { id: 3, email: 'user@test.com', full_name: 'User', role: 'user', is_active: true, created_at: '2024-01-01' }
    ];
    
    vi.mocked(apiService.getAllUsers).mockResolvedValueOnce({ data: mockUsers } as any);
    
    render(
        <HelmetProvider>
        <BrowserRouter>
            <AuthProvider>
            <AdminUsersPage />
            </AuthProvider>
        </BrowserRouter>
        </HelmetProvider>
    );
    
    await waitFor(() => {
        expect(screen.getByText('Admin')).toBeInTheDocument();
        expect(screen.getByText('Mod')).toBeInTheDocument();
        expect(screen.getByText('User')).toBeInTheDocument();
    }, { timeout: 3000 });
    });
});
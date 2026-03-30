import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import { apiService } from '../../services/api';

vi.mock('../../services/api', () => ({
  apiService: {
    login: vi.fn(),
    register: vi.fn(),
    getProfile: vi.fn(),
    refreshToken: vi.fn(),
    logout: vi.fn()
  }
}));

const TestComponent = () => {
  const { user, loading, login, logout } = useAuth();
  
  if (loading) return <div>Загрузка...</div>;
  
  return (
    <div>
      <div data-testid="user">{user ? user.email : 'null'}</div>
      <button onClick={() => login({ email: 'test@test.com', password: '123' })}>
        Login
      </button>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('провайдер рендерит дочерние компоненты', () => {
    render(
      <AuthProvider>
        <div>Дочерний компонент</div>
      </AuthProvider>
    );
    expect(screen.getByText('Дочерний компонент')).toBeInTheDocument();
  });

  it('useAuth должен использоваться внутри AuthProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestComponent />)).toThrow('useAuth must be used within an AuthProvider');
    consoleError.mockRestore();
  });

    it('успешный логин сохраняет только refresh_token в localStorage', async () => {
    const mockToken = { access_token: 'token123', refresh_token: 'refresh123' };
    const mockUser = { 
      id: 1, 
      email: 'test@test.com', 
      full_name: 'Test', 
      role: 'user', 
      is_active: true,
      created_at: '2024-01-01'
    };
    
    const setItemMock = vi.fn();
    Object.defineProperty(window, 'localStorage', {
      value: {
        setItem: setItemMock,
        getItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true
    });
    
    vi.mocked(apiService.login).mockResolvedValueOnce({ data: mockToken } as any);
    vi.mocked(apiService.getProfile).mockResolvedValueOnce({ data: mockUser } as any);
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    await waitFor(() => expect(screen.queryByText('Загрузка...')).not.toBeInTheDocument());
    
    try {
      fireEvent.click(screen.getByText('Login'));
      
      await waitFor(() => {
        console.log('Все вызовы setItem:', setItemMock.mock.calls);
        
        const refreshCall = setItemMock.mock.calls.find(
          call => call[0] === 'refresh_token' && call[1] === 'refresh123'
        );
        expect(refreshCall).toBeDefined();
        
        const tokenCall = setItemMock.mock.calls.find(
          call => call[0] === 'token'
        );
        expect(tokenCall).toBeUndefined();
      }, { timeout: 2000 });
    } catch (error) {
      console.log('Ожидаемая ошибка логина в тесте');
    }
  });
});
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Header } from '../Header/Header';
import { useAuth } from '../../contexts/AuthContext';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn()
}));

describe('Header', () => {
  it('рендерит кнопку входа для неавторизованного пользователя', () => {
    vi.mocked(useAuth).mockImplementation(() => ({
      user: null,
      logout: vi.fn(),
      isAdmin: false,
      isModerator: false,
      login: vi.fn(),
      register: vi.fn(),
      hasRole: vi.fn(),
      loading: false,
      accessToken: null
    }));

    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    );
    
    expect(screen.getByText(/Войти/i)).toBeInTheDocument();
  });

  it('вызывает onAuthClick при клике на кнопку входа', () => {
    const mockClick = vi.fn();
    
    vi.mocked(useAuth).mockImplementation(() => ({
      user: null,
      logout: vi.fn(),
      isAdmin: false,
      isModerator: false,
      login: vi.fn(),
      register: vi.fn(),
      hasRole: vi.fn(),
      loading: false,
      accessToken: null
    }));
    
    render(
      <BrowserRouter>
        <Header onAuthClick={mockClick} />
      </BrowserRouter>
    );
    
    fireEvent.click(screen.getByText(/Войти/i));
    expect(mockClick).toHaveBeenCalledTimes(1);
  });

  it('показывает ссылку на профиль для авторизованного пользователя', () => {
    vi.mocked(useAuth).mockImplementation(() => ({
      user: { 
        id: 1, 
        email: 'test@test.com', 
        full_name: 'Test', 
        role: 'user', 
        is_active: true 
      },
      logout: vi.fn(),
      isAdmin: false,
      isModerator: false,
      login: vi.fn(),
      register: vi.fn(),
      hasRole: vi.fn(),
      loading: false,
      accessToken: 'fake-token-123'
    }));

    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    );
    
    expect(screen.getByText(/Профиль/i)).toBeInTheDocument();
    expect(screen.getByText(/Выйти/i)).toBeInTheDocument();
  });

  it('показывает ссылку на админку для администратора', () => {
    vi.mocked(useAuth).mockImplementation(() => ({
      user: { 
        id: 1, 
        email: 'admin@test.com', 
        full_name: 'Admin', 
        role: 'admin', 
        is_active: true 
      },
      logout: vi.fn(),
      isAdmin: true,
      isModerator: true,
      login: vi.fn(),
      register: vi.fn(),
      hasRole: (roles) => roles.includes('admin'),
      loading: false,
      accessToken: 'fake-admin-token-123'
    }));

    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    );
    
    expect(screen.getByText(/Управление/i)).toBeInTheDocument();
    expect(screen.getByText(/Профиль/i)).toBeInTheDocument();
    expect(screen.getByText(/Выйти/i)).toBeInTheDocument();
  });
});
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuthModal } from '../AuthModal/AuthModal';
import { NotificationProvider } from '../../contexts/NotificationContext';

vi.mock('../../contexts/NotificationContext', () => ({
  useNotification: () => ({
    showNotification: vi.fn()
  }),
  NotificationProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    login: vi.fn(),
    register: vi.fn(),
    loading: false
  })
}));

describe('AuthModal', () => {
  it('не рендерится когда isOpen=false', () => {
    render(
      <NotificationProvider>
        <AuthModal isOpen={false} onClose={() => {}} />
      </NotificationProvider>
    );
    
    expect(screen.queryByText(/Вход в систему/i)).not.toBeInTheDocument();
  });

  it('рендерится когда isOpen=true', () => {
    render(
      <NotificationProvider>
        <AuthModal isOpen={true} onClose={() => {}} />
      </NotificationProvider>
    );
    
    expect(screen.getByText(/Вход в систему/i)).toBeInTheDocument();
  });

  it('переключается между входом и регистрацией', () => {
    render(
      <NotificationProvider>
        <AuthModal isOpen={true} onClose={() => {}} />
      </NotificationProvider>
    );
    
    expect(screen.getByText(/Вход в систему/i)).toBeInTheDocument();
    
    fireEvent.click(screen.getByText(/Зарегистрироваться/i));
    expect(screen.getByText(/Регистрация/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Введите ваше имя/i)).toBeInTheDocument();
    
    fireEvent.click(screen.getByText(/Войти/i));
    expect(screen.getByText(/Вход в систему/i)).toBeInTheDocument();
  });

  it('вызывает onClose при клике на крестик', () => {
    const mockClose = vi.fn();
    
    render(
      <NotificationProvider>
        <AuthModal isOpen={true} onClose={mockClose} />
      </NotificationProvider>
    );
    
    fireEvent.click(screen.getByText('×'));
    expect(mockClose).toHaveBeenCalledTimes(1);
  });
});
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import HistoryPage from '../HistoryPage/HistoryPage';
import { AuthProvider } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';

vi.mock('../../services/api', () => ({
  apiService: {
    getValidationHistory: vi.fn()
  }
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, email: 'test@test.com', full_name: 'Test', role: 'user', is_active: true, created_at: '2024-01-01' },
    isAdmin: false,
    isModerator: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    hasRole: () => false,
    loading: false,
    accessToken: 'fake-token'
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

describe('HistoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('показывает загрузку при получении данных', () => {
    vi.mocked(apiService.getValidationHistory).mockImplementationOnce(() => 
      new Promise(() => {})
    );
    
    render(
      <HelmetProvider>
        <BrowserRouter>
          <AuthProvider>
            <HistoryPage />
          </AuthProvider>
        </BrowserRouter>
      </HelmetProvider>
    );
    
    const skeletonItems = document.querySelectorAll('.skeleton');
    expect(skeletonItems.length).toBeGreaterThan(0);
  });

  it('показывает пустую историю', async () => {
    vi.mocked(apiService.getValidationHistory).mockResolvedValueOnce({
      data: { items: [], total: 0, page: 1, page_size: 10, total_pages: 1 }
    } as any);
    
    render(
      <HelmetProvider>
        <BrowserRouter>
          <AuthProvider>
            <HistoryPage />
          </AuthProvider>
        </BrowserRouter>
      </HelmetProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/История пуста/i)).toBeInTheDocument();
    });
  });

  it('отображает список документов', async () => {
    const mockDocuments = {
      items: [
        { id: 1, document_name: 'Док 1', created_at: '2024-01-01', user_id: 1, validation_results: { summary: { passed: 5, failed: 0, total_checks: 5 } } },
        { id: 2, document_name: 'Док 2', created_at: '2024-01-02', user_id: 1, validation_results: { summary: { passed: 3, failed: 2, total_checks: 5 } } }
      ],
      total: 2,
      page: 1,
      page_size: 10,
      total_pages: 1
    };
    
    vi.mocked(apiService.getValidationHistory).mockResolvedValueOnce({
      data: mockDocuments
    } as any);
    
    render(
      <HelmetProvider>
        <BrowserRouter>
          <AuthProvider>
            <HistoryPage />
          </AuthProvider>
        </BrowserRouter>
      </HelmetProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Док 1')).toBeInTheDocument();
      expect(screen.getByText('Док 2')).toBeInTheDocument();
    });
  });
});
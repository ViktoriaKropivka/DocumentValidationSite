import React, { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';

import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ProtectedRoute } from './components/ProtectedRoute/ProtectedRoute';

import { Header } from './components/Header/Header';
import { DocumentInput } from './components/DocumentInput/DocumentInput';
import { RuleGenerator } from './components/RuleGenerator/RuleGenerator';
import { ValidationResults } from './components/ValidationResults/ValidationResults';
import { AuthModal } from './components/AuthModal/AuthModal';

import HistoryPage from './pages/HistoryPage/HistoryPage';
import AdminUsersPage from './pages/AdminUserPage/AdminUserPage';

import type { ValidationRule, ValidationResponse } from './types';

import './App.css';
import { apiService } from './services/api';

const MainPage: React.FC = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [documentText, setDocumentText] = useState('');
  const [generatedRules, setGeneratedRules] = useState<ValidationRule[]>([]);
  const [validationResults, setValidationResults] = useState<ValidationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleValidate = async () => {
    if (!generatedRules.length) return;

    setLoading(true);

    try {
      let response;

      if (uploadedFile) {
        response = await apiService.validateFile(uploadedFile, generatedRules);
      } else {
        response = await apiService.validateDocument(documentText, generatedRules);
      }

      setValidationResults(response.data);

    } catch (error) {
      console.error("Ошибка валидации:", error);
    } finally {
      setLoading(false);
    }
  };

  const clearAllData = () => {
    setDocumentText('');
    setGeneratedRules([]);
    setValidationResults(null);
    setUploadedFile(null);
  };

  useEffect(() => {
    const handleLogout = () => {
      clearAllData();
    };
    
    window.addEventListener('app:logout', handleLogout);
    
    return () => {
      window.removeEventListener('app:logout', handleLogout);
    };
  }, []); 

  return (
    <div className="app">
      <Header onAuthClick={() => setIsAuthModalOpen(true)} />

      <div className="app-container">
        <DocumentInput
          documentText={documentText}
          onDocumentTextChange={setDocumentText}
          onFileChange={setUploadedFile}
          onValidate={handleValidate}
          onClear={() => {
            setDocumentText('');
            setUploadedFile(null);
            setValidationResults(null);
          }}
          loading={loading}
          hasRules={generatedRules.length > 0}
        />

        <RuleGenerator
          onRulesGenerated={setGeneratedRules}
          rules={generatedRules}
        />

        <div className="validate-button-container">
          <button
            className={`btn btn-primary ${loading ? 'loading' : ''}`}
            onClick={handleValidate}
            disabled={!documentText.trim() && !uploadedFile || generatedRules.length === 0 || loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Проверка...
              </>
            ) : (
              'Проверить документ'
            )}
          </button>
        </div>

        <ValidationResults results ={validationResults} />
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
};

function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/history" element={
            <ProtectedRoute>
              <HistoryPage />
            </ProtectedRoute>} 
          />
          <Route path="/admin/users" element={
            <ProtectedRoute requiredRoles="admin">
              <AdminUsersPage />
            </ProtectedRoute>}
          />
        </Routes>
      </AuthProvider>
    </NotificationProvider>
  );
}

export default App;
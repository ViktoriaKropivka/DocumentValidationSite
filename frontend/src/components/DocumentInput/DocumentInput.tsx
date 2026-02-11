import React, { useRef, useState } from 'react';
import { Card } from '../UI/Card';
import './DocumentInput.css';

interface DocumentInputProps {
  documentText: string;
  onDocumentTextChange: (value: string) => void;
  onFileChange: (file: File | null) => void;
  onValidate: () => void;
  onClear: () => void;
  loading: boolean;
  hasRules: boolean;
}

export const DocumentInput: React.FC<DocumentInputProps> = ({
  documentText,
  onDocumentTextChange,
  onFileChange,
  onClear,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>('');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setFileName(file.name);
    onFileChange(file);

    if (file.type === "text/plain") {
      const reader = new FileReader();
      reader.onload = (e) => {
        onDocumentTextChange(e.target?.result as string);
      };
      reader.readAsText(file);
    } else {
      onDocumentTextChange("");
    }
  };


  const handleClearFile = () => {
    setFileName("");
    onFileChange(null);
    onDocumentTextChange("");
  };


  const handleClearAll = () => {
    handleClearFile();
    onClear();
  };

  return (
    <Card title="Проверяемый документ">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        <div className="file-section">
          <h3>Загрузка файла</h3>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".txt,.doc,.docx,.pdf"
            style={{ display: 'none' }}
          />
          
          <div className="file-actions">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="file-select-btn"
            >
              Выбрать файл
            </button>
            
            {fileName && (
              <button
                onClick={handleClearFile}
                className="file-clear-btn"
                title="Удалить файл"
              >
                ✕
              </button>
            )}
          </div>

          <div className="file-status">
            {fileName ? (
              <div className="file-success">
                <span>📄</span>
                <div>
                  <p>{fileName}</p>
                  <p>Файл успешно загружен</p>
                </div>
              </div>
            ) : (
              <div className="file-empty">
                Не выбран ни один файл
              </div>
            )}
          </div>
        </div>

        <div className="divider">
          <div className="divider-line"></div>
          <div className="divider-text">или</div>
        </div>

        <div className="text-section">
          <label className="section-title">Ввод текста вручную</label>
          <textarea
            value={documentText}
            onChange={(e) => onDocumentTextChange(e.target.value)}
            placeholder="Введите текст документа для проверки..."
            rows={10}
            className="input-field"
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
          <button
            onClick={handleClearAll}
            disabled={!documentText.trim() && !fileName}
            className="btn btn-danger"
            style={{ flex: 1 }}
          >
            Очистить всё
          </button>
        </div>
      </div>
    </Card>
  );
};
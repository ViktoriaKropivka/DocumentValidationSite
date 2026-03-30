import React, { useRef, useState } from 'react';
import { Card } from '../UI/Card';
import './DocumentInput.css';
import imageCompression from 'browser-image-compression';

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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('image/') && file.size > 1024 * 1024) {
      try {
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true
        };
        
        const compressedFile = await imageCompression(file, options);
        setFileName(compressedFile.name);
        onFileChange(compressedFile);
        onDocumentTextChange("");
        
      } catch (error) {
        console.error("Ошибка сжатия:", error);
        setFileName(file.name);
        onFileChange(file);
        onDocumentTextChange("");
      }
    } else {
      setFileName(file.name);
      onFileChange(file);
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
            accept=".txt,.doc,.docx,.pdf,.jpg,.jpeg,.png,.gif,.bmp"
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
            <div className="file-formats-info">
              Поддерживаемые форматы: 
              <span className="format-badge">.txt, .doc, .docx, .pdf, .jpg, .jpeg, .png, .gif, .bmp</span>
            </div>
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
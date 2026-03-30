import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DocumentInput } from '../DocumentInput/DocumentInput';

describe('DocumentInput', () => {
  const defaultProps = {
    documentText: '',
    onDocumentTextChange: vi.fn(),
    onFileChange: vi.fn(),
    onValidate: vi.fn(),
    onClear: vi.fn(),
    loading: false,
    hasRules: false
  };

  it('рендерит заголовок и поле ввода', () => {
    render(<DocumentInput {...defaultProps} />);
    
    expect(screen.getByText('Проверяемый документ')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Введите текст документа/i)).toBeInTheDocument();
  });

  it('вызывает onDocumentTextChange при вводе текста', () => {
    render(<DocumentInput {...defaultProps} />);
    
    const textarea = screen.getByPlaceholderText(/Введите текст документа/i);
    fireEvent.change(textarea, { target: { value: 'Новый текст' } });
    
    expect(defaultProps.onDocumentTextChange).toHaveBeenCalledWith('Новый текст');
  });

  it('отображает имя загруженного файла', () => {
    render(<DocumentInput {...defaultProps} />);
  });

    it('вызывает onClear при клике на кнопку очистки', () => {
    const props = {
        ...defaultProps,
        documentText: 'какой-то текст',
    };
    
    render(<DocumentInput {...props} />);
    
    const clearButton = screen.getByRole('button', { name: /Очистить всё/i });
    expect(clearButton).not.toBeDisabled();
    
    fireEvent.click(clearButton);
    expect(props.onClear).toHaveBeenCalledTimes(1);
    });
})
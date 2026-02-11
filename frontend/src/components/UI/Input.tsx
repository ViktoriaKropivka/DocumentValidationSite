import React from 'react';

interface InputProps {
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  type,
  value,
  onChange,
  placeholder = "",
  required = false,
  disabled = false,
  className = ""
}) => {
  return (
    <div className="input-group">
      <label className="input-label">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`input-field ${className}`}
      />
    </div>
  );
};
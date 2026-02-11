import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  type?: 'button' | 'submit';
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  type = 'button',
  className = ''
}) => {
  const baseStyles = "px-6 py-3 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed outline-none";

  const variants = {
    primary: "bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white shadow-lg hover:shadow-xl active:scale-95 focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50",
    secondary: "bg-gray-600 hover:bg-gray-700 text-white border border-gray-500 hover:border-gray-600 active:scale-95 focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50",
    danger: "bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl active:scale-95 focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.classList.add('active');
    setTimeout(() => {
      e.currentTarget.blur();
    }, 150);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.classList.remove('active');
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.classList.remove('active');
    e.currentTarget.blur();
  };

  const handleBlur = (e: React.FocusEvent<HTMLButtonElement>) => {
    e.currentTarget.classList.remove('active');
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onBlur={handleBlur}
      style={{ outline: 'none' }}
    >
      {children}
    </button>
  );
};
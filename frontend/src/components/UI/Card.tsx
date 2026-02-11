import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  icon?: string;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  icon,
  className = ""
}) => {
  return (
    <div className={`card fade-in ${className}`}>
      {title && (
        <h2>
          {icon && <span>{icon}</span>}
          {title}
        </h2>
      )}
      {children}
    </div>
  );
};
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/UI/Card';
import './NotFoundPage.css';

import NotFoundIllustration from '../../assets/404-illustration.svg';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="not-found-container">
      <Card title="Страница не найдена">
        <div className="not-found-content">
          <img 
            src={NotFoundIllustration} 
            alt="404 illustration"
            className="not-found-image"
            loading="lazy"
          />
          
          <h2>Такой страницы не существует</h2>
          <p>Возможно, она была удалена или вы ошиблись в адресе</p>
          <button 
            className="not-found-btn"
            onClick={() => navigate('/')}
          >
            ← Вернуться на главную
          </button>
        </div>
      </Card>
    </div>
  );
};

export default NotFoundPage;
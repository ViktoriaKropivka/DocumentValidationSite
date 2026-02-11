import React from 'react';
import { Card } from '../UI/Card';
import './GeneratedRules.css';
import type { ValidationRule } from '../../types'; 

interface GeneratedRulesProps {
  rules: ValidationRule[];
}

export const GeneratedRules: React.FC<GeneratedRulesProps> = ({ rules }) => {
  
  return (
    <Card title="Сгенерированные правила" className='list-of-rules'>
      <div className="generated-rules">
        {rules.length === 0 ? (
          <div className="rules-empty">
            <p>Правила проверки появятся здесь после генерации</p>
          </div>
        ) : (
          rules.map((rule) => (
            <div key={rule.id} className="rule-item">
              <div className="rule-header">
                <h3 className="rule-name">{rule.name}</h3>
              </div>
              <p className="rule-description">{rule.description}</p>
              {rule.pattern && (
                <div className="rule-pattern">
                  <p className="pattern-label">Шаблон поиска:</p>
                  <code className="pattern-code">{rule.pattern}</code>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </Card>
  );
};
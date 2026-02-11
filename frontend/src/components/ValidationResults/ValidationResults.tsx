import React from 'react';
import { Card } from '../UI/Card';
import './ValidationResults.css';

interface ValidationResult {
  check: string;
  passed: boolean;
  message: string;
}

interface ValidationResponse {
  results: ValidationResult[];
}

interface ValidationResultsProps {
  results: ValidationResponse | null;
}

export const ValidationResults: React.FC<ValidationResultsProps> = ({ results }) => {
  if (!results) {
    return (
      <Card title="Результаты проверки">
        <div className="validation-empty">
          <p>Здесь появятся результаты проверки документа</p>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Результаты проверки" className='validation-card'>
      <div className="validation-list">
        {results.results.map((r, idx) => (
          <div
            key={idx}
            className={`validation-item ${r.passed ? 'passed' : 'failed'}`}
          >
            <div className="validation-title">
              {r.passed ? '✓' : '✗'} {r.check}
            </div>

            <div className="validation-message">
              {r.message}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

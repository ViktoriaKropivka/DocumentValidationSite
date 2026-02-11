import React, { useState } from 'react';
import { Card } from '../UI/Card';
import './RuleGenerator.css';
import { apiService } from '../../services/api';
import type { ValidationRule } from '../../types';
import { GeneratedRules } from '../GeneratedRules/GeneratedRules';

interface Props {
  initialDescription?: string;
  onRulesGenerated?: (rules: ValidationRule[]) => void;
  rules?: ValidationRule[];
}

export const RuleGenerator: React.FC<Props> = ({
  initialDescription = '',
  onRulesGenerated,
  rules = []
}) => {
  const [ruleDescription, setRuleDescription] = useState(initialDescription);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!ruleDescription.trim()) return;
    setLoading(true);
    try {
      const res = await apiService.generateRules(ruleDescription);
      const rules = res.data?.checks || [];
      if (onRulesGenerated) onRulesGenerated(rules);
    } catch (err) {
      console.error('Ошибка генерации правил', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Генератор правил проверки">
      <div className="rule-generator">
        <textarea
          value={ruleDescription}
          onChange={(e) => setRuleDescription(e.target.value)}
          placeholder="Опишите правило..."
          rows={10}
          className='input-field'
        />

        <button onClick={handleGenerate} disabled={loading || !ruleDescription.trim()}>
          {loading ? 'Генерация...' : 'Сгенерировать правила проверки'}
        </button>

        <button
          className="btn btn-secondary"
          onClick={() => onRulesGenerated?.([])}
          disabled={rules.length === 0}
        >
          Очистить правила
        </button>

        <div className="generated-rules-inline">
          <GeneratedRules rules={rules} />
        </div>

      </div>
    </Card>
  );
};

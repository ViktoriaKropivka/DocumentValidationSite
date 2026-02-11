import React, { useEffect, useState } from "react";
import { apiService } from "../services/api";
import { Card } from "../components/UI/Card";
import type { DocumentValidation } from "../types";
import "./HistoryPage.css";
import { AccountCard } from "../components/AccountCard/AccountCard";
import { useNavigate } from "react-router-dom";

const HistoryPage: React.FC = () => {
  const [items, setItems] = useState<DocumentValidation[]>([]);
  const [loading, setLoading] = useState(true);

  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const response = await apiService.getValidationHistory();
      setItems(response.data);
    } catch (e) {
      console.error("Ошибка загрузки истории:", e);
    } finally {
      setLoading(false);
    }
  };

  const toggle = (id: number) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const navigate = useNavigate();

  return (
    <div className="page-container">

      <button
        className="back-button"
        onClick={() => navigate("/")}
      >
        ← На главную
      </button>

      <div className="history-page-stack">

        <AccountCard />

        <Card title="История проверок">
          {loading ? (
            <p>Загрузка...</p>
          ) : items.length === 0 ? (
            <p>История пуста</p>
          ) : (
            <div className="history-list">
              {items.map((item) => {
                const summary = item.validation_results?.summary || {};
                const results = item.validation_results?.results || [];
                const isExpanded = expandedItems.has(item.id);

                return (
                  <div key={item.id} className="history-item">
                    
                    <div className="history-header">
                      <h3>{item.document_name}</h3>
                      <span className="history-date">
                        {new Date(item.created_at).toLocaleString()}
                      </span>
                    </div>

                    <div className="history-summary">
                      <strong>{summary.passed ?? 0}</strong> из{" "}
                      <strong>{summary.total_checks ?? 0}</strong> проверок успешно
                      {summary.failed > 0 && (
                        <span className="error-text">
                          {" "}• Ошибок: {summary.failed}
                        </span>
                      )}
                    </div>

                    <button className="details-btn" onClick={() => toggle(item.id)}>
                      {isExpanded ? "Скрыть детали" : "Показать детали"}
                    </button>

                    {isExpanded && (
                      <div className="details">
                        {results.map((r: any, idx: number) => (
                          <div
                            key={idx}
                            className={`check-item ${r.passed ? "ok" : "fail"}`}
                          >
                            <span className="check-title">
                              {r.passed ? "✓" : "✗"} {r.check}
                            </span>
                            <div className="check-message">
                              {r.message}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default HistoryPage;

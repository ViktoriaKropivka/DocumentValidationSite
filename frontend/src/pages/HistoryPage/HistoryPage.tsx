import React, { useEffect, useState } from "react";
import { apiService } from "../../services/api";
import { Card } from "../../components/UI/Card";
import type { DocumentValidation } from "../../types";
import "./HistoryPage.css";
import { AccountCard } from "../../components/AccountCard/AccountCard";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { SEO } from "../../components/SEO/SEO";
import { useDebounce } from '../../hooks/useDebounce';
import { Skeleton } from "../../components/UI/Skeleton";

const HistoryPage: React.FC = () => {
  const [items, setItems] = useState<DocumentValidation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  
  const pageSize = 10;
  
  const { user, isModerator, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const getFiltersFromURL = () => {
    const params = new URLSearchParams(location.search);
    return {
      doc_name: params.get("search") || "",
      date_from: params.get("from") || "",
      date_to: params.get("to") || "",
      user_id: params.get("user") || "",
      sort_order: (params.get("sort") as "asc" | "desc") || "desc",
      page: Number(params.get("page")) || 1
    };
  };

  const urlFilters = getFiltersFromURL();

  const [filters, setFilters] = useState(urlFilters);
  const [tempSearch, setTempSearch] = useState(urlFilters.doc_name);
  const [tempDateFrom, setTempDateFrom] = useState(urlFilters.date_from);
  const [tempDateTo, setTempDateTo] = useState(urlFilters.date_to);
  const [tempUserId, setTempUserId] = useState(urlFilters.user_id);
  const [tempSortOrder, setTempSortOrder] = useState<"asc" | "desc">(urlFilters.sort_order);
  const [downloading, setDownloading] = useState<number | null>(null);

  const [totalPages, setTotalPages] = useState(1);

  const debouncedSearch = useDebounce(tempSearch, 500);

  const loadHistory = async (appliedFilters: typeof filters) => {
    try {
      setLoading(true);
      
      const params: any = {
        page: appliedFilters.page,
        page_size: pageSize,
        sort_order: appliedFilters.sort_order
      };
      
      if (appliedFilters.doc_name) params.doc_name = appliedFilters.doc_name;
      if (appliedFilters.date_from) params.date_from = appliedFilters.date_from;
      if (appliedFilters.date_to) params.date_to = appliedFilters.date_to;
      if (appliedFilters.user_id && (isModerator || isAdmin)) params.user_id = appliedFilters.user_id;
      
      const response = await apiService.getValidationHistory(params);
      setItems(response.data.items);
      setTotalPages(response.data.total_pages);
      
    } catch (e) {
      console.error("Ошибка загрузки истории:", e);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    const params = new URLSearchParams();
    
    if (tempSearch) params.set("search", tempSearch);
    if (tempDateFrom) params.set("from", tempDateFrom);
    if (tempDateTo) params.set("to", tempDateTo);
    if (tempUserId && (isModerator || isAdmin)) params.set("user", tempUserId);
    params.set("sort", tempSortOrder);
    params.set("page", "1");
    
    navigate({ search: params.toString() }, { replace: true });
    
    setFilters({
      doc_name: tempSearch,
      date_from: tempDateFrom,
      date_to: tempDateTo,
      user_id: tempUserId,
      sort_order: tempSortOrder,
      page: 1
    });
  };

  const resetFilters = () => {
    setTempSearch("");
    setTempDateFrom("");
    setTempDateTo("");
    setTempUserId("");
    setTempSortOrder("desc");
    
    navigate({ search: "" }, { replace: true });
    
    setFilters({
      doc_name: "",
      date_from: "",
      date_to: "",
      user_id: "",
      sort_order: "desc",
      page: 1
    });
  };

  const goToPage = (newPage: number) => {
    const params = new URLSearchParams(location.search);
    params.set("page", newPage.toString());
    navigate({ search: params.toString() }, { replace: true });
    
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  useEffect(() => {
    const urlFilters = getFiltersFromURL();
    setTempSearch(urlFilters.doc_name);
    setTempDateFrom(urlFilters.date_from);
    setTempDateTo(urlFilters.date_to);
    setTempUserId(urlFilters.user_id);
    setTempSortOrder(urlFilters.sort_order);
  }, [location.search]);

  useEffect(() => {
    if (debouncedSearch !== filters.doc_name) {
      setFilters(prev => ({ ...prev, doc_name: debouncedSearch }));
    }
  }, [debouncedSearch]);

  useEffect(() => {
    loadHistory(filters);
  }, [filters]);

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

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить этот документ?')) return;
    try {
      await apiService.deleteValidation(id);
      loadHistory(filters);
    } catch (e) {
      console.error("Ошибка удаления:", e);
    }
  };

  const handleDownload = async (item: DocumentValidation) => {
    try {
      setDownloading(item.id);
      const response = await apiService.getDownloadUrl(item.id);
      
      const link = document.createElement('a');
      link.href = response.data.download_url;
      link.download = response.data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Ошибка скачивания:', error);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <>
      <SEO 
        title="История проверок"
        description="Просмотр истории проверок документов"
      />
      <div className="page-container">
        <button className="back-button" onClick={() => navigate('/')}>
          ← На главную
        </button>

        <div className="history-page-stack">
          <AccountCard />

          <Card title="История проверок">
            <div className="filters-section">
              <div className="filters-form">
                <div className="filter-row">
                  <input
                    type="text"
                    placeholder="Поиск по названию документа..."
                    value={tempSearch}
                    onChange={(e) => setTempSearch(e.target.value)}
                    className="filter-input"
                  />
                  
                  <select
                    value={tempSortOrder}
                    onChange={(e) => setTempSortOrder(e.target.value as "asc" | "desc")}
                    className="filter-select"
                  >
                    <option value="desc">Сначала новые</option>
                    <option value="asc">Сначала старые</option>
                  </select>
                </div>

                <div className="filter-row">
                  <div className="date-filters">
                    <input
                      type="date"
                      value={tempDateFrom}
                      onChange={(e) => setTempDateFrom(e.target.value)}
                      className="filter-date"
                      placeholder="Дата с"
                    />
                    <span className="date-separator">—</span>
                    <input
                      type="date"
                      value={tempDateTo}
                      onChange={(e) => setTempDateTo(e.target.value)}
                      className="filter-date"
                      placeholder="Дата по"
                    />
                  </div>

                  {(isModerator || isAdmin) && (
                    <input
                      type="number"
                      placeholder="ID пользователя"
                      value={tempUserId}
                      onChange={(e) => setTempUserId(e.target.value)}
                      className="filter-user-id"
                      min="1"
                    />
                  )}
                </div>

                <div className="filter-actions">
                  <button onClick={applyFilters} className="filter-btn apply-btn">
                    Применить фильтры
                  </button>
                  <button onClick={resetFilters} className="filter-btn reset-btn">
                    Сбросить
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="history-list">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="history-item" style={{ padding: '16px' }}>
                    <Skeleton height="24px" width="60%" borderRadius="8px" />
                    <div style={{ marginTop: '12px' }}>
                      <Skeleton height="16px" width="40%" />
                    </div>
                    <div style={{ marginTop: '16px' }}>
                      <Skeleton height="60px" />
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <p>История пуста</p>
            ) : (
              <>
                <div className="history-list">
                  {items.map((item) => {
                    const summary = item.validation_results?.summary || {};
                    const results = item.validation_results?.results || [];
                    const isExpanded = expandedItems.has(item.id);
                    
                    const showOwner = (isModerator || isAdmin) && item.user_id !== user?.id;

                    return (
                      <div key={item.id} className="history-item">
                        <div className="history-header">
                          <h3>
                            {item.document_name}
                            {showOwner && (
                              <span className="owner-badge">
                                (ID: {item.user_id})
                              </span>
                            )}
                          </h3>
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

                        <div className="history-actions">
                          <button className="details-btn" onClick={() => toggle(item.id)}>
                            {isExpanded ? "Скрыть детали" : "Показать детали"}
                          </button>
                          
                          {(isAdmin || item.user_id === user?.id) && (
                            <button 
                              className="delete-btn"
                              onClick={() => handleDelete(item.id)}
                            >
                              Удалить
                            </button>
                          )}

                          {item.file_path && (
                            <button
                              onClick={() => handleDownload(item)}
                              disabled={downloading === item.id}
                              className="download-btn"
                              title="Скачать оригинал"
                            >
                              {downloading === item.id ? '...' : '📥'}
                            </button>
                          )}
                        </div>

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

                {totalPages > 1 && (
                  <div className="pagination">
                    <button
                      onClick={() => goToPage(filters.page - 1)}
                      disabled={filters.page === 1}
                      className="pagination-btn"
                    >
                      ←
                    </button>
                    
                    <span className="page-info">
                      {filters.page} из {totalPages}
                    </span>
                    
                    <button
                      onClick={() => goToPage(filters.page + 1)}
                      disabled={filters.page === totalPages}
                      className="pagination-btn"
                    >
                      →
                    </button>
                  </div>
                )}
              </>
            )}
          </Card>
        </div>
      </div>
    </>
  );
};

export default HistoryPage;
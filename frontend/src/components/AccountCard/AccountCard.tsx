import React from "react";
import { Card } from "../UI/Card";
import { useAuth } from "../../contexts/AuthContext";
import "./AccountCard.css";

export const AccountCard: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <Card title="Аккаунт">
      <div className="account-card">
        <div className="account-row">
          <span className="label">Имя</span>
          <span className="value">
            {user.full_name || "Без имени"}
          </span>
        </div>

        <div className="account-row">
          <span className="label">Email</span>
          <span className="value">{user.email}</span>
        </div>

        <div className="account-status">
          🔐 Авторизован
        </div>
      </div>
    </Card>
  );
};

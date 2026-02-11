import React, { createContext, useContext, useState } from 'react';
import { Notification } from '../components/UI/Notifacation/Notification';

interface NotificationData {
  message: string;
  type: 'error' | 'success' | 'warning';
  duration?: number;
}

interface NotificationContextType {
  showNotification: (data: NotificationData) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notification, setNotification] = useState<NotificationData | null>(null);

  const showNotification = (data: NotificationData) => {
    setNotification(data);
  };

  const handleClose = () => {
    setNotification(null);
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={handleClose}
          duration={notification.duration}
        />
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
import React, { createContext, useContext, useState } from 'react';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const [notification, setNotification] = useState({ message: '', type: '' });

    const showNotification = (message, type = 'info') => {
        setNotification({ message, type });
        setTimeout(() => setNotification({ message: '', type: '' }), 3000);
    };

    return (
        <NotificationContext.Provider value={{ notification, showNotification }}>
            {children}
            <style>{`
                .modern-toast {
                    position: fixed;
                    bottom: 100px;
                    right: 32px;
                    min-width: 220px;
                    background: #232946;
                    color: #fff;
                    padding: 16px 32px;
                    border-radius: 16px;
                    box-shadow: 0 4px 24px rgba(35,41,70,0.18);
                    font-size: 1.1rem;
                    font-weight: 600;
                    z-index: 9999;
                    opacity: 0;
                    transform: translateY(40px);
                    animation: toast-in 0.4s forwards;
                }
                .modern-toast.success { background: linear-gradient(90deg,#38b2ac,#7f53ac); }
                .modern-toast.error { background: linear-gradient(90deg,#f44336,#e57373); }
                .modern-toast.info { background: linear-gradient(90deg,#647dee,#7f53ac); }
                @keyframes toast-in {
                    to { opacity: 1; transform: none; }
                }
            `}</style>
            {notification.message && (
                <div
                    className={`modern-toast ${notification.type}`}
                    role="alert"
                    aria-live="assertive"
                    tabIndex={-1}
                >
                    {notification.message}
                </div>
            )}
        </NotificationContext.Provider>
    );
};

import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

let nextId = 1;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((cur) => cur.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((message, type = 'info', duration = 4000) => {
    const id = nextId++;
    setToasts((cur) => [...cur, { id, message, type }]);
    if (duration > 0) setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  const success = useCallback((m, d) => show(m, 'success', d), [show]);
  const error   = useCallback((m, d) => show(m, 'error', d), [show]);
  const info    = useCallback((m, d) => show(m, 'info', d), [show]);

  return (
    <ToastContext.Provider value={{ show, success, error, info, dismiss }}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`} onClick={() => dismiss(t.id)}>
            <span className="toast-icon">
              {t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'}
            </span>
            <span className="toast-msg">{t.message}</span>
            <button className="toast-close" onClick={(e) => { e.stopPropagation(); dismiss(t.id); }} aria-label="Dismiss">
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);

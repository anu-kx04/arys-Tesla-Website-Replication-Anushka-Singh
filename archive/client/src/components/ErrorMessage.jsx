import React, { useState, useEffect } from 'react';
import { AlertCircle, X, CheckCircle, Info, AlertTriangle } from 'lucide-react';

const ErrorMessage = ({ message, type = 'error', onClose, autoDismiss = 5000 }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (autoDismiss) {
      const timer = setTimeout(() => {
        setVisible(false);
        if (onClose) onClose();
      }, autoDismiss);
      return () => clearTimeout(timer);
    }
  }, [autoDismiss, onClose]);

  if (!visible || !message) return null;

  const styles = {
    error: 'bg-red-50 text-red-700 border-red-200',
    success: 'bg-green-50 text-green-700 border-green-200',
    warning: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
  };

  const icons = {
    error: <AlertCircle className="w-5 h-5" />,
    success: <CheckCircle className="w-5 h-5" />,
    warning: <AlertTriangle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
  };

  return (
    <div className={`flex items-center justify-between p-4 border rounded-lg mb-4 ${styles[type]}`}>
      <div className="flex items-center gap-3">
        {icons[type]}
        <span className="text-sm font-medium">{message}</span>
      </div>
      <button onClick={() => { setVisible(false); if (onClose) onClose(); }} className="p-1 hover:bg-black/5 rounded-full transition">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ErrorMessage;
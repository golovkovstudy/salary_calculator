import React, { useEffect, useRef } from 'react';
import { AlertTriangle, HelpCircle } from 'lucide-react';
import useStore from '../store/useStore';

export default function ConfirmModal() {
  const dialog = useStore(s => s.confirmDialog);
  const closeConfirm = useStore(s => s.closeConfirm);
  const confirmRef = useRef(null);

  useEffect(() => {
    if (dialog && confirmRef.current) {
      confirmRef.current.focus();
    }
  }, [dialog]);

  // Закрытие по Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (!dialog) return;
      if (e.key === 'Escape') {
        dialog.onCancel?.();
        closeConfirm();
      }
      if (e.key === 'Enter') {
        dialog.onConfirm?.();
        closeConfirm();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [dialog, closeConfirm]);

  if (!dialog) return null;

  const handleConfirm = () => {
    dialog.onConfirm?.();
    closeConfirm();
  };

  const handleCancel = () => {
    dialog.onCancel?.();
    closeConfirm();
  };

  const Icon = dialog.danger ? AlertTriangle : HelpCircle;
  const iconColor = dialog.danger ? 'text-red-500' : 'text-primary-500';

  return (
    <div 
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={handleCancel}
    >
      <div 
        className="card max-w-md w-full animate-scale-in shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start gap-4 mb-5">
          <div className={`p-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 flex-shrink-0`}>
            <Icon size={24} className={iconColor} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              {dialog.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {dialog.message}
            </p>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={handleCancel}
            className="btn-secondary flex-1 sm:flex-none"
          >
            {dialog.cancelText}
          </button>
          <button
            ref={confirmRef}
            onClick={handleConfirm}
            className={`${dialog.danger ? 'btn-danger' : 'btn-primary'} flex-1 sm:flex-none`}
            autoFocus
          >
            {dialog.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
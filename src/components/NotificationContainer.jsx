import React from 'react';
import { X, XCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import useStore from '../store/useStore';

const ICONS = {
  error:   { Icon: XCircle,        color: 'text-red-500',    bg: 'bg-red-50 dark:bg-red-950/40',       border: 'border-red-200 dark:border-red-800/50' },
  success: { Icon: CheckCircle,    color: 'text-green-500',  bg: 'bg-green-50 dark:bg-green-950/40',   border: 'border-green-200 dark:border-green-800/50' },
  warning: { Icon: AlertTriangle,  color: 'text-amber-500',  bg: 'bg-amber-50 dark:bg-amber-950/40',   border: 'border-amber-200 dark:border-amber-800/50' },
  info:    { Icon: Info,           color: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-950/40',     border: 'border-blue-200 dark:border-blue-800/50' },
};

function Toast({ notification, onDismiss }) {
  const config = ICONS[notification.type] || ICONS.info;
  const { Icon } = config;

  return (
    <div
      className={`
        w-80 sm:w-96 p-4 rounded-xl border shadow-lg backdrop-blur-sm
        ${config.bg} ${config.border}
        ${notification.exiting ? 'animate-slide-out-right' : 'animate-slide-in-right'}
      `}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <Icon size={20} className={`mt-0.5 flex-shrink-0 ${config.color}`} />
        <div className="flex-1 min-w-0">
          {notification.title && (
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-0.5">
              {notification.title}
            </p>
          )}
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug">
            {notification.message}
          </p>
        </div>
        <button
          onClick={() => onDismiss(notification.id)}
          className="p-1 -m-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex-shrink-0"
          aria-label="Закрыть"
        >
          <X size={16} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" />
        </button>
      </div>
    </div>
  );
}

export default function NotificationContainer() {
  const notifications = useStore(s => s.notifications);
  const dismissNotification = useStore(s => s.dismissNotification);

  if (notifications.length === 0) return null;

  return (
    <div 
      className="fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none"
      aria-live="polite"
      aria-atomic="false"
    >
      {notifications.map(n => (
        <div key={n.id} className="pointer-events-auto">
          <Toast notification={n} onDismiss={dismissNotification} />
        </div>
      ))}
    </div>
  );
}
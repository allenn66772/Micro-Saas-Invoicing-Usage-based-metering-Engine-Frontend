import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export type NotificationType = 'error' | 'success' | 'warning' | 'info';

interface NotificationBannerProps {
  type?: NotificationType;
  title?: string;
  message: string;
  onDismiss?: () => void;
  className?: string;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  type = 'error',
  title,
  message,
  onDismiss,
  className = '',
}) => {
  const styles = {
    error: {
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/25',
      text: 'text-rose-200',
      iconColor: 'text-rose-400',
      Icon: AlertCircle,
    },
    success: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/25',
      text: 'text-emerald-200',
      iconColor: 'text-emerald-400',
      Icon: CheckCircle2,
    },
    warning: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/25',
      text: 'text-amber-200',
      iconColor: 'text-amber-400',
      Icon: AlertTriangle,
    },
    info: {
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/25',
      text: 'text-indigo-200',
      iconColor: 'text-indigo-400',
      Icon: Info,
    },
  }[type];

  const IconComponent = styles.Icon;

  return (
    <div
      role="alert"
      className={`relative flex items-start gap-3 rounded-xl border p-4 text-xs transition-all animate-in fade-in ${styles.bg} ${styles.border} ${styles.text} ${className}`}
    >
      <IconComponent className={`h-4 w-4 shrink-0 mt-0.5 ${styles.iconColor}`} />
      <div className="flex-1">
        {title && <p className="font-semibold mb-0.5 text-slate-100">{title}</p>}
        <p className="leading-relaxed">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800/40 transition-colors"
          aria-label="Dismiss message"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
};

export default NotificationBanner;

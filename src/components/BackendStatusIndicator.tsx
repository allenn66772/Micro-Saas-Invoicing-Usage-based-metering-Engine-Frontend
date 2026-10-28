import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { apiClient } from '../api/axios';

export const BackendStatusIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);

  const checkStatus = async () => {
    setIsChecking(true);
    try {
      await apiClient.get('/', { timeout: 2500 });
      setIsOnline(true);
    } catch (err: any) {
      if (err.response) {
        setIsOnline(true);
      } else {
        setIsOnline(false);
      }
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border transition-colors ${
          isOnline === true
            ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
            : isOnline === false
            ? 'bg-amber-500/10 border-amber-500/25 text-amber-400'
            : 'bg-slate-800 border-slate-700 text-slate-400'
        }`}
        title={
          isOnline === true
            ? 'Express/Node.js backend reachable on https://micro-saas-invoicing-usage-based.onrender.com'
            : 'Backend not detected at https://micro-saas-invoicing-usage-based.onrender.com. Ensure node server is running.'
        }
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            isOnline === true
              ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
              : isOnline === false
              ? 'bg-amber-400 animate-pulse'
              : 'bg-slate-400'
          }`}
        />
        <span>
          {isOnline === true
            ? 'Backend: 3000 Live'
            : isOnline === false
            ? 'Backend: Offline'
            : 'Connecting...'}
        </span>
        <button
          onClick={checkStatus}
          disabled={isChecking}
          className="ml-0.5 hover:text-white transition-transform active:rotate-180 disabled:opacity-50"
          aria-label="Refresh backend status"
        >
          <RefreshCw className={`h-2.5 w-2.5 ${isChecking ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </div>
  );
};

export default BackendStatusIndicator;

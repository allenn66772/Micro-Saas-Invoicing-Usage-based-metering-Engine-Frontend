import React, { useState } from 'react';
import { Copy, Check, AlertTriangle, ShieldCheck, Terminal } from 'lucide-react';
import Modal from './Modal';

interface ApiKeyRevealModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
}

export const ApiKeyRevealModal: React.FC<ApiKeyRevealModalProps> = ({
  isOpen,
  onClose,
  apiKey,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = apiKey;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Secret API Key Generated"
      subtitle="Your new metering key is ready for integration."
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Security Warning Banner */}
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-semibold text-amber-300">Save this key now — It won't be shown again!</p>
            <p className="text-amber-200/80">
              For security reasons, we do not store this key in plaintext. If you lose this key, you will have to revoke it and generate a new one.
            </p>
          </div>
        </div>

        {/* API Key Box */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300">Plaintext API Secret Key</label>
          <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 p-2.5">
            <code className="flex-1 font-mono text-sm text-indigo-300 break-all select-all px-2">
              {apiKey}
            </code>
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all shrink-0 ${
                copied
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
              }`}
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Key</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Integration Example */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3.5">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-2">
            <Terminal className="h-3.5 w-3.5 text-slate-500" />
            <span>Example HTTP Authorization Header</span>
          </div>
          <pre className="text-[11px] font-mono text-slate-300 bg-slate-900/90 rounded-lg p-2.5 overflow-x-auto border border-slate-800/60">
            <code>{`curl -X POST http://localhost:3000/events \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"metric": "api_calls", "units": 1}'`}</code>
          </pre>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2.5 text-xs font-medium transition-colors"
          >
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>I have safely saved this key</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ApiKeyRevealModal;

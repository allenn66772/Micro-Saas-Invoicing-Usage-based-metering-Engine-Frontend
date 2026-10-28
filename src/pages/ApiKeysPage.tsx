import React, { useState, useEffect } from 'react';
import {
  Key,
  Plus,
  Trash2,
  AlertTriangle,
  RefreshCw,
  Calendar,
  Code2,
} from 'lucide-react';
import { api } from '../api/axios';
import type { ApiKeyItem } from '../types';
import Badge from '../components/Badge';
import ApiKeyRevealModal from '../components/ApiKeyRevealModal';
import Modal from '../components/Modal';
import NotificationBanner from '../components/NotificationBanner';

export const ApiKeysPage: React.FC = () => {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Newly generated key modal state
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);

  // Revoke confirmation modal state
  const [keyToRevoke, setKeyToRevoke] = useState<ApiKeyItem | null>(null);

  const fetchKeys = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getApiKeys();
      setKeys(data);
    } catch (err: any) {
      console.error('Failed to fetch API keys:', err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to connect to backend on http://localhost:3000.';
      setError(msg);

      // Demo fallback in case keys endpoint hasn't been populated yet
      if (keys.length === 0) {
        setKeys([
          {
            _id: 'key_live_9012a',
            keyPrefix: 'mp_live_89a0',
            maskedKey: 'mp_live_89a0••••••••••••••••••••••••3fa2',
            status: 'active',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
          },
          {
            _id: 'key_test_5431b',
            keyPrefix: 'mp_test_124c',
            maskedKey: 'mp_test_124c••••••••••••••••••••••••8b91',
            status: 'active',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
          },
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleGenerateKey = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const response = await api.generateKey();
      setNewlyCreatedKey(response.apiKey);
      setSuccessMessage(response.message || 'New API key generated successfully!');
      await fetchKeys();
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Failed to generate API key.';
      setError(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirmRevoke = async () => {
    if (!keyToRevoke) return;
    setRevokingId(keyToRevoke._id);
    setError(null);
    try {
      await api.revokeKey(keyToRevoke._id);
      setSuccessMessage('API key revoked successfully.');
      setKeyToRevoke(null);
      await fetchKeys();
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Failed to revoke API key.';
      setError(msg);
    } finally {
      setRevokingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header & Generate Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Key className="h-6 w-6 text-indigo-400" />
            <span>API Key Management</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Authenticate your telemetry ingestions and meter events securely via HTTP headers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchKeys}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleGenerateKey}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                <span>Create New API Key</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <NotificationBanner
          type="error"
          message={error}
          onDismiss={() => setError(null)}
        />
      )}

      {successMessage && (
        <NotificationBanner
          type="success"
          message={successMessage}
          onDismiss={() => setSuccessMessage(null)}
        />
      )}

      {/* API Keys Table */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-md overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">Active &amp; Historical Keys</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Secret keys are masked for security. Revoked keys immediately reject incoming telemetry.
            </p>
          </div>
          <Badge variant="neutral" size="sm">
            {keys.length} Total Keys
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-950/40 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-5">Key Identifier / Mask</th>
                <th className="py-3.5 px-4">Key Prefix</th>
                <th className="py-3.5 px-4">Created Date</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-2" />
                    Loading API keys from backend...
                  </td>
                </tr>
              ) : keys.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 font-sans">
                    <Key className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                    No API keys found. Click &quot;Create New API Key&quot; to generate your first key.
                  </td>
                </tr>
              ) : (
                keys.map((k) => {
                  const isActive = k.status === 'active';
                  const displayMask =
                    k.maskedKey ||
                    (k.keyPrefix ? `${k.keyPrefix}••••••••••••••••••••••••` : `${k._id.slice(0, 8)}••••••••••••`);

                  return (
                    <tr key={k._id} className="hover:bg-slate-800/30 transition-colors">
                      {/* Key Identifier / Mask */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2">
                          <code className="text-slate-200 bg-slate-950 px-2 py-1 rounded border border-slate-800/80">
                            {displayMask}
                          </code>
                        </div>
                      </td>

                      {/* Prefix */}
                      <td className="py-4 px-4 text-slate-400">
                        {k.keyPrefix ? (
                          <span className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded text-[11px]">
                            {k.keyPrefix}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* Created Date */}
                      <td className="py-4 px-4 text-slate-400 font-sans">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-500" />
                          <span>{formatDate(k.createdAt)}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center font-sans">
                        {isActive ? (
                          <Badge variant="success" dot size="sm">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="danger" size="sm">
                            Revoked
                          </Badge>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right font-sans">
                        {isActive ? (
                          <button
                            onClick={() => setKeyToRevoke(k)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-medium transition-colors"
                            title="Revoke this API Key permanently"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Revoke</span>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-600 italic">No actions</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Integration Code Snippets Guide */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-md">
        <div className="flex items-center gap-2 mb-4">
          <Code2 className="h-5 w-5 text-indigo-400" />
          <h3 className="text-sm font-semibold text-white">How to Ingest Usage Events</h3>
        </div>

        <p className="text-xs text-slate-400 mb-4">
          Inject your secret API key into the <code className="text-indigo-300">Authorization</code> or{' '}
          <code className="text-indigo-300">X-API-Key</code> header when streaming consumption events to the backend.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* cURL */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <span className="text-[11px] font-semibold text-slate-400 block mb-2">cURL Example</span>
            <pre className="text-[11px] font-mono text-indigo-200 overflow-x-auto leading-relaxed">
              <code>{`curl -X POST http://localhost:3000/events \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "metric": "api_calls",
    "units": 1,
    "timestamp": "${new Date().toISOString()}"
  }'`}</code>
            </pre>
          </div>

          {/* Node.js */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <span className="text-[11px] font-semibold text-slate-400 block mb-2">Node.js (Fetch)</span>
            <pre className="text-[11px] font-mono text-indigo-200 overflow-x-auto leading-relaxed">
              <code>{`await fetch('http://localhost:3000/events', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    metric: 'storage_gb',
    units: 12
  })
});`}</code>
            </pre>
          </div>
        </div>
      </div>

      {/* API Key Reveal Modal */}
      {newlyCreatedKey && (
        <ApiKeyRevealModal
          isOpen={!!newlyCreatedKey}
          onClose={() => setNewlyCreatedKey(null)}
          apiKey={newlyCreatedKey}
        />
      )}

      {/* Revoke Confirmation Modal */}
      <Modal
        isOpen={!!keyToRevoke}
        onClose={() => setKeyToRevoke(null)}
        title="Revoke API Key"
        subtitle="This action cannot be undone."
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-200 text-xs">
            <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-300">Are you absolutely sure?</p>
              <p className="mt-1 text-rose-200/80">
                Any services or scripts currently using key{' '}
                <span className="font-mono font-semibold text-rose-100">
                  {keyToRevoke?.keyPrefix || keyToRevoke?._id.slice(0, 8)}
                </span>{' '}
                will immediately fail to authenticate and stop reporting usage.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              onClick={() => setKeyToRevoke(null)}
              className="px-4 py-2 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-800 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmRevoke}
              disabled={!!revokingId}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {revokingId ? (
                <>
                  <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Revoking...</span>
                </>
              ) : (
                <span>Yes, Revoke Key</span>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ApiKeysPage;

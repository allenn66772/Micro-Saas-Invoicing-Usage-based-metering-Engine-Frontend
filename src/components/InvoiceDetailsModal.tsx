import React, { useState } from 'react';
import { Download, Layers, AlertCircle } from 'lucide-react';
import type { Invoice } from '../types';
import Modal from './Modal';
import Badge from './Badge';
import { api } from '../api/axios';

interface InvoiceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  isLoading?: boolean;
}

export const InvoiceDetailsModal: React.FC<InvoiceDetailsModalProps> = ({
  isOpen,
  onClose,
  invoice,
  isLoading = false,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownload = async () => {
    if (!invoice) return;
    setDownloading(true);
    setDownloadError(null);
    try {
      await api.downloadInvoicePdf(invoice._id, invoice.invoiceNumber);
    } catch (err: any) {
      setDownloadError(
        err.response?.data?.message || err.message || 'Failed to download invoice PDF'
      );
    } finally {
      setDownloading(false);
    }
  };

  const getStatusBadge = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return <Badge variant="success" dot>Paid</Badge>;
      case 'unpaid':
        return <Badge variant="warning" dot>Unpaid</Badge>;
      case 'void':
        return <Badge variant="neutral">Void</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={invoice ? `Invoice: ${invoice.invoiceNumber}` : 'Invoice Breakdown'}
      subtitle="Complete itemized tier brackets and billing summary"
      maxWidth="2xl"
    >
      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-3" />
          <p className="text-xs text-slate-400">Loading invoice breakdown details...</p>
        </div>
      ) : !invoice ? (
        <div className="py-8 text-center text-slate-400 text-sm">
          No invoice details available.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header Metadata Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl border border-slate-800 bg-slate-950/70 text-xs">
            <div>
              <span className="text-slate-500 block mb-0.5">Status</span>
              {getStatusBadge(invoice.status)}
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">Invoice Date</span>
              <span className="font-mono text-slate-200">{formatDate(invoice.createdAt)}</span>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">Billing Period</span>
              <span className="font-mono text-slate-200">
                {formatDate(invoice.billingPeriod?.start)} &rarr; {formatDate(invoice.billingPeriod?.end)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">Total Amount</span>
              <span className="font-mono font-bold text-indigo-400 text-sm">
                ${invoice.totalAmount?.toFixed(2) ?? '0.00'}
              </span>
            </div>
          </div>

          {downloadError && (
            <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{downloadError}</span>
            </div>
          )}

          {/* Itemized Line Items & Tier Breakdowns */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-indigo-400" />
              <span>Itemized Line Items &amp; Tier Brackets</span>
            </h4>

            {(!invoice.lineItems || invoice.lineItems.length === 0) ? (
              <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-4 text-center text-xs text-slate-400">
                No individual line items registered for this invoice.
              </div>
            ) : (
              invoice.lineItems.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden"
                >
                  {/* Line Item Header */}
                  <div className="flex items-center justify-between p-3.5 bg-slate-800/40 border-b border-slate-800/80">
                    <div>
                      <span className="text-sm font-semibold text-white capitalize">{item.metric}</span>
                      <span className="ml-2 text-xs text-slate-400 font-mono">
                        ({item.totalUnits.toLocaleString()} {item.unitName})
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 mr-2">Item Subtotal:</span>
                      <span className="font-mono font-bold text-emerald-400">
                        ${item.subtotal?.toFixed(2) ?? '0.00'}
                      </span>
                    </div>
                  </div>

                  {/* Tier Breakdown Table */}
                  {item.tierBreakdown && item.tierBreakdown.length > 0 ? (
                    <div className="p-3">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="text-slate-500 border-b border-slate-800/80 font-medium">
                            <th className="pb-2">Tier Bracket Range</th>
                            <th className="pb-2 text-right">Units Billed</th>
                            <th className="pb-2 text-right">Unit Price</th>
                            <th className="pb-2 text-right">Tier Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/40 font-mono text-slate-300">
                          {item.tierBreakdown.map((tier, tIdx) => (
                            <tr key={tIdx} className="hover:bg-slate-800/30">
                              <td className="py-2 text-slate-400 font-sans">{tier.range}</td>
                              <td className="py-2 text-right">{tier.unitsBilled.toLocaleString()}</td>
                              <td className="py-2 text-right">${tier.unitPrice.toFixed(4)}</td>
                              <td className="py-2 text-right font-medium text-slate-200">
                                ${tier.subtotal.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="p-3 text-xs text-slate-500 italic">Flat rate applied (no tiered brackets).</p>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Invoice Summary and Download Action */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-400">
              Customer ID: <code className="text-slate-300 font-mono">{invoice.customerId}</code>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 text-xs font-semibold transition-all shadow-md shadow-indigo-600/20"
              >
                {downloading ? (
                  <>
                    <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Preparing PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5" />
                    <span>Download Invoice PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default InvoiceDetailsModal;

import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Eye,
  DollarSign,
  RefreshCw,
  Search,
  CheckCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { api } from '../api/axios';
import type { Invoice } from '../types';
import Badge from '../components/Badge';
import InvoiceDetailsModal from '../components/InvoiceDetailsModal';
import NotificationBanner from '../components/NotificationBanner';
import StatCard from '../components/StatCard';

export const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Filter & Search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid' | 'void'>('all');

  // Details Modal state
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Messages
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchInvoices = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getAllInvoices();
      setInvoices(data);
    } catch (err: any) {
      console.error('Failed to fetch invoices:', err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to connect to backend on http://localhost:3000.';
      setError(msg);

      // Provide realistic fallback invoices for immediate verification if backend not yet seeded
      if (invoices.length === 0) {
        setInvoices([
          {
            _id: 'inv_6712390a8',
            customerId: 'cust_saas_9821',
            invoiceNumber: 'INV-202610-8910',
            billingPeriod: {
              start: '2026-10-01T00:00:00.000Z',
              end: '2026-10-31T23:59:59.000Z',
            },
            totalAmount: 29.5,
            status: 'unpaid',
            createdAt: '2026-10-27T12:00:00.000Z',
            lineItems: [
              {
                metric: 'api_calls',
                unitName: 'Requests',
                totalUnits: 14250,
                subtotal: 8.5,
                tierBreakdown: [
                  { range: '0 - 10,000 (Free)', unitsBilled: 10000, unitPrice: 0.0, subtotal: 0.0 },
                  { range: '10,001 - 50,000', unitsBilled: 4250, unitPrice: 0.002, subtotal: 8.5 },
                ],
              },
              {
                metric: 'storage_gb',
                unitName: 'GB',
                totalUnits: 85,
                subtotal: 4.2,
                tierBreakdown: [
                  { range: '0 - 50 GB (Free)', unitsBilled: 50, unitPrice: 0.0, subtotal: 0.0 },
                  { range: '51 - 200 GB', unitsBilled: 35, unitPrice: 0.12, subtotal: 4.2 },
                ],
              },
              {
                metric: 'data_transfer_out',
                unitName: 'GB',
                totalUnits: 310,
                subtotal: 16.8,
                tierBreakdown: [
                  { range: '0 - 100 GB (Free)', unitsBilled: 100, unitPrice: 0.0, subtotal: 0.0 },
                  { range: '101 - 500 GB', unitsBilled: 210, unitPrice: 0.08, subtotal: 16.8 },
                ],
              },
            ],
          },
          {
            _id: 'inv_5510287f3',
            customerId: 'cust_saas_9821',
            invoiceNumber: 'INV-202609-4102',
            billingPeriod: {
              start: '2026-09-01T00:00:00.000Z',
              end: '2026-09-30T23:59:59.000Z',
            },
            totalAmount: 48.2,
            status: 'paid',
            createdAt: '2026-10-01T08:30:00.000Z',
            lineItems: [
              {
                metric: 'api_calls',
                unitName: 'Requests',
                totalUnits: 25000,
                subtotal: 30.0,
                tierBreakdown: [
                  { range: '0 - 10,000 (Free)', unitsBilled: 10000, unitPrice: 0.0, subtotal: 0.0 },
                  { range: '10,001 - 50,000', unitsBilled: 15000, unitPrice: 0.002, subtotal: 30.0 },
                ],
              },
              {
                metric: 'storage_gb',
                unitName: 'GB',
                totalUnits: 110,
                subtotal: 7.2,
                tierBreakdown: [
                  { range: '0 - 50 GB (Free)', unitsBilled: 50, unitPrice: 0.0, subtotal: 0.0 },
                  { range: '51 - 200 GB', unitsBilled: 60, unitPrice: 0.12, subtotal: 7.2 },
                ],
              },
              {
                metric: 'compute_seconds',
                unitName: 'Seconds',
                totalUnits: 5733,
                subtotal: 11.0,
                tierBreakdown: [
                  { range: '0 - 5,000 Sec (Free)', unitsBilled: 5000, unitPrice: 0.0, subtotal: 0.0 },
                  { range: '5,001 - 20,000 Sec', unitsBilled: 733, unitPrice: 0.015, subtotal: 11.0 },
                ],
              },
            ],
          },
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  // Action: Generate Current Cycle Invoice
  const handleGenerateInvoice = async () => {
    setIsGenerating(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const newInvoice = await api.generateInvoice();
      setSuccessMessage(`Invoice ${newInvoice.invoiceNumber || 'Cycle'} generated successfully!`);
      await fetchInvoices();
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Failed to generate invoice for current cycle.';
      setError(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  // Action: Download PDF
  const handleDownloadPdf = async (inv: Invoice) => {
    setDownloadingId(inv._id);
    setError(null);
    try {
      await api.downloadInvoicePdf(inv._id, inv.invoiceNumber);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to download PDF invoice. Ensure backend PDF endpoint is implemented.';
      setError(msg);
    } finally {
      setDownloadingId(null);
    }
  };

  // Action: Open Details Modal and fetch itemized brackets
  const handleOpenDetails = async (inv: Invoice) => {
    setSelectedInvoice(inv);
    setIsModalOpen(true);
    setIsLoadingDetails(true);
    try {
      const detailed = await api.getInvoiceById(inv._id);
      setSelectedInvoice(detailed);
    } catch {
      // If single invoice endpoint fails, keep using list invoice
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Filtered invoices
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv._id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate summaries
  const totalBilled = invoices.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
  const totalUnpaid = invoices
    .filter((i) => i.status === 'unpaid')
    .reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
  const totalPaid = invoices
    .filter((i) => i.status === 'paid')
    .reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header & Generate Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-indigo-400" />
            <span>Invoices &amp; Tiered Billing</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Generate billing cycle statements, review itemized tier brackets, and download official PDF records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchInvoices}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
            <span>Refresh</span>
          </button>

          {/* Core Action: Generate Current Cycle Invoice */}
          <button
            onClick={handleGenerateInvoice}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Generating Invoice...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Generate Current Cycle Invoice</span>
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

      {/* Quick Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Invoiced to Date"
          value={`$${totalBilled.toFixed(2)}`}
          icon={DollarSign}
          description={`${invoices.length} total generated statements`}
          accentColor="indigo"
          isLoading={isLoading}
        />

        <StatCard
          title="Outstanding Balance (Unpaid)"
          value={`$${totalUnpaid.toFixed(2)}`}
          icon={Clock}
          description="Awaiting payment settlement"
          accentColor="amber"
          isLoading={isLoading}
        />

        <StatCard
          title="Settled Invoices (Paid)"
          value={`$${totalPaid.toFixed(2)}`}
          icon={CheckCircle}
          description="Successfully processed payments"
          accentColor="emerald"
          isLoading={isLoading}
        />
      </div>

      {/* Table Section */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-md overflow-hidden shadow-xl">
        {/* Table Filters & Search */}
        <div className="p-5 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by invoice number (e.g. INV-202610)..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-800 bg-slate-950/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Status:</span>
            {(['all', 'paid', 'unpaid', 'void'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                  statusFilter === status
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-950/40 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-5">Invoice Number</th>
                <th className="py-3.5 px-4">Billing Period</th>
                <th className="py-3.5 px-4">Issued Date</th>
                <th className="py-3.5 px-4 text-right">Total Amount</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-2" />
                    Fetching invoice records...
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 font-sans">
                    <FileSpreadsheet className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                    No invoices found. Click &quot;Generate Current Cycle Invoice&quot; to compute charges.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const isUnpaid = inv.status === 'unpaid';
                  const isPaid = inv.status === 'paid';

                  return (
                    <tr key={inv._id} className="hover:bg-slate-800/30 transition-colors">
                      {/* Invoice Number */}
                      <td className="py-4 px-5">
                        <button
                          onClick={() => handleOpenDetails(inv)}
                          className="font-semibold text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1.5"
                          title="Click to view itemized breakdown"
                        >
                          <span>{inv.invoiceNumber}</span>
                        </button>
                      </td>

                      {/* Billing Period */}
                      <td className="py-4 px-4 text-slate-400 font-sans">
                        <div className="flex items-center gap-1 text-[11px]">
                          <span>{formatDate(inv.billingPeriod?.start)}</span>
                          <span className="text-slate-600">&rarr;</span>
                          <span>{formatDate(inv.billingPeriod?.end)}</span>
                        </div>
                      </td>

                      {/* Issued Date */}
                      <td className="py-4 px-4 text-slate-400 font-sans">
                        {formatDate(inv.createdAt)}
                      </td>

                      {/* Total Amount */}
                      <td className="py-4 px-4 text-right font-bold text-slate-100 font-mono">
                        ${inv.totalAmount?.toFixed(2) ?? '0.00'}
                      </td>

                      {/* Status Tag */}
                      <td className="py-4 px-4 text-center font-sans">
                        {isPaid ? (
                          <Badge variant="success" dot size="sm">
                            Paid
                          </Badge>
                        ) : isUnpaid ? (
                          <Badge variant="warning" dot size="sm">
                            Unpaid
                          </Badge>
                        ) : (
                          <Badge variant="neutral" size="sm">
                            Void
                          </Badge>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right font-sans">
                        <div className="inline-flex items-center gap-2">
                          {/* Details Button */}
                          <button
                            onClick={() => handleOpenDetails(inv)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors"
                            title="View itemized bracket breakdown"
                          >
                            <Eye className="h-3.5 w-3.5 text-slate-400" />
                            <span>Details</span>
                          </button>

                          {/* Download PDF Button */}
                          <button
                            onClick={() => handleDownloadPdf(inv)}
                            disabled={downloadingId === inv._id}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-semibold transition-colors disabled:opacity-50"
                            title="Download official PDF invoice"
                          >
                            {downloadingId === inv._id ? (
                              <>
                                <div className="h-3.5 w-3.5 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
                                <span>PDF...</span>
                              </>
                            ) : (
                              <>
                                <Download className="h-3.5 w-3.5 text-indigo-400" />
                                <span>PDF</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Details Modal */}
      <InvoiceDetailsModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedInvoice(null);
        }}
        invoice={selectedInvoice}
        isLoading={isLoadingDetails}
      />
    </div>
  );
};

export default InvoicesPage;

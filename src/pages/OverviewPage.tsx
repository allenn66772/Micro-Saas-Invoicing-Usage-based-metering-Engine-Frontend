import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  Calendar,
  Activity,
  Layers,
  RefreshCw,
  FileSpreadsheet,
  Clock,
} from 'lucide-react';
import { api } from '../api/axios';
import type { CurrentPeriodUsageResponse } from '../types';
import StatCard from '../components/StatCard';
import Badge from '../components/Badge';
import NotificationBanner from '../components/NotificationBanner';

export const OverviewPage: React.FC = () => {
  const [data, setData] = useState<CurrentPeriodUsageResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);

  const navigate = useNavigate();

  const fetchUsageData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const response = await api.getCurrentPeriodUsage();
      setData(response);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('Failed to load current period usage:', err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to connect to backend on http://localhost:3000. Ensure the server is running.';
      setError(msg);

      // Provide sensible fallback demo state so user can preview the UI even before seeding
      if (!data) {
        setData({
          billingPeriod: {
            start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
            end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString(),
          },
          breakdown: [
            {
              metric: 'api_calls',
              unitName: 'Requests',
              totalUnits: 14250,
              freeUnits: 10000,
              billableUnits: 4250,
              ratePerUnit: 0.002,
              subtotal: 8.5,
              totalEventsLogged: 14250,
            },
            {
              metric: 'compute_seconds',
              unitName: 'Seconds',
              totalUnits: 3200,
              freeUnits: 5000,
              billableUnits: 0,
              ratePerUnit: 0.015,
              subtotal: 0.0,
              totalEventsLogged: 3200,
            },
            {
              metric: 'storage_gb',
              unitName: 'GB/mo',
              totalUnits: 85,
              freeUnits: 50,
              billableUnits: 35,
              ratePerUnit: 0.12,
              subtotal: 4.2,
              totalEventsLogged: 85,
            },
            {
              metric: 'data_transfer_out',
              unitName: 'GB',
              totalUnits: 310,
              freeUnits: 100,
              billableUnits: 210,
              ratePerUnit: 0.08,
              subtotal: 16.8,
              totalEventsLogged: 310,
            },
          ],
          estimatedTotalAmount: 29.5,
        });
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [data]);

  useEffect(() => {
    fetchUsageData();
  }, []);

  // Real-time polling when autoRefresh is active
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchUsageData(true);
    }, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchUsageData]);

  const formatDateSpan = (start?: string, end?: string) => {
    if (!start || !end) return 'Current Active Cycle';
    try {
      const s = new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const e = new Date(end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      return `${s} – ${e}`;
    } catch {
      return `${start} to ${end}`;
    }
  };

  const totalEventsCount =
    data?.breakdown?.reduce((acc, curr) => acc + (curr.totalEventsLogged || curr.totalUnits || 0), 0) || 0;

  const totalBillableUnits =
    data?.breakdown?.reduce((acc, curr) => acc + (curr.billableUnits || 0), 0) || 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Controls & Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Real-Time Usage &amp; Billing Meter</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Live telemetry aggregated from incoming ingestion events for the current billing cycle.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Auto Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
              autoRefresh
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Automatically poll backend every 15 seconds"
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Auto 15s: {autoRefresh ? 'ON' : 'OFF'}</span>
          </button>

          {/* Manual Refresh */}
          <button
            onClick={() => fetchUsageData(true)}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
            <span>Refresh</span>
          </button>

          {/* Jump to Invoices */}
          <button
            onClick={() => navigate('/dashboard/invoices')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 transition-all"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Invoices</span>
          </button>
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <NotificationBanner
          type="warning"
          title="Backend Connection Notice"
          message={`${error} (Displaying telemetry state).`}
          onDismiss={() => setError(null)}
        />
      )}

      {/* Hero Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Estimated Cycle Bill"
          value={`$${(data?.estimatedTotalAmount ?? 0).toFixed(2)}`}
          icon={DollarSign}
          description="Accrued charges this period"
          accentColor="indigo"
          isLoading={isLoading}
          trend={{ value: 'Real-Time Estimate', isPositive: true }}
        />

        <StatCard
          title="Billing Period Span"
          value={data?.billingPeriod ? formatDateSpan(data.billingPeriod.start, data.billingPeriod.end) : 'Current Cycle'}
          icon={Calendar}
          description="Active subscription window"
          accentColor="violet"
          isLoading={isLoading}
        />

        <StatCard
          title="Total Events Logged"
          value={totalEventsCount.toLocaleString()}
          icon={Activity}
          description="Aggregated ingestion pings"
          accentColor="emerald"
          isLoading={isLoading}
          trend={{ value: 'Live Telemetry', isPositive: true }}
        />

        <StatCard
          title="Billable Units"
          value={totalBillableUnits.toLocaleString()}
          icon={Layers}
          description="Units exceeding free thresholds"
          accentColor="cyan"
          isLoading={isLoading}
        />
      </div>

      {/* Consumption Breakdown Table */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-md overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
              <span>Metric Breakdown &amp; Free Tier Consumption</span>
              <Badge variant="info" size="sm">
                {data?.breakdown?.length || 0} Metrics
              </Badge>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live consumption against free allowances with graduated unit prices.
            </p>
          </div>

          <div className="text-xs text-slate-500 font-mono">
            Updated: {lastUpdated.toLocaleTimeString()}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-950/40 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-5">Metric Name</th>
                <th className="py-3.5 px-4 text-right">Total Units</th>
                <th className="py-3.5 px-4 text-right">Free Tier</th>
                <th className="py-3.5 px-5 text-center min-w-[200px]">Free Tier Usage</th>
                <th className="py-3.5 px-4 text-right">Billable Units</th>
                <th className="py-3.5 px-4 text-right">Unit Rate</th>
                <th className="py-3.5 px-5 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-2" />
                    Calculating aggregated usage...
                  </td>
                </tr>
              ) : !data?.breakdown || data.breakdown.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No metric usage logged in this billing period yet.
                  </td>
                </tr>
              ) : (
                data.breakdown.map((item, idx) => {
                  const free = item.freeUnits || 0;
                  const total = item.totalUnits || 0;
                  const percentOfFree = free > 0 ? Math.min(Math.round((total / free) * 100), 100) : 100;
                  const isExceeded = total > free;

                  return (
                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                      {/* Metric Name */}
                      <td className="py-4 px-5 font-sans font-medium text-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="capitalize">{item.metric.replace(/_/g, ' ')}</span>
                          <span className="text-[10px] text-slate-400 font-mono px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">
                            {item.unitName}
                          </span>
                        </div>
                      </td>

                      {/* Total Logged */}
                      <td className="py-4 px-4 text-right font-semibold text-slate-200">
                        {total.toLocaleString()}
                      </td>

                      {/* Free Allowance */}
                      <td className="py-4 px-4 text-right text-slate-400">
                        {free.toLocaleString()}
                      </td>

                      {/* Progress Bar Consumption */}
                      <td className="py-4 px-5">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-slate-400 font-sans">
                            <span>{percentOfFree}% used</span>
                            <span className={isExceeded ? 'text-amber-400 font-semibold' : 'text-emerald-400'}>
                              {isExceeded ? `+${(total - free).toLocaleString()} billable` : 'Within allowance'}
                            </span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden flex">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isExceeded
                                  ? 'bg-gradient-to-r from-emerald-500 via-indigo-500 to-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${percentOfFree}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Billable Units */}
                      <td className="py-4 px-4 text-right font-medium">
                        <span className={item.billableUnits > 0 ? 'text-indigo-300 font-bold' : 'text-slate-500'}>
                          {item.billableUnits.toLocaleString()}
                        </span>
                      </td>

                      {/* Rate Per Unit */}
                      <td className="py-4 px-4 text-right text-slate-400">
                        ${item.ratePerUnit?.toFixed(4) ?? '0.0000'}
                      </td>

                      {/* Subtotal */}
                      <td className="py-4 px-5 text-right font-bold text-slate-100">
                        ${item.subtotal?.toFixed(2) ?? '0.00'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {data?.breakdown && data.breakdown.length > 0 && (
              <tfoot>
                <tr className="bg-slate-950/60 font-semibold text-slate-200 border-t border-slate-800">
                  <td colSpan={6} className="py-4 px-5 text-right font-sans text-xs uppercase tracking-wider">
                    Total Estimated Amount Due:
                  </td>
                  <td className="py-4 px-5 text-right font-mono text-base text-indigo-400 font-bold">
                    ${data.estimatedTotalAmount?.toFixed(2) ?? '0.00'}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default OverviewPage;

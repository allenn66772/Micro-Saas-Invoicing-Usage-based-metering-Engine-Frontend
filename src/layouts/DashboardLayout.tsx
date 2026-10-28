import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  Key,
  FileSpreadsheet,
  LogOut,
  Menu,
  X,
  Zap,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import BackendStatusIndicator from '../components/BackendStatusIndicator';

export const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    {
      name: 'Overview & Usage',
      path: '/dashboard',
      icon: Activity,
      exact: true,
      description: 'Real-time aggregated metrics & estimate',
    },
    {
      name: 'API Keys',
      path: '/dashboard/keys',
      icon: Key,
      exact: false,
      description: 'Ingestion tokens & permissions',
    },
    {
      name: 'Invoices & Billing',
      path: '/dashboard/invoices',
      icon: FileSpreadsheet,
      exact: false,
      description: 'Cycle settlement & PDF downloads',
    },
  ];

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const getPageTitle = () => {
    if (location.pathname === '/dashboard') return 'Overview & Real-Time Aggregation';
    if (location.pathname.startsWith('/dashboard/keys')) return 'API Keys Management';
    if (location.pathname.startsWith('/dashboard/invoices')) return 'Invoices & Tiered Billing';
    return 'Dashboard';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-lg shadow-indigo-500/25">
            <Zap className="h-5 w-5" />
          </div>
          <span className="font-bold text-base tracking-tight text-white">MeterPulse</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900/95 border-r border-slate-800/80 backdrop-blur-xl flex flex-col transition-transform duration-300 md:static md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-lg shadow-indigo-500/30">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight text-white">MeterPulse</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Micro-SaaS
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Usage-Based Metering Engine</p>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Engine Controls
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`group flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-medium transition-all duration-200 relative ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 shadow-sm shadow-indigo-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                <div
                  className={`p-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-slate-800/80 text-slate-400 group-hover:text-slate-200 group-hover:bg-slate-700/80'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-200">{item.name}</div>
                  <div className="text-[11px] text-slate-500 truncate">{item.description}</div>
                </div>
                {isActive && (
                  <div className="w-1.5 h-6 rounded-full bg-indigo-500 absolute right-2" />
                )}
              </NavLink>
            );
          })}

          <div className="pt-6 px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Ingestion Gateway
          </div>
          <div className="p-3 rounded-xl border border-slate-800/70 bg-slate-950/60 text-xs text-slate-400 space-y-2">
            <div className="flex items-center gap-1.5 text-slate-300 font-medium text-[11px]">
              <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
              <span>Event Ingestion URI</span>
            </div>
            <code className="block p-2 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-indigo-300 break-all select-all">
              http://localhost:3000
            </code>
            <p className="text-[10px] text-slate-500 leading-tight">
              Events are aggregated in real-time. Use your API Key in the Authorization header.
            </p>
          </div>
        </nav>

        {/* User Profile & Logout Section */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-slate-800/80 bg-slate-950/60">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
                {user?.username ? user.username.charAt(0).toUpperCase() : user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate">
                  {user?.username || 'Client Admin'}
                </p>
                <p className="text-[11px] text-slate-400 truncate font-mono">
                  {user?.email || 'user@metersaas.com'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
              title="Instant Logout (Flushes session token)"
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Dashboard</span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
            <span className="text-slate-200 font-semibold">{getPageTitle()}</span>
          </div>

          <div className="flex items-center gap-3">
            <BackendStatusIndicator />
          </div>
        </header>

        {/* Page View Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

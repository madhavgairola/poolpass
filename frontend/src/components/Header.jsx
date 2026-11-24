import React from 'react';
import { RefreshCw, Coins, Sun, Moon, Shield, Sparkles, BarChart3, Terminal, Plus } from 'lucide-react';
import { DEMO_ACCOUNTS, formatToken } from '../utils/web3';

export default function Header({
  activeTab,
  setActiveTab,
  theme,
  toggleTheme,
  walletType,
  setWalletType,
  currentAccountIndex,
  setCurrentAccountIndex,
  userAddress,
  tokenBalance,
  onRefresh,
  onFaucet,
  isRefreshing,
  hasActiveSubscription,
}) {
  const tabs = [
    { id: 'subscriptions', label: 'Subscriptions', icon: Shield, badge: hasActiveSubscription ? 'Active' : null },
    { id: 'plans', label: 'Plans', icon: Sparkles },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'sandbox', label: 'Dev Sandbox', icon: Terminal },
  ];

  return (
    <header className="border-b border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 grid grid-cols-2 md:grid-cols-[1fr_auto_1fr] items-center gap-3">
          
          {/* Col 1: Left Brand */}
          <div className="flex items-center gap-2.5 justify-self-start">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-sm shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 2.21.718 4.253 1.933 5.908L6 16c-.633-1.196-1-2.556-1-4 0-4.418 3.582-8 8-8s8 3.582 8 8c0 1.444-.367 2.804-1 4l2.067 1.908C21.282 16.253 22 14.21 22 12c0-5.523-4.477-10-10-10z" fill="currentColor" fillOpacity="0.85" />
                <path d="M12 7a5 5 0 100 10 5 5 0 000-10zm0 2a3 3 0 110 6 3 3 0 010-6z" fill="currentColor" />
              </svg>
            </div>
            <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white font-sans">
              PoolPass
            </span>
          </div>

          {/* Col 2: Center Navigation Tabs (balanced in middle column) */}
          <nav className="hidden md:flex items-center justify-self-center">
            <div className="flex items-center bg-slate-100/90 dark:bg-slate-900/90 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-500' : 'text-slate-400'}`} />
                    <span>{tab.label}</span>
                    {tab.badge && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Col 3: Right Controls (compact & neatly arranged) */}
          <div className="flex items-center gap-1.5 justify-self-end">
            {/* Unified Account & Balance Capsule */}
            <div className="flex items-center bg-slate-100/90 dark:bg-slate-900/90 rounded-xl border border-slate-200 dark:border-slate-800 text-xs divide-x divide-slate-200 dark:divide-slate-800 shadow-sm">
              {/* Account Dropdown */}
              <div className="flex items-center px-2 py-1 gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                {walletType === 'local' ? (
                  <select
                    value={currentAccountIndex}
                    onChange={(e) => setCurrentAccountIndex(Number(e.target.value))}
                    aria-label="Select Account"
                    className="bg-transparent text-slate-800 dark:text-slate-200 text-xs font-mono focus:outline-none cursor-pointer max-w-[100px] sm:max-w-[120px] truncate"
                  >
                    {DEMO_ACCOUNTS.map((acc, idx) => (
                      <option key={acc.address} value={idx} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                        {acc.name.split(' ')[0]} ({acc.address.slice(0, 4)}...{acc.address.slice(-3)})
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="font-mono text-slate-800 dark:text-slate-200 text-xs truncate max-w-[100px]">
                    {userAddress ? `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}` : 'Connecting...'}
                  </span>
                )}
              </div>

              {/* Balance */}
              <div className="flex items-center gap-1 px-2.5 py-1 font-mono text-slate-900 dark:text-white font-semibold text-xs whitespace-nowrap">
                <span>{formatToken(tokenBalance)}</span>
                <span className="text-slate-400 font-normal text-[10px]">mUSDC</span>
              </div>
            </div>

            {/* Quick Faucet */}
            <button
              onClick={onFaucet}
              className="px-2 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/80 text-xs font-semibold font-mono transition cursor-pointer flex items-center gap-1 shrink-0"
              title="Mint 1,000 mock USDC to active account"
            >
              <Plus className="w-3 h-3" />
              <span>1k</span>
            </button>

            {/* Refresh */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 transition disabled:opacity-50 cursor-pointer shrink-0"
              title="Refresh blockchain data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-500' : ''}`} />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 transition cursor-pointer shrink-0"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-600" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="flex md:hidden items-center justify-center gap-1 py-2 border-t border-slate-100 dark:border-slate-900 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Icon className={`w-3 h-3 ${isActive ? 'text-emerald-400 dark:text-emerald-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
}

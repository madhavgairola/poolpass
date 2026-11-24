import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  TrendingUp,
  Clock,
  ArrowRight,
  Calendar,
  Sparkles,
  ExternalLink,
  Zap,
  CheckCircle2,
  DollarSign,
  Layers,
  Cpu,
  Terminal,
  Play,
} from 'lucide-react';
import { formatToken, formatTimestamp, formatTimeRemaining } from '../utils/web3';
import { ethers } from 'ethers';

// Platform Brand Logos (Clean SVG Vectors)
function GithubIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

function ClaudeIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function TradingViewIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}

function CloudServerIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
      <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
      <line x1="6" y1="6" x2="6.01" y2="6" />
      <line x1="6" y1="18" x2="6.01" y2="18" />
    </svg>
  );
}

export default function HomeOverview({
  userSubscription,
  plans,
  durationOptions,
  blockTimestamp,
  tokenBalance,
  onNavigate,
  onOpenSimulation,
}) {
  const hasActiveSub = Boolean(
    userSubscription &&
    userSubscription.stakedPrincipal &&
    userSubscription.stakedPrincipal > 0n &&
    !userSubscription.isWithdrawn
  );

  const nowSec = Number(blockTimestamp || Math.floor(Date.now() / 1000));

  // Extract subscription metrics
  const planName = userSubscription?.planName || 'Pro Pass';
  const stakedPrincipal = userSubscription?.stakedPrincipal || 0n;
  const yieldSettled = userSubscription?.yieldSettled || 0n;
  const currentAccruedYield = userSubscription?.currentAccruedYield || 0n;
  const startTime = userSubscription?.startTime || 0n;
  const lockExpiry = userSubscription?.lockExpiry || 0n;
  const timeRemaining = userSubscription?.timeRemaining || 0n;

  const startSec = Number(startTime);
  const expirySec = Number(lockExpiry);
  const totalDurationSec = Math.max(1, expirySec - startSec);

  const settledFloat = parseFloat(ethers.formatEther(yieldSettled));
  const accruedFloat = parseFloat(ethers.formatEther(currentAccruedYield));
  const totalSavedFloat = settledFloat + accruedFloat;
  const principalFloat = parseFloat(ethers.formatEther(stakedPrincipal));

  // Default projection if not yet subscribed
  const displaySaved = hasActiveSub ? totalSavedFloat : 45.0;
  const displayPrincipal = hasActiveSub ? principalFloat : 1155.83;
  const displayPlanName = hasActiveSub ? planName : 'Pro Pass (Preview)';

  // Calculate upcoming cycle deadline
  const cycleSeconds = 30 * 86400;
  const nextMilestoneSec = hasActiveSub && startSec > 0
    ? startSec + Math.min(totalDurationSec, Math.ceil(Math.max(1, nowSec - startSec) / cycleSeconds) * cycleSeconds)
    : nowSec + 30 * 86400;

  const daysToNextDeadline = Math.max(0, Math.ceil((nextMilestoneSec - nowSec) / 86400));
  const daysToMaturity = hasActiveSub && expirySec > nowSec
    ? Math.max(0, Math.ceil((expirySec - nowSec) / 86400))
    : 90;

  // Platform Coverage Matrix
  const coveredPlatforms = [
    {
      id: 'github',
      name: 'GitHub Enterprise & Copilot',
      category: 'Developer Platform & CI/CD',
      icon: GithubIcon,
      monthlyRate: 10.0,
      allocationPercent: '66.7%',
      status: hasActiveSub ? 'Active • Yield Streaming' : 'Ready to Activate',
      savedToDate: (displaySaved * 0.67).toFixed(2),
      deadlineSec: nextMilestoneSec,
      tierRequired: 'Pro Pass',
      isCovered: true,
      description: 'Unlimited private repositories, GitHub Actions compute minutes, and Copilot AI paired programming.',
    },
    {
      id: 'claude',
      name: 'Claude Pro & LLM Gateway',
      category: 'Frontier AI & LLM Compute',
      icon: ClaudeIcon,
      monthlyRate: 5.0,
      allocationPercent: '33.3%',
      status: hasActiveSub ? 'Active • Yield Streaming' : 'Ready to Activate',
      savedToDate: (displaySaved * 0.33).toFixed(2),
      deadlineSec: nextMilestoneSec,
      tierRequired: 'Pro Pass',
      isCovered: true,
      description: 'Dedicated priority quota for Claude 3.5 Sonnet, Claude Opus, and low-latency API completions.',
    },
    {
      id: 'tradingview',
      name: 'TradingView Pro+ Analytics',
      category: 'Market Intelligence & Charts',
      icon: TradingViewIcon,
      monthlyRate: 10.0,
      allocationPercent: 'Add-on Tier',
      status: planName.includes('Enterprise') ? 'Active • Yield Streaming' : 'Available with Enterprise Pass',
      savedToDate: planName.includes('Enterprise') ? '20.00' : '0.00',
      deadlineSec: nextMilestoneSec,
      tierRequired: 'Enterprise Pass',
      isCovered: planName.includes('Enterprise'),
      description: 'Multi-chart layouts, custom Pine Script indicators, and real-time decentralized exchange feeds.',
    },
    {
      id: 'cloud',
      name: 'Cloud Node & Edge Hosting',
      category: 'Decentralized Infrastructure',
      icon: CloudServerIcon,
      monthlyRate: 15.0,
      allocationPercent: 'Add-on Tier',
      status: planName.includes('Enterprise') ? 'Active • Yield Streaming' : 'Available with Enterprise Pass',
      savedToDate: planName.includes('Enterprise') ? '30.00' : '0.00',
      deadlineSec: nextMilestoneSec,
      tierRequired: 'Enterprise Pass',
      isCovered: planName.includes('Enterprise'),
      description: 'Dedicated RPC nodes, containerized microservices, and high-availability edge proxy bandwidth.',
    },
  ];

  return (
    <div className="space-y-8">
      {/* 1. Executive Portfolio Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 relative">
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${hasActiveSub ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </span>
            <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">
              {hasActiveSub ? `Active Yield-Funded Position: ${displayPlanName}` : 'Portfolio Standby • Ready to Stake'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">
            Subscription Capital Portfolio
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Zero out-of-pocket software subscriptions. Stablecoin principal earns automated lending yield in Aave/Compound liquidity pools, paying recurring service fees while preserving 100% of your collateral.
          </p>
        </div>

        {/* Action Shortcuts */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onNavigate('subscriptions')}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-bold text-xs shadow-sm transition flex items-center gap-2 cursor-pointer"
          >
            <span>Active Position & Stream</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onNavigate('plans')}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 transition flex items-center gap-2 cursor-pointer"
          >
            <span>Explore Plans & Rates</span>
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
          </button>
        </div>
      </div>

      {/* 2. Executive Capital Realization & Savings Statement */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Metric 1: Total Subscription Capital Saved */}
        <div className="surface-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">Total Subscription Fees Saved</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-700 dark:text-[#00e599] border border-emerald-500/20">
              100% Interest Funded
            </span>
          </div>

          <div className="mt-3">
            <div className="text-3xl font-bold font-mono text-slate-900 dark:text-white tracking-tight">
              ${displaySaved.toFixed(2)} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">mUSDC</span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
              <span>Out-of-Pocket Expense:</span>
              <strong className="text-emerald-600 dark:text-[#00e599] font-mono font-bold">$0.00</strong>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] font-mono text-slate-500 dark:text-slate-400">
            Run-Rate: <span className="text-slate-800 dark:text-slate-200 font-medium">${(hasActiveSub ? parseFloat(ethers.formatEther(userSubscription.monthlyFee || 0n)) * 12 : 180).toFixed(0)}/year preserved</span>
          </div>
        </div>

        {/* Metric 2: Working Capital Preserved */}
        <div className="surface-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">Staked Collateral Principal</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
              Zero Principal Risk
            </span>
          </div>

          <div className="mt-3">
            <div className="text-3xl font-bold font-mono text-slate-900 dark:text-white tracking-tight">
              {displayPrincipal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
              <span className="text-sm font-normal text-slate-500 dark:text-slate-400">mUSDC</span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
              <span>Return Status:</span>
              <strong className="text-slate-800 dark:text-slate-200 font-medium">100% Recoverable at Maturity</strong>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] font-mono text-slate-500 dark:text-slate-400">
            Lending Yield Rate: <span className="text-slate-800 dark:text-slate-200 font-medium">8.0% – 12.0% Fixed APY</span>
          </div>
        </div>

        {/* Metric 3: Next Settlement Deadline */}
        <div className="surface-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">Next Billing Deadline</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {daysToNextDeadline > 0 ? `In ${daysToNextDeadline} Days` : 'Due Today'}
            </span>
          </div>

          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white tracking-tight">
              {formatTimestamp(nextMilestoneSec)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
              <span>Target Amount:</span>
              <strong className="text-slate-900 dark:text-white font-mono">$15.00 mUSDC</strong>
              <span className="text-emerald-600 dark:text-[#00e599] font-medium">(Auto-Harvest)</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] font-mono text-slate-500 dark:text-slate-400">
            Principal Unlock Date: <span className="text-slate-800 dark:text-slate-200 font-medium">{formatTimestamp(expirySec > 0 ? expirySec : nowSec + 90 * 86400)}</span>
          </div>
        </div>
      </div>

      {/* 3. Covered Platforms & Digital Services Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight font-sans">
              Covered Platforms & Subscribed Tools
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Digital platforms and developer tools funded by your staked collateral yield.
            </p>
          </div>
          <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
            Active Services: <span className="font-bold text-slate-900 dark:text-white">{hasActiveSub ? '2 Platforms Active' : '0 / 4 Active'}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {coveredPlatforms.map((platform) => {
            const IconComponent = platform.icon;
            const isAccessible = hasActiveSub && platform.isCovered;

            return (
              <div
                key={platform.id}
                className={`surface-panel rounded-2xl p-5 border transition flex flex-col justify-between ${
                  isAccessible
                    ? 'border-slate-200 dark:border-slate-800 shadow-sm'
                    : 'border-slate-200/60 dark:border-slate-800/60 opacity-80'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isAccessible
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white font-sans">
                          {platform.name}
                        </h3>
                        <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                          {platform.category}
                        </div>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      isAccessible
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-[#00e599] border border-emerald-500/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}>
                      {isAccessible ? '100% YIELD COVERED' : platform.tierRequired}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                    {platform.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-3 gap-2 text-xs font-mono">
                  <div>
                    <div className="text-[10px] text-slate-400">Rate</div>
                    <div className="font-bold text-slate-900 dark:text-white">${platform.monthlyRate.toFixed(2)}/mo</div>
                  </div>

                  <div>
                    <div className="text-[10px] text-slate-400">Saved to Date</div>
                    <div className="font-bold text-emerald-600 dark:text-[#00e599]">${platform.savedToDate}</div>
                  </div>

                  <div>
                    <div className="text-[10px] text-slate-400">Next Deadline</div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">
                      {isAccessible ? formatTimestamp(platform.deadlineSec) : '—'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Settlement Deadlines & Capital Unlock Schedule */}
      <div className="surface-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight font-sans">
              Billing Deadlines & Maturity Calendar
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Scheduled smart contract harvest milestones and 100% principal return date.
            </p>
          </div>

          <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
            Lock Duration: <span className="font-bold text-slate-900 dark:text-white">{hasActiveSub ? `${Math.round(totalDurationSec / 86400)} Days` : '90 Days (Standard)'}</span>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/60 mt-2">
          {/* Milestone 1 */}
          <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-[#00e599] border border-emerald-500/20 flex items-center justify-center font-mono text-xs font-bold">
                01
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white font-sans">
                  Billing Cycle 01 Settlement
                </div>
                <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  Scheduled Deadline: {formatTimestamp(hasActiveSub && startSec > 0 ? startSec + 30 * 86400 : nowSec + 30 * 86400)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-xs font-mono font-bold text-slate-900 dark:text-white">$15.00 mUSDC</div>
                <div className="text-[10px] font-mono text-emerald-600 dark:text-[#00e599]">Auto-routed via Yield</div>
              </div>

              <span className="px-2.5 py-1 rounded text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-700 dark:text-[#00e599] border border-emerald-500/20">
                {hasActiveSub && settledFloat >= 14.9 ? '✓ Settled' : 'Yield Funded'}
              </span>
            </div>
          </div>

          {/* Milestone 2 */}
          <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center font-mono text-xs font-bold">
                02
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white font-sans">
                  Billing Cycle 02 Settlement
                </div>
                <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  Scheduled Deadline: {formatTimestamp(hasActiveSub && startSec > 0 ? startSec + 60 * 86400 : nowSec + 60 * 86400)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-xs font-mono font-bold text-slate-900 dark:text-white">$15.00 mUSDC</div>
                <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">Accruing in Lending Pool</div>
              </div>

              <span className="px-2.5 py-1 rounded text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                Scheduled
              </span>
            </div>
          </div>

          {/* Milestone 3: Maturity & Capital Recovery */}
          <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-500/5 dark:bg-emerald-950/20 -mx-6 px-6 rounded-xl mt-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-mono text-xs font-bold shadow-sm">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white font-sans">
                  Lock Expiry & 100% Principal Unlock
                </div>
                <div className="text-[11px] font-mono text-emerald-700 dark:text-[#00e599]">
                  Recovery Date: {formatTimestamp(hasActiveSub && expirySec > 0 ? expirySec : nowSec + 90 * 86400)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-xs font-mono font-bold text-emerald-700 dark:text-[#00e599]">
                  +{displayPrincipal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} mUSDC
                </div>
                <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">Zero Loss • Staked Collateral</div>
              </div>

              <span className="px-2.5 py-1 rounded text-[11px] font-mono font-bold bg-emerald-600 text-white shadow-sm">
                100% Refundable
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Economic Model Comparison: Traditional SaaS vs PoolPass */}
      <div className="surface-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight font-sans mb-1">
          Financial Model: Traditional SaaS vs PoolPass
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Why decentralized yield-funded subscriptions mathematically outperform corporate credit card billing.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                <th className="py-2.5 pr-4 font-medium">Financial Parameter</th>
                <th className="py-2.5 px-4 font-medium text-red-500">Traditional Credit Card Billing</th>
                <th className="py-2.5 pl-4 font-medium text-emerald-600 dark:text-[#00e599]">PoolPass Yield Protocol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              <tr>
                <td className="py-3 pr-4 font-sans font-semibold text-slate-900 dark:text-white">Annual Cash Outflow</td>
                <td className="py-3 px-4 text-red-600 dark:text-red-400">-$180.00 (Permanent loss)</td>
                <td className="py-3 pl-4 text-emerald-600 dark:text-[#00e599] font-bold">$0.00 (Funded by yield)</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-sans font-semibold text-slate-900 dark:text-white">Capital Recoverability</td>
                <td className="py-3 px-4 text-slate-500">0% (Sunk cost)</td>
                <td className="py-3 pl-4 text-emerald-600 dark:text-[#00e599] font-bold">100% Principal Returned</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-sans font-semibold text-slate-900 dark:text-white">Underlying Asset Custody</td>
                <td className="py-3 px-4 text-slate-500">Corporate merchant processor</td>
                <td className="py-3 pl-4 text-slate-800 dark:text-slate-200">Non-custodial smart contract timelock</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-sans font-semibold text-slate-900 dark:text-white">Net Balance at 1 Year</td>
                <td className="py-3 px-4 text-red-600 dark:text-red-400 font-bold">-$180.00</td>
                <td className="py-3 pl-4 text-emerald-600 dark:text-[#00e599] font-bold">+$1,200.00 Principal + $0 Lost</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
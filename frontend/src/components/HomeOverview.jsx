import React from 'react';
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
  Plus,
} from 'lucide-react';
import { formatToken, formatTimestamp } from '../utils/web3';
import { ethers } from 'ethers';

// Platform Brand Logos (Clean SVG Vectors)
function GoogleGeminiIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 3.5a6.5 6.5 0 016.5 6.5c0 1.8-.73 3.43-1.9 4.6l-1.42-1.42A4.48 4.48 0 0016.5 12 4.5 4.5 0 0012 7.5v-2zm-6.5 6.5A6.5 6.5 0 0112 5.5v2A4.5 4.5 0 007.5 12c0 1.24.5 2.37 1.32 3.18L7.4 16.6A6.47 6.47 0 015.5 12z" />
    </svg>
  );
}

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
  plans = [],
  durationOptions = [],
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

  const startSec = Number(startTime);
  const expirySec = Number(lockExpiry);
  const totalDurationSec = Math.max(1, expirySec - startSec);

  const settledFloat = parseFloat(ethers.formatEther(yieldSettled));
  const accruedFloat = parseFloat(ethers.formatEther(currentAccruedYield));
  const totalSavedFloat = settledFloat + accruedFloat;
  const principalFloat = parseFloat(ethers.formatEther(stakedPrincipal));

  const displaySaved = hasActiveSub ? totalSavedFloat : 45.0;
  const displayPrincipal = hasActiveSub ? principalFloat : 1155.83;
  const displayPlanName = hasActiveSub ? planName : 'Pro Pass';

  // Calculate upcoming cycle deadline
  const cycleSeconds = 30 * 86400;
  const nextMilestoneSec = hasActiveSub && startSec > 0
    ? startSec + Math.min(totalDurationSec, Math.ceil(Math.max(1, nowSec - startSec) / cycleSeconds) * cycleSeconds)
    : nowSec + 30 * 86400;

  const daysToNextDeadline = Math.max(0, Math.ceil((nextMilestoneSec - nowSec) / 86400));

  // Build platform list, incorporating custom plans dynamically
  const isCustomActive = hasActiveSub && !['Basic Pass', 'Pro Pass', 'Enterprise Pass'].includes(planName);

  const platforms = [];

  if (isCustomActive) {
    platforms.push({
      id: 'active-custom',
      name: planName,
      category: 'Custom Service',
      icon: GoogleGeminiIcon,
      monthlyRate: parseFloat(ethers.formatEther(userSubscription.monthlyFee || 0n)),
      status: 'Active • Yield Streaming',
      savedToDate: displaySaved.toFixed(2),
      deadlineSec: nextMilestoneSec,
      isCovered: true,
    });
  }

  // Standard platforms
  platforms.push(
    {
      id: 'github',
      name: 'GitHub Enterprise & Copilot',
      category: 'Developer Platform',
      icon: GithubIcon,
      monthlyRate: 10.0,
      status: hasActiveSub && !isCustomActive ? 'Active • Yield Streaming' : 'Available',
      savedToDate: (displaySaved * 0.67).toFixed(2),
      deadlineSec: nextMilestoneSec,
      isCovered: hasActiveSub && !isCustomActive,
    },
    {
      id: 'claude',
      name: 'Claude Pro & API Gateway',
      category: 'AI Compute',
      icon: ClaudeIcon,
      monthlyRate: 5.0,
      status: hasActiveSub && !isCustomActive ? 'Active • Yield Streaming' : 'Available',
      savedToDate: (displaySaved * 0.33).toFixed(2),
      deadlineSec: nextMilestoneSec,
      isCovered: hasActiveSub && !isCustomActive,
    },
    {
      id: 'gemini',
      name: 'Gemini Advanced & Workspace',
      category: 'Multimodal AI',
      icon: GoogleGeminiIcon,
      monthlyRate: 20.0,
      status: planName.includes('Gemini') ? 'Active • Yield Streaming' : 'Custom Plan',
      savedToDate: planName.includes('Gemini') ? displaySaved.toFixed(2) : '0.00',
      deadlineSec: nextMilestoneSec,
      isCovered: planName.includes('Gemini'),
    },
    {
      id: 'tradingview',
      name: 'TradingView Pro+ Analytics',
      category: 'Market Intelligence',
      icon: TradingViewIcon,
      monthlyRate: 10.0,
      status: planName.includes('Enterprise') ? 'Active • Yield Streaming' : 'Enterprise Tier',
      savedToDate: planName.includes('Enterprise') ? '20.00' : '0.00',
      deadlineSec: nextMilestoneSec,
      isCovered: planName.includes('Enterprise'),
    }
  );

  return (
    <div className="space-y-6">
      {/* 1. Header with Direct Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${hasActiveSub ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
            <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
              {hasActiveSub ? `ACTIVE POSITION: ${displayPlanName.toUpperCase()}` : 'PORTFOLIO STANDBY'}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-sans mt-0.5">
            Subscription Portfolio
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('plans')}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add / Browse Plans</span>
          </button>

          <button
            onClick={() => onNavigate('subscriptions')}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>Playback Stream</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Three Key Metrics (Direct & Obvious) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Saved */}
        <div className="surface-panel rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] font-mono text-slate-400">Total Fees Saved</div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-600 dark:text-[#00e599] mt-1">
            ${displaySaved.toFixed(2)} <span className="text-xs font-normal text-slate-400">mUSDC</span>
          </div>
          <div className="text-[11px] font-mono text-slate-500 mt-1">
            Out-of-Pocket: <span className="font-semibold text-slate-700 dark:text-slate-300">$0.00</span>
          </div>
        </div>

        {/* Collateral */}
        <div className="surface-panel rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] font-mono text-slate-400">Staked Collateral</div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white mt-1">
            {displayPrincipal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}{' '}
            <span className="text-xs font-normal text-slate-400">mUSDC</span>
          </div>
          <div className="text-[11px] font-mono text-slate-500 mt-1">
            100% Principal Refundable
          </div>
        </div>

        {/* Next Deadline */}
        <div className="surface-panel rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] font-mono text-slate-400">Next Billing Deadline</div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white mt-1">
            {formatTimestamp(nextMilestoneSec)}
          </div>
          <div className="text-[11px] font-mono text-slate-500 mt-1">
            {daysToNextDeadline > 0 ? `In ${daysToNextDeadline} Days` : 'Due for Harvest'}
          </div>
        </div>
      </div>

      {/* 3. Subscribed Platforms Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white font-sans uppercase tracking-wider">
            Covered Digital Platforms
          </h2>
          <span className="text-xs font-mono text-slate-400">
            {platforms.filter(p => p.isCovered).length} Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {platforms.map((platform) => {
            const Icon = platform.icon;
            const isLive = platform.isCovered;

            return (
              <div
                key={platform.id}
                className={`surface-panel rounded-xl p-4 border transition flex items-center justify-between ${
                  isLive
                    ? 'border-slate-200 dark:border-slate-800 shadow-sm'
                    : 'border-slate-200/60 dark:border-slate-800/60 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isLive
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white font-sans">
                      {platform.name}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">
                      ${platform.monthlyRate.toFixed(2)}/mo • {platform.category}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-[11px] font-mono font-bold ${
                    isLive ? 'text-emerald-600 dark:text-[#00e599]' : 'text-slate-400'
                  }`}>
                    {isLive ? `+$${platform.savedToDate} Saved` : 'Available'}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">
                    {isLive ? `Due ${formatTimestamp(platform.deadlineSec)}` : 'Stake to unlock'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Settlement Schedule & Maturity */}
      <div className="surface-panel rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white font-sans uppercase tracking-wider">
            Settlement Timeline
          </h2>
          <span className="text-xs font-mono text-slate-400">
            Cadence: Monthly (30d)
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/60 mt-1">
          <div className="py-2.5 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="text-slate-900 dark:text-white font-medium">Cycle 01 Yield Harvest</span>
              <span className="text-[10px] text-slate-400">({formatTimestamp(hasActiveSub && startSec > 0 ? startSec + 30 * 86400 : nowSec + 30 * 86400)})</span>
            </div>
            <div className="font-bold text-emerald-600 dark:text-[#00e599]">
              {hasActiveSub && settledFloat >= 14.9 ? '✓ Settled' : '$15.00 mUSDC Yield'}
            </div>
          </div>

          <div className="py-2.5 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
              <span className="text-slate-900 dark:text-white font-medium">Cycle 02 Yield Harvest</span>
              <span className="text-[10px] text-slate-400">({formatTimestamp(hasActiveSub && startSec > 0 ? startSec + 60 * 86400 : nowSec + 60 * 86400)})</span>
            </div>
            <div className="font-bold text-slate-700 dark:text-slate-300">
              $15.00 mUSDC Scheduled
            </div>
          </div>

          <div className="py-2.5 flex items-center justify-between text-xs font-mono bg-emerald-500/5 dark:bg-emerald-950/20 -mx-5 px-5 rounded-lg mt-1">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-[#00e599]" />
              <span className="text-emerald-700 dark:text-[#00e599] font-bold">100% Principal Unlock</span>
              <span className="text-[10px] text-emerald-600/80">({formatTimestamp(hasActiveSub && expirySec > 0 ? expirySec : nowSec + 90 * 86400)})</span>
            </div>
            <div className="font-bold text-emerald-700 dark:text-[#00e599]">
              +{displayPrincipal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} mUSDC Refunded
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
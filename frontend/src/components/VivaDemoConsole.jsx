import React, { useState } from 'react';
import { FastForward, Clock, Cuboid, CheckSquare, Square, Sparkles, BookOpen, Calculator, Award } from 'lucide-react';
import { evmIncreaseTime } from '../utils/web3';

export default function VivaDemoConsole({ blockNumber, blockTimestamp, onActionSuccess }) {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [checkedSteps, setCheckedSteps] = useState({});

  const toggleStep = (idx) => {
    setCheckedSteps((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleTimeTravel = async (days, label) => {
    try {
      setLoading(true);
      setFeedback(`Advancing local EVM by ${label}...`);
      const seconds = days * 24 * 3600;
      await evmIncreaseTime(seconds);
      setFeedback(`Local chain advanced by ${label}! New block mined.`);
      if (onActionSuccess) await onActionSuccess();
      setTimeout(() => setFeedback(''), 3000);
    } catch (err) {
      console.error(err);
      setFeedback(`RPC error: ${err.message || 'Operation failed'}`);
      setTimeout(() => setFeedback(''), 4500);
    } finally {
      setLoading(false);
    }
  };

  const formattedDate = blockTimestamp
    ? new Date(blockTimestamp * 1000).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : 'Syncing...';

  const vivaSteps = [
    {
      title: '1. Test Wallet & Collateral Faucet',
      desc: 'Connect as Alice (Test Subscriber) and verify starting balance or click +1k Faucet to mint mock tokens.',
    },
    {
      title: '2. Duration-Adjusted Stake Demonstration',
      desc: 'In the Plans tab, toggle between 30-Day and 365-Day locks. Highlight to the professor how required stake drops from ~1,520 to ~608 mUSDC (60% discount) due to 24% APY + 20% loyalty incentive.',
    },
    {
      title: '3. Collateral Staking & Subscription Activation',
      desc: 'Click "Stake & Activate Pass". Show contract approval and custody transfer into the Mock Yield Pool.',
    },
    {
      title: '4. EVM Time-Travel Simulation',
      desc: 'Use the fast-forward controls above (+30 Days). Show how block.timestamp advances and interest accrues linearly on the local node.',
    },
    {
      title: '5. Settle Accrued Interest to Provider Treasury',
      desc: 'Click "Settle Yield". Show that the harvested interest is routed directly to the Service Provider Treasury while the subscriber principal remains 100% intact.',
    },
    {
      title: '6. Early-Withdrawal Revert Verification',
      desc: 'Attempt to withdraw principal before the lock expiry. Show the professor that the smart contract strictly enforces lock timestamps and reverts with LockPeriodNotExpired.',
    },
    {
      title: '7. Lock Maturity & 100% Principal Recovery',
      desc: 'Fast forward past maturity (+365 Days). Click "Withdraw Principal" to recover 100% of staked funds back to the subscriber wallet.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-[#1f2430] pb-4">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-emerald-600 dark:text-[#00e599]" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            College Viva & Simulation Console (26B16CS317)
          </h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Dedicated evaluation panel to control local EVM time-travel, demonstrate smart contract execution, and step through the viva checklist.
        </p>
      </div>

      {/* EVM Time-Travel Machine Box */}
      <div className="surface-panel rounded-2xl p-6 border border-slate-200 dark:border-[#1f2430] shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#1f2430]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Local EVM Time-Travel Machine
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Manipulates local Hardhat node timestamps (<code className="text-emerald-600 dark:text-[#00e599]">evm_increaseTime</code> & <code className="text-emerald-600 dark:text-[#00e599]">evm_mine</code>) to simulate months of yield accrual instantly.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#0b0c10] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#1b1f2b]">
              <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-[#00e599]" />
              <span>Time: <strong className="text-slate-900 dark:text-white">{formattedDate}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#0b0c10] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#1b1f2b]">
              <Cuboid className="w-3.5 h-3.5 text-emerald-600 dark:text-[#00e599]" />
              <span>Block: <strong className="text-slate-900 dark:text-white">#{blockNumber ?? '...'}</strong></span>
            </div>
          </div>
        </div>

        {/* Stepper Buttons */}
        <div className="pt-4 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Advance Blockchain Clock:
          </span>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleTimeTravel(1, '+1 Day')}
              disabled={loading}
              className="px-3.5 py-1.5 rounded-lg bg-slate-100 dark:bg-[#161922] hover:bg-slate-200 dark:hover:bg-[#202534] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#262c3c] text-xs font-mono transition disabled:opacity-50"
            >
              +1 Day
            </button>
            <button
              onClick={() => handleTimeTravel(7, '+7 Days')}
              disabled={loading}
              className="px-3.5 py-1.5 rounded-lg bg-slate-100 dark:bg-[#161922] hover:bg-slate-200 dark:hover:bg-[#202534] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#262c3c] text-xs font-mono transition disabled:opacity-50"
            >
              +7 Days
            </button>
            <button
              onClick={() => handleTimeTravel(30, '+30 Days (1 Month)')}
              disabled={loading}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-700/50 text-xs font-mono font-medium transition disabled:opacity-50"
            >
              +30 Days (1 Month)
            </button>
            <button
              onClick={() => handleTimeTravel(90, '+90 Days (3 Months)')}
              disabled={loading}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-700/50 text-xs font-mono font-medium transition disabled:opacity-50"
            >
              +90 Days (3 Months)
            </button>
            <button
              onClick={() => handleTimeTravel(365, '+365 Days (1 Year)')}
              disabled={loading}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 dark:bg-[#00e599] dark:hover:bg-[#00c985] text-white dark:text-[#090a0d] text-xs font-mono font-bold transition shadow-sm disabled:opacity-50"
            >
              +365 Days (1 Year)
            </button>
          </div>
        </div>

        {feedback && (
          <div className="mt-3 p-2.5 rounded-lg bg-emerald-50 dark:bg-[#0b0c10] border border-emerald-200 dark:border-[#00e599]/30 text-xs font-mono text-emerald-700 dark:text-[#00e599] flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 animate-spin shrink-0" />
            <span>{feedback}</span>
          </div>
        )}
      </div>

      {/* Interactive Viva Checklist & Mathematical Explainer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Checklist */}
        <div className="lg:col-span-2 surface-panel rounded-2xl p-6 border border-slate-200 dark:border-[#1f2430]">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#1f2430] mb-4">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-[#00e599]" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider font-sans">
                Live Viva Demonstration Checklist
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
              {Object.values(checkedSteps).filter(Boolean).length} / {vivaSteps.length} Steps Completed
            </span>
          </div>

          <div className="space-y-3">
            {vivaSteps.map((step, idx) => {
              const isDone = Boolean(checkedSteps[idx]);

              return (
                <div
                  key={idx}
                  onClick={() => toggleStep(idx)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                    isDone
                      ? 'bg-emerald-50/70 dark:bg-[#00e599]/5 border-emerald-300 dark:border-[#00e599]/30 text-slate-900 dark:text-slate-100'
                      : 'bg-slate-50/50 dark:bg-[#0b0c10] border-slate-200/80 dark:border-[#1b1f2b] hover:border-slate-300 dark:hover:border-[#262c3c]'
                  }`}
                >
                  <button className="mt-0.5 text-emerald-600 dark:text-[#00e599] shrink-0">
                    {isDone ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                  <div>
                    <h4 className={`text-xs font-bold ${isDone ? 'line-through text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                      {step.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Mathematical Formulation */}
        <div className="surface-panel rounded-2xl p-6 border border-slate-200 dark:border-[#1f2430] space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-[#1f2430]">
            <Calculator className="w-4 h-4 text-emerald-600 dark:text-[#00e599]" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider font-sans">
              Solidity Staking Math
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#0b0c10] border border-slate-200 dark:border-[#1b1f2b]">
              <div className="font-mono text-emerald-600 dark:text-[#00e599] font-semibold text-[11px]">
                1. Total Subscription Fee:
              </div>
              <div className="font-mono text-slate-800 dark:text-slate-200 mt-1">
                F_total = (F_mo × T) / 30 days
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#0b0c10] border border-slate-200 dark:border-[#1b1f2b]">
              <div className="font-mono text-emerald-600 dark:text-[#00e599] font-semibold text-[11px]">
                2. Base Required Stake:
              </div>
              <div className="font-mono text-slate-800 dark:text-slate-200 mt-1">
                S_base = (F_total × 365d × 10000) / (T × APY_bps)
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#0b0c10] border border-slate-200 dark:border-[#1b1f2b]">
              <div className="font-mono text-emerald-600 dark:text-[#00e599] font-semibold text-[11px]">
                3. Loyalty Duration Discount:
              </div>
              <div className="font-mono text-slate-800 dark:text-slate-200 mt-1">
                S = S_base × (10000 - Discount_bps) / 10000
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-200 dark:border-[#1f2430] pt-3">
            Implemented in <code className="text-emerald-600 dark:text-[#00e599]">PoolPass.sol:calculateRequiredStake()</code>. Verified across all 10 Hardhat unit & integration tests.
          </div>
        </div>
      </div>
    </div>
  );
}

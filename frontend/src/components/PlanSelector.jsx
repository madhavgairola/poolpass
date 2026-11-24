import React, { useState, useEffect } from 'react';
import {
  Check,
  ArrowRight,
  ShieldCheck,
  Loader2,
  Sparkles,
  TrendingUp,
  Calendar,
  Lock,
  Coins,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { formatToken, formatTimestamp } from '../utils/web3';
import { ethers } from 'ethers';

export default function PlanSelector({
  plans,
  durationOptions,
  poolPassContract,
  tokenContract,
  userAddress,
  blockTimestamp,
  onSubscribeSuccess,
  isUserSubscribed,
}) {
  const [selectedPlanId, setSelectedPlanId] = useState(1); // Default to Pro Pass
  const [selectedDurationIndex, setSelectedDurationIndex] = useState(1); // Default to 90 days
  const [settlementCadenceDays, setSettlementCadenceDays] = useState(30); // 30 days cadence
  const [stakeQuotes, setStakeQuotes] = useState({});
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Fetch quotes from contract for all plans based on selected duration
  useEffect(() => {
    async function fetchQuotes() {
      if (!poolPassContract || plans.length === 0 || durationOptions.length === 0) return;
      try {
        setLoadingQuote(true);
        const quotes = {};
        for (let i = 0; i < plans.length; i++) {
          const res = await poolPassContract.calculateRequiredStake(i, selectedDurationIndex);
          quotes[i] = {
            requiredStake: res[0],
            totalFee: res[1],
            durationSeconds: res[2],
            effectiveApy: res[3],
          };
        }
        setStakeQuotes(quotes);
      } catch (err) {
        console.error("Error calculating required stake:", err);
      } finally {
        setLoadingQuote(false);
      }
    }
    fetchQuotes();
  }, [poolPassContract, plans, durationOptions, selectedDurationIndex]);

  const handleSubscribe = async (planId) => {
    if (!poolPassContract || !tokenContract) return;
    try {
      setIsSubmitting(true);
      setStatusMessage('Verifying token allowance on local node...');

      const quote = stakeQuotes[planId];
      if (!quote) throw new Error("Stake quote not available");

      const poolPassAddress = await poolPassContract.getAddress();
      const currentAllowance = await tokenContract.allowance(userAddress, poolPassAddress);

      if (currentAllowance < quote.requiredStake) {
        setStatusMessage('Step 1/2: Approving token allowance...');
        const approveTx = await tokenContract.approve(poolPassAddress, ethers.MaxUint256);
        await approveTx.wait();
      }

      setStatusMessage('Step 2/2: Staking collateral & activating pass...');
      const tx = await poolPassContract.subscribe(planId, selectedDurationIndex);
      await tx.wait();

      setStatusMessage('Pass activated successfully. Staked principal is earning yield.');
      if (onSubscribeSuccess) await onSubscribeSuccess();
      setTimeout(() => setStatusMessage(''), 4000);
    } catch (err) {
      console.error(err);
      let msg = err.reason || err.message || 'Transaction failed';
      if (msg.includes("SubscriptionAlreadyActive")) {
        msg = "Active subscription in progress. Wait for lock maturity or call restake.";
      }
      setStatusMessage(`Error: ${msg}`);
      setTimeout(() => setStatusMessage(''), 6000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const planFeatures = {
    0: ['Core platform access', 'Direct protocol yield routing', 'Principal fully refunded at maturity'],
    1: ['Unlimited high-tier access', 'Priority API bandwidth', 'Higher yield efficiency tier', '100% principal recovery'],
    2: ['Custom enterprise SLAs', 'Dedicated team seats', 'Maximum APY duration multiplier', '100% principal recovery'],
  };

  const activeDuration = durationOptions[selectedDurationIndex];
  const selectedQuote = stakeQuotes[selectedPlanId];
  const selectedPlan = plans[selectedPlanId] || plans[0];

  // Calculate settlement schedule milestones based on current timestamp
  const nowSec = Number(blockTimestamp || Math.floor(Date.now() / 1000));
  const durationTotalSeconds = activeDuration ? Number(activeDuration.durationSeconds) : 30 * 86400;
  const cadenceSeconds = settlementCadenceDays * 86400;
  const numCycles = Math.max(1, Math.round(durationTotalSeconds / cadenceSeconds));

  const totalFeeFloat = selectedQuote ? parseFloat(ethers.formatEther(selectedQuote.totalFee)) : 15.0;
  const cycleFee = (totalFeeFloat / numCycles).toFixed(2);
  const unlockDateSec = nowSec + durationTotalSeconds;

  const milestones = [];
  for (let c = 1; c <= numCycles; c++) {
    const cycleDueSec = nowSec + Math.round((c * durationTotalSeconds) / numCycles);
    milestones.push({
      cycle: c,
      dueSec: cycleDueSec,
      amount: cycleFee,
      isFinal: c === numCycles,
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
          Subscription Plans & Duration Staking Matrix
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Select your subscription tier and commitment duration. Longer locks reward you with higher lending APY and loyalty discounts.
        </p>
      </div>

      {/* Duration Selector Tabs */}
      <div className="surface-panel rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-sans">
              1. Select Lock Duration Schedule
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Duration incentives reduce the required upfront collateral needed to fund the plan.
            </p>
          </div>
          {activeDuration && (
            <div className="text-xs font-mono text-emerald-700 dark:text-[#00e599] bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20 self-start sm:self-auto font-medium">
              Effective APY: {(Number(activeDuration.apyBps) / 100).toFixed(0)}%
              {Number(activeDuration.discountBps) > 0 && ` • -${(Number(activeDuration.discountBps) / 100).toFixed(0)}% Stake Discount`}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {durationOptions.map((opt, idx) => {
            const isSelected = selectedDurationIndex === idx;
            const apy = (Number(opt.apyBps) / 100).toFixed(0);
            const discount = (Number(opt.discountBps) / 100).toFixed(0);

            return (
              <button
                key={idx}
                onClick={() => setSelectedDurationIndex(idx)}
                className={`p-3 rounded-xl text-left transition border cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 dark:bg-slate-800 border-slate-900 dark:border-[#00e599] text-white shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold">{opt.label}</div>
                <div className="flex items-center gap-2 mt-1 text-[11px] font-mono">
                  <span className={isSelected ? 'text-emerald-400 dark:text-[#00e599]' : 'text-slate-500 dark:text-slate-400'}>
                    {apy}% APY
                  </span>
                  {Number(discount) > 0 && (
                    <span className="text-slate-400">(-{discount}%)</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Subscription Tier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {plans.map((plan) => {
          const id = Number(plan.id);
          const isSelected = selectedPlanId === id;
          const quote = stakeQuotes[id];

          return (
            <div
              key={id}
              onClick={() => setSelectedPlanId(id)}
              className={`surface-panel rounded-2xl p-6 transition flex flex-col justify-between cursor-pointer border ${
                isSelected
                  ? 'border-emerald-600 dark:border-[#00e599] ring-2 ring-emerald-500/20 shadow-lg'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-baseline justify-between mb-2">
                  <h4 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">{plan.name}</h4>
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                    Tier 0{id + 1}
                  </span>
                </div>

                <div className="mb-4">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                      ${formatToken(plan.monthlyFee, 0)}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">/mo nominal fee</span>
                  </div>
                  <div className="text-xs text-emerald-600 dark:text-[#00e599] mt-0.5 font-mono font-medium">
                    Zero net cost • 100% yield funded
                  </div>
                </div>

                {/* Staking Requirement Callout */}
                <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 mb-5">
                  <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Required Upfront Stake:</div>
                  <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                    {quote ? formatToken(quote.requiredStake, 2) : '...'} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">mUSDC</span>
                  </div>
                  {quote && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-500 dark:text-slate-400 flex justify-between">
                      <span>Total Yield Target:</span>
                      <span className="text-slate-800 dark:text-slate-200">${formatToken(quote.totalFee, 2)}</span>
                    </div>
                  )}
                </div>

                {/* Features */}
                <div className="space-y-2 mb-6">
                  {(planFeatures[id] || []).map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-[#00e599] shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSubscribe(id);
                  }}
                  disabled={isSubmitting || isUserSubscribed}
                  className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer ${
                    isUserSubscribed
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700'
                      : isSelected
                      ? 'bg-emerald-600 hover:bg-emerald-700 dark:bg-[#00e599] dark:hover:bg-[#00c985] text-white dark:text-[#090a0d] shadow-sm'
                      : 'bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white dark:text-slate-200'
                  }`}
                >
                  {isSubmitting && selectedPlanId === id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isUserSubscribed ? (
                    'Subscription Currently Active'
                  ) : (
                    <>
                      <span>Stake & Activate Pass</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. Projected Billing Milestones & Settlement Schedule Preview */}
      <div className="surface-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600 dark:text-[#00e599]" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white font-sans uppercase tracking-wider">
                Projected Billing Schedule & Settlement Dates for {selectedPlan ? selectedPlan.name : 'Selected Plan'}
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Review exactly when yield is scheduled to settle and when your 100% principal unlocks.
            </p>
          </div>

          {/* Cadence Selector */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-500 dark:text-slate-400">Cadence:</span>
            <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-50 dark:bg-slate-900">
              <button
                onClick={() => setSettlementCadenceDays(30)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                  settlementCadenceDays === 30
                    ? 'bg-slate-900 dark:bg-slate-800 text-white'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                Monthly (30d)
              </button>
              <button
                onClick={() => setSettlementCadenceDays(14)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                  settlementCadenceDays === 14
                    ? 'bg-slate-900 dark:bg-slate-800 text-white'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                Bi-Weekly (14d)
              </button>
            </div>
          </div>
        </div>

        {/* Milestones Flow */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          {milestones.map((m) => (
            <div
              key={m.cycle}
              className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 relative flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 mb-1">
                  <span>Cycle 0{m.cycle}</span>
                  <span className="text-emerald-600 dark:text-[#00e599] font-bold">Yield Harvest</span>
                </div>
                <div className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                  ${m.amount} <span className="text-[11px] font-normal text-slate-400">mUSDC</span>
                </div>
                <div className="text-xs font-mono text-slate-600 dark:text-slate-300 mt-2">
                  Due: <strong>{formatTimestamp(m.dueSec)}</strong>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800/80 text-[10px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-500" />
                <span>Auto-routed to Treasury</span>
              </div>
            </div>
          ))}

          {/* Maturity & Return Box */}
          <div className="p-3.5 rounded-xl bg-emerald-500/5 dark:bg-[#00e599]/5 border border-emerald-500/20 relative flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-[11px] font-mono text-emerald-700 dark:text-[#00e599] mb-1 font-bold">
                <span>Lock Maturity</span>
                <span>100% Recovery</span>
              </div>
              <div className="text-sm font-bold font-mono text-emerald-700 dark:text-[#00e599]">
                {selectedQuote ? formatToken(selectedQuote.requiredStake, 0) : '...'} mUSDC
              </div>
              <div className="text-xs font-mono text-slate-700 dark:text-slate-300 mt-2">
                Unlocked: <strong>{formatTimestamp(unlockDateSec)}</strong>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-emerald-500/20 text-[10px] font-mono text-emerald-700 dark:text-[#00e599] flex items-center gap-1 font-medium">
              <ShieldCheck className="w-3 h-3" />
              <span>Full Principal Recovered</span>
            </div>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-emerald-500/40 text-xs font-mono text-emerald-700 dark:text-[#00e599] flex items-center gap-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import {
  Check,
  ArrowRight,
  ShieldCheck,
  Loader2,
  Plus,
  X,
  Sparkles,
  Calendar,
  Layers,
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
  onPlanCreated,
  onSubscribeSuccess,
  isUserSubscribed,
}) {
  const [selectedPlanId, setSelectedPlanId] = useState(1);
  const [selectedDurationIndex, setSelectedDurationIndex] = useState(1);
  const [settlementCadenceDays, setSettlementCadenceDays] = useState(30);
  const [stakeQuotes, setStakeQuotes] = useState({});
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Custom Plan Creation State
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customFee, setCustomFee] = useState('20');
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);

  const presets = [
    { name: 'Gemini Pro', fee: '20' },
    { name: 'Cursor Pro', fee: '20' },
    { name: 'ChatGPT Plus', fee: '20' },
    { name: 'Spotify Premium', fee: '11' },
    { name: 'Netflix 4K', fee: '23' },
  ];

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

  // Handle Custom Plan Creation on Blockchain
  const handleCreateCustomPlan = async (e) => {
    e?.preventDefault();
    if (!poolPassContract || !customName.trim() || !customFee || Number(customFee) <= 0) return;
    try {
      setIsCreatingCustom(true);
      setStatusMessage(`Registering "${customName.trim()}" on blockchain...`);

      const feeWei = ethers.parseEther(customFee.toString());
      const tx = await poolPassContract.createCustomPlan(customName.trim(), feeWei);
      await tx.wait();

      setStatusMessage(`✓ Plan "${customName.trim()}" added to protocol.`);
      if (onPlanCreated) await onPlanCreated();

      setShowCustomModal(false);
      setCustomName('');
      setCustomFee('20');
      setTimeout(() => setStatusMessage(''), 3500);
    } catch (err) {
      console.error(err);
      setStatusMessage(`Creation failed: ${err.reason || err.message}`);
      setTimeout(() => setStatusMessage(''), 5000);
    } finally {
      setIsCreatingCustom(false);
    }
  };

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
        setStatusMessage('Step 1/2: Approving collateral allowance...');
        const approveTx = await tokenContract.approve(poolPassAddress, ethers.MaxUint256);
        await approveTx.wait();
      }

      setStatusMessage('Step 2/2: Staking collateral & activating pass...');
      const tx = await poolPassContract.subscribe(planId, selectedDurationIndex);
      await tx.wait();

      setStatusMessage('Pass activated. Collateral is streaming yield.');
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

  const activeDuration = durationOptions[selectedDurationIndex];
  const selectedQuote = stakeQuotes[selectedPlanId];
  const selectedPlan = plans[selectedPlanId] || plans[0];

  // Settlement schedule calculations
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
      {/* Header & Add Custom Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight font-sans">
            Subscription Plans
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Choose a tier or add any digital subscription. Principal is 100% refundable at lock maturity.
          </p>
        </div>

        <button
          onClick={() => setShowCustomModal(true)}
          className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Custom Subscription</span>
        </button>
      </div>

      {/* Lock Duration Options */}
      <div className="surface-panel rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-2.5">
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 font-sans">
            Commitment Schedule
          </span>
          {activeDuration && (
            <span className="text-[11px] font-mono text-emerald-600 dark:text-[#00e599] font-medium">
              {(Number(activeDuration.apyBps) / 100).toFixed(0)}% APY
              {Number(activeDuration.discountBps) > 0 && ` • -${(Number(activeDuration.discountBps) / 100).toFixed(0)}% Stake Discount`}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                    ? 'bg-slate-900 dark:bg-slate-800 border-slate-900 dark:border-emerald-500 text-white shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold font-sans">{opt.label}</div>
                <div className="text-[11px] font-mono mt-0.5">
                  <span className={isSelected ? 'text-emerald-400 dark:text-[#00e599]' : 'text-slate-500'}>
                    {apy}% APY
                  </span>
                  {Number(discount) > 0 && (
                    <span className="ml-1 text-slate-400 font-normal">(-{discount}%)</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4">
        {plans.map((plan) => {
          const id = Number(plan.id);
          const isSelected = selectedPlanId === id;
          const quote = stakeQuotes[id];
          const isCustom = id >= 3;

          return (
            <div
              key={id}
              onClick={() => setSelectedPlanId(id)}
              className={`surface-panel rounded-2xl p-5 transition flex flex-col justify-between cursor-pointer border ${
                isSelected
                  ? 'border-emerald-500 dark:border-[#00e599] ring-2 ring-emerald-500/20 shadow-md'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white font-sans tracking-tight">
                    {plan.name}
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {isCustom ? 'Custom' : `Tier 0${id + 1}`}
                  </span>
                </div>

                <div className="mb-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                      ${formatToken(plan.monthlyFee, 0)}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">/mo</span>
                  </div>
                  <div className="text-[11px] font-mono text-emerald-600 dark:text-[#00e599] mt-0.5 font-medium">
                    100% Yield-Covered
                  </div>
                </div>

                {/* Stake Callout */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 mb-4">
                  <div className="text-[10px] font-mono text-slate-400">Required Collateral Deposit:</div>
                  <div className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                    {quote ? formatToken(quote.requiredStake, 0) : '...'} <span className="text-xs font-normal text-slate-400">mUSDC</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 mt-1 flex justify-between pt-1.5 border-t border-slate-200/60 dark:border-slate-800/60">
                    <span>Yield Target:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">${quote ? formatToken(quote.totalFee, 2) : '...'}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSubscribe(id);
                }}
                disabled={isSubmitting || isUserSubscribed}
                className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  isUserSubscribed
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-slate-700'
                    : isSelected
                    ? 'bg-emerald-600 hover:bg-emerald-700 dark:bg-[#00e599] dark:hover:bg-[#00c985] text-white dark:text-slate-950 shadow-sm'
                    : 'bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white'
                }`}
              >
                {isSubmitting && selectedPlanId === id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isUserSubscribed ? (
                  'Subscription Active'
                ) : (
                  <>
                    <span>Stake & Activate</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Projected Settlement Timeline */}
      <div className="surface-panel rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white font-sans">
              Settlement Schedule: {selectedPlan ? selectedPlan.name : 'Selected Plan'}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Yield settlements route to provider treasury. Principal unlocks on maturity date.
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-mono">
            <button
              onClick={() => setSettlementCadenceDays(30)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                settlementCadenceDays === 30
                  ? 'bg-slate-900 dark:bg-slate-800 text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Monthly (30d)
            </button>
            <button
              onClick={() => setSettlementCadenceDays(14)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                settlementCadenceDays === 14
                  ? 'bg-slate-900 dark:bg-slate-800 text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Bi-Weekly (14d)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 mt-3">
          {milestones.map((m) => (
            <div
              key={m.cycle}
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 flex flex-col justify-between"
            >
              <div>
                <div className="text-[10px] font-mono text-slate-400">Cycle 0{m.cycle} Harvest</div>
                <div className="text-sm font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                  ${m.amount} <span className="text-[10px] font-normal text-slate-400">mUSDC</span>
                </div>
              </div>
              <div className="text-[11px] font-mono text-slate-600 dark:text-slate-300 mt-2">
                Due: <strong>{formatTimestamp(m.dueSec)}</strong>
              </div>
            </div>
          ))}

          <div className="p-3 rounded-xl bg-emerald-500/5 dark:bg-[#00e599]/5 border border-emerald-500/20 flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-mono text-emerald-700 dark:text-[#00e599] font-bold">100% Collateral Recovery</div>
              <div className="text-sm font-bold font-mono text-emerald-700 dark:text-[#00e599] mt-0.5">
                +{selectedQuote ? formatToken(selectedQuote.requiredStake, 0) : '...'} mUSDC
              </div>
            </div>
            <div className="text-[11px] font-mono text-slate-700 dark:text-slate-300 mt-2">
              Unlocked: <strong>{formatTimestamp(unlockDateSec)}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Add Custom Subscription Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="surface-panel rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-sans">
                  Add Custom Subscription
                </h3>
              </div>
              <button
                onClick={() => setShowCustomModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Templates */}
            <div>
              <div className="text-[11px] font-mono text-slate-400 mb-1.5">Quick Presets:</div>
              <div className="flex flex-wrap gap-1.5">
                {presets.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => {
                      setCustomName(p.name);
                      setCustomFee(p.fee);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-mono text-slate-700 dark:text-slate-300 transition cursor-pointer"
                  >
                    {p.name} (${p.fee})
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleCreateCustomPlan} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Service / Tool Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gemini Pro, Netflix, Cursor"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-sans text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Monthly Subscription Fee (mUSDC)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="10000"
                  step="1"
                  placeholder="20"
                  value={customFee}
                  onChange={(e) => setCustomFee(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingCustom || !customName.trim()}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-[#00e599] dark:hover:bg-[#00c985] text-white dark:text-slate-950 font-bold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                >
                  {isCreatingCustom ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <span>Register on Chain</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {statusMessage && (
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-emerald-500/40 text-xs font-mono text-emerald-700 dark:text-[#00e599] flex items-center gap-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  TrendingUp,
  ArrowDownToLine,
  CheckCircle2,
  Clock,
  Sparkles,
  Calendar,
  ShieldCheck,
  Loader2,
  ExternalLink,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { formatToken, formatTimeRemaining, formatTimestamp, fetchUserActivity } from '../utils/web3';
import { ethers } from 'ethers';

export default function ActiveSubscription({
  subscription,
  poolPassContract,
  userAddress,
  blockTimestamp,
  onActionSuccess,
}) {
  const [loadingAction, setLoadingAction] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [activityHistory, setActivityHistory] = useState([]);
  const [streamTick, setStreamTick] = useState(0);

  if (!subscription || !subscription.stakedPrincipal || subscription.stakedPrincipal === 0n || subscription.isWithdrawn) {
    return null;
  }

  const {
    planName,
    monthlyFee,
    stakedPrincipal,
    startTime,
    lockExpiry,
    targetFeeTotal,
    yieldSettled,
    currentAccruedYield,
    isActive,
    timeRemaining,
  } = subscription;

  const isMatured = Number(timeRemaining || 0n) === 0;

  // Load user on-chain events
  useEffect(() => {
    async function loadActivity() {
      if (!poolPassContract || !userAddress) return;
      try {
        const events = await fetchUserActivity(poolPassContract, userAddress);
        setActivityHistory(events);
      } catch (err) {
        console.error("Error fetching activity:", err);
      }
    }
    loadActivity();
  }, [poolPassContract, userAddress, yieldSettled, streamTick]);

  // Micro-streaming counter effect for realistic live decimal movement
  useEffect(() => {
    const timer = setInterval(() => {
      setStreamTick((prev) => prev + 1);
    }, 150);
    return () => clearInterval(timer);
  }, []);

  // Compute total duration and cycle milestones
  const startSec = Number(startTime || 0n);
  const expirySec = Number(lockExpiry || 0n);
  const currentSec = Number(blockTimestamp || Math.floor(Date.now() / 1000));
  const totalDurationSec = Math.max(1, expirySec - startSec);

  // Standard cycle: 30 days = 2,592,000s
  const cycleSeconds = 30 * 86400;
  const totalCycles = Math.max(1, Math.round(totalDurationSec / cycleSeconds));

  const monthlyFeeFloat = parseFloat(ethers.formatEther(monthlyFee || 0n));
  const targetFeeFloat = parseFloat(ethers.formatEther(targetFeeTotal || 0n));
  const yieldSettledFloat = parseFloat(ethers.formatEther(yieldSettled || 0n));
  const accruedFloat = parseFloat(ethers.formatEther(currentAccruedYield || 0n));

  // Milestone breakdown
  const cycleFeeFloat = totalCycles > 0 ? targetFeeFloat / totalCycles : monthlyFeeFloat;
  let activeUnpaidIndex = -1;
  const cycles = [];

  for (let i = 0; i < totalCycles; i++) {
    const cycleDueSec = startSec + Math.round(((i + 1) * totalDurationSec) / totalCycles);
    const cumulativeDue = (i + 1) * cycleFeeFloat;
    const isPastDue = currentSec >= cycleDueSec;
    const isFullyPaid = yieldSettledFloat >= cumulativeDue - 0.1;

    if (!isFullyPaid && activeUnpaidIndex === -1) {
      activeUnpaidIndex = i;
    }

    cycles.push({
      cycleNumber: i + 1,
      dueTimestamp: cycleDueSec,
      amountDue: cycleFeeFloat,
      cumulativeDue,
      isFullyPaid,
      isPastDue,
    });
  }

  // If all are paid, activeUnpaidIndex is totalCycles - 1
  if (activeUnpaidIndex === -1) {
    activeUnpaidIndex = totalCycles - 1;
  }

  // Assign isCurrent
  cycles.forEach((c, idx) => {
    c.isCurrent = idx === activeUnpaidIndex && !c.isFullyPaid;
  });

  // Next due payment info
  const nextUnpaidCycle = cycles.find((c) => !c.isFullyPaid) || cycles[cycles.length - 1];
  const nextDueAmount = nextUnpaidCycle ? nextUnpaidCycle.amountDue : cycleFeeFloat;

  // Calculate funded progress for the active cycle
  const priorSettled = activeUnpaidIndex > 0 ? activeUnpaidIndex * cycleFeeFloat : 0;
  const settledInActiveCycle = Math.max(0, yieldSettledFloat - priorSettled);
  const activeCycleFunded = Math.min(nextDueAmount, settledInActiveCycle + accruedFloat);
  const currentAccruedProgress = nextDueAmount > 0
    ? Math.min(100, Math.round((activeCycleFunded / nextDueAmount) * 100))
    : 100;

  // Total yield coverage percentage
  let coveragePercent = 0;
  if (targetFeeFloat > 0) {
    coveragePercent = Math.min(100, Math.round(((yieldSettledFloat + accruedFloat) / targetFeeFloat) * 100));
  }

  // Manual Settle Handler
  const handleSettle = async () => {
    if (!poolPassContract) return;
    try {
      setLoadingAction(true);
      setActionMessage('Harvesting accrued yield to Provider Treasury...');
      const tx = await poolPassContract.settleYield(userAddress);
      await tx.wait();
      setActionMessage('Yield successfully settled to Provider Treasury.');
      if (onActionSuccess) await onActionSuccess();
      setTimeout(() => setActionMessage(''), 4000);
    } catch (err) {
      console.error(err);
      setActionMessage(`Settlement failed: ${err.reason || err.message}`);
      setTimeout(() => setActionMessage(''), 5000);
    } finally {
      setLoadingAction(false);
    }
  };

  // Manual Withdraw Handler
  const handleWithdraw = async () => {
    if (!poolPassContract) return;
    try {
      setLoadingAction(true);
      setActionMessage('Withdrawing 100% staked principal back to wallet...');
      const tx = await poolPassContract.withdrawPrincipal();
      await tx.wait();
      setActionMessage('Principal successfully recovered! All tokens returned.');
      if (onActionSuccess) await onActionSuccess();
      setTimeout(() => setActionMessage(''), 5000);
    } catch (err) {
      console.error(err);
      let msg = err.reason || err.message;
      if (msg.includes("LockPeriodNotExpired")) {
        msg = "Lock period has not expired yet. Staked principal remains locked until maturity.";
      }
      setActionMessage(`Withdraw failed: ${msg}`);
      setTimeout(() => setActionMessage(''), 5000);
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Subscription Status & Metrics Card */}
      <div className="surface-panel rounded-2xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Header bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white font-sans">{planName || 'Active Yield Pass'}</h3>
              <span
                className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold ${
                  isMatured
                    ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-400/30'
                    : 'bg-emerald-500/10 text-emerald-700 dark:text-[#00e599] border border-emerald-500/20'
                }`}
              >
                {isMatured ? 'LOCK MATURED (UNLOCKED)' : 'ACTIVE POSITION'}
              </span>
            </div>
            <div className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1">
              Lock Maturity Status: <span className="text-slate-900 dark:text-white font-medium">{formatTimeRemaining(timeRemaining)}</span>
              <span className="mx-2">•</span>
              Expires: <span className="text-slate-700 dark:text-slate-300">{formatTimestamp(lockExpiry)}</span>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSettle}
              disabled={loadingAction || currentAccruedYield === 0n}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-mono text-emerald-700 dark:text-[#00e599] border border-emerald-500/30 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 font-medium cursor-pointer"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Settle Yield ({formatToken(currentAccruedYield, 2)} mUSDC)
            </button>

            <button
              onClick={handleWithdraw}
              disabled={loadingAction || !isMatured}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
                isMatured
                  ? 'bg-emerald-600 hover:bg-emerald-700 dark:bg-[#00e599] dark:hover:bg-[#00c985] text-white dark:text-[#090a0d] shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800 cursor-not-allowed'
              }`}
              title={!isMatured ? "Locked until maturity countdown reaches zero" : "Recover 100% of your initial stake"}
            >
              <ArrowDownToLine className="w-3.5 h-3.5" />
              Withdraw Principal ({formatToken(stakedPrincipal, 0)} mUSDC)
            </button>
          </div>
        </div>

        {/* Position Metrics Ledger */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-5">
          <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Locked Principal</div>
            <div className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-1">
              {formatToken(stakedPrincipal)} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">mUSDC</span>
            </div>
            <div className="text-[10px] font-mono text-emerald-600 dark:text-[#00e599] mt-0.5 font-medium">100% Refundable at Lock Expiry</div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
              <span>Accrued Yield</span>
              <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                <Zap className="w-3 h-3 fill-current animate-pulse" />
                Streaming
              </span>
            </div>
            <div className="text-lg font-bold font-mono text-emerald-600 dark:text-[#00e599] mt-1">
              +{formatToken(currentAccruedYield, 3)} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">mUSDC</span>
            </div>
            <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">Earning in Aave Mock Pool</div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Yield Settled to Treasury</div>
            <div className="text-lg font-bold font-mono text-slate-900 dark:text-slate-200 mt-1">
              {formatToken(yieldSettled, 2)} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">mUSDC</span>
            </div>
            <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">Paid to Service Provider</div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Cycle Target Fee</div>
            <div className="text-lg font-bold font-mono text-slate-900 dark:text-slate-200 mt-1">
              {formatToken(targetFeeTotal, 2)} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">mUSDC</span>
            </div>
            <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">{coveragePercent}% Target Funded</div>
          </div>
        </div>

        {/* Next Scheduled Payment Milestone Banner */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-[#00e599]" />
              <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                Next Billing Milestone: Cycle #{nextUnpaidCycle ? nextUnpaidCycle.cycleNumber : totalCycles}
              </span>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                Due: {nextUnpaidCycle ? formatTimestamp(nextUnpaidCycle.dueTimestamp) : 'Completed'}
              </span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Target payment: <strong className="text-slate-900 dark:text-white font-mono">${nextDueAmount.toFixed(2)} mUSDC</strong> (Settled from generated yield)
            </div>
          </div>

          {/* Progress towards this cycle */}
          <div className="w-full md:w-64 space-y-1.5">
            <div className="flex justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
              <span>Cycle Funding:</span>
              <span className="text-emerald-600 dark:text-[#00e599] font-bold">
                {currentAccruedProgress}% (${accruedFloat.toFixed(2)} / ${nextDueAmount.toFixed(2)})
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-emerald-500 dark:bg-[#00e599] transition-all duration-300 rounded-full"
                style={{ width: `${currentAccruedProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Global Yield Coverage Meter */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
            <span>Overall Subscription Fee Coverage:</span>
            <span className="text-emerald-600 dark:text-[#00e599] font-bold">{coveragePercent}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-900 overflow-hidden border border-slate-200 dark:border-slate-800">
            <div
              className="h-full bg-emerald-500 dark:bg-[#00e599] transition-all duration-300 rounded-full"
              style={{ width: `${coveragePercent}%` }}
            />
          </div>
        </div>

        {actionMessage && (
          <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-emerald-500/30 text-xs font-mono text-emerald-700 dark:text-[#00e599] flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>{actionMessage}</span>
          </div>
        )}
      </div>

      {/* 3. Scheduled Payment Cycles & Billing Milestones */}
      <div className="surface-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white font-sans uppercase tracking-wider">
              Automated Billing Schedule & Settlement Milestones
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Every cycle fee is harvested directly from protocol lending yield without touching your principal.
            </p>
          </div>
          <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
            Cadence: <span className="text-slate-800 dark:text-slate-200 font-bold">Monthly (Every 30 Days)</span>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/60 mt-2">
          {cycles.map((c) => (
            <div key={c.cycleNumber} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs font-bold ${
                    c.isFullyPaid
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-[#00e599] border border-emerald-500/20'
                      : c.isCurrent
                      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 animate-pulse'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  0{c.cycleNumber}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white font-sans">
                    Cycle #{c.cycleNumber} Settlement Due
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    Scheduled Date: {formatTimestamp(c.dueTimestamp)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                    ${c.amountDue.toFixed(2)} mUSDC
                  </div>
                  <div className="text-[10px] font-mono text-emerald-600 dark:text-[#00e599]">
                    100% Yield Funded
                  </div>
                </div>

                <div className="w-32 text-right">
                  {c.isFullyPaid ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-700 dark:text-[#00e599] border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" />
                      Paid via Yield
                    </span>
                  ) : c.isCurrent ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-mono font-bold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
                      <Clock className="w-3 h-3" />
                      Accruing ({currentAccruedProgress}%)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800">
                      Scheduled
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. On-Chain Activity Feed (Receipts) */}
      <div className="surface-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white font-sans uppercase tracking-wider">
              On-Chain Activity & Settlement Receipts
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Cryptographically verified billing logs recorded directly on the local blockchain.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
            {activityHistory.length} Event{activityHistory.length === 1 ? '' : 's'} Logged
          </span>
        </div>

        {activityHistory.length === 0 ? (
          <div className="text-center py-6 text-xs font-mono text-slate-400 dark:text-slate-500">
            No on-chain events yet. Start the playback simulation or trigger settlement to generate verifiable receipts.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60 mt-2">
            {activityHistory.map((act, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2.5">
                  <div className={`w-2 h-2 rounded-full ${
                    act.type === 'YIELD_SETTLEMENT' ? 'bg-emerald-500' : 'bg-blue-500'
                  }`} />
                  <div>
                    <div className="text-slate-900 dark:text-white font-bold">{act.title}</div>
                    <div className="text-[10px] text-slate-400">
                      Tx: {act.txHash ? `${act.txHash.slice(0, 10)}...${act.txHash.slice(-8)}` : 'Local Call'} • {formatTimestamp(act.timestamp)}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-emerald-600 dark:text-[#00e599]">
                    {formatToken(act.amount, 2)} mUSDC
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Status: Confirmed
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
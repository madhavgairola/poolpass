import React, { useState } from 'react';
import { ArrowDownToLine, TrendingUp, Loader2, CheckCircle2 } from 'lucide-react';
import { formatToken, formatTimeRemaining } from '../utils/web3';
import { ethers } from 'ethers';

export default function ActiveSubscription({
  subscription,
  poolPassContract,
  userAddress,
  onActionSuccess,
}) {
  const [loadingAction, setLoadingAction] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

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

  // Calculate yield coverage percentage safely
  let coveragePercent = 0;
  try {
    const settledFloat = parseFloat(ethers.formatEther(yieldSettled || 0n));
    const accruedFloat = parseFloat(ethers.formatEther(currentAccruedYield || 0n));
    const targetFloat = parseFloat(ethers.formatEther(targetFeeTotal || 0n));
    if (targetFloat > 0) {
      coveragePercent = Math.min(100, Math.round(((settledFloat + accruedFloat) / targetFloat) * 100));
    }
  } catch (e) {
    coveragePercent = 0;
  }

  const handleSettle = async () => {
    if (!poolPassContract) return;
    try {
      setLoadingAction(true);
      setActionMessage('Harvesting accrued yield to Provider Treasury...');
      const tx = await poolPassContract.settleYield(userAddress);
      await tx.wait();
      setActionMessage('Yield successfully settled to Provider Treasury.');
      if (onActionSuccess) await onActionSuccess();
      setTimeout(() => setActionMessage(''), 3500);
    } catch (err) {
      console.error(err);
      setActionMessage(`Settlement failed: ${err.reason || err.message}`);
      setTimeout(() => setActionMessage(''), 5000);
    } finally {
      setLoadingAction(false);
    }
  };

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
    <div className="surface-panel rounded-2xl p-6 sm:p-7 border border-slate-200 dark:border-[#232938] shadow-sm">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-[#1f2430]">
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
              {isMatured ? 'MATURED (UNLOCKED)' : 'ACTIVE POSITION'}
            </span>
          </div>
          <div className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1">
            Maturity Status: <span className="text-slate-900 dark:text-white font-medium">{formatTimeRemaining(timeRemaining)}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSettle}
            disabled={loadingAction || currentAccruedYield === 0n}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#161922] dark:hover:bg-[#202534] text-xs font-mono text-emerald-700 dark:text-[#00e599] border border-emerald-500/30 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 font-medium"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Settle Yield ({formatToken(currentAccruedYield, 2)} mUSDC)
          </button>

          <button
            onClick={handleWithdraw}
            disabled={loadingAction || !isMatured}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 ${
              isMatured
                ? 'bg-emerald-600 hover:bg-emerald-700 dark:bg-[#00e599] dark:hover:bg-[#00c985] text-white dark:text-[#090a0d] shadow-sm'
                : 'bg-slate-100 dark:bg-[#14161f] text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-[#202532] cursor-not-allowed'
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
        <div className="bg-slate-50 dark:bg-[#0b0c10] p-4 rounded-xl border border-slate-200 dark:border-[#1b1f2b]">
          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Locked Principal</div>
          <div className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-1">
            {formatToken(stakedPrincipal)} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">mUSDC</span>
          </div>
          <div className="text-[10px] font-mono text-emerald-600 dark:text-[#00e599] mt-0.5 font-medium">100% Returnable</div>
        </div>

        <div className="bg-slate-50 dark:bg-[#0b0c10] p-4 rounded-xl border border-slate-200 dark:border-[#1b1f2b]">
          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Accrued Interest</div>
          <div className="text-lg font-bold font-mono text-emerald-600 dark:text-[#00e599] mt-1">
            +{formatToken(currentAccruedYield, 3)} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">mUSDC</span>
          </div>
          <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">Earning in Mock Pool</div>
        </div>

        <div className="bg-slate-50 dark:bg-[#0b0c10] p-4 rounded-xl border border-slate-200 dark:border-[#1b1f2b]">
          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Yield Settled to Treasury</div>
          <div className="text-lg font-bold font-mono text-slate-900 dark:text-slate-200 mt-1">
            {formatToken(yieldSettled, 2)} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">mUSDC</span>
          </div>
          <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">Paid to Service Provider</div>
        </div>

        <div className="bg-slate-50 dark:bg-[#0b0c10] p-4 rounded-xl border border-slate-200 dark:border-[#1b1f2b]">
          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Cycle Target Fee</div>
          <div className="text-lg font-bold font-mono text-slate-900 dark:text-slate-200 mt-1">
            {formatToken(targetFeeTotal, 2)} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">mUSDC</span>
          </div>
          <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">{coveragePercent}% Yield Covered</div>
        </div>
      </div>

      {/* Yield Meter */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
          <span>Fee Funding Coverage:</span>
          <span className="text-emerald-600 dark:text-[#00e599] font-bold">{coveragePercent}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-[#0b0c10] overflow-hidden border border-slate-200 dark:border-[#1b1f2b]">
          <div
            className="h-full bg-emerald-500 dark:bg-[#00e599] transition-all duration-300 rounded-full"
            style={{ width: `${coveragePercent}%` }}
          />
        </div>
      </div>

      {actionMessage && (
        <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-[#0b0c10] border border-emerald-500/30 text-xs font-mono text-emerald-700 dark:text-[#00e599] flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}
    </div>
  );
}

import React from 'react';
import { formatToken } from '../utils/web3';

export default function ProtocolStats({
  tvl,
  totalYieldSettled,
  subscribersCount,
  treasuryBalance,
  treasuryAddress,
}) {
  return (
    <div className="surface-panel rounded-2xl p-6 border border-slate-200 dark:border-[#1f2430] shadow-sm">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-[#1f2430]">
        {/* TVL */}
        <div className="pt-3 first:pt-0 lg:pt-0">
          <div className="text-xs font-mono text-slate-500 dark:text-slate-400">Total Value Locked (TVL)</div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
            {formatToken(tvl, 0)} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">mUSDC</span>
          </div>
          <div className="text-[11px] font-mono text-emerald-600 dark:text-[#00e599] mt-0.5 font-medium">
            Collateral in Mock Yield Pool
          </div>
        </div>

        {/* Total Yield Harvested */}
        <div className="pt-3 lg:pt-0 lg:pl-8">
          <div className="text-xs font-mono text-slate-500 dark:text-slate-400">Harvested Subscription Yield</div>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-[#00e599] mt-1">
            {formatToken(totalYieldSettled, 2)} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">mUSDC</span>
          </div>
          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
            Total revenue paid to provider
          </div>
        </div>

        {/* Active Subscribers */}
        <div className="pt-3 lg:pt-0 lg:pl-8">
          <div className="text-xs font-mono text-slate-500 dark:text-slate-400">Yield Passholders</div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
            {subscribersCount ?? 0}
          </div>
          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
            Active subscription contracts
          </div>
        </div>

        {/* Treasury Balance */}
        <div className="pt-3 lg:pt-0 lg:pl-8">
          <div className="text-xs font-mono text-slate-500 dark:text-slate-400">Provider Treasury Vault</div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
            {formatToken(treasuryBalance, 2)} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">mUSDC</span>
          </div>
          <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5 truncate" title={treasuryAddress}>
            {treasuryAddress ? `Vault: ${treasuryAddress.slice(0, 6)}...${treasuryAddress.slice(-4)}` : '...'}
          </div>
        </div>
      </div>
    </div>
  );
}

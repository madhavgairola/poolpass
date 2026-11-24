import React, { useState } from 'react';
import ProtocolStats from './ProtocolStats';
import { Landmark, ShieldCheck, ArrowUpRight, Copy, Check, BarChart2 } from 'lucide-react';
import { formatToken } from '../utils/web3';
import deployedAddresses from '../contracts/deployedAddresses.json';

export default function ProtocolTreasuryView({
  tvl,
  totalYieldSettled,
  subscribersCount,
  treasuryBalance,
  treasuryAddress,
}) {
  const [copiedKey, setCopiedKey] = useState('');

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2500);
  };

  const contractsList = [
    {
      name: 'PoolPass Protocol Core',
      desc: 'Subscription registry, duration-adjusted stake math, timelocks & yield harvesting',
      address: deployedAddresses.poolPass,
      role: 'Core Protocol',
    },
    {
      name: 'MockYieldPool (Lending Pool)',
      desc: 'Deterministic lending market holding staked collateral & continuous yield accrual',
      address: deployedAddresses.yieldPool,
      role: 'Lending Market',
    },
    {
      name: 'Mock USD Coin (mUSDC)',
      desc: 'ERC-20 collateral stablecoin with public mint faucet',
      address: deployedAddresses.stakingToken,
      role: 'Collateral Asset',
    },
    {
      name: 'Service Provider Treasury',
      desc: 'Destination vault receiving harvested subscription revenue',
      address: deployedAddresses.treasury,
      role: 'Treasury Vault',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <BarChart2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Protocol Analytics & Treasury Overview
          </h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Global protocol metrics, automated treasury cashflows, and verified smart contracts.
        </p>
      </div>

      {/* Protocol Metrics Strip */}
      <ProtocolStats
        tvl={tvl}
        totalYieldSettled={totalYieldSettled}
        subscribersCount={subscribersCount}
        treasuryBalance={treasuryBalance}
        treasuryAddress={treasuryAddress}
      />

      {/* Two-Column Breakdown: Business Model & Architecture */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Treasury Mechanism */}
        <div className="surface-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
            <Landmark className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider font-sans">
              Service Provider Revenue Stream
            </h3>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Recurring subscription revenue is generated directly from DeFi lending yields rather than billing customer cards. Subscribers retain 100% of their staked principal.
          </p>

          <div className="space-y-3 pt-1">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs">
              <div className="font-bold text-slate-900 dark:text-white mb-0.5">
                Current Treasury Balance
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {formatToken(treasuryBalance, 2)} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">mUSDC</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Yield revenue harvested directly from locked subscription collateral.
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs">
              <div className="font-bold text-slate-900 dark:text-white mb-0.5">
                Total Subscriptions Funded
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                {formatToken(totalYieldSettled, 2)} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">mUSDC total fees paid</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Across {subscribersCount} active subscribers with zero principal deductions.
              </div>
            </div>
          </div>
        </div>

        {/* Security & Yield Flow */}
        <div className="surface-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider font-sans">
              Collateral Custody & Security
            </h3>
          </div>

          <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-start gap-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
              <p>
                <strong>Isolated Collateral Accounting:</strong> Staked principal is tracked separately from fee payments. Harvested interest is routed to the treasury without touching the user's principal.
              </p>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
              <p>
                <strong>Cryptographic Timelocks:</strong> Early principal withdrawal requests are rejected on-chain before execution (`block.timestamp &lt; lockExpiry`).
              </p>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
              <p>
                <strong>Full Reserve Backing:</strong> The mock yield pool operates on 100% full-reserve collateral with seeded liquidity and local index growth.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Deployed Smart Contracts Directory */}
      <div className="surface-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider font-sans">
            Smart Contract Deployments
          </h3>
          <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">Hardhat Local (Chain 31337)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {contractsList.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-bold text-xs text-slate-900 dark:text-white">{item.name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {item.role}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
                  {item.desc}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2.5 border-t border-slate-200 dark:border-slate-800 text-xs font-mono">
                <span className="text-slate-700 dark:text-slate-300 truncate max-w-[240px]" title={item.address}>
                  {item.address}
                </span>
                <button
                  onClick={() => copyToClipboard(item.address, item.name)}
                  className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline shrink-0 ml-2 cursor-pointer"
                >
                  {copiedKey === item.name ? (
                    <>
                      <Check className="w-3 h-3" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" /> Copy
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

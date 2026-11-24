import React, { useState } from 'react';
import { FastForward, Clock, Cuboid, Sparkles, Terminal, ArrowRight, Play, RefreshCw, Send, Check } from 'lucide-react';
import { evmIncreaseTime, triggerFaucet, DEMO_ACCOUNTS } from '../utils/web3';
import deployedAddresses from '../contracts/deployedAddresses.json';

export default function DevSandbox({
  blockNumber,
  blockTimestamp,
  currentAccountIndex,
  setCurrentAccountIndex,
  userAddress,
  onActionSuccess,
}) {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [customDays, setCustomDays] = useState('30');
  const [faucetAmount, setFaucetAmount] = useState('1000');

  const handleTimeTravel = async (days, label) => {
    try {
      setLoading(true);
      setFeedback(`Advancing node clock by ${label}...`);
      const seconds = Number(days) * 24 * 3600;
      await evmIncreaseTime(seconds);
      setFeedback(`Successfully advanced ${label}. New block mined.`);
      if (onActionSuccess) await onActionSuccess();
      setTimeout(() => setFeedback(''), 3000);
    } catch (err) {
      console.error(err);
      setFeedback(`RPC Error: ${err.message || 'Operation failed'}`);
      setTimeout(() => setFeedback(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleMintFaucet = async () => {
    if (!userAddress) return;
    try {
      setLoading(true);
      setFeedback(`Minting ${faucetAmount} mUSDC to active wallet...`);
      await triggerFaucet(userAddress, faucetAmount);
      setFeedback(`Minted ${faucetAmount} mUSDC to ${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`);
      if (onActionSuccess) await onActionSuccess();
      setTimeout(() => setFeedback(''), 3500);
    } catch (err) {
      console.error(err);
      setFeedback(`Faucet error: ${err.message}`);
      setTimeout(() => setFeedback(''), 5000);
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
    : 'Connecting...';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <Terminal className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Developer Sandbox & EVM Console
          </h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Local chain controller for simulating time travel, minting test liquidity, and testing contract state transitions.
        </p>
      </div>

      {/* Main Grid: EVM Clock & Faucet Console */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* EVM Time Machine */}
        <div className="surface-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider font-sans">
                EVM Block & Time Simulation
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Execute <code className="text-emerald-600 dark:text-emerald-400">evm_increaseTime</code> and mine instant blocks.
              </p>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          </div>

          {/* Node Status Pills */}
          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Simulated Block Time</div>
              <div className="text-sm font-bold text-slate-900 dark:text-white mt-1 truncate">
                {formattedDate}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Current Block Height</div>
              <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                #{blockNumber ?? '...'}
              </div>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Fast-Forward Presets:
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              <button
                onClick={() => handleTimeTravel(1, '+1 Day')}
                disabled={loading}
                className="py-2 px-2.5 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 text-xs font-mono font-medium transition cursor-pointer disabled:opacity-50"
              >
                +1d
              </button>
              <button
                onClick={() => handleTimeTravel(7, '+7 Days')}
                disabled={loading}
                className="py-2 px-2.5 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 text-xs font-mono font-medium transition cursor-pointer disabled:opacity-50"
              >
                +7d
              </button>
              <button
                onClick={() => handleTimeTravel(30, '+30 Days (1 Month)')}
                disabled={loading}
                className="py-2 px-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800/60 text-xs font-mono font-medium transition cursor-pointer disabled:opacity-50"
              >
                +30d
              </button>
              <button
                onClick={() => handleTimeTravel(90, '+90 Days (3 Months)')}
                disabled={loading}
                className="py-2 px-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800/60 text-xs font-mono font-medium transition cursor-pointer disabled:opacity-50"
              >
                +90d
              </button>
              <button
                onClick={() => handleTimeTravel(365, '+365 Days (1 Year)')}
                disabled={loading}
                className="py-2 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 text-xs font-mono font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
              >
                +365d
              </button>
            </div>
          </div>

          {/* Custom Days Input */}
          <div className="pt-2 flex items-center gap-2">
            <input
              type="number"
              value={customDays}
              onChange={(e) => setCustomDays(e.target.value)}
              placeholder="Custom days"
              min="1"
              max="1000"
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 w-32"
            />
            <button
              onClick={() => handleTimeTravel(customDays, `+${customDays} Days`)}
              disabled={loading || !customDays}
              className="py-2 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-medium transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <span>Advance Custom Days</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Test Accounts & Mock Token Faucet */}
        <div className="surface-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider font-sans">
                Deterministic Wallets & Faucet
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Switch signers or mint mock stablecoin collateral directly on the local node.
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
              Chain 31337
            </span>
          </div>

          {/* Fast Signer Switcher */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Select Active Signer:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((acc, idx) => {
                const isSelected = currentAccountIndex === idx;
                return (
                  <button
                    key={acc.address}
                    onClick={() => {
                      setCurrentAccountIndex(idx);
                      if (onActionSuccess) onActionSuccess();
                    }}
                    className={`p-3 rounded-xl text-left border transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-slate-900 dark:bg-slate-800 border-slate-900 dark:border-slate-700 text-white'
                        : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">{acc.name}</span>
                      <span className="text-[10px] font-mono opacity-70 uppercase">{acc.role}</span>
                    </div>
                    <div className="text-[11px] font-mono opacity-80 mt-1 truncate">
                      {acc.address}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mint Faucet Tool */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Mint Test mUSDC Liquidity:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={faucetAmount}
                onChange={(e) => setFaucetAmount(e.target.value)}
                placeholder="Amount in mUSDC"
                min="100"
                step="500"
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 w-36"
              />
              <button
                onClick={handleMintFaucet}
                disabled={loading || !faucetAmount}
                className="py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 text-xs font-bold font-mono transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <span>Mint to Active Wallet</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Status / Feedback Bar */}
      {feedback && (
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-emerald-500/30 text-xs font-mono text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
          <Sparkles className="w-4 h-4 animate-spin shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Contract Registry Quick-Reference */}
      <div className="surface-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider font-sans mb-3">
          Local Contract Deployments
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">PoolPass Core:</span>
            <div className="text-slate-900 dark:text-white font-medium truncate mt-0.5">{deployedAddresses.poolPass}</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">MockYieldPool:</span>
            <div className="text-slate-900 dark:text-white font-medium truncate mt-0.5">{deployedAddresses.yieldPool}</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Mock mUSDC:</span>
            <div className="text-slate-900 dark:text-white font-medium truncate mt-0.5">{deployedAddresses.stakingToken}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

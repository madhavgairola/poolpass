import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal,
  Play,
  Pause,
  FastForward,
  Clock,
  Cuboid,
  Sparkles,
  X,
  Plus,
  Check,
  ArrowRight,
  Shield,
} from 'lucide-react';
import { ethers } from 'ethers';
import { evmIncreaseTime, triggerFaucet, DEMO_ACCOUNTS, formatToken } from '../utils/web3';

export default function SimulationDrawer({
  isOpen,
  onClose,
  blockNumber,
  blockTimestamp,
  currentAccountIndex,
  setCurrentAccountIndex,
  userAddress,
  tokenBalance,
  poolPassContract,
  onActionSuccess,
}) {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [customDays, setCustomDays] = useState('30');
  const [faucetAmount, setFaucetAmount] = useState('1000');

  // Interactive Playback Engine State
  const [isPlaying, setIsPlaying] = useState(false);
  const [simSpeedMs] = useState(2000); // +1 week every 2 seconds
  const [simulatedWeeksCount, setSimulatedWeeksCount] = useState(0);
  const [autoSettle, setAutoSettle] = useState(true);

  const playIntervalRef = useRef(null);
  const isExecutingRef = useRef(false);

  // Playback execution step
  const stepTime = async (secondsToAdd = 7 * 86400, label = '+1 Week') => {
    if (isExecutingRef.current) return;
    try {
      isExecutingRef.current = true;
      setFeedback(`Advancing node clock by ${label}...`);
      await evmIncreaseTime(secondsToAdd);
      setSimulatedWeeksCount((prev) => prev + Math.round(secondsToAdd / (7 * 86400)));

      if (onActionSuccess) {
        await onActionSuccess();
      }

      // Check if auto-harvest should trigger
      if (autoSettle && poolPassContract && userAddress) {
        try {
          const freshAccrued = await poolPassContract.getAccruedYield(userAddress);
          const freshAccruedFloat = parseFloat(ethers.formatEther(freshAccrued));
          if (freshAccruedFloat >= 1.0) {
            setFeedback(`Auto-Harvested ${freshAccruedFloat.toFixed(2)} mUSDC to Provider Treasury`);
            const tx = await poolPassContract.settleYield(userAddress);
            await tx.wait();
            if (onActionSuccess) await onActionSuccess();
          }
        } catch (e) {
          console.warn("Auto-harvest check error:", e);
        }
      }
      setTimeout(() => setFeedback(''), 2500);
    } catch (err) {
      console.error("Simulation step error:", err);
      setFeedback(`RPC Error: ${err.message || 'Operation failed'}`);
      setTimeout(() => setFeedback(''), 3500);
    } finally {
      isExecutingRef.current = false;
    }
  };

  // Continuous playback timer
  useEffect(() => {
    if (isPlaying) {
      playIntervalRef.current = setInterval(() => {
        stepTime(7 * 86400, '+1 Week');
      }, simSpeedMs);
    } else {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
    }
    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, [isPlaying, simSpeedMs, autoSettle, poolPassContract, userAddress]);

  if (!isOpen) return null;

  const handleTimeTravel = async (days, label) => {
    try {
      setLoading(true);
      setFeedback(`Advancing node clock by ${label}...`);
      const seconds = Number(days) * 24 * 3600;
      await evmIncreaseTime(seconds);
      setFeedback(`Advanced ${label}. Block mined.`);
      if (onActionSuccess) await onActionSuccess();
      setTimeout(() => setFeedback(''), 2500);
    } catch (err) {
      console.error(err);
      setFeedback(`RPC Error: ${err.message || 'Operation failed'}`);
      setTimeout(() => setFeedback(''), 4000);
    } finally {
      setLoading(false);
    }
  };

  const handleMintFaucet = async () => {
    if (!userAddress) return;
    try {
      setLoading(true);
      setFeedback(`Minting ${faucetAmount} mUSDC...`);
      await triggerFaucet(userAddress, faucetAmount);
      setFeedback(`Minted ${faucetAmount} mUSDC to active wallet!`);
      if (onActionSuccess) await onActionSuccess();
      setTimeout(() => setFeedback(''), 3000);
    } catch (err) {
      console.error(err);
      setFeedback(`Faucet error: ${err.message}`);
      setTimeout(() => setFeedback(''), 4000);
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

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Slide-out Drawer */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-[#111215] border-l border-slate-200 dark:border-[#22242a] shadow-2xl flex flex-col justify-between">
          
          {/* Header */}
          <div className="p-4 border-b border-slate-200 dark:border-[#202227] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-slate-100 dark:bg-[#1a1c22] text-slate-700 dark:text-slate-300 flex items-center justify-center border border-slate-200 dark:border-[#2a2d36]">
                <Terminal className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                    Dev Sandbox
                  </h3>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#1a1c22] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-[#2a2d36]">
                    Chain 31337
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  State simulator & time-travel engine
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1a1c22] transition cursor-pointer"
              aria-label="Close Sandbox"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            
            {/* Status Strip */}
            <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-[#16171b] border border-slate-200 dark:border-[#23252c] text-xs">
              <div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-0.5 font-medium">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>Simulated Time</span>
                </div>
                <div className="font-mono text-slate-800 dark:text-slate-200 text-xs truncate">
                  {formattedDate}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-0.5 font-medium">
                  <Cuboid className="w-3 h-3 text-slate-400" />
                  <span>Block Height</span>
                </div>
                <div className="font-mono text-slate-800 dark:text-slate-200 text-xs font-semibold">
                  #{blockNumber ?? '—'}
                </div>
              </div>
            </div>

            {/* Continuous Playback Engine */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#16171b] border border-slate-200 dark:border-[#23252c] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 relative">
                    {isPlaying && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    )}
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${isPlaying ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'}`}></span>
                  </span>
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-200">
                    Continuous Playback
                  </span>
                </div>
                {simulatedWeeksCount > 0 && (
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    +{simulatedWeeksCount} wks elapsed
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Advance Hardhat blocks on an automated interval to observe live yield streaming and settlement receipts.
              </p>

              {/* Controls */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {/* Play / Pause Toggle Button */}
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className={`flex-1 py-2 px-3.5 rounded-lg text-xs font-medium transition flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                      isPlaying
                        ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white'
                    }`}
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-current" />
                        <span>Pause Simulation</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Play (+1 wk / {simSpeedMs / 1000}s)</span>
                      </>
                    )}
                  </button>

                  {/* Quick Steppers */}
                  <button
                    onClick={() => stepTime(7 * 86400, '+1 Week')}
                    disabled={isPlaying || loading}
                    className="py-2 px-3 rounded-lg bg-white dark:bg-[#1e2025] hover:bg-slate-100 dark:hover:bg-[#252830] text-slate-700 dark:text-slate-200 text-xs font-medium border border-slate-200 dark:border-[#2e3138] transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
                    title="Step forward 1 week (7 days)"
                  >
                    <FastForward className="w-3 h-3 text-slate-400" />
                    <span>+1W</span>
                  </button>

                  <button
                    onClick={() => stepTime(30 * 86400, '+1 Month')}
                    disabled={isPlaying || loading}
                    className="py-2 px-3 rounded-lg bg-white dark:bg-[#1e2025] hover:bg-slate-100 dark:hover:bg-[#252830] text-slate-700 dark:text-slate-200 text-xs font-medium border border-slate-200 dark:border-[#2e3138] transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
                    title="Step forward 1 month (30 days)"
                  >
                    <FastForward className="w-3 h-3 text-slate-400" />
                    <span>+1M</span>
                  </button>
                </div>

                {/* Auto-Settle Policy Checkbox */}
                <label className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-[#111215] border border-slate-200 dark:border-[#23252c] text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoSettle}
                    onChange={(e) => setAutoSettle(e.target.checked)}
                    className="w-3.5 h-3.5 text-emerald-600 rounded focus:ring-0 cursor-pointer"
                  />
                  <span>Auto-harvest yield at milestone thresholds</span>
                </label>
              </div>
            </div>

            {/* Fast-Forward Clock */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-200">
                  Fast-Forward Clock
                </span>
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  evm_increaseTime
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { days: 1, label: '+1 Day' },
                  { days: 7, label: '+7 Days' },
                  { days: 30, label: '+30 Days' },
                  { days: 90, label: '+90 Days' },
                  { days: 180, label: '+180 Days' },
                  { days: 365, label: '+365 Days' },
                ].map(({ days, label }) => (
                  <button
                    key={days}
                    onClick={() => handleTimeTravel(days, label)}
                    disabled={loading || isPlaying}
                    className="py-1.5 px-2 rounded-lg bg-slate-50 dark:bg-[#1a1c21] hover:bg-slate-100 dark:hover:bg-[#22242b] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#282a32] text-xs font-mono transition cursor-pointer disabled:opacity-40"
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Custom Days Input */}
              <div className="flex items-center gap-1.5 pt-0.5">
                <div className="relative flex-1">
                  <input
                    type="number"
                    value={customDays}
                    onChange={(e) => setCustomDays(e.target.value)}
                    placeholder="Days"
                    min="1"
                    max="1000"
                    className="w-full bg-slate-50 dark:bg-[#1a1c21] border border-slate-200 dark:border-[#282a32] rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-slate-400 dark:focus:border-slate-500"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono">
                    days
                  </span>
                </div>
                <button
                  onClick={() => handleTimeTravel(customDays, `+${customDays} Days`)}
                  disabled={loading || isPlaying || !customDays}
                  className="py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-[#22242b] dark:hover:bg-[#2b2d36] text-white dark:text-slate-200 text-xs font-medium transition cursor-pointer disabled:opacity-40 flex items-center gap-1 border border-transparent dark:border-[#323540]"
                >
                  <span>Advance</span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Test Wallet Switcher */}
            <div className="space-y-2.5 pt-3 border-t border-slate-200 dark:border-[#202227]">
              <span className="text-xs font-semibold text-slate-900 dark:text-slate-200">
                Active Test Account
              </span>

              <div className="space-y-1.5">
                {DEMO_ACCOUNTS.map((acc, idx) => {
                  const isSelected = currentAccountIndex === idx;

                  return (
                    <button
                      key={acc.address}
                      onClick={() => {
                        setCurrentAccountIndex(idx);
                        if (onActionSuccess) onActionSuccess();
                      }}
                      className={`w-full p-2.5 rounded-lg text-left border transition cursor-pointer flex items-center justify-between text-xs ${
                        isSelected
                          ? 'bg-slate-100 dark:bg-[#202228] border-slate-300 dark:border-[#363944] text-slate-900 dark:text-slate-100 shadow-sm'
                          : 'bg-slate-50 dark:bg-[#16171b] border-slate-200 dark:border-[#22242a] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-[#2d3038]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'}`} />
                        <div>
                          <div className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <span>{acc.name}</span>
                            <span className="text-[10px] text-slate-500 font-normal">({acc.role})</span>
                          </div>
                          <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                            {acc.address.slice(0, 8)}...{acc.address.slice(-6)}
                          </div>
                        </div>
                      </div>

                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mint Faucet Tool */}
            <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-[#202227]">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-900 dark:text-slate-200">Test Token Faucet</span>
                <span className="font-mono text-slate-500 dark:text-slate-400">
                  Balance: <span className="text-slate-900 dark:text-slate-200 font-medium">{formatToken(tokenBalance)}</span> mUSDC
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <div className="relative flex-1">
                  <input
                    type="number"
                    value={faucetAmount}
                    onChange={(e) => setFaucetAmount(e.target.value)}
                    placeholder="Amount"
                    min="100"
                    step="500"
                    className="w-full bg-slate-50 dark:bg-[#1a1c21] border border-slate-200 dark:border-[#282a32] rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-slate-400 dark:focus:border-slate-500"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono">
                    mUSDC
                  </span>
                </div>
                <button
                  onClick={handleMintFaucet}
                  disabled={loading || !faucetAmount}
                  className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-medium transition cursor-pointer disabled:opacity-40 flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Mint Tokens</span>
                </button>
              </div>
            </div>

            {/* Feedback notification */}
            {feedback && (
              <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-[#1c1d22] border border-slate-200 dark:border-[#2e313b] text-xs font-mono text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{feedback}</span>
              </div>
            )}
          </div>

          {/* Drawer Footer */}
          <div className="p-3 border-t border-slate-200 dark:border-[#202227] text-center">
            <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
              Hardhat Node Localhost:8545 · Chain ID: 31337
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

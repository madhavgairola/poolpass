import React, { useState, useEffect, useRef } from 'react';
import {
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
  Zap,
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
            setFeedback(`Auto-Harvesting ${freshAccruedFloat.toFixed(2)} mUSDC to Provider Treasury...`);
            const tx = await poolPassContract.settleYield(userAddress);
            await tx.wait();
            setFeedback(`✓ Harvested ${freshAccruedFloat.toFixed(2)} mUSDC to Treasury for cycle payment.`);
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
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Slide-out Drawer */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between">
          
          {/* Header */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                ⚡
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Simulation & Dev Sandbox
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Time-travel controls for evaluation & testing
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            
            {/* Telemetry Status Bar */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-500" />
                  Simulated Time:
                </span>
                <span className="text-slate-900 dark:text-white font-medium">{formattedDate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Cuboid className="w-3.5 h-3.5 text-emerald-500" />
                  Block Height:
                </span>
                <span className="text-slate-900 dark:text-white font-medium">#{blockNumber ?? '...'}</span>
              </div>
            </div>

            {/* Interactive Playback Engine */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3.5">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2.5 w-2.5 relative">
                      {isPlaying && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      )}
                      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isPlaying ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                    </span>
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Interactive Playback Engine
                    </h4>
                  </div>
                  {simulatedWeeksCount > 0 && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                      +{simulatedWeeksCount} Wks
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Run continuous time-travel to watch yield streaming, milestone payment triggers, and automated settlement receipts in real-time.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`w-full py-2.5 px-4 rounded-xl font-mono text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer ${
                    isPlaying
                      ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/20'
                      : 'bg-emerald-600 hover:bg-emerald-700 dark:bg-[#00e599] dark:hover:bg-[#00c985] text-white dark:text-[#090a0d]'
                  }`}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-4 h-4 fill-current" />
                      <span>Pause Time Simulation</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>Play Simulation (+1 Wk / {simSpeedMs / 1000}s)</span>
                    </>
                  )}
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => stepTime(7 * 86400, '+1 Week')}
                    disabled={isPlaying || loading}
                    className="py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-mono text-slate-700 dark:text-slate-200 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700 cursor-pointer"
                    title="Step forward 1 week (7 days)"
                  >
                    <FastForward className="w-3.5 h-3.5" />
                    <span>+1 Week</span>
                  </button>

                  <button
                    onClick={() => stepTime(30 * 86400, '+1 Month')}
                    disabled={isPlaying || loading}
                    className="py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-mono text-slate-700 dark:text-slate-200 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700 cursor-pointer"
                    title="Step forward 1 month (30 days)"
                  >
                    <FastForward className="w-3.5 h-3.5" />
                    <span>+1 Month</span>
                  </button>
                </div>

                <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-100/60 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoSettle}
                    onChange={(e) => setAutoSettle(e.target.checked)}
                    className="w-3.5 h-3.5 text-emerald-600 rounded focus:ring-0 cursor-pointer"
                  />
                  <span className="text-slate-700 dark:text-slate-300">Auto-Harvest Milestones</span>
                </label>
              </div>
            </div>

            {/* Time Travel Controls (Jump Ahead) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-sans">
                  Quick Jump Ahead
                </label>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                  evm_increaseTime
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleTimeTravel(1, '+1 Day')}
                  disabled={loading || isPlaying}
                  className="py-2 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-mono font-medium transition cursor-pointer disabled:opacity-50"
                >
                  +1 Day
                </button>
                <button
                  onClick={() => handleTimeTravel(7, '+7 Days')}
                  disabled={loading || isPlaying}
                  className="py-2 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-mono font-medium transition cursor-pointer disabled:opacity-50"
                >
                  +7 Days
                </button>
                <button
                  onClick={() => handleTimeTravel(30, '+30 Days (1 Month)')}
                  disabled={loading || isPlaying}
                  className="py-2 px-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-mono font-medium transition cursor-pointer disabled:opacity-50"
                >
                  +30 Days
                </button>
                <button
                  onClick={() => handleTimeTravel(90, '+90 Days')}
                  disabled={loading || isPlaying}
                  className="py-2 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-mono font-medium transition cursor-pointer disabled:opacity-50"
                >
                  +90 Days
                </button>
                <button
                  onClick={() => handleTimeTravel(180, '+180 Days')}
                  disabled={loading || isPlaying}
                  className="py-2 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-mono font-medium transition cursor-pointer disabled:opacity-50"
                >
                  +180 Days
                </button>
                <button
                  onClick={() => handleTimeTravel(365, '+365 Days (1 Year)')}
                  disabled={loading || isPlaying}
                  className="py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 text-xs font-mono font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
                >
                  +365 Days
                </button>
              </div>

              {/* Custom Days Input */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="number"
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                  placeholder="Days"
                  min="1"
                  max="1000"
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-800 dark:text-slate-200 w-24 focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={() => handleTimeTravel(customDays, `+${customDays} Days`)}
                  disabled={loading || isPlaying || !customDays}
                  className="flex-1 py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-medium transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <span>Advance Custom Days</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Test Wallet Switcher */}
            <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-sans">
                Select Active Test Wallet
              </label>

              <div className="space-y-2">
                {DEMO_ACCOUNTS.map((acc, idx) => {
                  const isSelected = currentAccountIndex === idx;

                  return (
                    <button
                      key={acc.address}
                      onClick={() => {
                        setCurrentAccountIndex(idx);
                        if (onActionSuccess) onActionSuccess();
                      }}
                      className={`w-full p-2.5 rounded-xl text-left border transition cursor-pointer flex items-center justify-between text-xs ${
                        isSelected
                          ? 'bg-slate-900 dark:bg-slate-800 border-slate-900 dark:border-slate-700 text-white'
                          : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-bold flex items-center gap-1.5">
                          <span>{acc.name}</span>
                          <span className="text-[10px] font-mono opacity-60 uppercase">({acc.role})</span>
                        </div>
                        <div className="font-mono text-[11px] opacity-75 mt-0.5">
                          {acc.address.slice(0, 8)}...{acc.address.slice(-6)}
                        </div>
                      </div>

                      {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mint Faucet Tool */}
            <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-sans">
                  Mint Mock mUSDC
                </label>
                <span className="text-xs font-mono text-slate-500">
                  Bal: {formatToken(tokenBalance)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={faucetAmount}
                  onChange={(e) => setFaucetAmount(e.target.value)}
                  placeholder="Amount"
                  min="100"
                  step="500"
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-800 dark:text-slate-200 w-28 focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={handleMintFaucet}
                  disabled={loading || !faucetAmount}
                  className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 text-xs font-bold font-mono transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Mint to Active Wallet</span>
                </button>
              </div>
            </div>

            {/* Feedback notification */}
            {feedback && (
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950 border border-emerald-500/40 text-xs font-mono text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 animate-spin shrink-0" />
                <span>{feedback}</span>
              </div>
            )}
          </div>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 text-center">
            <span className="text-[11px] font-mono text-slate-400">
              Hardhat Node Localhost:8545 (Chain 31337)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

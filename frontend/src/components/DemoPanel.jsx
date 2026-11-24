import React, { useState } from 'react';
import { FastForward, Clock, Cuboid, Play, CheckCircle } from 'lucide-react';
import { evmIncreaseTime } from '../utils/web3';

export default function DemoPanel({ blockNumber, blockTimestamp, onActionSuccess }) {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  const handleTimeTravel = async (days, label) => {
    try {
      setLoading(true);
      setFeedback(`Advancing ${label}...`);
      const seconds = days * 24 * 3600;
      await evmIncreaseTime(seconds);
      setFeedback(`Chain advanced by ${label}. New block mined.`);
      if (onActionSuccess) await onActionSuccess();
      setTimeout(() => setFeedback(''), 2500);
    } catch (err) {
      console.error(err);
      setFeedback(`RPC error: ${err.message || 'Operation failed'}`);
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
    : 'Connecting...';

  return (
    <div className="surface-panel rounded-xl px-4 py-3 border border-[#1f2430]">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Telemetry info */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2 text-white font-medium">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            <span className="font-sans font-bold text-sm tracking-tight">EVM Simulation Controls</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Node Time:</span>
            <span className="text-white font-semibold">{formattedDate}</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-300">
            <Cuboid className="w-3.5 h-3.5 text-slate-400" />
            <span>Block:</span>
            <span className="text-white font-semibold">#{blockNumber ?? '...'}</span>
          </div>
        </div>

        {/* Stepper buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-mono text-slate-400 mr-1 hidden sm:inline">Fast-Forward:</span>
          
          <button
            onClick={() => handleTimeTravel(1, '+1 Day')}
            disabled={loading}
            className="px-2.5 py-1 rounded bg-[#161922] hover:bg-[#202534] text-slate-300 hover:text-white border border-[#262c3c] text-xs font-mono transition disabled:opacity-50"
          >
            +1d
          </button>
          
          <button
            onClick={() => handleTimeTravel(7, '+7 Days')}
            disabled={loading}
            className="px-2.5 py-1 rounded bg-[#161922] hover:bg-[#202534] text-slate-300 hover:text-white border border-[#262c3c] text-xs font-mono transition disabled:opacity-50"
          >
            +7d
          </button>
          
          <button
            onClick={() => handleTimeTravel(30, '+30 Days (Maturity)')}
            disabled={loading}
            className="px-2.5 py-1 rounded bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-200 border border-indigo-700/50 text-xs font-mono font-medium transition disabled:opacity-50"
          >
            +30d (1mo)
          </button>
          
          <button
            onClick={() => handleTimeTravel(90, '+90 Days')}
            disabled={loading}
            className="px-2.5 py-1 rounded bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-200 border border-indigo-700/50 text-xs font-mono font-medium transition disabled:opacity-50"
          >
            +90d (3mo)
          </button>
          
          <button
            onClick={() => handleTimeTravel(365, '+365 Days (1 Year)')}
            disabled={loading}
            className="px-2.5 py-1 rounded bg-[#00e599]/15 hover:bg-[#00e599]/25 text-[#00e599] border border-[#00e599]/40 text-xs font-mono font-semibold transition disabled:opacity-50"
          >
            +365d (1yr)
          </button>
        </div>
      </div>

      {feedback && (
        <div className="mt-2.5 pt-2 border-t border-[#1f2430] flex items-center gap-2 text-xs font-mono text-[#00e599]">
          <CheckCircle className="w-3.5 h-3.5" />
          <span>{feedback}</span>
        </div>
      )}
    </div>
  );
}

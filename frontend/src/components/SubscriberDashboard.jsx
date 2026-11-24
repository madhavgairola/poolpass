import React from 'react';
import ActiveSubscription from './ActiveSubscription';
import { Shield, Sparkles, ArrowRight, Coins, Lock, TrendingUp } from 'lucide-react';

export default function SubscriberDashboard({
  userSubscription,
  poolPassContract,
  userAddress,
  blockTimestamp,
  onActionSuccess,
  onExplorePlans,
}) {
  const hasActiveSub = Boolean(
    userSubscription &&
    userSubscription.stakedPrincipal &&
    userSubscription.stakedPrincipal > 0n &&
    !userSubscription.isWithdrawn
  );

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
          Active Subscriptions
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Manage your yield-generating collateral positions, track streaming interest, and settle or withdraw funds.
        </p>
      </div>

      {hasActiveSub ? (
        <ActiveSubscription
          subscription={userSubscription}
          poolPassContract={poolPassContract}
          userAddress={userAddress}
          blockTimestamp={blockTimestamp}
          onActionSuccess={onActionSuccess}
        />
      ) : (
        <div className="surface-panel rounded-2xl p-8 sm:p-12 text-center border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800">
              <Shield className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                No Active Position
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                You don't have an active yield-funded pass yet. Stake stablecoin collateral into the lending pool to activate your service pass—interest pays the monthly fee and your principal is 100% recoverable.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={onExplorePlans}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-bold text-xs shadow-sm transition cursor-pointer"
              >
                <span>Browse Subscription Plans</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Three Value Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10 pt-8 border-t border-slate-200 dark:border-slate-800 text-left">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white mb-1">
                <Coins className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Zero Capital Loss
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Staked collateral remains 100% your property and is returned upon lock duration maturity.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white mb-1">
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Automated Cashflow
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Lending interest accrues continuously and routes directly to the service provider's vault.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white mb-1">
                <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Timelock Protection
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Enforced by smart contract timelocks, guaranteeing subscription validity until expiration.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

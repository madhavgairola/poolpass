import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import Header from './components/Header';
import HomeOverview from './components/HomeOverview';
import SubscriberDashboard from './components/SubscriberDashboard';
import PlanSelector from './components/PlanSelector';
import ProtocolTreasuryView from './components/ProtocolTreasuryView';
import SimulationDrawer from './components/SimulationDrawer';
import {
  DEMO_ACCOUNTS,
  getLocalSigner,
  getRpcProvider,
  getContracts,
  triggerFaucet,
} from './utils/web3';
import { CheckCircle2, AlertCircle, Terminal } from 'lucide-react';

export default function App() {
  // Theme state: 'dark' | 'light'
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('poolpass-theme') || 'dark';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('poolpass-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Section Tab Navigation: 'home' | 'subscriptions' | 'plans' | 'analytics'
  const [activeTab, setActiveTab] = useState('home');

  // Simulation Drawer state (floating pop-up trigger)
  const [isSimulationOpen, setIsSimulationOpen] = useState(false);

  // Wallet and Signer
  const [walletType, setWalletType] = useState('local'); // 'local' | 'metamask'
  const [currentAccountIndex, setCurrentAccountIndex] = useState(0); // Alice
  const [userAddress, setUserAddress] = useState('');
  const [signer, setSigner] = useState(null);

  // Contracts
  const [contracts, setContracts] = useState(null);

  // Blockchain Data
  const [tokenBalance, setTokenBalance] = useState(0n);
  const [plans, setPlans] = useState([]);
  const [durationOptions, setDurationOptions] = useState([]);
  const [userSubscription, setUserSubscription] = useState(null);

  // Protocol Stats
  const [tvl, setTvl] = useState(0n);
  const [totalYieldSettled, setTotalYieldSettled] = useState(0n);
  const [subscribersCount, setSubscribersCount] = useState(0);
  const [treasuryBalance, setTreasuryBalance] = useState(0n);
  const [treasuryAddress, setTreasuryAddress] = useState('');

  // Node state
  const [blockNumber, setBlockNumber] = useState(null);
  const [blockTimestamp, setBlockTimestamp] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const [notification, setNotification] = useState(null);

  // Setup Signer based on walletType
  useEffect(() => {
    async function initSigner() {
      setConnectionError('');
      try {
        if (walletType === 'local') {
          const localSigner = getLocalSigner(currentAccountIndex);
          setSigner(localSigner);
          setUserAddress(localSigner.address);
          const c = getContracts(localSigner);
          setContracts(c);
        } else if (walletType === 'metamask') {
          if (!window.ethereum) {
            setConnectionError('MetaMask not detected. Use Local Test Wallets or install MetaMask.');
            return;
          }
          const browserProvider = new ethers.BrowserProvider(window.ethereum);
          const accounts = await browserProvider.send("eth_requestAccounts", []);
          if (accounts.length > 0) {
            const mmSigner = await browserProvider.getSigner();
            setSigner(mmSigner);
            setUserAddress(await mmSigner.getAddress());
            const c = getContracts(mmSigner);
            setContracts(c);
          }
        }
      } catch (err) {
        console.error("Signer initialization failed:", err);
        setConnectionError(`Connection error: ${err.message}. Ensure local Hardhat node is running at http://127.0.0.1:8545.`);
      }
    }
    initSigner();
  }, [walletType, currentAccountIndex]);

  // Load contract and node data
  const loadData = useCallback(async () => {
    if (!contracts || !userAddress) return;
    try {
      setIsRefreshing(true);
      const { token, poolPass } = contracts;
      const rpcProvider = getRpcProvider();

      // Fetch block state
      const latestBlock = await rpcProvider.getBlock('latest');
      if (latestBlock) {
        setBlockNumber(latestBlock.number);
        setBlockTimestamp(latestBlock.timestamp);
      }

      // User token balance
      const bal = await token.balanceOf(userAddress);
      setTokenBalance(bal);

      // Plans & Duration options
      const [fetchedPlans, fetchedDurations] = await Promise.all([
        poolPass.getAllPlans(),
        poolPass.getDurationOptions(),
      ]);
      setPlans(fetchedPlans);
      setDurationOptions(fetchedDurations);

      // User Subscription
      const sub = await poolPass.getUserSubscription(userAddress);
      setUserSubscription({
        planId: sub[0],
        planName: sub[1],
        monthlyFee: sub[2],
        stakedPrincipal: sub[3],
        startTime: sub[4],
        lockExpiry: sub[5],
        targetFeeTotal: sub[6],
        yieldSettled: sub[7],
        currentAccruedYield: sub[8],
        isWithdrawn: sub[9],
        isActive: sub[10],
        timeRemaining: sub[11],
      });

      // Protocol Stats
      const [tvlVal, yieldSettledVal, countVal, treasuryAddr] = await Promise.all([
        poolPass.totalStakedTVL(),
        poolPass.totalYieldSettledToTreasury(),
        poolPass.totalSubscribersCount(),
        poolPass.treasury(),
      ]);

      setTvl(tvlVal);
      setTotalYieldSettled(yieldSettledVal);
      setSubscribersCount(Number(countVal));
      setTreasuryAddress(treasuryAddr);

      // Treasury token balance
      const tBal = await token.balanceOf(treasuryAddr);
      setTreasuryBalance(tBal);
    } catch (err) {
      console.error("Error loading chain data:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [contracts, userAddress]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Quick Faucet Handler
  const handleFaucet = async () => {
    if (!userAddress) return;
    try {
      setIsRefreshing(true);
      await triggerFaucet(userAddress, "1000");
      setNotification({ type: 'success', text: 'Minted 1,000 mUSDC to your wallet!' });
      await loadData();
      setTimeout(() => setNotification(null), 3500);
    } catch (err) {
      console.error("Faucet error:", err);
      setNotification({ type: 'error', text: `Faucet error: ${err.message}` });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setIsRefreshing(false);
    }
  };

  const hasActiveSubscription = Boolean(
    userSubscription &&
    userSubscription.stakedPrincipal &&
    userSubscription.stakedPrincipal > 0n &&
    !userSubscription.isWithdrawn
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between transition-colors">
      <div>
        {/* Sleek Centered Header */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          theme={theme}
          toggleTheme={toggleTheme}
          walletType={walletType}
          setWalletType={setWalletType}
          currentAccountIndex={currentAccountIndex}
          setCurrentAccountIndex={setCurrentAccountIndex}
          userAddress={userAddress}
          tokenBalance={tokenBalance}
          hasActiveSubscription={hasActiveSubscription}
        />

        {/* Global Toast Notification */}
        {notification && (
          <div className="max-w-md mx-auto px-4 mt-3">
            <div className={`p-3 rounded-xl border text-xs font-mono flex items-center gap-2 shadow-lg ${
              notification.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                : 'bg-red-50 dark:bg-red-950/80 border-red-300 dark:border-red-800 text-red-800 dark:text-red-200'
            }`}>
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              )}
              <span>{notification.text}</span>
            </div>
          </div>
        )}

        {connectionError && (
          <div className="max-w-7xl mx-auto px-4 mt-4">
            <div className="bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 p-3.5 rounded-xl text-xs font-mono">
              <strong>Connection Error:</strong> {connectionError}
            </div>
          </div>
        )}

        {/* Main Application Surface */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Tab 0: Home / Overview Dashboard */}
          {activeTab === 'home' && (
            <HomeOverview
              userSubscription={userSubscription}
              plans={plans}
              durationOptions={durationOptions}
              blockTimestamp={blockTimestamp}
              tokenBalance={tokenBalance}
              onNavigate={(tab) => setActiveTab(tab)}
              onOpenSimulation={() => setIsSimulationOpen(true)}
            />
          )}

          {/* Tab 1: Subscriptions Dashboard */}
          {activeTab === 'subscriptions' && (
            <SubscriberDashboard
              userSubscription={userSubscription}
              poolPassContract={contracts?.poolPass}
              userAddress={userAddress}
              blockTimestamp={blockTimestamp}
              onActionSuccess={loadData}
              onExplorePlans={() => setActiveTab('plans')}
            />
          )}

          {/* Tab 2: Plans & Duration Staking */}
          {activeTab === 'plans' && (
            <PlanSelector
              plans={plans}
              durationOptions={durationOptions}
              poolPassContract={contracts?.poolPass}
              tokenContract={contracts?.token}
              userAddress={userAddress}
              blockTimestamp={blockTimestamp}
              onPlanCreated={loadData}
              onSubscribeSuccess={() => {
                loadData();
                setActiveTab('subscriptions');
              }}
              isUserSubscribed={hasActiveSubscription}
            />
          )}

          {/* Tab 3: Protocol Analytics & Treasury */}
          {activeTab === 'analytics' && (
            <ProtocolTreasuryView
              tvl={tvl}
              totalYieldSettled={totalYieldSettled}
              subscribersCount={subscribersCount}
              treasuryBalance={treasuryBalance}
              treasuryAddress={treasuryAddress}
            />
          )}
        </main>
      </div>

      {/* Floating Simulation Engine Pop-up Button */}
      <button
        onClick={() => setIsSimulationOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-900/95 dark:bg-slate-800/95 hover:bg-slate-900 dark:hover:bg-slate-700 text-white border border-slate-700/60 shadow-2xl backdrop-blur-md text-xs font-mono transition cursor-pointer hover:scale-105 active:scale-95"
        title="Open Simulation & Playback Engine"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span className="font-sans font-semibold">Dev Sandbox</span>
        <Terminal className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {/* Slide-out Simulation Drawer */}
      <SimulationDrawer
        isOpen={isSimulationOpen}
        onClose={() => setIsSimulationOpen(false)}
        blockNumber={blockNumber}
        blockTimestamp={blockTimestamp}
        currentAccountIndex={currentAccountIndex}
        setCurrentAccountIndex={setCurrentAccountIndex}
        userAddress={userAddress}
        tokenBalance={tokenBalance}
        poolPassContract={contracts?.poolPass}
        onActionSuccess={loadData}
      />
    </div>
  );
}

import { ethers } from 'ethers';
import deployedAddresses from '../contracts/deployedAddresses.json';
import MockERC20Artifact from '../contracts/MockERC20.json';
import MockYieldPoolArtifact from '../contracts/MockYieldPool.json';
import PoolPassArtifact from '../contracts/PoolPass.json';

export const LOCAL_RPC_URL = "http://127.0.0.1:8545";
export const CHAIN_ID = 31337;

// Hardhat deterministic accounts
export const DEMO_ACCOUNTS = [
  {
    name: "Alice (Test Subscriber)",
    address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    privateKey: "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
    role: "Subscriber",
  },
  {
    name: "Bob (Test Subscriber 2)",
    address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    privateKey: "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6",
    role: "Subscriber",
  },
  {
    name: "Service Provider (Treasury)",
    address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    privateKey: "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
    role: "Treasury",
  },
  {
    name: "Deployer / Admin",
    address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    privateKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    role: "Admin",
  },
];

export function getRpcProvider() {
  return new ethers.JsonRpcProvider(LOCAL_RPC_URL);
}

export function getLocalSigner(accountIndex = 0) {
  const provider = getRpcProvider();
  const account = DEMO_ACCOUNTS[accountIndex] || DEMO_ACCOUNTS[0];
  return new ethers.Wallet(account.privateKey, provider);
}

export function getContracts(signerOrProvider) {
  const token = new ethers.Contract(
    deployedAddresses.stakingToken,
    MockERC20Artifact.abi,
    signerOrProvider
  );

  const yieldPool = new ethers.Contract(
    deployedAddresses.yieldPool,
    MockYieldPoolArtifact.abi,
    signerOrProvider
  );

  const poolPass = new ethers.Contract(
    deployedAddresses.poolPass,
    PoolPassArtifact.abi,
    signerOrProvider
  );

  return { token, yieldPool, poolPass, deployedAddresses };
}

// EVM Time Travel for Demo
export async function evmIncreaseTime(seconds) {
  const provider = getRpcProvider();
  await provider.send("evm_increaseTime", [Number(seconds)]);
  await provider.send("evm_mine", []);
}

// Quick Faucet
export async function triggerFaucet(recipientAddress, amountEther = "1000") {
  const deployer = getLocalSigner(3); // Deployer account
  const { token } = getContracts(deployer);
  const tx = await token.faucet(recipientAddress, ethers.parseEther(amountEther));
  await tx.wait();
}

export function formatToken(amountWei, decimals = 2) {
  if (amountWei === null || amountWei === undefined) return "0.00";
  try {
    const num = parseFloat(ethers.formatEther(amountWei));
    return num.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  } catch (err) {
    return "0.00";
  }
}

export function formatTimeRemaining(seconds) {
  const sec = Number(seconds || 0n);
  if (sec <= 0) return "Matured (Unlocked)";
  const days = Math.floor(sec / 86400);
  const hours = Math.floor((sec % 86400) / 3600);
  const minutes = Math.floor((sec % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m ${Math.floor(sec % 60)}s left`;
}

export function formatTimestamp(timestampSec) {
  if (!timestampSec) return "—";
  const date = new Date(Number(timestampSec) * 1000);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Query on-chain billing and yield settlement events for user
export async function fetchUserActivity(poolPassContract, userAddress) {
  if (!poolPassContract || !userAddress) return [];
  try {
    const provider = getRpcProvider();
    const [subEvents, settleEvents, withdrawEvents] = await Promise.all([
      poolPassContract.queryFilter(poolPassContract.filters.Subscribed(userAddress)),
      poolPassContract.queryFilter(poolPassContract.filters.YieldSettled(userAddress)),
      poolPassContract.queryFilter(poolPassContract.filters.PrincipalWithdrawn(userAddress)),
    ]);

    const activity = [];

    for (const ev of subEvents) {
      const block = await provider.getBlock(ev.blockNumber);
      activity.push({
        type: 'STAKE_ACTIVATION',
        title: 'Pass Collateral Staked',
        amount: ev.args[2],
        timestamp: block ? block.timestamp : 0,
        txHash: ev.transactionHash,
        targetFee: ev.args[5],
      });
    }

    for (const ev of settleEvents) {
      const block = await provider.getBlock(ev.blockNumber);
      activity.push({
        type: 'YIELD_SETTLEMENT',
        title: 'Subscription Payment Settled',
        amount: ev.args[2],
        timestamp: block ? block.timestamp : 0,
        txHash: ev.transactionHash,
        recipient: ev.args[1],
      });
    }

    for (const ev of withdrawEvents) {
      const block = await provider.getBlock(ev.blockNumber);
      activity.push({
        type: 'PRINCIPAL_WITHDRAWAL',
        title: 'Principal Recovered at Maturity',
        amount: ev.args[1],
        timestamp: block ? block.timestamp : 0,
        txHash: ev.transactionHash,
      });
    }

    // Sort newest first
    activity.sort((a, b) => b.timestamp - a.timestamp);
    return activity;
  } catch (err) {
    console.error("Error querying contract events:", err);
    return [];
  }
}

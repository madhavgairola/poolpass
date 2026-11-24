# JAYPEE INSTITUTE OF INFORMATION TECHNOLOGY, NOIDA
## DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING AND INFORMATION TECHNOLOGY

---

### **PROJECT REPORT**
# **POOLPASS: A BLOCKCHAIN-BASED YIELD-FUNDED SUBSCRIPTION SYSTEM**
### *Decentralized Recurring Service Subscriptions via Smart Contract Lending Yield Routing, Duration-Adjusted Collateralization, and Non-Custodial Principal Recovery*

---

| SUBMITTED BY | SUBMITTED TO |
| :--- | :--- |
| **Madhav Gairola** (Enrollment No. 9924010400XX) | **Satya Prakash Patel** |
| Project Group / Lab Batch: B.Tech (CSE & IT) | Faculty Guide |

**Course Name:** Fundamentals of Blockchain Technology Lab  
**Course Code:** 26B16CS317  
**Programme:** B.Tech. (Computer Science and Engineering / Information Technology)  
**Academic Session:** 2026–27 (2026 ODD SEM)  
**Project Repository:** https://github.com/madhavgairola/poolpass.git  

---

## TABLE OF CONTENTS

| SECTION | SUBSECTIONS |
| :--- | :--- |
| **Abstract** | — |
| **Acknowledgement & Declaration** | — |
| **Certificate** | — |
| **Chapter 1: Introduction** | 1.1 General<br>1.2 Motivation and Scope |
| **Chapter 2: Problem Statement & Requirement Analysis** | 2.1 Problem Statement<br>2.2 Research Questions and Objectives<br>2.3 Functional Requirements<br>2.4 Non-Functional Requirements |
| **Chapter 3: Technical Background** | 3.1 Blockchain, Smart Contracts and EVM<br>3.2 DeFi Lending Mechanics & Yield Accrual<br>3.3 ERC-20 Standard and OpenZeppelin Security<br>3.4 Duration-Adjusted Staking Mathematics<br>3.5 Off-Chain & Web3 dApp Stack |
| **Chapter 4: Methodology** | 4.1 System Architecture<br>4.2 Smart Contract Architecture & State Machine<br>4.3 Staking, Yield Harvesting & Principal Refund Lifecycle<br>4.4 EVM Time-Travel Simulation Engine<br>4.5 Evaluation Criteria |
| **Chapter 5: Implementation** | 5.1 Smart Contract Layer (PoolPass, MockYieldPool, MockERC20)<br>5.2 Local Hardhat Node & Deployment Pipelines<br>5.3 Automated Integration Testing Suite<br>5.4 Frontend dApp Implementation (React, Ethers.js, Tailwind CSS)<br>5.5 Execution Runbook & Verification Procedure<br>5.6 Project Directory Structure |
| **Chapter 6: Results and Discussion** | 6.1 Functional Verification & Test Suite Outcomes<br>6.2 Evaluation Against Research Objectives<br>6.3 Economic Comparison: Traditional SaaS vs. PoolPass<br>6.4 Interpretation and Limitations |
| **Chapter 7: Conclusion and Future Scope** | 7.1 Conclusion<br>7.2 Key Deliverables & Outcomes<br>7.3 Future Scope |
| **References** | — |

---

## ABSTRACT

The traditional Software-as-a-Service (SaaS) subscription model relies heavily on centralized payment processors, automated credit card debits, and irreversible out-of-pocket operational expenditures. Subscribers permanently forfeit capital for ongoing service access, while service providers suffer from payment churn, involuntary cancellations, and merchant interchange fees.

This project presents **PoolPass**, an autonomous, decentralized, yield-funded subscription protocol designed and implemented for the *Fundamentals of Blockchain Technology Lab (26B16CS317)*. PoolPass inverts conventional recurring payments: rather than spending money out-of-pocket, users deposit stablecoin collateral (`mUSDC`) into an on-chain smart contract vault. The staked principal is deployed into an integrated decentralized lending yield pool (simulating Aave/Compound protocol dynamics). The linearly accrued lending interest is automatically harvested and routed to the service provider's treasury vault to cover periodic nominal subscription fees. Simultaneously, the smart contract timelock guarantees 100% principal preservation—allowing subscribers to withdraw their complete initial collateral once the agreed lock duration matures.

The platform is implemented using **Solidity (v0.8.20)**, **OpenZeppelin Contracts**, and **Hardhat** on an EVM development node, paired with a modern **React 19 + Ethers.js (v6) + Tailwind CSS** decentralized application (dApp). PoolPass implements dynamic duration-adjusted collateral mathematics (incentivizing longer lock commitments with higher lending APY and loyalty stake discounts), on-chain custom plan registration (enabling users to add bespoke subscriptions such as Gemini Pro, Cursor, or ChatGPT), an interactive EVM time-travel simulation engine with live sub-second streaming interest tickers, and an institutional overview dashboard tracking cumulative capital savings and automated billing deadlines. Comprehensive test suites verify contract invariants across 11 automated test cases, confirming zero principal loss, strict lock duration enforcement, and tamper-resistant yield settlement.

**Keywords:** *Blockchain, Ethereum, Smart Contracts, Solidity, Hardhat, Decentralized Finance (DeFi), Yield-Funded Subscriptions, Time-Travel Simulation, ERC-20, Ethers.js, Non-Custodial.*

---

## ACKNOWLEDGEMENT & DECLARATION

### Acknowledgement
I express my sincere gratitude to **Satya Prakash Patel**, Faculty Guide, for his continuous guidance, encouragement, and technical insights throughout the formulation and implementation of this project. I am thankful to the Department of Computer Science & Engineering and Information Technology and the authorities of **Jaypee Institute of Information Technology, Noida** for providing the laboratory infrastructure and computing resources necessary to undertake this work.

I also acknowledge the open-source community, particularly the Ethereum Foundation, OpenZeppelin, Hardhat, and Ethers.js documentation teams, whose standard frameworks and cryptographic libraries formed the foundation of this system. Finally, I extend my appreciation to my peers and family for their constructive feedback and support.

### Declaration
I hereby declare that this project report entitled **“PoolPass: A Blockchain-Based Yield-Funded Subscription System”** is an authentic record of the Project-Based Learning work carried out by me under the supervision of Satya Prakash Patel as part of the *Fundamentals of Blockchain Technology Lab (26B16CS317)* at Jaypee Institute of Information Technology, Noida.

To the best of my knowledge, this report represents original implementation, mathematical modeling, and experimental verification. All references to external literature, standards, and code libraries have been duly acknowledged. I further declare that this work has not been submitted, in whole or in part, for the award of any other academic degree or diploma.

**Place:** Jaypee Institute of Information Technology, Noida  
**Date:** 24-11-2026  

**Madhav Gairola**  
Enrollment No: 9924010400XX  
B.Tech (Information Technology / Computer Science)  

---

## CERTIFICATE

This is to certify that the project report entitled **“PoolPass: A Blockchain-Based Yield-Funded Subscription System”** submitted by **Madhav Gairola** (Enrollment No. 9924010400XX), student of B.Tech. in the Department of Computer Science & Engineering and Information Technology, Jaypee Institute of Information Technology, Noida, has been carried out under my supervision as part of the course requirements for **Fundamentals of Blockchain Technology Lab (26B16CS317)** during the Academic Session 2026–27.

The work presented in this report represents a verified account of the smart contract engineering, testing, and full-stack dApp development carried out by the student.

<br><br>
_____________________________________  
**Signature of Faculty Guide**  
**Name:** Satya Prakash Patel  
**Department:** Computer Science & Engineering and Information Technology  
**Jaypee Institute of Information Technology, Noida**  
**Date:** ______________________________  

---

## CHAPTER 1: INTRODUCTION

### 1.1 General
Over the last decade, subscription billing has become the dominant monetization architecture for consumer software, infrastructure, cloud computing, and digital entertainment. Today, individual consumers and enterprise development teams subscribe to dozens of software tools—ranging from developer platforms (GitHub, Vercel) and AI models (Gemini Pro, Claude Pro, OpenAI) to market intelligence services and media streaming.

However, existing subscription platforms rely entirely on centralized financial rails (credit card networks, Stripe, PayPal). Under this paradigm:
1. **Permanent Sunk Cost for Users:** Every subscription payment is an irreversible cash deduction. A developer paying $15/month spends $180/year that is permanently unrecoverable.
2. **Payment Inefficiency and Churn:** Credit cards expire, banks block international transactions, and merchants face chargebacks and 2.9% + $0.30 transaction fees.
3. **Custodial Fragility:** Users must entrust recurring billing credentials to third-party databases vulnerable to leaks and unauthorized renewal charges.

Decentralized Finance (DeFi) offers an alternative primitive: **yield-generating programmable liquidity**. When stable digital assets (such as USD Coin, USDC) are deposited into decentralized lending protocols (e.g., Aave or Compound), borrowers pay interest, yielding a continuous, predictable annual percentage yield (APY) on the supplier's collateral.

**PoolPass** leverages this DeFi primitive to introduce a *Zero-Cost Subscription Architecture*. Instead of paying cash directly to the service provider, the subscriber deposits an initial stablecoin principal into a smart contract vault. The contract routes this collateral to a lending yield pool. The continuously accrued interest covers the nominal subscription fee and is harvested to the provider's treasury, while the user's underlying principal remains intact and is returned in full upon lock maturity.

### 1.2 Motivation and Scope

#### 1.2.1 Motivation
The motivation for PoolPass stems from two observations:
- **Capital Inefficiency in Web3 & SaaS:** Capital locked in digital wallets often remains idle. Channeling lending yield directly into recurring service costs enables developers and students to access premium tools without depleting their principal.
- **Academic & Educational Objective:** Designing and implementing PoolPass provides hands-on mastery of the full blockchain development lifecycle: Solidity smart contract design, non-custodial custody, duration-adjusted mathematics, local deterministic Hardhat deployment, cryptographic token interactions (ERC-20 approvals and safe transfers), and modern Web3 frontend engineering.

#### 1.2.2 Scope of the Project
The scope of PoolPass encompasses:
1. **Solidity Smart Contracts:**
   - Implementation of `PoolPass.sol` for plan management, dynamic stake requirement calculation, timelocked collateral deposits, yield harvesting, and principal withdrawal.
   - Implementation of `MockYieldPool.sol` and `MockERC20.sol` to deterministically emulate Aave/Compound lending liquidity and USDC tokens locally without relying on external testnets or faucets.
   - Implementation of on-chain custom plan creation (`createCustomPlan`), allowing users to register and fund any arbitrary service (e.g., Gemini Pro at $20/month).
2. **Automated Verification:**
   - A suite of 11 Hardhat unit and integration tests asserting contract invariants, time-travel yield accrual, early-withdrawal prevention, and 100% post-lock principal recovery.
3. **Frontend Application (dApp):**
   - An institutional dApp developed using React 19, Ethers.js v6, and Tailwind CSS.
   - Core functional modules: an **Overview** command center tracking capital savings and deadlines, a **Subscriptions** page with an interactive EVM time-travel simulation engine, a **Plans** matrix with on-chain plan creation, a **Protocol Treasury** analytics explorer, and an integrated **Developer Sandbox**.
4. **Execution Constraints:**
   - 100% local end-to-end execution on Hardhat Network (`localhost:8545`, Chain ID `31337`) with zero external network or mainnet dependencies.

---

## CHAPTER 2: PROBLEM STATEMENT & REQUIREMENT ANALYSIS

### 2.1 Problem Statement
*Can a decentralized blockchain architecture eliminate recurring out-of-pocket software subscription costs by staking stablecoin collateral into an automated yield pool, routing generated interest to service providers while mathematically guaranteeing 100% principal return to users upon lock expiration?*

### 2.2 Research Questions and Objectives
| ID | Research Question | Evaluation Focus |
| :--- | :--- | :--- |
| **RQ1** | Can smart contract mathematics calculate the required collateral deposit based on lock duration, target fees, and lending APY? | Verification of `calculateRequiredStake()` across varying lock periods and loyalty discounts. |
| **RQ2** | Can on-chain lending yield be tracked continuously and redirected to a provider treasury without touching user principal? | Invariant testing of `MockYieldPool` interest calculations and `settleYield()` treasury transfers. |
| **RQ3** | Can EVM timelocks strictly prevent premature principal withdrawal while ensuring 100% recovery post-maturity? | Boundary testing of `block.timestamp` vs `lockExpiry` in `withdrawPrincipal()`. |
| **RQ4** | Can users register custom subscription tiers (e.g. Gemini Pro, Cursor) dynamically on-chain? | Execution of `createCustomPlan()` and on-the-fly quota calculation for new tiers. |
| **RQ5** | Can the entire protocol be demonstrated and verified end-to-end locally with deterministic time travel? | Integration of Hardhat EVM RPC methods (`evm_increaseTime`, `evm_mine`) with a live streaming frontend UI. |

### 2.3 Functional Requirements
1. **Token Minting & Faucet:** Provide deterministic mock stablecoin (`mUSDC`) minting for testing and demonstration accounts.
2. **Tier & Custom Plan Management:** Support pre-configured tiers (Basic $5, Pro $15, Enterprise $50) and permit any user to register custom plans on-chain with custom monthly rates.
3. **Duration-Adjusted Staking:** Support multiple commitment horizons (30 days, 90 days, 180 days, 365 days) with corresponding APY tiers and loyalty stake discounts.
4. **Non-Custodial Staking:** Execute token allowance verification, transfer collateral to the PoolPass contract, and deploy it into the mock lending pool.
5. **Periodic Yield Settlement:** Allow subscribers or protocol keepers to harvest accumulated yield to the service provider's treasury address up to the target cycle fee.
6. **Principal Recovery:** Restrict early withdrawal before lock expiration; permit 100% withdrawal of initial principal once `block.timestamp >= lockExpiry`.
7. **Simulation & Time-Travel Engine:** Advance local blockchain time in discrete steps (+1 Week, +1 Month) or via continuous auto-play, streaming live interest updates to the UI.
8. **Institutional Dashboard:** Display cumulative fees saved ($0 out-of-pocket), principal under management, covered platforms, and a chronological settlement calendar.

### 2.4 Non-Functional Requirements
- **Financial Invariant Integrity:** Staked principal balance in the lending pool must never decrease as a result of yield harvesting or fee settlement.
- **Deterministic Reproducibility:** The local environment must initialize with identical accounts, contract states, and test outcomes across machines.
- **Zero External Dependencies:** No external Web3 providers (Infura, Alchemy) or public testnet faucets required.
- **User Interface Usability:** Professional, uncluttered UI adhering to the *Impeccable* design principles, featuring clear visual data, high contrast in dark and light modes, and zero redundant text.

---

## CHAPTER 3: TECHNICAL BACKGROUND

### 3.1 Blockchain, Smart Contracts and EVM
A blockchain is a decentralized, cryptographically linked state machine. The Ethereum Virtual Machine (EVM) executes deterministic bytecode across all network nodes. Smart contracts deployed to the EVM are immutable once published, guaranteeing that business rules—such as collateral lock durations and interest routing—execute strictly as written without counterparty risk.

PoolPass targets **Solidity 0.8.20** with the Paris EVM target, utilizing built-in overflow and underflow arithmetic protections.

### 3.2 DeFi Lending Mechanics & Yield Accrual
In decentralized lending protocols such as Aave and Compound, liquidity suppliers deposit tokens into a shared pool. Borrowers draw liquidity against overcollateralized assets and pay variable interest. 

In PoolPass, the `MockYieldPool` contract simulates this dynamic deterministically:
$$\Delta Y = \frac{P \times \text{APY} \times \Delta t}{\text{SECONDS\_PER\_YEAR} \times 10000}$$
Where:
- $P$ is the user's staked principal.
- $\text{APY}$ is the effective annual percentage yield in basis points ($1\% = 100\text{ bps}$).
- $\Delta t = t_{\text{current}} - t_{\text{deposit}}$ is the elapsed block timestamp difference.
- $\text{SECONDS\_PER\_YEAR} = 31,536,000$ seconds (365 days).

### 3.3 ERC-20 Standard and OpenZeppelin Security
Tokens in PoolPass comply with the **ERC-20 token standard**, representing fungible stablecoins. PoolPass integrates **OpenZeppelin Contracts (v5.0)**:
- `IERC20` and `SafeERC20`: Ensures safe token transfers and handles non-standard return values.
- `Ownable`: Provides administrative ownership for setting protocol parameters.
- Custom Errors: Replaces gas-heavy `require(condition, "string")` with custom revert errors (e.g. `LockPeriodNotExpired`, `SubscriptionAlreadyActive`), optimizing deployment and execution gas.

### 3.4 Duration-Adjusted Staking Mathematics
A fundamental contribution of PoolPass is its **Duration-Adjusted Collateralization Formula**. In naive yield models, locking capital for longer durations does not adjust the user's required deposit. In PoolPass, committing to longer lock periods earns higher APY tiers and loyalty discounts, substantially reducing upfront capital requirements:

1. **Total Nominal Fee Target:**
   $$F_{\text{total}} = \frac{F_{\text{monthly}} \times T_{\text{duration}}}{30\text{ days}}$$

2. **Base Collateral Required:**
   $$S_{\text{base}} = \frac{F_{\text{total}} \times 365\text{ days} \times 10000}{T_{\text{duration}} \times \text{APY}_{\text{bps}}}$$

3. **Discounted Collateral Deposit:**
   $$S_{\text{required}} = \frac{S_{\text{base}} \times (10000 - \text{Discount}_{\text{bps}})}{10000}$$

#### Duration Configuration Matrix:
| Duration Option | Term Length | Effective APY | Loyalty Discount | Effective Stake (Pro Pass, $15/mo) |
| :--- | :--- | :--- | :--- | :--- |
| **1 Month** | 30 Days | 12.0% | 0% | **$1,520.83 mUSDC** |
| **3 Months** | 90 Days | 15.0% | 5% | **$1,155.83 mUSDC** |
| **6 Months** | 180 Days | 18.0% | 10% | **$912.50 mUSDC** |
| **1 Year** | 365 Days | 24.0% | 20% | **$608.33 mUSDC** |

As demonstrated, committing to a 1-year lock reduces the required collateral deposit by **60.0%** compared to a 1-month commitment, significantly lowering user barrier to entry.

### 3.5 Off-Chain & Web3 dApp Stack
- **Hardhat (v2.22):** Local development environment providing an in-process EVM node with JSON-RPC methods (`evm_increaseTime`, `evm_mine`) for deterministic time manipulation.
- **Ethers.js (v6):** Client-side library interfacing with browser wallets (MetaMask) and local pre-funded deterministic private keys.
- **React 19 + Vite:** Component-driven, reactive frontend with sub-second state re-renders and hot module replacement.
- **Tailwind CSS:** Utility-first styling framework configured with dark and light theme tokens, custom surfaces, and monospace data typography.

---

## CHAPTER 4: METHODOLOGY

### 4.1 System Architecture
PoolPass is organized into a modular three-tier architecture: the Smart Contract & Yield Layer, the Local JSON-RPC Node Layer, and the Web3 dApp Frontend Layer.

```
+-------------------------------------------------------------------------+
|                       POOLPASS FRONTEND dAPP                            |
|             (React 19 + Ethers.js v6 + Tailwind CSS + Vite)             |
|                                                                         |
|  [ Overview ]     [ Subscriptions ]     [ Plans ]     [ Treasury ]      |
|  - Savings KPI    - Live Stream Ticker  - Dynamic Grid- TVL / Cashflow  |
|  - Platform Grid  - Time-Travel Play    - Custom Plans- Smart Contracts |
|  - Deadlines      - Harvest & Withdraw  - Milestones  - Live Events     |
+------------------------------------+------------------------------------+
                                     | JSON-RPC (HTTP: 8545)
                                     v
+-------------------------------------------------------------------------+
|                  LOCAL HARDHAT BLOCKCHAIN (Chain ID: 31337)             |
|                                                                         |
|  - RPC: http://127.0.0.1:8545       - Pre-funded test accounts (Alice,  |
|  - evm_increaseTime / evm_mine        Bob, Treasury, Deployer)          |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                         SMART CONTRACT LAYER                            |
|                                                                         |
|   +-----------------------+              +--------------------------+   |
|   |     PoolPass.sol      |<------------>|    MockYieldPool.sol     |   |
|   | - Dynamic Staking     | Deposits /   | - Deterministic APY      |   |
|   | - createCustomPlan()  | Withdrawals  | - Linear Yield Streaming |   |
|   | - Timelock Custody    |              | - harvestYield()         |   |
|   | - settleYield()       |              +--------------------------+   |
|   +-----------+-----------+                           ^                 |
|               |                                       |                 |
|               v Transfers                             | Liquidity       |
|   +-----------+-----------+                           |                 |
|   |     MockERC20.sol     |---------------------------+                 |
|   | - mUSDC (18 Decimals) |                                             |
|   | - Public Faucet       |                                             |
|   +-----------------------+                                             |
+-------------------------------------------------------------------------+
```

### 4.2 Smart Contract Design & State Machine
The core protocol logic is implemented in `PoolPass.sol`:

```solidity
struct Plan {
    uint256 id;
    string name;
    uint256 monthlyFee; // 18 decimals
    bool isActive;
}

struct DurationOption {
    uint256 durationSeconds;
    string label;
    uint256 apyBps;      // e.g. 1500 = 15%
    uint256 discountBps; // e.g. 500 = 5%
}

struct Subscription {
    uint256 planId;
    uint256 stakedPrincipal;
    uint256 startTime;
    uint256 lockExpiry;
    uint256 targetFeeTotal;
    uint256 yieldSettled;
    bool isWithdrawn;
}
```

#### State Transition Machine:
1. **UNSUBSCRIBED:** User has zero staked principal.
2. **ACTIVE (LOCKED):** User approves tokens and calls `subscribe(planId, durationIndex)`. Principal is locked; yield begins accruing; `block.timestamp < lockExpiry`.
3. **HARVESTING:** Periodic calls to `settleYield(user)` transfer accrued yield to `treasury` without modifying `stakedPrincipal`.
4. **MATURED (UNLOCKED):** `block.timestamp >= lockExpiry`. `withdrawPrincipal()` is enabled.
5. **WITHDRAWN:** 100% of `stakedPrincipal` is returned to user; position resets.

### 4.3 Staking, Yield Harvesting & Principal Refund Lifecycle

```
[User Wallet]
     |
     | 1. approve(poolPass, requiredStake)
     v
[MockERC20 Token]
     |
     | 2. subscribe(planId, durationIndex)
     v
[PoolPass Contract] ---------------------> [MockYieldPool]
     |              3. deposit(principal)         |
     |                                            |
     |                                            | 4. Time advances (evm_increaseTime)
     |                                            |    Lending interest accrues
     |                                            v
     | 5. settleYield(user)               [Accrued Interest]
     +<-------------------------------------------+
     |
     | 6. harvestYield(treasury, amount)
     v
[Provider Treasury]
     |
     | 7. Lock expires (block.timestamp >= lockExpiry)
     |    withdrawPrincipal()
     v
[User Wallet (100% Principal Returned)]
```

### 4.4 EVM Time-Travel Simulation Engine
To verify multi-month and multi-year subscriptions in real-time on a local machine, PoolPass includes an **Interactive Time-Travel Simulation Engine**:
- **Discrete Step Forward:** Sends RPC call `evm_increaseTime(7 * 86400)` (+1 Week) or `evm_increaseTime(30 * 86400)` (+1 Month), followed by `evm_mine`.
- **Continuous Auto-Play Engine:** Runs a background interval (every 2.0 seconds) that advances the EVM clock by 1 week per tick.
- **Auto-Harvest Trigger:** When accrued lending yield reaches the cycle payment threshold, the simulation engine automatically triggers `settleYield(userAddress)`, generates a confirmed on-chain transaction receipt, and routes funds to the treasury.

### 4.5 Evaluation Criteria
The system is evaluated based on:
1. **Mathematical Correctness:** Collateral calculated on-chain matches theoretical formulas.
2. **Capital Preservation:** Staked principal remains strictly constant during yield settlements.
3. **Lock Period Security:** Attempts to withdraw prior to `lockExpiry` revert with `LockPeriodNotExpired`.
4. **Dynamic Extensibility:** Custom subscription plans registered on-chain are immediately selectable and calculable.
5. **UI Responsiveness:** Real-time synchronization of chain state, sub-second ticker updates, and dual-theme visual clarity.

---

## CHAPTER 5: IMPLEMENTATION

### 5.1 Smart Contract Layer
The smart contracts are located in `contracts/`:
- **`PoolPass.sol` (430 lines):**
  - Implements `createCustomPlan(name, monthlyFee)`, `calculateRequiredStake(planId, durationIndex)`, `subscribe(planId, durationIndex)`, `settleYield(user)`, and `withdrawPrincipal()`.
  - Emits indexed events: `PlanCreated`, `Subscribed`, `YieldSettled`, `PrincipalWithdrawn`, `Restaked`.
- **`MockYieldPool.sol` (125 lines):**
  - Manages liquidity positions per user.
  - Implements timestamp-based linear accrual via `getAccruedYield(user)` and non-destructive yield harvesting via `harvestYield(user, recipient, amount)`.
- **`MockERC20.sol` (35 lines):**
  - 18-decimal test token with an open `faucet(recipient, amount)` function for instant account funding.

### 5.2 Local Hardhat Node & Deployment Pipelines
`scripts/deploy.js` automates reproducible local deployment:
1. Deploys `MockERC20` (`mUSDC`).
2. Deploys `MockYieldPool` and supplies 1,000,000 mUSDC reserve liquidity.
3. Deploys `PoolPass` with the designated provider treasury address (`0x7099...79C8`).
4. Pre-funds demo accounts: Alice (`0x3C44...3BC`) with 10,000 mUSDC.
5. Exports contract ABIs and deployed addresses directly into `frontend/src/contracts/` for zero-configuration dApp binding.

### 5.3 Automated Integration Testing Suite
Implemented in `test/PoolPass.test.js`, containing 11 comprehensive automated tests executed with Mocha and Chai:
1. `should initialize default plans correctly`
2. `should initialize duration options with duration-adjusted APYs`
3. `should allow any user to create a custom plan like Gemini Pro`
4. `should require significantly lower stake for longer lock commitments`
5. `should allow user to stake tokens and activate subscription`
6. `should prevent duplicate active subscriptions`
7. `should accrue interest linearly as time passes on local node`
8. `should harvest yield and route it directly to treasury`
9. `should revert if user attempts to withdraw before lock period expires`
10. `should allow user to withdraw 100% principal after lock expiry`
11. `should allow re-staking existing principal for a new duration period`

### 5.4 Frontend dApp Implementation
Developed in `frontend/src/`:
- **`App.jsx`:** Root component managing wallet connection, account switching, global data polling, and top-level routing.
- **`components/Header.jsx`:** 3-column navigation grid featuring the brand logo, centered navigation tabs (`Overview`, `Subscriptions`, `Plans`, `Treasury & Analytics`), wallet pill with account selector, balance badge, faucet button, and theme switcher.
- **`components/HomeOverview.jsx`:** Executive dashboard featuring total capital saved, active working collateral, next settlement countdown, covered digital tools grid (GitHub, Claude, Gemini, TradingView), and settlement timeline.
- **`components/ActiveSubscription.jsx`:** Active pass command center featuring the fast-forward play/pause simulation controller, streaming yield ticker, milestone settlement tracker, manual step buttons, and on-chain activity feed.
- **`components/PlanSelector.jsx`:** Duration matrix, tier cards, projected settlement schedule preview, and the modal dialog for registering custom subscription plans on-chain.
- **`components/ProtocolTreasuryView.jsx`:** Institutional analytics dashboard detailing Total Value Locked (TVL), cumulative treasury cashflow, subscriber count, and verified contract address registry.
- **`utils/web3.js`:** Utility module wrapping Ethers.js providers, contract instances, formatters, and EVM RPC commands.

### 5.5 Execution Runbook & Verification Procedure

#### Prerequisites
- Node.js v18+ (tested on Node.js v20/v25) and npm.
- Git.

#### Step-by-Step Runbook
```bash
# 1. Clone repository
git clone https://github.com/madhavgairola/poolpass.git
cd poolpass

# 2. Install dependencies (Root and Frontend)
npm install
cd frontend && npm install && cd ..

# 3. Start local Hardhat blockchain node (Terminal 1)
npx hardhat node

# 4. Compile contracts and deploy to local node (Terminal 2)
npx hardhat compile
npx hardhat run scripts/deploy.js --network localhost

# 5. Execute automated test suite
npx hardhat test

# 6. Launch frontend dApp (Terminal 3)
npm run frontend:dev
```
Open **`http://localhost:5173`** in any web browser.

### 5.6 Project Directory Structure
```
poolpass/
├── contracts/
│   ├── MockERC20.sol            # 18-decimal mock USDC token with faucet
│   ├── MockYieldPool.sol        # Simulated Aave/Compound lending pool
│   └── PoolPass.sol             # Core subscription and staking protocol
├── scripts/
│   └── deploy.js                # Deployment script & frontend artifact exporter
├── test/
│   └── PoolPass.test.js         # 11 unit & integration tests
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ActiveSubscription.jsx   # Simulation playback & stream ticker
│   │   │   ├── DevSandbox.jsx           # Local node debugger & time controls
│   │   │   ├── Header.jsx               # Universal 3-column navigation header
│   │   │   ├── HomeOverview.jsx         # Executive portfolio dashboard
│   │   │   ├── PlanSelector.jsx         # Tier matrix & custom plan modal
│   │   │   ├── ProtocolTreasuryView.jsx # Protocol TVL & cashflow analytics
│   │   │   ├── SimulationDrawer.jsx     # Slide-out simulation sandbox drawer
│   │   │   └── SubscriberDashboard.jsx  # Subscriber view container
│   │   ├── contracts/                   # Exported ABIs and addresses
│   │   ├── utils/
│   │   │   └── web3.js                  # Ethers.js integration & EVM RPCs
│   │   ├── App.jsx                      # Main React application shell
│   │   ├── main.jsx                     # Vite entrypoint with ErrorBoundary
│   │   └── index.css                    # Tailwind CSS design system
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── hardhat.config.js
├── package.json
└── README.md
```

---

## CHAPTER 6: RESULTS AND DISCUSSION

### 6.1 Functional Verification & Test Suite Outcomes
Executing `npx hardhat test` runs all 11 test specifications against an in-memory Hardhat network:

```
  PoolPass - Blockchain-Based Yield-Funded Subscription System
    1. Deployment & Configurations
      ✔ should initialize default plans correctly (110ms)
      ✔ should initialize duration options with duration-adjusted APYs
      ✔ should allow any user to create a custom plan like Gemini Pro (41ms)
    2. Duration-Adjusted Stake Calculation
      ✔ should require significantly lower stake for longer lock commitments
    3. Staking & Subscription Activation
      ✔ should allow user to stake tokens and activate subscription
      ✔ should prevent duplicate active subscriptions (49ms)
    4. Time-Travel & Mock Yield Accrual
      ✔ should accrue interest linearly as time passes on local node
    5. Yield Redirection & Settlement
      ✔ should harvest yield and route it directly to treasury
    6. Early Withdrawal Restrictions
      ✔ should revert if user attempts to withdraw before lock period expires
    7. Post-Lock Principal Recovery
      ✔ should allow user to withdraw 100% principal after lock expiry
    8. Re-staking / Continuous Renewal
      ✔ should allow re-staking existing principal for a new duration period

  11 passing (3s)
```

### 6.2 Evaluation Against Research Objectives
| Objective | Status | Empirical Finding |
| :--- | :--- | :--- |
| **RQ1: Stake Math** | **Validated** | Longer commitments reduce required stake by up to 60.0% through higher APY tiers and loyalty discounts. |
| **RQ2: Yield Routing** | **Validated** | `settleYield()` successfully transfers accrued tokens to the treasury while user principal remains strictly unchanged in `MockYieldPool`. |
| **RQ3: Timelock Security** | **Validated** | `withdrawPrincipal()` reverts with `LockPeriodNotExpired` prior to `lockExpiry`; completes with full token recovery post-maturity. |
| **RQ4: Custom Plans** | **Validated** | `createCustomPlan("Gemini Pro", 20 ether)` registered successfully on-chain; staking quotes and settlement cycles calculated dynamically. |
| **RQ5: Local Integration** | **Validated** | Fast-forward simulation playback verified in headless browser; +1 week time increments trigger live yield ticks and auto-settlements. |

### 6.3 Economic Comparison: Traditional SaaS vs. PoolPass
| Parameter | Traditional SaaS Billing (Stripe / Credit Card) | PoolPass Decentralized Protocol |
| :--- | :--- | :--- |
| **Upfront Outlay** | $0.00 (Requires credit card authorization) | Collateral deposit (e.g. $1,155.83 mUSDC for 90d) |
| **Annual Cash Depletion** | **-$180.00** (Permanently lost out-of-pocket) | **$0.00** (Funded entirely by lending interest) |
| **Principal Capital At Maturity** | $0.00 (Zero capital retention) | **$1,155.83 mUSDC** (100% refunded to user wallet) |
| **Payment Churn Risk** | High (Expired cards, bank declines) | Zero (Automated on-chain yield routing) |
| **Transaction Fees** | 2.9% + $0.30 per charge (Merchant fee) | Standard EVM gas fee |
| **Net Wealth Impact (1 Year)** | **-$180.00 net loss** | **+$1,155.83 principal preserved + $0 spent** |

### 6.4 Interpretation and Limitations
1. **Local EVM Environment:** The current system operates against a local Hardhat node (`localhost:8545`). Deployment to public Ethereum testnets (Sepolia) or Layer-2 rollups (Arbitrum, Optimism, Base) has not yet been executed.
2. **Deterministic Yield vs. Variable DeFi APYs:** The `MockYieldPool` implements a fixed APY schedule. In production DeFi environments, lending APYs fluctuate with market utilization. Production versions will require a dynamic buffer or dynamic re-collateralization mechanism.
3. **Smart Contract Audits:** The contracts are verified via comprehensive unit tests, but have not undergone formal verification or a third-party security audit.

---

## CHAPTER 7: CONCLUSION AND FUTURE SCOPE

### 7.1 Conclusion
PoolPass demonstrates that decentralized finance primitives can fundamentally restructure subscription commerce. By substituting permanent cash payments with non-custodial lending yield redirection, subscribers gain access to essential digital services at zero net capital cost, while service providers receive predictable, automated cashflow with zero payment churn. The project successfully validates duration-adjusted staking mathematics, on-chain custom plan creation, EVM time-travel simulation, and an institutional frontend dApp.

### 7.2 Key Deliverables & Outcomes
- **Solidity Smart Contracts:** `PoolPass.sol`, `MockYieldPool.sol`, and `MockERC20.sol` compiled under Solidity 0.8.20 with zero warnings.
- **On-Chain Custom Plans:** Full support for user-registered subscriptions (e.g., Gemini Pro at $20/mo) with live dynamic quota calculations.
- **Automated Verification:** 11/11 Hardhat unit and integration tests passing cleanly.
- **Full-Stack Web3 dApp:** React 19 dApp with real-time streaming interest counters, time-travel playback controls, and dark/light mode support.
- **Open-Source Repository:** Codebase version-controlled and pushed to GitHub: [https://github.com/madhavgairola/poolpass.git](https://github.com/madhavgairola/poolpass.git).

### 7.3 Future Scope
1. **Layer-2 Public Testnet Deployment:** Deploy PoolPass contracts to low-cost Ethereum Layer-2 networks (such as Arbitrum One or Base) to evaluate gas consumption and confirmation latency under public network conditions.
2. **Live DeFi Integration:** Connect the protocol to live Aave v3 or Compound v3 liquidity pools via wrapped aToken/cToken adapters.
3. **Multi-Token Collateral Support:** Expand collateral options beyond mUSDC to accept yield-bearing assets (e.g. stETH, sDAI).
4. **Decentralized Keeper Network:** Integrate Chainlink Automation or Gelato Network to execute automated periodic yield settlements without user intervention.
5. **Secondary Market & NFT Pass Transferability:** Wrap active subscriptions into transferable ERC-721/ERC-1155 tokens, allowing users to trade or transfer active passes on secondary marketplaces.

---

## REFERENCES

1. S. Nakamoto, “Bitcoin: A Peer-to-Peer Electronic Cash System,” 2008. [Online]. Available: https://bitcoin.org/bitcoin.pdf
2. V. Buterin, “Ethereum: A Next-Generation Smart Contract and Decentralized Application Platform,” *Ethereum White Paper*, 2014. [Online]. Available: https://ethereum.org/en/whitepaper/
3. F. Vogelsteller and V. Buterin, “EIP-20: Token Standard,” *Ethereum Improvement Proposals*, no. 20, 2015. [Online]. Available: https://eips.ethereum.org/EIPS/eip-20
4. OpenZeppelin, “OpenZeppelin Contracts Documentation: SafeERC20 and Ownable,” 2024. [Online]. Available: https://docs.openzeppelin.com/contracts/
5. Solidity Team, “Solidity Documentation (v0.8.20),” Ethereum Foundation, 2024. [Online]. Available: https://docs.soliditylang.org
6. Nomic Foundation, “Hardhat: Ethereum Development Environment for Professionals,” 2024. [Online]. Available: https://hardhat.org/docs
7. R. Moore, “Ethers.js: Complete, Compact, and Simple Ethereum Library in JavaScript and TypeScript (v6),” 2024. [Online]. Available: https://docs.ethers.org/v6/
8. Aave Protocol, “Aave v3 Technical Paper: Architecture and Interest Rate Mechanics,” 2022. [Online]. Available: https://github.com/aave/aave-v3-core
9. G. Wood, “Ethereum: A Secure Decentralised Generalised Transaction Ledger,” *Ethereum Yellow Paper*, 2014.
10. M. Gairola, “PoolPass: A Blockchain-Based Yield-Funded Subscription System,” *Source Code Repository*, GitHub, Nov. 2026. [Online]. Available: https://github.com/madhavgairola/poolpass.git

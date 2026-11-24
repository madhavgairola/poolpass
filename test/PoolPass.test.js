const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("PoolPass - Blockchain-Based Yield-Funded Subscription System", function () {
  let mockToken;
  let mockYieldPool;
  let poolPass;
  let owner;
  let treasury;
  let alice;
  let bob;

  const ONE_DAY = 24 * 3600;
  const THIRTY_DAYS = 30 * ONE_DAY;
  const NINETY_DAYS = 90 * ONE_DAY;
  const ONE_YEAR = 365 * ONE_DAY;

  beforeEach(async function () {
    [owner, treasury, alice, bob] = await ethers.getSigners();

    // 1. Deploy MockERC20 (18 decimals)
    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    mockToken = await MockERC20Factory.deploy("Mock USD Coin", "mUSDC", 18);
    await mockToken.waitForDeployment();

    // 2. Deploy MockYieldPool
    const MockYieldPoolFactory = await ethers.getContractFactory("MockYieldPool");
    mockYieldPool = await MockYieldPoolFactory.deploy(await mockToken.getAddress());
    await mockYieldPool.waitForDeployment();

    // 3. Deploy PoolPass
    const PoolPassFactory = await ethers.getContractFactory("PoolPass");
    poolPass = await PoolPassFactory.deploy(
      await mockToken.getAddress(),
      await mockYieldPool.getAddress(),
      treasury.address
    );
    await poolPass.waitForDeployment();

    // Seed mock pool with reserve liquidity for yield payouts
    await mockToken.faucet(await mockYieldPool.getAddress(), ethers.parseEther("500000"));

    // Give Alice and Bob starting tokens for tests
    await mockToken.faucet(alice.address, ethers.parseEther("10000"));
    await mockToken.faucet(bob.address, ethers.parseEther("10000"));

    // Approve PoolPass contract from Alice and Bob
    await mockToken.connect(alice).approve(await poolPass.getAddress(), ethers.MaxUint256);
    await mockToken.connect(bob).approve(await poolPass.getAddress(), ethers.MaxUint256);
  });

  describe("1. Deployment & Configurations", function () {
    it("should initialize default plans correctly", async function () {
      const plans = await poolPass.getAllPlans();
      expect(plans.length).to.equal(3);
      expect(plans[0].name).to.equal("Basic Pass");
      expect(plans[0].monthlyFee).to.equal(ethers.parseEther("5"));
      expect(plans[1].name).to.equal("Pro Pass");
      expect(plans[1].monthlyFee).to.equal(ethers.parseEther("15"));
      expect(plans[2].name).to.equal("Enterprise Pass");
      expect(plans[2].monthlyFee).to.equal(ethers.parseEther("50"));
    });

    it("should initialize duration options with duration-adjusted APYs", async function () {
      const options = await poolPass.getDurationOptions();
      expect(options.length).to.equal(4);
      expect(options[0].durationSeconds).to.equal(30n * 24n * 3600n);
      expect(options[0].apyBps).to.equal(1200n); // 12%
      expect(options[1].apyBps).to.equal(1500n); // 15%
      expect(options[2].apyBps).to.equal(1800n); // 18%
      expect(options[3].apyBps).to.equal(2400n); // 24%
    });
  });

  describe("2. Duration-Adjusted Stake Calculation", function () {
    it("should require significantly lower stake for longer lock commitments", async function () {
      // Plan 0: Basic Pass (5 mUSDC/month)
      const res30d = await poolPass.calculateRequiredStake(0, 0); // 30 days
      const res90d = await poolPass.calculateRequiredStake(0, 1); // 90 days
      const res180d = await poolPass.calculateRequiredStake(0, 2); // 180 days
      const res365d = await poolPass.calculateRequiredStake(0, 3); // 365 days

      // 30d stake: (5 * 365 * 10000) / (30 * 1200) = ~506.94 mUSDC
      // 90d stake with 15% APY + 5% loyalty discount
      // 365d stake with 24% APY + 20% loyalty discount
      expect(res365d.requiredStake).to.be.lessThan(res180d.requiredStake);
      expect(res180d.requiredStake).to.be.lessThan(res90d.requiredStake);
      expect(res90d.requiredStake).to.be.lessThan(res30d.requiredStake);

      // Verify concrete values
      const stake30dFloat = parseFloat(ethers.formatEther(res30d.requiredStake));
      const stake365dFloat = parseFloat(ethers.formatEther(res365d.requiredStake));

      expect(stake30dFloat).to.be.closeTo(506.94, 1.0);
      expect(stake365dFloat).to.be.closeTo(202.77, 1.0); // 20% discount on 253.47 = ~202.7
    });
  });

  describe("3. Staking & Subscription Activation", function () {
    it("should allow user to stake tokens and activate subscription", async function () {
      const planId = 1; // Pro Pass (15 mUSDC/month)
      const durationIndex = 0; // 30 days
      const { requiredStake, durationSeconds } = await poolPass.calculateRequiredStake(planId, durationIndex);

      const aliceInitialBal = await mockToken.balanceOf(alice.address);
      const tx = await poolPass.connect(alice).subscribe(planId, durationIndex);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      // Verify token balance deducted
      const aliceAfterBal = await mockToken.balanceOf(alice.address);
      expect(aliceInitialBal - aliceAfterBal).to.equal(requiredStake);

      // Verify subscription record
      const sub = await poolPass.subscriptions(alice.address);
      expect(sub.stakedPrincipal).to.equal(requiredStake);
      expect(sub.startTime).to.equal(block.timestamp);
      expect(sub.lockExpiry).to.equal(BigInt(block.timestamp) + durationSeconds);
      expect(sub.isWithdrawn).to.be.false;

      // Verify view function
      expect(await poolPass.isSubscriptionActive(alice.address)).to.be.true;
    });

    it("should prevent duplicate active subscriptions", async function () {
      await poolPass.connect(alice).subscribe(0, 0);
      await expect(
        poolPass.connect(alice).subscribe(0, 0)
      ).to.be.revertedWithCustomError(poolPass, "SubscriptionAlreadyActive");
    });
  });

  describe("4. Time-Travel & Mock Yield Accrual", function () {
    it("should accrue interest linearly as time passes on local node", async function () {
      await poolPass.connect(alice).subscribe(0, 0); // 30 days lock at 12% APY

      // Fast-forward 15 days
      await time.increase(15 * ONE_DAY);

      const yield15d = await poolPass.getAccruedYield(alice.address);
      expect(yield15d).to.be.gt(0n);

      // Fast-forward another 15 days (30 days total)
      await time.increase(15 * ONE_DAY);

      const yield30d = await poolPass.getAccruedYield(alice.address);
      expect(yield30d).to.be.gt(yield15d);

      // At 30 days, yield should approximate the target monthly subscription fee (~5 mUSDC)
      const yieldFloat = parseFloat(ethers.formatEther(yield30d));
      expect(yieldFloat).to.be.closeTo(5.0, 0.2);
    });
  });

  describe("5. Yield Redirection & Settlement", function () {
    it("should harvest yield and route it directly to treasury", async function () {
      await poolPass.connect(alice).subscribe(0, 0);

      // Fast forward 30 days
      await time.increase(30 * ONE_DAY);

      const treasuryBalBefore = await mockToken.balanceOf(treasury.address);
      
      // Settle yield
      const tx = await poolPass.settleYield(alice.address);
      await tx.wait();

      const treasuryBalAfter = await mockToken.balanceOf(treasury.address);
      const yieldPaid = treasuryBalAfter - treasuryBalBefore;

      expect(yieldPaid).to.be.gt(0n);
      const yieldPaidFloat = parseFloat(ethers.formatEther(yieldPaid));
      expect(yieldPaidFloat).to.be.closeTo(5.0, 0.2);

      // Verify user principal remains 100% in pool
      const sub = await poolPass.subscriptions(alice.address);
      expect(sub.stakedPrincipal).to.be.gt(0n);
    });
  });

  describe("6. Early Withdrawal Restrictions", function () {
    it("should revert if user attempts to withdraw before lock period expires", async function () {
      await poolPass.connect(alice).subscribe(0, 0);

      // Advance only 10 days out of 30 days
      await time.increase(10 * ONE_DAY);

      await expect(
        poolPass.connect(alice).withdrawPrincipal()
      ).to.be.revertedWithCustomError(poolPass, "LockPeriodNotExpired");
    });
  });

  describe("7. Post-Lock Principal Recovery", function () {
    it("should allow user to withdraw 100% principal after lock expiry", async function () {
      const { requiredStake } = await poolPass.calculateRequiredStake(0, 0);
      const aliceInitialBal = await mockToken.balanceOf(alice.address);

      await poolPass.connect(alice).subscribe(0, 0);
      const aliceAfterStakeBal = await mockToken.balanceOf(alice.address);
      expect(aliceInitialBal - aliceAfterStakeBal).to.equal(requiredStake);

      // Fast-forward past lock duration (31 days)
      await time.increase(31 * ONE_DAY);

      // Withdraw principal
      await poolPass.connect(alice).withdrawPrincipal();

      // Alice receives 100% of her principal back
      const aliceFinalBal = await mockToken.balanceOf(alice.address);
      expect(aliceFinalBal).to.equal(aliceInitialBal);

      // Subscription is marked as withdrawn and inactive
      expect(await poolPass.isSubscriptionActive(alice.address)).to.be.false;
      const sub = await poolPass.subscriptions(alice.address);
      expect(sub.isWithdrawn).to.be.true;
      expect(sub.stakedPrincipal).to.equal(0n);
    });
  });

  describe("8. Re-staking / Continuous Renewal", function () {
    it("should allow re-staking existing principal for a new duration period", async function () {
      await poolPass.connect(alice).subscribe(0, 0); // 30 days lock

      // Fast forward past lock expiry
      await time.increase(31 * ONE_DAY);

      // Restake for another 90 days with Pro Pass
      await poolPass.connect(alice).restake(1, 1);

      expect(await poolPass.isSubscriptionActive(alice.address)).to.be.true;
      const sub = await poolPass.subscriptions(alice.address);
      expect(sub.planId).to.equal(1n);
      expect(sub.isWithdrawn).to.be.false;
    });
  });
});

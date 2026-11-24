// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./MockYieldPool.sol";

/**
 * @title PoolPass
 * @notice A Blockchain-Based Yield-Funded Subscription System.
 * Users stake tokens into a yield-generating pool. The accrued interest pays
 * for recurring subscription fees while the staked principal remains 100% recoverable.
 */
contract PoolPass is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable stakingToken;
    MockYieldPool public immutable yieldPool;
    address public treasury; // Service provider / fee recipient

    uint256 public constant SECONDS_PER_DAY = 1 days;
    uint256 public constant SECONDS_PER_YEAR = 365 days;
    uint256 public constant BPS_DENOMINATOR = 10000;

    enum SubscriptionStatus {
        INACTIVE,
        ACTIVE,
        EXPIRED,
        WITHDRAWN
    }

    struct Plan {
        uint256 id;
        string name;
        uint256 monthlyFee; // In token units (e.g. 5 * 10^18)
        bool isActive;
    }

    struct DurationOption {
        uint256 durationSeconds; // Lock time in seconds (e.g. 30 days, 90 days, etc.)
        string label;            // e.g. "1 Month (30d)"
        uint256 apyBps;          // Duration-adjusted APY in basis points (e.g. 1200 = 12%)
        uint256 discountBps;     // Loyalty stake discount (e.g. 500 = 5% less stake required)
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

    // Plan ID => Plan
    Plan[] public plans;
    // Duration option index => DurationOption
    DurationOption[] public durationOptions;

    // User address => Subscription
    mapping(address => Subscription) public subscriptions;

    // Global analytics
    uint256 public totalStakedTVL;
    uint256 public totalYieldSettledToTreasury;
    uint256 public totalSubscribersCount;

    // Events
    event PlanCreated(uint256 indexed planId, string name, uint256 monthlyFee);
    event DurationOptionAdded(uint256 indexed index, uint256 durationSeconds, uint256 apyBps, uint256 discountBps);
    event Subscribed(
        address indexed user,
        uint256 indexed planId,
        uint256 stakedPrincipal,
        uint256 startTime,
        uint256 lockExpiry,
        uint256 targetFee
    );
    event YieldSettled(address indexed user, address indexed treasury, uint256 amount);
    event PrincipalWithdrawn(address indexed user, uint256 amount);
    event Restaked(address indexed user, uint256 planId, uint256 newLockExpiry, uint256 additionalStake);
    event TreasuryUpdated(address newTreasury);

    // Custom errors
    error LockPeriodNotExpired(uint256 currentTime, uint256 lockExpiry);
    error SubscriptionAlreadyActive();
    error SubscriptionNotActive();
    error PlanDoesNotExist();
    error PlanInactive();
    error InvalidDurationOption();
    error ZeroStakeCalculated();
    error NothingToWithdraw();

    constructor(
        address _stakingToken,
        address _yieldPool,
        address _treasury
    ) Ownable(msg.sender) {
        require(_stakingToken != address(0), "Invalid token");
        require(_yieldPool != address(0), "Invalid pool");
        require(_treasury != address(0), "Invalid treasury");

        stakingToken = IERC20(_stakingToken);
        yieldPool = MockYieldPool(_yieldPool);
        treasury = _treasury;

        // Approve yield pool to pull tokens for deposits
        IERC20(_stakingToken).approve(_yieldPool, type(uint256).max);

        _initializeDefaultConfigurations();
    }

    /**
     * @notice Initialize default subscription plans and duration discount tiers
     */
    function _initializeDefaultConfigurations() internal {
        // Plans (Monthly rates in 18 decimals)
        plans.push(Plan(0, "Basic Pass", 5 ether, true));         // 5 mUSDC / month
        plans.push(Plan(1, "Pro Pass", 15 ether, true));          // 15 mUSDC / month
        plans.push(Plan(2, "Enterprise Pass", 50 ether, true));   // 50 mUSDC / month

        // Duration options with duration-adjusted APYs & stake discounts
        durationOptions.push(DurationOption(30 days, "1 Month (30 Days)", 1200, 0));       // 12% APY, 0% discount
        durationOptions.push(DurationOption(90 days, "3 Months (90 Days)", 1500, 500));    // 15% APY, 5% discount
        durationOptions.push(DurationOption(180 days, "6 Months (180 Days)", 1800, 1000)); // 18% APY, 10% discount
        durationOptions.push(DurationOption(365 days, "1 Year (365 Days)", 2400, 2000));   // 24% APY, 20% discount
    }

    /**
     * @notice Calculate duration-adjusted required stake for a given plan and duration option
     */
    function calculateRequiredStake(uint256 planId, uint256 durationIndex) public view returns (
        uint256 requiredStake,
        uint256 totalSubscriptionFee,
        uint256 durationSeconds,
        uint256 effectiveApyBps
    ) {
        if (planId >= plans.length) revert PlanDoesNotExist();
        if (durationIndex >= durationOptions.length) revert InvalidDurationOption();

        Plan memory plan = plans[planId];
        DurationOption memory option = durationOptions[durationIndex];

        durationSeconds = option.durationSeconds;
        effectiveApyBps = option.apyBps;

        // Total fee over duration
        totalSubscriptionFee = (plan.monthlyFee * durationSeconds) / (30 days);

        // Base stake needed
        uint256 baseStake = (totalSubscriptionFee * SECONDS_PER_YEAR * BPS_DENOMINATOR) / 
                            (durationSeconds * effectiveApyBps);

        // Apply loyalty duration discount
        if (option.discountBps > 0) {
            requiredStake = (baseStake * (BPS_DENOMINATOR - option.discountBps)) / BPS_DENOMINATOR;
        } else {
            requiredStake = baseStake;
        }

        if (requiredStake == 0) revert ZeroStakeCalculated();
    }

    /**
     * @notice Stake tokens to activate a yield-funded subscription
     */
    function subscribe(uint256 planId, uint256 durationIndex) external {
        if (planId >= plans.length) revert PlanDoesNotExist();
        if (!plans[planId].isActive) revert PlanInactive();
        if (durationIndex >= durationOptions.length) revert InvalidDurationOption();

        Subscription storage sub = subscriptions[msg.sender];
        if (sub.stakedPrincipal > 0 && !sub.isWithdrawn && block.timestamp < sub.lockExpiry) {
            revert SubscriptionAlreadyActive();
        }

        (uint256 requiredStake, uint256 totalFee, uint256 durationSeconds, uint256 effectiveApy) = 
            calculateRequiredStake(planId, durationIndex);

        // Pull required stake from user to PoolPass
        stakingToken.safeTransferFrom(msg.sender, address(this), requiredStake);

        // Deposit principal into MockYieldPool on behalf of user
        yieldPool.deposit(requiredStake, msg.sender, effectiveApy);

        sub.planId = planId;
        sub.stakedPrincipal = requiredStake;
        sub.startTime = block.timestamp;
        sub.lockExpiry = block.timestamp + durationSeconds;
        sub.targetFeeTotal = totalFee;
        sub.yieldSettled = 0;
        sub.isWithdrawn = false;

        totalStakedTVL += requiredStake;
        totalSubscribersCount += 1;

        emit Subscribed(
            msg.sender,
            planId,
            requiredStake,
            block.timestamp,
            sub.lockExpiry,
            totalFee
        );
    }

    /**
     * @notice Query current accrued yield for a user
     */
    function getAccruedYield(address user) external view returns (uint256) {
        return yieldPool.getAccruedYield(user);
    }

    /**
     * @notice Settle accrued yield to the service provider/treasury
     */
    function settleYield(address user) public returns (uint256 settled) {
        Subscription storage sub = subscriptions[user];
        if (sub.stakedPrincipal == 0 || sub.isWithdrawn) {
            return 0;
        }

        uint256 accrued = yieldPool.getAccruedYield(user);
        if (accrued == 0) {
            return 0;
        }

        // Remaining fee to settle for current subscription cycle
        uint256 feeRemaining = 0;
        if (sub.targetFeeTotal > sub.yieldSettled) {
            feeRemaining = sub.targetFeeTotal - sub.yieldSettled;
        }

        // Settle up to feeRemaining, or whatever accrued
        uint256 toSettle = accrued;
        if (feeRemaining > 0 && toSettle > feeRemaining) {
            toSettle = feeRemaining;
        }

        if (toSettle > 0) {
            settled = yieldPool.harvestYield(user, treasury, toSettle);
            sub.yieldSettled += settled;
            totalYieldSettledToTreasury += settled;

            emit YieldSettled(user, treasury, settled);
        }
    }

    /**
     * @notice Withdraw 100% of staked principal once the lock duration has expired.
     */
    function withdrawPrincipal() external {
        Subscription storage sub = subscriptions[msg.sender];
        if (sub.stakedPrincipal == 0 || sub.isWithdrawn) {
            revert NothingToWithdraw();
        }

        if (block.timestamp < sub.lockExpiry) {
            revert LockPeriodNotExpired(block.timestamp, sub.lockExpiry);
        }

        // Settle any remaining available yield first
        settleYield(msg.sender);

        uint256 principal = sub.stakedPrincipal;
        sub.stakedPrincipal = 0;
        sub.isWithdrawn = true;
        totalStakedTVL -= principal;

        // Withdraw from yield pool directly to user
        yieldPool.withdraw(principal, msg.sender, msg.sender);

        emit PrincipalWithdrawn(msg.sender, principal);
    }

    /**
     * @notice Re-stake / renew subscription without withdrawing to user's wallet
     */
    function restake(uint256 newPlanId, uint256 newDurationIndex) external {
        Subscription storage sub = subscriptions[msg.sender];
        if (sub.stakedPrincipal == 0 || sub.isWithdrawn) {
            revert SubscriptionNotActive();
        }
        if (block.timestamp < sub.lockExpiry) {
            revert LockPeriodNotExpired(block.timestamp, sub.lockExpiry);
        }

        // Settle pending yield
        settleYield(msg.sender);

        (uint256 newRequiredStake, uint256 newTotalFee, uint256 durationSeconds, uint256 newApy) = 
            calculateRequiredStake(newPlanId, newDurationIndex);

        uint256 oldPrincipal = sub.stakedPrincipal;

        if (newRequiredStake > oldPrincipal) {
            uint256 delta = newRequiredStake - oldPrincipal;
            stakingToken.safeTransferFrom(msg.sender, address(this), delta);
            yieldPool.deposit(delta, msg.sender, newApy);
            totalStakedTVL += delta;
        } else if (newRequiredStake < oldPrincipal) {
            uint256 refund = oldPrincipal - newRequiredStake;
            yieldPool.withdraw(refund, msg.sender, msg.sender);
            totalStakedTVL -= refund;
        }

        sub.planId = newPlanId;
        sub.stakedPrincipal = newRequiredStake;
        sub.startTime = block.timestamp;
        sub.lockExpiry = block.timestamp + durationSeconds;
        sub.targetFeeTotal = newTotalFee;
        sub.yieldSettled = 0;
        sub.isWithdrawn = false;

        emit Restaked(msg.sender, newPlanId, sub.lockExpiry, newRequiredStake);
    }

    /**
     * @notice Check if a user's subscription is currently active and within lock validity
     */
    function isSubscriptionActive(address user) public view returns (bool) {
        Subscription storage sub = subscriptions[user];
        if (sub.stakedPrincipal == 0 || sub.isWithdrawn) {
            return false;
        }
        return block.timestamp <= sub.lockExpiry;
    }

    /**
     * @notice Get comprehensive status of a user's subscription
     */
    function getUserSubscription(address user) external view returns (
        uint256 planId,
        string memory planName,
        uint256 monthlyFee,
        uint256 stakedPrincipal,
        uint256 startTime,
        uint256 lockExpiry,
        uint256 targetFeeTotal,
        uint256 yieldSettled,
        uint256 currentAccruedYield,
        bool isWithdrawn,
        bool isActive,
        uint256 timeRemaining
    ) {
        Subscription storage sub = subscriptions[user];
        planId = sub.planId;
        stakedPrincipal = sub.stakedPrincipal;
        startTime = sub.startTime;
        lockExpiry = sub.lockExpiry;
        targetFeeTotal = sub.targetFeeTotal;
        yieldSettled = sub.yieldSettled;
        isWithdrawn = sub.isWithdrawn;
        
        if (sub.stakedPrincipal > 0 && planId < plans.length) {
            planName = plans[planId].name;
            monthlyFee = plans[planId].monthlyFee;
        }

        currentAccruedYield = yieldPool.getAccruedYield(user);
        isActive = isSubscriptionActive(user);

        if (block.timestamp < sub.lockExpiry) {
            timeRemaining = sub.lockExpiry - block.timestamp;
        } else {
            timeRemaining = 0;
        }
    }

    // --- Admin Functions ---

    function setTreasury(address _newTreasury) external onlyOwner {
        require(_newTreasury != address(0), "Invalid treasury");
        treasury = _newTreasury;
        emit TreasuryUpdated(_newTreasury);
    }

    function addPlan(string memory name, uint256 monthlyFee) external onlyOwner {
        plans.push(Plan(plans.length, name, monthlyFee, true));
        emit PlanCreated(plans.length - 1, name, monthlyFee);
    }

    function togglePlan(uint256 planId, bool active) external onlyOwner {
        if (planId >= plans.length) revert PlanDoesNotExist();
        plans[planId].isActive = active;
    }

    function addDurationOption(
        uint256 durationSeconds,
        string memory label,
        uint256 apyBps,
        uint256 discountBps
    ) external onlyOwner {
        durationOptions.push(DurationOption(durationSeconds, label, apyBps, discountBps));
        emit DurationOptionAdded(durationOptions.length - 1, durationSeconds, apyBps, discountBps);
    }

    // --- View Helpers ---

    function getAllPlans() external view returns (Plan[] memory) {
        return plans;
    }

    function getDurationOptions() external view returns (DurationOption[] memory) {
        return durationOptions;
    }

    function getPlansCount() external view returns (uint256) {
        return plans.length;
    }

    function getDurationOptionsCount() external view returns (uint256) {
        return durationOptions.length;
    }
}

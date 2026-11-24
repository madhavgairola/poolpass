// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IMockERC20Mintable {
    function faucet(address to, uint256 amount) external;
}

/**
 * @title MockYieldPool
 * @notice Simulates an Aave/Compound lending pool with local deterministic yield accrual.
 * Time travel on the local node automatically grows the accrued yield based on APY basis points.
 */
contract MockYieldPool is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable underlyingAsset;
    
    // Default APY in basis points (1200 = 12.00% annual yield)
    uint256 public baseApyBps = 1200;
    uint256 public constant BPS_DENOMINATOR = 10000;
    uint256 public constant SECONDS_PER_YEAR = 365 days;

    struct DepositRecord {
        uint256 principal;
        uint256 effectiveApyBps;
        uint256 lastAccrualTimestamp;
        uint256 accumulatedYield;
    }

    // Mapping: user address => deposit record
    mapping(address => DepositRecord) public deposits;
    uint256 public totalStakedPrincipal;

    event Deposited(address indexed user, uint256 amount, uint256 effectiveApyBps);
    event Withdrawn(address indexed user, uint256 amount, address recipient);
    event YieldClaimed(address indexed user, address indexed recipient, uint256 yieldAmount);
    event ApyUpdated(uint256 newApyBps);

    constructor(address _underlyingAsset) Ownable(msg.sender) {
        require(_underlyingAsset != address(0), "Invalid asset address");
        underlyingAsset = IERC20(_underlyingAsset);
    }

    /**
     * @notice Set base APY for future deposits
     * @param newApyBps APY in basis points (e.g. 1500 = 15%)
     */
    function setBaseApy(uint256 newApyBps) external onlyOwner {
        baseApyBps = newApyBps;
        emit ApyUpdated(newApyBps);
    }

    /**
     * @notice Deposit underlying asset to start earning yield
     * @param amount Amount of tokens to deposit
     * @param onBehalfOf Address credited with the deposit
     * @param effectiveApyBps Duration-adjusted APY (if 0, falls back to baseApyBps)
     */
    function deposit(uint256 amount, address onBehalfOf, uint256 effectiveApyBps) external {
        require(amount > 0, "Amount must be > 0");
        require(onBehalfOf != address(0), "Invalid beneficiary");

        DepositRecord storage record = deposits[onBehalfOf];
        
        // Accrue any previous yield before updating principal
        if (record.principal > 0) {
            record.accumulatedYield += _calculateUnclaimedYield(onBehalfOf);
        }

        uint256 apy = effectiveApyBps > 0 ? effectiveApyBps : baseApyBps;
        record.effectiveApyBps = apy;
        record.principal += amount;
        record.lastAccrualTimestamp = block.timestamp;
        totalStakedPrincipal += amount;

        // Transfer funds from sender to this pool
        underlyingAsset.safeTransferFrom(msg.sender, address(this), amount);

        emit Deposited(onBehalfOf, amount, apy);
    }

    /**
     * @notice Withdraw principal from the yield pool
     * @param amount Amount to withdraw
     * @param onBehalfOf Beneficiary address whose deposit is being withdrawn
     * @param recipient Recipient of the principal
     */
    function withdraw(uint256 amount, address onBehalfOf, address recipient) external {
        require(onBehalfOf != address(0), "Invalid beneficiary");
        require(recipient != address(0), "Invalid recipient");

        DepositRecord storage record = deposits[onBehalfOf];
        require(record.principal >= amount, "Insufficient staked balance");

        // Accrue any pending yield first
        record.accumulatedYield += _calculateUnclaimedYield(onBehalfOf);
        record.lastAccrualTimestamp = block.timestamp;
        record.principal -= amount;
        totalStakedPrincipal -= amount;

        underlyingAsset.safeTransfer(recipient, amount);

        emit Withdrawn(onBehalfOf, amount, recipient);
    }

    /**
     * @notice Harvest and send accrued yield to a specified recipient (e.g. PoolPass treasury)
     * @param user User whose stake generated the yield
     * @param recipient Address to receive the yield tokens
     * @param amount Maximum yield amount to claim (pass 0 to claim all)
     */
    function harvestYield(address user, address recipient, uint256 amount) external returns (uint256) {
        DepositRecord storage record = deposits[user];
        uint256 totalYield = record.accumulatedYield + _calculateUnclaimedYield(user);
        require(totalYield > 0, "No yield available");

        uint256 toClaim = (amount == 0 || amount > totalYield) ? totalYield : amount;

        // Update state
        record.accumulatedYield = totalYield - toClaim;
        record.lastAccrualTimestamp = block.timestamp;

        // Ensure pool has sufficient liquidity to pay out yield (mint via faucet if local mock)
        uint256 poolBalance = underlyingAsset.balanceOf(address(this));
        if (poolBalance < toClaim) {
            try IMockERC20Mintable(address(underlyingAsset)).faucet(address(this), toClaim - poolBalance + 1000 ether) {
                // Mock faucet succeeded
            } catch {
                // If not mintable, rely on existing balance
            }
        }

        underlyingAsset.safeTransfer(recipient, toClaim);

        emit YieldClaimed(user, recipient, toClaim);
        return toClaim;
    }

    /**
     * @notice Calculate total available yield (accumulated + unrealized since last checkpoint)
     */
    function getAccruedYield(address user) external view returns (uint256) {
        DepositRecord storage record = deposits[user];
        return record.accumulatedYield + _calculateUnclaimedYield(user);
    }

    /**
     * @notice Calculate unrealized yield since last accrual timestamp
     */
    function _calculateUnclaimedYield(address user) internal view returns (uint256) {
        DepositRecord storage record = deposits[user];
        if (record.principal == 0 || record.lastAccrualTimestamp == 0 || block.timestamp <= record.lastAccrualTimestamp) {
            return 0;
        }

        uint256 timeElapsed = block.timestamp - record.lastAccrualTimestamp;
        // Yield = (Principal * APY * timeElapsed) / (SECONDS_PER_YEAR * BPS_DENOMINATOR)
        return (record.principal * record.effectiveApyBps * timeElapsed) / (SECONDS_PER_YEAR * BPS_DENOMINATOR);
    }

    /**
     * @notice View function for user deposit info
     */
    function getDepositInfo(address user) external view returns (
        uint256 principal,
        uint256 effectiveApyBps,
        uint256 lastAccrualTimestamp,
        uint256 totalAccruedYield
    ) {
        DepositRecord storage record = deposits[user];
        return (
            record.principal,
            record.effectiveApyBps,
            record.lastAccrualTimestamp,
            record.accumulatedYield + _calculateUnclaimedYield(user)
        );
    }
}

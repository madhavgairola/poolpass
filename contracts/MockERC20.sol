// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockERC20
 * @notice Mock stablecoin (e.g. mUSDC) with public faucet for local testing and PBL demo.
 */
contract MockERC20 is ERC20, Ownable {
    uint8 private _customDecimals;

    constructor(
        string memory name,
        string memory symbol,
        uint8 decimalsValue
    ) ERC20(name, symbol) Ownable(msg.sender) {
        _customDecimals = decimalsValue;
        // Mint 1,000,000 tokens to deployer for liquidity/testing
        _mint(msg.sender, 1_000_000 * 10 ** decimalsValue);
    }

    function decimals() public view virtual override returns (uint8) {
        return _customDecimals;
    }

    /**
     * @notice Allows anyone to mint tokens locally for demo and testing purposes.
     * @param to Recipient address
     * @param amount Token amount in base units
     */
    function faucet(address to, uint256 amount) external {
        _mint(to, amount);
    }

    /**
     * @notice Owner-controlled minting
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}

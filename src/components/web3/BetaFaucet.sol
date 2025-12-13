// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract USDCFaucet is Ownable, ReentrancyGuard {

    IERC20 public immutable usdc;

    uint256 public claimAmount;
    uint256 public cooldownTime;

    mapping(address => uint256) public lastClaimTime;

    event TokensClaimed(address indexed user, uint256 amount, uint256 timestamp);
    event ClaimAmountUpdated(uint256 oldAmount, uint256 newAmount);
    event CooldownTimeUpdated(uint256 oldTime, uint256 newTime);
    event FaucetFunded(address indexed funder, uint256 amount);
    event EmergencyWithdraw(address indexed owner, uint256 amount);

    constructor(
        address _usdc,
        uint256 _claimAmount,
        uint256 _cooldownTime
    ) {
        require(_usdc != address(0), "Invalid USDC address");
        require(_claimAmount > 0, "Claim amount must be > 0");
        require(_cooldownTime > 0, "Cooldown time must be > 0");
        
        usdc = IERC20(_usdc);
        claimAmount = _claimAmount;
        cooldownTime = _cooldownTime;
    }

    function claim() external nonReentrant {
        require(canClaim(msg.sender), "Cooldown period not elapsed");
        require(usdc.balanceOf(address(this)) >= claimAmount, "Insufficient faucet balance");

        lastClaimTime[msg.sender] = block.timestamp;

        require(usdc.transfer(msg.sender, claimAmount), "Transfer failed");
        
        emit TokensClaimed(msg.sender, claimAmount, block.timestamp);
    }

    function canClaim(address user) public view returns (bool) {
        return block.timestamp >= lastClaimTime[user] + cooldownTime;
    }

    function timeUntilNextClaim(address user) public view returns (uint256) {
        if (canClaim(user)) {
            return 0;
        }
        return (lastClaimTime[user] + cooldownTime) - block.timestamp;
    }

    function getFaucetBalance() public view returns (uint256) {
        return usdc.balanceOf(address(this));
    }

    function setClaimAmount(uint256 _newAmount) external onlyOwner {
        require(_newAmount > 0, "Amount must be > 0");
        uint256 oldAmount = claimAmount;
        claimAmount = _newAmount;
        emit ClaimAmountUpdated(oldAmount, _newAmount);
    }

    function setCooldownTime(uint256 _newCooldown) external onlyOwner {
        require(_newCooldown > 0, "Cooldown must be > 0");
        uint256 oldTime = cooldownTime;
        cooldownTime = _newCooldown;
        emit CooldownTimeUpdated(oldTime, _newCooldown);
    }

    function fundFaucet(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be > 0");
        require(usdc.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        emit FaucetFunded(msg.sender, amount);
    }

    function emergencyWithdraw(uint256 amount) external onlyOwner {
        uint256 balance = usdc.balanceOf(address(this));
        uint256 withdrawAmount = amount == 0 ? balance : amount;
        
        require(withdrawAmount <= balance, "Insufficient balance");
        require(usdc.transfer(msg.sender, withdrawAmount), "Transfer failed");
        
        emit EmergencyWithdraw(msg.sender, withdrawAmount);
    }

    function receiveUSDC(uint256 amount) external {
        require(usdc.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        emit FaucetFunded(msg.sender, amount);
    }
}
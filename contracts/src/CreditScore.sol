// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CreditScore {
    struct CreditProfile {
        uint256 creditScore;
        uint256 timestamp;
        address verifiedBy;
        bytes32 profileHash;
        bool isActive;
    }

    struct CreditFactors {
        uint256 onChainHistory;
        uint256 collateralDiversity;
        uint256 protocolUsage;
        uint256 repaymentHistory;
        uint256 financialHealth;
        address user;
        uint256 timestamp;
    }

    mapping(address => CreditProfile) public creditProfiles;
    mapping(address => bool) public authorizedOracles;
    address public owner;
    uint256 public minimumScore = 300;
    uint256 public maximumScore = 850;

    event CreditScoreVerified(address indexed user, uint256 creditScore, bytes32 profileHash, address verifiedBy);
    event CreditScoreUpdated(address indexed user, uint256 oldScore, uint256 newScore, address updatedBy);
    event OracleAuthorized(address indexed oracle, bool authorized);

    modifier onlyOwner() {
        require(msg.sender == owner, "CreditScore: Not owner");
        _;
    }

    modifier onlyOracle() {
        require(authorizedOracles[msg.sender], "CreditScore: Not authorized oracle");
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedOracles[msg.sender] = true;
    }

    function calculateCreditScore(
        uint256 onChainHistory,
        uint256 collateralDiversity, 
        uint256 protocolUsage,
        uint256 repaymentHistory,
        uint256 financialHealth
    ) public pure returns (uint256) {
        uint256 weightedScore = 
            (onChainHistory * 25) / 100 +
            (collateralDiversity * 20) / 100 +
            (protocolUsage * 15) / 100 +
            (repaymentHistory * 15) / 100 +
            (financialHealth * 25) / 100;
        
        uint256 creditScore = 300 + (weightedScore * 55) / 10;
        
        if (creditScore > 850) return 850;
        if (creditScore < 300) return 300;
        return creditScore;
    }

    function hashCreditFactors(CreditFactors memory factors) public pure returns (bytes32) {
        return keccak256(
            abi.encodePacked(
                factors.user,
                factors.onChainHistory,
                factors.collateralDiversity,
                factors.protocolUsage,
                factors.repaymentHistory,
                factors.financialHealth,
                factors.timestamp
            )
        );
    }

    function verifyCreditScore(
        address user,
        uint256 onChainHistory,
        uint256 collateralDiversity,
        uint256 protocolUsage, 
        uint256 repaymentHistory,
        uint256 financialHealth,
        uint256 timestamp
    ) external onlyOracle returns (uint256) {
        require(user != address(0), "CreditScore: Invalid user");
        require(timestamp <= block.timestamp, "CreditScore: Invalid timestamp");

        CreditFactors memory factors = CreditFactors({
            user: user,
            onChainHistory: onChainHistory,
            collateralDiversity: collateralDiversity,
            protocolUsage: protocolUsage,
            repaymentHistory: repaymentHistory,
            financialHealth: financialHealth,
            timestamp: timestamp
        });

        bytes32 profileHash = hashCreditFactors(factors);
        uint256 creditScore = calculateCreditScore(
            onChainHistory,
            collateralDiversity,
            protocolUsage,
            repaymentHistory,
            financialHealth
        );

        CreditProfile storage profile = creditProfiles[user];
        uint256 oldScore = profile.creditScore;
        
        profile.creditScore = creditScore;
        profile.timestamp = block.timestamp;
        profile.verifiedBy = msg.sender;
        profile.profileHash = profileHash;
        profile.isActive = true;

        emit CreditScoreVerified(user, creditScore, profileHash, msg.sender);
        
        if (oldScore != creditScore && oldScore != 0) {
            emit CreditScoreUpdated(user, oldScore, creditScore, msg.sender);
        }

        return creditScore;
    }

    // Make updateCreditScore independent - don't call verifyCreditScore
    function updateCreditScore(
        address user,
        uint256 onChainHistory,
        uint256 collateralDiversity,
        uint256 protocolUsage,
        uint256 repaymentHistory, 
        uint256 financialHealth
    ) external onlyOracle returns (uint256) {
        require(user != address(0), "CreditScore: Invalid user");

        CreditFactors memory factors = CreditFactors({
            user: user,
            onChainHistory: onChainHistory,
            collateralDiversity: collateralDiversity,
            protocolUsage: protocolUsage,
            repaymentHistory: repaymentHistory,
            financialHealth: financialHealth,
            timestamp: block.timestamp
        });

        bytes32 profileHash = hashCreditFactors(factors);
        uint256 creditScore = calculateCreditScore(
            onChainHistory,
            collateralDiversity,
            protocolUsage,
            repaymentHistory,
            financialHealth
        );

        CreditProfile storage profile = creditProfiles[user];
        uint256 oldScore = profile.creditScore;
        
        profile.creditScore = creditScore;
        profile.timestamp = block.timestamp;
        profile.verifiedBy = msg.sender;
        profile.profileHash = profileHash;
        profile.isActive = true;

        emit CreditScoreVerified(user, creditScore, profileHash, msg.sender);
        
        if (oldScore != creditScore && oldScore != 0) {
            emit CreditScoreUpdated(user, oldScore, creditScore, msg.sender);
        }

        return creditScore;
    }

    function getCreditProfile(address user) external view returns (CreditProfile memory) {
        return creditProfiles[user];
    }

    function getCreditScore(address user) external view returns (uint256) {
        require(creditProfiles[user].isActive, "CreditScore: No credit profile");
        return creditProfiles[user].creditScore;
    }

    function hasValidCreditScore(address user) external view returns (bool) {
        return creditProfiles[user].isActive && creditProfiles[user].creditScore >= minimumScore;
    }

    function calculateMaxLTV(uint256 creditScore) public pure returns (uint256) {
        if (creditScore >= 800) return 8500;
        if (creditScore >= 750) return 8000;
        if (creditScore >= 700) return 7500;
        if (creditScore >= 650) return 7000;
        return 6000;
    }

    function calculateInterestRate(uint256 creditScore) public pure returns (uint256) {
        uint256 baseRate = 350;
        if (creditScore >= 800) return baseRate;
        if (creditScore >= 750) return baseRate + 50;
        if (creditScore >= 700) return baseRate + 100;
        if (creditScore >= 650) return baseRate + 200;
        return baseRate + 400;
    }

    function authorizeOracle(address oracle, bool authorized) external onlyOwner {
        authorizedOracles[oracle] = authorized;
        emit OracleAuthorized(oracle, authorized);
    }

    function setScoreRange(uint256 min, uint256 max) external onlyOwner {
        require(min < max, "CreditScore: Invalid range");
        require(max <= 850, "CreditScore: Max too high");
        minimumScore = min;
        maximumScore = max;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "CreditScore: Invalid owner");
        owner = newOwner;
    }
}

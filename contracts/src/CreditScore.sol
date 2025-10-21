// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// Ownable implementation for CreditScore
abstract contract CreditScoreOwnable {
    address private _owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor(address initialOwner) {
        _transferOwnership(initialOwner);
    }

    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    function owner() public view virtual returns (address) {
        return _owner;
    }

    function _checkOwner() internal view virtual {
        require(owner() == msg.sender, "Ownable: caller is not the owner");
    }

    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}

/**
 * @title CreditScore
 * @dev Manages credit scores for P2P lending platform
 * @notice This contract is designed for Sepolia testnet - for demo purposes only
 * @dev Credit scores are set manually for testing, not real credit data
 */
contract CreditScore is CreditScoreOwnable {
    // Mapping from user address to credit score
    mapping(address => uint256) public creditScores;
    
    // Mapping from user address to credit factors
    mapping(address => CreditFactors) public creditFactors;
    
    // Events
    event CreditScoreUpdated(address indexed user, uint256 newScore);
    event CreditFactorsUpdated(address indexed user, CreditFactors factors);
    
    // Struct for credit factors
    struct CreditFactors {
        uint256 paymentHistory;
        uint256 creditUtilization;
        uint256 creditHistoryLength;
        uint256 totalAccounts;
        uint256 creditInquiries;
    }
    
    /**
     * @dev Constructor
     */
    constructor() CreditScoreOwnable(msg.sender) {}

    /**
     * @dev Set credit score for a user (only owner for demo)
     * @param user Address of the user
     * @param score Credit score (300-850)
     * @notice For Sepolia testnet demo purposes only
     */
    function setCreditScore(address user, uint256 score) external onlyOwner {
        require(score >= 300 && score <= 850, "Credit score must be between 300-850");
        creditScores[user] = score;
        emit CreditScoreUpdated(user, score);
    }
    
    /**
     * @dev Set credit factors for a user (only owner for demo)
     * @param user Address of the user
     * @param factors Credit factors struct
     * @notice For Sepolia testnet demo purposes only
     */
    function setCreditFactors(address user, CreditFactors calldata factors) external onlyOwner {
        creditFactors[user] = factors;
        emit CreditFactorsUpdated(user, factors);
    }
    
    /**
     * @dev Calculate credit score based on factors (simplified for demo)
     * @param user Address of the user
     * @return calculatedScore Calculated credit score
     * @notice Simplified calculation for demo - not real credit scoring
     */
    function calculateCreditScore(address user) external view returns (uint256) {
        CreditFactors memory factors = creditFactors[user];
        
        // Simplified credit score calculation for demo
        uint256 score = 300; // Base score
        
        // Payment history (35% weight in FICO)
        if (factors.paymentHistory > 0) {
            score += (factors.paymentHistory * 35) / 100;
        }
        
        // Credit utilization (30% weight) - lower utilization is better
        if (factors.creditUtilization > 0) {
            score += ((100 - factors.creditUtilization) * 30) / 100;
        }
        
        // Credit history length (15% weight) - longer is better
        if (factors.creditHistoryLength > 0) {
            score += (factors.creditHistoryLength * 15) / 100;
        }
        
        // Total accounts (10% weight) - more accounts is better (to a point)
        if (factors.totalAccounts > 0) {
            uint256 accountsScore = factors.totalAccounts > 10 ? 10 : factors.totalAccounts;
            score += (accountsScore * 10);
        }
        
        // Credit inquiries (10% weight) - fewer inquiries is better
        if (factors.creditInquiries > 0) {
            uint256 inquiriesScore = factors.creditInquiries > 10 ? 0 : (10 - factors.creditInquiries);
            score += (inquiriesScore * 10);
        }
        
        return score > 850 ? 850 : score;
    }
    
    /**
     * @dev Get credit score for a user
     * @param user Address of the user
     * @return score User's credit score
     */
    function getCreditScore(address user) external view returns (uint256) {
        return creditScores[user];
    }
    
    /**
     * @dev Check if user has sufficient credit score for lending
     * @param user Address of the user
     * @param minScore Minimum required score
     * @return hasSufficientScore Whether user meets the minimum score
     */
    function hasSufficientCreditScore(address user, uint256 minScore) external view returns (bool) {
        return creditScores[user] >= minScore;
    }
    
    /**
     * @dev Get credit tier based on score
     * @param user Address of the user
     * @return tier Credit tier (1-5)
     */
    function getCreditTier(address user) external view returns (uint256) {
        uint256 score = creditScores[user];
        
        if (score >= 800) return 1; // Excellent
        if (score >= 750) return 2; // Very Good
        if (score >= 700) return 3; // Good
        if (score >= 650) return 4; // Fair
        return 5; // Poor
    }

    /**
     * @dev Get credit factors for a user
     * @param user Address of the user
     * @return factors User's credit factors
     */
    function getCreditFactors(address user) external view returns (CreditFactors memory) {
        return creditFactors[user];
    }

    /**
     * @dev Auto-calculate and set credit score based on factors
     * @param user Address of the user
     * @notice This will override any manually set credit score
     */
    function calculateAndSetCreditScore(address user) external onlyOwner {
        uint256 calculatedScore = this.calculateCreditScore(user);
        creditScores[user] = calculatedScore;
        emit CreditScoreUpdated(user, calculatedScore);
    }
}
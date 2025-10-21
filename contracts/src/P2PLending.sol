// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// ReentrancyGuard implementation for P2PLending
abstract contract P2PReentrancyGuard {
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status;

    constructor() {
        _status = _NOT_ENTERED;
    }

    function _nonReentrantBefore() internal {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
    }

    function _nonReentrantAfter() internal {
        _status = _NOT_ENTERED;
    }

    modifier nonReentrant() {
        _nonReentrantBefore();
        _;
        _nonReentrantAfter();
    }
}

// Ownable implementation for P2PLending
abstract contract P2POwnable {
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
 * @title P2PLending
 * @dev Peer-to-peer lending platform with credit scores
 * @notice This contract accepts Sepolia ETH test tokens on Sepolia testnet
 */
contract P2PLending is P2PReentrancyGuard, P2POwnable {
    // Structs
    struct LoanRequest {
        address borrower;
        uint256 loanAmount;
        uint256 collateralAmount;
        uint256 duration;
        uint256 interestRate;
        uint256 createdAt;
        bool active;
        address lender;
        bool funded;
        uint256 creditScore;
        uint256 amountRepaid;
    }

    struct LenderOffer {
        address lender;
        uint256 maxAmount;
        uint256 minCreditScore;
        uint256 maxLtv; // Changed to maxLtv
        uint256 interestRate;
        uint256 maxDuration;
        bool active;
    }

    // State variables
    uint256 public loanIdCounter;
    uint256 public offerIdCounter;
    
    // Mappings
    mapping(uint256 => LoanRequest) public loanRequests;
    mapping(uint256 => LenderOffer) public lenderOffers;
    mapping(address => uint256) public userCreditScores;
    mapping(address => uint256) public userMaxLtv; // Changed to userMaxLtv
    
    // Events
    event LoanRequestCreated(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 loanAmount,
        uint256 collateralAmount,
        uint256 duration
    );
    
    event LenderOfferCreated(
        uint256 indexed offerId,
        address indexed lender,
        uint256 maxAmount,
        uint256 minCreditScore,
        uint256 maxLtv, // Changed to maxLtv
        uint256 interestRate
    );
    
    event LoanFunded(
        uint256 indexed loanId,
        uint256 indexed offerId,
        address indexed lender,
        uint256 loanAmount
    );
    
    event LoanRepaid(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 amountRepaid
    );

    event CollateralReleased(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 collateralAmount
    );

    event LoanLiquidated(
        uint256 indexed loanId,
        address indexed liquidator,
        uint256 collateralSeized
    );

    /**
     * @dev Constructor
     */
    constructor() P2POwnable(msg.sender) {
        loanIdCounter = 1;
        offerIdCounter = 1;
    }

    /**
     * @dev Set credit score for a user (only owner for demo)
     */
    function setCreditScore(address user, uint256 creditScore) external onlyOwner {
        require(creditScore >= 300 && creditScore <= 850, "Invalid credit score");
        userCreditScores[user] = creditScore;
        userMaxLtv[user] = calculateMaxLtv(creditScore); // Updated
    }

    /**
     * @dev Calculate maximum LTV based on credit score
     */
    function calculateMaxLtv(uint256 creditScore) internal pure returns (uint256) { // Changed to calculateMaxLtv
        if (creditScore >= 800) return 8500; // 85%
        if (creditScore >= 750) return 8000; // 80%
        if (creditScore >= 700) return 7500; // 75%
        if (creditScore >= 650) return 7000; // 70%
        return 6000; // 60%
    }

    /**
     * @dev Create a new loan request - user must send collateral ETH
     */
    function createLoanRequest(
        uint256 _loanAmount,
        uint256 _duration
    ) external payable nonReentrant returns (uint256) {
        require(_loanAmount > 0, "Loan amount must be positive");
        require(msg.value > 0, "Collateral must be sent");
        require(_duration >= 30 days && _duration <= 365 days, "Invalid duration");
        
        uint256 creditScore = userCreditScores[msg.sender];
        require(creditScore >= 600, "Insufficient credit score");
        
        // Calculate actual LTV (loan-to-value)
        uint256 actualLtv = (_loanAmount * 10000) / msg.value; // Changed to actualLtv
        uint256 maxAllowedLtv = calculateMaxLtv(creditScore); // Changed to maxAllowedLtv
        
        require(actualLtv <= maxAllowedLtv, "LTV exceeds maximum allowed");
        
        // Calculate interest rate based on credit score
        uint256 interestRate = calculateInterestRate(creditScore);
        
        loanRequests[loanIdCounter] = LoanRequest({
            borrower: msg.sender,
            loanAmount: _loanAmount,
            collateralAmount: msg.value,
            duration: _duration,
            interestRate: interestRate,
            createdAt: block.timestamp,
            active: true,
            lender: address(0),
            funded: false,
            creditScore: creditScore,
            amountRepaid: 0
        });
        
        emit LoanRequestCreated(
            loanIdCounter,
            msg.sender,
            _loanAmount,
            msg.value,
            _duration
        );
        
        return loanIdCounter++;
    }

    /**
     * @dev Calculate interest rate based on credit score
     */
    function calculateInterestRate(uint256 creditScore) internal pure returns (uint256) {
        uint256 baseRate = 350; // 3.5% base rate
        
        if (creditScore >= 800) return baseRate;
        if (creditScore >= 750) return baseRate + 50; // 4.0%
        if (creditScore >= 700) return baseRate + 100; // 4.5%
        if (creditScore >= 650) return baseRate + 200; // 5.5%
        return baseRate + 400; // 7.5%
    }

    /**
     * @dev Create a lender offer
     */
    function createLenderOffer(
        uint256 _maxAmount,
        uint256 _minCreditScore,
        uint256 _maxLtv, // Changed to _maxLtv
        uint256 _interestRate,
        uint256 _maxDuration
    ) external nonReentrant returns (uint256) {
        require(_maxAmount > 0, "Max amount must be positive");
        require(_minCreditScore >= 600 && _minCreditScore <= 850, "Invalid min credit score");
        require(_maxLtv >= 5000 && _maxLtv <= 9000, "Invalid max LTV");
        require(_interestRate >= 100 && _interestRate <= 2000, "Invalid interest rate");
        require(_maxDuration >= 30 days && _maxDuration <= 365 days, "Invalid max duration");
        
        lenderOffers[offerIdCounter] = LenderOffer({
            lender: msg.sender,
            maxAmount: _maxAmount,
            minCreditScore: _minCreditScore,
            maxLtv: _maxLtv, // Updated
            interestRate: _interestRate,
            maxDuration: _maxDuration,
            active: true
        });
        
        emit LenderOfferCreated(
            offerIdCounter,
            msg.sender,
            _maxAmount,
            _minCreditScore,
            _maxLtv, // Updated
            _interestRate
        );
        
        return offerIdCounter++;
    }

    /**
     * @dev Fund a loan using a lender offer - lender must send ETH
     */
    function fundLoan(uint256 _loanId, uint256 _offerId) external payable nonReentrant {
        require(_loanId > 0 && _loanId < loanIdCounter, "Invalid loan ID");
        require(_offerId > 0 && _offerId < offerIdCounter, "Invalid offer ID");
        
        LoanRequest storage loan = loanRequests[_loanId];
        LenderOffer storage offer = lenderOffers[_offerId];
        
        require(loan.active && !loan.funded, "Loan not available");
        require(offer.active, "Offer not active");
        require(msg.value == loan.loanAmount, "Must send exact loan amount");
        require(loan.loanAmount <= offer.maxAmount, "Loan amount exceeds offer limit");
        require(loan.creditScore >= offer.minCreditScore, "Credit score too low");
        require(loan.duration <= offer.maxDuration, "Loan duration too long");
        
        // Calculate actual LTV and check against offer max LTV
        uint256 actualLtv = (loan.loanAmount * 10000) / loan.collateralAmount; // Changed to actualLtv
        require(actualLtv <= offer.maxLtv, "LTV exceeds offer limit"); // Updated
        
        // Update loan details
        loan.lender = msg.sender;
        loan.funded = true;
        loan.interestRate = offer.interestRate; // Use offer's interest rate
        
        // Transfer loan amount to borrower
        (bool success, ) = loan.borrower.call{value: msg.value}("");
        require(success, "ETH transfer to borrower failed");
        
        emit LoanFunded(_loanId, _offerId, msg.sender, msg.value);
    }

    /**
     * @dev Repay a loan - borrower must send ETH for repayment
     */
    function repayLoan(uint256 _loanId) external payable nonReentrant {
        require(_loanId > 0 && _loanId < loanIdCounter, "Invalid loan ID");
        
        LoanRequest storage loan = loanRequests[_loanId];
        
        require(loan.active && loan.funded, "Loan not active or funded");
        require(msg.sender == loan.borrower, "Only borrower can repay");
        require(block.timestamp <= loan.createdAt + loan.duration, "Loan expired");
        
        // Calculate repayment amount with interest
        uint256 repaymentAmount = calculateRepaymentAmount(loan.loanAmount, loan.interestRate, loan.createdAt);
        require(msg.value >= repaymentAmount, "Insufficient repayment amount");
        
        // Transfer repayment to lender
        (bool success, ) = loan.lender.call{value: repaymentAmount}("");
        require(success, "ETH transfer to lender failed");
        
        // Return excess ETH to borrower
        if (msg.value > repaymentAmount) {
            (success, ) = msg.sender.call{value: msg.value - repaymentAmount}("");
            require(success, "ETH return to borrower failed");
        }
        
        loan.amountRepaid = repaymentAmount;
        loan.active = false;
        
        // Release collateral to borrower
        (success, ) = loan.borrower.call{value: loan.collateralAmount}("");
        require(success, "Collateral release failed");
        
        emit LoanRepaid(_loanId, msg.sender, repaymentAmount);
        emit CollateralReleased(_loanId, msg.sender, loan.collateralAmount);
    }

    /**
     * @dev Liquidate a loan that is past due
     */
    function liquidateLoan(uint256 _loanId) external nonReentrant {
        require(_loanId > 0 && _loanId < loanIdCounter, "Invalid loan ID");
        
        LoanRequest storage loan = loanRequests[_loanId];
        
        require(loan.active && loan.funded, "Loan not active or funded");
        require(block.timestamp > loan.createdAt + loan.duration, "Loan not yet due");
        require(loan.amountRepaid == 0, "Loan already repaid");
        
        // Liquidator gets the collateral
        (bool success, ) = msg.sender.call{value: loan.collateralAmount}("");
        require(success, "ETH transfer to liquidator failed");
        
        loan.active = false;
        
        emit LoanLiquidated(_loanId, msg.sender, loan.collateralAmount);
    }

    /**
     * @dev Calculate repayment amount with interest
     */
    function calculateRepaymentAmount(
        uint256 principal,
        uint256 interestRate,
        uint256 startTime
    ) public view returns (uint256) {
        uint256 timeElapsed = block.timestamp - startTime;
        uint256 interest = (principal * interestRate * timeElapsed) / (365 days * 10000);
        return principal + interest;
    }

    /**
     * @dev Get total repayment amount for a loan
     */
    function getRepaymentAmount(uint256 _loanId) external view returns (uint256) {
        require(_loanId > 0 && _loanId < loanIdCounter, "Invalid loan ID");
        LoanRequest memory loan = loanRequests[_loanId];
        return calculateRepaymentAmount(loan.loanAmount, loan.interestRate, loan.createdAt);
    }

    // View functions

    function getActiveLoanRequests() external view returns (LoanRequest[] memory) {
        uint256 activeCount = 0;
        
        // Count active loans
        for (uint256 i = 1; i < loanIdCounter; i++) {
            if (loanRequests[i].active && !loanRequests[i].funded) {
                activeCount++;
            }
        }
        
        // Create and populate array
        LoanRequest[] memory activeLoans = new LoanRequest[](activeCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 1; i < loanIdCounter; i++) {
            if (loanRequests[i].active && !loanRequests[i].funded) {
                activeLoans[currentIndex] = loanRequests[i];
                currentIndex++;
            }
        }
        
        return activeLoans;
    }

    function getActiveLenderOffers() external view returns (LenderOffer[] memory) {
        uint256 activeCount = 0;
        
        // Count active offers
        for (uint256 i = 1; i < offerIdCounter; i++) {
            if (lenderOffers[i].active) {
                activeCount++;
            }
        }
        
        // Create and populate array
        LenderOffer[] memory activeOffers = new LenderOffer[](activeCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 1; i < offerIdCounter; i++) {
            if (lenderOffers[i].active) {
                activeOffers[currentIndex] = lenderOffers[i];
                currentIndex++;
            }
        }
        
        return activeOffers;
    }

    function getUserCreditScore(address user) external view returns (uint256) {
        return userCreditScores[user];
    }

    function getUserMaxLtv(address user) external view returns (uint256) { // Changed to getUserMaxLtv
        return userMaxLtv[user];
    }

    function getLoanRequest(uint256 loanId) external view returns (LoanRequest memory) {
        require(loanId > 0 && loanId < loanIdCounter, "Invalid loan ID");
        return loanRequests[loanId];
    }

    function getLenderOffer(uint256 offerId) external view returns (LenderOffer memory) {
        require(offerId > 0 && offerId < offerIdCounter, "Invalid offer ID");
        return lenderOffers[offerId];
    }

    /**
     * @dev Get contract ETH balance (for testing)
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // Allow contract to receive ETH
    receive() external payable {}
}
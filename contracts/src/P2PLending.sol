// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {CreditScore} from "./CreditScore.sol";

contract P2PLending {
    // Structs
    struct LoanRequest {
        address borrower;
        uint256 loanAmount;
        uint256 collateralAmount;
        uint256 duration;
        uint256 interestRate; // in basis points
        uint256 createdAt;
        bool active;
        address lender;
        bool funded;
        uint256 creditScore; // Score at time of request
    }

    struct LenderOffer {
        address lender;
        uint256 maxAmount;
        uint256 minCreditScore;
        uint256 maxLTV; // in basis points
        uint256 interestRate; // in basis points
        uint256 maxDuration;
        bool active;
    }

    // State variables
    mapping(uint256 => LoanRequest) public loanRequests;
    mapping(uint256 => LenderOffer) public lenderOffers;
    
    uint256 public loanRequestCounter;
    uint256 public lenderOfferCounter;
    
    address public immutable loanToken; // USDC
    address public immutable collateralToken; // WETH
    CreditScore public immutable creditScoreContract;

    address public owner;

    // Events
    event LoanRequestCreated(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 loanAmount,
        uint256 collateralAmount,
        uint256 interestRate,
        uint256 creditScore
    );
    
    event LenderOfferCreated(
        uint256 indexed offerId,
        address indexed lender,
        uint256 maxAmount,
        uint256 interestRate
    );
    
    event LoanFunded(
        uint256 indexed loanId,
        address indexed lender,
        uint256 amount
    );

    event LoanRepaid(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 amount
    );

    event LoanLiquidated(
        uint256 indexed loanId,
        address indexed liquidator,
        uint256 collateralSeized
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "P2PLending: Not owner");
        _;
    }

    constructor(
        address _loanToken,
        address _collateralToken,
        address _creditScoreContract
    ) {
        loanToken = _loanToken;
        collateralToken = _collateralToken;
        creditScoreContract = CreditScore(_creditScoreContract);
        owner = msg.sender;
    }

    // Create a loan request with credit score verification
    function createLoanRequest(
        uint256 _loanAmount,
        uint256 _collateralAmount,
        uint256 _duration
    ) external returns (uint256) {
        require(_loanAmount > 0, "P2PLending: Loan amount must be positive");
        require(_collateralAmount > 0, "P2PLending: Collateral amount must be positive");
        require(_duration > 0, "P2PLending: Duration must be positive");
        
        // Verify user has valid credit score
        require(
            creditScoreContract.hasValidCreditScore(msg.sender),
            "P2PLending: No valid credit score"
        );

        uint256 userCreditScore = creditScoreContract.getCreditScore(msg.sender);

        // Calculate LTV and check if it's within allowed range
        uint256 ltv = (_loanAmount * 10000) / _collateralAmount;
        uint256 maxLTV = creditScoreContract.calculateMaxLTV(userCreditScore);
        require(ltv <= maxLTV, "P2PLending: LTV exceeds maximum for your credit score");

        // Calculate interest rate based on credit score
        uint256 interestRate = creditScoreContract.calculateInterestRate(userCreditScore);

        // Transfer collateral from borrower
        IERC20(collateralToken).transferFrom(msg.sender, address(this), _collateralAmount);

        uint256 loanId = loanRequestCounter++;
        
        loanRequests[loanId] = LoanRequest({
            borrower: msg.sender,
            loanAmount: _loanAmount,
            collateralAmount: _collateralAmount,
            duration: _duration,
            interestRate: interestRate,
            createdAt: block.timestamp,
            active: true,
            lender: address(0),
            funded: false,
            creditScore: userCreditScore
        });

        emit LoanRequestCreated(
            loanId, 
            msg.sender, 
            _loanAmount, 
            _collateralAmount, 
            interestRate, 
            userCreditScore
        );
        
        return loanId;
    }

    // Create a lender offer
    function createLenderOffer(
        uint256 _maxAmount,
        uint256 _minCreditScore,
        uint256 _maxLTV,
        uint256 _interestRate,
        uint256 _maxDuration
    ) external returns (uint256) {
        require(_maxAmount > 0, "P2PLending: Max amount must be positive");
        require(_minCreditScore >= 300 && _minCreditScore <= 850, "P2PLending: Invalid min credit score");
        require(_maxLTV <= 10000, "P2PLending: Invalid max LTV");

        uint256 offerId = lenderOfferCounter++;
        
        lenderOffers[offerId] = LenderOffer({
            lender: msg.sender,
            maxAmount: _maxAmount,
            minCreditScore: _minCreditScore,
            maxLTV: _maxLTV,
            interestRate: _interestRate,
            maxDuration: _maxDuration,
            active: true
        });

        emit LenderOfferCreated(offerId, msg.sender, _maxAmount, _interestRate);
        return offerId;
    }

    // Fund a loan
    function fundLoan(uint256 _loanId, uint256 _offerId) external {
        LoanRequest storage loan = loanRequests[_loanId];
        LenderOffer storage offer = lenderOffers[_offerId];
        
        require(loan.active, "P2PLending: Loan not active");
        require(offer.active, "P2PLending: Offer not active");
        require(!loan.funded, "P2PLending: Loan already funded");
        require(loan.creditScore >= offer.minCreditScore, "P2PLending: Credit score too low");
        
        // Check LTV requirement
        uint256 ltv = (loan.loanAmount * 10000) / loan.collateralAmount;
        require(ltv <= offer.maxLTV, "P2PLending: LTV too high");
        
        require(loan.duration <= offer.maxDuration, "P2PLending: Duration too long");
        require(loan.loanAmount <= offer.maxAmount, "P2PLending: Loan amount too high");

        // Transfer loan amount from lender to borrower
        IERC20(loanToken).transferFrom(msg.sender, loan.borrower, loan.loanAmount);
        
        loan.lender = msg.sender;
        loan.funded = true;
        offer.active = false;

        emit LoanFunded(_loanId, msg.sender, loan.loanAmount);
    }

    // Repay loan
    function repayLoan(uint256 _loanId) external {
        LoanRequest storage loan = loanRequests[_loanId];
        require(loan.active, "P2PLending: Loan not active");
        require(msg.sender == loan.borrower, "P2PLending: Only borrower can repay");
        require(loan.funded, "P2PLending: Loan not funded");
        require(block.timestamp <= loan.createdAt + loan.duration, "P2PLending: Loan expired");

        uint256 repaymentAmount = loan.loanAmount + (loan.loanAmount * loan.interestRate) / 10000;
        
        // Transfer repayment from borrower to lender
        IERC20(loanToken).transferFrom(msg.sender, loan.lender, repaymentAmount);
        
        // Return collateral to borrower
        IERC20(collateralToken).transfer(loan.borrower, loan.collateralAmount);
        
        loan.active = false;

        emit LoanRepaid(_loanId, msg.sender, repaymentAmount);
    }

    // Liquidate expired loan
    function liquidateLoan(uint256 _loanId) external {
        LoanRequest storage loan = loanRequests[_loanId];
        require(loan.active, "P2PLending: Loan not active");
        require(loan.funded, "P2PLending: Loan not funded");
        require(block.timestamp > loan.createdAt + loan.duration, "P2PLending: Loan not expired");

        // Transfer collateral to lender
        IERC20(collateralToken).transfer(loan.lender, loan.collateralAmount);
        
        loan.active = false;

        emit LoanLiquidated(_loanId, msg.sender, loan.collateralAmount);
    }

    // Get loan details
    function getLoanRequest(uint256 _loanId) external view returns (LoanRequest memory) {
        return loanRequests[_loanId];
    }

    // Get lender offer details
    function getLenderOffer(uint256 _offerId) external view returns (LenderOffer memory) {
        return lenderOffers[_offerId];
    }

    // Get all active loan requests
    function getActiveLoanRequests() external view returns (LoanRequest[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < loanRequestCounter; i++) {
            if (loanRequests[i].active && !loanRequests[i].funded) {
                activeCount++;
            }
        }

        LoanRequest[] memory activeLoans = new LoanRequest[](activeCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 0; i < loanRequestCounter; i++) {
            if (loanRequests[i].active && !loanRequests[i].funded) {
                activeLoans[currentIndex] = loanRequests[i];
                currentIndex++;
            }
        }
        
        return activeLoans;
    }

    // Get all active lender offers
    function getActiveLenderOffers() external view returns (LenderOffer[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < lenderOfferCounter; i++) {
            if (lenderOffers[i].active) {
                activeCount++;
            }
        }

        LenderOffer[] memory activeOffers = new LenderOffer[](activeCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 0; i < lenderOfferCounter; i++) {
            if (lenderOffers[i].active) {
                activeOffers[currentIndex] = lenderOffers[i];
                currentIndex++;
            }
        }
        
        return activeOffers;
    }

    // Get user's current credit score from CreditScore contract
    function getUserCreditScore(address user) external view returns (uint256) {
        return creditScoreContract.getCreditScore(user);
    }

    // Calculate max LTV for a user
    function getUserMaxLTV(address user) external view returns (uint256) {
        uint256 creditScore = creditScoreContract.getCreditScore(user);
        return creditScoreContract.calculateMaxLTV(creditScore);
    }

    // Emergency withdrawal (owner only)
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).transfer(owner, amount);
    }
}
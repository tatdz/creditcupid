// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {CreditScore} from "../src/CreditScore.sol";
import {P2PLending} from "../src/P2PLending.sol";

/**
 * @title DeployP2PLending
 * @dev Deployment script for P2P Lending contracts using Foundry
 * @notice Deploys to Sepolia testnet for demo purposes
 */
contract DeployP2PLending is Script {
    CreditScore public creditScore;
    P2PLending public p2pLending;
    
    // Demo addresses for testing
    address[] public demoAddresses = [
        0x70997970C51812dc3A010C7d01b50e0d17dc79C8,
        0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC,
        0x90F79bf6EB2c4f870365E785982E1f101E93b906,
        0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65
    ];
    
    // Demo credit scores
    uint256[] public demoScores = [750, 680, 820, 610];

    function run() external {
        // Get private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying from:", deployer);
        console.log("Deployer balance:", deployer.balance);

        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);

        // Deploy CreditScore contract
        console.log("Deploying CreditScore contract...");
        creditScore = new CreditScore();
        console.log("CreditScore deployed at:", address(creditScore));

        // Deploy P2PLending contract
        console.log("Deploying P2PLending contract...");
        p2pLending = new P2PLending();
        console.log("P2PLending deployed at:", address(p2pLending));

        // Set up demo credit scores
        console.log("Setting up demo credit scores...");
        
        // Set credit score for deployer
        creditScore.setCreditScore(deployer, 720);
        console.log("Set credit score 720 for deployer:", deployer);

        // Set credit scores for demo addresses
        for (uint256 i = 0; i < demoAddresses.length; i++) {
            creditScore.setCreditScore(demoAddresses[i], demoScores[i]);
            console.log("Set credit score", demoScores[i], "for", demoAddresses[i]);
        }

        // Set up demo credit factors for more realistic testing
        console.log("Setting up demo credit factors...");
        
        // Set credit factors for deployer
        CreditScore.CreditFactors memory deployerFactors = CreditScore.CreditFactors({
            paymentHistory: 95,      // 95% on-time payments
            creditUtilization: 25,   // 25% utilization (excellent)
            creditHistoryLength: 5,  // 5 years
            totalAccounts: 8,        // 8 accounts
            creditInquiries: 1       // 1 recent inquiry
        });
        creditScore.setCreditFactors(deployer, deployerFactors);
        console.log("Set credit factors for deployer");

        // Set credit factors for demo users
        CreditScore.CreditFactors memory excellentUserFactors = CreditScore.CreditFactors({
            paymentHistory: 98,
            creditUtilization: 15,
            creditHistoryLength: 8,
            totalAccounts: 12,
            creditInquiries: 0
        });
        creditScore.setCreditFactors(demoAddresses[2], excellentUserFactors); // 820 score user
        console.log("Set excellent credit factors for user:", demoAddresses[2]);

        // Create some demo lender offers
        console.log("Creating demo lender offers...");
        
        // Offer 1: Conservative lender (low risk, low return)
        p2pLending.createLenderOffer(
            10 ether,    // maxAmount
            700,         // minCreditScore
            7500,        // maxLTV (75%)
            400,         // interestRate (4%)
            90 days      // maxDuration
        );
        console.log("Created conservative lender offer");

        // Offer 2: Aggressive lender (higher risk, higher return)
        p2pLending.createLenderOffer(
            25 ether,    // maxAmount
            650,         // minCreditScore
            8000,        // maxLTV (80%)
            600,         // interestRate (6%)
            180 days     // maxDuration
        );
        console.log("Created aggressive lender offer");

        // Offer 3: Premium lender (excellent credit only)
        p2pLending.createLenderOffer(
            50 ether,    // maxAmount
            800,         // minCreditScore
            8500,        // maxLTV (85%)
            300,         // interestRate (3%)
            365 days     // maxDuration
        );
        console.log("Created premium lender offer");

        vm.stopBroadcast();

        // Save deployment information
        saveDeploymentInfo(deployer);
    }

    function saveDeploymentInfo(address deployer) internal {
        string memory deploymentInfo = string(abi.encodePacked(
            "P2P Lending Deployment Information\n",
            "==================================\n",
            "Deployer: ", vm.toString(deployer), "\n",
            "Network: Sepolia (ChainID: ", vm.toString(block.chainid), ")\n",
            "CreditScore: ", vm.toString(address(creditScore)), "\n",
            "P2PLending: ", vm.toString(address(p2pLending)), "\n",
            "\nDemo Addresses and Credit Scores:\n"
        ));

        for (uint256 i = 0; i < demoAddresses.length; i++) {
            deploymentInfo = string(abi.encodePacked(
                deploymentInfo,
                vm.toString(demoAddresses[i]), 
                " : ", 
                vm.toString(demoScores[i]),
                "\n"
            ));
        }

        deploymentInfo = string(abi.encodePacked(
            deploymentInfo,
            "\nDemo Lender Offers Created:\n",
            "1. Conservative: 10 ETH max, 700+ score, 75% LTV, 4% interest, 90 days\n",
            "2. Aggressive: 25 ETH max, 650+ score, 80% LTV, 6% interest, 180 days\n",
            "3. Premium: 50 ETH max, 800+ score, 85% LTV, 3% interest, 365 days\n",
            "\nNext Steps:\n",
            "1. Test loan creation with: p2pLending.createLoanRequest{value: collateral}(loanAmount, duration)\n",
            "2. Test loan funding with: p2pLending.fundLoan{value: loanAmount}(loanId, offerId)\n",
            "3. Test loan repayment with: p2pLending.repayLoan{value: repaymentAmount}(loanId)\n"
        ));

        // Write to file
        vm.writeFile("deployment-info.txt", deploymentInfo);
        console.log("Deployment information saved to deployment-info.txt");
        
        // Also create a JSON file for frontend
        string memory jsonInfo = string(abi.encodePacked(
            "{\n",
            "  \"deployer\": \"", vm.toString(deployer), "\",\n",
            "  \"network\": \"sepolia\",\n",
            "  \"chainId\": ", vm.toString(block.chainid), ",\n",
            "  \"contracts\": {\n",
            "    \"creditScore\": \"", vm.toString(address(creditScore)), "\",\n",
            "    \"p2pLending\": \"", vm.toString(address(p2pLending)), "\"\n",
            "  },\n",
            "  \"demoUsers\": [\n"
        ));

        for (uint256 i = 0; i < demoAddresses.length; i++) {
            jsonInfo = string(abi.encodePacked(
                jsonInfo,
                "    {\n",
                "      \"address\": \"", vm.toString(demoAddresses[i]), "\",\n",
                "      \"creditScore\": ", vm.toString(demoScores[i]), "\n",
                "    }", i < demoAddresses.length - 1 ? "," : "", "\n"
            ));
        }

        jsonInfo = string(abi.encodePacked(
            jsonInfo,
            "  ]\n",
            "}\n"
        ));

        vm.writeFile("deployment-info.json", jsonInfo);
        console.log("JSON deployment information saved to deployment-info.json");
    }
}
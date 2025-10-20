// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {CreditScore} from "../src/CreditScore.sol";
import {P2PLending} from "../src/P2PLending.sol";

contract DeployCreditCupid is Script {
    function run() external {
        vm.startBroadcast();
        
        // Sepolia addresses
        address usdc = 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238; // Sepolia USDC
        address weth = 0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14; // Sepolia WETH
        
        // Deploy CreditScore contract first
        CreditScore creditScore = new CreditScore();
        
        // Deploy P2PLending with CreditScore contract address
        P2PLending p2pLending = new P2PLending(usdc, weth, address(creditScore));
        
        // Authorize P2PLending contract as an oracle in CreditScore
        creditScore.authorizeOracle(address(p2pLending), true);
        
        vm.stopBroadcast();
    }
}

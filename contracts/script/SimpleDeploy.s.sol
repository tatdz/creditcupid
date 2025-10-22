// script/SimpleDeploy.s.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {P2PLending} from "../src/P2PLending.sol";

contract SimpleDeploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying from:", deployer);
        console.log("Deployer balance:", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy P2PLending contract
        console.log("Deploying P2PLending contract...");
        P2PLending p2pLending = new P2PLending();
        console.log("P2PLending deployed at:", address(p2pLending));

        // Set credit score for deployer
        console.log("Setting credit score for deployer...");
        p2pLending.setCreditScore(deployer, 720);
        console.log("Set credit score 720 for deployer");

        vm.stopBroadcast();

        console.log("=== DEPLOYMENT COMPLETE ===");
        console.log("P2PLending:", address(p2pLending));
        console.log("Save this address for future use!");
    }
}
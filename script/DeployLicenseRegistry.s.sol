// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/LicenseRegistry.sol";

/**
 * @title DeployLicenseRegistry
 * @notice Foundry deployment script for LicenseRegistry on Base (chain 8453).
 * Constructor argument is the NEAR Chain Signatures MPC derived relayer address (path ethereum-1).
 *
 * Usage with environment variable:
 *   RELAYER_ADDRESS=0x... forge script script/DeployLicenseRegistry.s.sol:DeployLicenseRegistry \
 *     --rpc-url https://mainnet.base.org \
 *     --broadcast
 *
 * Dry-run against Base fork:
 *   RELAYER_ADDRESS=0xEF4Ea05e5c11057DeCC8E1bd6F5369f2acD91fA5 forge script script/DeployLicenseRegistry.s.sol:DeployLicenseRegistry \
 *     --fork-url https://mainnet.base.org
 */
contract DeployLicenseRegistry is Script {
    function run() external returns (LicenseRegistry registry) {
        address relayer = vm.envAddress("RELAYER_ADDRESS");
        return _deploy(relayer);
    }

    function runWithRelayer(address relayer) external returns (LicenseRegistry registry) {
        return _deploy(relayer);
    }

    function _deploy(address relayer) internal returns (LicenseRegistry registry) {
        require(relayer != address(0), "RELAYER_ADDRESS cannot be address(0)");

        console.log("--- Deploying LicenseRegistry to Base ---");
        console.log("Chain ID:", block.chainid);
        console.log("MPC Relayer Address (Constructor Arg):", relayer);

        vm.startBroadcast();
        registry = new LicenseRegistry(relayer);
        vm.stopBroadcast();

        console.log("LicenseRegistry deployed successfully at:", address(registry));
        console.log("Immutable relayer verified:", registry.relayer());
    }
}
